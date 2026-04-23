"use client";
import React, { useState, useEffect } from 'react';
import { 
  Home, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  BarChart3,
  FileText,
  Bell,
  Search,
  HelpCircle
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string, size?: number }>;
  badge?: string;
}

interface SidebarProps {
  className?: string;
  theme?: any;
  navItems: NavigationItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  email: string;
  onSignOut: () => void;
  bufferConnectedCount: number;
}

export function Sidebar({ 
  className = "",
  theme,
  navItems,
  activeTab,
  onTabChange,
  email,
  onSignOut,
  bufferConnectedCount
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-open sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const handleItemClick = (itemId: string) => {
    onTabChange(itemId);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const getInitials = (emailStr: string) => {
    if (!emailStr) return "JD";
    return emailStr.substring(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-[18px] left-6 z-50 p-2 rounded-lg bg-[#121212] border border-[#2a2a2a] shadow-md md:hidden hover:bg-[#1a1a1a] transition-all duration-200"
        aria-label="Toggle sidebar"
      >
        {isOpen ? 
          <X className="h-5 w-5 text-slate-300" /> : 
          <Menu className="h-5 w-5 text-slate-300" />
        }
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300" 
          onClick={toggleSidebar} 
        />
      )}

      {/* Sidebar background block for maintaining layout width if needed */}
      {!isCollapsed && <div className="hidden md:block w-[260px] flex-shrink-0" />}
      {isCollapsed && <div className="hidden md:block w-20 flex-shrink-0" />}

      {/* Sidebar - Fix position left-0 so it overlays or sits next to content */}
      <div
        className={`
          fixed top-0 left-0 h-full bg-[#0a0a0a] border-r border-[#1a1a1a]/40 z-40 transition-all duration-300 ease-in-out flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "w-20" : "w-[260px]"}
          md:translate-x-0
          ${className}
        `}
      >
        {/* Header with logo and collapse button */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-5 mt-2`}>
          {!isCollapsed && (
            <div className="flex items-center">
              <span className="font-bold text-white text-2xl tracking-tight">EasyWay</span>
            </div>
          )}

          {/* Desktop collapse button */}
          <button
            onClick={toggleCollapse}
            className="hidden md:flex p-1.5 rounded-md hover:bg-[#1a1a1a] transition-all duration-200 text-slate-400 hover:text-white"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto w-full">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClick(item.id)}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group
                      ${isActive
                        ? "bg-[#1f1f1f] border border-[#2a2a2a] text-white shadow-sm"
                        : "text-slate-400 hover:bg-[#121212] hover:text-white border border-transparent"
                      }
                      ${isCollapsed ? "justify-center px-0" : ""}
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className={`flex items-center justify-center ${isCollapsed ? '' : 'min-w-[24px]'}`}>
                      <Icon
                        className={`
                          h-4.5 w-4.5 flex-shrink-0
                          ${isActive 
                            ? "text-white" 
                            : "text-slate-400 group-hover:text-white"
                          }
                        `}
                        size={18}
                      />
                    </div>
                    
                    {!isCollapsed && (
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-[0.95rem] ${isActive ? "font-medium" : "font-normal"} tracking-tight`}>{item.label}</span>
                        {item.badge && (
                          <span className={`
                            px-1.5 py-0.5 text-xs font-medium rounded-full
                            ${isActive
                              ? "bg-slate-700 text-slate-200"
                              : "bg-[#1a1a1a] text-slate-400"
                            }
                          `}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-[#1f1f1f] border border-[#2a2a2a] text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                        {item.label}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-[#1f1f1f] border-l border-b border-[#2a2a2a] rotate-45" />
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section with profile and logout */}
        <div className="mt-auto border-t border-[#1a1a1a]/60 p-4 flex flex-col gap-3 pb-6">
          
          {!isCollapsed && (
            <div className="px-2 pt-1 pb-1">
              <div className="text-[0.8rem] text-slate-300 truncate max-w-full font-medium">
                {email}
              </div>
              <div className="text-[0.75rem] text-slate-500 mt-1.5 tracking-tight">
                Buffer: {bufferConnectedCount} account{bufferConnectedCount === 1 ? "" : "s"} connected
              </div>
            </div>
          )}

          {/* Profile block removed as per the reference image, it doesn't show an inner profile banner, just email, buffer line, and logout below it */}
          {/* If the design requires an avatar: 
            <div className="w-8 h-8 rounded-full overflow-hidden mx-auto">
              <img src={'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=faces&q=80'} />
            </div>
          */}

          {/* Logout Button */}
          <button
            onClick={() => onSignOut()}
            className={`
              w-full flex items-center rounded-lg text-left transition-all duration-200 group
              text-slate-300 hover:text-white mt-1
              ${isCollapsed ? "justify-center py-2" : "space-x-3 px-2 py-1"}
            `}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <div className={`flex items-center justify-center ${isCollapsed ? '' : 'min-w-[24px]'}`}>
              <LogOut size={16} className="flex-shrink-0 text-slate-300 group-hover:text-white" />
            </div>
            
            {!isCollapsed && (
              <span className="text-[0.95rem] font-medium tracking-tight">Sign Out</span>
            )}
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-[80px] px-2 py-1 bg-[#1f1f1f] text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                Sign Out
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
