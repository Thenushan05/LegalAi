import {
  Bell,
  User,
  Search,
  Settings,
  HelpCircle,
  Plus,
  Menu,
  MessageSquare,
  Clock,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { HelpDialog } from "@/components/HelpDialog";
import { UserMenu } from "@/components/auth/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  onUploadClick?: () => void;
  onSettingsClick?: () => void;
  onNewChatClick?: () => void;
  showNewChat?: boolean;
}

export function AppHeader({
  onUploadClick,
  onSettingsClick,
  onNewChatClick,
  showNewChat = false,
}: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  // Track sidebar collapsed state (default collapsed on mobile)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );

  // Breadcrumb metadata based on pathname
  const breadcrumb = useMemo(() => {
    const path = location.pathname;
    // Map top-level routes to labels and icons
    const map: Record<string, { label: string; icon: React.ReactNode }> = {
      "/chat": { label: "Chat", icon: <MessageSquare className="h-4 w-4" /> },
      "/history": { label: "History", icon: <Clock className="h-4 w-4" /> },
      "/bookmarks": { label: "Bookmarks", icon: <Bookmark className="h-4 w-4" /> },
      "/settings": { label: "Settings", icon: <Settings className="h-4 w-4" /> },
      "/login": { label: "Login", icon: <User className="h-4 w-4" /> },
      "/register": { label: "Sign Up", icon: <User className="h-4 w-4" /> },
      "/signup": { label: "Sign Up", icon: <User className="h-4 w-4" /> },
      "/forgot-password": { label: "Forgot Password", icon: <User className="h-4 w-4" /> },
    };

    const current = map[path] ?? { label: path.replace("/", ""), icon: null };
    return { current };
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ collapsed: boolean }>;
      if (ce.detail && typeof ce.detail.collapsed === "boolean") {
        setSidebarCollapsed(ce.detail.collapsed);
      }
    };
    window.addEventListener("sidebar-toggle", handler as EventListener);
    return () => {
      window.removeEventListener("sidebar-toggle", handler as EventListener);
    };
  }, []);

  return (
    <header
      className={cn(
        "h-16 border-b border-border/50 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 fixed top-0 right-0 left-0 z-50",
        sidebarCollapsed ? "lg:left-16" : "lg:left-64"
      )}
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side - App name and search */}
        <div className="flex items-center gap-6">
          {/* Mobile hamburger to open sidebar */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg lg:hidden"
            onClick={() => window.dispatchEvent(new Event("sidebar-open"))}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            {sidebarCollapsed && (
              <h1 className="text-xl font-bold text-primary">DocksTalk</h1>
            )}

            {/* Breadcrumbs */}
            <nav className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <span>Dashboard</span>
              <span className="text-muted-foreground/70">/</span>
              <div className="flex items-center gap-2">
                {breadcrumb.current.icon}
                <span className="capitalize">{breadcrumb.current.label || ""}</span>
              </div>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents, clauses, or legal terms..."
              className="w-80 pl-10 h-9 rounded-xl border-2 border-border/50 focus:border-primary transition-all duration-200"
            />
          </div>
        </div>

        {/* Right side - Controls */}
        <div className="flex items-center gap-3">
          {/* New Chat Button - only show when there are messages */}
          {showNewChat && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNewChatClick}
              className="h-9 px-3 rounded-lg border-2 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary transition-all duration-200 hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          )}
          {/* Help Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsHelpOpen(true)}
            className="h-9 w-9 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all duration-200 hover:scale-105"
            aria-label="Get help"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>

          {/* Help Dialog */}
          <HelpDialog open={isHelpOpen} onOpenChange={setIsHelpOpen} />

          <ThemeToggle />

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative h-9 w-9 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSettingsClick}
            className="h-9 w-9 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 hover:scale-105"
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* User Authentication */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
