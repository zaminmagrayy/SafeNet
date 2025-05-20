
import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { User, Upload, X, Eye, EyeOff, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const profileSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { userProfile, updateProfile, updatePassword } = useAuth();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(userProfile?.avatar_url || null);
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: userProfile?.full_name || "",
      phone: userProfile?.phone || "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update the form when userProfile changes
  useState(() => {
    if (userProfile) {
      profileForm.reset({
        fullName: userProfile.full_name || "",
        phone: userProfile.phone || "",
      });
      setPhotoPreview(userProfile.avatar_url);
    }
  });

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
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      setIsUpdatingProfile(true);
      await updateProfile({
        full_name: data.fullName,
        phone: data.phone || null,
      }, photoFile);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    try {
      setIsUpdatingPassword(true);
      const success = await updatePassword(data.currentPassword, data.newPassword);
      if (success) {
        passwordForm.reset();
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <h1 className="text-3xl font-bold mb-8 dark:text-gray-200">Account Settings</h1>

      <Tabs defaultValue="profile" className="w-full max-w-4xl mx-auto">
        <TabsList className="mb-8 w-full justify-start">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="profile" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your account information and profile picture
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            <div 
                              className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-purple-300 dark:border-purple-600"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              {photoPreview ? (
                                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                <User className="h-16 w-16 text-gray-400 dark:text-gray-500" />
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
                          <p className="text-sm text-gray-500 mt-2 dark:text-gray-400">
                            Click to upload a profile picture
                          </p>
                        </div>

                        <div className="flex-1 space-y-4">
                          <FormField
                            control={profileForm.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel className="dark:text-gray-200">Full Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="John Doe"
                                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                                    {...field} 
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
                                <FormLabel className="dark:text-gray-200">Phone Number</FormLabel>
                                <div className="relative">
                                  <FormControl>
                                    <Input 
                                      type="tel" 
                                      placeholder="+1 (555) 123-4567"
                                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white pl-9" 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end mt-6">
                        <Button 
                          type="submit" 
                          className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800"
                          disabled={isUpdatingProfile}
                        >
                          {isUpdatingProfile ? (
                            <><span className="mr-2">Saving</span><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div></>
                          ) : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="password" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
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
                            <FormLabel className="dark:text-gray-200">Current Password</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input 
                                  type={showPassword ? "text" : "password"} 
                                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                  {...field} 
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

                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="dark:text-gray-200">New Password</FormLabel>
                            <FormControl>
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                            <FormLabel className="dark:text-gray-200">Confirm New Password</FormLabel>
                            <FormControl>
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end mt-6">
                        <Button 
                          type="submit" 
                          className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800"
                          disabled={isUpdatingPassword}
                        >
                          {isUpdatingPassword ? (
                            <><span className="mr-2">Updating</span><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div></>
                          ) : "Update Password"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="theme" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Theme Settings</CardTitle>
                  <CardDescription>
                    Customize the appearance of your dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium dark:text-gray-200">Color Theme</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Choose how Safe Net looks to you. Select a color theme.
                    </p>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div 
                        className={`border p-4 rounded-lg flex flex-col items-center cursor-pointer transition-colors ${theme === 'light' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                        onClick={() => setTheme('light')}
                      >
                        <div className="w-full h-24 bg-white border border-gray-200 rounded-md mb-4 flex items-center justify-center">
                          <div className="w-3/4 h-3 bg-gray-100 rounded"></div>
                        </div>
                        <span className="text-sm font-medium dark:text-gray-200">Light</span>
                      </div>
                      
                      <div 
                        className={`border p-4 rounded-lg flex flex-col items-center cursor-pointer transition-colors ${theme === 'dark' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                        onClick={() => setTheme('dark')}
                      >
                        <div className="w-full h-24 bg-gray-900 border border-gray-700 rounded-md mb-4 flex items-center justify-center">
                          <div className="w-3/4 h-3 bg-gray-800 rounded"></div>
                        </div>
                        <span className="text-sm font-medium dark:text-gray-200">Dark</span>
                      </div>
                      
                      <div 
                        className={`border p-4 rounded-lg flex flex-col items-center cursor-pointer transition-colors ${theme === 'system' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                        onClick={() => setTheme('system')}
                      >
                        <div className="w-full h-24 bg-gradient-to-r from-white to-gray-900 border border-gray-200 rounded-md mb-4 flex items-center justify-center">
                          <div className="w-3/4 h-3 bg-gradient-to-r from-gray-100 to-gray-800 rounded"></div>
                        </div>
                        <span className="text-sm font-medium dark:text-gray-200">System</span>
                      </div>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Your theme preference will be saved and applied across all your sessions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  );
};

export default Settings;
