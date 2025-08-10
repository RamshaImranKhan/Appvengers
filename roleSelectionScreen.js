import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from './UserContext';
import Storage from '../utils/storage';

const { width, height } = Dimensions.get('window');

export default function RoleSelectionScreen() {
  const { setUserRole } = useUser();
  const [selectedRole, setSelectedRole] = useState(null);

  const handleRoleSelection = async (role) => {
    setSelectedRole(role);
    
    // Save selected role to storage for later use
    try {
      await Storage.setItem('selectedRole', role);
      console.log(`Selected role: ${role}`);
    } catch (error) {
      console.error('Error saving selected role:', error);
    }

    // Navigate to login/signup screen after role selection
    setTimeout(() => {
      router.push('/authChoiceScreen');
    }, 500);
  };

  const roles = [
    {
      id: 'admin',
      title: 'Administrator',
      description: 'Manage users, courses, events, and system settings',
      icon: '👑',
      gradient: ['#667eea', '#764ba2'],
      features: ['User Management', 'Analytics & Reports', 'System Settings', 'Global Announcements']
    },
    {
      id: 'teacher',
      title: 'Teacher',
      description: 'Create courses, host live sessions, and track student progress',
      icon: '👨‍🏫',
      gradient: ['#f093fb', '#f5576c'],
      features: ['Course Creation', 'Live Sessions', 'Progress Tracking', 'Student Communication']
    },
    {
      id: 'student',
      title: 'Student',
      description: 'Learn through courses, attend events, and track your progress',
      icon: '🎓',
      gradient: ['#4facfe', '#00f2fe'],
      features: ['Course Learning', 'Event Participation', 'Progress Tracking', 'Gamification']
    }
  ];

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>Select how you'd like to use LoopVerse App</Text>
          
          <View style={styles.rolesContainer}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.roleCard,
                  selectedRole === role.id && styles.selectedCard
                ]}
                onPress={() => handleRoleSelection(role.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={role.gradient}
                  style={styles.roleGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.roleIcon}>{role.icon}</Text>
                  <Text style={styles.roleTitle}>{role.title}</Text>
                  <Text style={styles.roleDescription}>{role.description}</Text>
                  
                  <View style={styles.featuresContainer}>
                    {role.features.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Text style={styles.featureBullet}>•</Text>
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.footerText}>
            You can change your role anytime in settings
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: height,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
  },
  rolesContainer: {
    width: '100%',
    maxWidth: 400,
  },
  roleCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  selectedCard: {
    transform: [{ scale: 1.02 }],
  },
  roleGradient: {
    padding: 20,
    alignItems: 'center',
  },
  roleIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresContainer: {
    alignItems: 'flex-start',
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureBullet: {
    color: '#fff',
    fontSize: 16,
    marginRight: 8,
  },
  featureText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    flex: 1,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 20,
  },
});
