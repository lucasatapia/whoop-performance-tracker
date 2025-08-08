// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { theme } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // ——— COLORS ———
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.text,

        // ——— BAR LAYOUT ———
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.muted,
          height: 64,          // nice thumb-friendly height
          paddingBottom: Platform.OS === 'ios' ? 10 : 6, // safe-area on iOS, small pad on web/Android
          width: '100%',       // full-width on web
        },

        // Every item flexes to 25 %
        tabBarItemStyle: { flex: 1 },

        // Bigger, more readable label
        tabBarLabelStyle: { fontSize: 13, paddingBottom: 2 },

        // Hide bar when keyboard is up (optional, feels nicer when logging sets)
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="add"
        options={{
          title: 'Log',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="add" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="last-vs-this"
        options={{
          title: 'Compare',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="compare-arrows" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="records"
        options={{
          title: 'PRs',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="star" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="show-chart" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
