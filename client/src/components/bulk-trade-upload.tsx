import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

interface ParsedTrade {
  ticker: string;
  type: 'calls' | 'puts';
  quantity: number;
  strikePrice: number;
  entryPrice: number;
  exitPrice: number;
  expirationDate: string;
  tradeDate: string;
  pnl: number;
  symbol: string; // Original E*TRADE symbol
}

interface BulkTradeUploadProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkTradeUpload({ onClose, onSuccess }: BulkTradeUploadProps) {
  const [parsedTrades, setParsedTrades] = useState<ParsedTrade[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Parse E*TRADE symbol format: -SPY250703C618
  const parseSymbol = (symbol: string) => {
    // Remove leading dash if present
    const cleanSymbol = symbol.startsWith('-') ? symbol.substring(1) : symbol;
    
    // Match pattern: TICKER + YYMMDD + C/P + STRIKE
    const match = cleanSymbol.match(/^([A-Z]+)(\d{6})([CP])(\d+)$/);
    
    if (!match) {
      throw new Error(`Invalid symbol format: ${symbol}`);
    }
    
    const [, ticker, dateStr, optionType, strikeStr] = match;
    
    // Parse date: YYMMDD
    const year = 2000 + parseInt(dateStr.substring(0, 2));
    const month = parseInt(dateStr.substring(2, 4)) - 1; // Month is 0-indexed
    const day = parseInt(dateStr.substring(4, 6));
    const expirationDate = new Date(year, month, day);
    
    // Parse strike price (divide by 1000 for standard format)
    const strikePrice = parseInt(strikeStr) / 1000;
    
    return {
      ticker,
      type: optionType === 'C' ? 'calls' as const : 'puts' as const,
      strikePrice,
      expirationDate: expirationDate.toISOString().split('T')[0]
    };
  };

  // Parse CSV content
  const parseCSV = (content: string): ParsedTrade[] => {
    const lines = content.split('\n').filter(line => line.trim());
    const trades: ParsedTrade[] = [];
    
    // Find the header row and data rows
    let dataStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Symbol') && lines[i].includes('Basis/Share') && lines[i].includes('Proceeds/Share')) {
        dataStartIndex = i + 1;
        break;
      }
    }
    
    if (dataStartIndex === -1) {
      throw new Error('Could not find data header row. Please ensure the CSV includes Symbol, Basis/Share, Proceeds/Share columns.');
    }
    
    for (let i = dataStartIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('TOTALS')) continue;
      
      // Split by tabs or commas, handling quoted values
      const columns = line.split(/\t|,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
        .map(col => col.replace(/"/g, '').trim());
      
      if (columns.length < 8) continue; // Need at least symbol, basis, proceeds, quantity
      
      try {
        const symbol = columns[0];
        const basisStr = columns[1];
        const proceedsStr = columns[2];
        const quantityStr = columns[7]; // Quantity column
        
        // Skip if not a valid options symbol
        if (!symbol.match(/^-?[A-Z]+\d{6}[CP]\d+$/)) continue;
        
        const symbolData = parseSymbol(symbol);
        const entryPrice = parseFloat(basisStr);
        const exitPrice = parseFloat(proceedsStr);
        const quantity = parseInt(quantityStr);
        const pnl = (exitPrice - entryPrice) * quantity * 100; // Options multiplier
        
        // Use today's date as trade date (can be edited later)
        const today = new Date();
        const tradeDate = today.toISOString().split('T')[0];
        
        trades.push({
          ...symbolData,
          entryPrice,
          exitPrice,
          quantity,
          pnl,
          tradeDate,
          symbol
        });
      } catch (error) {
        console.warn(`Skipping invalid row: ${line}`, error);
      }
    }
    
    return trades;
  };

  // File drop handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const trades = parseCSV(content);
        
        if (trades.length === 0) {
          toast({
            title: "No Trades Found",
            description: "No valid options trades found in the uploaded file.",
            variant: "destructive",
          });
          return;
        }
        
        setParsedTrades(trades);
        toast({
          title: "File Parsed Successfully",
          description: `Found ${trades.length} trades ready for upload.`,
        });
      } catch (error) {
        toast({
          title: "Parse Error",
          description: error instanceof Error ? error.message : "Failed to parse file.",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
    },
    multiple: false,
  });

