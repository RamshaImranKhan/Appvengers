import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function Learning() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('browse');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = ['all', 'Mobile Development', 'Web Development', 'Design', 'Programming', 'Data Science'];

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      console.log('🔄 Loading courses from backend...');
      
      // Load all available courses
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (coursesError) {
        console.log('⚠️ Error loading courses:', coursesError.message);
        setAvailableCourses([]);
      } else {
        console.log('✅ Loaded', courses?.length || 0, 'available courses');
        setAvailableCourses(courses || []);
      }

      // Load user's enrolled courses
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select(`
            *,
            courses (*)
          `)
          .eq('user_id', user.id);

        if (enrollmentsError) {
          console.log('⚠️ Error loading enrollments:', enrollmentsError.message);
          setEnrolledCourses([]);
        } else {
          console.log('✅ Loaded', enrollments?.length || 0, 'enrolled courses');
          setEnrolledCourses(enrollments?.map(e => e.courses) || []);
        }
      }
    } catch (err) {
      console.error('❌ Failed to load courses:', err);
      setAvailableCourses([]);
      setEnrolledCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = availableCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEnrollCourse = (courseId) => {
    console.log(`Enrolling in course: ${courseId}`);
    alert(`Successfully enrolled in course!`);
  };

  const handleContinueCourse = (course) => {
    console.log(`Continuing course: ${course.title}`);
    alert(`Continuing with: ${course.nextVideo}`);
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner': return '#43e97b';
      case 'Intermediate': return '#feca57';
      case 'Advanced': return '#ff6b6b';
      default: return '#gray';
    }
  };

  const renderBrowseCourses = () => (
    <ScrollView style={styles.coursesList} showsVerticalScrollIndicator={false}>
      {filteredCourses.map((course) => (
        <View key={course.id} style={styles.courseCard}>
          <View style={styles.courseHeader}>
            <Text style={styles.courseThumbnail}>{course.thumbnail}</Text>
            <View style={styles.courseInfo}>
              <Text style={styles.courseTitle}>{course.title}</Text>
              <Text style={styles.courseInstructor}>👨‍🏫 {course.instructor}</Text>
              <Text style={styles.courseDescription}>{course.description}</Text>
            </View>
          </View>

          <View style={styles.courseDetails}>
            <View style={styles.detailRow}>
              <View style={[styles.levelBadge, { backgroundColor: getLevelColor(course.level) }]}>
                <Text style={styles.levelBadgeText}>{course.level}</Text>
              </View>
              <Text style={styles.courseDetail}>⏱️ {course.duration}</Text>
              <Text style={styles.courseDetail}>🎥 {course.videos} videos</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.courseDetail}>⭐ {course.rating} ({course.students} students)</Text>
              <View style={[styles.priceBadge, { backgroundColor: course.price === 'Free' ? '#43e97b' : '#f093fb' }]}>
                <Text style={styles.priceBadgeText}>{course.price}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.enrollButton}
            onPress={() => handleEnrollCourse(course.id)}
          >
            <Text style={styles.enrollButtonText}>
              {course.price === 'Free' ? '📚 Enroll Free' : '💎 Enroll Premium'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  const renderMyCourses = () => (
    <ScrollView style={styles.coursesList} showsVerticalScrollIndicator={false}>
      {enrolledCourses.map((course) => (
        <View key={course.id} style={styles.courseCard}>
          <View style={styles.courseHeader}>
            <Text style={styles.courseThumbnail}>{course.thumbnail}</Text>
            <View style={styles.courseInfo}>
              <Text style={styles.courseTitle}>{course.title}</Text>
              <Text style={styles.courseInstructor}>👨‍🏫 {course.instructor}</Text>
              <Text style={styles.nextVideo}>Next: {course.nextVideo}</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>Progress: {course.progress}%</Text>
              <Text style={styles.videoProgress}>{course.videosWatched}/{course.totalVideos} videos</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
            </View>
            <Text style={styles.lastWatched}>Last watched: {course.lastWatched}</Text>
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => handleContinueCourse(course)}
          >
            <Text style={styles.continueButtonText}>▶️ Continue Learning</Text>
          </TouchableOpacity>
        </View>
      ))}

      {enrolledCourses.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>📚</Text>
          <Text style={styles.emptyStateTitle}>No Enrolled Courses</Text>
          <Text style={styles.emptyStateDescription}>
            Browse available courses and start your learning journey!
          </Text>
        </View>
      )}
    </ScrollView>
  );

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
        <Text style={styles.title}>Learning Center</Text>
      </View>

      <View style={styles.content}>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'browse' && styles.activeTab]}
            onPress={() => setActiveTab('browse')}
          >
            <Text style={[styles.tabText, activeTab === 'browse' && styles.activeTabText]}>
              Browse Courses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my' && styles.activeTab]}
            onPress={() => setActiveTab('my')}
          >
            <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
              My Courses
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search and Filter (only for browse tab) */}
        {activeTab === 'browse' && (
          <>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search courses..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category && styles.activeCategoryButton
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    selectedCategory === category && styles.activeCategoryButtonText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Courses Content */}
        {activeTab === 'browse' ? renderBrowseCourses() : renderMyCourses()}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    marginBottom: 16,
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
  },
  activeTabText: {
    color: '#4facfe',
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
  categoriesContainer: {
    marginBottom: 16,
  },
  categoryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeCategoryButton: {
    backgroundColor: '#fff',
  },
  categoryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  activeCategoryButtonText: {
    color: '#4facfe',
  },
  coursesList: {
    flex: 1,
  },
  courseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  courseHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  courseThumbnail: {
    fontSize: 40,
    marginRight: 16,
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
  courseInstructor: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  courseDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
  },
  nextVideo: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
  courseDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  levelBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  priceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  priceBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  courseDetail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginRight: 16,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  videoProgress: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  lastWatched: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  enrollButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  enrollButtonText: {
    color: '#4facfe',
    fontWeight: '700',
    fontSize: 14,
  },
  continueButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#4facfe',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
