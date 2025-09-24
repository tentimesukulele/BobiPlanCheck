import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SchoolSchedule } from '../../src/components/SchoolSchedule';
import { UserService } from '../../src/services/UserService';

const FAMILY_MEMBERS = [
  { id: 1, name: 'Marko', role: 'parent' },
  { id: 2, name: 'Jasna', role: 'parent' },
  { id: 3, name: 'Anže', role: 'child' },
  { id: 4, name: 'David', role: 'child' },
  { id: 5, name: 'Filip', role: 'child' },
];

export default function ScheduleScreen() {
  const { userId, userName } = useLocalSearchParams();
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<number>(1);
  const [selectedStudentId, setSelectedStudentId] = useState<number>(3);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        // First try to get from URL params
        const paramUserId = parseInt(userId as string);
        if (paramUserId && !isNaN(paramUserId)) {
          console.log('🎯 Schedule - Using userId from params:', paramUserId);
          setCurrentUserId(paramUserId);
          // For children, default to their own schedule; for parents, default to first child
          const isChild = [3, 4, 5].includes(paramUserId);
          setSelectedStudentId(isChild ? paramUserId : 3);
          return;
        }

        // Fallback to stored user
        const storedUserId = await UserService.getCurrentUserId();
        console.log('🎯 Schedule - Using stored userId:', storedUserId);
        setCurrentUserId(storedUserId);
        const isChild = [3, 4, 5].includes(storedUserId);
        setSelectedStudentId(isChild ? storedUserId : 3);
      } catch (error) {
        console.error('Error initializing user in schedule:', error);
        setCurrentUserId(1); // Final fallback to Marko
        setSelectedStudentId(3); // Default to Anže
      }
    };

    initializeUser();
  }, [userId]);

  const isChild = [3, 4, 5].includes(currentUserId);
  const isParent = [1, 2].includes(currentUserId);

  const scheduleRef = useRef<any>(null);


  const getAvailableStudents = () => {
    if (isParent) {
      // Parents can view all children's schedules
      return FAMILY_MEMBERS.filter(member => member.role === 'child');
    } else {
      // Children can view all children's schedules (including their own)
      return FAMILY_MEMBERS.filter(member => member.role === 'child');
    }
  };

  const getPermissionText = () => {
    return 'Vsi lahko urejajo katerikoli urnik';
  };

  const canEdit = true; // Allow everyone to edit any schedule


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Urnik</Text>
      </View>

      {/* Quick Action Buttons */}
      {canEdit && (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => {
              scheduleRef.current?.openAddModal();
            }}
          >
            <Text style={styles.primaryActionButtonText}>+ Dodaj v urnik</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.studentSelector}>
        <Text style={styles.selectorTitle}>Izberi učenca:</Text>
        <View style={styles.studentButtons}>
          {getAvailableStudents().map((student) => (
            <TouchableOpacity
              key={student.id}
              style={[
                styles.studentButton,
                selectedStudentId === student.id && styles.selectedStudentButton
              ]}
              onPress={() => setSelectedStudentId(student.id)}
            >
              <Text style={[
                styles.studentButtonText,
                selectedStudentId === student.id && styles.selectedStudentButtonText
              ]}>
                {student.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.permissionText}>{getPermissionText()}</Text>
      </View>

      <View style={styles.content}>
        <SchoolSchedule
          ref={scheduleRef}
          studentId={selectedStudentId}
          canEdit={canEdit}
          viewingUserId={currentUserId}
        />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flex: 1,
  },
  studentSelector: {
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
  selectorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  studentButtons: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  studentButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedStudentButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  studentButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  selectedStudentButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  permissionText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
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
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    shadowColor: '#007AFF',
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