import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function TeacherAIAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI Teaching Assistant for LoopVerse. I can help you with course creation, student engagement, lesson planning, and teaching strategies. How can I assist you today?",
      isBot: true,
      timestamp: new Date(Date.now() - 60000)
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef(null);

  const teacherQuickActions = [
    { id: 1, text: "📚 Course creation help", action: "course_creation" },
    { id: 2, text: "👥 Student engagement tips", action: "engagement" },
    { id: 3, text: "📝 Lesson planning guide", action: "lesson_planning" },
    { id: 4, text: "📊 Assessment strategies", action: "assessment" },
    { id: 5, text: "🎯 Learning objectives", action: "objectives" },
    { id: 6, text: "💡 Teaching best practices", action: "best_practices" }
  ];

  const teacherResponses = {
    course_creation: "**Course Creation Guide:**\n\n📚 **Structure Your Course:**\n• Start with clear learning objectives\n• Break content into digestible modules\n• Include practical exercises and projects\n• Add quizzes and assessments\n\n🎯 **Best Practices:**\n• Use multimedia content (videos, images, interactive elements)\n• Provide downloadable resources\n• Create engaging introductions for each module\n• Include real-world examples and case studies\n\n📋 **Course Outline Template:**\n1. Introduction & Overview\n2. Core Concepts (3-5 modules)\n3. Practical Applications\n4. Projects & Assignments\n5. Final Assessment\n6. Resources & Next Steps\n\nWould you like help with any specific aspect of course creation?",
    
    engagement: "**Student Engagement Strategies:**\n\n🎯 **Interactive Elements:**\n• Use polls and quizzes during lessons\n• Encourage discussion forums\n• Create group projects and peer reviews\n• Implement gamification elements\n\n💬 **Communication Tips:**\n• Respond to student questions within 24 hours\n• Use encouraging and constructive feedback\n• Share personal experiences and stories\n• Host live Q&A sessions regularly\n\n🏆 **Motivation Techniques:**\n• Set clear milestones and celebrate achievements\n• Provide certificates and badges\n• Create leaderboards for friendly competition\n• Offer bonus content for active participants\n\n📱 **Modern Engagement:**\n• Use mobile-friendly content\n• Include short video explanations\n• Create interactive coding exercises\n• Encourage social media discussions with course hashtags",
    
    lesson_planning: "**Effective Lesson Planning:**\n\n📋 **Lesson Structure (ADDIE Model):**\n• **Analyze:** Identify student needs and prerequisites\n• **Design:** Create learning objectives and outcomes\n• **Develop:** Build content, activities, and assessments\n• **Implement:** Deliver the lesson effectively\n• **Evaluate:** Assess learning and gather feedback\n\n⏰ **Time Management:**\n• Introduction: 5-10% of lesson time\n• Main content: 70-80% of lesson time\n• Practice/Activity: 10-15% of lesson time\n• Wrap-up/Summary: 5% of lesson time\n\n🎯 **Learning Objectives (SMART):**\n• Specific: Clear and well-defined\n• Measurable: Can be assessed\n• Achievable: Realistic for student level\n• Relevant: Connects to course goals\n• Time-bound: Has a clear timeline\n\n📝 **Lesson Plan Template:**\n1. Learning objectives\n2. Prerequisites\n3. Materials needed\n4. Step-by-step activities\n5. Assessment methods\n6. Homework/Follow-up",
    
    assessment: "**Assessment Strategies:**\n\n📊 **Types of Assessment:**\n• **Formative:** Ongoing feedback (quizzes, discussions)\n• **Summative:** Final evaluation (exams, projects)\n• **Peer Assessment:** Students evaluate each other\n• **Self-Assessment:** Students reflect on their learning\n\n✅ **Assessment Methods:**\n• Multiple choice questions for knowledge recall\n• Coding challenges for practical skills\n• Project-based assessments for application\n• Presentations for communication skills\n• Portfolio reviews for comprehensive evaluation\n\n🎯 **Rubric Creation:**\n• Define clear criteria and performance levels\n• Use specific, measurable language\n• Include both technical and soft skills\n• Provide examples of each performance level\n\n📈 **Feedback Best Practices:**\n• Be specific and actionable\n• Balance positive and constructive feedback\n• Provide feedback promptly\n• Encourage self-reflection\n• Offer resources for improvement",
    
    objectives: "**Writing Effective Learning Objectives:**\n\n🎯 **Bloom's Taxonomy Levels:**\n• **Remember:** Recall facts and basic concepts\n• **Understand:** Explain ideas or concepts\n• **Apply:** Use information in new situations\n• **Analyze:** Draw connections among ideas\n• **Evaluate:** Justify a stand or decision\n• **Create:** Produce new or original work\n\n📝 **Objective Writing Formula:**\n\"By the end of this lesson, students will be able to [ACTION VERB] [CONTENT] [CONDITION] [CRITERIA]\"\n\n💡 **Examples:**\n• \"Students will be able to create a React Native app with navigation using Expo Router\"\n• \"Students will be able to explain the differences between props and state in React\"\n• \"Students will be able to debug common JavaScript errors using browser dev tools\"\n\n✅ **Quality Checklist:**\n• Uses measurable action verbs\n• Focuses on student performance\n• Is specific and clear\n• Aligns with course goals\n• Is achievable within the timeframe",
    
    best_practices: "**Teaching Best Practices:**\n\n👨‍🏫 **Effective Teaching Methods:**\n• **Active Learning:** Engage students in the learning process\n• **Scaffolding:** Build on prior knowledge gradually\n• **Differentiation:** Adapt to different learning styles\n• **Authentic Assessment:** Use real-world applications\n\n🎓 **Online Teaching Tips:**\n• Keep videos under 10 minutes for better retention\n• Use clear, high-quality audio and video\n• Provide transcripts and captions\n• Create interactive elements to maintain attention\n\n💬 **Communication Excellence:**\n• Be approachable and responsive\n• Use clear, jargon-free language\n• Provide multiple ways to contact you\n• Set clear expectations and boundaries\n\n📚 **Content Delivery:**\n• Start with why (explain relevance)\n• Use the 'tell, show, do' method\n• Provide multiple examples\n• Include common mistakes and how to avoid them\n\n🔄 **Continuous Improvement:**\n• Collect regular student feedback\n• Stay updated with industry trends\n• Attend teaching workshops and webinars\n• Collaborate with other educators"
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const botResponse = generateTeacherResponse(inputText.trim());
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateTeacherResponse = (input) => {
    const lowerInput = input.toLowerCase();

    // Check for specific teacher keywords
    if (lowerInput.includes('course') || lowerInput.includes('curriculum') || lowerInput.includes('create')) {
      return teacherResponses.course_creation;
    } else if (lowerInput.includes('student') || lowerInput.includes('engage') || lowerInput.includes('participation')) {
      return teacherResponses.engagement;
    } else if (lowerInput.includes('lesson') || lowerInput.includes('plan') || lowerInput.includes('structure')) {
      return teacherResponses.lesson_planning;
    } else if (lowerInput.includes('assess') || lowerInput.includes('grade') || lowerInput.includes('test') || lowerInput.includes('quiz')) {
      return teacherResponses.assessment;
    } else if (lowerInput.includes('objective') || lowerInput.includes('goal') || lowerInput.includes('outcome')) {
      return teacherResponses.objectives;
    } else if (lowerInput.includes('practice') || lowerInput.includes('tip') || lowerInput.includes('method') || lowerInput.includes('strategy')) {
      return teacherResponses.best_practices;
    } else if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
      return "Hello! I'm here to support your teaching journey. I can help you with course creation, student engagement strategies, lesson planning, assessment methods, and teaching best practices. What would you like to work on today?";
    } else if (lowerInput.includes('help')) {
      return "I'm here to help you become an even better educator! I can assist with:\n\n🎓 **Teaching Support:**\n• Course design and curriculum development\n• Lesson planning and structure\n• Student engagement strategies\n• Assessment and grading methods\n\n📚 **Content Creation:**\n• Writing learning objectives\n• Creating interactive activities\n• Developing multimedia content\n• Building effective presentations\n\n💡 **Professional Development:**\n• Teaching best practices\n• Online education techniques\n• Student motivation strategies\n• Feedback and communication skills\n\nWhat specific area would you like help with?";
    } else {
      return `I understand you're asking about "${input}". As your AI Teaching Assistant, I can help you with:\n\n• **Course Development** - Creating engaging and effective courses\n• **Student Engagement** - Strategies to keep students motivated and active\n• **Lesson Planning** - Structuring effective learning experiences\n• **Assessment Methods** - Evaluating student progress effectively\n• **Teaching Strategies** - Best practices for online and in-person teaching\n• **Professional Growth** - Improving your teaching skills and methods\n\nCould you be more specific about what teaching challenge you're facing? You can also use the quick action buttons below for common teaching topics.`;
    }
  };

  const handleQuickAction = (action) => {
    const response = teacherResponses[action];
    if (response) {
      const botMessage = {
        id: Date.now(),
        text: response,
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear the chat history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: () => {
            setMessages([{
              id: 1,
              text: "Chat cleared! I'm ready to help you with your teaching needs. What can I assist you with?",
              isBot: true,
              timestamp: new Date()
            }]);
          }
        }
      ]
    );
  };

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
        <Text style={styles.title}>🤖 AI Teaching Assistant</Text>
        <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.quickActionsTitle}>Quick Help:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsScroll}>
          {teacherQuickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionButton}
              onPress={() => handleQuickAction(action.action)}
            >
              <Text style={styles.quickActionText}>{action.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
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
              <Text style={[
                styles.messageText,
                message.isBot ? styles.botMessageText : styles.userMessageText
              ]}>
                {message.text}
              </Text>
              <Text style={[
                styles.messageTime,
                message.isBot ? styles.botMessageTime : styles.userMessageTime
              ]}>
                {formatTimestamp(message.timestamp)}
              </Text>
            </View>
          </View>
        ))}

        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>AI is thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask about teaching strategies, course creation, student engagement..."
          placeholderTextColor="rgba(255,255,255,0.7)"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
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
    flex: 1,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    flex: 2,
  },
  clearButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickActionsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickActionsScroll: {
    flexDirection: 'row',
  },
  quickActionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesContent: {
    paddingBottom: 20,
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
    maxWidth: width * 0.75,
    borderRadius: 16,
    padding: 12,
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
    fontSize: 15,
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
    fontSize: 11,
    opacity: 0.7,
  },
  botMessageTime: {
    color: '#666',
  },
  userMessageTime: {
    color: '#fff',
  },
  typingContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  typingBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
  },
  typingText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#f093fb',
    fontWeight: '600',
  },
});