  // Upload trades mutation
  const uploadTradesMutation = useMutation({
    mutationFn: async (trades: ParsedTrade[]) => {
      const results = [];
      setIsUploading(true);
      setUploadProgress(0);
      
      for (let i = 0; i < trades.length; i++) {
        const trade = trades[i];
        try {
          // Parse selected date properly to avoid timezone shifts
          const [year, month, day] = selectedDate.split('-').map(Number);
          const tradeDate = new Date(year, month - 1, day); // month is 0-indexed
          const entryTime = new Date(year, month - 1, day, 9, 30, 0); // 9:30 AM CST
          const exitTime = new Date(year, month - 1, day, 10, 0, 0); // 10:00 AM CST
          
          const result = await apiRequest('/api/trades', 'POST', {
            ticker: trade.ticker,
            type: trade.type,
            quantity: trade.quantity,
            strikePrice: trade.strikePrice,
            entryPrice: trade.entryPrice,
            exitPrice: trade.exitPrice,
            entryTime: entryTime,
            exitTime: exitTime,
            expirationDate: new Date(trade.expirationDate),
            tradeDate: tradeDate,
            pnl: trade.pnl,
            entryReason: `Imported from E*TRADE (${trade.symbol})`,
            exitReason: "Imported trade",
            playbookId: 1, // Default to first strategy, user can edit later
          });
          results.push({ success: true, trade, result });
        } catch (error) {
          results.push({ success: false, trade, error });
        }
        
        setUploadProgress(((i + 1) / trades.length) * 100);
      }
      
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/performance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/performance/analytics'] });
      
      toast({
        title: "Upload Complete",
        description: `${successful} trades uploaded successfully${failed > 0 ? `, ${failed} failed` : ''}.`,
      });
      
      if (successful > 0) {
        onSuccess();
      }
      
      setIsUploading(false);
      setUploadProgress(0);
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload trades. Please try again.",
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  const handleUpload = () => {
    if (parsedTrades.length === 0) return;
    uploadTradesMutation.mutate(parsedTrades);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Bulk Trade Upload - E*TRADE Format
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Selection */}
        <div className="space-y-2">
          <Label htmlFor="trade-date">Trade Date</Label>
          <Input
            id="trade-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full"
          />
          <p className="text-sm text-gray-600">
            All imported trades will be assigned to this date
          </p>
        </div>

        {/* File Upload Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">
            {isDragActive ? 'Drop the file here' : 'Drag & drop your E*TRADE CSV file here'}
          </p>
          <p className="text-sm text-muted-foreground">
            Supports CSV exports from E*TRADE with options trades
          </p>
        </div>

        {/* Format Info */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Expected Format
          </h4>
          <p className="text-sm mb-2">
            E*TRADE CSV with columns: Symbol, Basis/Share, Proceeds/Share, Quantity
          </p>
          <div className="text-xs text-muted-foreground">
            <p>Symbol format: -SPY250703C618 (Ticker + Date + Call/Put + Strike)</p>
            <p>Basis/Share: Entry price per share</p>
            <p>Proceeds/Share: Exit price per share</p>
          </div>
        </div>

        {/* Parsed Trades Preview */}
        {parsedTrades.length > 0 && (
          <div>
            <h4 className="font-semibold mb-4">
              Parsed Trades ({parsedTrades.length})
            </h4>
            <div className="max-h-64 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Symbol</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-left">Strike</th>
                    <th className="p-2 text-left">Qty</th>
                    <th className="p-2 text-left">Entry</th>
                    <th className="p-2 text-left">Exit</th>
                    <th className="p-2 text-left">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedTrades.map((trade, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">{trade.ticker}</td>
                      <td className="p-2">
                        <Badge variant={trade.type === 'calls' ? 'default' : 'secondary'}>
                          {trade.type}
                        </Badge>
                      </td>
                      <td className="p-2">${trade.strikePrice}</td>
                      <td className="p-2">{trade.quantity}</td>
                      <td className="p-2">${trade.entryPrice.toFixed(2)}</td>
                      <td className="p-2">${trade.exitPrice.toFixed(2)}</td>
                      <td className={`p-2 ${trade.pnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${trade.pnl.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Uploading trades...</span>
              <span className="text-sm text-muted-foreground">{uploadProgress.toFixed(0)}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {parsedTrades.length > 0 && (
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? 'Uploading...' : `Upload ${parsedTrades.length} Trades`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}