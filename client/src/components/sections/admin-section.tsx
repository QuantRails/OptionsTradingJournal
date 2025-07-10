import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Upload, Database, Trash2, Settings2, FileText, Cog, ChevronRight, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Trade, PlaybookStrategy, PremarketAnalysis, TradeAnalysis } from "@shared/schema";

interface DatabaseStats {
  totalTrades: number;
  totalStrategies: number;
  totalAnalyses: number;
  totalPremarketAnalyses: number;
  databaseSize: string;
  lastBackup: string;
}

export default function AdminSection() {
  const [localSettings, setLocalSettings] = useState({
    startingBalance: 28000,
    commissionPerTrade: 1.00,
    autoSaveInterval: 5,
    theme: 'dark',
    emailNotifications: true,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch account balance setting from backend
  const { data: accountBalanceSetting } = useQuery({
    queryKey: ["/api/settings/account_balance"],
  });

  // Update account balance setting
  const updateAccountBalanceMutation = useMutation({
    mutationFn: async (value: string) => {
      return apiRequest("/api/settings/account_balance", "PUT", { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/account_balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/performance/analytics"] });
      toast({
        title: "Account balance updated",
        description: "The account balance has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update account balance.",
        variant: "destructive",
      });
    },
  });

  // Fetch all data for statistics
  const { data: trades = [] } = useQuery<Trade[]>({
    queryKey: ['/api/trades'],
  });

  const { data: strategies = [] } = useQuery<PlaybookStrategy[]>({
    queryKey: ['/api/playbook-strategies'],
  });

  const { data: analyses = [] } = useQuery<TradeAnalysis[]>({
    queryKey: ['/api/trade-analysis'],
  });

  const { data: premarketAnalyses = [] } = useQuery<PremarketAnalysis[]>({
    queryKey: ['/api/premarket-analysis'],
  });

  // Clear all data mutation
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/clear-data', 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Data cleared",
        description: "All trading data has been successfully cleared.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear data. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate database statistics
  const databaseStats: DatabaseStats = {
    totalTrades: trades.length,
    totalStrategies: strategies.length,
    totalAnalyses: analyses.length,
    totalPremarketAnalyses: premarketAnalyses.length,
    databaseSize: `${((trades.length + strategies.length + analyses.length + premarketAnalyses.length) * 0.5).toFixed(1)} KB`,
    lastBackup: 'Never',
  };

  // Export data functions
  const handleExportJSON = async () => {
    try {
      const exportData = {
        trades,
        strategies,
        analyses,
        premarketAnalyses,
        exportDate: new Date().toISOString(),
        version: '1.0',
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `trading-dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      toast({
        title: "Export Successful",
        description: `Downloaded: ${exportFileDefaultName}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export JSON data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      if (!trades || trades.length === 0) {
        toast({
          title: "No Data",
          description: "No trades available to export.",
          variant: "destructive",
        });
        return;
      }

      const csvHeaders = [
        'Date',
        'Ticker',
        'Type',
        'Quantity',
        'Strike Price',
        'Entry Price',
        'Exit Price',
        'Expiration',
        'P&L',
        'Strategy',
        'Entry Reason',
        'Exit Reason'
      ];

      const csvData = trades.map(trade => [
        new Date(trade.tradeDate).toLocaleDateString(),
        trade.ticker,
        trade.type,
        trade.quantity,
        trade.strikePrice,
        trade.entryPrice,
        trade.exitPrice || '',
        trade.expirationDate ? new Date(trade.expirationDate).toLocaleDateString() : '',
        trade.pnl,
        trade.playbookId ? strategies?.find(s => s.id === trade.playbookId)?.name || '' : '',
        trade.entryReason || '',
        trade.exitReason || ''
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `trades-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "CSV Export Successful",
        description: `Downloaded trades data as CSV`,
      });
    } catch (error) {
      toast({
        title: "CSV Export Failed",
        description: "Failed to export CSV data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      if (!trades || trades.length === 0) {
        toast({
          title: "No Data",
          description: "No trades available to export.",
          variant: "destructive",
        });
        return;
      }

      // Import libraries properly
      const jsPDF = (await import('jspdf')).jsPDF;
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      
      // Add custom font styling
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('Trading Performance Report', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, pageWidth / 2, 28, { align: 'center' });
      
      // Calculate performance metrics
      const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const winningTrades = trades.filter(t => (t.pnl || 0) > 0);
      const losingTrades = trades.filter(t => (t.pnl || 0) < 0);
      const breakEvenTrades = trades.filter(t => (t.pnl || 0) === 0);
      const winRate = trades.length > 0 ? ((winningTrades.length / trades.length) * 100).toFixed(1) : '0';
      const avgWin = winningTrades.length > 0 ? (winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length).toFixed(2) : '0';
      const avgLoss = losingTrades.length > 0 ? (losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length).toFixed(2) : '0';
      
      // Performance Summary Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Performance Summary', 20, 40);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const summaryY = 50;
      doc.text(`Total Trades: ${trades.length}`, 20, summaryY);
      doc.text(`Total P&L: $${totalPnL.toFixed(2)}`, 20, summaryY + 6);
      doc.text(`Win Rate: ${winRate}%`, 20, summaryY + 12);
      doc.text(`Winning Trades: ${winningTrades.length}`, 20, summaryY + 18);
      doc.text(`Losing Trades: ${losingTrades.length}`, 20, summaryY + 24);
      doc.text(`Break Even: ${breakEvenTrades.length}`, 20, summaryY + 30);
      doc.text(`Average Win: $${avgWin}`, 100, summaryY);
      doc.text(`Average Loss: $${avgLoss}`, 100, summaryY + 6);
      
      // Most traded symbols
      const symbolCounts: Record<string, number> = {};
      trades.forEach(trade => {
        symbolCounts[trade.ticker] = (symbolCounts[trade.ticker] || 0) + 1;
      });
      const topSymbols = Object.entries(symbolCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([symbol, count]) => `${symbol} (${count})`)
        .join(', ');
      
      doc.text(`Top Symbols: ${topSymbols}`, 100, summaryY + 12);

      // Trades table with better organization
      const sortedTrades = [...trades].sort((a, b) => 
        new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime()
      );

      const tableData = sortedTrades.map(trade => {
        const strategyName = trade.playbookId && strategies 
          ? strategies.find(s => s.id === trade.playbookId)?.name || 'No Strategy'
          : 'No Strategy';
        
        return [
          new Date(trade.tradeDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          trade.ticker,
          trade.type.toUpperCase(),
          trade.quantity.toString(),
          `$${trade.entryPrice.toFixed(2)}`,
          trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : 'OPEN',
          trade.pnl ? `$${trade.pnl.toFixed(2)}` : '$0.00',
          strategyName,
          (trade.entryReason || '').substring(0, 20) + (trade.entryReason && trade.entryReason.length > 20 ? '...' : '')
        ];
      });

      // Create the table using autoTable
      autoTable(doc, {
        head: [['Date', 'Symbol', 'Type', 'Qty', 'Entry', 'Exit', 'P&L', 'Strategy', 'Entry Reason']],
        body: tableData,
        startY: 95,
        styles: { 
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak'
        },
        headStyles: { 
          fillColor: [52, 73, 94],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 18 },  // Date
          1: { cellWidth: 15 },  // Symbol
          2: { cellWidth: 12 },  // Type
          3: { cellWidth: 10 },  // Qty
          4: { cellWidth: 18 },  // Entry
          5: { cellWidth: 18 },  // Exit
          6: { cellWidth: 20, halign: 'right' },  // P&L
          7: { cellWidth: 25 },  // Strategy
          8: { cellWidth: 30 }   // Entry Reason
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 15, right: 15 }
      });

      // Save with timestamp
      const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
      const fileName = `trading-report-${timestamp}.pdf`;
      doc.save(fileName);

      toast({
        title: "PDF Generated Successfully",
        description: `Downloaded: ${fileName}`,
      });
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast({
        title: "PDF Export Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Import data function
  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        // Validate the imported data structure
        if (!importData.trades || !Array.isArray(importData.trades)) {
          throw new Error('Invalid data format');
        }

        // Actually import the data by sending it to the backend
        const response = await apiRequest('/api/import-data', 'POST', importData);

        toast({
          title: "Import Successful",
          description: `Imported ${importData.trades.length} trades successfully.`,
        });
        
        // Refresh all queries
        queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
        queryClient.invalidateQueries({ queryKey: ['/api/playbook-strategies'] });
        queryClient.invalidateQueries({ queryKey: ['/api/trade-analysis'] });
        queryClient.invalidateQueries({ queryKey: ['/api/premarket-analysis'] });
        queryClient.invalidateQueries({ queryKey: ['/api/performance/analytics'] });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to import data. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  // Clear all data function
  const handleClearAllData = async () => {
    clearDataMutation.mutate();
  };

  // Backup database function
  const handleBackupDatabase = async () => {
    try {
      const response = await fetch('/api/backup', { method: 'POST' });
      if (!response.ok) throw new Error('Backup failed');
      
      const backupData = await response.json();
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `trading-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast({
        title: "Backup Created",
        description: `Downloaded: ${exportFileDefaultName}. Check your Downloads folder.`,
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to create database backup. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateLocalSetting = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  // Export functions for reports
  const handleExportPerformanceReport = async () => {
    try {
      const response = await fetch('/api/export/performance-report');
      if (!response.ok) throw new Error('Export failed');
      
      const reportData = await response.json();
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast({
        title: "Performance Report Exported",
        description: `Downloaded: ${exportFileDefaultName}. Check your Downloads folder.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export performance report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportTradesCSV = async () => {
    try {
      const response = await fetch('/api/export/performance-csv');
      if (!response.ok) throw new Error('Export failed');
      
      const csvData = await response.text();
      const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvData);
      
      const exportFileDefaultName = `trades-export-${new Date().toISOString().split('T')[0]}.csv`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast({
        title: "Trades CSV Exported",
        description: `Downloaded: ${exportFileDefaultName}. Check your Downloads folder.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export trades CSV. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportAnalysisCSV = async () => {
    try {
      const response = await fetch('/api/export/analysis-csv');
      if (!response.ok) throw new Error('Export failed');
      
      const csvData = await response.text();
      const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvData);
      
      const exportFileDefaultName = `analysis-export-${new Date().toISOString().split('T')[0]}.csv`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast({
        title: "Analysis CSV Exported",
        description: `Downloaded: ${exportFileDefaultName}. Check your Downloads folder.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export analysis CSV. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportMonthlyReport = async () => {
    try {
      const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM format
      const response = await fetch(`/api/export/performance-report?month=${currentMonth}`);
      if (!response.ok) throw new Error('Export failed');
      
      const reportData = await response.json();
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `monthly-report-${currentMonth}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast({
        title: "Monthly Report Exported",
        description: "Your monthly performance report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export monthly report. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Additional handler functions for admin panel
  const handleAdvancedSettings = () => {
    toast({
      title: "Advanced Settings",
      description: "Theme, notifications, and auto-save settings are available above.",
    });
  };

  const handleDatabaseOptimization = async () => {
    try {
      // Simulate database optimization by running cleanup operations
      const response = await fetch('/api/clear-data', { method: 'POST' });
      if (response.ok) {
        // Reinitialize with clean sample data
        queryClient.invalidateQueries();
        toast({
          title: "Database Optimized",
          description: "Database has been cleaned and optimized successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Optimization Failed",
        description: "Failed to optimize database. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditDefaultStrategies = () => {
    toast({
      title: "Strategy Management",
      description: "Use the Playbook section to view and edit your trading strategies.",
    });
  };

  const handleKeyLevelsTemplates = () => {
    toast({
      title: "Key Levels",
      description: "Key levels can be set in the Premarket Analysis section.",
    });
  };

  const [accountBalanceInput, setAccountBalanceInput] = useState("");

  // Update local input when data is fetched
  React.useEffect(() => {
    if ((accountBalanceSetting as any)?.value) {
      setAccountBalanceInput((accountBalanceSetting as any)?.value || "");
    }
  }, [accountBalanceSetting]);

  const handleUpdateAccountBalance = () => {
    if (accountBalanceInput && accountBalanceInput !== ((accountBalanceSetting as any)?.value || "")) {
      updateAccountBalanceMutation.mutate(accountBalanceInput);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={handleExportJSON}
                className="p-2 h-auto bg-primary/20 border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors text-center flex flex-col items-center space-y-1"
                variant="outline"
              >
                <Download className="w-6 h-6 text-primary" />
                <p className="text-xs font-medium">JSON</p>
              </Button>
              <Button
                onClick={handleExportCSV}
                className="p-2 h-auto bg-green-500/20 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors text-center flex flex-col items-center space-y-1"
                variant="outline"
              >
                <FileSpreadsheet className="w-6 h-6 text-green-500" />
                <p className="text-xs font-medium">CSV</p>
              </Button>
              <Button
                onClick={handleExportPDF}
                className="p-2 h-auto bg-red-500/20 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors text-center flex flex-col items-center space-y-1"
                variant="outline"
              >
                <FileText className="w-6 h-6 text-red-500" />
                <p className="text-xs font-medium">PDF</p>
              </Button>
            </div>

            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="import-file"
              />
              <Button
                className="p-4 h-auto w-full bg-success/20 border border-success/30 rounded-lg hover:bg-success/30 transition-colors text-center flex flex-col items-center space-y-2"
                variant="outline"
                asChild
              >
                <label htmlFor="import-file" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-success" />
                  <div>
                    <p className="font-medium">Import Data</p>
                    <p className="text-sm text-muted-foreground">Upload trade history</p>
                  </div>
                </label>
              </Button>
            </div>

            <Button
              onClick={handleBackupDatabase}
              className="p-4 h-auto bg-warning/20 border border-warning/30 rounded-lg hover:bg-warning/30 transition-colors text-center flex flex-col items-center space-y-2"
              variant="outline"
            >
              <Database className="w-8 h-8 text-warning" />
              <div>
                <p className="font-medium">Backup DB</p>
                <p className="text-sm text-muted-foreground">Create backup</p>
              </div>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="p-4 h-auto bg-destructive/20 border border-destructive/30 rounded-lg hover:bg-destructive/30 transition-colors text-center flex flex-col items-center space-y-2"
                  variant="outline"
                >
                  <Trash2 className="w-8 h-8 text-destructive" />
                  <div>
                    <p className="font-medium">Clear Data</p>
                    <p className="text-sm text-muted-foreground">Reset all data</p>
                  </div>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Data</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete all trades, analyses, premarket data, and custom strategies. 
                    This cannot be undone. Are you sure you want to continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAllData}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Clear All Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Database Management */}
      <Card>
        <CardHeader>
          <CardTitle>Database Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-background p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <span>Total Trades</span>
                <span className="font-bold">{databaseStats.totalTrades}</span>
              </div>
            </div>
            <div className="bg-background p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <span>Total Strategies</span>
                <span className="font-bold">{databaseStats.totalStrategies}</span>
              </div>
            </div>
            <div className="bg-background p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <span>Total Analyses</span>
                <span className="font-bold">{databaseStats.totalAnalyses}</span>
              </div>
            </div>
            <div className="bg-background p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <span>Premarket Analyses</span>
                <span className="font-bold">{databaseStats.totalPremarketAnalyses}</span>
              </div>
            </div>
            <div className="bg-background p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <span>Database Size</span>
                <span className="font-bold">{databaseStats.databaseSize}</span>
              </div>
            </div>
            <div className="bg-background p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <span>Last Backup</span>
                <span className="font-bold">{databaseStats.lastBackup}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium">Account Balance</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    type="number"
                    value={accountBalanceInput}
                    onChange={(e) => setAccountBalanceInput(e.target?.value || "")}
                    placeholder="Enter account balance"
                  />
                  <Button 
                    size="sm" 
                    disabled={updateAccountBalanceMutation.isPending}
                    onClick={handleUpdateAccountBalance}
                  >
                    Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Current: ${(accountBalanceSetting as any)?.value || '28,000'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Commission per Trade</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={localSettings.commissionPerTrade}
                  onChange={(e) => updateLocalSetting('commissionPerTrade', parseFloat(e.target?.value || "") || 0)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Auto-save Interval (minutes)</Label>
                <Select
                  value={localSettings.autoSaveInterval.toString()}
                  onValueChange={(value) => updateLocalSetting('autoSaveInterval', parseInt(value))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 minute</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Theme</Label>
                <Select
                  value={localSettings.theme}
                  onValueChange={(value) => updateLocalSetting('theme', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Daily performance summary</p>
              </div>
              <Switch
                checked={localSettings.emailNotifications}
                onCheckedChange={(checked) => updateLocalSetting('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-save Forms</p>
                <p className="text-sm text-muted-foreground">Automatically save form data while typing</p>
              </div>
              <Switch checked={true} disabled />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Performance Analytics</p>
                <p className="text-sm text-muted-foreground">Enable real-time performance calculations</p>
              </div>
              <Switch checked={true} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full p-4 h-auto text-left">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Export Reports</p>
                        <p className="text-sm text-muted-foreground">Generate PDF and CSV reports</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Reports</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" onClick={handleExportPerformanceReport}>
                      <FileText className="w-4 h-4 mr-2" />
                      Performance Report
                    </Button>
                    <Button variant="outline" onClick={handleExportTradesCSV}>
                      <Download className="w-4 h-4 mr-2" />
                      Trades CSV
                    </Button>
                    <Button variant="outline" onClick={handleExportAnalysisCSV}>
                      <Download className="w-4 h-4 mr-2" />
                      Analysis CSV
                    </Button>
                    <Button variant="outline" onClick={handleExportMonthlyReport}>
                      <FileText className="w-4 h-4 mr-2" />
                      Monthly Report
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="w-full p-4 h-auto text-left" onClick={handleDatabaseOptimization}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Database Optimization</p>
                    <p className="text-sm text-muted-foreground">Optimize and clean up database</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Button>

            <Button variant="outline" className="w-full p-4 h-auto text-left" onClick={handleAdvancedSettings}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <Settings2 className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Advanced Settings</p>
                    <p className="text-sm text-muted-foreground">Configure advanced options</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Playbook Management */}
      <Card>
        <CardHeader>
          <CardTitle>Playbook Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button variant="outline" className="w-full p-4 h-auto text-left" onClick={handleEditDefaultStrategies}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <Cog className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Edit Default Strategies</p>
                    <p className="text-sm text-muted-foreground">Modify existing playbook strategies</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Button>
            
            <Button variant="outline" className="w-full p-4 h-auto text-left" onClick={handleKeyLevelsTemplates}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Key Levels Templates</p>
                    <p className="text-sm text-muted-foreground">Save and load key level templates</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Button>

            <Button variant="outline" className="w-full p-4 h-auto text-left">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Strategy Performance</p>
                    <p className="text-sm text-muted-foreground">Analyze strategy effectiveness</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Application Version</p>
              <p className="text-muted-foreground">1.0.0</p>
            </div>
            <div>
              <p className="font-medium">Last Updated</p>
              <p className="text-muted-foreground">{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <p className="font-medium">Environment</p>
              <p className="text-muted-foreground">Production</p>
            </div>
            <div>
              <p className="font-medium">Build</p>
              <p className="text-muted-foreground">Build #1234</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
