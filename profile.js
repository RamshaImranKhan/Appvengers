import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, Switch, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useUser } from '../UserContext';
import Storage from '../../utils/storage';

const { width } = Dimensions.get('window');

export default function TeacherProfile() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile data
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    title: '',
    bio: '',
    expertise: [],
    location: '',
    phone: '',
    website: '',
    linkedin: ''
  });

  // Teaching stats
  const [teachingStats, setTeachingStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    averageRating: 0,
    totalHours: 0,
    completionRate: 0,
    responseTime: '0 hours'
  });

  useEffect(() => {
    loadTeacherProfile();
  }, []);
  
  // Refresh data when screen comes into focus
  useEffect(() => {
    const unsubscribe = router.addListener?.('focus', () => {
      // Only sync with backend, don't show loading
      const syncData = async () => {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          syncWithBackend(currentUser.id);
        }
      };
      syncData();
    });
    
    return unsubscribe;
  }, []);

  const loadTeacherProfile = async () => {
    try {
      console.log('🔄 Loading teacher profile data...');
      
      // Set default values immediately to stop loading
      setProfile({
        name: user?.name || 'Teacher',
        email: user?.email || '',
        title: 'Teacher',
        bio: '',
        expertise: [],
        location: '',
        phone: '',
        website: '',
        linkedin: ''
      });
      
      setTeachingStats({
        totalStudents: 0,
        totalCourses: 0,
        averageRating: 0,
        totalHours: 0,
        completionRate: 0,
        responseTime: '0 hours'
      });
      
      // Stop loading immediately
      setLoading(false);
      
      console.log('✅ Profile loaded with default values');
      
      // Try to get user and load cached data
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        // Load cached data if available
        try {
          const cachedProfile = await Storage.getItem('teacher_profile');
          if (cachedProfile) {
            const parsedProfile = JSON.parse(cachedProfile);
            setProfile({
              name: parsedProfile.name || currentUser.user_metadata?.name || 'Teacher',
              email: parsedProfile.email || currentUser.email || '',
              title: parsedProfile.title || 'Teacher',
              bio: parsedProfile.bio || '',
              expertise: parsedProfile.expertise || [],
              location: parsedProfile.location || '',
              phone: parsedProfile.phone || '',
              website: parsedProfile.website || '',
              linkedin: parsedProfile.linkedin || ''
            });
            console.log('📱 Profile updated from cache');
          }
          
          const cachedSettings = await Storage.getItem('teacher_settings');
          if (cachedSettings) {
            setSettings(JSON.parse(cachedSettings));
            console.log('📱 Settings updated from cache');
          }
          
          const cachedStats = await Storage.getItem('teacher_stats');
          if (cachedStats) {
            setTeachingStats(JSON.parse(cachedStats));
            console.log('📱 Stats updated from cache');
          }
        } catch (cacheError) {
          console.log('Cache loading error:', cacheError);
        }
        
        // Background sync with backend (non-blocking)
        syncWithBackend(currentUser.id);
      }
      
      console.log('✅ Teacher profile data loaded successfully');
    } catch (err) {
      console.error('❌ Failed to load teacher profile data:', err);
      setLoading(false);
    }
  };
  
  // Background sync function (non-blocking)
  const syncWithBackend = async (userId) => {
    try {
      console.log('🔄 Starting background sync...');
      
      // Parallel backend requests for better performance
      const [profileResult, coursesResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('courses').select('id, title, rating, completion_rate, duration').eq('instructor_id', userId)
      ]);
      
      // Update profile if backend data is different
      if (!profileResult.error && profileResult.data) {
        const backendProfile = {
          name: profileResult.data.name || '',
          email: profileResult.data.email || '',
          title: profileResult.data.title || 'Teacher',
          bio: profileResult.data.bio || '',
          expertise: profileResult.data.expertise || [],
          location: profileResult.data.location || '',
          phone: profileResult.data.phone || '',
          website: profileResult.data.website || '',
          linkedin: profileResult.data.linkedin || ''
        };
        
        setProfile(backendProfile);
        await Storage.setItem('teacher_profile', JSON.stringify(profileResult.data));
        console.log('🔄 Profile synced from backend');
      }
      
      // Update teaching stats if backend data is available
      if (!coursesResult.error && coursesResult.data) {
        const courses = coursesResult.data;
        const totalCourses = courses.length;
        const avgRating = courses.length > 0 ? 
          Math.round((courses.reduce((sum, course) => sum + (course.rating || 0), 0) / courses.length) * 10) / 10 : 0;
        const avgCompletion = courses.length > 0 ?
          Math.round(courses.reduce((sum, course) => sum + (course.completion_rate || 0), 0) / courses.length) : 0;
        const totalHours = courses.reduce((sum, course) => {
          const duration = course.duration || '0 hours';
          const hours = parseInt(duration.match(/\d+/) || [0]);
          return sum + hours;
        }, 0);
        
        const newStats = {
          totalStudents: 0, // Will be updated separately if needed
          totalCourses,
          averageRating: avgRating,
          totalHours,
          completionRate: avgCompletion,
          responseTime: '2 hours'
        };
        
        setTeachingStats(newStats);
        await Storage.setItem('teacher_stats', JSON.stringify(newStats));
        console.log('📊 Teaching stats synced from backend');
      }
      
      console.log('✅ Background sync completed');
      
    } catch (err) {
      console.error('❌ Background sync error:', err);
    }
  };

  // Settings
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    studentMessages: true,
    courseUpdates: true,
    marketingEmails: false,
    profileVisibility: true,
    autoReply: false
  });

  const handleSaveProfile = async () => {
    console.log('💾 Starting profile save process...');
    console.log('📝 Current profile data:', profile);
    setSaving(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        console.error('❌ No current user found');
        Alert.alert('Error', 'You must be logged in to save your profile');
        return;
      }
      
      console.log('👤 Current user:', currentUser.id);

      const profileData = {
        id: currentUser.id,
        name: profile.name.trim(),
        email: profile.email.trim(),
        title: profile.title.trim(),
        bio: profile.bio.trim(),
        expertise: profile.expertise,
        location: profile.location.trim(),
        phone: profile.phone.trim(),
        website: profile.website.trim(),
        linkedin: profile.linkedin.trim(),
        role: 'teacher', // Ensure role is set
        updated_at: new Date().toISOString()
      };

      console.log('📤 Saving profile data to backend:', profileData);
      
      // Save to Supabase backend
      const { error } = await supabase
        .from('profiles')
        .upsert([profileData]);

      if (error) {
        console.error('❌ Error saving profile to backend:', error);
        Alert.alert('Error', 'Failed to save profile to backend. Please try again.');
        return;
      }

      console.log('✅ Profile saved to backend successfully');

      // Save to local storage for offline access and consistency
      await Storage.setItem('teacher_profile', JSON.stringify(profileData));
      await Storage.setItem('user_profile_cache', JSON.stringify(profileData));
      
      console.log('✅ Profile saved to local storage successfully');
      
      // Update UserContext if available
      if (user && user.setUser) {
        user.setUser(prev => ({
          ...prev,
          name: profileData.name,
          title: profileData.title
        }));
      }

      // Save settings to local storage as well
      await Storage.setItem('teacher_settings', JSON.stringify(settings));

      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully and saved locally!');
      console.log('✅ Profile saved to both backend and local storage');
      
    } catch (err) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateProfileField = (field, value) => {
    console.log(`🔄 Updating profile field: ${field} = ${value}`);
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSettingChange = async (setting, value) => {
    const newSettings = {
      ...settings,
      [setting]: value
    };
    
    setSettings(newSettings);
    
    // Save settings to local storage immediately
    try {
      await Storage.setItem('teacher_settings', JSON.stringify(newSettings));
      console.log('⚙️ Settings saved locally');
    } catch (err) {
      console.error('Error saving settings locally:', err);
    }
  };

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>👩‍🏫</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile.name || 'Teacher'}</Text>
          <Text style={styles.profileTitle}>{profile.title || 'Teacher'}</Text>
          <Text style={styles.profileEmail}>{profile.email}</Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? '❌' : '✏️'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Teaching Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>📊 Teaching Statistics</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading statistics...</Text>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{teachingStats.totalStudents}</Text>
              <Text style={styles.statLabel}>Total Students</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{teachingStats.totalCourses}</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{teachingStats.averageRating}</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{teachingStats.completionRate}%</Text>
              <Text style={styles.statLabel}>Completion</Text>
            </View>
          </View>
        )}
      </View>

      {/* Profile Details */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>👤 Profile Details</Text>
        
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Full Name</Text>
          <TextInput
            style={styles.fieldInput}
            value={profile.name}
            onChangeText={(text) => updateProfileField('name', text)}
            placeholder="Enter your full name"
            placeholderTextColor="rgba(255,255,255,0.5)"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Professional Title</Text>
          <TextInput
            style={styles.fieldInput}
            value={profile.title}
            onChangeText={(text) => updateProfileField('title', text)}
            placeholder="e.g., Senior Mobile Development Instructor"
            placeholderTextColor="rgba(255,255,255,0.5)"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Bio</Text>
          <TextInput
            style={styles.fieldTextArea}
            value={profile.bio}
            onChangeText={(text) => updateProfileField('bio', text)}
            placeholder="Tell students about your background and expertise..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Areas of Expertise</Text>
          <View style={styles.expertiseContainer}>
            {profile.expertise.map((skill, index) => (
              <View key={index} style={styles.expertiseTag}>
                <Text style={styles.expertiseText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Location</Text>
          <TextInput
            style={styles.fieldInput}
            value={profile.location}
            onChangeText={(text) => updateProfileField('location', text)}
            placeholder="City, Country"
            placeholderTextColor="rgba(255,255,255,0.5)"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Phone</Text>
          <TextInput
            style={styles.fieldInput}
            value={profile.phone}
            onChangeText={(text) => updateProfileField('phone', text)}
            placeholder="+1 (555) 123-4567"
            placeholderTextColor="rgba(255,255,255,0.5)"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Website</Text>
          <TextInput
            style={styles.fieldInput}
            value={profile.website}
            onChangeText={(text) => updateProfileField('website', text)}
            placeholder="https://yourwebsite.com"
            placeholderTextColor="rgba(255,255,255,0.5)"
            keyboardType="url"
          />
        </View>
      </View>

      {/* Save button always visible for better UX */}
      <TouchableOpacity 
        style={[styles.saveButton, saving && { opacity: 0.6 }]} 
        onPress={handleSaveProfile}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? '💾 Saving...' : '💾 Save Profile'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>🔔 Notifications</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Email Notifications</Text>
            <Text style={styles.settingDescription}>Receive course and student updates via email</Text>
          </View>
          <Switch
            value={settings.emailNotifications}
            onValueChange={(value) => handleSettingChange('emailNotifications', value)}
            trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#43e97b' }}
            thumbColor={settings.emailNotifications ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Text style={styles.settingDescription}>Get instant notifications on your device</Text>
          </View>
          <Switch
            value={settings.pushNotifications}
            onValueChange={(value) => handleSettingChange('pushNotifications', value)}
            trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#43e97b' }}
            thumbColor={settings.pushNotifications ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Student Messages</Text>
            <Text style={styles.settingDescription}>Allow students to send you direct messages</Text>
          </View>
          <Switch
            value={settings.studentMessages}
            onValueChange={(value) => handleSettingChange('studentMessages', value)}
            trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#43e97b' }}
            thumbColor={settings.studentMessages ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>🎯 Privacy & Visibility</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Profile Visibility</Text>
            <Text style={styles.settingDescription}>Make your profile visible to students</Text>
          </View>
          <Switch
            value={settings.profileVisibility}
            onValueChange={(value) => handleSettingChange('profileVisibility', value)}
            trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#43e97b' }}
            thumbColor={settings.profileVisibility ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto Reply</Text>
            <Text style={styles.settingDescription}>Automatically reply to student messages</Text>
          </View>
          <Switch
            value={settings.autoReply}
            onValueChange={(value) => handleSettingChange('autoReply', value)}
            trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#43e97b' }}
            thumbColor={settings.autoReply ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Export Data', 'Your teaching data will be exported as CSV')}
        >
          <Text style={styles.actionButtonText}>📊 Export Teaching Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Reset Settings', 'All settings will be reset to defaults')}
        >
          <Text style={styles.actionButtonText}>🔄 Reset Settings</Text>
        </TouchableOpacity>
      </View>
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
        <Text style={styles.title}>👨‍🏫 My Profile</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
            👤 Profile
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
            ⚙️ Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'settings' && renderSettingsTab()}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
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
    fontSize: 14,
  },
  activeTabText: {
    color: '#f093fb',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContent: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 32,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  profileTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 18,
  },
  statsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
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
    width: (width - 80) / 2,
    alignItems: 'center',
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  detailsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },
  fieldInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  fieldTextArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  expertiseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  expertiseTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  expertiseText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#f093fb',
    fontWeight: '600',
    fontSize: 16,
  },
  settingsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
  },
  actionButtons: {
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
});
