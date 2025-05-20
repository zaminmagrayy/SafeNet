
import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  BarChart3, 
  Flag, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Monitor 
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Shield } from "lucide-react";

type Theme = "light" | "dark" | "system";

const DashboardLayout = () => {
  const [theme, setTheme] = useState<Theme>("light");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    toast.success("Logged out successfully");
    navigate("/login");
  };
  
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    // Here you would actually implement theme switching logic
    toast.success(`Theme changed to ${newTheme} mode`);
  };
  
  // Determine if a nav link is active
  const isActive = (path: string) => {
    return location.pathname === path ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-100";
  };
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);
  
  const navItems = [
    { path: "/dashboard/upload", label: "Upload Content", icon: Upload },
    { path: "/dashboard/reports", label: "Moderation Reports", icon: BarChart3 },
    { path: "/dashboard/flagged", label: "Flagged Accounts", icon: Flag },
    { path: "/dashboard/settings", label: "Settings", icon: Settings },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center gap-2">
          <Shield className="h-6 w-6 text-purple-600" />
          <h1 className="font-bold text-lg">Safe Net</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive(item.path)}`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span>Log Out</span>
          </Button>
        </div>
      </aside>
      
      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden fixed top-4 left-4 z-40"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 flex items-center gap-2">
              <Shield className="h-6 w-6 text-purple-600" />
              <h1 className="font-bold text-lg">Safe Net</h1>
            </div>
            
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive(item.path)}`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            
            <div className="p-4 border-t border-gray-200">
              <Button
                variant="ghost"
                className="w-full flex items-center justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                <span>Log Out</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h1 className="font-semibold text-xl lg:hidden">Safe Net</h1>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-full bg-gray-100 p-1">
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full ${theme === 'light' ? 'bg-white text-amber-600' : ''}`}
                onClick={() => handleThemeChange("light")}
              >
                <Sun className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full ${theme === 'dark' ? 'bg-white text-indigo-600' : ''}`}
                onClick={() => handleThemeChange("dark")}
              >
                <Moon className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full ${theme === 'system' ? 'bg-white text-gray-600' : ''}`}
                onClick={() => handleThemeChange("system")}
              >
                <Monitor className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>
        
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
