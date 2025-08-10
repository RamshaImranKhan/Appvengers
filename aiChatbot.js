import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useUser } from '../UserContext';

const { width } = Dimensions.get('window');

export default function AIChatbot() {
  const { userRole } = useUser();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef();

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: `Hello! I'm your AI assistant for LoopVerse. I can help you with ${
        userRole === 'admin' ? 'system management, user queries, and platform analytics' :
        userRole === 'teacher' ? 'course creation, student management, and teaching resources' :
        'learning guidance, course recommendations, and technical support'
      }. How can I assist you today?`,
      isBot: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const quickActions = {
    admin: [
      { id: 1, text: 'User Management Help', icon: '👥' },
      { id: 2, text: 'Analytics Overview', icon: '📊' },
      { id: 3, text: 'System Settings', icon: '⚙️' },
      { id: 4, text: 'Platform Issues', icon: '🔧' }
    ],
    teacher: [
      { id: 1, text: 'Course Creation Tips', icon: '📚' },
      { id: 2, text: 'Live Session Help', icon: '🎥' },
      { id: 3, text: 'Student Engagement', icon: '👨‍🎓' },
      { id: 4, text: 'Assessment Tools', icon: '📝' }
    ],
    student: [
      { id: 1, text: 'Course Recommendations', icon: '🎯' },
      { id: 2, text: 'Study Tips', icon: '📖' },
      { id: 3, text: 'Technical Support', icon: '💻' },
      { id: 4, text: 'Career Guidance', icon: '🚀' }
    ]
  };

  const botResponses = {
    admin: {
      'user management help': 'I can help you with user management! You can:\n\n• View all users by role (Teachers, Students)\n• Add new users manually or via bulk import\n• Edit user profiles and permissions\n• Suspend or activate user accounts\n• Export user data for reports\n\nWould you like specific guidance on any of these tasks?',
      'analytics overview': 'Here\'s what you can track in Analytics:\n\n📈 User Growth & Engagement\n📚 Course Completion Rates\n🎯 Event Participation\n💬 Communication Activity\n⭐ User Feedback & Ratings\n\nI can help you interpret specific metrics or create custom reports. What would you like to analyze?',
      'system settings': 'System settings include:\n\n🎨 Theme & Branding customization\n📧 Email notification templates\n🔐 Security & authentication settings\n📱 Mobile app configurations\n🌐 API integrations\n\nWhich area would you like to configure?',
      'platform issues': 'I can help troubleshoot common issues:\n\n• User login problems\n• Course upload failures\n• Live session connectivity\n• Notification delivery\n• Performance optimization\n\nDescribe the specific issue you\'re experiencing.'
    },
    teacher: {
      'course creation tips': 'Here are best practices for creating engaging courses:\n\n📝 Structure content in digestible modules\n🎥 Keep videos under 10 minutes\n📋 Include interactive quizzes\n💡 Add practical exercises\n📚 Provide downloadable resources\n\nWould you like help with any specific aspect of course creation?',
      'live session help': 'For successful live sessions:\n\n⏰ Schedule sessions in advance\n📧 Send reminders to students\n🎥 Test audio/video beforehand\n📱 Use interactive features (polls, chat)\n📹 Record for later viewing\n\nNeed help setting up your next session?',
      'student engagement': 'Boost engagement with:\n\n🏆 Gamification elements\n💬 Discussion forums\n📊 Progress tracking\n🎯 Personalized feedback\n👥 Group projects\n\nWhich engagement strategy interests you most?',
      'assessment tools': 'Available assessment options:\n\n✅ Multiple choice quizzes\n📝 Written assignments\n🎯 Practical projects\n👥 Peer reviews\n📊 Progress milestones\n\nWhat type of assessment are you planning?'
    },
    student: {
      'course recommendations': 'I can suggest courses based on:\n\n🎯 Your current skill level\n📈 Career goals\n⏱️ Available time commitment\n🏆 Popular trending topics\n👥 What peers are taking\n\nWhat area would you like to explore?',
      'study tips': 'Effective study strategies:\n\n⏰ Set consistent study schedule\n🎯 Break content into small chunks\n📝 Take active notes\n🔄 Review regularly\n👥 Join study groups\n🏆 Track your progress\n\nWhich study challenge can I help you with?',
      'technical support': 'Common technical issues I can help with:\n\n🔐 Login problems\n📱 App navigation\n🎥 Video playback issues\n📧 Notification settings\n💾 Download problems\n\nWhat technical issue are you experiencing?',
      'career guidance': 'I can help with career development:\n\n📊 Skill gap analysis\n🎯 Learning path planning\n💼 Industry insights\n🏆 Certification guidance\n🌐 Networking opportunities\n\nWhat career aspect interests you most?'
    }
  };

  const generateBotResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    const responses = botResponses[userRole] || botResponses.student;
    
    // Find matching response
    for (const [key, response] of Object.entries(responses)) {
      if (lowerMessage.includes(key) || key.includes(lowerMessage.split(' ')[0])) {
        return response;
      }
    }

    // Default responses based on role
    const defaultResponses = {
      admin: "I understand you need help with platform administration. Could you be more specific about what you'd like assistance with? I can help with user management, analytics, system settings, or troubleshooting.",
      teacher: "I'm here to support your teaching journey! I can assist with course creation, student engagement, live sessions, or assessment strategies. What would you like to explore?",
      student: "I'm here to help with your learning! I can provide course recommendations, study tips, technical support, or career guidance. What can I assist you with today?"
    };

    return defaultResponses[userRole] || defaultResponses.student;
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: message,
      isBot: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: generateBotResponse(message),
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1500);

    // Auto-scroll to bottom immediately for user message
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleQuickAction = (action) => {
    setMessage(action.text);
    handleSendMessage();
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: `Hello! I'm your AI assistant for LoopVerse. I can help you with ${
          userRole === 'admin' ? 'system management, user queries, and platform analytics' :
          userRole === 'teacher' ? 'course creation, student management, and teaching resources' :
          'learning guidance, course recommendations, and technical support'
        }. How can I assist you today?`,
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <LinearGradient
      colors={['#d299c2', '#fef9d7']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🤖 AI Assistant</Text>
          <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Quick Help</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.quickActions}>
              {quickActions[userRole]?.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.quickActionButton}
                  onPress={() => handleQuickAction(action)}
                >
                  <Text style={styles.quickActionIcon}>{action.icon}</Text>
                  <Text style={styles.quickActionText}>{action.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((msg) => (
            <View key={msg.id} style={[
              styles.messageItem,
              msg.isBot ? styles.botMessage : styles.userMessage
            ]}>
              <View style={[
                styles.messageBubble,
                msg.isBot ? styles.botBubble : styles.userBubble
              ]}>
                <Text style={[
                  styles.messageText,
                  msg.isBot ? styles.botMessageText : styles.userMessageText
                ]}>
                  {msg.text}
                </Text>
                <Text style={styles.messageTime}>{msg.timestamp}</Text>
              </View>
            </View>
          ))}
          
          {isTyping && (
            <View style={[styles.messageItem, styles.botMessage]}>
              <View style={[styles.messageBubble, styles.botBubble]}>
                <Text style={styles.typingText}>AI is typing...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Ask me anything..."
            placeholderTextColor="rgba(0,0,0,0.5)"
            value={message}
            onChangeText={setMessage}
            multiline
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={handleSendMessage}
            disabled={!message.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    flex: 1,
  },
  backButtonText: {
    color: '#8e44ad',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8e44ad',
    flex: 2,
    textAlign: 'center',
  },
  clearButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  clearButtonText: {
    color: '#8e44ad',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8e44ad',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
  },
  quickActionButton: {
    backgroundColor: 'rgba(142, 68, 173, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#8e44ad',
    fontWeight: '600',
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageItem: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
  },
  botBubble: {
    backgroundColor: 'rgba(142, 68, 173, 0.1)',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#8e44ad',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  botMessageText: {
    color: '#8e44ad',
  },
  userMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'right',
  },
  typingText: {
    fontSize: 16,
    color: '#8e44ad',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(142, 68, 173, 0.2)',
  },
  sendButton: {
    backgroundColor: '#8e44ad',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
