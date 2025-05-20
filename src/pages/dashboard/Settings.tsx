
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sun, Moon, Monitor, User, Key, Bell, Upload, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { motion } from "framer-motion";

type Theme = "light" | "dark" | "system";

const profileSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters" }),
  confirmPassword: z.string().min(1, { message: "Please confirm your new password" }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

const Settings = () => {
  const [activeTab, setActiveTab] = useState("appearance");
  const { theme, setTheme } = useTheme();
  const { userProfile, updateProfile, updatePassword } = useAuth();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoAnalysis, setAutoAnalysis] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Setup forms
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: userProfile?.full_name || "",
      phone: userProfile?.phone || "",
    }
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });
  
  // Update form when profile data loads
  useEffect(() => {
    if (userProfile) {
      profileForm.reset({
        fullName: userProfile.full_name || "",
        phone: userProfile.phone || "",
      });
      
      if (userProfile.avatar_url) {
        setPhotoPreview(userProfile.avatar_url);
      }
    }
  }, [userProfile, profileForm]);
  
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    toast.success(`Theme changed to ${newTheme} mode`);
  };
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Photo must be less than 5MB");
        return;
      }
      
      // Check file type
      if (!file.type.match('image/(jpeg|jpg|png|gif)')) {
        toast.error("Please upload an image file (JPEG, PNG, GIF)");
        return;
      }
      
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(userProfile?.avatar_url || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      setIsSubmitting(true);
      
      await updateProfile({
        full_name: data.fullName || null,
        phone: data.phone || null,
      }, photoFile);
      
      if (photoFile) {
        setPhotoFile(null);
      }
      
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    try {
      setIsSubmitting(true);
      
      const success = await updatePassword(data.currentPassword, data.newPassword);
      
      if (success) {
        passwordForm.reset();
      }
      
    } catch (error) {
      console.error("Error updating password:", error);
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
      className="max-w-4xl mx-auto"
    >
      <h1 className="text-2xl font-bold mb-6 dark:text-gray-100">Settings</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex gap-4">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    className="flex flex-col items-center gap-2 h-auto py-4 px-6"
                    onClick={() => handleThemeChange("light")}
                  >
                    <Sun className="h-6 w-6" />
                    <span>Light</span>
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    className="flex flex-col items-center gap-2 h-auto py-4 px-6"
                    onClick={() => handleThemeChange("dark")}
                  >
                    <Moon className="h-6 w-6" />
                    <span>Dark</span>
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    className="flex flex-col items-center gap-2 h-auto py-4 px-6"
                    onClick={() => handleThemeChange("system")}
                  >
                    <Monitor className="h-6 w-6" />
                    <span>System</span>
                  </Button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Select a theme preference for the dashboard interface.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Account Tab */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Update your account details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div 
                        className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-purple-300 dark:border-purple-600"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {photoPreview ? (
                          <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                      
                      {photoPreview && (
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon" 
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={removePhoto}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                      
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handlePhotoChange} 
                        className="hidden" 
                        accept="image/*"
                      />
                    </div>
                  </div>
                
                  <FormField
                    control={profileForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your Name" 
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            type="tel" 
                            placeholder="+1 (555) 123-4567" 
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <><span className="mr-2">Updating Profile</span><div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div></>
                    ) : "Update Profile"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <><span className="mr-2">Updating Password</span><div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div></>
                    ) : "Update Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="twoFactorAuth">Enable Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive a code via email whenever you sign in.
                  </p>
                </div>
                <Switch 
                  id="twoFactorAuth" 
                  checked={twoFactorAuth}
                  onCheckedChange={setTwoFactorAuth}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Control how and when you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive email notifications for flagged content.
                  </p>
                </div>
                <Switch 
                  id="emailNotifications" 
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="autoAnalysis">Automatic Analysis</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Automatically analyze content when uploaded.
                  </p>
                </div>
                <Switch 
                  id="autoAnalysis" 
                  checked={autoAnalysis}
                  onCheckedChange={setAutoAnalysis}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default Settings;
