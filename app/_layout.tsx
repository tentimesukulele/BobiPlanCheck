import React from 'react';
import { Stack } from 'expo-router';
import { NetworkProvider } from '../src/contexts/NetworkContext';

export default function RootLayout() {
  return (
    <NetworkProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </NetworkProvider>
  );
}