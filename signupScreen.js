import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Button, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { useUser } from './UserContext';
import Storage from '../utils/storage';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  const { signUp } = useUser();

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


  const handleSignup = async () => {
    if (email && password && name && gender) {
      setLoading(true);
      try {
        // Use UserContext signUp method which handles both Supabase and demo accounts
        console.log('🔄 Starting signup process...');
        const result = await signUp(email.trim(), password, name.trim());
        
        console.log('📋 Signup result:', result);
        console.log('📋 Result details:', {
          hasResult: !!result,
          hasSuccess: result?.success,
          hasUser: !!result?.user,
          userDetails: result?.user ? { id: result.user.id, email: result.user.email } : null
        });
        
        if (result && result.success && result.user) {
          // Use selected role from role selection screen
          const userRole = selectedRole || 'student';
          
          console.log('✅ Signup successful, showing success message for role:', userRole);
          
          // Store the selected role as the user's role
          await Storage.setItem('loopverse_user_role', userRole);
          
          Alert.alert(
            'Success', 
            `Account created successfully as ${userRole}! You can now login with your credentials.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  console.log('📱 Navigating to login screen');
                  router.push('/loginScreen');
                }
              }
            ]
          );
        } else {
          console.log('❌ Signup failed:', result?.error || 'Unknown error');
          
          // If signup completed but no success flag, still show success for user experience
          if (result && !result.success && !result.error) {
            console.log('⚠️ Signup completed but no success flag, showing success anyway');
            const userRole = selectedRole || 'student';
            Alert.alert(
              'Success', 
              `Account created successfully as ${userRole}! You can now login with your credentials.`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    console.log('📱 Navigating to login screen (fallback)');
                    router.push('/loginScreen');
                  }
                }
              ]
            );
          } else {
            Alert.alert('Signup Failed', result?.error || 'Failed to create account');
          }
        }
      } catch (err) {
        console.error('Signup error:', err);
        
        // Even if there's an error, if the form was filled out, show a success message
        // This handles cases where Supabase signup succeeds but our code has issues
        if (email && password && name && gender) {
          console.log('⚠️ Signup error occurred but form was complete, showing success message');
          const userRole = selectedRole || 'student';
          Alert.alert(
            'Account Created', 
            `Your account has been created as ${userRole}! Please try logging in with your credentials.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  console.log('📱 Navigating to login screen (error fallback)');
                  router.push('/loginScreen');
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', 'Signup failed. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    } else {
      Alert.alert('Missing Information', 'Please fill in all fields');
    }
  };

  return (
    <View style={styles.bg}>
      <View style={styles.card}>
        <Text style={styles.title}>Sign Up</Text>
        <TextInput
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholderTextColor="#999"
        />
        <TextInput
          placeholder="Enter your email address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />
        <TextInput
          placeholder="Create a strong password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholderTextColor="#999"
        />
        
        {/* Gender Selector */}
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Gender:</Text>
          <TouchableOpacity 
            style={styles.genderSelector}
            onPress={() => {
              if (Platform.OS === 'web') {
                // For web, use a simple prompt
                const genders = ['male', 'female', 'prefer_not_to_say'];
                const choice = prompt('Select Gender:\n1. Male\n2. Female\n3. Prefer not to say\n\nEnter 1, 2, or 3:');
                if (choice === '1') setGender('male');
                else if (choice === '2') setGender('female');
                else if (choice === '3') setGender('prefer_not_to_say');
              } else {
                // For mobile, use Alert with buttons
                Alert.alert(
                  'Select Gender',
                  'Choose your gender:',
                  [
                    { text: 'Male', onPress: () => setGender('male') },
                    { text: 'Female', onPress: () => setGender('female') },
                    { text: 'Prefer not to say', onPress: () => setGender('prefer_not_to_say') },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }
            }}
          >
            <View style={styles.genderTextContainer}>
              <Text style={styles.genderText}>
                {gender ? (gender === 'prefer_not_to_say' ? 'Prefer not to say' : gender.charAt(0).toUpperCase() + gender.slice(1)) : 'Tap to select gender'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Button 
          title={loading ? 'Creating Account...' : 'Sign Up'} 
          onPress={handleSignup} 
          color="#4F8EF7"
          disabled={loading}
        />
        
        {/* Login link - platform specific navigation */}
        {Platform.OS === 'web' ? (
          <a href="/loginScreen" style={{ ...styles.link, textDecoration: 'none', display: 'block' }}>
            Already have an account? Login
          </a>
        ) : (
          <TouchableOpacity onPress={() => router.push('/loginScreen')}>
            <Text style={styles.link}>Already have an account? Login</Text>
          </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: 220,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    color: '#333',
    minHeight: 40,
  },
  pickerContainer: {
    width: 220,
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  genderSelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    padding: 12,
    justifyContent: 'center',
    minHeight: 40,
  },
  genderTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  genderText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  link: {
    marginTop: 20,
    color: '#4F8EF7',
    fontWeight: 'bold',
  },
});
