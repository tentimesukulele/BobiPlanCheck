import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { ScheduleService } from '../services/ScheduleService';

interface CreateScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  studentId: number;
  currentUserId: number;
  onScheduleCreated: () => void;
  prefilledDay?: number;
  prefilledTimeSlot?: string;
  prefilledWeek?: 'A' | 'B';
}

const DAYS = [
  { id: 1, name: 'Ponedeljek' },
  { id: 2, name: 'Torek' },
  { id: 3, name: 'Sreda' },
  { id: 4, name: 'Četrtek' },
  { id: 5, name: 'Petek' },
];

const WEEK_TYPES = [
  { key: 'A' as const, label: 'Teden A' },
  { key: 'B' as const, label: 'Teden B' },
  { key: 'BOTH' as const, label: 'Oba tedna A in B' },
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
  'Informatika',
  'Nogometni trening',
  'Trening',
];

export function CreateScheduleModal({ visible, onClose, studentId, currentUserId, onScheduleCreated, prefilledDay, prefilledTimeSlot, prefilledWeek }: CreateScheduleModalProps) {
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [showCustomSubject, setShowCustomSubject] = useState(false);
  const [teacher, setTeacher] = useState('');
  const [classroom, setClassroom] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<'A' | 'B' | 'BOTH'>('A');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (prefilledDay) {
        setSelectedDay(prefilledDay);
      }
      if (prefilledWeek) {
        setSelectedWeek(prefilledWeek);
      }
      if (prefilledTimeSlot) {
        const startTime = prefilledTimeSlot.split('-')[0];
        const endTime = prefilledTimeSlot.split('-')[1];
        setStartTime(startTime);
        setEndTime(endTime);
      }
    }
  }, [visible, prefilledDay, prefilledTimeSlot, prefilledWeek]);

  const resetForm = () => {
    setSubject('');
    setCustomSubject('');
    setShowCustomSubject(false);
    setTeacher('');
    setClassroom('');
    setStartTime('');
    setEndTime('');
    setSelectedDay(null);
    setSelectedWeek('A');
  };

  const validateTime = (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const formatTime = (time: string): string => {
    if (time.length === 4 && !time.includes(':')) {
      return time.slice(0, 2) + ':' + time.slice(2);
    }
    return time;
  };

  const handleTimeChange = (value: string, setter: (time: string) => void) => {
    const formatted = formatTime(value);
    setter(formatted);
  };

  const handleSubmit = async () => {
    const finalSubject = showCustomSubject ? customSubject.trim() : subject;

    if (!finalSubject) {
      Alert.alert('Napaka', 'Ime predmeta je obvezno');
      return;
    }

    if (!selectedDay) {
      Alert.alert('Napaka', 'Izberi dan v tednu');
      return;
    }

    if (!startTime || !validateTime(startTime)) {
      Alert.alert('Napaka', 'Vnesi veljavno uro začetka (npr. 08:00)');
      return;
    }

    if (!endTime || !validateTime(endTime)) {
      Alert.alert('Napaka', 'Vnesi veljavno uro konca (npr. 08:45)');
      return;
    }

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (endMinutes <= startMinutes) {
      Alert.alert('Napaka', 'Ura konca mora biti po uri začetka');
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduleData = {
        student_id: studentId,
        day_of_week: selectedDay,
        subject: finalSubject,
        start_time: startTime,
        end_time: endTime,
        teacher: teacher.trim() || undefined,
        classroom: classroom.trim() || undefined,
      };

      if (selectedWeek === 'BOTH') {
        // Dodaj za oba tedna A in B
        await ScheduleService.createScheduleItem(currentUserId, {
          ...scheduleData,
          week_type: 'A'
        });

        await ScheduleService.createScheduleItem(currentUserId, {
          ...scheduleData,
          week_type: 'B'
        });

        Alert.alert('Uspeh', 'Element urnika je bil uspešno dodan za oba tedna A in B');
      } else {
        // Dodaj samo za izbran teden
        await ScheduleService.createScheduleItem(currentUserId, {
          ...scheduleData,
          week_type: selectedWeek
        });

        Alert.alert('Uspeh', 'Element urnika je bil uspešno dodan');
      }

      resetForm();
      onScheduleCreated();
      onClose();
    } catch (error) {
      Alert.alert('Napaka', 'Napaka pri dodajanju elementa urnika');
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
            <Text style={styles.cancelButton}>Prekliči</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dodaj v urnik</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting || (!subject && !customSubject.trim()) || !selectedDay || !startTime || !endTime}
          >
            <Text
              style={[
                styles.saveButton,
                ((!subject && !customSubject.trim()) || !selectedDay || !startTime || !endTime || isSubmitting) &&
                  styles.disabledButton,
              ]}
            >
              Shrani
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Učilnica</Text>
            <TextInput
              style={styles.textInput}
              value={classroom}
              onChangeText={setClassroom}
              placeholder="npr. 2A ali Kemijski laboratorij"
              maxLength={50}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Teden *</Text>
            <View style={styles.weekTypeContainer}>
              {WEEK_TYPES.map((week) => (
                <TouchableOpacity
                  key={week.key}
                  style={[
                    styles.weekTypeButton,
                    selectedWeek === week.key && styles.activeWeekType,
                    week.key === 'BOTH' && styles.bothWeeksButton,
                    selectedWeek === week.key && week.key === 'BOTH' && styles.activeBothWeeksButton
                  ]}
                  onPress={() => setSelectedWeek(week.key)}
                >
                  <Text
                    style={[
                      styles.weekTypeText,
                      selectedWeek === week.key && styles.activeWeekTypeText,
                      week.key === 'BOTH' && styles.bothWeeksText,
                      selectedWeek === week.key && week.key === 'BOTH' && styles.activeBothWeeksText
                    ]}
                  >
                    {week.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dan v tednu *</Text>
            <View style={styles.daysGrid}>
              {DAYS.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  style={[styles.dayButton, selectedDay === day.id && styles.activeDayButton]}
                  onPress={() => setSelectedDay(day.id)}
                >
                  <Text style={[styles.dayButtonText, selectedDay === day.id && styles.activeDayButtonText]}>
                    {day.name.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.timeSection}>
            <View style={styles.timeInputContainer}>
              <Text style={styles.sectionTitle}>Ura začetka *</Text>
              <TextInput
                style={styles.timeInput}
                value={startTime}
                onChangeText={(value) => handleTimeChange(value, setStartTime)}
                placeholder="08:00"
                maxLength={5}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.timeInputContainer}>
              <Text style={styles.sectionTitle}>Ura konca *</Text>
              <TextInput
                style={styles.timeInput}
                value={endTime}
                onChangeText={(value) => handleTimeChange(value, setEndTime)}
                placeholder="08:45"
                maxLength={5}
                keyboardType="numeric"
              />
            </View>
          </View>
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
  weekTypeContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  weekTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeWeekType: {
    backgroundColor: '#007AFF',
  },
  weekTypeText: {
    fontSize: 14,
    color: '#666',
  },
  activeWeekTypeText: {
    color: 'white',
    fontWeight: '600',
  },
  bothWeeksButton: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  activeBothWeeksButton: {
    backgroundColor: '#FF7A00',
    borderColor: '#FF7A00',
  },
  bothWeeksText: {
    color: 'white',
    fontWeight: '600',
  },
  activeBothWeeksText: {
    color: 'white',
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeDayButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeDayButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  timeSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    textAlign: 'center',
  },
  subjectButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
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
});