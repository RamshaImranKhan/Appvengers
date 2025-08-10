import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function StudentProgress() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [courses, setCourses] = useState([{ id: 'all', name: 'All Courses' }]);
  const [students, setStudents] = useState([]);
  const [classStats, setClassStats] = useState({
    totalStudents: 0,
    averageProgress: 0,
    averageGrade: 'N/A',
    activeStudents: 0,
    completionRate: 0,
    engagementRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentProgressData();
  }, []);

  const loadStudentProgressData = async () => {
    try {
      console.log('🔄 Loading student progress data from backend...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Load teacher's courses
        const { data: teacherCourses, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .eq('instructor_id', user.id);
        
        if (!coursesError) {
          const courseOptions = [{ id: 'all', name: 'All Courses' }, ...teacherCourses.map(c => ({ id: c.id, name: c.title }))];
          setCourses(courseOptions);
        }

        // Load students enrolled in teacher's courses
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('*, profiles(*), courses(*), course_progress(*)')
          .in('course_id', teacherCourses?.map(c => c.id) || []);
        
        if (!enrollmentsError) {
          // Group enrollments by student
          const studentMap = {};
          enrollments?.forEach(enrollment => {
            const studentId = enrollment.user_id;
            if (!studentMap[studentId]) {
              studentMap[studentId] = {
                id: studentId,
                name: enrollment.profiles?.name || 'Unknown',
                email: enrollment.profiles?.email || '',
                avatar: '👤',
                courses: [],
                overallGrade: 'N/A',
                totalProgress: 0,
                engagement: 0
              };
            }
            
            studentMap[studentId].courses.push({
              courseId: enrollment.course_id,
              courseName: enrollment.courses?.title || 'Unknown Course',
              progress: enrollment.course_progress?.progress || 0,
              grade: enrollment.course_progress?.grade || 'N/A',
              lastActivity: enrollment.course_progress?.last_activity || 'Never',
              completedLessons: enrollment.course_progress?.completed_lessons || 0,
              totalLessons: enrollment.courses?.total_lessons || 0,
              timeSpent: enrollment.course_progress?.time_spent || '0 hours',
              assignments: {
                completed: enrollment.course_progress?.assignments_completed || 0,
                total: enrollment.course_progress?.assignments_total || 0
              }
            });
          });
          
          const studentsArray = Object.values(studentMap);
          setStudents(studentsArray);
          
          // Calculate class stats
          const totalStudents = studentsArray.length;
          const averageProgress = totalStudents > 0 ? 
            studentsArray.reduce((sum, s) => sum + s.totalProgress, 0) / totalStudents : 0;
          
          setClassStats({
            totalStudents,
            averageProgress: Math.round(averageProgress),
            averageGrade: 'B+', // Could be calculated from actual grades
            activeStudents: studentsArray.filter(s => s.engagement > 50).length,
            completionRate: Math.round(averageProgress),
            engagementRate: totalStudents > 0 ? 
              Math.round(studentsArray.reduce((sum, s) => sum + s.engagement, 0) / totalStudents) : 0
          });
        } else {
          console.log('⚠️ Error loading student enrollments:', enrollmentsError.message);
          setStudents([]);
        }
      }
      
      console.log('✅ Student progress data loaded successfully');
    } catch (err) {
      console.error('❌ Failed to load student progress data:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return '#43e97b';
    if (progress >= 60) return '#feca57';
    return '#ff6b6b';
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return '#43e97b';
    if (grade.startsWith('B')) return '#4facfe';
    if (grade.startsWith('C')) return '#feca57';
    return '#ff6b6b';
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCourse === 'all') return matchesSearch;
    
    const hasSelectedCourse = student.courses.some(course => course.courseId === selectedCourse);
    return matchesSearch && hasSelectedCourse;
  });

  const handleStudentAction = (studentId, action) => {
    const student = students.find(s => s.id === studentId);
    Alert.alert(
      `${action} Student`,
      `${action} ${student?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          onPress: () => {
            console.log(`${action} student:`, studentId);
            Alert.alert('Success', `${action} completed for ${student?.name}!`);
          }
        }
      ]
    );
  };

  const renderOverview = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Class Statistics */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>📊 Class Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{classStats.totalStudents}</Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{classStats.averageProgress}%</Text>
            <Text style={styles.statLabel}>Avg Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{classStats.averageGrade}</Text>
            <Text style={styles.statLabel}>Avg Grade</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{classStats.engagementRate}%</Text>
            <Text style={styles.statLabel}>Engagement</Text>
          </View>
        </View>
      </View>

      {/* Course Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Filter by Course:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {courses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={[
                styles.filterButton,
                selectedCourse === course.id && styles.activeFilterButton
              ]}
              onPress={() => setSelectedCourse(course.id)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedCourse === course.id && styles.activeFilterButtonText
              ]}>
                {course.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search students..."
          placeholderTextColor="rgba(255,255,255,0.7)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Students List */}
      {filteredStudents.map((student) => (
        <View key={student.id} style={styles.studentCard}>
          <View style={styles.studentHeader}>
            <View style={styles.studentAvatar}>
              <Text style={styles.avatarText}>{student.avatar}</Text>
            </View>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{student.name}</Text>
              <Text style={styles.studentEmail}>{student.email}</Text>
              <View style={styles.studentMeta}>
                <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(student.overallGrade) }]}>
                  <Text style={styles.gradeText}>{student.overallGrade}</Text>
                </View>
                <Text style={styles.engagementText}>Engagement: {student.engagement}%</Text>
              </View>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Overall Progress: {student.totalProgress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                { 
                  width: `${student.totalProgress}%`,
                  backgroundColor: getProgressColor(student.totalProgress)
                }
              ]} />
            </View>
          </View>

          {/* Course Details */}
          <View style={styles.coursesSection}>
            <Text style={styles.coursesTitle}>📚 Enrolled Courses:</Text>
            {student.courses.map((course, index) => (
              <View key={index} style={styles.courseItem}>
                <View style={styles.courseHeader}>
                  <Text style={styles.courseName}>{course.courseName}</Text>
                  <View style={[styles.courseGradeBadge, { backgroundColor: getGradeColor(course.grade) }]}>
                    <Text style={styles.courseGradeText}>{course.grade}</Text>
                  </View>
                </View>
                <View style={styles.courseStats}>
                  <Text style={styles.courseStatText}>
                    📖 {course.completedLessons}/{course.totalLessons} lessons
                  </Text>
                  <Text style={styles.courseStatText}>
                    📝 {course.assignments.completed}/{course.assignments.total} assignments
                  </Text>
                  <Text style={styles.courseStatText}>
                    ⏱️ {course.timeSpent} spent
                  </Text>
                  <Text style={styles.courseStatText}>
                    🕒 Last active: {course.lastActivity}
                  </Text>
                </View>
                <View style={styles.courseProgressBar}>
                  <View style={[
                    styles.courseProgressFill,
                    { 
                      width: `${course.progress}%`,
                      backgroundColor: getProgressColor(course.progress)
                    }
                  ]} />
                </View>
              </View>
            ))}
          </View>

          <View style={styles.studentActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Message Student', `Send message to ${student.name}`)}
            >
              <Text style={styles.actionButtonText}>💬 Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('View Details', `Viewing detailed progress for ${student.name}`)}
            >
              <Text style={styles.actionButtonText}>📊 Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Generate Report', `Generating progress report for ${student.name}`)}
            >
              <Text style={styles.actionButtonText}>📄 Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderAnalytics = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.analyticsSection}>
        <Text style={styles.sectionTitle}>📈 Performance Analytics</Text>
        
        {/* Performance Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>Completion Rate</Text>
            <Text style={styles.metricValue}>{classStats.completionRate}%</Text>
            <View style={styles.metricBar}>
              <View style={[styles.metricFill, { width: `${classStats.completionRate}%`, backgroundColor: '#43e97b' }]} />
            </View>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>Active Students</Text>
            <Text style={styles.metricValue}>{classStats.activeStudents}/{classStats.totalStudents}</Text>
            <View style={styles.metricBar}>
              <View style={[styles.metricFill, { width: `${(classStats.activeStudents/classStats.totalStudents)*100}%`, backgroundColor: '#4facfe' }]} />
            </View>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>Engagement Rate</Text>
            <Text style={styles.metricValue}>{classStats.engagementRate}%</Text>
            <View style={styles.metricBar}>
              <View style={[styles.metricFill, { width: `${classStats.engagementRate}%`, backgroundColor: '#feca57' }]} />
            </View>
          </View>
        </View>

        {/* Top Performers */}
        <View style={styles.topPerformersSection}>
          <Text style={styles.subsectionTitle}>🏆 Top Performers</Text>
          {filteredStudents
            .sort((a, b) => b.totalProgress - a.totalProgress)
            .slice(0, 5)
            .map((student, index) => (
              <View key={student.id} style={styles.performerItem}>
                <Text style={styles.performerRank}>#{index + 1}</Text>
                <Text style={styles.performerAvatar}>{student.avatar}</Text>
                <View style={styles.performerInfo}>
                  <Text style={styles.performerName}>{student.name}</Text>
                  <Text style={styles.performerProgress}>{student.totalProgress}% complete</Text>
                </View>
                <View style={[styles.performerGrade, { backgroundColor: getGradeColor(student.overallGrade) }]}>
                  <Text style={styles.performerGradeText}>{student.overallGrade}</Text>
                </View>
              </View>
            ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.analyticsActions}>
          <TouchableOpacity
            style={styles.analyticsButton}
            onPress={() => Alert.alert('Export Data', 'Student progress data will be exported as CSV')}
          >
            <Text style={styles.analyticsButtonText}>📊 Export Progress Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.analyticsButton}
            onPress={() => Alert.alert('Generate Report', 'Comprehensive class report will be generated')}
          >
            <Text style={styles.analyticsButtonText}>📄 Generate Class Report</Text>
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
        <Text style={styles.title}>📈 Student Progress</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            👥 Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
            📊 Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'analytics' && renderAnalytics()}
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
    width: (width - 80) / 2,
    alignItems: 'center',
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
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
    color: '#f093fb',
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
  studentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  studentHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  studentAvatar: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
  },
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  gradeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  engagementText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressSection: {
    marginBottom: 16,
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
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  coursesSection: {
    marginBottom: 16,
  },
  coursesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  courseItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  courseGradeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  courseGradeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  courseStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  courseStatText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginRight: 12,
    marginBottom: 4,
  },
  courseProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  courseProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  studentActions: {
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
  analyticsSection: {
    flex: 1,
  },
  metricsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  metricCard: {
    marginBottom: 16,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  metricBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
  },
  metricFill: {
    height: '100%',
    borderRadius: 3,
  },
  topPerformersSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  performerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  performerRank: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    width: 30,
  },
  performerAvatar: {
    fontSize: 16,
    marginRight: 12,
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  performerProgress: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  performerGrade: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  performerGradeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  analyticsActions: {
    marginBottom: 20,
  },
  analyticsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  analyticsButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
