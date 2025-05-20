
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
import { Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";

const DashboardLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const handleLogout = async () => {
    await signOut();
  };
  
  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
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
  
  // Determine if a nav link is active
  const isActive = (path: string) => {
    return location.pathname === path ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800";
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <h1 className="font-bold text-lg dark:text-white">Safe Net</h1>
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
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
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
        <SheetContent side="left" className="p-0 dark:bg-gray-800">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <h1 className="font-bold text-lg dark:text-white">Safe Net</h1>
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
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                className="w-full flex items-center justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
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
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <h1 className="font-semibold text-xl lg:hidden dark:text-white">Safe Net</h1>
          
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-sm font-medium dark:text-gray-300">
                {user.email}
              </div>
            )}
            <div className="flex items-center rounded-full bg-gray-100 dark:bg-gray-700 p-1">
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full ${theme === 'light' ? 'bg-white dark:bg-gray-600 text-amber-600 dark:text-amber-400' : ''}`}
                onClick={() => handleThemeChange("light")}
              >
                <Sun className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full ${theme === 'dark' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400' : ''}`}
                onClick={() => handleThemeChange("dark")}
              >
                <Moon className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full ${theme === 'system' ? 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-400' : ''}`}
                onClick={() => handleThemeChange("system")}
              >
                <Monitor className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 p-4 md:p-6 overflow-auto dark:bg-gray-900 dark:text-gray-100"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardLayout;
