import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Button, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { useUser } from './UserContext';
import Storage from '../utils/storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  const { signIn } = useUser();
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  useEffect(() => {
    // Get the selected role from storage
    const getSelectedRole = async () => {
      try {
        const role = await Storage.getItem('selectedRole');
        if (role) {
          setSelectedRole(role);
        }
      } catch (error) {
        console.error('Error getting selected role:', error);
      }
    };

    getSelectedRole();
  }, []);

  const handleLogin = async () => {
    if (email && password) {
      setLoading(true);
      try {
        // Use UserContext signIn method which handles both Supabase and demo accounts
        console.log('🔄 Starting login process...');
        
        // Add timeout to prevent hanging
        const loginPromise = signIn(email.trim(), password);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Login request timed out')), 15000) // 15 second timeout
        );
        
        const result = await Promise.race([loginPromise, timeoutPromise]);
        
        console.log('📋 Login result:', result);
        
        if (result && result.success && result.user) {
          // Use selected role from role selection screen, fallback to user's stored role
          const userRole = selectedRole || result.user.role || 'student';
          
          console.log('✅ Login successful, navigating to dashboard for role:', userRole);
          
          // Update user role in context to match selected role
          if (selectedRole && selectedRole !== result.user.role) {
            // Store the selected role as the user's role
            await Storage.setItem('loopverse_user_role', selectedRole);
          }
          
          // Navigate based on selected role
          switch (userRole) {
            case 'admin':
              router.replace('/dashboards/adminDashboard');
              break;
            case 'teacher':
              router.replace('/dashboards/teacherDashboard');
              break;
            case 'student':
            default:
              router.replace('/dashboards/studentDashboard');
              break;
          }
          
          Alert.alert('Success', `Welcome back as ${userRole}, ${result.user.name || 'User'}!`);
        } else {
          console.log('❌ Login failed:', result?.error || 'Unknown error');
          
          // Provide more specific error messages
          let errorMessage = result?.error || 'Invalid credentials';
          if (errorMessage.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          } else if (errorMessage.includes('Email not confirmed')) {
            errorMessage = 'Please check your email and confirm your account before logging in.';
          } else if (errorMessage.includes('timeout')) {
            errorMessage = 'Connection timeout. Please check your internet connection and try again.';
          }
          
          Alert.alert('Login Failed', errorMessage);
        }
      } catch (err) {
        console.error('Login error:', err);
        if (err.message.includes('timeout')) {
          Alert.alert('Timeout', 'Login is taking too long. Please check your connection and try again.');
        } else {
          Alert.alert('Error', 'Login failed. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    } else {
      Alert.alert('Missing Information', 'Please enter email and password');
    }
  };

  const handleForgotPassword = async () => {
    if (resetEmail) {
      // For local demo, just show a success message
      Alert.alert(
        'Password Reset', 
        'In a real app, a password reset link would be sent to your email. For demo purposes, use:\n\nDemo accounts:\n• admin@loopverse.com\n• teacher@loopverse.com\n• student@loopverse.com\n\nPassword: password'
      );
      setShowForgot(false);
      setResetEmail('');
    } else {
      Alert.alert('Missing Email', 'Please enter your email');
    }
  };

  return (
    <View style={styles.bg}>
      <View style={styles.card}>
        <Text style={styles.title}>Login to LoopVerse App</Text>
        
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        <Button 
          title={loading ? "Signing in..." : "Login"} 
          onPress={handleLogin} 
          color="#4F8EF7" 
          disabled={loading}
        />
        {/* Sign up link - platform specific navigation */}
        {Platform.OS === 'web' ? (
          <a href="/signupScreen" style={{ ...styles.link, textDecoration: 'none', display: 'block' }}>
            Don't have an account? Sign up
          </a>
        ) : (
          <TouchableOpacity onPress={() => router.push('/signupScreen')}>
            <Text style={styles.link}>Don't have an account? Sign up</Text>
          </TouchableOpacity>
        )}
        {/* Forgot Password functionality inline */}
        {!showForgot ? (
          <TouchableOpacity onPress={() => setShowForgot(true)}>
            <Text style={styles.link}>Forgot Password?</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <TextInput
              placeholder="Enter your email"
              value={resetEmail}
              onChangeText={setResetEmail}
              style={styles.input}
            />
            <Button title="Send Reset Link" onPress={handleForgotPassword} color="#4F8EF7" />
            <TouchableOpacity onPress={() => setShowForgot(false)}>
              <Text style={styles.link}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    minWidth: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
    textAlign: 'center',
  },
  demoBox: {
    backgroundColor: '#e8f4fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4F8EF7',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  demoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    width: 220,
    backgroundColor: '#f9f9f9',
  },
  link: {
    marginTop: 16,
    color: '#4F8EF7',
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 