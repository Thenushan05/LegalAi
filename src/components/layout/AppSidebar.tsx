import { useEffect, useState } from "react";
import {
  MessageSquare,
  History,
  Bookmark,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Upload,
  FileText,
  Scale,
  TrendingUp,
  HelpCircle,
  Home,
  Star,
  Clock,
  Zap,
  BarChart3,
  User,
  Lightbulb,
  ChevronRight,
  X,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SidebarItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isActive?: boolean;
}

interface RecentChat {
  id: string;
  title: string;
  timestamp: string;
  type: "document" | "question";
}

interface QuickAction {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const quickActions: QuickAction[] = [
  {
    title: "Summarize Document",
    icon: FileText,
    description: "Get key points and risks",
  },
  {
    title: "Highlight Risks",
    icon: Scale,
    description: "Identify potential issues",
  },
  {
    title: "Explain Clause",
    icon: HelpCircle,
    description: "Plain language breakdown",
  },
];

// Move recentChats inside the component to manage state
const initialRecentChats: RecentChat[] = [
  {
    id: "1",
    title: "Lease Agreement Analysis",
    timestamp: "2 min ago",
    type: "document",
  },
  {
    id: "2",
    title: "Employment Contract Review",
    timestamp: "1 hour ago",
    type: "document",
  },
  {
    id: "3",
    title: "Penalty Clause Question",
    timestamp: "3 hours ago",
    type: "question",
  },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const [recentChats, setRecentChats] = useState<RecentChat[]>(initialRecentChats);
  const location = useLocation();

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      // Notify app about collapse change so layout can adapt
      window.dispatchEvent(
        new CustomEvent("sidebar-toggle", { detail: { collapsed: next } })
      );
      return next;
    });
  };

  // Send initial state on mount so pages can align correctly
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("sidebar-toggle", { detail: { collapsed } })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for global open/close events (triggered from header on mobile)
  useEffect(() => {
    const openHandler = () => {
      setCollapsed((prev) => {
        if (prev) {
          const next = false;
          window.dispatchEvent(new CustomEvent("sidebar-toggle", { detail: { collapsed: next } }));
          return next;
        }
        return prev;
      });
    };
    const closeHandler = () => {
      setCollapsed((prev) => {
        if (!prev) {
          const next = true;
          window.dispatchEvent(new CustomEvent("sidebar-toggle", { detail: { collapsed: next } }));
          return next;
        }
        return prev;
      });
    };
    window.addEventListener("sidebar-open", openHandler);
    window.addEventListener("sidebar-close", closeHandler);
    return () => {
      window.removeEventListener("sidebar-open", openHandler);
      window.removeEventListener("sidebar-close", closeHandler);
    };
  }, []);
  
  const removeRecentChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking remove
    setRecentChats(recentChats.filter(chat => chat.id !== id));
  };

  const sidebarItems: SidebarItem[] = [
    {
      title: "Chat",
      url: "/",
      icon: MessageSquare,
      isActive: location.pathname === "/",
    },
    {
      title: "History",
      url: "/history",
      icon: History,
      isActive: location.pathname === "/history",
    },
    {
      title: "Bookmarks",
      url: "/bookmarks",
      icon: Bookmark,
      isActive: location.pathname === "/bookmarks",
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      isActive: location.pathname === "/settings",
    },
  ];

  return (
    <>
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/40 z-[55] lg:hidden"
          onClick={() => {
            setCollapsed(true);
            window.dispatchEvent(
              new CustomEvent("sidebar-toggle", { detail: { collapsed: true } })
            );
          }}
        />
      )}
      <div
        className={cn(
          "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 z-[60] lg:z-40 overflow-hidden",
          collapsed ? "w-0 lg:w-16 pointer-events-none lg:pointer-events-auto" : "w-64"
        )}
        aria-hidden={collapsed ? true : false}
      >
        <div className="flex flex-col h-full">
          {/* Header - Fixed */}
          <div
            className={cn(
              "flex items-center justify-between border-b border-sidebar-border flex-shrink-0",
              collapsed ? "p-2" : "p-4"
            )}
          >
            {!collapsed && (
              <NavLink to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LA</span>
                </div>
                <span className="font-semibold text-sidebar-foreground">LegalAssist</span>
              </NavLink>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="w-8 h-8 p-0 hover:bg-sidebar-accent rounded-lg transition-all duration-200"
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>

          {/* Navigation - Fixed at top */}
          <nav className={cn("border-b border-sidebar-border flex-shrink-0", collapsed ? "p-2" : "p-3")}>
            {/* Action Buttons */}
            <div className="space-y-2 mb-4">
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-9 transition-all duration-200 text-sm"
                onClick={() => (window.location.href = "/")}
              >
                <Plus className="h-4 w-4 mr-2" />
                {!collapsed && "New Chat"}
              </Button>
              <Button
                variant="outline"
                className="w-full border-2 border-dashed border-sidebar-border hover:border-primary rounded-xl h-9 transition-all duration-200 text-sm"
                onClick={() => window.dispatchEvent(new Event("open-upload-dialog"))}
              >
                <Upload className="h-4 w-4 mr-2" />
                {!collapsed && "Upload Document"}
              </Button>
            </div>

            {/* Navigation Links */}
            <ul className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const navContent = (
                  <NavLink
                    to={item.url}
                    className={cn(
                      "flex items-center gap-3 rounded-xl transition-all duration-200 relative group",
                      collapsed ? "justify-center px-0 py-2" : "px-3 py-2",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      item.isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground border-l-2"
                        : "text-sidebar-foreground"
                    )}
                    style={item.isActive ? { borderLeftColor: "hsl(var(--primary))" } : undefined}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span className="font-medium">{item.title}</span>}
                    {item.badge && !collapsed && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {item.badge}
                      </Badge>
                    )}
                    {item.isActive && <div className="absolute right-2 w-1 h-1 rounded-full animate-pulse bg-primary" />}
                  </NavLink>
                );
                return <li key={item.title}>{collapsed ? (<Tooltip><TooltipTrigger asChild>{navContent}</TooltipTrigger><TooltipContent side="right" className="ml-2">{item.title}</TooltipContent></Tooltip>) : navContent}</li>;
              })}
            </ul>
          </nav>

          {/* Scrollable Content Area - Hidden scrollbar */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {!collapsed && (
              <div className="p-3 border-b border-sidebar-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-sidebar-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Chats
                  </h3>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {recentChats.map((chat) => (
                    <div key={chat.id} className="group flex items-center gap-2 p-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-all duration-200">
                      <div className="w-2 h-2 rounded-full flex-shrink-0 bg-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-sidebar-foreground truncate">{chat.title}</p>
                        <p className="text-xs text-sidebar-foreground/60">{chat.timestamp}</p>
                      </div>
                      <button
                        onClick={(e) => removeRecentChat(chat.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-sidebar-foreground/10 transition-opacity duration-200"
                        aria-label="Remove chat"
                      >
                        <X className="h-3 w-3 text-sidebar-foreground/50 hover:text-sidebar-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!collapsed && (
              <div className="p-3 border-b border-sidebar-border">
                <h3 className="text-sm font-semibold text-sidebar-foreground mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  {quickActions.map((action) => (
                    <div key={action.title} className="p-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-all duration-200 group">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:opacity-90 transition-colors bg-primary/10">
                          <action.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-sidebar-foreground">{action.title}</p>
                          <p className="text-xs text-sidebar-foreground/60 line-clamp-1">{action.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!collapsed && (
              <div className="p-3 border-b border-sidebar-border">
                <h3 className="text-sm font-semibold text-sidebar-foreground mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-success/10">
                    <span className="text-xs text-success">Flagged Clauses</span>
                    <Badge variant="secondary" className="text-xs">12</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-warning/10">
                    <span className="text-xs text-warning">Pending Docs</span>
                    <Badge variant="secondary" className="text-xs">3</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10">
                    <span className="text-xs text-primary">Common Terms</span>
                    <Badge variant="secondary" className="text-xs">8</Badge>
                  </div>
                </div>
              </div>
            )}

            {!collapsed && (
              <div className="p-3 border-b border-sidebar-border">
                <div className="p-3 rounded-lg border bg-primary/10 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-foreground">AI Tip</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click on highlighted text to get instant legal insights and suggestions.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Fixed */}
          <div className="p-4 border-t border-sidebar-border flex-shrink-0">
            {!collapsed && (
              <div className="text-xs text-sidebar-foreground/60 text-center">
                Powered by AI • v1.0.0
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
