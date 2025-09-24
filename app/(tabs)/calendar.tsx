import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { FamilyCalendar } from '../../src/components/FamilyCalendar';
import { UserService } from '../../src/services/UserService';

export default function CalendarScreen() {
  const { userId, userName } = useLocalSearchParams();
  const [currentUserId, setCurrentUserId] = useState<number>(1);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        // First try to get from URL params
        const paramUserId = parseInt(userId as string);
        if (paramUserId && !isNaN(paramUserId)) {
          console.log('🎯 Using userId from params:', paramUserId);
          setCurrentUserId(paramUserId);
          return;
        }

        // Fallback to stored user
        const storedUserId = await UserService.getCurrentUserId();
        console.log('🎯 Using stored userId:', storedUserId);
        setCurrentUserId(storedUserId);
      } catch (error) {
        console.error('Error initializing user:', error);
        setCurrentUserId(1); // Final fallback to Marko
      }
    };

    initializeUser();
  }, [userId]);

  // Debug logging
  console.log('🎯 CalendarScreen - final currentUserId:', currentUserId);
  console.log('🎯 CalendarScreen - userId from params:', userId);
  console.log('🎯 CalendarScreen - userName from params:', userName);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Koledar</Text>
      </View>

      <View style={styles.content}>
        <FamilyCalendar currentUserId={currentUserId} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
});