import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ScatterController,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Scatter } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ScatterController,
  Filler
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: 'hsl(210, 40%, 98%)',
        font: {
          family: 'Inter',
        }
      }
    },
    tooltip: {
      backgroundColor: 'hsl(217, 32%, 17%)',
      titleColor: 'hsl(210, 40%, 98%)',
      bodyColor: 'hsl(210, 40%, 98%)',
      borderColor: 'hsl(217, 32%, 17%)',
      borderWidth: 1,
    }
  },
  scales: {
    x: {
      ticks: {
        color: 'hsl(215, 20%, 65%)',
        font: {
          family: 'Inter',
        }
      },
      grid: {
        color: 'hsl(217, 32%, 17%)',
      }
    },
    y: {
      ticks: {
        color: 'hsl(215, 20%, 65%)',
        font: {
          family: 'Inter',
        }
      },
      grid: {
        color: 'hsl(217, 32%, 17%)',
      }
    }
  }
};

interface EquityCurveChartProps {
  data: Array<{ date: string; balance: number }>;
}

export function EquityCurveChart({ data }: EquityCurveChartProps) {
  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Account Balance',
        data: data.map(d => d.balance),
        borderColor: 'hsl(217, 91%, 60%)',
        backgroundColor: 'hsla(217, 91%, 60%, 0.1)',
        fill: true,
        tension: 0.1,
      },
    ],
  };

  return <Line data={chartData} options={chartOptions} />;
}

interface DailyPnLChartProps {
  data: Record<string, number>;
}

export function DailyPnLChart({ data }: DailyPnLChartProps) {
  const chartData = {
    labels: Object.keys(data).map(date => new Date(date).toLocaleDateString()),
    datasets: [
      {
        label: 'Daily P&L',
        data: Object.values(data),
        backgroundColor: Object.values(data).map(value => 
          value >= 0 ? 'hsl(142, 76%, 36%)' : 'hsl(346, 87%, 43%)'
        ),
        borderColor: Object.values(data).map(value => 
          value >= 0 ? 'hsl(142, 76%, 36%)' : 'hsl(346, 87%, 43%)'
        ),
        borderWidth: 1,
      },
    ],
  };

  return <Bar data={chartData} options={chartOptions} />;
}

interface WinRateChartProps {
  wins: number;
  losses: number;
}

export function WinRateChart({ wins, losses }: WinRateChartProps) {
  const chartData = {
    labels: ['Wins', 'Losses'],
    datasets: [
      {
        data: [wins, losses],
        backgroundColor: [
          'hsl(142, 76%, 36%)',
          'hsl(346, 87%, 43%)',
        ],
        borderColor: [
          'hsl(142, 76%, 36%)',
          'hsl(346, 87%, 43%)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        position: 'bottom' as const,
      }
    }
  };

  return <Pie data={chartData} options={options} />;
}

interface SymbolPerformanceChartProps {
  data: Record<string, number>;
}

export function SymbolPerformanceChart({ data }: SymbolPerformanceChartProps) {
  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        label: 'P&L by Symbol',
        data: Object.values(data),
        backgroundColor: Object.values(data).map(value => 
          value >= 0 ? 'hsl(142, 76%, 36%)' : 'hsl(346, 87%, 43%)'
        ),
        borderColor: Object.values(data).map(value => 
          value >= 0 ? 'hsl(142, 76%, 36%)' : 'hsl(346, 87%, 43%)'
        ),
        borderWidth: 1,
      },
    ],
  };

  return <Bar data={chartData} options={chartOptions} />;
}

interface TimeClassificationChartProps {
  data: Record<string, number>;
}

export function TimeClassificationChart({ data }: TimeClassificationChartProps) {
  const chartData = {
    labels: Object.keys(data),
    datasets: [
      {
        label: 'P&L by Time Classification',
        data: Object.values(data),
        backgroundColor: Object.values(data).map(value => 
          value >= 0 ? 'hsl(142, 76%, 36%)' : 'hsl(346, 87%, 43%)'
        ),
        borderColor: Object.values(data).map(value => 
          value >= 0 ? 'hsl(142, 76%, 36%)' : 'hsl(346, 87%, 43%)'
        ),
        borderWidth: 1,
      },
    ],
  };

  return <Bar data={chartData} options={chartOptions} />;
}

interface RiskRewardScatterChartProps {
  data: Array<{ x: number; y: number; id: number }>;
}

export function RiskRewardScatterChart({ data }: RiskRewardScatterChartProps) {
  const chartData = {
    datasets: [
      {
        label: 'Risk vs Reward',
        data: data,
        backgroundColor: 'hsl(217, 91%, 60%)',
        borderColor: 'hsl(217, 91%, 60%)',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    ...chartOptions,
    scales: {
      x: {
        ...chartOptions.scales.x,
        title: {
          display: true,
          text: 'Risk ($)',
          color: 'hsl(215, 20%, 65%)',
        }
      },
      y: {
        ...chartOptions.scales.y,
        title: {
          display: true,
          text: 'P&L ($)',
          color: 'hsl(215, 20%, 65%)',
        }
      }
    }
  };

  return <Scatter data={chartData} options={options} />;
}

interface PnLDistributionChartProps {
  data: Record<string, number>;
}

export function PnLDistributionChart({ data }: PnLDistributionChartProps) {
  const chartData = {
    labels: Object.keys(data).map(bucket => `$${bucket}`),
    datasets: [
      {
        label: 'Trade Count',
        data: Object.values(data),
        backgroundColor: 'hsl(217, 91%, 60%)',
        borderColor: 'hsl(217, 91%, 60%)',
        borderWidth: 1,
      },
    ],
  };

  return <Bar data={chartData} options={chartOptions} />;
}

interface StreakChartProps {
  streaks: Array<{ type: 'win' | 'loss'; length: number; start: number }>;
}

export function StreakChart({ streaks }: StreakChartProps) {
  const chartData = {
    labels: streaks.map((_, index) => `Streak ${index + 1}`),
    datasets: [
      {
        label: 'Streak Length',
        data: streaks.map(streak => streak.type === 'win' ? streak.length : -streak.length),
        backgroundColor: streaks.map(streak => 
          streak.type === 'win' ? 'hsl(142, 76%, 36%)' : 'hsl(346, 87%, 43%)'
        ),
        borderColor: streaks.map(streak => 
          streak.type === 'win' ? 'hsl(142, 76%, 36%)' : 'hsl(346, 87%, 43%)'
        ),
        borderWidth: 1,
      },
    ],
  };

  return <Bar data={chartData} options={chartOptions} />;
}
