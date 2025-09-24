import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { GradesService, Grade, GradeStatistics } from '../services/GradesService';
import { AddGradeModal } from './AddGradeModal';

interface GradesViewProps {
  currentUserId: number;
}

const FAMILY_MEMBERS = [
  { id: 1, name: 'Marko', role: 'parent' },
  { id: 2, name: 'Jasna', role: 'parent' },
  { id: 3, name: 'Anže', role: 'child' },
  { id: 4, name: 'David', role: 'child' },
  { id: 5, name: 'Filip', role: 'child' },
];


export const GradesView = forwardRef<any, GradesViewProps>(({ currentUserId }, ref) => {
  // Validate and fallback currentUserId
  const validCurrentUserId = !currentUserId || isNaN(currentUserId) || currentUserId <= 0 ? 1 : currentUserId;

  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number>(validCurrentUserId);
  const [selectedSubject, setSelectedSubject] = useState<string>('Vse');
  const [showAddGradeModal, setShowAddGradeModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    openAddGradeModal: () => {
      // Allow anyone to add grades for any student
      setShowAddGradeModal(true);
    }
  }));

  const currentUser = FAMILY_MEMBERS.find(member => member.id === validCurrentUserId);
  const isChild = currentUser?.role === 'child';
  const isParent = currentUser?.role === 'parent';

  useEffect(() => {
    if (isChild) {
      setSelectedStudentId(validCurrentUserId);
    } else {
      setSelectedStudentId(3); // Default to Anže for parents
    }
  }, [validCurrentUserId, isChild]);

  useEffect(() => {
    loadGrades();
  }, [selectedStudentId]);

  const loadGrades = async () => {
    try {
      setLoading(true);
      const data = await GradesService.getGradesForStudent(selectedStudentId, {
        semester: GradesService.getCurrentSemester(),
        school_year: GradesService.getCurrentSchoolYear()
      });
      setGrades(data);
    } catch (error) {
      console.error('Error loading grades:', error);
      Alert.alert('Napaka', 'Napaka pri nalaganju ocen');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableStudents = () => {
    if (isParent) {
      return FAMILY_MEMBERS.filter(member => member.role === 'child');
    } else {
      return FAMILY_MEMBERS.filter(member => member.role === 'child');
    }
  };

  const getSubjects = () => {
    const subjects = [...new Set(grades.map(grade => grade.subject))];
    return ['Vse', ...subjects];
  };

  const getFilteredGrades = () => {
    let filtered = grades;

    if (selectedSubject !== 'Vse') {
      filtered = filtered.filter(grade => grade.subject === selectedSubject);
    }

    return filtered.sort((a, b) => new Date(b.date_received).getTime() - new Date(a.date_received).getTime());
  };

  const getSubjectAverage = (subject: string) => {
    return GradesService.calculateSubjectAverage(grades, subject);
  };

  const getOverallAverage = () => {
    return GradesService.calculateOverallAverage(grades);
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 4.5) return '#27ae60';
    if (grade >= 3.5) return '#f39c12';
    if (grade >= 2.5) return '#e67e22';
    return '#e74c3c';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sl-SI');
  };

  const canAddGrade = () => {
    // Allow everyone to add grades for anyone
    return true;
  };

  return (
    <View style={styles.container}>
      {/* Student Selector */}
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
      </View>

      {/* Subject Filter */}
      <View style={styles.subjectFilter}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>Predmet:</Text>
          {canAddGrade() && (
            <TouchableOpacity
              style={styles.addGradeButton}
              onPress={() => setShowAddGradeModal(true)}
            >
              <Text style={styles.addGradeButtonText}>+ Dodaj oceno</Text>
            </TouchableOpacity>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.subjectButtons}>
            {getSubjects().map((subject) => (
              <TouchableOpacity
                key={subject}
                style={[
                  styles.subjectButton,
                  selectedSubject === subject && styles.selectedSubjectButton
                ]}
                onPress={() => setSelectedSubject(subject)}
              >
                <Text style={[
                  styles.subjectButtonText,
                  selectedSubject === subject && styles.selectedSubjectButtonText
                ]}>
                  {subject}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Average Cards */}
      <View style={styles.averageSection}>
        <View style={styles.averageCard}>
          <Text style={styles.averageLabel}>Splošno povprečje</Text>
          <Text style={[styles.averageValue, { color: getGradeColor(getOverallAverage()) }]}>
            {getOverallAverage().toFixed(2)}
          </Text>
        </View>
        {selectedSubject !== 'Vse' && (
          <View style={styles.averageCard}>
            <Text style={styles.averageLabel}>{selectedSubject}</Text>
            <Text style={[styles.averageValue, { color: getGradeColor(getSubjectAverage(selectedSubject)) }]}>
              {getSubjectAverage(selectedSubject).toFixed(2)}
            </Text>
          </View>
        )}
      </View>

      {/* Grades List */}
      <ScrollView style={styles.gradesList}>
        {getFilteredGrades().map((grade) => (
          <View key={grade.id} style={styles.gradeCard}>
            <View style={styles.gradeHeader}>
              <View style={styles.gradeInfo}>
                <Text style={styles.gradeSubject}>{grade.subject}</Text>
                <Text style={styles.gradeDescription}>{grade.description}</Text>
              </View>
              <View style={styles.gradeValueContainer}>
                <Text style={[styles.gradeValue, { color: getGradeColor(grade.grade) }]}>
                  {grade.grade}
                </Text>
                <Text style={styles.gradeWeight}>×{grade.weight}</Text>
              </View>
            </View>
            <View style={styles.gradeFooter}>
              <Text style={styles.gradeTeacher}>{grade.teacher}</Text>
              <Text style={styles.gradeDate}>{formatDate(grade.date_received)}</Text>
            </View>
          </View>
        ))}
        {getFilteredGrades().length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Ni ocen za prikaz</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Grade Modal */}
      {showAddGradeModal && (
        <AddGradeModal
          visible={showAddGradeModal}
          onClose={() => setShowAddGradeModal(false)}
          studentId={selectedStudentId}
          currentUserId={validCurrentUserId}
          onGradeAdded={loadGrades}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  studentSelector: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  studentButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  studentButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedStudentButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  studentButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedStudentButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  subjectFilter: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  addGradeButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addGradeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  subjectButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  subjectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedSubjectButton: {
    backgroundColor: '#34495e',
    borderColor: '#34495e',
  },
  subjectButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedSubjectButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  averageSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  averageCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  averageLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  averageValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  gradesList: {
    flex: 1,
  },
  gradeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  gradeInfo: {
    flex: 1,
    marginRight: 16,
  },
  gradeSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  gradeDescription: {
    fontSize: 14,
    color: '#666',
  },
  gradeValueContainer: {
    alignItems: 'center',
  },
  gradeValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  gradeWeight: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  gradeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeTeacher: {
    fontSize: 12,
    color: '#999',
  },
  gradeDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
});