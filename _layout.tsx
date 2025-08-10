import { useColorScheme } from '../hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-reanimated';
import { UserProvider, useUser } from './UserContext';
import { ThemeProvider as CustomThemeProvider } from '../contexts/ThemeContext';
import NavigationHandler from '../components/NavigationHandler';

function AppStack() {
  const { user, userRole } = useUser();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          {/* Role Selection - Only show if no role assigned */}
          {!userRole && <Stack.Screen name="roleSelectionScreen" options={{ headerShown: false }} />}
          
          {/* Role-Based Dashboard Access */}
          {userRole === 'admin' && (
            <>
              <Stack.Screen name="dashboards/adminDashboard" options={{ headerShown: false }} />
              <Stack.Screen name="admin/dashboard" options={{ headerShown: false }} />
              <Stack.Screen name="admin/manageUsers" options={{ headerShown: false }} />
              <Stack.Screen name="admin/manageCourses" options={{ headerShown: false }} />
              <Stack.Screen name="admin/analytics" options={{ headerShown: false }} />
              <Stack.Screen name="admin/manageEvents" options={{ headerShown: false }} />
              <Stack.Screen name="admin/aiChatbot" options={{ headerShown: false }} />
              <Stack.Screen name="admin/appSettings" options={{ headerShown: false }} />
            </>
          )}
          
          {userRole === 'teacher' && (
            <>
              <Stack.Screen name="dashboards/teacherDashboard" options={{ headerShown: false }} />
              <Stack.Screen name="teacher/dashboard" options={{ headerShown: false }} />
              <Stack.Screen name="teacher/liveSessions" options={{ headerShown: false }} />
              <Stack.Screen name="teacher/manageCourses" options={{ headerShown: false }} />
              <Stack.Screen name="teacher/studentProgress" options={{ headerShown: false }} />
              <Stack.Screen name="teacher/events" options={{ headerShown: false }} />
              <Stack.Screen name="teacher/aiAssistant" options={{ headerShown: false }} />
              <Stack.Screen name="teacher/profile" options={{ headerShown: false }} />
            </>
          )}
          
          {userRole === 'student' && (
            <>
              <Stack.Screen name="dashboards/studentDashboard" options={{ headerShown: false }} />
              <Stack.Screen name="student/dashboard" options={{ headerShown: false }} />
              <Stack.Screen name="student/learning" options={{ headerShown: false }} />
              <Stack.Screen name="student/events" options={{ headerShown: false }} />
              <Stack.Screen name="student/progress" options={{ headerShown: false }} />
              <Stack.Screen name="student/gamification" options={{ headerShown: false }} />
              <Stack.Screen name="student/profile" options={{ headerShown: false }} />
              <Stack.Screen name="student/aiSupport" options={{ headerShown: false }} />
            </>
          )}
          
          {/* Shared Routes - Available to all authenticated users */}
          <Stack.Screen name="shared/communication" options={{ headerShown: false }} />
          <Stack.Screen name="shared/aiChatbot" options={{ headerShown: false }} />
          <Stack.Screen name="shared/announcements" options={{ headerShown: false }} />
          
          {/* Legacy Routes - Available to all authenticated users */}
          <Stack.Screen name="homeScreen" options={{ headerShown: false }} />
          <Stack.Screen name="profileScreen" options={{ headerShown: false }} />
          <Stack.Screen name="settingsScreen" options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="loginScreen" options={{ headerShown: false }} />
          <Stack.Screen name="signupScreen" options={{ headerShown: false }} />
          <Stack.Screen name="forgotPassword" options={{ headerShown: false }} />
        </>
      )}
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <UserProvider>
      <CustomThemeProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {/* NavigationHandler temporarily disabled to fix navigation timing issue */}
          {/* <NavigationHandler> */}
            <AppStack />
          {/* </NavigationHandler> */}
          <StatusBar style="auto" />
        </ThemeProvider>
      </CustomThemeProvider>
    </UserProvider>
  );
}
