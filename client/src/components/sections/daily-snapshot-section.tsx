import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Target, 
  BarChart3,
  FileText,
  Image as ImageIcon,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import type { Trade, PremarketAnalysis, TradeAnalysis, IntradayNote } from "@shared/schema";

export default function DailySnapshotSection() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch all data for the selected date
  const { data: trades = [] } = useQuery<Trade[]>({
    queryKey: ['/api/trades'],
  });

  const { data: premarketAnalyses = [] } = useQuery<PremarketAnalysis[]>({
    queryKey: ['/api/premarket-analysis'],
  });

  const { data: tradeAnalyses = [] } = useQuery<TradeAnalysis[]>({
    queryKey: ['/api/trade-analysis'],
  });

  const { data: intradayNotes = [] } = useQuery<IntradayNote[]>({
    queryKey: ['/api/intraday-notes'],
  });

  // Filter data by selected date with error handling
  const dateString = selectedDate.toDateString();
  
  const tradesOnDate = trades.filter(trade => {
    try {
      if (!trade.tradeDate) return false;
      const tradeDate = new Date(trade.tradeDate);
      return tradeDate.toDateString() === dateString;
    } catch {
      return false;
    }
  });

  const premarketOnDate = premarketAnalyses.find(analysis => {
    try {
      if (!analysis.date) return false;
      const analysisDate = new Date(analysis.date);
      return analysisDate.toDateString() === dateString;
    } catch {
      return false;
    }
  });

  const analysesOnDate = tradeAnalyses.filter(analysis => {
    try {
      const trade = trades.find(t => t.id === analysis.tradeId);
      if (!trade || !trade.entryTime) return false;
      const tradeDate = new Date(trade.entryTime);
      return tradeDate.toDateString() === dateString;
    } catch {
      return false;
    }
  });

  const notesOnDate = intradayNotes.filter(note => {
    try {
      if (!note.time) return false;
      const noteDate = new Date(note.time);
      return noteDate.toDateString() === dateString;
    } catch {
      return false;
    }
  });

  // Calculate daily stats
  const dailyPnL = tradesOnDate.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const winningTrades = tradesOnDate.filter(trade => (trade.pnl || 0) > 0).length;
  const losingTrades = tradesOnDate.filter(trade => (trade.pnl || 0) < 0).length;
  const winRate = tradesOnDate.length > 0 ? (winningTrades / tradesOnDate.length) * 100 : 0;

  // Check if there's any data for the selected date
  const hasAnyData = tradesOnDate.length > 0 || premarketOnDate || analysesOnDate.length > 0 || notesOnDate.length > 0;

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Daily Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <div className="flex gap-2 text-sm text-muted-foreground">
              <Badge variant={dailyPnL >= 0 ? "default" : "destructive"}>
                {dailyPnL >= 0 ? '+' : ''}${dailyPnL.toFixed(2)} P&L
              </Badge>
              <Badge variant="secondary">
                {tradesOnDate.length} trades
              </Badge>
              <Badge variant="outline">
                {winRate.toFixed(1)}% win rate
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty state when no data exists for the selected date */}
      {!hasAnyData && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Day Not Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  No trading activity, premarket analysis, or notes found for {format(selectedDate, "MMMM d, yyyy")}. 
                  Select a different date or add some data for this day.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Overview Stats - only show if there's data */}
      {hasAnyData && (
      <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className={`w-5 h-5 ${dailyPnL >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              <div>
                <p className="text-2xl font-bold">{dailyPnL >= 0 ? '+' : ''}${dailyPnL.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Daily P&L</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{tradesOnDate.length}</p>
                <p className="text-xs text-muted-foreground">Total Trades</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{winningTrades}</p>
                <p className="text-xs text-muted-foreground">Winners</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{losingTrades}</p>
                <p className="text-xs text-muted-foreground">Losers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premarket Analysis Summary */}
      {premarketOnDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Premarket Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Market Bias</h4>
                <Badge variant="outline">{premarketOnDate.bias || 'Not specified'}</Badge>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">VIX Level</h4>
                <p className="text-sm">{premarketOnDate.vixValue || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Expected Volatility</h4>
                <p className="text-sm">{premarketOnDate.expectedVolatility || 'N/A'}%</p>
              </div>
            </div>
            
            {premarketOnDate.climateNotes && (
              <div className="space-y-2">
                <h4 className="font-medium">Market Climate</h4>
                <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded border">
                  {premarketOnDate.climateNotes}
                </p>
              </div>
            )}

            {premarketOnDate.tradeIdea1 && (
              <div className="space-y-2">
                <h4 className="font-medium">Trade Ideas</h4>
                <div className="space-y-2">
                  <p className="text-sm p-3 bg-muted/30 rounded border">{premarketOnDate.tradeIdea1}</p>
                  {premarketOnDate.tradeIdea2 && (
                    <p className="text-sm p-3 bg-muted/30 rounded border">{premarketOnDate.tradeIdea2}</p>
                  )}
                  {premarketOnDate.tradeIdea3 && (
                    <p className="text-sm p-3 bg-muted/30 rounded border">{premarketOnDate.tradeIdea3}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trades Summary */}
      {tradesOnDate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Trades Executed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tradesOnDate.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Badge variant={trade.type === 'calls' ? 'default' : 'secondary'}>
                      {trade.ticker} {trade.type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {trade.quantity} contracts @ ${trade.strikePrice}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Entry: ${trade.entryPrice}
                    </span>
                    {trade.exitPrice && (
                      <span className="text-sm text-muted-foreground">
                        Exit: ${trade.exitPrice}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={(trade.pnl ?? 0) >= 0 ? "default" : "destructive"}>
                      {trade.pnl !== null ? `${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}` : 'Pending'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(trade.entryTime), 'h:mm a')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trade Analysis Summary */}
      {analysesOnDate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Trade Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysesOnDate.map((analysis) => {
                const trade = trades.find(t => t.id === analysis.tradeId);
                return (
                  <div key={analysis.id} className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        Trade #{trade?.id} - {trade?.ticker}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <h5 className="font-medium mb-1">What Went Well</h5>
                        <p className="text-muted-foreground">{analysis.whatWentWell}</p>
                      </div>
                      <div>
                        <h5 className="font-medium mb-1">What To Improve</h5>
                        <p className="text-muted-foreground">{analysis.whatToImprove}</p>
                      </div>
                      <div>
                        <h5 className="font-medium mb-1">Next Time</h5>
                        <p className="text-muted-foreground">{analysis.nextTime}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Intraday Notes */}
      {notesOnDate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Intraday Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notesOnDate.map((note) => (
                <div key={note.id} className="flex items-start space-x-3 p-3 bg-muted/30 rounded border">
                  <div className="text-sm text-muted-foreground min-w-[60px]">
                    {format(new Date(note.time), 'h:mm a')}
                  </div>
                  <p className="text-sm flex-1">{note.note}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      </div>
      )} {/* Close the hasAnyData conditional block */}
    </div>
  );
}