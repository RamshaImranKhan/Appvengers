import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useUser } from '../UserContext';

const { width } = Dimensions.get('window');

export default function GroupChat() {
  const { user } = useUser();
  const { groupId, groupName } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [groupInfo, setGroupInfo] = useState(null);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (groupId) {
      loadGroupData();
      loadMessages();
      loadMembers();
    }
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (!error && data) {
        setGroupInfo(data);
      }
    } catch (err) {
      console.error('❌ Error loading group data:', err);
    }
  };

  const loadMessages = async () => {
    try {
      console.log('🔄 Loading group messages...');
      
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles(name, role)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (!error && messagesData) {
        const formattedMessages = messagesData.map(message => ({
          id: message.id,
          content: message.content,
          senderId: message.sender_id,
          senderName: message.profiles?.name || 'Unknown User',
          senderRole: message.profiles?.role || 'student',
          timestamp: message.created_at,
          isOwn: message.sender_id === user?.id
        }));
        
        setMessages(formattedMessages);
        console.log('✅ Messages loaded:', formattedMessages.length);
      }
    } catch (err) {
      console.error('❌ Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const { data: membersData, error } = await supabase
        .from('group_members')
        .select(`
          *,
          profiles(name, role)
        `)
        .eq('group_id', groupId);

      if (!error && membersData) {
        const formattedMembers = membersData.map(member => ({
          id: member.user_id,
          name: member.profiles?.name || 'Unknown User',
          role: member.profiles?.role || 'student',
          joinedAt: member.joined_at
        }));
        
        setMembers(formattedMembers);
      }
    } catch (err) {
      console.error('❌ Error loading members:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        console.error('❌ No current user found');
        return;
      }

      const messageData = {
        content: newMessage.trim(),
        group_id: groupId,
        sender_id: currentUser.id,
        created_at: new Date().toISOString()
      };

      console.log('📤 Sending message:', messageData);

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select(`
          *,
          profiles(name, role)
        `)
        .single();

      if (error) {
        console.error('❌ Error sending message:', error);
        return;
      }

      console.log('✅ Message sent successfully');

      // Add message to local state immediately
      const newMessageFormatted = {
        id: data.id,
        content: data.content,
        senderId: data.sender_id,
        senderName: data.profiles?.name || user?.name || 'You',
        senderRole: data.profiles?.role || 'teacher',
        timestamp: data.created_at,
        isOwn: true
      };

      setMessages(prev => [...prev, newMessageFormatted]);
      setNewMessage('');
      
    } catch (err) {
      console.error('❌ Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const renderMessage = ({ item: message }) => (
    <View style={[
      styles.messageContainer,
      message.isOwn ? styles.ownMessage : styles.otherMessage
    ]}>
      <View style={[
        styles.messageBubble,
        message.isOwn ? styles.ownBubble : styles.otherBubble
      ]}>
        {!message.isOwn && (
          <View style={styles.senderInfo}>
            <Text style={styles.senderName}>{message.senderName}</Text>
            <View style={[
              styles.roleBadge,
              { backgroundColor: message.senderRole === 'teacher' ? '#4CAF50' : '#2196F3' }
            ]}>
              <Text style={styles.roleText}>
                {message.senderRole === 'teacher' ? '👩‍🏫' : '👨‍🎓'}
              </Text>
            </View>
          </View>
        )}
        <Text style={[
          styles.messageText,
          message.isOwn ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {message.content}
        </Text>
        <Text style={[
          styles.messageTime,
          message.isOwn ? styles.ownMessageTime : styles.otherMessageTime
        ]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{groupName || 'Group Chat'}</Text>
          <Text style={styles.headerSubtitle}>{members.length} members</Text>
        </View>
        <TouchableOpacity style={styles.infoButton}>
          <Text style={styles.infoButtonText}>ℹ️</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyDescription}>
              Be the first to start the conversation!
            </Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            style={styles.inputGradient}
          >
            <TextInput
              style={styles.messageInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type your message..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!newMessage.trim() || sending) && { opacity: 0.5 }]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              <Text style={styles.sendButtonText}>
                {sending ? '⏳' : '📤'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
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
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  infoButton: {
    padding: 10,
  },
  infoButtonText: {
    fontSize: 20,
  },
  chatContainer: {
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
  },
  messagesList: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  messageContainer: {
    marginBottom: 15,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  ownBubble: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  otherBubble: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginRight: 8,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleText: {
    fontSize: 10,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#333',
  },
  otherMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 5,
  },
  ownMessageTime: {
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: 'rgba(255,255,255,0.6)',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 30,
  },
  inputGradient: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    marginLeft: 10,
    padding: 8,
  },
  sendButtonText: {
    fontSize: 20,
  },
});
