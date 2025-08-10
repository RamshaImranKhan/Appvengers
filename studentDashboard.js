import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../UserContext';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function StudentDashboard() {
  const { user, signOut } = useUser();
  const [stats, setStats] = useState({
    enrolledCourses: 5,
    completedVideos: 42,
    upcomingEvents: 2,
    badges: 8,
    leaderboardPosition: 15
  });

  const dashboardItems = [
    {
      id: 'learning',
      title: 'Learning Section',
      description: 'Browse and watch courses',
      icon: '📚',
      color: ['#667eea', '#764ba2'],
      route: '/student/learning'
    },
    {
      id: 'progress',
      title: 'My Progress',
      description: 'Track your learning journey',
      icon: '📈',
      color: ['#f093fb', '#f5576c'],
      route: '/student/progress'
    },
    {
      id: 'events',
      title: 'Events',
      description: 'Join LoopLab events',
      icon: '📅',
      color: ['#4facfe', '#00f2fe'],
      route: '/student/events'
    },
    {
      id: 'communication',
      title: 'Communication',
      description: 'Chat with teachers and peers',
      icon: '💬',
      color: ['#43e97b', '#38f9d7'],
      route: '/shared/communication'
    },
    {
      id: 'announcements',
      title: 'Announcements',
      description: 'Latest updates and news',
      icon: '📢',
      color: ['#fa709a', '#fee140'],
      route: '/shared/announcements'
    },
    {
      id: 'gamification',
      title: 'Badges & Leaderboard',
      description: 'View achievements and rankings',
      icon: '🏆',
      color: ['#a8edea', '#fed6e3'],
      route: '/student/gamification'
    },
    {
      id: 'support',
      title: 'AI Support',
      description: 'Get help from AI chatbot',
      icon: '🤖',
      color: ['#d299c2', '#fef9d7'],
      route: '/student/aiSupport'
    },
    {
      id: 'profile',
      title: 'My Profile',
      description: 'Edit profile and settings',
      icon: '👤',
      color: ['#89f7fe', '#66a6ff'],
      route: '/student/profile'
    }
  ];

  const recentCourses = [
    { id: 1, title: 'React Native Fundamentals', progress: 75, nextVideo: 'State Management' },
    { id: 2, title: 'JavaScript ES6+', progress: 45, nextVideo: 'Async/Await' },
    { id: 3, title: 'Mobile UI Design', progress: 90, nextVideo: 'Final Project' }
  ];

  const upcomingEvents = [
    { id: 1, title: 'Tech Workshop', date: 'Tomorrow', time: '2:00 PM' },
    { id: 2, title: 'Career Fair', date: 'Friday', time: '10:00 AM' }
  ];

  const handleNavigation = (route) => {
    router.push(route);
  };

  return (
    <LinearGradient
      colors={['#4facfe', '#00f2fe']}
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
            <Text style={styles.welcomeText}>Welcome, Student!</Text>
            <Text style={styles.emailText}>{user?.email}</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Learning Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.enrolledCourses}</Text>
              <Text style={styles.statLabel}>Enrolled Courses</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.completedVideos}</Text>
              <Text style={styles.statLabel}>Videos Watched</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.badges}</Text>
              <Text style={styles.statLabel}>Badges Earned</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>#{stats.leaderboardPosition}</Text>
              <Text style={styles.statLabel}>Leaderboard</Text>
            </View>
          </View>
        </View>

        {/* Continue Learning */}
        <View style={styles.coursesContainer}>
          <Text style={styles.sectionTitle}>Continue Learning</Text>
          {recentCourses.map((course) => (
            <View key={course.id} style={styles.courseCard}>
              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.nextVideo}>Next: {course.nextVideo}</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{course.progress}%</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.continueButton}>
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Upcoming Events */}
        <View style={styles.eventsContainer}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {upcomingEvents.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventTime}>{event.date} at {event.time}</Text>
              </View>
              <TouchableOpacity style={styles.registerButton}>
                <Text style={styles.registerButtonText}>Register</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Learning Tools */}
        <View style={styles.managementContainer}>
          <Text style={styles.sectionTitle}>Learning Tools</Text>
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
  coursesContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  courseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  nextVideo: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  continueButtonText: {
    color: '#4facfe',
    fontWeight: '600',
    fontSize: 12,
  },
  eventsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  eventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  eventTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  registerButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  registerButtonText: {
    color: '#4facfe',
    fontWeight: '600',
    fontSize: 12,
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
