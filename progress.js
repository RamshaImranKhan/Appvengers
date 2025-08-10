import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function StudentProgress() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [progressData, setProgressData] = useState({
    overallProgress: 0,
    completedCourses: 0,
    activeCourses: 0,
    totalHours: 0,
    certificates: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageScore: 0
  });
  const [courses, setCourses] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      console.log('🔄 Loading progress data from backend...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Load user progress
        const { data: progress, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (!progressError && progress) {
          setProgressData({
            overallProgress: progress.overall_progress || 0,
            completedCourses: progress.completed_courses || 0,
            activeCourses: progress.active_courses || 0,
            totalHours: progress.total_hours || 0,
            certificates: progress.certificates || 0,
            currentStreak: progress.current_streak || 0,
            longestStreak: progress.longest_streak || 0,
            averageScore: progress.average_score || 0
          });
        }

        // Load enrolled courses with progress
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('*, courses(*), course_progress(*)')
          .eq('user_id', user.id);
        
        if (!enrollmentsError) {
          setCourses(enrollments || []);
        } else {
          console.log('⚠️ Error loading courses:', enrollmentsError.message);
          setCourses([]);
        }

        // Load user achievements
        const { data: userAchievements, error: achievementsError } = await supabase
          .from('user_achievements')
          .select('*, achievements(*)')
          .eq('user_id', user.id);
        
        if (!achievementsError) {
          setAchievements(userAchievements || []);
        } else {
          console.log('⚠️ Error loading achievements:', achievementsError.message);
          setAchievements([]);
        }
      }
      
      console.log('✅ Progress data loaded successfully');
    } catch (err) {
      console.error('❌ Failed to load progress data:', err);
      setCourses([]);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return '#43e97b';
    if (progress >= 60) return '#feca57';
    if (progress >= 40) return '#ff9ff3';
    return '#ff6b6b';
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return '#43e97b';
    if (grade.startsWith('B')) return '#4facfe';
    if (grade.startsWith('C')) return '#feca57';
    return '#ff6b6b';
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return '#43e97b';
      case 'Intermediate': return '#feca57';
      case 'Advanced': return '#ff6b6b';
      default: return '#a8a8a8';
    }
  };

  const filteredCourses = selectedCourse === 'all' ? courses : courses.filter(course => {
    if (selectedCourse === 'active') return course.progress < 100;
    if (selectedCourse === 'completed') return course.progress === 100;
    return course.category.toLowerCase().includes(selectedCourse.toLowerCase());
  });

  const handleCourseAction = (courseId, action) => {
    const course = courses.find(c => c.id === courseId);
    
    switch (action) {
      case 'continue':
        Alert.alert(
          'Continue Learning',
          `Resume "${course?.title}"?\nNext: ${course?.nextLesson}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Continue', onPress: () => {
              console.log('Continuing course:', courseId);
              Alert.alert('Success', `Continuing with "${course?.nextLesson}"`);
            }}
          ]
        );
        break;
      case 'details':
        Alert.alert(
          'Course Details',
          `${course?.title}\n\nInstructor: ${course?.instructor}\nDifficulty: ${course?.difficulty}\nRating: ⭐ ${course?.rating}/5.0\n\nProgress: ${course?.progress}%\nTime Spent: ${course?.timeSpent}\nGrade: ${course?.grade}`,
          [{ text: 'OK' }]
        );
        break;
      case 'certificate':
        if (course?.certificateEarned) {
          Alert.alert(
            'Download Certificate',
            `Download certificate for "${course?.title}"?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Download', onPress: () => {
                console.log('Downloading certificate for:', courseId);
                Alert.alert('Success', 'Certificate downloaded successfully!');
              }}
            ]
          );
        } else {
          Alert.alert('Certificate Not Available', 'Complete the course to earn your certificate.');
        }
        break;
      case 'review':
        Alert.alert(
          'Review Course',
          `Leave a review for "${course?.title}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Review', onPress: () => {
              console.log('Opening review for:', courseId);
              Alert.alert('Review', 'Review form would open here');
            }}
          ]
        );
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const renderOverview = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Progress Statistics */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>📊 Learning Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{progressData.overallProgress}%</Text>
            <Text style={styles.statLabel}>Overall Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{progressData.completedCourses}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{progressData.activeCourses}</Text>
            <Text style={styles.statLabel}>Active Courses</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{progressData.totalHours}h</Text>
            <Text style={styles.statLabel}>Total Hours</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{progressData.currentStreak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{progressData.averageScore}%</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
        </View>
      </View>

      {/* Course Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Filter Courses:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {['all', 'active', 'completed', 'mobile development', 'programming', 'design'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedCourse === filter && styles.activeFilterButton
              ]}
              onPress={() => setSelectedCourse(filter)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedCourse === filter && styles.activeFilterButtonText
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Course Progress */}
      {filteredCourses.map((course) => (
        <View key={course.id} style={styles.courseCard}>
          <View style={styles.courseHeader}>
            <View style={styles.courseTitleSection}>
              <Text style={styles.courseTitle}>{course.title}</Text>
              <Text style={styles.courseCategory}>{course.category}</Text>
              <View style={styles.courseMeta}>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(course.difficulty) }]}>
                  <Text style={styles.difficultyText}>{course.difficulty}</Text>
                </View>
                <Text style={styles.instructorText}>by {course.instructor}</Text>
              </View>
            </View>
            <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(course.grade) }]}>
              <Text style={styles.gradeText}>{course.grade}</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress: {course.progress}%</Text>
              <Text style={styles.progressDetails}>
                {course.completedLessons}/{course.totalLessons} lessons • {course.timeSpent}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                { 
                  width: `${course.progress}%`,
                  backgroundColor: getProgressColor(course.progress)
                }
              ]} />
            </View>
          </View>

          {course.progress < 100 && (
            <View style={styles.nextLessonSection}>
              <Text style={styles.nextLessonLabel}>📚 Next: {course.nextLesson}</Text>
              <Text style={styles.estimatedTime}>⏱️ Est. completion: {course.estimatedCompletion}</Text>
              <Text style={styles.lastActivity}>🕒 Last activity: {course.recentActivity}</Text>
            </View>
          )}

          {course.achievements && course.achievements.length > 0 && (
            <View style={styles.achievementsSection}>
              <Text style={styles.achievementsLabel}>🏆 Achievements:</Text>
              <View style={styles.achievementsList}>
                {course.achievements.map((achievement, index) => (
                  <View key={index} style={styles.achievementBadge}>
                    <Text style={styles.achievementText}>{achievement}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.courseActions}>
            {course.progress < 100 ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.continueButton]}
                onPress={() => handleCourseAction(course.id, 'continue')}
              >
                <Text style={styles.actionButtonText}>▶️ Continue Learning</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.certificateButton]}
                onPress={() => handleCourseAction(course.id, 'certificate')}
              >
                <Text style={styles.actionButtonText}>🎓 Download Certificate</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.actionButton, styles.detailsButton]}
              onPress={() => handleCourseAction(course.id, 'details')}
            >
              <Text style={styles.actionButtonText}>📋 Details</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.reviewButton]}
              onPress={() => handleCourseAction(course.id, 'review')}
            >
              <Text style={styles.actionButtonText}>⭐ Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderAchievements = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.achievementsContainer}>
        <Text style={styles.sectionTitle}>🏆 Your Achievements</Text>
        
        {achievements.map((achievement) => (
          <View key={achievement.id} style={styles.achievementCard}>
            <View style={styles.achievementHeader}>
              <Text style={styles.achievementIcon}>{achievement.icon}</Text>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementName}>{achievement.name}</Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
                <Text style={styles.achievementDate}>Earned on {achievement.date}</Text>
              </View>
            </View>
            
            <View style={styles.achievementActions}>
              <TouchableOpacity
                style={styles.achievementActionButton}
                onPress={() => Alert.alert('Achievement Details', `${achievement.name}\n\n${achievement.description}\n\nEarned on: ${achievement.date}`)}
              >
                <Text style={styles.achievementActionText}>📋 Details</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.achievementActionButton}
                onPress={() => Alert.alert('Share Achievement', `Share "${achievement.name}" achievement on social media?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Share', onPress: () => Alert.alert('Success', 'Achievement shared successfully!') }
                ])}
              >
                <Text style={styles.achievementActionText}>📤 Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
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
        <Text style={styles.title}>📈 My Progress</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            📊 Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
          onPress={() => setActiveTab('achievements')}
        >
          <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>
            🏆 Achievements
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'achievements' && renderAchievements()}
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
    color: '#4facfe',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContent: {
    flex: 1,
  },
  statsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 80) / 3,
    alignItems: 'center',
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  activeFilterButton: {
    backgroundColor: '#fff',
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  activeFilterButtonText: {
    color: '#4facfe',
  },
  courseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseTitleSection: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  courseCategory: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  instructorText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  gradeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  progressDetails: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextLessonSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  nextLessonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  estimatedTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  lastActivity: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  achievementsSection: {
    marginBottom: 12,
  },
  achievementsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  achievementBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  achievementText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  courseActions: {
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
  continueButton: {
    backgroundColor: '#43e97b',
  },
  certificateButton: {
    backgroundColor: '#feca57',
  },
  detailsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  reviewButton: {
    backgroundColor: '#ff9ff3',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  achievementsContainer: {
    flex: 1,
  },
  achievementCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  achievementActions: {
    flexDirection: 'row',
  },
  achievementActionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  achievementActionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
});
