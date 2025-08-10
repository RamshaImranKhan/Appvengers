import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../UserContext';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import Storage from '../../utils/storage';

const { width } = Dimensions.get('window');

export default function TeacherDashboard() {
  const { user, signOut } = useUser();
  const [stats, setStats] = useState({
    myCourses: 0,
    studentsEnrolled: 0,
    upcomingSessions: 0,
    completionRate: 0
  });
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherProfile, setTeacherProfile] = useState({
    name: '',
    title: 'Teacher',
    email: ''
  });

  useEffect(() => {
    loadTeacherData();
  }, []);

  const loadTeacherData = async () => {
    try {
      console.log('🔄 Loading teacher dashboard data...');
      
      // Set default values immediately to stop loading
      setStats({
        myCourses: 0,
        studentsEnrolled: 0,
        upcomingSessions: 0,
        completionRate: 0
      });
      
      setUpcomingSessions([]);
      
      setTeacherProfile({
        name: user?.name || 'Teacher',
        title: 'Teacher',
        email: user?.email || ''
      });
      
      // Stop loading immediately
      setLoading(false);
      
      console.log('✅ Dashboard loaded with default values');
      
      // Try to get user and load cached data
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        // Load cached data if available
        try {
          const cachedStats = await Storage.getItem('teacher_dashboard_stats');
          if (cachedStats) {
            setStats(JSON.parse(cachedStats));
            console.log('📱 Stats updated from cache');
          }
          
          const cachedSessions = await Storage.getItem('teacher_upcoming_sessions');
          if (cachedSessions) {
            setUpcomingSessions(JSON.parse(cachedSessions));
            console.log('📱 Sessions updated from cache');
          }
          
          const cachedProfile = await Storage.getItem('teacher_profile');
          if (cachedProfile) {
            const profile = JSON.parse(cachedProfile);
            setTeacherProfile({
              name: profile.name || 'Teacher',
              title: profile.title || 'Teacher',
              email: profile.email || currentUser.email || ''
            });
            console.log('📱 Profile updated from cache');
          }
        } catch (cacheError) {
          console.log('Cache loading error:', cacheError);
        }
        
        // Background sync with backend (non-blocking)
        syncDashboardData(currentUser.id);
        // Load teacher's courses with simplified query
        const { data: courses, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .eq('instructor_id', currentUser.id);
        
        let totalStudents = 0;
        let totalCourses = 0;
        let avgCompletionRate = 0;
        
        if (!coursesError && courses) {
          totalCourses = courses.length;
          // Skip student count for now to improve performance
          totalStudents = 0;
          
          // Calculate average completion rate
          if (courses.length > 0) {
            avgCompletionRate = Math.round(
              courses.reduce((sum, course) => sum + (course.completion_rate || 0), 0) / courses.length
            );
          }
        }
        
        // Load upcoming live sessions (from events table) - simplified query
        const today = new Date().toISOString().split('T')[0];
        const { data: sessions, error: sessionsError } = await supabase
          .from('events')
          .select('id, title, date, time, max_participants')
          .eq('instructor_id', currentUser.id)
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(3);
        
        if (!sessionsError && sessions) {
          const formattedSessions = sessions.map(session => ({
            id: session.id,
            title: session.title,
            time: new Date(session.date + 'T' + (session.time || '10:00')).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }),
            students: session.max_participants || 0
          }));
          setUpcomingSessions(formattedSessions);
        }
        
        setStats({
          myCourses: totalCourses,
          studentsEnrolled: totalStudents, // Changed from 0 to totalStudents
          upcomingSessions: sessions?.length || 0,
          completionRate: avgCompletionRate
        });
      } else {
        // No cached data, set default values and stop loading
        setStats({
          myCourses: 0,
          studentsEnrolled: 0,
          upcomingSessions: 0,
          completionRate: 0
        });
        setUpcomingSessions([]);
        setLoading(false);
        
        // Background sync with backend (non-blocking)
        syncDashboardData(currentUser.id);
      }
      
      console.log('✅ Teacher dashboard data loaded instantly from cache');
    } catch (err) {
      console.error('❌ Failed to load teacher dashboard data:', err);
      setLoading(false);
    }
  };
  
  // Background sync function (non-blocking)
  const syncDashboardData = async (userId) => {
    try {
      console.log('🔄 Starting dashboard background sync...');
      
      const today = new Date().toISOString().split('T')[0];
      
      // Parallel backend requests for better performance
      const [coursesResult, sessionsResult] = await Promise.all([
        supabase.from('courses').select('id, title, status, created_at').eq('instructor_id', userId),
        supabase.from('events').select('id, title, date, time, max_participants').eq('instructor_id', userId).gte('date', today).order('date').limit(3)
      ]);
      
      // Update stats if backend data is available
      if (!coursesResult.error && coursesResult.data) {
        const courses = coursesResult.data;
        const totalCourses = courses.length;
        const publishedCourses = courses.filter(course => course.status === 'published').length;
        const upcomingSessionsCount = !sessionsResult.error && sessionsResult.data ? sessionsResult.data.length : 0;
        
        const newStats = {
          myCourses: totalCourses,
          studentsEnrolled: 0, // Will be updated when we have enrollment data
          upcomingSessions: upcomingSessionsCount,
          completionRate: publishedCourses > 0 ? Math.round((publishedCourses / totalCourses) * 100) : 0
        };
        
        setStats(newStats);
        await Storage.setItem('teacher_dashboard_stats', JSON.stringify(newStats));
        console.log('📊 Dashboard stats synced from backend');
      }
      
      // Update sessions if backend data is available
      if (!sessionsResult.error && sessionsResult.data) {
        const formattedSessions = sessionsResult.data.map(session => ({
          id: session.id,
          title: session.title,
          time: `${session.date} ${session.time}`,
          students: session.max_participants || 0,
          type: 'Live Session'
        }));
        
        setUpcomingSessions(formattedSessions);
        await Storage.setItem('teacher_upcoming_sessions', JSON.stringify(formattedSessions));
        console.log('📅 Upcoming sessions synced from backend');
      }
      
      console.log('✅ Dashboard background sync completed');
      
    } catch (err) {
      console.error('❌ Dashboard background sync error:', err);
    }
  };

  const dashboardItems = [
    {
      id: 'courses',
      title: 'Manage Courses',
      description: 'Upload and edit your courses',
      icon: '📚',
      color: ['#667eea', '#764ba2'],
      route: '/teacher/manageCourses'
    },
    {
      id: 'liveSessions',
      title: 'Live Sessions',
      description: 'Schedule and host live classes',
      icon: '🎥',
      color: ['#f093fb', '#f5576c'],
      route: '/teacher/liveSessions'
    },
    {
      id: 'progress',
      title: 'Student Progress',
      description: 'Track learner progress and performance',
      icon: '📈',
      color: ['#4facfe', '#00f2fe'],
      route: '/teacher/studentProgress'
    },
    {
      id: 'events',
      title: 'Events',
      description: 'View and participate in events',
      icon: '📅',
      color: ['#43e97b', '#38f9d7'],
      route: '/teacher/events'
    },
    {
      id: 'communication',
      title: 'Group Communication',
      description: 'Create groups and chat with students',
      icon: '💬',
      color: ['#fa709a', '#fee140'],
      route: '/teacher/communication'
    },
    {
      id: 'announcements',
      title: 'Announcements',
      description: 'Post updates and announcements',
      icon: '📢',
      color: ['#a8edea', '#fed6e3'],
      route: '/teacher/announcements'
    },
    {
      id: 'assistant',
      title: 'AI Assistant',
      description: 'Get help with teaching tasks',
      icon: '🤖',
      color: ['#d299c2', '#fef9d7'],
      route: '/teacher/aiAssistant'
    },
    {
      id: 'profile',
      title: 'My Profile',
      description: 'Manage your teaching profile',
      icon: '👨‍🏫',
      color: ['#89f7fe', '#66a6ff'],
      route: '/teacher/profile'
    }
  ];



  const handleNavigation = (route) => {
    router.push(route);
  };

  return (
    <LinearGradient
      colors={['#f093fb', '#f5576c']}
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
            <Text style={styles.welcomeText}>Welcome, {teacherProfile.name}!</Text>
            <Text style={styles.titleText}>{teacherProfile.title}</Text>
            <Text style={styles.emailText}>{teacherProfile.email}</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Teaching Stats</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading stats...</Text>
            </View>
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.myCourses}</Text>
                <Text style={styles.statLabel}>My Courses</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.studentsEnrolled}</Text>
                <Text style={styles.statLabel}>Students Enrolled</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.upcomingSessions}</Text>
                <Text style={styles.statLabel}>Upcoming Sessions</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.completionRate}%</Text>
                <Text style={styles.statLabel}>Completion Rate</Text>
              </View>
            </View>
          )}
        </View>

        {/* Today's Sessions */}
        <View style={styles.sessionsContainer}>
          <Text style={styles.sectionTitle}>Today's Sessions</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading sessions...</Text>
            </View>
          ) : upcomingSessions.length > 0 ? (
            upcomingSessions.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle}>{session.title}</Text>
                  <Text style={styles.sessionTime}>{session.time} • {session.students} students</Text>
                </View>
                <TouchableOpacity style={styles.joinButton}>
                  <Text style={styles.joinButtonText}>Join</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No sessions scheduled for today</Text>
            </View>
          )}
        </View>

        {/* Management Options */}
        <View style={styles.managementContainer}>
          <Text style={styles.sectionTitle}>Teaching Tools</Text>
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
  titleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginTop: 2,
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
  sessionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sessionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  sessionTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  joinButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
    color: '#f093fb',
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
  loadingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  emptyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
});
