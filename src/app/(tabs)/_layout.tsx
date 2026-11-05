import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

/** Define la navegación inferior entre búsqueda, lecturas y sesión. */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 74,
          paddingBottom: 12,
          paddingTop: 10,
          elevation: 10,
          shadowColor: Colors.secondary,
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'SpaceGrotesk_600SemiBold',
          fontWeight: '600',
        },
        tabBarItemStyle: { minHeight: 50 },
        headerStyle: { backgroundColor: Colors.secondary },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontSize: 17,
          fontFamily: 'SpaceGrotesk_700Bold',
          fontWeight: '700',
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Buscar Medidor',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pending"
        options={{
          title: 'Lecturas',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'list' : 'list-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Mi Sesión',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
