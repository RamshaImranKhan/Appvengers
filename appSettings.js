import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Switch, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function AppSettings() {
  const { theme, saveTheme, updateTheme, resetTheme, colorPresets, getThemeStyles } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  
  // General Settings
  const [appName, setAppName] = useState(theme.appName || 'LoopVerse');
  const [appDescription, setAppDescription] = useState(theme.appDescription || 'Educational Platform for Modern Learning');
  const [supportEmail, setSupportEmail] = useState(theme.supportEmail || 'support@loopverse.com');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  // Theme Settings
  const [primaryColor, setPrimaryColor] = useState(theme.primaryColor || '#667eea');
  const [secondaryColor, setSecondaryColor] = useState(theme.secondaryColor || '#764ba2');
  const [darkMode, setDarkMode] = useState(theme.darkMode || false);
  const [customLogo, setCustomLogo] = useState(theme.customLogo || false);
  
  const themeStyles = getThemeStyles();
  
  // User Settings
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [emailVerification, setEmailVerification] = useState(true);
  const [socialLogin, setSocialLogin] = useState(true);
  const [guestAccess, setGuestAccess] = useState(false);
  
  // Course Settings
  const [autoApproval, setAutoApproval] = useState(false);
  const [allowFreeCourses, setAllowFreeCourses] = useState(true);
  const [maxCourseSize, setMaxCourseSize] = useState('500');
  const [videoUploadLimit, setVideoUploadLimit] = useState('100');
  
  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(true);
  
  // Security Settings
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [passwordComplexity, setPasswordComplexity] = useState(true);
  const [ipWhitelist, setIpWhitelist] = useState(false);

  // Load theme data when component mounts
  useEffect(() => {
    setAppName(theme.appName || 'LoopVerse');
    setAppDescription(theme.appDescription || 'Educational Platform for Modern Learning');
    setSupportEmail(theme.supportEmail || 'support@loopverse.com');
    setPrimaryColor(theme.primaryColor || '#667eea');
    setSecondaryColor(theme.secondaryColor || '#764ba2');
    setDarkMode(theme.darkMode || false);
    setCustomLogo(theme.customLogo || false);
  }, [theme]);

  const handleSaveSettings = async (section) => {
    setSaving(true);
    try {
      let result;
      
      if (section === 'Theme') {
        // Save theme settings
        result = await saveTheme({
          primaryColor,
          secondaryColor,
          darkMode,
          customLogo,
          appName,
          appDescription,
          supportEmail
        });
      } else if (section === 'General') {
        // Save general settings to backend
        const { error } = await supabase
          .from('app_settings')
          .upsert({
            setting_type: 'general',
            app_name: appName,
            app_description: appDescription,
            support_email: supportEmail,
            maintenance_mode: maintenanceMode,
            updated_at: new Date().toISOString()
          });
          
        if (error) {
          throw error;
        }
        
        // Also update theme context with general settings
        await saveTheme({
          appName,
          appDescription,
          supportEmail
        });
        
        result = { success: true };
      }
      
      if (result.success) {
        Alert.alert('Success! 🎉', `${section} settings saved successfully and applied across all screens!`);
      } else {
        Alert.alert('Error', result.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error(`Error saving ${section} settings:`, err);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    Alert.alert(
      'Reset to Defaults',
      'This will reset all settings to their default values and apply them across all screens. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              // Reset theme to defaults
              const result = await resetTheme();
              
              if (result.success) {
                // Reset local state
                setAppName('LoopVerse');
                setAppDescription('Educational Platform for Modern Learning');
                setSupportEmail('support@loopverse.com');
                setMaintenanceMode(false);
                setPrimaryColor('#667eea');
                setSecondaryColor('#764ba2');
                setDarkMode(false);
                setAllowRegistration(true);
                setEmailVerification(true);
                setSocialLogin(true);
                setGuestAccess(false);
                setAutoApproval(false);
                setAllowFreeCourses(true);
                setMaxCourseSize('500');
                setVideoUploadLimit('100');
                setEmailNotifications(true);
                setPushNotifications(true);
                setSmsNotifications(false);
                setMarketingEmails(true);
                setTwoFactorAuth(false);
                setSessionTimeout('30');
                setPasswordComplexity(true);
                setIpWhitelist(false);
                
                Alert.alert('Success! 🎉', 'All settings have been reset to defaults and applied across all screens!');
              } else {
                Alert.alert('Error', 'Failed to reset settings');
              }
            } catch (err) {
              console.error('Error resetting settings:', err);
              Alert.alert('Error', 'Failed to reset settings');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const renderGeneralSettings = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.settingSection}>
        <Text style={styles.sectionTitle}>🏢 Application Info</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>App Name</Text>
          <TextInput
            style={styles.settingInput}
            value={appName}
            onChangeText={setAppName}
            placeholder="Enter app name"
            placeholderTextColor="rgba(255,255,255,0.7)"
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Description</Text>
          <TextInput
            style={styles.settingTextArea}
            value={appDescription}
            onChangeText={setAppDescription}
            placeholder="Enter app description"
            placeholderTextColor="rgba(255,255,255,0.7)"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Support Email</Text>
          <TextInput
            style={styles.settingInput}
            value={supportEmail}
            onChangeText={setSupportEmail}
            placeholder="support@example.com"
            placeholderTextColor="rgba(255,255,255,0.7)"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Maintenance Mode</Text>
            <Switch
              value={maintenanceMode}
              onValueChange={setMaintenanceMode}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#43e97b' }}
              thumbColor={maintenanceMode ? '#fff' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.settingDescription}>
            Enable to temporarily disable app access for maintenance
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && { opacity: 0.6 }]}
        onPress={() => handleSaveSettings('General')}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? '💾 Saving...' : '💾 Save General Settings'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderThemeSettings = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.settingSection}>
        <Text style={styles.sectionTitle}>🎨 Theme & Branding</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Color Presets</Text>
          <View style={styles.colorPresets}>
            {colorPresets.map((preset, index) => (
              <TouchableOpacity
                key={index}
                style={styles.colorPreset}
                onPress={() => {
                  setPrimaryColor(preset.primary);
                  setSecondaryColor(preset.secondary);
                  // Apply theme immediately for preview
                  updateTheme({
                    primaryColor: preset.primary,
                    secondaryColor: preset.secondary
                  });
                  Alert.alert(
                    'Theme Preview Applied! 🎨',
                    `Previewing "${preset.name}" theme!\nDon't forget to save your changes.`,
                    [{ text: 'OK' }]
                  );
                }}
              >
                <LinearGradient
                  colors={[preset.primary, preset.secondary]}
                  style={styles.colorPresetGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Text style={styles.colorPresetName}>{preset.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Primary Color</Text>
          <View style={styles.colorInputContainer}>
            <View style={[styles.colorPreview, { backgroundColor: primaryColor }]} />
            <TextInput
              style={styles.colorInput}
              value={primaryColor}
              onChangeText={setPrimaryColor}
              placeholder="#667eea"
              placeholderTextColor="rgba(255,255,255,0.7)"
            />
          </View>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Secondary Color</Text>
          <View style={styles.colorInputContainer}>
            <View style={[styles.colorPreview, { backgroundColor: secondaryColor }]} />
            <TextInput
              style={styles.colorInput}
              value={secondaryColor}
              onChangeText={setSecondaryColor}
              placeholder="#764ba2"
              placeholderTextColor="rgba(255,255,255,0.7)"
            />
          </View>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Dark Mode Default</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#43e97b' }}
              thumbColor={darkMode ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Custom Logo</Text>
            <Switch
              value={customLogo}
              onValueChange={setCustomLogo}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#43e97b' }}
              thumbColor={customLogo ? '#fff' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.settingDescription}>
            Upload custom logo for branding
          </Text>
        </View>
      </View>

      <View style={styles.themeActions}>
        <TouchableOpacity
          style={styles.previewButton}
          onPress={() => {
            Alert.alert(
              'Theme Preview 🎨',
              `Current Theme Colors:\nPrimary: ${primaryColor}\nSecondary: ${secondaryColor}\n\nThe background of this screen shows your selected theme!`,
              [{ text: 'OK' }]
            );
          }}
        >
          <Text style={styles.previewButtonText}>👁️ Preview Theme</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={() => handleSaveSettings('Theme')}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? '💾 Saving...' : '💾 Save Theme Settings'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderUserSettings = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.settingSection}>
        <Text style={styles.sectionTitle}>👥 User Management</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Allow Registration</Text>
            <Switch
              value={allowRegistration}
              onValueChange={setAllowRegistration}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#43e97b' }}
              thumbColor={allowRegistration ? '#fff' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.settingDescription}>
            Allow new users to register accounts
          </Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Email Verification</Text>
            <Switch
              value={emailVerification}
              onValueChange={setEmailVerification}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#43e97b' }}
              thumbColor={emailVerification ? '#fff' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.settingDescription}>
            Require email verification for new accounts
          </Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Social Login</Text>
            <Switch
              value={socialLogin}
              onValueChange={setSocialLogin}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#43e97b' }}
              thumbColor={socialLogin ? '#fff' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.settingDescription}>
            Enable Google and Facebook login
          </Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Guest Access</Text>
            <Switch
              value={guestAccess}
              onValueChange={setGuestAccess}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#43e97b' }}
              thumbColor={guestAccess ? '#fff' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.settingDescription}>
            Allow limited access without registration
          </Text>
        </View>
      </View>

      <View style={styles.settingSection}>
        <Text style={styles.sectionTitle}>📚 Course Management</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto-approve Courses</Text>
            <Switch
              value={autoApproval}
              onValueChange={setAutoApproval}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#43e97b' }}
              thumbColor={autoApproval ? '#fff' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.settingDescription}>
            Automatically approve new courses
          </Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Allow Free Courses</Text>
            <Switch
              value={allowFreeCourses}
              onValueChange={setAllowFreeCourses}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#43e97b' }}
              thumbColor={allowFreeCourses ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Max Course Size (MB)</Text>
          <TextInput
            style={styles.settingInput}
            value={maxCourseSize}
            onChangeText={setMaxCourseSize}
            placeholder="500"
            placeholderTextColor="rgba(255,255,255,0.7)"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Video Upload Limit (MB)</Text>
          <TextInput
            style={styles.settingInput}
            value={videoUploadLimit}
            onChangeText={setVideoUploadLimit}
            placeholder="100"
            placeholderTextColor="rgba(255,255,255,0.7)"
            keyboardType="numeric"
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={() => handleSaveSettings('User & Course')}
      >
        <Text style={styles.saveButtonText}>Save User & Course Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderSecuritySettings = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.settingSection}>
        <Text style={styles.sectionTitle}>🔒 Security & Privacy</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Two-Factor Authentication</Text>
            <Switch
              value={twoFactorAuth}
              onValueChange={setTwoFactorAuth}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#43e97b' }}
              thumbColor={twoFactorAuth ? '#fff' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.settingDescription}>
            Require 2FA for admin accounts
          </Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Session Timeout (minutes)</Text>
          <TextInput
            style={styles.settingInput}
            value={sessionTimeout}
            onChangeText={setSessionTimeout}
            placeholder="30"
            placeholderTextColor="rgba(255,255,255,0.7)"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Password Complexity</Text>
            <Switch
              value={passwordComplexity}
              onValueChange={setPasswordComplexity}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#43e97b' }}
              thumbColor={passwordComplexity ? '#fff' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.settingDescription}>
            Enforce strong password requirements
          </Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>IP Whitelist</Text>
            <Switch
              value={ipWhitelist}
              onValueChange={setIpWhitelist}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#43e97b' }}
              thumbColor={ipWhitelist ? '#fff' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.settingDescription}>
            Restrict admin access to specific IP addresses
          </Text>
        </View>
      </View>

      <View style={styles.settingSection}>
        <Text style={styles.sectionTitle}>📧 Notifications</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Email Notifications</Text>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#43e97b' }}
              thumbColor={emailNotifications ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#43e97b' }}
              thumbColor={pushNotifications ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>SMS Notifications</Text>
            <Switch
              value={smsNotifications}
              onValueChange={setSmsNotifications}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#43e97b' }}
              thumbColor={smsNotifications ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Marketing Emails</Text>
            <Switch
              value={marketingEmails}
              onValueChange={setMarketingEmails}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#43e97b' }}
              thumbColor={marketingEmails ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={() => handleSaveSettings('Security & Notifications')}
      >
        <Text style={styles.saveButtonText}>Save Security Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <LinearGradient
      colors={[primaryColor, secondaryColor]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚙️ App Settings</Text>
        <TouchableOpacity onPress={handleResetToDefaults} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'general' && styles.activeTab]}
          onPress={() => setActiveTab('general')}
        >
          <Text style={[styles.tabText, activeTab === 'general' && styles.activeTabText]}>
            🏢 General
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'theme' && styles.activeTab]}
          onPress={() => setActiveTab('theme')}
        >
          <Text style={[styles.tabText, activeTab === 'theme' && styles.activeTabText]}>
            🎨 Theme
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            👥 Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'security' && styles.activeTab]}
          onPress={() => setActiveTab('security')}
        >
          <Text style={[styles.tabText, activeTab === 'security' && styles.activeTabText]}>
            🔒 Security
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'general' && renderGeneralSettings()}
        {activeTab === 'theme' && renderThemeSettings()}
        {activeTab === 'users' && renderUserSettings()}
        {activeTab === 'security' && renderSecuritySettings()}
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
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    flex: 2,
  },
  resetButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 11,
    textAlign: 'center',
  },
  activeTabText: {
    color: '#667eea',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContent: {
    flex: 1,
  },
  settingSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  settingItem: {
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  settingDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    lineHeight: 16,
  },
  settingInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  settingTextArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  colorPresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  colorPreset: {
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 12,
  },
  colorPresetGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
  },
  colorPresetName: {
    fontSize: 10,
    color: '#fff',
    textAlign: 'center',
    width: 60,
  },
  colorInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 12,
  },
  colorInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  themeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  previewButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 0.48,
  },
  previewButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 0.48,
  },
  saveButtonText: {
    color: '#667eea',
    fontWeight: '600',
    fontSize: 14,
  },
});
