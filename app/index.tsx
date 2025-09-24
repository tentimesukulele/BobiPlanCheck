import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FamilyMemberSelector } from '../src/components/FamilyMemberSelector';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <FamilyMemberSelector />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});