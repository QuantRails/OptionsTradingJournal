import { TrendingUp, Cloud, BarChart3, ArrowLeftRight, Microscope, Book, PieChart, Clock, Calendar, Settings, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type SectionType = 'premarket' | 'trades' | 'analysis' | 'playbook' | 'performance' | 'intraday' | 'daily-snapshot' | 'admin';

interface SidebarProps {
  activeSection: SectionType;
  onSectionChange: (section: SectionType) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const navigationItems = [
  { id: 'premarket' as SectionType, label: 'Premarket Analysis', icon: BarChart3 },
  { id: 'trades' as SectionType, label: 'Trade Logging', icon: ArrowLeftRight },
  { id: 'analysis' as SectionType, label: 'Trade Analysis', icon: Microscope },
  { id: 'playbook' as SectionType, label: 'Playbook', icon: Book },
  { id: 'performance' as SectionType, label: 'Performance', icon: PieChart },
  { id: 'intraday' as SectionType, label: 'Intraday Notes', icon: Clock },
  { id: 'daily-snapshot' as SectionType, label: 'Daily Snapshot', icon: Calendar },
  { id: 'admin' as SectionType, label: 'Admin', icon: Settings },
];

export default function Sidebar({ activeSection, onSectionChange, isCollapsed, onToggle }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${isCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'w-64 lg:w-64'}
        sidebar-gradient border-r border-border h-full
        transition-all duration-300 ease-in-out
      `}>
        <div className={`${isCollapsed ? 'p-2 lg:p-4' : 'p-6'} h-full flex flex-col`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center ${isCollapsed ? 'lg:justify-center lg:flex-col lg:space-x-0 lg:space-y-2 space-x-3' : 'space-x-3'}`}>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="text-primary-foreground text-sm" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold">QuantRails</h1>
                  <span className="text-sm text-muted-foreground">Trading Journal</span>
                </div>
              )}
              {isCollapsed && (
                <div className="hidden lg:flex flex-col items-center">
                  <h1 className="text-xs font-bold">QR</h1>
                </div>
              )}
            </div>
            
            {/* Mobile Close Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-2"
              onClick={onToggle}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Navigation */}
          <nav className={`space-y-2 flex-1 overflow-y-auto`}>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`
                    w-full text-left
                    ${isCollapsed ? 'lg:justify-center lg:px-2 lg:py-3 justify-start px-3 py-2 space-x-3' : 'justify-start space-x-3 px-3 py-2'}
                    ${isActive 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }
                  `}
                  onClick={() => {
                    onSectionChange(item.id);
                    // Auto-close sidebar on mobile after selection
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isCollapsed ? 'lg:mr-0 mr-3' : ''}`} />
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {isCollapsed && (
                    <span className="lg:hidden truncate">{item.label}</span>
                  )}
                </Button>
              );
            })}
          </nav>

          {/* Collapse Toggle for Desktop */}
          <div className="mt-4 pt-4 border-t border-border hidden lg:block">
            <Button
              variant="ghost"
              className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start space-x-3 px-3'} py-2`}
              onClick={onToggle}
            >
              <Menu className={`w-4 h-4 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && (
                <span className="text-sm">Collapse</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
