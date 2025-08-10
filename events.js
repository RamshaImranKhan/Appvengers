import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function TeacherEvents() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  const [upcomingEvents] = useState([
    {
      id: 1,
      title: 'React Native Workshop',
      description: 'Advanced React Native development techniques and best practices',
      date: '2024-01-15',
      time: '10:00 AM - 12:00 PM',
      location: 'Virtual - Zoom Room A',
      attendees: 45,
      maxAttendees: 50,
      type: 'Workshop',
      status: 'confirmed',
      isHost: true,
      category: 'Technical',
      tags: ['React Native', 'Mobile Development', 'Workshop']
    },
    {
      id: 2,
      title: 'Mobile UI/UX Design Masterclass',
      description: 'Learn modern design principles for mobile applications',
      date: '2024-01-18',
      time: '2:00 PM - 4:00 PM',
      location: 'Design Lab - Room 301',
      attendees: 32,
      maxAttendees: 40,
      type: 'Masterclass',
      status: 'confirmed',
      isHost: true,
      category: 'Design',
      tags: ['UI/UX', 'Design', 'Mobile']
    },
    {
      id: 3,
      title: 'JavaScript Fundamentals Seminar',
      description: 'Core JavaScript concepts every developer should know',
      date: '2024-01-22',
      time: '11:00 AM - 1:00 PM',
      location: 'Virtual - Teams Meeting',
      attendees: 28,
      maxAttendees: 35,
      type: 'Seminar',
      status: 'pending',
      isHost: false,
      category: 'Programming',
      tags: ['JavaScript', 'Programming', 'Fundamentals']
    },
    {
      id: 4,
      title: 'Student Project Showcase',
      description: 'Students present their final projects and receive feedback',
      date: '2024-01-25',
      time: '3:00 PM - 5:00 PM',
      location: 'Main Auditorium',
      attendees: 85,
      maxAttendees: 100,
      type: 'Showcase',
      status: 'confirmed',
      isHost: true,
      category: 'Academic',
      tags: ['Projects', 'Showcase', 'Students']
    }
  ]);

  const [pastEvents] = useState([
    {
      id: 5,
      title: 'Introduction to Mobile Development',
      description: 'Basic concepts and tools for mobile app development',
      date: '2024-01-08',
      time: '9:00 AM - 11:00 AM',
      location: 'Computer Lab - Room 205',
      attendees: 42,
      maxAttendees: 45,
      type: 'Workshop',
      status: 'completed',
      isHost: true,
      category: 'Technical',
      rating: 4.8,
      feedback: 'Excellent workshop! Very informative and well-structured.',
      tags: ['Mobile', 'Development', 'Introduction']
    },
    {
      id: 6,
      title: 'Code Review Best Practices',
      description: 'Learn effective code review techniques and tools',
      date: '2024-01-05',
      time: '1:00 PM - 3:00 PM',
      location: 'Virtual - Zoom Room B',
      attendees: 38,
      maxAttendees: 40,
      type: 'Workshop',
      status: 'completed',
      isHost: true,
      category: 'Best Practices',
      rating: 4.6,
      feedback: 'Great insights into code review processes.',
      tags: ['Code Review', 'Best Practices', 'Development']
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#43e97b';
      case 'pending': return '#feca57';
      case 'cancelled': return '#ff6b6b';
      case 'completed': return '#4facfe';
      default: return '#a8a8a8';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Workshop': return '🛠️';
      case 'Masterclass': return '🎓';
      case 'Seminar': return '📚';
      case 'Showcase': return '🎭';
      case 'Conference': return '🏛️';
      default: return '📅';
    }
  };

  const filteredUpcomingEvents = upcomingEvents.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPastEvents = pastEvents.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEventAction = (eventId, action) => {
    const allEvents = [...upcomingEvents, ...pastEvents];
    const event = allEvents.find(e => e.id === eventId);
    
    switch (action) {
      case 'join':
        Alert.alert('Join Event', `Joining "${event?.title}"...`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Join', onPress: () => console.log('Joining event:', eventId) }
        ]);
        break;
      case 'edit':
        Alert.alert('Edit Event', `Edit "${event?.title}"?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Edit', onPress: () => console.log('Editing event:', eventId) }
        ]);
        break;
      case 'cancel':
        Alert.alert('Cancel Event', `Cancel "${event?.title}"?`, [
          { text: 'No', style: 'cancel' },
          { text: 'Yes', style: 'destructive', onPress: () => console.log('Cancelling event:', eventId) }
        ]);
        break;
      case 'details':
        Alert.alert('Event Details', `Viewing details for "${event?.title}"`);
        break;
      case 'attendees':
        Alert.alert('Manage Attendees', `Managing attendees for "${event?.title}"`);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const renderEventCard = (event) => (
    <View key={event.id} style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <View style={styles.eventTitleRow}>
          <Text style={styles.eventIcon}>{getTypeIcon(event.type)}</Text>
          <View style={styles.eventTitleInfo}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventType}>{event.type} • {event.category}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) }]}>
            <Text style={styles.statusText}>{event.status.toUpperCase()}</Text>
          </View>
        </View>
        {event.isHost && (
          <View style={styles.hostBadge}>
            <Text style={styles.hostText}>👑 HOST</Text>
          </View>
        )}
      </View>

      <Text style={styles.eventDescription}>{event.description}</Text>

      <View style={styles.eventDetails}>
        <View style={styles.eventDetailRow}>
          <Text style={styles.eventDetailIcon}>📅</Text>
          <Text style={styles.eventDetailText}>{event.date}</Text>
        </View>
        <View style={styles.eventDetailRow}>
          <Text style={styles.eventDetailIcon}>⏰</Text>
          <Text style={styles.eventDetailText}>{event.time}</Text>
        </View>
        <View style={styles.eventDetailRow}>
          <Text style={styles.eventDetailIcon}>📍</Text>
          <Text style={styles.eventDetailText}>{event.location}</Text>
        </View>
        <View style={styles.eventDetailRow}>
          <Text style={styles.eventDetailIcon}>👥</Text>
          <Text style={styles.eventDetailText}>{event.attendees}/{event.maxAttendees} attendees</Text>
        </View>
      </View>

      {/* Tags */}
      <View style={styles.tagsContainer}>
        {event.tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      {/* Past Event Rating */}
      {event.rating && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingLabel}>Rating: </Text>
          <Text style={styles.ratingValue}>⭐ {event.rating}/5.0</Text>
          {event.feedback && (
            <Text style={styles.feedbackText}>"{event.feedback}"</Text>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.eventActions}>
        {activeTab === 'upcoming' ? (
          <>
            {event.status === 'confirmed' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.joinButton]}
                onPress={() => handleEventAction(event.id, 'join')}
              >
                <Text style={styles.actionButtonText}>🎯 Join Event</Text>
              </TouchableOpacity>
            )}
            {event.isHost && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEventAction(event.id, 'edit')}
                >
                  <Text style={styles.actionButtonText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.attendeesButton]}
                  onPress={() => handleEventAction(event.id, 'attendees')}
                >
                  <Text style={styles.actionButtonText}>👥 Attendees</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.detailsButton]}
              onPress={() => handleEventAction(event.id, 'details')}
            >
              <Text style={styles.actionButtonText}>📋 Details</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.detailsButton]}
              onPress={() => handleEventAction(event.id, 'details')}
            >
              <Text style={styles.actionButtonText}>📋 View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.reportButton]}
              onPress={() => Alert.alert('Event Report', `Generating report for "${event.title}"`)}
            >
              <Text style={styles.actionButtonText}>📊 Report</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  const renderCreateEvent = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.createEventContainer}>
        <Text style={styles.sectionTitle}>🎯 Create New Event</Text>
        
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Event Title</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Enter event title..."
            placeholderTextColor="rgba(255,255,255,0.7)"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Description</Text>
          <TextInput
            style={[styles.formInput, styles.textArea]}
            placeholder="Describe your event..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formSection, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.formLabel}>Date</Text>
            <TouchableOpacity style={styles.formInput}>
              <Text style={styles.formInputText}>📅 Select Date</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.formSection, { flex: 1, marginLeft: 10 }]}>
            <Text style={styles.formLabel}>Time</Text>
            <TouchableOpacity style={styles.formInput}>
              <Text style={styles.formInputText}>⏰ Select Time</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Location</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Event location or virtual link..."
            placeholderTextColor="rgba(255,255,255,0.7)"
          />
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formSection, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.formLabel}>Event Type</Text>
            <TouchableOpacity style={styles.formInput}>
              <Text style={styles.formInputText}>🛠️ Workshop</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.formSection, { flex: 1, marginLeft: 10 }]}>
            <Text style={styles.formLabel}>Max Attendees</Text>
            <TextInput
              style={styles.formInput}
              placeholder="50"
              placeholderTextColor="rgba(255,255,255,0.7)"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Category</Text>
          <TouchableOpacity style={styles.formInput}>
            <Text style={styles.formInputText}>📚 Technical</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Tags (comma separated)</Text>
          <TextInput
            style={styles.formInput}
            placeholder="React Native, Mobile, Development"
            placeholderTextColor="rgba(255,255,255,0.7)"
          />
        </View>

        <View style={styles.createEventActions}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => Alert.alert('Create Event', 'Event created successfully!')}
          >
            <Text style={styles.createButtonText}>🎯 Create Event</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.draftButton}
            onPress={() => Alert.alert('Save Draft', 'Event saved as draft!')}
          >
            <Text style={styles.draftButtonText}>💾 Save as Draft</Text>
          </TouchableOpacity>
        </View>
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
        <Text style={styles.title}>📅 Events</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          placeholderTextColor="rgba(255,255,255,0.7)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            📅 Upcoming ({filteredUpcomingEvents.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
            📚 Past ({filteredPastEvents.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'create' && styles.activeTab]}
          onPress={() => setActiveTab('create')}
        >
          <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>
            ➕ Create
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'upcoming' && (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {filteredUpcomingEvents.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📅</Text>
                <Text style={styles.emptyStateText}>No upcoming events found</Text>
                <Text style={styles.emptyStateSubtext}>Create a new event or check back later</Text>
              </View>
            ) : (
              filteredUpcomingEvents.map(renderEventCard)
            )}
          </ScrollView>
        )}
        
        {activeTab === 'past' && (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {filteredPastEvents.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📚</Text>
                <Text style={styles.emptyStateText}>No past events found</Text>
                <Text style={styles.emptyStateSubtext}>Your completed events will appear here</Text>
              </View>
            ) : (
              filteredPastEvents.map(renderEventCard)
            )}
          </ScrollView>
        )}
        
        {activeTab === 'create' && renderCreateEvent()}
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
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
    fontSize: 12,
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
  eventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  eventHeader: {
    marginBottom: 12,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  eventTitleInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  eventType: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  hostBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  hostText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '600',
  },
  eventDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: 12,
  },
  eventDetails: {
    marginBottom: 12,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventDetailIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  eventDetailText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  ratingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
  eventActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  joinButton: {
    backgroundColor: '#43e97b',
  },
  editButton: {
    backgroundColor: '#4facfe',
  },
  attendeesButton: {
    backgroundColor: '#feca57',
  },
  detailsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  reportButton: {
    backgroundColor: '#a8edea',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  createEventContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    justifyContent: 'center',
  },
  formInputText: {
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  createEventActions: {
    marginTop: 20,
    marginBottom: 40,
  },
  createButton: {
    backgroundColor: '#43e97b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  draftButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  draftButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
