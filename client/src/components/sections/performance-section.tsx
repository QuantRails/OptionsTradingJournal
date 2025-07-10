import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Percent, TrendingUp, BarChart3 } from "lucide-react";
import {
  EquityCurveChart,
  DailyPnLChart,
  WinRateChart,
  SymbolPerformanceChart,
  TimeClassificationChart,
  RiskRewardScatterChart,
  PnLDistributionChart,
  StreakChart,
} from "@/components/charts/performance-charts";
import { DailyPerformanceCalendar } from "@/components/charts/daily-performance-calendar";
import { calculateDrawdown, calculateSharpeRatio, getStreakAnalysis } from "@/lib/trade-calculations";
import type { Trade } from "@shared/schema";

interface PerformanceData {
  totalPnL: number;
  winRate: number;
  avgRR: number;
  totalTrades: number;
  symbolPerformance: Record<string, number>;
  timePerformance: Record<string, number>;
  dailyPnL: Record<string, number>;
  trades: Trade[];
}

interface PerformanceSectionProps {
  onNavigateToAnalysis?: (date: Date) => void;
}

export default function PerformanceSection({ onNavigateToAnalysis }: PerformanceSectionProps = {}) {
  // Fetch performance analytics
  const { data: performanceData, isLoading } = useQuery<PerformanceData>({
    queryKey: ['/api/performance/analytics'],
  });

  // Fetch all trades for additional calculations
  const { data: allTrades = [] } = useQuery<Trade[]>({
    queryKey: ['/api/trades'],
  });

  const analytics = useMemo(() => {
    if (!performanceData || !allTrades.length) {
      return {
        completedTrades: [],
        equityCurve: [],
        drawdown: { maxDrawdown: 0, maxDrawdownPercent: 0, currentDrawdown: 0 },
        sharpeRatio: 0,
        streakAnalysis: { currentStreak: 0, maxWinStreak: 0, maxLossStreak: 0, streaks: [] },
        pnlDistribution: {},
        riskRewardData: [],
        monthlyCalendar: {},
      };
    }

    const completedTrades = allTrades.filter(trade => trade.pnl !== null);
    
    // Calculate equity curve
    let balance = 28000; // Starting balance
    const equityCurve = [{ date: new Date().toISOString(), balance }];
    
    completedTrades.forEach(trade => {
      if (trade.exitTime) {
        balance += trade.pnl || 0;
        equityCurve.push({
          date: trade.exitTime.toString(),
          balance
        });
      }
    });

    // Calculate drawdown
    const balanceHistory = equityCurve.map(point => point.balance);
    const drawdown = calculateDrawdown(balanceHistory);

    // Calculate Sharpe ratio
    const dailyReturns = Object.values(performanceData.dailyPnL).map(pnl => pnl / 28000);
    const sharpeRatio = calculateSharpeRatio(dailyReturns);

    // Streak analysis
    const streakAnalysis = getStreakAnalysis(completedTrades);

    // P&L distribution
    const bucketSize = 100;
    const pnlDistribution: Record<string, number> = {};
    completedTrades.forEach(trade => {
      const bucket = Math.floor((trade.pnl || 0) / bucketSize) * bucketSize;
      pnlDistribution[bucket.toString()] = (pnlDistribution[bucket.toString()] || 0) + 1;
    });

    // Risk/Reward scatter data
    const riskRewardData = completedTrades.map(trade => {
      const risk = Math.abs(trade.entryPrice * trade.quantity * 100 * 0.1); // Assume 10% risk
      return {
        x: risk,
        y: trade.pnl || 0,
        id: trade.id
      };
    });

    // Monthly calendar data
    const monthlyCalendar: Record<string, number> = {};
    completedTrades.forEach(trade => {
      if (trade.exitTime) {
        const monthKey = new Date(trade.exitTime).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        monthlyCalendar[monthKey] = (monthlyCalendar[monthKey] || 0) + (trade.pnl || 0);
      }
    });

    return {
      completedTrades,
      equityCurve,
      drawdown,
      sharpeRatio,
      streakAnalysis,
      pnlDistribution,
      riskRewardData,
      monthlyCalendar,
    };
  }, [performanceData, allTrades]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading performance data...</div>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">No performance data available</div>
      </div>
    );
  }

  const winningTrades = analytics.completedTrades.filter(t => t.pnl! > 0);
  const losingTrades = analytics.completedTrades.filter(t => t.pnl! <= 0);

  // Convert daily P&L data for heatmap
  const heatmapData = useMemo(() => {
    if (!performanceData?.dailyPnL || !allTrades) return [];
    
    // Group trades by date and calculate daily P&L
    const dailyData: Record<string, { pnl: number; trades: number }> = {};
    
    allTrades.forEach(trade => {
      if (trade.pnl !== null && trade.tradeDate) {
        // Normalize to local date to avoid timezone shifts
        const tradeDate = new Date(trade.tradeDate);
        const year = tradeDate.getFullYear();
        const month = tradeDate.getMonth();
        const day = tradeDate.getDate();
        const normalizedDate = new Date(year, month, day);
        const dateKey = normalizedDate.toDateString();
        
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { pnl: 0, trades: 0 };
        }
        dailyData[dateKey].pnl += trade.pnl;
        dailyData[dateKey].trades += 1;
      }
    });
    
    const result = Object.entries(dailyData).map(([dateStr, data]) => {
      // Parse the date string properly to avoid timezone issues
      const parsedDate = new Date(dateStr);
      // Create a new date in local timezone
      const localDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
      return {
        date: localDate,
        pnl: data.pnl,
        trades: data.trades
      };
    });
    

    return result;
  }, [performanceData?.dailyPnL, allTrades]);

  return (
    <div className="space-y-6">
      {/* Daily Performance Calendar - TOP PRIORITY */}
      <DailyPerformanceCalendar 
        data={heatmapData} 
        onDateClick={onNavigateToAnalysis}
      />

      {/* Performance Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total P&L</p>
                <p className={`text-2xl font-bold ${performanceData.totalPnL >= 0 ? 'trade-positive' : 'trade-negative'}`}>
                  {performanceData.totalPnL >= 0 ? '+' : ''}${performanceData.totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Win Rate</p>
                <p className="text-2xl font-bold text-primary">
                  {performanceData.winRate.toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <Percent className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Avg R:R</p>
                <p className="text-2xl font-bold text-warning">
                  1:{performanceData.avgRR.toFixed(1)}
                </p>
              </div>
              <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Trades</p>
                <p className="text-2xl font-bold text-foreground">{performanceData.totalTrades}</p>
              </div>
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Max Drawdown</p>
              <p className="text-xl font-bold text-destructive">
                ${analytics.drawdown.maxDrawdown.toFixed(2)} ({analytics.drawdown.maxDrawdownPercent.toFixed(1)}%)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Sharpe Ratio</p>
              <p className="text-xl font-bold text-primary">
                {analytics.sharpeRatio.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Current Streak</p>
              <p className={`text-xl font-bold ${analytics.streakAnalysis.currentStreak >= 0 ? 'trade-positive' : 'trade-negative'}`}>
                {analytics.streakAnalysis.currentStreak > 0 ? '+' : ''}{analytics.streakAnalysis.currentStreak}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Profit Factor</p>
              <p className="text-xl font-bold text-success">
                {winningTrades.length > 0 && losingTrades.length > 0 
                  ? (winningTrades.reduce((sum, t) => sum + t.pnl!, 0) / Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl!, 0))).toFixed(2)
                  : 'N/A'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Equity Curve */}
        <Card>
          <CardHeader>
            <CardTitle>Equity Curve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-container">
              <EquityCurveChart data={analytics.equityCurve} />
            </div>
          </CardContent>
        </Card>

        {/* Win Rate Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Win/Loss Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-container">
              <WinRateChart wins={winningTrades.length} losses={losingTrades.length} />
            </div>
          </CardContent>
        </Card>

        {/* Daily P&L */}
        <Card>
          <CardHeader>
            <CardTitle>Daily P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-container">
              <DailyPnLChart data={performanceData.dailyPnL} />
            </div>
          </CardContent>
        </Card>

        {/* Performance by Symbol */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Symbol</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-container">
              <SymbolPerformanceChart data={performanceData.symbolPerformance} />
            </div>
          </CardContent>
        </Card>

        {/* Performance by Time */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Time Classification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-container">
              <TimeClassificationChart data={performanceData.timePerformance} />
            </div>
          </CardContent>
        </Card>

        {/* Risk/Reward Scatter */}
        <Card>
          <CardHeader>
            <CardTitle>Risk/Reward Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-container">
              <RiskRewardScatterChart data={analytics.riskRewardData} />
            </div>
          </CardContent>
        </Card>

        {/* P&L Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>P&L Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-container">
              <PnLDistributionChart data={analytics.pnlDistribution} />
            </div>
          </CardContent>
        </Card>

        {/* Streak Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Win/Loss Streaks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-container">
              <StreakChart streaks={analytics.streakAnalysis.streaks} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-12 gap-1 text-xs">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                  <div key={month} className="text-center p-2 font-medium text-muted-foreground">
                    {month}
                  </div>
                ))}
                
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => {
                  const currentYear = new Date().getFullYear();
                  const monthKey = `${month} ${currentYear}`;
                  const pnl = analytics.monthlyCalendar[monthKey] || 0;
                  const intensity = Math.min(Math.abs(pnl) / 1000, 1); // Normalize to 0-1
                  
                  return (
                    <div 
                      key={month}
                      className="text-center p-2 rounded text-xs font-medium"
                      style={{
                        backgroundColor: pnl >= 0 
                          ? `hsla(142, 76%, 36%, ${intensity * 0.8 + 0.2})`
                          : `hsla(346, 87%, 43%, ${intensity * 0.8 + 0.2})`,
                        color: 'hsl(210, 40%, 98%)'
                      }}
                    >
                      {pnl !== 0 ? `${pnl >= 0 ? '+' : ''}$${(pnl / 1000).toFixed(1)}k` : '-'}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted-foreground">Metric</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Value</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Details</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2">Total Trades</td>
                  <td className="py-2 font-medium">{performanceData.totalTrades}</td>
                  <td className="py-2 text-muted-foreground">
                    {winningTrades.length} wins, {losingTrades.length} losses
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2">Best Trade</td>
                  <td className="py-2 font-medium text-success">
                    +${Math.max(...analytics.completedTrades.map(t => t.pnl!)).toFixed(2)}
                  </td>
                  <td className="py-2 text-muted-foreground">Single best performing trade</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2">Worst Trade</td>
                  <td className="py-2 font-medium text-destructive">
                    ${Math.min(...analytics.completedTrades.map(t => t.pnl!)).toFixed(2)}
                  </td>
                  <td className="py-2 text-muted-foreground">Single worst performing trade</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2">Max Win Streak</td>
                  <td className="py-2 font-medium text-success">
                    {analytics.streakAnalysis.maxWinStreak}
                  </td>
                  <td className="py-2 text-muted-foreground">Longest consecutive winning streak</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2">Max Loss Streak</td>
                  <td className="py-2 font-medium text-destructive">
                    {analytics.streakAnalysis.maxLossStreak}
                  </td>
                  <td className="py-2 text-muted-foreground">Longest consecutive losing streak</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2">Average Win</td>
                  <td className="py-2 font-medium text-success">
                    ${winningTrades.length > 0 ? (winningTrades.reduce((sum, t) => sum + t.pnl!, 0) / winningTrades.length).toFixed(2) : '0.00'}
                  </td>
                  <td className="py-2 text-muted-foreground">Average profit per winning trade</td>
                </tr>
                <tr>
                  <td className="py-2">Average Loss</td>
                  <td className="py-2 font-medium text-destructive">
                    ${losingTrades.length > 0 ? (losingTrades.reduce((sum, t) => sum + t.pnl!, 0) / losingTrades.length).toFixed(2) : '0.00'}
                  </td>
                  <td className="py-2 text-muted-foreground">Average loss per losing trade</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
