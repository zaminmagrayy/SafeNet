import { useState, useRef } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Eye, EyeOff, Upload, X, User, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }).optional(),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine(val => val === true, { message: "You must agree to the terms" }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false
    }
  });

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

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

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Create the user in Supabase Auth
      const { error: signUpError } = await signUp(
        data.email, 
        data.password, 
        data.fullName,
        data.phone
      );
      
      if (signUpError) {
        throw signUpError;
      }
      
      // No need to navigate as the AuthContext will handle this automatically
      
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Failed to create account");
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
          <CardTitle className="text-2xl font-bold text-center dark:text-white">Create an Account</CardTitle>
          <CardDescription className="text-center dark:text-gray-300">
            Sign up for Safe Net to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex justify-center mb-4">
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
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="dark:text-gray-200">Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
                        {...field}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
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
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="dark:text-gray-200">Phone Number</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type="tel" 
                          placeholder="+1 (555) 123-4567" 
                          {...field}
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white pl-9"
                        />
                      </FormControl>
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="dark:text-gray-200">Password</FormLabel>
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
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="dark:text-gray-200">Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        {...field}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="agreeTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                        id="terms"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300"
                      >
                        I agree to the{" "}
                        <Link to="/terms" className="text-purple-600 hover:underline dark:text-purple-400">
                          terms and conditions
                        </Link>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><span className="mr-2">Creating Account</span><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div></>
                ) : "Create Account"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-purple-600 hover:underline font-medium dark:text-purple-400">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default Register;
