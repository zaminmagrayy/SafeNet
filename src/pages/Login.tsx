
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff, Sun, Moon, Monitor } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const { signIn, signUp, user } = useAuth();
  const { theme, setTheme } = useTheme();

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await signIn(email, password);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await signUp(email, password);
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4"
    >
      <Card className="w-full max-w-md border-0 shadow-xl dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-2"
          >
            <Shield className="h-6 w-6 text-purple-600 dark:text-purple-300" />
          </motion.div>
          <CardTitle className="text-2xl font-bold text-center dark:text-white">Welcome to Safe Net</CardTitle>
          <CardDescription className="text-center dark:text-gray-300">
            Sign in to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <motion.form 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleLogin} 
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email-login" className="dark:text-gray-200">Email</Label>
                  <Input 
                    id="email-login" 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password-login" className="dark:text-gray-200">Password</Label>
                    <Link to="/forgot-password" className="text-sm text-purple-600 hover:underline dark:text-purple-400">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input 
                      id="password-login" 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800"
                >
                  Sign In
                </Button>
              </motion.form>
            </TabsContent>
            
            <TabsContent value="signup">
              <motion.form 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSignup} 
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email-signup" className="dark:text-gray-200">Email</Label>
                  <Input 
                    id="email-signup" 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup" className="dark:text-gray-200">Password</Label>
                  <div className="relative">
                    <Input 
                      id="password-signup" 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800"
                >
                  Create Account
                </Button>
              </motion.form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {activeTab === "login" ? (
              <>
                Don't have an account?{" "}
                <Button 
                  type="button" 
                  variant="link" 
                  className="text-purple-600 hover:underline font-medium dark:text-purple-400 p-0"
                  onClick={() => setActiveTab("signup")}
                >
                  Create an account
                </Button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Button 
                  type="button" 
                  variant="link" 
                  className="text-purple-600 hover:underline font-medium dark:text-purple-400 p-0"
                  onClick={() => setActiveTab("login")}
                >
                  Sign in
                </Button>
              </>
            )}
          </div>
          
          {/* Theme Switcher */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full ${theme === 'light' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
              onClick={() => handleThemeChange("light")}
              title="Light Theme"
            >
              <Sun className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full ${theme === 'dark' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
              onClick={() => handleThemeChange("dark")}
              title="Dark Theme"
            >
              <Moon className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full ${theme === 'system' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
              onClick={() => handleThemeChange("system")}
              title="System Theme"
            >
              <Monitor className="h-5 w-5" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default Login;
