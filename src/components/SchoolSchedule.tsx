import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SchoolSchedule as ScheduleType } from '../types';
import { ScheduleService } from '../services/ScheduleService';
import { CreateScheduleModal } from './CreateScheduleModal';

interface SchoolScheduleProps {
  studentId: number;
  canEdit?: boolean;
  viewingUserId?: number;
}

const DAYS = [
  { short: 'PON', full: 'Ponedeljek', index: 1 },
  { short: 'TOR', full: 'Torek', index: 2 },
  { short: 'SRE', full: 'Sreda', index: 3 },
  { short: 'ČET', full: 'Četrtek', index: 4 },
  { short: 'PET', full: 'Petek', index: 5 },
];

const TIME_SLOTS = [
  { period: '1. URA', time: '07:30-08:15' },
  { period: '2. URA', time: '08:20-09:05' },
  { period: 'PREDURA', time: '09:10-09:55' },
  { period: '3. URA', time: '10:15-11:00' },
  { period: '4. URA', time: '11:05-11:50' },
  { period: '5. URA', time: '11:55-12:40' },
  { period: '6. URA', time: '12:45-13:30' },
  { period: 'TRENING', time: '16:00-17:30' }
];

const WEEK_TYPES = [
  { key: 'A' as const, label: 'Teden A' },
  { key: 'B' as const, label: 'Teden B' },
];

