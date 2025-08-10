import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemedView, ThemedText, ThemedCard } from '../../components/ThemedView';
import Storage from '../../utils/storage';
import { useUser } from '../UserContext';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const { user, signOut } = useUser();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalCourses: 0,
    engagement: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      console.log('📊 Loading admin dashboard statistics...');
      setLoading(true);

      // Load total users count
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Load total events count
      const { count: eventsCount, error: eventsError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // Load total courses count
      const { count: coursesCount, error: coursesError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });

      // Calculate engagement (example: active users in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeUsersCount, error: activeError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', thirtyDaysAgo.toISOString());

      const totalUsers = usersCount || 0;
      const engagementRate = totalUsers > 0 ? Math.round((activeUsersCount || 0) / totalUsers * 100) : 0;

      setStats({
        totalUsers: totalUsers,
        totalEvents: eventsCount || 0,
        totalCourses: coursesCount || 0,
        engagement: engagementRate
      });

      console.log('✅ Dashboard stats loaded:', {
        users: totalUsers,
        events: eventsCount || 0,
        courses: coursesCount || 0,
        engagement: engagementRate
      });

    } catch (error) {
      console.error('❌ Error loading dashboard stats:', error);
      // Keep stats at 0 instead of showing demo data
      setStats({
        totalUsers: 0,
        totalEvents: 0,
        totalCourses: 0,
        engagement: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const dashboardItems = [
    {
      id: 'users',
      title: 'Manage Users',
      description: 'View and manage all users',
      icon: '👥',
      color: ['#667eea', '#764ba2'],
      route: '/admin/manageUsers'
    },
    {
      id: 'courses',
      title: 'Courses & Materials',
      description: 'Manage courses and learning content',
      icon: '📚',
      color: ['#f093fb', '#f5576c'],
      route: '/admin/manageCourses'
    },
    {
      id: 'events',
      title: 'Events Management',
      description: 'Create and manage events',
      icon: '📅',
      color: ['#4facfe', '#00f2fe'],
      route: '/admin/manageEvents'
    },
    {
      id: 'announcements',
      title: 'Announcements',
      description: 'Post global announcements',
      icon: '📢',
      color: ['#43e97b', '#38f9d7'],
      route: '/shared/announcements'
    },
    {
      id: 'communication',
      title: 'Communication',
      description: 'Chat with users and groups',
      icon: '💬',
      color: ['#fa709a', '#fee140'],
      route: '/shared/communication'
    },
    {
      id: 'analytics',
      title: 'Analytics & Reports',
      description: 'View detailed reports and charts',
      icon: '📊',
      color: ['#a8edea', '#fed6e3'],
      route: '/admin/analytics'
    },
    {
      id: 'chatbot',
      title: 'AI Chatbot',
      description: 'Test and manage AI assistant',
      icon: '🤖',
      color: ['#d299c2', '#fef9d7'],
      route: '/admin/aiChatbot'
    },
    {
      id: 'settings',
      title: 'App Settings',
      description: 'Manage themes and branding',
      icon: '⚙️',
      color: ['#89f7fe', '#66a6ff'],
      route: '/admin/appSettings'
    }
  ];

  const handleNavigation = (route) => {
    router.push(route);
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/roleSelectionScreen')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to Role Selection</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.welcomeText}>Welcome back, Admin!</Text>
            <Text style={styles.emailText}>{user?.email}</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Dashboard Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {loading ? '...' : stats.totalUsers}
              </Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {loading ? '...' : stats.totalEvents}
              </Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {loading ? '...' : stats.totalCourses}
              </Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {loading ? '...' : `${stats.engagement}%`}
              </Text>
              <Text style={styles.statLabel}>Engagement</Text>
            </View>
          </View>
        </View>

        {/* Management Options */}
        <View style={styles.managementContainer}>
          <Text style={styles.sectionTitle}>Management Tools</Text>
          <View style={styles.itemsGrid}>
            {dashboardItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.managementItem}
                onPress={() => handleNavigation(item.route)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={item.color}
                  style={styles.itemGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.itemIcon}>{item.icon}</Text>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  emailText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    width: (width - 60) / 2,
    marginBottom: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  managementContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  managementItem: {
    width: (width - 60) / 2,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  itemGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  itemIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 16,
  },
});
