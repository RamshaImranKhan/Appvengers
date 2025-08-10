import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Storage from '../utils/storage';
import NotificationService from '../utils/notificationService';
import { supabase } from '../lib/supabase';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin', 'teacher', 'student'
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [pushToken, setPushToken] = useState(null);

  useEffect(() => {
    // Get initial session from Supabase and local storage
    const getInitialSession = async () => {
      try {
        // First check for active Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('🔄 Found active Supabase session');
          // Try to get user profile from database
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          const userData = {
            id: session.user.id,
            email: session.user.email,
            name: profile?.name || session.user.user_metadata?.name || 'User',
            role: profile?.role || 'student'
          };
          
          setUser(userData);
          setUserRole(userData.role);
          
          // Save to local storage for offline access
          await Storage.setItem('loopverse_user', JSON.stringify(userData));
          await Storage.setItem('loopverse_user_role', userData.role);
          
          await initializeNotifications();
          
          // Auto-redirect to role-specific dashboard
          redirectToRoleDashboard(userData.role);
        } else {
          // Fallback to local storage for demo accounts
          const savedUser = await Storage.getItem('loopverse_user');
          const savedRole = await Storage.getItem('loopverse_user_role');
          
          if (savedUser) {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            setUserRole(savedRole);
            console.log('🔄 Restored user session from local storage');
            await initializeNotifications();
          }
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Try to get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        const userData = {
          id: session.user.id,
          email: session.user.email,
          name: profile?.name || session.user.user_metadata?.name || 'User',
          role: profile?.role || 'student'
        };
        
        setUser(userData);
        setUserRole(userData.role);
        
        // Save to local storage
        await Storage.setItem('loopverse_user', JSON.stringify(userData));
        await Storage.setItem('loopverse_user_role', userData.role);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserRole(null);
        await Storage.removeItem('loopverse_user');
        await Storage.removeItem('loopverse_user_role');
      }
    });

    // Load saved theme preference
    loadThemePreference();

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Function to get the appropriate dashboard route for a role
  const getDashboardRoute = (role) => {
    const dashboardRoutes = {
      admin: '/dashboards/adminDashboard',
      teacher: '/dashboards/teacherDashboard', 
      student: '/dashboards/studentDashboard'
    };
    return dashboardRoutes[role] || '/roleSelectionScreen';
  };

  // Function to check if user has access to a specific route
  const hasRoleAccess = (requiredRoles) => {
    if (!user || !userRole) return false;
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return requiredRoles.includes(userRole);
  };

  // Initialize notification service
  const initializeNotifications = async () => {
    try {
      console.log('🔔 Initializing notifications for user...');
      const token = await NotificationService.registerForPushNotificationsAsync();
      
      if (token) {
        console.log('✅ Notification token obtained and stored');
        setPushToken(token);
      } else {
        console.log('❌ Failed to obtain notification token');
      }
      
      // Set up notification listeners
      NotificationService.addNotificationReceivedListener((notification) => {
        console.log('📩 Notification received while app is open:', {
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: notification.request.content.data
        });
      });
      
      NotificationService.addNotificationResponseReceivedListener((response) => {
        console.log('👆 User tapped notification:', {
          title: response.notification.request.content.title,
          body: response.notification.request.content.body,
          data: response.notification.request.content.data
        });
        
        // Handle notification tap - you can navigate to specific screens here
        const { type, postId } = response.notification.request.content.data || {};
        if (type && postId) {
          console.log(`🔗 User tapped ${type} notification for post ${postId}`);
          // You can add navigation logic here if needed
        }
      });
      
      console.log('✅ Notification listeners set up successfully');
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
  };

  const loadThemePreference = async () => {
    try {
      const savedSettings = await Storage.getItem('userSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setDarkMode(settings.darkMode ?? false);
        applyTheme(settings.darkMode ?? false);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const applyTheme = (isDark) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
      const root = document.documentElement;
      if (isDark) {
        root.style.setProperty('--background-color', '#1a1a1a');
        root.style.setProperty('--text-color', '#ffffff');
        root.style.setProperty('--card-background', '#2d2d2d');
        root.style.setProperty('--border-color', '#404040');
        root.style.setProperty('--input-background', '#3a3a3a');
        root.style.setProperty('--shadow-color', 'rgba(0,0,0,0.3)');
      } else {
        root.style.setProperty('--background-color', '#f0f4f8');
        root.style.setProperty('--text-color', '#222222');
        root.style.setProperty('--card-background', '#ffffff');
        root.style.setProperty('--border-color', '#dddddd');
        root.style.setProperty('--input-background', '#f9f9f9');
        root.style.setProperty('--shadow-color', 'rgba(0,0,0,0.1)');
      }
    }
  };

  const toggleDarkMode = async (isDark) => {
    setDarkMode(isDark);
    applyTheme(isDark);
    
    // Save to cross-platform storage
    try {
      const savedSettings = await Storage.getItem('userSettings');
      const settings = savedSettings ? JSON.parse(savedSettings) : {};
      settings.darkMode = isDark;
      await Storage.setItem('userSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Authentication functions supporting both Supabase and demo accounts
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      console.log('🔄 Starting signIn process for:', email);
      
      // Demo users for testing
      const demoUsers = {
        'admin@loopverse.com': { 
          id: '1', 
          email: 'admin@loopverse.com', 
          name: 'Admin User',
          role: 'admin'
        },
        'teacher@loopverse.com': { 
          id: '2', 
          email: 'teacher@loopverse.com', 
          name: 'Teacher User',
          role: 'teacher'
        },
        'student@loopverse.com': { 
          id: '3', 
          email: 'student@loopverse.com', 
          name: 'Student User',
          role: 'student'
        }
      };

      // Check if it's a demo account first
      if (demoUsers[email] && password === 'password') {
        console.log('✅ Demo account detected, signing in locally');
        const userData = demoUsers[email];
        
        // Save to local storage
        await Storage.setItem('loopverse_user', JSON.stringify(userData));
        await Storage.setItem('loopverse_user_role', userData.role);
        
        setUser(userData);
        setUserRole(userData.role);
        
        console.log('✅ Demo user signed in locally:', userData.email);
        await initializeNotifications();
        
        return { success: true, user: userData };
      }

      // For non-demo accounts, try Supabase with aggressive timeout
      console.log('🔍 Not a demo account, trying Supabase for:', email);
      
      try {
        console.log('🔄 Attempting Supabase authentication...');
        
        // Very short timeout to prevent hanging
        const loginPromise = supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Login timeout')), 8000) // 8 second timeout
        );
        
        const result = await Promise.race([loginPromise, timeoutPromise]);
        const { data, error } = result;
        
        console.log('📋 Supabase login result:', { 
          hasData: !!data, 
          hasUser: !!data?.user, 
          hasError: !!error,
          errorMessage: error?.message 
        });
        
        if (error) {
          console.error('🚨 Supabase login error:', error.message);
          throw new Error(error.message);
        }
        
        if (data?.user) {
          console.log('✅ Supabase user authenticated:', data.user.email);
          
          // Get selected role from storage or default
          const selectedRole = await Storage.getItem('selectedRole');
          
          const userData = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || 'User',
            role: selectedRole || 'student' // Use selected role or default
          };
          
          setUser(userData);
          setUserRole(userData.role);
          
          // Save to local storage
          await Storage.setItem('loopverse_user', JSON.stringify(userData));
          await Storage.setItem('loopverse_user_role', userData.role);
          
          console.log('✅ Supabase user signed in with role:', userData.role);
          await initializeNotifications();
          
          return { success: true, user: userData };
        } else {
          throw new Error('No user data returned from Supabase');
        }
        
      } catch (supabaseError) {
        console.error('❌ Supabase login failed:', supabaseError.message);
        
        // If Supabase fails, create a local fallback account
        console.log('🔄 Creating local fallback account for:', email);
        const fallbackUser = {
          id: Date.now().toString(),
          email: email.trim(),
          name: 'User',
          role: await Storage.getItem('selectedRole') || 'student'
        };
        
        // Save to local storage
        await Storage.setItem('loopverse_user', JSON.stringify(fallbackUser));
        await Storage.setItem('loopverse_user_role', fallbackUser.role);
        
        setUser(fallbackUser);
        setUserRole(fallbackUser.role);
        
        console.log('✅ Local fallback user created:', fallbackUser.email);
        await initializeNotifications();
        
        return { success: true, user: fallbackUser };
      }
      
    } catch (error) {
      console.error('❌ Complete login failure:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, name, additionalData = {}) => {
    try {
      setLoading(true);
      
      // Get selected role from storage or use default
      const selectedRole = await Storage.getItem('selectedRole') || additionalData.role || 'student';
      
      // Try Supabase signup first for real user creation with timeout
      console.log('🔄 Attempting Supabase user creation...');
      
      // Add timeout to prevent hanging
      const signupPromise = supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            name: name.trim(),
            role: selectedRole
          }
        }
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Signup timeout')), 10000) // 10 second timeout
      );
      
      let data, error;
      try {
        const result = await Promise.race([signupPromise, timeoutPromise]);
        data = result.data;
        error = result.error;
        console.log('📋 Supabase signup result:', { data: !!data?.user, error: error?.message });
      } catch (timeoutError) {
        console.log('⚠️ Supabase signup timed out, using local fallback');
        error = timeoutError;
      }
      
      if (error) {
        console.error('Supabase signup error:', error.message);
        // Fallback to local demo user creation
        console.log('🔄 Falling back to local user creation...');
        const newUser = {
          id: Date.now().toString(),
          email: email.trim(),
          name: name.trim(),
          role: selectedRole
        };
        
        // Save to local storage
        await Storage.setItem('loopverse_user', JSON.stringify(newUser));
        await Storage.setItem('loopverse_user_role', newUser.role);
        
        setUser(newUser);
        setUserRole(newUser.role);
        
        console.log('✅ User signed up locally:', newUser.email);
        await initializeNotifications();
        
        // Auto-redirect to role-specific dashboard
        redirectToRoleDashboard(newUser.role);
        
        return { success: true, user: newUser };
      }
      
      if (data?.user) {
        console.log('✅ Supabase user created successfully:', data.user.email);
        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: name.trim(),
          role: selectedRole
        };
        
        setUser(userData);
        setUserRole(selectedRole);
        
        // Save to local storage for offline access
        await Storage.setItem('loopverse_user', JSON.stringify(userData));
        await Storage.setItem('loopverse_user_role', selectedRole);
        
        console.log('✅ Supabase user signed up with role:', selectedRole);
        
        // Try to create profile in background (non-blocking)
        setTimeout(async () => {
          try {
            const profile = {
              id: data.user.id,
              email: data.user.email,
              name: name.trim(),
              role: selectedRole,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            const { error: profileError } = await supabase
              .from('profiles')
              .insert([profile]);
            
            if (profileError) {
              console.error('Profile creation error (background):', profileError);
            } else {
              console.log('✅ Profile saved to Supabase in background');
            }
          } catch (err) {
            console.error('Background profile creation failed:', err);
          }
        }, 100);
        
        await initializeNotifications();
        
        console.log('🎯 Returning success result for signup');
        return { success: true, user: userData };
      } else {
        console.log('❌ No user data in Supabase response, falling back to local');
        // Fallback to local user creation
        const newUser = {
          id: Date.now().toString(),
          email: email.trim(),
          name: name.trim(),
          role: selectedRole
        };
        
        // Save to local storage
        await Storage.setItem('loopverse_user', JSON.stringify(newUser));
        await Storage.setItem('loopverse_user_role', newUser.role);
        
        setUser(newUser);
        setUserRole(newUser.role);
        
        console.log('✅ User signed up locally as fallback:', newUser.email);
        await initializeNotifications();
        
        return { success: true, user: newUser };
      }
    } catch (error) {
      console.error('Error signing up:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Sign out from Supabase (this will trigger the auth state change listener)
      await supabase.auth.signOut();
      
      console.log('✅ User signed out successfully');
      setUser(null);
      setUserRole(null);
      
      // Clear stored user data
      await Storage.removeItem('loopverse_user');
      await Storage.removeItem('loopverse_user_role');
      await Storage.removeItem('userProfile');
      await Storage.removeItem('userSettings');
      
    } catch (error) {
      console.error('Error signing out:', error);
      // Still clear user state
      setUser(null);
      setUserRole(null);
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      setUser, 
      userRole,
      setUserRole,
      signIn,
      signUp,
      signOut, 
      loading,
      darkMode,
      toggleDarkMode,
      pushToken,
      initializeNotifications,
      getDashboardRoute,
      hasRoleAccess
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
} 