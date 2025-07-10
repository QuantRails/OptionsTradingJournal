export function calculateOptionsPnL(
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  commission: number = 0
): number {
  const multiplier = 100; // Options multiplier
  const entryDebit = entryPrice * quantity * multiplier;
  const exitCredit = exitPrice * quantity * multiplier;
  return exitCredit - entryDebit - commission;
}

export function classifyTimeOfDay(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  
  // 8:30-9:30 AM (510-570 minutes)
  if (timeInMinutes >= 510 && timeInMinutes <= 570) {
    return "Cash Open";
  }
  // 9:31-10:30 AM (571-630 minutes)
  else if (timeInMinutes >= 571 && timeInMinutes <= 630) {
    return "Euro Close";
  }
  // 2:30-3:00 PM (870-900 minutes)
  else if (timeInMinutes >= 870 && timeInMinutes <= 900) {
    return "Power Hour";
  }
  
  return "Other";
}

export function calculateRiskReward(
  entryPrice: number,
  stopLoss: number,
  takeProfit: number
): number {
  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);
  return risk > 0 ? reward / risk : 0;
}

export function calculateDrawdown(balanceHistory: number[]): {
  maxDrawdown: number;
  maxDrawdownPercent: number;
  currentDrawdown: number;
} {
  if (balanceHistory.length === 0) {
    return { maxDrawdown: 0, maxDrawdownPercent: 0, currentDrawdown: 0 };
  }

  let peak = balanceHistory[0];
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;
  
  for (let i = 1; i < balanceHistory.length; i++) {
    if (balanceHistory[i] > peak) {
      peak = balanceHistory[i];
    }
    
    const drawdown = peak - balanceHistory[i];
    const drawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0;
    
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPercent = drawdownPercent;
    }
  }
  
  const currentPeak = Math.max(...balanceHistory);
  const currentBalance = balanceHistory[balanceHistory.length - 1];
  const currentDrawdown = currentPeak - currentBalance;
  
  return { maxDrawdown, maxDrawdownPercent, currentDrawdown };
}

export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate: number = 0.02
): number {
  if (returns.length === 0) return 0;
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  return stdDev > 0 ? (avgReturn - riskFreeRate / 252) / stdDev : 0;
}

export function getStreakAnalysis(trades: Array<{ pnl: number | null }>) {
  const completedTrades = trades.filter(t => t.pnl !== null);
  if (completedTrades.length === 0) {
    return { currentStreak: 0, maxWinStreak: 0, maxLossStreak: 0, streaks: [] };
  }

  let currentStreak = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let streaks: Array<{ type: 'win' | 'loss'; length: number; start: number }> = [];
  
  let currentStreakType: 'win' | 'loss' | null = null;
  let currentStreakLength = 0;
  let currentStreakStart = 0;

  completedTrades.forEach((trade, index) => {
    const isWin = trade.pnl !== null && trade.pnl > 0;
    const streakType: 'win' | 'loss' = isWin ? 'win' : 'loss';
    
    if (currentStreakType === streakType) {
      currentStreakLength++;
    } else {
      if (currentStreakType !== null) {
        streaks.push({
          type: currentStreakType,
          length: currentStreakLength,
          start: currentStreakStart
        });
        
        if (currentStreakType === 'win') {
          maxWinStreak = Math.max(maxWinStreak, currentStreakLength);
        } else {
          maxLossStreak = Math.max(maxLossStreak, currentStreakLength);
        }
      }
      
      currentStreakType = streakType;
      currentStreakLength = 1;
      currentStreakStart = index;
    }
  });
  
  // Handle the last streak
  if (currentStreakType !== null) {
    streaks.push({
      type: currentStreakType,
      length: currentStreakLength,
      start: currentStreakStart
    });
    
    if (currentStreakType === 'win') {
      maxWinStreak = Math.max(maxWinStreak, currentStreakLength);
    } else {
      maxLossStreak = Math.max(maxLossStreak, currentStreakLength);
    }
    
    currentStreak = currentStreakType === 'win' ? currentStreakLength : -currentStreakLength;
  }
  
  return { currentStreak, maxWinStreak, maxLossStreak, streaks };
}
