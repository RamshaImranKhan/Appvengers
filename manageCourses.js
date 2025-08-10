import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function TeacherManageCourses() {
  const [activeTab, setActiveTab] = useState('my-courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [myCourses, setMyCourses] = useState([]);
  const [courseStats, setCourseStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    averageRating: 0,
    totalRevenue: '$0'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state for course creation
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: 'Mobile Development',
    duration: '',
    price: 0,
    difficulty: 'Beginner'
  });

  useEffect(() => {
    loadTeacherCourses();
  }, []);

  const loadTeacherCourses = async () => {
    try {
      console.log('🔄 Loading teacher courses from backend...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Load teacher's courses with simplified query for better performance
        const { data: courses, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .eq('instructor_id', user.id)
          .order('created_at', { ascending: false });
        
        if (!coursesError && courses) {
          const coursesWithStats = courses.map(course => ({
            id: course.id,
            title: course.title,
            description: course.description,
            students: 0, // Will be loaded separately if needed
            progress: course.completion_rate || 0,
            status: course.status || 'draft',
            rating: course.rating || 0,
            lessons: course.total_lessons || 0,
            duration: course.duration || '0 hours',
            category: course.category || 'General',
            thumbnail: course.thumbnail || '📚'
          }));
          
          setMyCourses(coursesWithStats);
          
          // Calculate basic stats without complex joins
          const averageRating = courses.length > 0 ? 
            courses.reduce((sum, course) => sum + (course.rating || 0), 0) / courses.length : 0;
          
          setCourseStats({
            totalCourses: courses.length,
            totalStudents: 0, // Can be loaded separately if needed
            averageRating: Math.round(averageRating * 10) / 10,
            totalRevenue: '$0'
          });
        } else {
          console.log('⚠️ Error loading courses:', coursesError?.message || 'Unknown error');
          setMyCourses([]);
          setCourseStats({
            totalCourses: 0,
            totalStudents: 0,
            averageRating: 0,
            totalRevenue: '$0'
          });
        }
      } else {
        console.log('⚠️ No user found');
        setMyCourses([]);
      }
      
      console.log('✅ Teacher courses loaded successfully');
    } catch (err) {
      console.error('❌ Failed to load teacher courses:', err);
      setMyCourses([]);
      setCourseStats({
        totalCourses: 0,
        totalStudents: 0,
        averageRating: 0,
        totalRevenue: '$0'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCourseAction = (courseId, action) => {
    Alert.alert(
      `${action} Course`,
      `Are you sure you want to ${action.toLowerCase()} this course?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          onPress: () => {
            console.log(`${action} course:`, courseId);
            Alert.alert('Success', `Course ${action.toLowerCase()}ed successfully!`);
          }
        }
      ]
    );
  };

  const handleCreateCourse = () => {
    setActiveTab('create-course');
  };

  const saveCourse = async (status = 'draft') => {
    if (!courseForm.title.trim()) {
      Alert.alert('Error', 'Please enter a course title');
      return;
    }

    if (!courseForm.description.trim()) {
      Alert.alert('Error', 'Please enter a course description');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create a course');
        return;
      }

      const courseData = {
        title: courseForm.title.trim(),
        description: courseForm.description.trim(),
        category: courseForm.category,
        duration: courseForm.duration || '0 hours',
        price: courseForm.price || 0,
        difficulty: courseForm.difficulty,
        instructor_id: user.id,
        status: status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_lessons: 0,
        completion_rate: 0,
        rating: 0,
        thumbnail: getCategoryEmoji(courseForm.category)
      };

      const { data, error } = await supabase
        .from('courses')
        .insert([courseData])
        .select()
        .single();

      if (error) {
        console.error('Error creating course:', error);
        Alert.alert('Error', 'Failed to create course. Please try again.');
        return;
      }

      console.log('✅ Course created successfully:', data);
      
      // Reset form
      setCourseForm({
        title: '',
        description: '',
        category: 'Mobile Development',
        duration: '',
        price: 0,
        difficulty: 'Beginner'
      });

      // Reload courses
      await loadTeacherCourses();

      if (status === 'draft') {
        Alert.alert('Success', 'Course saved as draft successfully!', [
          { text: 'OK', onPress: () => setActiveTab('my-courses') }
        ]);
      } else {
        Alert.alert('Success', 'Course created and ready for setup!', [
          { text: 'OK', onPress: () => setActiveTab('my-courses') }
        ]);
      }

    } catch (err) {
      console.error('Error saving course:', err);
      Alert.alert('Error', 'Failed to save course. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      'Mobile Development': '📱',
      'Web Development': '🌐',
      'Design': '🎨',
      'Programming': '💻',
      'Data Science': '📊'
    };
    return emojis[category] || '📚';
  };

  const updateFormField = (field, value) => {
    setCourseForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return '#43e97b';
      case 'draft': return '#feca57';
      case 'under-review': return '#ff6b6b';
      default: return '#gray';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Mobile Development': '#4facfe',
      'Web Development': '#f093fb',
      'Design': '#43e97b',
      'Programming': '#feca57',
      'Data Science': '#ff6b6b'
    };
    return colors[category] || '#667eea';
  };

  const filteredCourses = myCourses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMyCourses = () => (
    <ScrollView style={styles.coursesList} showsVerticalScrollIndicator={false}>
      {/* Course Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>📊 Your Teaching Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{courseStats.totalCourses}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{courseStats.totalStudents}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{courseStats.averageRating}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{courseStats.totalRevenue}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search your courses..."
          placeholderTextColor="rgba(255,255,255,0.7)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Courses List */}
      {filteredCourses.map((course) => (
        <View key={course.id} style={styles.courseCard}>
          <View style={styles.courseHeader}>
            <View style={styles.courseThumbnail}>
              <Text style={styles.thumbnailIcon}>{course.thumbnail}</Text>
            </View>
            <View style={styles.courseInfo}>
              <Text style={styles.courseTitle}>{course.title}</Text>
              <Text style={styles.courseDescription}>{course.description}</Text>
              <View style={styles.courseMeta}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(course.category) }]}>
                  <Text style={styles.categoryText}>{course.category}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(course.status) }]}>
                  <Text style={styles.statusText}>{course.status}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.courseStats}>
            <View style={styles.courseStatItem}>
              <Text style={styles.courseStatIcon}>👥</Text>
              <Text style={styles.courseStatText}>{course.students} students</Text>
            </View>
            <View style={styles.courseStatItem}>
              <Text style={styles.courseStatIcon}>📚</Text>
              <Text style={styles.courseStatText}>{course.lessons} lessons</Text>
            </View>
            <View style={styles.courseStatItem}>
              <Text style={styles.courseStatIcon}>⏱️</Text>
              <Text style={styles.courseStatText}>{course.duration}</Text>
            </View>
            <View style={styles.courseStatItem}>
              <Text style={styles.courseStatIcon}>⭐</Text>
              <Text style={styles.courseStatText}>{course.rating}</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Course Progress: {course.progress}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
            </View>
          </View>

          <View style={styles.courseActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('View Course', `Viewing: ${course.title}`)}
            >
              <Text style={styles.actionButtonText}>👁️ View</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Edit Course', `Editing: ${course.title}`)}
            >
              <Text style={styles.actionButtonText}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Students', `${course.students} students enrolled`)}
            >
              <Text style={styles.actionButtonText}>👥 Students</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Analytics', `Viewing analytics for: ${course.title}`)}
            >
              <Text style={styles.actionButtonText}>📊 Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Create Course Button */}
      <TouchableOpacity style={styles.createCourseButton} onPress={handleCreateCourse}>
        <Text style={styles.createCourseText}>➕ Create New Course</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderCreateCourse = () => (
    <ScrollView style={styles.createForm} showsVerticalScrollIndicator={false}>
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>🚀 Create New Course</Text>
        <Text style={styles.formDescription}>
          Start creating your new course. You can save as draft and continue later.
        </Text>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Course Title *</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="Enter course title..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={courseForm.title}
            onChangeText={(text) => updateFormField('title', text)}
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Description *</Text>
          <TextInput
            style={styles.fieldTextArea}
            placeholder="Describe what students will learn..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            multiline
            numberOfLines={4}
            value={courseForm.description}
            onChangeText={(text) => updateFormField('description', text)}
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Duration (optional)</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="e.g., 8 hours, 2 weeks..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={courseForm.duration}
            onChangeText={(text) => updateFormField('duration', text)}
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Difficulty Level</Text>
          <View style={styles.categoryButtons}>
            {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.categoryButton, 
                  { 
                    backgroundColor: courseForm.difficulty === level ? '#43e97b' : 'rgba(255,255,255,0.2)'
                  }
                ]}
                onPress={() => updateFormField('difficulty', level)}
              >
                <Text style={styles.categoryButtonText}>{level}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.categoryButtons}>
            {['Mobile Development', 'Web Development', 'Design', 'Programming', 'Data Science'].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton, 
                  { 
                    backgroundColor: courseForm.category === category ? getCategoryColor(category) : 'rgba(255,255,255,0.2)'
                  }
                ]}
                onPress={() => updateFormField('category', category)}
              >
                <Text style={styles.categoryButtonText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formActions}>
          <TouchableOpacity 
            style={[styles.draftButton, saving && { opacity: 0.6 }]} 
            onPress={() => saveCourse('draft')}
            disabled={saving}
          >
            <Text style={styles.draftButtonText}>
              {saving ? '💾 Saving...' : '💾 Save as Draft'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.continueButton, saving && { opacity: 0.6 }]} 
            onPress={() => saveCourse('published')}
            disabled={saving}
          >
            <Text style={styles.continueButtonText}>
              {saving ? '⏳ Creating...' : '➡️ Continue Setup'}
            </Text>
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
        <Text style={styles.title}>📚 Manage Courses</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my-courses' && styles.activeTab]}
          onPress={() => setActiveTab('my-courses')}
        >
          <Text style={[styles.tabText, activeTab === 'my-courses' && styles.activeTabText]}>
            📚 My Courses
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
        {activeTab === 'my-courses' && renderMyCourses()}
        {activeTab === 'create' && renderCreateCourse()}
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
  coursesList: {
    flex: 1,
  },
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  courseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  courseHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  courseThumbnail: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  thumbnailIcon: {
    fontSize: 24,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  courseDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    marginBottom: 8,
  },
  courseMeta: {
    flexDirection: 'row',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  courseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  courseStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseStatIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  courseStatText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 12,
    color: '#fff',
    marginBottom: 6,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#43e97b',
    borderRadius: 3,
  },
  courseActions: {
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
  createCourseButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  createCourseText: {
    color: '#f093fb',
    fontWeight: '600',
    fontSize: 16,
  },
  createForm: {
    flex: 1,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  formDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  formField: {
    marginBottom: 20,
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
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  draftButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    flex: 0.48,
    alignItems: 'center',
  },
  draftButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 0.48,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#f093fb',
    fontWeight: '600',
  },
});
