import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import Toast from 'react-native-toast-message';
import { AppProvider } from './app-provider';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Initialize notification channel for Android at app startup
const initializeNotifications = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('downloads', {
      name: 'Downloads',
      importance: Notifications.AndroidImportance.MAX,
    });
  }
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      initializeNotifications();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppProvider>
        <Stack>
          <Stack.Screen name="(home)" options={{ headerShown: false, animation: 'fade_from_bottom' }} />
          <Stack.Screen name="(folder_view)" options={{ headerShown: false, animation: 'fade_from_bottom' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AppProvider>
      <Toast />
    </ThemeProvider>
  );
}
