import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import PremarketAnalysisNew from "@/components/sections/premarket-analysis-new";
import TradesSectionMobile from "@/components/sections/trades-section-mobile";
import AnalysisSection from "@/components/sections/analysis-section";
import PlaybookSection from "@/components/sections/playbook-section";
import PerformanceSectionMobile from "@/components/sections/performance-section-mobile";
import IntradaySection from "@/components/sections/intraday-section";
import DailySnapshotSection from "@/components/sections/daily-snapshot-section";
import AdminSection from "@/components/sections/admin-section";

type SectionType = 'premarket' | 'trades' | 'analysis' | 'playbook' | 'performance' | 'intraday' | 'daily-snapshot' | 'admin';

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<SectionType>('premarket');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Auto-collapse sidebar on mobile
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavigateToAnalysis = (dateOrTradeId: Date | number, section?: 'analysis' | 'edit') => {
    setActiveSection('analysis');
    if (dateOrTradeId instanceof Date) {
      // Store the selected date for the analysis section
      localStorage.setItem('quantrails-selected-date', dateOrTradeId.toISOString());
    } else {
      // Store the trade ID and section for navigation
      localStorage.setItem('quantrails-selected-trade-id', dateOrTradeId.toString());
      localStorage.setItem('quantrails-analysis-section', section || 'analysis');
    }
  };

  const { data: performanceData } = useQuery<{
    totalPnL: number;
    winRate: number;
    avgRR: number;
    totalTrades: number;
  }>({
    queryKey: ['/api/performance/analytics'],
    staleTime: 30000, // Cache for 30 seconds
  });

  const { data: accountBalanceSetting } = useQuery({
    queryKey: ['/api/settings/account_balance'],
    staleTime: 30000,
  });

  const sectionTitles: Record<SectionType, string> = {
    'premarket': 'Premarket Analysis',
    'trades': 'Trade Logging',
    'analysis': 'Trade Analysis',
    'playbook': 'Trading Playbook',
    'performance': 'Performance Analytics',
    'intraday': 'Intraday Notes',
    'daily-snapshot': 'Daily Snapshot',
    'admin': 'Admin Dashboard'
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'premarket':
        return <PremarketAnalysisNew />;
      case 'trades':
        return <TradesSectionMobile onNavigateToAnalysis={handleNavigateToAnalysis} />;
      case 'analysis':
        return <AnalysisSection />;
      case 'playbook':
        return <PlaybookSection />;
      case 'performance':
        return <PerformanceSectionMobile />;
      case 'intraday':
        return <IntradaySection />;
      case 'daily-snapshot':
        return <DailySnapshotSection />;
      case 'admin':
        return <AdminSection />;
      default:
        return <PremarketAnalysisNew />;
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-background text-foreground relative">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        isCollapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />
      
      <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0'
      }`}>
        {/* Header */}
        <header className="bg-card border-b border-border px-4 lg:px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Menu Toggle Button */}
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
                onClick={toggleSidebar}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div>
                <h2 className="text-xl lg:text-2xl font-bold">{sectionTitles[activeSection]}</h2>
                <p className="text-muted-foreground text-sm hidden sm:block">
                  Current Date: {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-right sm:text-left">
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">Account Balance:</span>
                <span className="text-xs sm:text-sm text-muted-foreground sm:hidden">Balance:</span>
                <span className="text-sm sm:text-lg font-semibold text-success">
                  ${((performanceData?.totalPnL || 0) + parseFloat((accountBalanceSetting as any)?.value || '25000')).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm text-muted-foreground">P&L:</span>
                <span className={`text-sm sm:text-lg font-semibold ${(performanceData?.totalPnL || 0) >= 0 ? 'trade-positive' : 'trade-negative'}`}>
                  {(performanceData?.totalPnL || 0) >= 0 ? '+' : ''}${(performanceData?.totalPnL || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  window.location.reload();
                }}
                className="ml-2"
              >
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="w-full max-w-none">
            {renderActiveSection()}
          </div>
        </main>
      </div>
    </div>
  );
}
