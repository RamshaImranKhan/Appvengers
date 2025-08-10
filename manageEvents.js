import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function ManageEvents() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    capacity: '',
    type: 'workshop'
  });

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      console.log('🔄 Loading events from backend...');
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.log('⚠️ Error loading events:', error.message);
        setUpcomingEvents([]);
        setPastEvents([]);
      } else {
        console.log('✅ Loaded', events?.length || 0, 'events');
        
        const currentDate = new Date().toISOString().split('T')[0];
        const upcoming = events?.filter(event => event.date >= currentDate) || [];
        const past = events?.filter(event => event.date < currentDate) || [];
        
        setUpcomingEvents(upcoming);
        setPastEvents(past);
      }
    } catch (err) {
      console.error('❌ Failed to load events:', err);
      setUpcomingEvents([]);
      setPastEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.description.trim() || !newEvent.date.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      console.log('🔄 Creating event:', newEvent);
      
      const eventData = {
        title: newEvent.title.trim(),
        description: newEvent.description.trim(),
        date: newEvent.date.trim(),
        time: newEvent.time.trim() || '10:00 AM',
        location: newEvent.location.trim() || 'TBD',
        capacity: parseInt(newEvent.capacity) || 50,
        type: newEvent.type,
        status: 'active',
        registered: 0,
        organizer: 'Admin',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating event:', error);
        Alert.alert('Error', 'Failed to create event. Please try again.');
        return;
      }

      console.log('✅ Event created successfully:', data);
      Alert.alert('Success', 'Event created successfully!');
      
      // Reset form
      setNewEvent({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        capacity: '',
        type: 'workshop'
      });
      setShowCreateForm(false);
      
      // Reload events
      loadEvents();
      
    } catch (err) {
      console.error('❌ Error creating event:', err);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    }
  };

  const handleEventAction = async (eventId, action) => {
    Alert.alert(
      `${action} Event`,
      `Are you sure you want to ${action.toLowerCase()} this event?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          onPress: async () => {
            try {
              console.log(`🔄 ${action} event:`, eventId);
              
              let updateData = {};
              if (action === 'Cancel') {
                updateData.status = 'cancelled';
              } else if (action === 'Delete') {
                const { error } = await supabase
                  .from('events')
                  .delete()
                  .eq('id', eventId);
                  
                if (error) {
                  console.error('❌ Error deleting event:', error);
                  Alert.alert('Error', 'Failed to delete event');
                  return;
                }
                
                console.log('✅ Event deleted successfully');
                Alert.alert('Success', 'Event deleted successfully!');
                loadEvents();
                return;
              }
              
              if (Object.keys(updateData).length > 0) {
                const { error } = await supabase
                  .from('events')
                  .update(updateData)
                  .eq('id', eventId);
                  
                if (error) {
                  console.error('❌ Error updating event:', error);
                  Alert.alert('Error', 'Failed to update event');
                  return;
                }
                
                console.log('✅ Event updated successfully');
                Alert.alert('Success', `Event ${action.toLowerCase()}ed successfully!`);
                loadEvents();
              }
              
            } catch (err) {
              console.error('❌ Error with event action:', err);
              Alert.alert('Error', 'Operation failed. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#43e97b';
      case 'full': return '#feca57';
      case 'completed': return '#667eea';
      case 'cancelled': return '#ff6b6b';
      default: return '#gray';
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      'workshop': '#4facfe',
      'seminar': '#f093fb',
      'bootcamp': '#43e97b',
      'masterclass': '#feca57',
      'networking': '#ff6b6b'
    };
    return colors[type] || '#667eea';
  };

  const renderUpcomingEvents = () => (
    <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
      {upcomingEvents.map((event) => (
        <View key={event.id} style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) }]}>
              <Text style={styles.statusText}>{event.status}</Text>
            </View>
          </View>

          <Text style={styles.eventDescription}>{event.description}</Text>

          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📅</Text>
              <Text style={styles.detailText}>{event.date} at {event.time}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText}>{event.location}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>👥</Text>
              <Text style={styles.detailText}>
                {event.registered}/{event.capacity} registered
              </Text>
            </View>
            <View style={styles.detailRow}>
              <View style={[styles.typeBadge, { backgroundColor: getTypeColor(event.type) }]}>
                <Text style={styles.typeText}>{event.type}</Text>
              </View>
              <Text style={styles.organizerText}>by {event.organizer}</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                { width: `${(event.registered / event.capacity) * 100}%` }
              ]} />
            </View>
            <Text style={styles.progressText}>
              {Math.round((event.registered / event.capacity) * 100)}% full
            </Text>
          </View>

          <View style={styles.eventActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Alert.alert(
                  'Event Details',
                  `Title: ${event.title}\nDate: ${event.date} at ${event.time}\nLocation: ${event.location}\nCapacity: ${event.capacity}\nRegistered: ${event.registered || 0}\nStatus: ${event.status}\nType: ${event.type}`
                );
              }}
            >
              <Text style={styles.actionButtonText}>👁️ View</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // TODO: Implement edit functionality
                Alert.alert('Edit Event', 'Edit functionality will be implemented in future updates.');
              }}
            >
              <Text style={styles.actionButtonText}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Alert.alert(
                  'Event Attendees',
                  `${event.registered || 0} people registered out of ${event.capacity} capacity.\n\nRegistration rate: ${Math.round(((event.registered || 0) / event.capacity) * 100)}%`
                );
              }}
            >
              <Text style={styles.actionButtonText}>👥 Attendees</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#ff6b6b' }]}
              onPress={() => handleEventAction(event.id, 'Cancel')}
            >
              <Text style={styles.actionButtonText}>❌ Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderPastEvents = () => (
    <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
      {pastEvents.map((event) => (
        <View key={event.id} style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) }]}>
              <Text style={styles.statusText}>{event.status}</Text>
            </View>
          </View>

          <Text style={styles.eventDescription}>{event.description}</Text>

          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📅</Text>
              <Text style={styles.detailText}>{event.date} at {event.time}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>👥</Text>
              <Text style={styles.detailText}>
                {event.attended}/{event.capacity} attended
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>⭐</Text>
              <Text style={styles.detailText}>Rating: {event.feedback}/5.0</Text>
            </View>
          </View>

          <View style={styles.eventActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Alert.alert(
                  'Event Report',
                  `Event: ${event.title}\nDate: ${event.date}\nAttended: ${event.attended || 0}/${event.capacity}\nAttendance Rate: ${Math.round(((event.attended || 0) / event.capacity) * 100)}%\nStatus: ${event.status}`
                );
              }}
            >
              <Text style={styles.actionButtonText}>📊 Report</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                const rating = event.feedback || 0;
                Alert.alert(
                  'Event Feedback',
                  `Average Rating: ${rating}/5.0\n\n${rating >= 4 ? 'Excellent feedback!' : rating >= 3 ? 'Good feedback!' : rating >= 2 ? 'Fair feedback.' : 'Needs improvement.'}`
                );
              }}
            >
              <Text style={styles.actionButtonText}>💬 Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderCreateForm = () => (
    <ScrollView style={styles.createForm} showsVerticalScrollIndicator={false}>
      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Event Title *</Text>
        <TextInput
          style={styles.fieldInput}
          placeholder="Enter event title..."
          placeholderTextColor="rgba(255,255,255,0.7)"
          value={newEvent.title}
          onChangeText={(text) => setNewEvent(prev => ({ ...prev, title: text }))}
        />
      </View>

      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Description *</Text>
        <TextInput
          style={styles.fieldTextArea}
          placeholder="Enter event description..."
          placeholderTextColor="rgba(255,255,255,0.7)"
          value={newEvent.description}
          onChangeText={(text) => setNewEvent(prev => ({ ...prev, description: text }))}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.formRow}>
        <View style={styles.formFieldHalf}>
          <Text style={styles.fieldLabel}>Date *</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={newEvent.date}
            onChangeText={(text) => setNewEvent(prev => ({ ...prev, date: text }))}
          />
        </View>
        <View style={styles.formFieldHalf}>
          <Text style={styles.fieldLabel}>Time</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="HH:MM AM/PM"
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={newEvent.time}
            onChangeText={(text) => setNewEvent(prev => ({ ...prev, time: text }))}
          />
        </View>
      </View>

      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Location</Text>
        <TextInput
          style={styles.fieldInput}
          placeholder="Enter event location..."
          placeholderTextColor="rgba(255,255,255,0.7)"
          value={newEvent.location}
          onChangeText={(text) => setNewEvent(prev => ({ ...prev, location: text }))}
        />
      </View>

      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Capacity</Text>
        <TextInput
          style={styles.fieldInput}
          placeholder="Maximum attendees"
          placeholderTextColor="rgba(255,255,255,0.7)"
          value={newEvent.capacity}
          onChangeText={(text) => setNewEvent(prev => ({ ...prev, capacity: text }))}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Event Type</Text>
        <View style={styles.typeButtons}>
          {['workshop', 'seminar', 'bootcamp', 'masterclass', 'networking'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                { backgroundColor: getTypeColor(type) },
                newEvent.type === type && styles.activeTypeButton
              ]}
              onPress={() => setNewEvent(prev => ({ ...prev, type }))}
            >
              <Text style={styles.typeButtonText}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            setShowCreateForm(false);
            setNewEvent({
              title: '',
              description: '',
              date: '',
              time: '',
              location: '',
              capacity: '',
              type: 'workshop'
            });
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateEvent}
        >
          <Text style={styles.createButtonText}>Create Event</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

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
        <Text style={styles.title}>Events Management</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            📅 Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
            📊 Past Events
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'create' && styles.activeTab]}
          onPress={() => setActiveTab('create')}
        >
          <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>
            ➕ Create New
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'upcoming' && renderUpcomingEvents()}
        {activeTab === 'past' && renderPastEvents()}
        {activeTab === 'create' && renderCreateForm()}
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
    fontSize: 12,
  },
  activeTabText: {
    color: '#667eea',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  eventsList: {
    flex: 1,
  },
  eventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  detailText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  typeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  organizerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#43e97b',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    minWidth: 60,
  },
  eventActions: {
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
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  createForm: {
    flex: 1,
  },
  formField: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formFieldHalf: {
    width: (width - 60) / 2,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  fieldInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  fieldTextArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    opacity: 0.7,
  },
  activeTypeButton: {
    opacity: 1,
    transform: [{ scale: 1.05 }],
  },
  typeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 0.48,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#667eea',
    fontWeight: '600',
  },
});
