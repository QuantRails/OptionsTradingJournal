import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Percent, TrendingUp, BarChart3, Target, Activity, Calendar, Award } from "lucide-react";
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

export default function PerformanceSectionMobile() {
  // Fetch performance data
  const { data: performanceData, isLoading } = useQuery<PerformanceData>({
    queryKey: ['/api/performance/analytics'],
  });

  // Fetch all trades
  const { data: allTrades = [] } = useQuery<Trade[]>({
    queryKey: ['/api/trades'],
  });

  // Fetch account balance
  const { data: accountBalanceData } = useQuery<{value: string}>({
    queryKey: ['/api/settings/account_balance'],
  });

  const startingBalance = accountBalanceData?.value ? parseInt(accountBalanceData.value) : 28000;

  const analytics = useMemo(() => {
    if (!performanceData || !allTrades) {
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
    let balance = startingBalance;
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
    const dailyReturns = Object.values(performanceData.dailyPnL).map(pnl => pnl / startingBalance);
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
  }, [performanceData, allTrades, startingBalance]);

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
  const currentBalance = startingBalance + performanceData.totalPnL;

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
    <div className="w-full max-w-full overflow-hidden space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold">Performance Analytics</h2>
        <p className="text-muted-foreground">Track your trading performance and identify patterns</p>
      </div>

      {/* Performance Calendar - TOP PRIORITY */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily Performance Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <DailyPerformanceCalendar 
              data={heatmapData}
              onDateClick={(date) => {
                // Handle date click navigation if needed
                console.log('Calendar date clicked:', date);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics - Mobile Optimized */}
      <div className="grid grid-cols-1 gap-4">
        {/* Total P&L */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total P&L</p>
                <p className={`text-2xl font-bold ${performanceData.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {performanceData.totalPnL >= 0 ? '+' : ''}${performanceData.totalPnL.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Account: ${currentBalance.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {performanceData.winRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {winningTrades.length}W / {losingTrades.length}L
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Percent className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg R:R */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg R:R</p>
                <p className="text-2xl font-bold text-orange-600">
                  1:{performanceData.avgRR.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">Risk:Reward</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Trades */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold text-foreground">{performanceData.totalTrades}</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.completedTrades.length} completed
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Metrics - Mobile Layout */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Max Drawdown</p>
              </div>
              <p className="text-lg font-bold text-red-600">
                ${analytics.drawdown.maxDrawdown.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                {analytics.drawdown.maxDrawdownPercent.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
              </div>
              <p className="text-lg font-bold text-purple-600">
                {analytics.sharpeRatio.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                Risk-adj return
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Win Streak</p>
              </div>
              <p className="text-lg font-bold text-green-600">
                {analytics.streakAnalysis.maxWinStreak}
              </p>
              <p className="text-xs text-muted-foreground">
                Current: {analytics.streakAnalysis.currentStreak}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Avg/Trade</p>
              </div>
              <p className="text-lg font-bold text-blue-600">
                ${analytics.completedTrades.length > 0 
                  ? (performanceData.totalPnL / analytics.completedTrades.length).toFixed(2)
                  : '0.00'}
              </p>
              <p className="text-xs text-muted-foreground">
                Per completed trade
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Mobile Optimized */}
      <div className="space-y-6">
        {/* Equity Curve */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <EquityCurveChart data={analytics.equityCurve} />
            </div>
          </CardContent>
        </Card>

        {/* Daily P&L */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <DailyPnLChart data={performanceData.dailyPnL} />
            </div>
          </CardContent>
        </Card>



        {/* Symbol Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Symbol Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <SymbolPerformanceChart data={performanceData.symbolPerformance} />
            </div>
          </CardContent>
        </Card>

        {/* Time Classification */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Time of Day Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <TimeClassificationChart data={performanceData.timePerformance} />
            </div>
          </CardContent>
        </Card>

        {/* Win Rate Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Win Rate Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <WinRateChart 
                wins={winningTrades.length}
                losses={losingTrades.length}
              />
            </div>
          </CardContent>
        </Card>

        {/* P&L Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">P&L Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <PnLDistributionChart data={analytics.pnlDistribution} />
            </div>
          </CardContent>
        </Card>

        {/* Risk/Reward Scatter */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risk vs Reward</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <RiskRewardScatterChart data={analytics.riskRewardData} />
            </div>
          </CardContent>
        </Card>

        {/* Streak Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Streak Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {analytics.streakAnalysis.maxWinStreak}
                  </p>
                  <p className="text-sm text-muted-foreground">Max Win Streak</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {analytics.streakAnalysis.maxLossStreak}
                  </p>
                  <p className="text-sm text-muted-foreground">Max Loss Streak</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${analytics.streakAnalysis.currentStreak >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.streakAnalysis.currentStreak}
                  </p>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                </div>
              </div>
              <div className="h-[150px] w-full">
                <StreakChart streaks={analytics.streakAnalysis.streaks} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Starting Balance</span>
                <span className="font-medium">${startingBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Current Balance</span>
                <span className="font-medium">${currentBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Total Return</span>
                <span className={`font-medium ${performanceData.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {((performanceData.totalPnL / startingBalance) * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Best Trade</span>
                <span className="font-medium text-green-600">
                  ${Math.max(...analytics.completedTrades.map(t => t.pnl || 0)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Worst Trade</span>
                <span className="font-medium text-red-600">
                  ${Math.min(...analytics.completedTrades.map(t => t.pnl || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}