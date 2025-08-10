import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, FlatList, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useUser } from '../UserContext';
import Storage from '../../utils/storage';

const { width } = Dimensions.get('window');

export default function TeacherCommunication() {
  const { user } = useUser();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupCategory, setGroupCategory] = useState('General');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      console.log('🔄 Loading teacher groups...');
      
      // Load from cache first
      const cachedData = await Storage.getItem('teacher_groups');
      if (cachedData) {
        setGroups(JSON.parse(cachedData));
        console.log('📱 Loaded from cache');
      }
      
      setLoading(false);
      
      // Load from backend
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data, error } = await supabase
          .from('groups')
          .select(`
            *,
            group_members(count),
            messages(count)
          `)
          .eq('created_by', currentUser.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const formatted = data.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            category: item.category,
            memberCount: item.group_members?.[0]?.count || 0,
            messageCount: item.messages?.[0]?.count || 0,
            createdAt: item.created_at,
            isActive: item.is_active
          }));
          
          setGroups(formatted);
          await Storage.setItem('teacher_groups', JSON.stringify(formatted));
          console.log('✅ Synced from backend');
        }
      }
    } catch (err) {
      console.error('❌ Error loading groups:', err);
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (!groupDescription.trim()) {
      Alert.alert('Error', 'Please enter a group description');
      return;
    }

    setCreating(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const groupData = {
        name: groupName.trim(),
        description: groupDescription.trim(),
        category: groupCategory,
        created_by: currentUser.id,
        is_active: true,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('groups')
        .insert([groupData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating group:', error);
        Alert.alert('Error', 'Failed to create group');
        return;
      }

      // Add to local state
      const newItem = {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        memberCount: 0,
        messageCount: 0,
        createdAt: data.created_at,
        isActive: data.is_active
      };

      const updated = [newItem, ...groups];
      setGroups(updated);
      await Storage.setItem('teacher_groups', JSON.stringify(updated));
      
      // Reset form
      setGroupName('');
      setGroupDescription('');
      setGroupCategory('General');
      setShowCreateModal(false);
      
      Alert.alert('Success', 'Group created successfully!');
      
    } catch (err) {
      console.error('❌ Error creating group:', err);
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const openGroupChat = (group) => {
    router.push(`/teacher/groupChat?groupId=${group.id}&groupName=${group.name}`);
  };

  const renderGroup = ({ item: group }) => (
    <TouchableOpacity 
      style={styles.groupCard}
      onPress={() => openGroupChat(group)}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        style={styles.groupGradient}
      >
        <View style={styles.groupHeader}>
          <View style={styles.groupIcon}>
            <Text style={styles.groupIconText}>
              {group.category === 'Study' ? '📚' : 
               group.category === 'Project' ? '🚀' : 
               group.category === 'Discussion' ? '💬' : '👥'}
            </Text>
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupDescription}>{group.description}</Text>
            <Text style={styles.groupCategory}>{group.category}</Text>
          </View>
        </View>
        
        <View style={styles.groupStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{group.memberCount}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{group.messageCount}</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </View>
        </View>
        
        <View style={styles.groupFooter}>
          <Text style={styles.groupDate}>
            Created {new Date(group.createdAt).toLocaleDateString()}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: group.isActive ? '#4CAF50' : '#FF9800' }]}>
            <Text style={styles.statusText}>{group.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Communication</Text>
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
            <Text style={styles.loadingText}>Loading groups...</Text>
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No Groups Yet</Text>
            <Text style={styles.emptyDescription}>
              Create your first group to start communicating with students
            </Text>
            <TouchableOpacity 
              style={styles.createFirstButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.createFirstButtonText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={groups}
            renderItem={renderGroup}
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
              <Text style={styles.modalTitle}>Create New Group</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Group Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={groupName}
                  onChangeText={setGroupName}
                  placeholder="Enter group name"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description *</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={groupDescription}
                  onChangeText={setGroupDescription}
                  placeholder="Describe the group purpose..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  multiline
                  numberOfLines={4}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.categoryButtons}>
                  {['General', 'Study', 'Project', 'Discussion'].map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        groupCategory === category && styles.categoryButtonActive
                      ]}
                      onPress={() => setGroupCategory(category)}
                    >
                      <Text style={styles.categoryIcon}>
                        {category === 'Study' ? '📚' : 
                         category === 'Project' ? '🚀' : 
                         category === 'Discussion' ? '💬' : '👥'}
                      </Text>
                      <Text style={[
                        styles.categoryButtonText,
                        groupCategory === category && styles.categoryButtonTextActive
                      ]}>
                        {category}
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
                  style={[styles.createButton, creating && { opacity: 0.6 }]}
                  onPress={handleCreateGroup}
                  disabled={creating}
                >
                  <Text style={styles.createButtonText}>
                    {creating ? 'Creating...' : 'Create Group'}
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
  groupCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  groupGradient: {
    padding: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  groupIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  groupIconText: {
    fontSize: 20,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  groupDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 5,
  },
  groupCategory: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  groupStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
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
    height: 80,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  categoryButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
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
  createButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 15,
    borderRadius: 10,
    marginLeft: 10,
  },
  createButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
