
import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff, Sun, Moon, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  
  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  // If already logged in, redirect to dashboard or the page they were trying to access
  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
  };

  const onLoginSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      setIsSubmitting(true);
      await signIn(data.email, data.password);
      // Redirect will happen automatically via the Navigate check above after auth state changes
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsSubmitting(false);
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
            
            <AnimatePresence mode="wait">
              <TabsContent value="login" key="login">
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="dark:text-gray-200">Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="name@example.com" 
                                {...field}
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <div className="flex items-center justify-between">
                              <FormLabel className="dark:text-gray-200">Password</FormLabel>
                              <Link to="/forgot-password" className="text-sm text-purple-600 hover:underline dark:text-purple-400">
                                Forgot password?
                              </Link>
                            </div>
                            <div className="relative">
                              <FormControl>
                                <Input 
                                  type={showPassword ? "text" : "password"} 
                                  {...field}
                                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                              </FormControl>
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <><span className="mr-2">Signing In</span><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div></>
                        ) : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                </motion.div>
              </TabsContent>
              
              <TabsContent value="signup" key="signup">
                <motion.div 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-center space-y-4"
                >
                  <div className="p-6">
                    <h3 className="font-medium text-lg dark:text-white">Create a new account</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Fill out the registration form to get started with Safe Net.</p>
                  </div>
                  <Button 
                    asChild
                    className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800"
                  >
                    <Link to="/register">Go to Registration</Link>
                  </Button>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
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
