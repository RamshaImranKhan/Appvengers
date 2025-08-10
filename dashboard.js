import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { courseService, eventService } from '../../services/dataService';

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    myCourses: 0,
    totalStudents: 0,
    upcomingSessions: 0
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      loadTeacherStats(user.id);
    }
  };

  const loadTeacherStats = async (teacherId) => {
    try {
      // Get teacher's courses
      const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', teacherId);
      
      const myCourses = courses?.length || 0;

      // Get total enrolled students across all courses
      let totalStudents = 0;
      if (courses && courses.length > 0) {
        const courseIds = courses.map(c => c.id);
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('*')
          .in('course_id', courseIds);
        totalStudents = enrollments?.length || 0;
      }

      // Get upcoming events/sessions
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('created_by', teacherId)
        .gte('event_date', new Date().toISOString());
      
      const upcomingSessions = events?.length || 0;

      setStats({
        myCourses,
        totalStudents,
        upcomingSessions
      });
    } catch (error) {
      console.error('Error loading teacher stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/loginScreen');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Teacher Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.myCourses}</Text>
          <Text style={styles.statLabel}>My Courses</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalStudents}</Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.upcomingSessions}</Text>
          <Text style={styles.statLabel}>Upcoming Sessions</Text>
        </View>
      </View>

      {/* Teacher Options */}
      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/teacher/courses')}
        >
          <Text style={styles.menuText}>📚 My Courses</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/teacher/students')}
        >
          <Text style={styles.menuText}>👥 Student Progress</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/teacher/sessions')}
        >
          <Text style={styles.menuText}>🎥 Live Sessions</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/teacher/events')}
        >
          <Text style={styles.menuText}>📅 Events</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/teacher/announcements')}
        >
          <Text style={styles.menuText}>📢 Announcements</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/chat')}
        >
          <Text style={styles.menuText}>💬 Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/aiSupport')}
        >
          <Text style={styles.menuText}>🤖 AI Assistant</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutBtn: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 18,
    marginTop: 50,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '48%',
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4F8EF7',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});
