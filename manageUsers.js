import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function ManageUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      console.log('🔄 Loading users from backend...');
      
      // First try to get users from profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      let allUsers = [];

      if (profilesError) {
        console.log('⚠️ Error loading from profiles:', profilesError.message);
      } else if (profiles && profiles.length > 0) {
        console.log('✅ Loaded', profiles.length, 'users from profiles');
        allUsers = profiles.map(profile => ({
          id: profile.id,
          name: profile.first_name && profile.last_name 
            ? `${profile.first_name} ${profile.last_name}` 
            : profile.name || profile.email?.split('@')[0] || 'Unknown User',
          email: profile.email,
          role: profile.role || 'student',
          status: 'active',
          joinDate: profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'
        }));
      }

      // If no profiles found, try to get users from auth.users (fallback)
      if (allUsers.length === 0) {
        console.log('📋 No profiles found, trying to load from auth users...');
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (!authError && authUsers?.users) {
          console.log('✅ Loaded', authUsers.users.length, 'users from auth');
          allUsers = authUsers.users.map(user => ({
            id: user.id,
            name: user.user_metadata?.name || 
                  (user.user_metadata?.first_name && user.user_metadata?.last_name 
                    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                    : user.email?.split('@')[0] || 'Unknown User'),
            email: user.email,
            role: user.user_metadata?.role || 'student',
            status: user.email_confirmed_at ? 'active' : 'pending',
            joinDate: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'
          }));
        }
      }

      // Add/update specific users with correct roles if they don't exist or have wrong roles
      const specificUsers = [
        {
          id: 'sp23-bcs-112',
          name: 'sp23-bcs-112',
          email: 'sp23.bcs.112@aulahore.edu.pk',
          role: 'student',
          status: 'active',
          joinDate: '6/10/2025'
        },
        {
          id: 'ahmedimranishere',
          name: 'ahmedimranishere',
          email: 'ahmedimranishere@gmail.com',
          role: 'teacher',
          status: 'active',
          joinDate: '6/10/2025'
        },
        {
          id: 'ramshaimrankhan',
          name: 'ramshaimrankhan',
          email: 'ramshaimrankhan@gmail.com',
          role: 'admin',
          status: 'active',
          joinDate: '6/10/2025'
        }
      ];

      // Update or add specific users
      specificUsers.forEach(specificUser => {
        const existingIndex = allUsers.findIndex(user => 
          user.id === specificUser.id || 
          user.email === specificUser.email ||
          user.name === specificUser.name
        );
        
        if (existingIndex >= 0) {
          // Update existing user with correct role
          allUsers[existingIndex] = { ...allUsers[existingIndex], ...specificUser };
        } else {
          // Add new user if doesn't exist
          allUsers.push(specificUser);
        }
      });

      setUsers(allUsers);
      console.log('✅ Final user count:', allUsers.length);
      
    } catch (err) {
      console.error('❌ Failed to load users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleUserAction = (userId, action) => {
    console.log(`${action} user with ID: ${userId}`);
    // In a real app, this would make API calls
    alert(`${action} action for user ID: ${userId}`);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#667eea';
      case 'teacher': return '#f093fb';
      case 'student': return '#4facfe';
      default: return '#gray';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#43e97b';
      case 'suspended': return '#ff6b6b';
      case 'pending': return '#feca57';
      default: return '#gray';
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manage Users</Text>
      </View>

      <View style={styles.content}>
        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterContainer}>
          {['all', 'student', 'teacher', 'admin'].map((role) => (
            <TouchableOpacity
              key={role}
              style={[
                styles.filterButton,
                selectedRole === role && styles.activeFilterButton
              ]}
              onPress={() => setSelectedRole(role)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedRole === role && styles.activeFilterButtonText
              ]}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add User Button */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => handleUserAction('new', 'Add')}
        >
          <Text style={styles.addButtonText}>+ Add New User</Text>
        </TouchableOpacity>

        {/* Users List */}
        <ScrollView style={styles.usersList} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Loading users...</Text>
            </View>
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {users.length === 0 ? 'No users found' : 'No users match your search criteria'}
              </Text>
            </View>
          ) : (
            filteredUsers.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.userMeta}>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
                    <Text style={styles.roleBadgeText}>{user.role}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user.status) }]}>
                    <Text style={styles.statusBadgeText}>{user.status}</Text>
                  </View>
                  <Text style={styles.joinDate}>Joined: {user.joinDate}</Text>
                </View>
              </View>
              <View style={styles.userActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleUserAction(user.id, 'Edit')}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: user.status === 'active' ? '#ff6b6b' : '#43e97b' }]}
                  onPress={() => handleUserAction(user.id, user.status === 'active' ? 'Suspend' : 'Activate')}
                >
                  <Text style={styles.actionButtonText}>
                    {user.status === 'active' ? 'Suspend' : 'Activate'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            ))
          )}
        </ScrollView>
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
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#fff',
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  activeFilterButtonText: {
    color: '#667eea',
  },
  addButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    color: '#667eea',
    fontWeight: '700',
    fontSize: 16,
  },
  usersList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  joinDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  userActions: {
    flexDirection: 'column',
  },
  actionButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 4,
    minWidth: 70,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#667eea',
    fontWeight: '600',
    fontSize: 12,
  },
});
