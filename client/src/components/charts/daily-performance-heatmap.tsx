import React from "react";
import { format, eachDayOfInterval, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface DailyPnLData {
  date: Date;
  pnl: number;
  trades: number;
}

interface DailyPerformanceHeatmapProps {
  data: DailyPnLData[];
  className?: string;
}

export function DailyPerformanceHeatmap({ data, className }: DailyPerformanceHeatmapProps) {
  // Get the range of weeks to display (last 12 weeks)
  const today = new Date();
  const startDate = startOfWeek(subWeeks(today, 11));
  const endDate = endOfWeek(today);
  
  // Create array of all days in the range
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Group days by week
  const weeks = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }
  
  // Function to get PnL data for a specific date
  const getPnLForDate = (date: Date) => {
    return data.find(d => isSameDay(d.date, date));
  };
  
  // Function to get color intensity based on PnL
  const getColorIntensity = (pnl: number) => {
    const maxPnL = Math.max(...data.map(d => Math.abs(d.pnl)));
    if (maxPnL === 0) return 'bg-gray-800';
    
    const intensity = Math.min(Math.abs(pnl) / maxPnL, 1);
    
    if (pnl > 0) {
      // Green for profits
      if (intensity > 0.8) return 'bg-green-500';
      if (intensity > 0.6) return 'bg-green-600';
      if (intensity > 0.4) return 'bg-green-700';
      if (intensity > 0.2) return 'bg-green-800';
      return 'bg-green-900';
    } else if (pnl < 0) {
      // Red for losses
      if (intensity > 0.8) return 'bg-red-500';
      if (intensity > 0.6) return 'bg-red-600';
      if (intensity > 0.4) return 'bg-red-700';
      if (intensity > 0.2) return 'bg-red-800';
      return 'bg-red-900';
    } else {
      return 'bg-gray-800';
    }
  };
  
  // Calculate summary stats
  const totalDays = data.length;
  const profitableDays = data.filter(d => d.pnl > 0).length;
  const lossDays = data.filter(d => d.pnl < 0).length;
  const breakEvenDays = data.filter(d => d.pnl === 0).length;
  const winRate = totalDays > 0 ? (profitableDays / totalDays * 100).toFixed(1) : '0';
  
  const totalPnL = data.reduce((sum, d) => sum + d.pnl, 0);
  const avgDaily = totalDays > 0 ? (totalPnL / totalDays).toFixed(2) : '0';
  
  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-blue-400" />
          Daily Performance Heatmap (Last 12 Weeks)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-900 p-3 rounded">
            <div className="text-xs text-gray-400">Trading Days</div>
            <div className="text-lg font-semibold text-white">{totalDays}</div>
          </div>
          <div className="bg-gray-900 p-3 rounded">
            <div className="text-xs text-gray-400">Win Rate</div>
            <div className="text-lg font-semibold text-green-400">{winRate}%</div>
          </div>
          <div className="bg-gray-900 p-3 rounded">
            <div className="text-xs text-gray-400">Profitable Days</div>
            <div className="text-lg font-semibold text-green-400">{profitableDays}</div>
          </div>
          <div className="bg-gray-900 p-3 rounded">
            <div className="text-xs text-gray-400">Loss Days</div>
            <div className="text-lg font-semibold text-red-400">{lossDays}</div>
          </div>
          <div className="bg-gray-900 p-3 rounded">
            <div className="text-xs text-gray-400">Avg Daily P&L</div>
            <div className={`text-lg font-semibold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${avgDaily}
            </div>
          </div>
        </div>
        
        {/* Calendar Heatmap */}
        <div className="space-y-2">
          {/* Day labels */}
          <div className="grid grid-cols-8 gap-1 text-xs text-gray-400 mb-2">
            <div></div>
            <div className="text-center">Mon</div>
            <div className="text-center">Tue</div>
            <div className="text-center">Wed</div>
            <div className="text-center">Thu</div>
            <div className="text-center">Fri</div>
            <div className="text-center">Sat</div>
            <div className="text-center">Sun</div>
          </div>
          
          {/* Weeks */}
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-8 gap-1">
              {/* Week label */}
              <div className="text-xs text-gray-400 text-right pr-2 flex items-center justify-end">
                {format(week[0], 'MMM d')}
              </div>
              
              {/* Days in week */}
              {week.map((day, dayIndex) => {
                const dayData = getPnLForDate(day);
                const isToday = isSameDay(day, today);
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                
                return (
                  <div
                    key={dayIndex}
                    className={`
                      w-6 h-6 rounded-sm flex items-center justify-center relative group cursor-pointer
                      ${dayData ? getColorIntensity(dayData.pnl) : 'bg-gray-800'}
                      ${isToday ? 'ring-2 ring-blue-400' : ''}
                      ${isWeekend ? 'opacity-50' : ''}
                    `}
                    title={`${format(day, 'MMM d, yyyy')}${dayData ? `: $${dayData.pnl.toFixed(2)} (${dayData.trades} trades)` : ': No trades'}`}
                  >
                    {/* Tooltip content will be handled by the title attribute */}
                    {dayData && dayData.trades > 0 && (
                      <div className="text-xs text-white font-bold">
                        {dayData.trades}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-2">
            <span>Less</span>
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-gray-800 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-900 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-700 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            </div>
            <span>More Profit</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>More Loss</span>
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
              <div className="w-3 h-3 bg-red-700 rounded-sm"></div>
              <div className="w-3 h-3 bg-red-900 rounded-sm"></div>
            </div>
            <span>Less</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}