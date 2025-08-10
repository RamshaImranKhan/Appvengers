import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function StudentAISupport() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your AI learning assistant. How can I help you today? 🤖",
      isBot: true,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickActions = [
    {
      id: 1,
      title: 'Help with Assignment',
      icon: '📝',
      description: 'Get help with your current assignment',
      action: 'assignment_help'
    },
    {
      id: 2,
      title: 'Explain Concept',
      icon: '💡',
      description: 'Ask me to explain any programming concept',
      action: 'explain_concept'
    },
    {
      id: 3,
      title: 'Study Plan',
      icon: '📚',
      description: 'Create a personalized study plan',
      action: 'study_plan'
    },
    {
      id: 4,
      title: 'Debug Code',
      icon: '🐛',
      description: 'Help debug your code issues',
      action: 'debug_code'
    },
    {
      id: 5,
      title: 'Career Advice',
      icon: '🎯',
      description: 'Get advice on your tech career path',
      action: 'career_advice'
    },
    {
      id: 6,
      title: 'Practice Questions',
      icon: '❓',
      description: 'Generate practice questions for topics',
      action: 'practice_questions'
    }
  ];

  const studentResponses = {
    assignment_help: [
      "I'd be happy to help with your assignment! What specific topic or problem are you working on?",
      "Let me know which assignment you need help with. I can break down complex problems into manageable steps.",
      "What's the assignment about? I can provide explanations, examples, and guide you through the solution process."
    ],
    explain_concept: [
      "I love explaining concepts! What programming or technical concept would you like me to explain?",
      "Which concept are you struggling with? I can explain it in simple terms with examples.",
      "Tell me the concept you'd like to understand better, and I'll break it down step by step."
    ],
    study_plan: [
      "Let's create a study plan tailored to your goals! What subjects are you currently studying?",
      "I can help you organize your learning schedule. What are your main learning objectives?",
      "What topics do you want to focus on? I'll create a structured study plan with milestones."
    ],
    debug_code: [
      "I'm great at debugging! Share your code and describe the issue you're facing.",
      "What programming language are you working with? Describe the error or unexpected behavior.",
      "Let me help you find and fix that bug! What's the problem you're encountering?"
    ],
    career_advice: [
      "I'd love to help with your career planning! What area of technology interests you most?",
      "What's your current skill level and where do you want to be in your tech career?",
      "Let's discuss your career goals. Are you interested in web development, mobile apps, data science, or something else?"
    ],
    practice_questions: [
      "I can generate practice questions for any topic! What subject would you like to practice?",
      "What level of difficulty are you looking for? I can create beginner, intermediate, or advanced questions.",
      "Which programming language or concept do you want practice questions for?"
    ],
    general: [
      "That's a great question! Let me think about the best way to help you with that.",
      "I'm here to support your learning journey. Could you provide more details about what you need help with?",
      "Interesting! I can definitely help you with that. What specific aspect would you like to focus on?",
      "I understand what you're asking. Let me provide you with a comprehensive answer.",
      "That's something many students ask about. Here's what I recommend..."
    ]
  };

  const getRandomResponse = (category) => {
    const responses = studentResponses[category] || studentResponses.general;
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleQuickAction = (action) => {
    const userMessage = {
      id: messages.length + 1,
      text: quickActions.find(qa => qa.action === action)?.title || 'Quick action',
      isBot: false,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: getRandomResponse(action),
        isBot: true,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSendMessage = () => {
    if (inputText.trim() === '') return;

    const userMessage = {
      id: messages.length + 1,
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: getRandomResponse('general'),
        isBot: true,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear the chat history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setMessages([
              {
                id: 1,
                text: "Hi! I'm your AI learning assistant. How can I help you today? 🤖",
                isBot: true,
                timestamp: new Date().toLocaleTimeString()
              }
            ]);
            Alert.alert('Chat Cleared', 'Your chat history has been cleared.');
          }
        }
      ]
    );
  };

  const handleExportChat = () => {
    Alert.alert(
      'Export Chat',
      'Export your chat history as a text file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            console.log('Exporting chat history:', messages);
            Alert.alert('Success', 'Chat history exported successfully!');
          }
        }
      ]
    );
  };

  return (
    <LinearGradient
      colors={['#4facfe', '#00f2fe']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🤖 AI Support</Text>
        <TouchableOpacity onPress={handleClearChat} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.quickActionsTitle}>Quick Help</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsScroll}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionCard}
              onPress={() => handleQuickAction(action.action)}
            >
              <Text style={styles.quickActionIcon}>{action.icon}</Text>
              <Text style={styles.quickActionTitle}>{action.title}</Text>
              <Text style={styles.quickActionDescription}>{action.description}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Chat Messages */}
      <View style={styles.chatContainer}>
        <ScrollView 
          style={styles.messagesContainer} 
          showsVerticalScrollIndicator={false}
          ref={ref => {
            if (ref) {
              ref.scrollToEnd({ animated: true });
            }
          }}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.isBot ? styles.botMessageContainer : styles.userMessageContainer
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.isBot ? styles.botMessageBubble : styles.userMessageBubble
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.isBot ? styles.botMessageText : styles.userMessageText
                  ]}
                >
                  {message.text}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    message.isBot ? styles.botMessageTime : styles.userMessageTime
                  ]}
                >
                  {message.timestamp}
                </Text>
              </View>
            </View>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <View style={[styles.messageContainer, styles.botMessageContainer]}>
              <View style={[styles.messageBubble, styles.botMessageBubble]}>
                <Text style={styles.typingText}>AI is typing...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask me anything about your studies..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive]}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleExportChat}
        >
          <Text style={styles.actionButtonText}>📤 Export Chat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('AI Settings', 'AI assistant settings would open here')}
        >
          <Text style={styles.actionButtonText}>⚙️ Settings</Text>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
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
    flex: 1,
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  quickActionsScroll: {
    flexDirection: 'row',
  },
  quickActionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 120,
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 14,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  botMessageBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomLeftRadius: 4,
  },
  userMessageBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  botMessageText: {
    color: '#333',
  },
  userMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 10,
    opacity: 0.7,
  },
  botMessageTime: {
    color: '#666',
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  sendButtonActive: {
    backgroundColor: '#fff',
  },
  sendButtonInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  sendButtonText: {
    color: '#4facfe',
    fontWeight: '600',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    flex: 0.45,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
