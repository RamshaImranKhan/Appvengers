import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function Gamification() {
  const [activeTab, setActiveTab] = useState('badges');
  const [userStats, setUserStats] = useState({
    totalPoints: 0,
    level: 1,
    rank: 0,
    totalUsers: 0,
    coursesCompleted: 0,
    videosWatched: 0,
    streakDays: 0
  });
  const [badges, setBadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGamificationData();
  }, []);

  const loadGamificationData = async () => {
    try {
      console.log('🔄 Loading gamification data from backend...');
      
      // Load user badges
      const { data: userBadges, error: badgesError } = await supabase
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      
      if (!badgesError) {
        setBadges(userBadges || []);
      } else {
        console.log('⚠️ Error loading badges:', badgesError.message);
        setBadges([]);
      }

      // Load leaderboard
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('user_progress')
        .select('*, profiles(name)')
        .order('total_points', { ascending: false })
        .limit(20);
      
      if (!leaderboardError) {
        setLeaderboard(leaderboardData || []);
      } else {
        console.log('⚠️ Error loading leaderboard:', leaderboardError.message);
        setLeaderboard([]);
      }

      // Load user stats
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: progress, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (!progressError && progress) {
          setUserStats({
            totalPoints: progress.total_points || 0,
            level: progress.level || 1,
            rank: progress.rank || 0,
            totalUsers: leaderboardData?.length || 0,
            coursesCompleted: progress.courses_completed || 0,
            videosWatched: progress.videos_watched || 0,
            streakDays: progress.streak_days || 0
          });
        }
      }
      
      console.log('✅ Gamification data loaded successfully');
    } catch (err) {
      console.error('❌ Failed to load gamification data:', err);
      setBadges([]);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#43e97b';
      case 'uncommon': return '#4facfe';
      case 'rare': return '#f093fb';
      case 'epic': return '#feca57';
      case 'legendary': return '#ff6b6b';
      default: return '#gray';
    }
  };

  const renderBadges = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.statsOverview}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{badges.filter(b => b.earned).length}</Text>
          <Text style={styles.statLabel}>Badges Earned</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userStats.totalPoints}</Text>
          <Text style={styles.statLabel}>Total Points</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>Level {userStats.level}</Text>
          <Text style={styles.statLabel}>Current Level</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Your Badges</Text>
      <View style={styles.badgesGrid}>
        {badges.map((badge) => (
          <View key={badge.id} style={[
            styles.badgeCard,
            !badge.earned && styles.unearned
          ]}>
            <View style={[styles.badgeIcon, { backgroundColor: getRarityColor(badge.rarity) }]}>
              <Text style={styles.badgeEmoji}>{badge.icon}</Text>
            </View>
            <Text style={styles.badgeName}>{badge.name}</Text>
            <Text style={styles.badgeDescription}>{badge.description}</Text>
            
            {badge.earned ? (
              <Text style={styles.earnedDate}>Earned: {badge.earnedDate}</Text>
            ) : (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill, 
                    { 
                      width: `${(badge.progress / badge.target) * 100}%`,
                      backgroundColor: getRarityColor(badge.rarity)
                    }
                  ]} />
                </View>
                <Text style={styles.progressText}>
                  {badge.progress}/{badge.target}
                </Text>
              </View>
            )}
            
            <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(badge.rarity) }]}>
              <Text style={styles.rarityText}>{badge.rarity}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderLeaderboard = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.userRankCard}>
        <Text style={styles.userRankTitle}>Your Ranking</Text>
        <View style={styles.userRankInfo}>
          <Text style={styles.userRank}>#{userStats.rank}</Text>
          <View style={styles.userRankDetails}>
            <Text style={styles.userPoints}>{userStats.totalPoints} points</Text>
            <Text style={styles.userLevel}>Level {userStats.level}</Text>
          </View>
        </View>
        <Text style={styles.userRankSubtitle}>
          Out of {userStats.totalUsers} students
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Top Learners</Text>
      <View style={styles.leaderboardList}>
        {leaderboard.map((user) => (
          <View key={user.rank} style={[
            styles.leaderboardItem,
            user.isCurrentUser && styles.currentUserItem
          ]}>
            <View style={styles.rankContainer}>
              <Text style={[
                styles.rankNumber,
                user.rank <= 3 && styles.topRank
              ]}>
                #{user.rank}
              </Text>
              {user.rank === 1 && <Text style={styles.crown}>👑</Text>}
            </View>
            
            <Text style={styles.userAvatar}>{user.avatar}</Text>
            
            <View style={styles.userInfo}>
              <Text style={[
                styles.userName,
                user.isCurrentUser && styles.currentUserName
              ]}>
                {user.name}
              </Text>
              <Text style={styles.userLevelText}>Level {user.level}</Text>
            </View>
            
            <Text style={styles.userPointsText}>{user.points} pts</Text>
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
        <Text style={styles.title}>Achievements</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'badges' && styles.activeTab]}
          onPress={() => setActiveTab('badges')}
        >
          <Text style={[styles.tabText, activeTab === 'badges' && styles.activeTabText]}>
            🏆 Badges
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
            📊 Leaderboard
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'badges' ? renderBadges() : renderLeaderboard()}
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
  },
  activeTabText: {
    color: '#4facfe',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 0.3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    width: (width - 60) / 2,
    marginBottom: 16,
    alignItems: 'center',
  },
  unearned: {
    opacity: 0.6,
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgeEmoji: {
    fontSize: 28,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 14,
  },
  earnedDate: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  userRankCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  userRankTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  userRankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userRank: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginRight: 16,
  },
  userRankDetails: {
    alignItems: 'flex-start',
  },
  userPoints: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  userLevel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userRankSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  leaderboardList: {
    flex: 1,
  },
  leaderboardItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentUserItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 2,
    borderColor: '#fff',
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 50,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  topRank: {
    color: '#feca57',
  },
  crown: {
    fontSize: 16,
    marginLeft: 4,
  },
  userAvatar: {
    fontSize: 32,
    marginHorizontal: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  currentUserName: {
    color: '#feca57',
  },
  userLevelText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userPointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