export const SchoolSchedule = forwardRef<any, SchoolScheduleProps>(({ studentId, canEdit = true, viewingUserId }, ref) => {
  // Allow everyone to edit any schedule
  const canEditSchedule = canEdit;

  // Debug logging
  console.log('SchoolSchedule Debug:', {
    studentId,
    viewingUserId,
    canEdit,
    canEditSchedule
  });
  const [schedules, setSchedules] = useState<ScheduleType[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<'A' | 'B'>('A');
  const [currentWeekType, setCurrentWeekType] = useState<'A' | 'B'>('A');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    openAddModal: () => {
      setShowCreateModal(true);
    }
  }));

  // Only Anže (id: 3) can set the current week type
  const isAnze = viewingUserId === 3;

  useEffect(() => {
    loadSchedule();
    loadCurrentWeekType();
  }, [studentId]);

  const loadCurrentWeekType = async () => {
    try {
      const stored = await AsyncStorage.getItem('currentWeekType');
      if (stored) {
        setCurrentWeekType(stored as 'A' | 'B');
      } else {
        const defaultWeek = getCurrentWeekType();
        setCurrentWeekType(defaultWeek);
        await AsyncStorage.setItem('currentWeekType', defaultWeek);
      }
    } catch (error) {
      console.error('Error loading current week type:', error);
    }
  };

  const saveCurrentWeekType = async (weekType: 'A' | 'B') => {
    try {
      await AsyncStorage.setItem('currentWeekType', weekType);
      setCurrentWeekType(weekType);
    } catch (error) {
      console.error('Error saving current week type:', error);
    }
  };

  const loadSchedule = async () => {
    try {
      const loadedSchedules = await ScheduleService.getScheduleForStudent(studentId);
      setSchedules(loadedSchedules);
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  };

  const getScheduleForTimeSlot = (dayIndex: number, timeSlot: { period: string; time: string }): ScheduleType | null => {
    const startTime = timeSlot.time.split('-')[0];
    return schedules.find(s =>
      s.week_type === selectedWeek &&
      s.day_of_week === dayIndex &&
      s.start_time.startsWith(startTime)
    ) || null;
  };

  const getCurrentWeekType = (): 'A' | 'B' => {
    const now = new Date();
    const weekNumber = Math.ceil(now.getDate() / 7);
    return weekNumber % 2 === 1 ? 'A' : 'B';
  };

  const getSubjectAbbreviation = (subject: string): string => {
    const abbreviations: { [key: string]: string } = {
      'Slovenščina': 'SLO',
      'Angleščina': 'ANG',
      'Matematika': 'MAT',
      'Fizika': 'FIZ',
      'Kemija': 'KEM',
      'Biologija': 'BIO',
      'Geografija': 'GEO',
      'Zgodovina': 'ZGO',
      'Likovna umetnost': 'LUM',
      'Glasbena umetnost': 'GUM',
      'Šport': 'ŠPO',
      'Športna vzgoja': 'ŠPO',
      'Tehnika in tehnologija': 'TIT',
      'Družba': 'DRU',
      'Naravoslovje': 'NAR',
      'Informatika': 'INF',
      'Trening': '⚽',
      'Nogomet': '⚽',
      'Nogometni trening': '⚽'
    };
    return abbreviations[subject] || subject.substring(0, 3).toUpperCase();
  };

  const deleteScheduleItem = async (scheduleId: number) => {
    Alert.alert(
      'Izbriši urnik',
      'Ali si prepričan, da želiš izbrisati ta element urnika?',
      [
        { text: 'Prekliči', style: 'cancel' },
        {
          text: 'Izbriši',
          style: 'destructive',
          onPress: async () => {
            try {
              await ScheduleService.deleteScheduleItem(scheduleId);
              loadSchedule();
            } catch (error) {
              Alert.alert('Napaka', 'Napaka pri brisanju elementa urnika');
            }
          },
        },
      ]
    );
  };

  const renderScheduleCell = (dayIndex: number, timeSlot: { period: string; time: string }) => {
    const schedule = getScheduleForTimeSlot(dayIndex, timeSlot);

    if (!schedule) {
      return (
        <TouchableOpacity
          key={`${dayIndex}-${timeSlot.time}`}
          style={styles.emptyCell}
          onPress={() => canEditSchedule && handleAddSchedule(dayIndex, timeSlot)}
          disabled={!canEditSchedule}
        >
          <Text style={styles.emptyCellText}>{canEditSchedule ? '+' : ''}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={`${dayIndex}-${timeSlot.time}`}
        style={[styles.scheduleCell, { backgroundColor: getSubjectColor(schedule.subject) }]}
        onPress={() => canEditSchedule && handleEditSchedule(schedule)}
      >
        <Text style={styles.subjectAbbrev}>{getSubjectAbbreviation(schedule.subject)}</Text>
        {schedule.classroom && (
          <Text style={styles.classroomText}>{schedule.classroom}</Text>
        )}
        {canEditSchedule && (
          <TouchableOpacity
            style={styles.deleteCellButton}
            onPress={() => deleteScheduleItem(schedule.id)}
          >
            <Text style={styles.deleteCellText}>×</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const getSubjectColor = (subject: string): string => {
    const colors: { [key: string]: string } = {
      'Slovenščina': '#E3F2FD',
      'Angleščina': '#F3E5F5',
      'Matematika': '#E8F5E8',
      'Fizika': '#FFF3E0',
      'Kemija': '#FCE4EC',
      'Biologija': '#E0F2F1',
      'Geografija': '#F1F8E9',
      'Zgodovina': '#FFF8E1',
      'Likovna umetnost': '#FFEBEE',
      'Glasbena umetnost': '#F9FBE7',
      'Šport': '#E1F5FE',
      'Športna vzgoja': '#E1F5FE',
      'Tehnika in tehnologija': '#EFEBE9',
      'Družba': '#F3E5F5',
      'Naravoslovje': '#E8F5E8',
      'Informatika': '#E3F2FD',
      'Trening': '#C8E6C9',
      'Nogomet': '#C8E6C9',
      'Nogometni trening': '#C8E6C9'
    };
    return colors[subject] || '#F5F5F5';
  };

  const handleAddSchedule = (dayIndex: number, timeSlot: { period: string; time: string }) => {
    setSelectedDayIndex(dayIndex);
    setSelectedTimeSlot(timeSlot.time);
    setShowCreateModal(true);
  };

  const handleEditSchedule = (schedule: ScheduleType) => {
    Alert.alert(
      'Uredi urnik',
      `${schedule.subject} ob ${schedule.start_time}`,
      [
        { text: 'Prekliči', style: 'cancel' },
        {
          text: 'Uredi',
          onPress: () => {
            // Pre-fill modal with existing schedule data
            setSelectedDayIndex(schedule.day_of_week);
            setSelectedTimeSlot(schedule.start_time + '-' + schedule.end_time);
            setShowCreateModal(true);
          }
        },
        {
          text: 'Izbriši',
          style: 'destructive',
          onPress: () => deleteScheduleItem(schedule.id)
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Šolski urnik</Text>
        {canEditSchedule && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.addButtonText}>+ Dodaj</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.currentWeekContainer}>
        <View style={styles.currentWeekIndicator}>
          <Text style={styles.currentWeekText}>
            Trenutni teden: {currentWeekType}
          </Text>
        </View>
        {isAnze && (
          <View style={styles.weekTypeControls}>
            <Text style={styles.weekTypeLabel}>Nastavi trenutni teden:</Text>
            <View style={styles.weekTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.weekTypeButton,
                  currentWeekType === 'A' && styles.activeWeekTypeButton
                ]}
                onPress={() => saveCurrentWeekType('A')}
              >
                <Text style={[
                  styles.weekTypeButtonText,
                  currentWeekType === 'A' && styles.activeWeekTypeButtonText
                ]}>
                  A
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.weekTypeButton,
                  currentWeekType === 'B' && styles.activeWeekTypeButton
                ]}
                onPress={() => saveCurrentWeekType('B')}
              >
                <Text style={[
                  styles.weekTypeButtonText,
                  currentWeekType === 'B' && styles.activeWeekTypeButtonText
                ]}>
                  B
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.weekSelector}>
        {WEEK_TYPES.map((week) => (
          <TouchableOpacity
            key={week.key}
            style={[
              styles.weekButton,
              selectedWeek === week.key && styles.activeWeekButton,
              currentWeekType === week.key && styles.currentWeekButton,
            ]}
            onPress={() => setSelectedWeek(week.key)}
          >
            <Text
              style={[
                styles.weekButtonText,
                selectedWeek === week.key && styles.activeWeekButtonText,
              ]}
            >
              {week.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.gridContainer} horizontal showsHorizontalScrollIndicator={false}>
        <ScrollView style={styles.verticalScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.scheduleGrid}>
          {/* Header row with days */}
          <View style={styles.headerRow}>
            <View style={styles.timeHeaderCell}>
              <Text style={styles.timeHeaderText}>URA</Text>
            </View>
            {DAYS.map((day) => (
              <View key={day.index} style={styles.dayHeaderCell}>
                <Text style={styles.dayHeaderText}>{day.short}</Text>
                <Text style={styles.dayHeaderSubtext}>{day.full.slice(0, 3)}</Text>
              </View>
            ))}
          </View>

          {/* Time slots rows */}
          {TIME_SLOTS.map((timeSlot, timeIndex) => (
            <View key={timeSlot.time} style={styles.timeRow}>
              <View style={styles.timeCell}>
                <Text style={styles.periodText}>{timeSlot.period}</Text>
                <Text style={styles.timeText}>{timeSlot.time}</Text>
              </View>
              {DAYS.map((day) => (
                <View key={`${day.index}-${timeSlot.time}`} style={styles.cellWrapper}>
                  {renderScheduleCell(day.index, timeSlot)}
                </View>
              ))}
            </View>
          ))}
          </View>
        </ScrollView>
      </ScrollView>

      {canEditSchedule && (
        <CreateScheduleModal
          visible={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedDayIndex(null);
            setSelectedTimeSlot(null);
          }}
          studentId={studentId}
          currentUserId={viewingUserId || 1}
          onScheduleCreated={loadSchedule}
          prefilledDay={selectedDayIndex || undefined}
          prefilledTimeSlot={selectedTimeSlot || undefined}
          prefilledWeek={selectedWeek}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  addButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  currentWeekContainer: {
    marginBottom: 12,
  },
  currentWeekIndicator: {
    backgroundColor: '#3498db',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  currentWeekText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  weekTypeControls: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  weekTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  weekTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  weekTypeButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeWeekTypeButton: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  weekTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeWeekTypeButtonText: {
    color: 'white',
  },
  weekSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  weekButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeWeekButton: {
    backgroundColor: '#007AFF',
  },
  currentWeekButton: {
    borderWidth: 2,
    borderColor: '#34C759',
  },
  weekButtonText: {
    fontSize: 16,
    color: '#666',
  },
  activeWeekButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  scheduleContainer: {
    flex: 1,
  },
  dayContainer: {
    marginBottom: 20,
  },
  dayHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingLeft: 4,
  },
  scheduleItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeContainer: {
    width: 80,
    marginRight: 12,
  },
  subjectContainer: {
    flex: 1,
  },
  subjectText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  teacherText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 1,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyDay: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyDayText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  // New grid styles
  gridContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  verticalScroll: {
    flex: 1,
  },
  scheduleGrid: {
    minWidth: 600,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#34495e',
    borderBottomWidth: 1,
    borderBottomColor: '#2c3e50',
  },
  timeHeaderCell: {
    width: 60,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2c3e50',
  },
  timeHeaderText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  dayHeaderCell: {
    flex: 1,
    minWidth: 80,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#2c3e50',
  },
  dayHeaderText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  dayHeaderSubtext: {
    color: '#bdc3c7',
    fontSize: 9,
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    height: 60,
  },
  timeCell: {
    width: 60,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRightWidth: 1,
    borderRightColor: '#ecf0f1',
  },
  periodText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 9,
    fontWeight: '500',
    color: '#34495e',
    textAlign: 'center',
  },
  cellWrapper: {
    flex: 1,
    minWidth: 80,
    borderLeftWidth: 1,
    borderLeftColor: '#ecf0f1',
  },
  emptyCell: {
    flex: 1,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  emptyCellText: {
    color: '#bdc3c7',
    fontSize: 18,
    fontWeight: '300',
  },
  scheduleCell: {
    flex: 1,
    height: 60,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  subjectAbbrev: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    lineHeight: 16,
  },
  classroomText: {
    fontSize: 9,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 2,
  },
  deleteCellButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e74c3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCellText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
});