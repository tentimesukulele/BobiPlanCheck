import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GradesService, CreateGradeRequest } from '../services/GradesService';

interface AddGradeModalProps {
  visible: boolean;
  onClose: () => void;
  studentId: number;
  currentUserId: number;
  onGradeAdded: () => void;
}

const GRADE_TYPES = [
  { key: 'test', label: 'Pisni izpit' },
  { key: 'homework', label: 'Domača naloga' },
  { key: 'oral', label: 'Ustna ocena' },
  { key: 'project', label: 'Projekt' },
  { key: 'other', label: 'Drugo' },
];

const COMMON_SUBJECTS = [
  'Matematika',
  'Slovenščina',
  'Angleščina',
  'Naravoslovje',
  'Družba',
  'Zgodovina',
  'Geografija',
  'Fizika',
  'Kemija',
  'Biologija',
  'Likovna umetnost',
  'Glasbena umetnost',
  'Šport',
  'Tehnika in tehnologija',
];

export function AddGradeModal({ visible, onClose, studentId, currentUserId, onGradeAdded }: AddGradeModalProps) {
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [showCustomSubject, setShowCustomSubject] = useState(false);
  const [grade, setGrade] = useState('');
  const [description, setDescription] = useState('');
  const [teacher, setTeacher] = useState('');
  const [weight, setWeight] = useState('1');
  const [gradeType, setGradeType] = useState<'test' | 'homework' | 'oral' | 'project' | 'other'>('other');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setSubject('');
    setCustomSubject('');
    setShowCustomSubject(false);
    setGrade('');
    setDescription('');
    setTeacher('');
    setWeight('1');
    setGradeType('other');
    setDate(new Date());
    setShowDatePicker(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const validateForm = (): boolean => {
    const finalSubject = showCustomSubject ? customSubject.trim() : subject;

    if (!finalSubject) {
      Alert.alert('Napaka', 'Izberi ali vnesi predmet');
      return false;
    }

    const gradeNum = parseFloat(grade);
    if (!grade || isNaN(gradeNum) || gradeNum < 1 || gradeNum > 5) {
      Alert.alert('Napaka', 'Ocena mora biti med 1 in 5');
      return false;
    }

    const weightNum = parseInt(weight);
    if (!weight || isNaN(weightNum) || weightNum < 1 || weightNum > 5) {
      Alert.alert('Napaka', 'Utež mora biti med 1 in 5');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const finalSubject = showCustomSubject ? customSubject.trim() : subject;

      const gradeData: CreateGradeRequest = {
        student_id: studentId,
        subject: finalSubject,
        grade: parseFloat(grade),
        description: description.trim() || undefined,
        date_received: date.toISOString().split('T')[0], // YYYY-MM-DD format
        weight: parseInt(weight),
        teacher: teacher.trim() || undefined,
        grade_type: gradeType,
        semester: GradesService.getCurrentSemester(),
        school_year: GradesService.getCurrentSchoolYear(),
      };

      await GradesService.createGrade(currentUserId, gradeData);

      Alert.alert('Uspeh', 'Ocena je bila uspešno dodana');
      resetForm();
      onGradeAdded();
      onClose();
    } catch (error) {
      console.error('Error adding grade:', error);
      Alert.alert('Napaka', 'Napaka pri dodajanju ocene');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('sl-SI');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
            <Text style={styles.cancelButton}>Prekliči</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dodaj oceno</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={[styles.saveButton, isSubmitting && styles.disabledButton]}>
              Shrani
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Subject Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Predmet *</Text>

            {!showCustomSubject ? (
              <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.subjectButtons}>
                    {COMMON_SUBJECTS.map((subj) => (
                      <TouchableOpacity
                        key={subj}
                        style={[
                          styles.subjectButton,
                          subject === subj && styles.selectedSubjectButton
                        ]}
                        onPress={() => setSubject(subj)}
                      >
                        <Text style={[
                          styles.subjectButtonText,
                          subject === subj && styles.selectedSubjectButtonText
                        ]}>
                          {subj}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={styles.customSubjectButton}
                      onPress={() => setShowCustomSubject(true)}
                    >
                      <Text style={styles.customSubjectButtonText}>+ Drugo</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            ) : (
              <View>
                <TextInput
                  style={styles.textInput}
                  value={customSubject}
                  onChangeText={setCustomSubject}
                  placeholder="Vnesi ime predmeta"
                  maxLength={100}
                />
                <TouchableOpacity
                  style={styles.backToListButton}
                  onPress={() => {
                    setShowCustomSubject(false);
                    setCustomSubject('');
                  }}
                >
                  <Text style={styles.backToListButtonText}>← Nazaj na seznam</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Grade */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ocena *</Text>
            <TextInput
              style={styles.textInput}
              value={grade}
              onChangeText={setGrade}
              placeholder="npr. 4 ali 4.5"
              keyboardType="decimal-pad"
              maxLength={3}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Opis</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="npr. Pisni izpit iz linearne enačbe"
              multiline
              numberOfLines={3}
              maxLength={255}
            />
          </View>

          {/* Teacher */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Učitelj</Text>
            <TextInput
              style={styles.textInput}
              value={teacher}
              onChangeText={setTeacher}
              placeholder="npr. Mag. Novak"
              maxLength={100}
            />
          </View>

          {/* Weight and Grade Type */}
          <View style={styles.twoColumnSection}>
            <View style={styles.halfSection}>
              <Text style={styles.sectionTitle}>Utež *</Text>
              <TextInput
                style={styles.textInput}
                value={weight}
                onChangeText={setWeight}
                placeholder="1-5"
                keyboardType="number-pad"
                maxLength={1}
              />
            </View>

            <View style={styles.halfSection}>
              <Text style={styles.sectionTitle}>Tip ocene</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.gradeTypeButtons}>
                  {GRADE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.gradeTypeButton,
                        gradeType === type.key && styles.selectedGradeTypeButton
                      ]}
                      onPress={() => setGradeType(type.key as any)}
                    >
                      <Text style={[
                        styles.gradeTypeButtonText,
                        gradeType === type.key && styles.selectedGradeTypeButtonText
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Datum prejema ocene *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>{formatDate(date)}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </ScrollView>
      </View>
    </Modal>
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
    padding: 16,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  disabledButton: {
    color: '#999',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  twoColumnSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  halfSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  subjectButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  subjectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedSubjectButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  subjectButtonText: {
    fontSize: 14,
    color: '#666',
  },
  selectedSubjectButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  customSubjectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#27ae60',
    borderWidth: 1,
    borderColor: '#27ae60',
  },
  customSubjectButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  backToListButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  backToListButtonText: {
    fontSize: 14,
    color: '#007AFF',
  },
  gradeTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  gradeTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedGradeTypeButton: {
    backgroundColor: '#34495e',
    borderColor: '#34495e',
  },
  gradeTypeButtonText: {
    fontSize: 12,
    color: '#666',
  },
  selectedGradeTypeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  dateButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
});