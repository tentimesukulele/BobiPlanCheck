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
import { FamilyMember, CreateCalendarEventRequest } from '../types';
import { CalendarService } from '../services/CalendarService';

const FAMILY_MEMBERS: FamilyMember[] = [
  { id: 1, name: 'Marko', role: 'parent', avatar_color: '#007AFF', created_at: '', updated_at: '' },
  { id: 2, name: 'Jasna', role: 'parent', avatar_color: '#FF3B30', created_at: '', updated_at: '' },
  { id: 3, name: 'Anže', role: 'child', avatar_color: '#34C759', created_at: '', updated_at: '' },
  { id: 4, name: 'David', role: 'child', avatar_color: '#FF9500', created_at: '', updated_at: '' },
  { id: 5, name: 'Filip', role: 'child', avatar_color: '#AF52DE', created_at: '', updated_at: '' },
];

const EVENT_TYPES = [
  { key: 'appointment' as const, label: 'Termin', icon: '🏥' },
  { key: 'meeting' as const, label: 'Sestanek', icon: '👥' },
  { key: 'reminder' as const, label: 'Opomnik', icon: '⏰' },
];

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  currentUserId: number;
  onEventCreated: () => void;
}

export function CreateEventModal({ visible, onClose, currentUserId, onEventCreated }: CreateEventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<'appointment' | 'meeting' | 'reminder'>('appointment');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([currentUserId]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug logging
  console.log('🎯 CreateEventModal - currentUserId:', currentUserId);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEventType('appointment');
    setLocation('');
    setDate('');
    setStartTime('');
    setEndTime('');
    setSelectedParticipants([currentUserId]);
  };

  const toggleParticipant = (memberId: number) => {
    if (memberId === currentUserId) return; // Creator is always included

    setSelectedParticipants(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const validateDateTime = (dateStr: string, timeStr: string): Date | null => {
    if (!dateStr || !timeStr) return null;

    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = timeStr.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes);
    } catch {
      return null;
    }
  };

  const formatDateTime = (date: Date): string => {
    return date.toISOString();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Napaka', 'Naslov dogodka je obvezen');
      return;
    }

    if (!date) {
      Alert.alert('Napaka', 'Datum je obvezen');
      return;
    }

    if (!startTime) {
      Alert.alert('Napaka', 'Čas začetka je obvezen');
      return;
    }

    const startDateTime = validateDateTime(date, startTime);
    if (!startDateTime) {
      Alert.alert('Napaka', 'Neveljaven datum ali čas začetka');
      return;
    }

    let endDateTime: Date | null = null;
    if (endTime) {
      endDateTime = validateDateTime(date, endTime);
      if (!endDateTime) {
        Alert.alert('Napaka', 'Neveljaven čas konca');
        return;
      }

      if (endDateTime <= startDateTime) {
        Alert.alert('Napaka', 'Čas konca mora biti po času začetka');
        return;
      }
    }


    if (startDateTime <= new Date()) {
      Alert.alert('Opozorilo', 'Dogodek je v preteklosti. Ali želite nadaljevati?', [
        { text: 'Prekliči', style: 'cancel' },
        { text: 'Nadaljuj', onPress: () => submitEvent() },
      ]);
      return;
    }

    await submitEvent();

    async function submitEvent() {
      setIsSubmitting(true);

      try {
        const eventData: CreateCalendarEventRequest = {
          title: title.trim(),
          description: description.trim() || undefined,
          start_time: formatDateTime(startDateTime!),
          end_time: endDateTime ? formatDateTime(endDateTime) : undefined,
          location: location.trim() || undefined,
          event_type: eventType,
          participant_ids: selectedParticipants,
        };

        await CalendarService.createEvent(currentUserId, eventData);
        Alert.alert('Uspeh', 'Dogodek je bil uspešno ustvarjen');
        resetForm();
        onEventCreated();
        onClose();
      } catch (error) {
        Alert.alert('Napaka', 'Napaka pri ustvarjanju dogodka');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getTodayDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getCurrentTime = (): string => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
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
          <Text style={styles.headerTitle}>Nov dogodek</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting || !title.trim() || !date || !startTime}
          >
            <Text
              style={[
                styles.saveButton,
                (!title.trim() || !date || !startTime || isSubmitting) && styles.disabledButton,
              ]}
            >
              Shrani
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Naslov dogodka *</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="npr. Obisk pri zobozdravniku"
              maxLength={100}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Opis (opcijsko)</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Dodatne informacije o dogodku..."
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tip dogodka</Text>
            <View style={styles.eventTypesContainer}>
              {EVENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[styles.eventTypeButton, eventType === type.key && styles.activeEventType]}
                  onPress={() => setEventType(type.key)}
                >
                  <Text style={styles.eventTypeIcon}>{type.icon}</Text>
                  <Text
                    style={[styles.eventTypeText, eventType === type.key && styles.activeEventTypeText]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lokacija (opcijsko)</Text>
            <TextInput
              style={styles.textInput}
              value={location}
              onChangeText={setLocation}
              placeholder="npr. Zdravstveni dom Ljubljana"
              maxLength={255}
            />
          </View>

          <View style={styles.dateTimeSection}>
            <View style={styles.dateTimeInput}>
              <Text style={styles.sectionTitle}>Datum *</Text>
              <TextInput
                style={styles.textInput}
                value={date}
                onChangeText={setDate}
                placeholder={getTodayDate()}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.quickDateButton}
                onPress={() => setDate(getTodayDate())}
              >
                <Text style={styles.quickDateText}>Danes</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.timeSection}>
            <View style={styles.timeInput}>
              <Text style={styles.sectionTitle}>Čas začetka *</Text>
              <TextInput
                style={styles.textInput}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="09:00"
                maxLength={5}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.quickTimeButton}
                onPress={() => setStartTime(getCurrentTime())}
              >
                <Text style={styles.quickTimeText}>Zdaj</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timeInput}>
              <Text style={styles.sectionTitle}>Čas konca</Text>
              <TextInput
                style={styles.textInput}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="10:00"
                maxLength={5}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Udeleženci</Text>
            <Text style={styles.sectionSubtitle}>
              Izberi družinske člane, ki se bodo udeležili dogodka
            </Text>
            <View style={styles.participantsGrid}>
              {FAMILY_MEMBERS.map((member) => {
                const isSelected = selectedParticipants.includes(member.id);
                const isCreator = member.id === currentUserId;

                // Debug logging for participant detection
                if (member.name === 'Anže' || member.name === 'Marko') {
                  console.log(`👤 ${member.name} (ID: ${member.id}) - isCreator: ${isCreator}, currentUserId: ${currentUserId}`);
                }

                return (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.participantOption,
                      isSelected && styles.selectedParticipant,
                      { borderColor: member.avatar_color },
                      isCreator && styles.creatorParticipant,
                    ]}
                    onPress={() => toggleParticipant(member.id)}
                    disabled={isCreator}
                  >
                    <View style={[styles.participantAvatar, { backgroundColor: member.avatar_color }]}>
                      <Text style={styles.participantAvatarText}>{member.name[0]}</Text>
                    </View>
                    <Text style={styles.participantName}>{member.name}</Text>
                    {isCreator && <Text style={styles.creatorLabel}>(jaz)</Text>}
                  </TouchableOpacity>
                );
              })}
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
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  eventTypesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  eventTypeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeEventType: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  eventTypeIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  eventTypeText: {
    fontSize: 14,
    color: '#666',
  },
  activeEventTypeText: {
    color: 'white',
    fontWeight: '600',
  },
  dateTimeSection: {
    marginBottom: 24,
  },
  dateTimeInput: {
    position: 'relative',
  },
  quickDateButton: {
    position: 'absolute',
    right: 12,
    top: 36,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quickDateText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  timeSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  timeInput: {
    flex: 1,
    position: 'relative',
  },
  quickTimeButton: {
    position: 'absolute',
    right: 12,
    top: 36,
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quickTimeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  participantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  participantOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'white',
    minWidth: 80,
  },
  selectedParticipant: {
    backgroundColor: '#f0f8ff',
    borderWidth: 3,
  },
  creatorParticipant: {
    backgroundColor: '#e8f5e8',
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  participantAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  participantName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  creatorLabel: {
    fontSize: 10,
    color: '#34C759',
    fontWeight: '600',
    marginTop: 2,
  },
});