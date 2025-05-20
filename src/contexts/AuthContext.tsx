import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useTheme } from "./ThemeContext";
import { Profile } from "@/types/database";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  userProfile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<Profile>, avatarFile?: File | null) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        setUserProfile(data as Profile);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  useEffect(() => {
    // Handle the hash fragment for authentication
    const handleAuthFromHash = async () => {
      const hasHashParams = location.hash && location.hash.length > 0;
      
      if (hasHashParams) {
        try {
          // Using parseFragmentFromUrl instead of getSessionFromUrl
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.error("Error getting session:", error);
            toast.error("Authentication error. Please try again.");
          } else if (data?.session) {
            // Successfully got session
            setSession(data.session);
            setUser(data.session.user);
            
            if (data.session.user) {
              setTimeout(() => {
                fetchUserProfile(data.session.user.id);
                navigate('/dashboard', { replace: true });
              }, 0);
            }
            
            toast.success("Authentication successful!");
          }
        } catch (err) {
          console.error("Error processing auth callback:", err);
        }
      }
    };
    
    handleAuthFromHash();
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change event:", event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Get theme from localStorage after sign in
          setTimeout(() => {
            fetchUserProfile(session.user.id);
            navigate('/dashboard');
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setUserProfile(null);
          setTimeout(() => {
            navigate('/login');
          }, 0);
        } else if (event === 'USER_UPDATED' && session?.user) {
          // Refresh user profile when user is updated
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, location]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        if (error.message.includes("Email not confirmed")) {
          // Special handling for unconfirmed emails
          toast.error("Your email is not confirmed. Please check your inbox for a confirmation link or try resending the confirmation.");
        } else {
          toast.error(error.message || "Failed to sign in");
        }
        throw error;
      }
      
      toast.success("Signed in successfully!");
    } catch (error: any) {
      // Error is already handled above
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    try {
      setLoading(true);
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || '',
            theme: theme // Save the current theme
          },
          emailRedirectTo: window.location.origin,
        }
      });
      
      if (error) {
        toast.error(error.message || "Failed to create account");
        return { error };
      }
      
      if (data.user && !data.user.confirmed_at) {
        // Email confirmation is required - show appropriate message
        toast.info("Account created! Please check your email to confirm your registration before signing in.", {
          duration: 6000,
        });
        
        // Navigate to login page after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        
        return { error: null };
      } else if (data.session) {
        // User is already signed in (email confirmation not required)
        toast.success("Account created successfully!");
        return { error: null };
      } else {
        // Attempt to sign in automatically if no confirmation required
        try {
          await signIn(email, password);
        } catch (signInError) {
          // If auto sign-in fails, direct to login page
          setTimeout(() => {
            navigate('/login');
          }, 1000);
        }
        return { error: null };
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profile: Partial<Profile>, avatarFile?: File | null) => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Prepare profile update
      const updates: Partial<Profile> = {
        ...profile,
        updated_at: new Date().toISOString(),
        id: user.id // Include ID to fix TypeScript error
      };
      
      // Handle avatar upload if provided
      if (avatarFile) {
        // Upload the file to the storage
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('avatars')
          .upload(filePath, avatarFile, {
            upsert: true
          });
          
        if (uploadError) {
          throw uploadError;
        }
        
        // Get the public URL
        const { data } = supabase
          .storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        // Add avatar URL to the updates
        updates.avatar_url = data.publicUrl;
      }
      
      // Update the profile
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      // Refresh the profile data
      await fetchUserProfile(user.id);
      
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      if (!user || !user.email) {
        throw new Error("User not authenticated");
      }
      
      // First, verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });
      
      if (signInError) {
        toast.error("Current password is incorrect");
        return false;
      }
      
      // Then update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Password updated successfully");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        session, 
        userProfile,
        signIn, 
        signUp, 
        signOut, 
        updateProfile,
        updatePassword,
        loading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
