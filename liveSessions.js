import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function LiveSessions() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLiveSessions();
  }, []);

  const loadLiveSessions = async () => {
    try {
      console.log('🔄 Loading live sessions from backend...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const today = new Date().toISOString().split('T')[0];
        
        // Load all sessions for this teacher
        const { data: sessions, error: sessionsError } = await supabase
          .from('live_sessions')
          .select('*, courses(title)')
          .eq('instructor_id', user.id)
          .order('scheduled_date');
        
        if (!sessionsError) {
          const upcoming = sessions.filter(s => s.scheduled_date >= today);
          const past = sessions.filter(s => s.scheduled_date < today);
          
          setUpcomingSessions(upcoming || []);
          setPastSessions(past || []);
        } else {
          console.log('⚠️ Error loading sessions:', sessionsError.message);
          setUpcomingSessions([]);
          setPastSessions([]);
        }
      }
      
      console.log('✅ Live sessions loaded successfully');
    } catch (err) {
      console.error('❌ Failed to load live sessions:', err);
      setUpcomingSessions([]);
      setPastSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = (session) => {
    // In a real app, this would integrate with Jitsi Meet
    const jitsiUrl = `https://meet.jit.si/${session.meetingId}`;
    Alert.alert(
      'Start Live Session',
      `Starting session: ${session.title}\n\nThis will open Jitsi Meet in your browser.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Session', 
          onPress: () => {
            console.log(`Opening Jitsi Meet: ${jitsiUrl}`);
            // In React Native, you would use Linking.openURL(jitsiUrl)
            alert(`Session started! Meeting ID: ${session.meetingId}`);
          }
        }
      ]
    );
  };

  const handleScheduleSession = () => {
    if (!newSessionTitle.trim()) {
      alert('Please enter a session title');
      return;
    }
    
    // In a real app, this would create a new session
    Alert.alert(
      'Session Scheduled',
      `"${newSessionTitle}" has been scheduled successfully!`,
      [{ text: 'OK', onPress: () => {
        setNewSessionTitle('');
        setShowCreateForm(false);
      }}]
    );
  };

  const handleSendInvites = (session) => {
    Alert.alert(
      'Send Invites',
      `Send session invites to ${session.students} enrolled students?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send', 
          onPress: () => alert(`Invites sent to ${session.students} students!`)
        }
      ]
    );
  };

  const renderUpcomingSessions = () => (
    <ScrollView style={styles.sessionsList} showsVerticalScrollIndicator={false}>
      {upcomingSessions.map((session) => (
        <View key={session.id} style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionTitle}>{session.title}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Scheduled</Text>
            </View>
          </View>
          
          <Text style={styles.courseTitle}>{session.course}</Text>
          
          <View style={styles.sessionDetails}>
            <Text style={styles.sessionDetail}>📅 {session.date}</Text>
            <Text style={styles.sessionDetail}>🕐 {session.time}</Text>
            <Text style={styles.sessionDetail}>⏱️ {session.duration}</Text>
            <Text style={styles.sessionDetail}>👥 {session.students} students</Text>
          </View>

          <View style={styles.sessionActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => handleStartSession(session)}
            >
              <Text style={styles.primaryButtonText}>🎥 Start Session</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSendInvites(session)}
            >
              <Text style={styles.actionButtonText}>📧 Send Invites</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => alert(`Edit session: ${session.title}`)}
            >
              <Text style={styles.actionButtonText}>✏️ Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderPastSessions = () => (
    <ScrollView style={styles.sessionsList} showsVerticalScrollIndicator={false}>
      {pastSessions.map((session) => (
        <View key={session.id} style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionTitle}>{session.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#43e97b' }]}>
              <Text style={styles.statusBadgeText}>Completed</Text>
            </View>
          </View>
          
          <Text style={styles.courseTitle}>{session.course}</Text>
          
          <View style={styles.sessionDetails}>
            <Text style={styles.sessionDetail}>📅 {session.date}</Text>
            <Text style={styles.sessionDetail}>🕐 {session.time}</Text>
            <Text style={styles.sessionDetail}>⏱️ {session.duration}</Text>
            <Text style={styles.sessionDetail}>👥 {session.attendance}/{session.students} attended</Text>
          </View>

          <View style={styles.sessionActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => alert(`View analytics for: ${session.title}`)}
            >
              <Text style={styles.actionButtonText}>📊 Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => alert(`Recording status: ${session.recording}`)}
            >
              <Text style={styles.actionButtonText}>🎬 Recording</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <LinearGradient
      colors={['#f093fb', '#f5576c']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Live Sessions</Text>
      </View>

      <View style={styles.content}>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'past' && styles.activeTab]}
            onPress={() => setActiveTab('past')}
          >
            <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
              Past Sessions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Schedule New Session Button */}
        <TouchableOpacity
          style={styles.scheduleButton}
          onPress={() => setShowCreateForm(!showCreateForm)}
        >
          <Text style={styles.scheduleButtonText}>+ Schedule New Session</Text>
        </TouchableOpacity>

        {/* Create Session Form */}
        {showCreateForm && (
          <View style={styles.createForm}>
            <TextInput
              style={styles.titleInput}
              placeholder="Session title..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={newSessionTitle}
              onChangeText={setNewSessionTitle}
            />
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCreateForm(false);
                  setNewSessionTitle('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleScheduleSession}
              >
                <Text style={styles.createButtonText}>Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Sessions Content */}
        {activeTab === 'upcoming' ? renderUpcomingSessions() : renderPastSessions()}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    color: '#fff',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#f093fb',
  },
  scheduleButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  scheduleButtonText: {
    color: '#f093fb',
    fontWeight: '700',
    fontSize: 16,
  },
  createForm: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  titleInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 0.45,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  createButton: {
    flex: 0.45,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#f093fb',
    fontWeight: '600',
  },
  sessionsList: {
    flex: 1,
  },
  sessionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    backgroundColor: '#feca57',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  courseTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  sessionDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  sessionDetail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginRight: 16,
    marginBottom: 4,
  },
  sessionActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#fff',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  primaryButtonText: {
    color: '#f093fb',
    fontWeight: '600',
    fontSize: 12,
  },
});
