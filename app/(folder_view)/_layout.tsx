import { Stack } from 'expo-router';
import React from 'react';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { StatusBar, View } from 'react-native';

export default function FolderViewLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>

      <Stack.Screen name="folder" options={{header: () => <View style={{marginTop: StatusBar.currentHeight}}/>}} />
    </Stack>
  );
}
