import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, FlatList, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useUser } from '../UserContext';
import Storage from '../../utils/storage';

const { width } = Dimensions.get('window');

export default function TeacherAnnouncements() {
  const { user } = useUser();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [targetAudience, setTargetAudience] = useState('All Students');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      console.log('🔄 Loading teacher announcements...');
      
      // Load from cache first
      const cachedData = await Storage.getItem('teacher_announcements');
      if (cachedData) {
        setAnnouncements(JSON.parse(cachedData));
        console.log('📱 Loaded from cache');
      }
      
      setLoading(false);
      
      // Load from backend
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('created_by', currentUser.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const formatted = data.map(item => ({
            id: item.id,
            title: item.title,
            content: item.content,
            priority: item.priority,
            targetAudience: item.target_audience,
            createdAt: item.created_at,
            isActive: item.is_active,
            viewCount: item.view_count || 0
          }));
          
          setAnnouncements(formatted);
          await Storage.setItem('teacher_announcements', JSON.stringify(formatted));
          console.log('✅ Synced from backend');
        }
      }
    } catch (err) {
      console.error('❌ Error loading announcements:', err);
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const announcementData = {
        title: title.trim(),
        content: content.trim(),
        priority,
        target_audience: targetAudience,
        created_by: currentUser.id,
        is_active: true,
        view_count: 0,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('announcements')
        .insert([announcementData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating announcement:', error);
        Alert.alert('Error', 'Failed to create announcement');
        return;
      }

      // Add to local state
      const newItem = {
        id: data.id,
        title: data.title,
        content: data.content,
        priority: data.priority,
        targetAudience: data.target_audience,
        createdAt: data.created_at,
        isActive: data.is_active,
        viewCount: data.view_count
      };

      const updated = [newItem, ...announcements];
      setAnnouncements(updated);
      await Storage.setItem('teacher_announcements', JSON.stringify(updated));
      
      // Reset form
      setTitle('');
      setContent('');
      setPriority('Normal');
      setTargetAudience('All Students');
      setShowCreateModal(false);
      
      Alert.alert('Success', 'Announcement posted successfully!');
      
    } catch (err) {
      console.error('❌ Error creating announcement:', err);
      Alert.alert('Error', 'Failed to create announcement');
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (!error) {
        const updated = announcements.map(item => 
          item.id === id ? { ...item, isActive: !currentStatus } : item
        );
        setAnnouncements(updated);
        await Storage.setItem('teacher_announcements', JSON.stringify(updated));
      }
    } catch (err) {
      console.error('❌ Error toggling status:', err);
    }
  };

  const deleteItem = async (id) => {
    Alert.alert(
      'Delete Announcement',
      'Are you sure you want to delete this announcement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('announcements')
                .delete()
                .eq('id', id);

              if (!error) {
                const updated = announcements.filter(item => item.id !== id);
                setAnnouncements(updated);
                await Storage.setItem('teacher_announcements', JSON.stringify(updated));
              }
            } catch (err) {
              console.error('❌ Error deleting announcement:', err);
            }
          }
        }
      ]
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#FF6B6B';
      case 'Medium': return '#FFE66D';
      default: return '#4ECDC4';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'High': return '🔴';
      case 'Medium': return '🟡';
      default: return '🟢';
    }
  };

  const renderAnnouncement = ({ item }) => (
    <View style={styles.announcementCard}>
      <LinearGradient
        colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityIcon}>{getPriorityIcon(item.priority)}</Text>
            <Text style={styles.priorityText}>{item.priority}</Text>
          </View>
          
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: item.isActive ? '#4CAF50' : '#757575' }]}
              onPress={() => toggleStatus(item.id, item.isActive)}
            >
              <Text style={styles.statusButtonText}>
                {item.isActive ? '✓' : '✗'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteItem(item.id)}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.announcementTitle}>{item.title}</Text>
        <Text style={styles.announcementContent} numberOfLines={3}>
          {item.content}
        </Text>
        
        <View style={styles.announcementMeta}>
          <Text style={styles.metaText}>Target: {item.targetAudience}</Text>
          <Text style={styles.metaText}>Views: {item.viewCount}</Text>
        </View>
        
        <Text style={styles.announcementDate}>
          {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
        </Text>
      </LinearGradient>
    </View>
  );

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcements</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading announcements...</Text>
          </View>
        ) : announcements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📢</Text>
            <Text style={styles.emptyTitle}>No Announcements Yet</Text>
            <Text style={styles.emptyDescription}>
              Create your first announcement to communicate with students
            </Text>
            <TouchableOpacity 
              style={styles.createFirstButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.createFirstButtonText}>Create Announcement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={announcements}
            renderItem={renderAnnouncement}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.modalGradient}
            >
              <Text style={styles.modalTitle}>Create Announcement</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput
                  style={styles.formInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter announcement title"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Content *</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={content}
                  onChangeText={setContent}
                  placeholder="Write your announcement content..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  multiline
                  numberOfLines={5}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Priority</Text>
                <View style={styles.priorityButtons}>
                  {['Normal', 'Medium', 'High'].map(p => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityButton,
                        priority === p && styles.priorityButtonActive,
                        { borderColor: getPriorityColor(p) }
                      ]}
                      onPress={() => setPriority(p)}
                    >
                      <Text style={styles.priorityButtonIcon}>{getPriorityIcon(p)}</Text>
                      <Text style={[
                        styles.priorityButtonText,
                        priority === p && styles.priorityButtonTextActive
                      ]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Target Audience</Text>
                <View style={styles.audienceButtons}>
                  {['All Students', 'My Students', 'Specific Course'].map(audience => (
                    <TouchableOpacity
                      key={audience}
                      style={[
                        styles.audienceButton,
                        targetAudience === audience && styles.audienceButtonActive
                      ]}
                      onPress={() => setTargetAudience(audience)}
                    >
                      <Text style={[
                        styles.audienceButtonText,
                        targetAudience === audience && styles.audienceButtonTextActive
                      ]}>
                        {audience}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.postButton, creating && { opacity: 0.6 }]}
                  onPress={handleCreate}
                  disabled={creating}
                >
                  <Text style={styles.postButtonText}>
                    {creating ? 'Posting...' : 'Post'}
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
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
    padding: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  createFirstButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  createFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
  },
  announcementCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  priorityIcon: {
    fontSize: 12,
    marginRight: 5,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  announcementContent: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    marginBottom: 15,
  },
  announcementMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  announcementDate: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 25,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 25,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: 12,
    marginHorizontal: 5,
  },
  priorityButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  priorityButtonIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  priorityButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  priorityButtonTextActive: {
    color: '#fff',
  },
  audienceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  audienceButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  audienceButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  audienceButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  audienceButtonTextActive: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 15,
    borderRadius: 10,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  postButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 15,
    borderRadius: 10,
    marginLeft: 10,
  },
  postButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
