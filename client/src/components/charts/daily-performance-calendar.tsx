import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, getWeek, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface DailyPnLData {
  date: Date;
  pnl: number;
  trades: number;
}

interface DailyPerformanceCalendarProps {
  data: DailyPnLData[];
  className?: string;
  onDateClick?: (date: Date) => void;
}

export function DailyPerformanceCalendar({ data, className, onDateClick }: DailyPerformanceCalendarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const currentDate = new Date();
  

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  const getPnLForDate = (date: Date) => {
    return data.find(item => isSameDay(item.date, date));
  };

  const formatPnL = (pnl: number) => {
    const sign = pnl >= 0 ? '+' : '';
    return `${sign}$${pnl.toFixed(0)}`;
  };

  // Calculate weekly summaries
  const getWeeklySummaries = () => {
    const weeks: Array<{ start: Date; end: Date; pnl: number; trades: number }> = [];
    
    for (let i = 0; i < calendarDays.length; i += 7) {
      const weekStart = calendarDays[i];
      const weekEnd = calendarDays[Math.min(i + 6, calendarDays.length - 1)];
      
      const weekData = data.filter(item => 
        isWithinInterval(item.date, { start: weekStart, end: weekEnd })
      );
      
      const weekPnL = weekData.reduce((sum, item) => sum + item.pnl, 0);
      const weekTrades = weekData.reduce((sum, item) => sum + item.trades, 0);
      
      weeks.push({
        start: weekStart,
        end: weekEnd,
        pnl: weekPnL,
        trades: weekTrades
      });
    }
    
    return weeks;
  };

  // Calculate monthly summary
  const getMonthlySummary = () => {
    const monthData = data.filter(item => 
      isWithinInterval(item.date, { start: monthStart, end: monthEnd })
    );
    
    const monthPnL = monthData.reduce((sum, item) => sum + item.pnl, 0);
    const monthTrades = monthData.reduce((sum, item) => sum + item.trades, 0);
    
    return { pnl: monthPnL, trades: monthTrades };
  };

  const weeklySummaries = getWeeklySummaries();
  const monthlySummary = getMonthlySummary();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">
            Daily Performance Calendar - {format(currentDate, 'MMMM yyyy')}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-6">
          {calendarDays.map((day, index) => {
            const dayData = getPnLForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const hasTrades = dayData && dayData.trades > 0;
            
            return (
              <div
                key={index}
                onClick={() => hasTrades && onDateClick?.(day)}
                className={cn(
                  "min-h-[70px] p-2 border rounded-md flex flex-col justify-between",
                  !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                  isToday && "ring-2 ring-primary ring-offset-2",
                  hasTrades && dayData.pnl > 0 && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
                  hasTrades && dayData.pnl < 0 && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
                  hasTrades && dayData.pnl === 0 && "bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800",
                  hasTrades && "cursor-pointer hover:scale-105 transition-transform"
                )}
              >
                <div className="text-sm font-medium">
                  {format(day, 'd')}
                </div>
                
                {hasTrades && (
                  <div className="flex flex-col items-center text-xs space-y-1">
                    <div className={cn(
                      "font-semibold",
                      dayData.pnl > 0 && "text-green-600 dark:text-green-400",
                      dayData.pnl < 0 && "text-red-600 dark:text-red-400",
                      dayData.pnl === 0 && "text-gray-600 dark:text-gray-400"
                    )}>
                      {formatPnL(dayData.pnl)}
                    </div>
                    <div className="text-muted-foreground">
                      {dayData.trades} trade{dayData.trades !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Weekly Summaries */}
        <div className="space-y-2 mb-6">
          <h4 className="font-semibold text-sm">Weekly Summary</h4>
          {weeklySummaries.map((week, index) => {
            if (week.trades === 0) return null;
            return (
              <div key={index} className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Week {index + 1}
                </span>
                <div className="text-right">
                  <div className={cn(
                    "font-semibold",
                    week.pnl > 0 && "text-green-600 dark:text-green-400",
                    week.pnl < 0 && "text-red-600 dark:text-red-400",
                    week.pnl === 0 && "text-gray-600 dark:text-gray-400"
                  )}>
                    {formatPnL(week.pnl)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {week.trades} trades
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Monthly Summary */}
        {monthlySummary.trades > 0 && (
          <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-purple-700 dark:text-purple-300">
                  {format(currentDate, 'MMMM yyyy')} Summary
                </h3>
                <div className="text-sm text-muted-foreground">
                  Total trades: {monthlySummary.trades}
                </div>
              </div>
              <div className="text-right">
                <div className={cn(
                  "text-xl font-bold",
                  monthlySummary.pnl > 0 && "text-green-600 dark:text-green-400",
                  monthlySummary.pnl < 0 && "text-red-600 dark:text-red-400",
                  monthlySummary.pnl === 0 && "text-gray-600 dark:text-gray-400"
                )}>
                  {formatPnL(monthlySummary.pnl)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Monthly P&L
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded"></div>
            <span>Profitable Days</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded"></div>
            <span>Loss Days</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-100 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800 rounded"></div>
            <span>Breakeven Days</span>
          </div>
        </div>
        </CardContent>
      )}
    </Card>
  );
}