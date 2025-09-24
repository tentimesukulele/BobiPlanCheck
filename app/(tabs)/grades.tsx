import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { GradesView } from '../../src/components/GradesView';
import { UserService } from '../../src/services/UserService';

export default function GradesScreen() {
  const { userId, userName } = useLocalSearchParams();
  const [currentUserId, setCurrentUserId] = useState<number>(1);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        // First try to get from URL params
        const paramUserId = parseInt(userId as string);
        if (paramUserId && !isNaN(paramUserId)) {
          console.log('🎯 Grades - Using userId from params:', paramUserId);
          setCurrentUserId(paramUserId);
          return;
        }

        // Fallback to stored user
        const storedUserId = await UserService.getCurrentUserId();
        console.log('🎯 Grades - Using stored userId:', storedUserId);
        setCurrentUserId(storedUserId);
      } catch (error) {
        console.error('Error initializing user in grades:', error);
        setCurrentUserId(1); // Final fallback to Marko
      }
    };

    initializeUser();
  }, [userId]);
  const canAddGrades = true; // Allow everyone to add grades
  const gradesRef = useRef<any>(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Ocene</Text>
      </View>

      {/* Quick Action Buttons */}
      {canAddGrades && (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => {
              gradesRef.current?.openAddGradeModal();
            }}
          >
            <Text style={styles.primaryActionButtonText}>+ Dodaj oceno</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content}>
        <GradesView ref={gradesRef} currentUserId={currentUserId} />
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
    padding: 12,
    paddingTop: 50,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  quickActions: {
    backgroundColor: 'white',
    padding: 10,
    marginHorizontal: 12,
    marginTop: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  primaryActionButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  primaryActionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});