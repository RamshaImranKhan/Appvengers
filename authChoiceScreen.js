import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Storage from '../utils/storage';

const { width, height } = Dimensions.get('window');

export default function AuthChoiceScreen() {
  const [selectedRole, setSelectedRole] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

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

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getRoleInfo = (role) => {
    const roleInfo = {
      admin: { title: 'Administrator', icon: '👑', color: ['#667eea', '#764ba2'] },
      teacher: { title: 'Teacher', icon: '👨‍🏫', color: ['#f093fb', '#f5576c'] },
      student: { title: 'Student', icon: '🎓', color: ['#4facfe', '#00f2fe'] }
    };
    return roleInfo[role] || { title: 'User', icon: '👤', color: ['#667eea', '#764ba2'] };
  };

  const handleAuthChoice = (authType) => {
    if (authType === 'login') {
      router.push('/loginScreen');
    } else {
      router.push('/signupScreen');
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const roleInfo = getRoleInfo(selectedRole);

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Role Display */}
        <View style={styles.roleDisplay}>
          <Text style={styles.roleIcon}>{roleInfo.icon}</Text>
          <Text style={styles.roleTitle}>Continue as {roleInfo.title}</Text>
          <Text style={styles.roleSubtitle}>Choose how you'd like to proceed</Text>
        </View>

        {/* Auth Options */}
        <View style={styles.authContainer}>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => handleAuthChoice('login')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={roleInfo.color}
              style={styles.authGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.authIcon}>🚀</Text>
              <Text style={styles.authButtonText}>Login</Text>
              <Text style={styles.authButtonSubtext}>I already have an account</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.authButton}
            onPress={() => handleAuthChoice('signup')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              style={styles.authGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.authIcon}>✨</Text>
              <Text style={styles.authButtonText}>Sign Up</Text>
              <Text style={styles.authButtonSubtext}>Create a new account</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Change Role</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 400,
  },
  roleDisplay: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 24,
    backdropFilter: 'blur(10px)',
  },
  roleIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  roleTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  authContainer: {
    width: '100%',
    marginBottom: 30,
  },
  authButton: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  authGradient: {
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  authIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  authButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  authButtonSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
