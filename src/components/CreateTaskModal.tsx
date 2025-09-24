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
import { FamilyMember, CreateTaskRequest } from '../types';
import { TaskService } from '../services/TaskService';

const FAMILY_MEMBERS: FamilyMember[] = [
  { id: 1, name: 'Marko', role: 'parent', avatar_color: '#007AFF', created_at: '', updated_at: '' },
  { id: 2, name: 'Jasna', role: 'parent', avatar_color: '#FF3B30', created_at: '', updated_at: '' },
  { id: 3, name: 'Anže', role: 'child', avatar_color: '#34C759', created_at: '', updated_at: '' },
  { id: 4, name: 'David', role: 'child', avatar_color: '#FF9500', created_at: '', updated_at: '' },
  { id: 5, name: 'Filip', role: 'child', avatar_color: '#AF52DE', created_at: '', updated_at: '' },
];

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  currentUserId: number;
}

export function CreateTaskModal({ visible, onClose, currentUserId }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<number | null>(null);
  const [taskType, setTaskType] = useState<'one_time' | 'weekly'>('one_time');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssignedTo(null);
    setTaskType('one_time');
    setDueDate(null);
    setShowDatePicker(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Napaka', 'Naslov naloge je obvezen');
      return;
    }

    if (!assignedTo) {
      Alert.alert('Napaka', 'Izberi, komu želiš dodeliti nalogo');
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData: CreateTaskRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        assigned_to: assignedTo,
        task_type: taskType,
        due_date: dueDate ? dueDate.toISOString() : undefined,
        ...(taskType === 'weekly' && {
          weekly_start_date: new Date().toISOString().split('T')[0],
          weekly_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }),
      };

      await TaskService.createTask(currentUserId, taskData);
      Alert.alert('Uspeh', 'Naloga je bila uspešno ustvarjena');
      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('Napaka', 'Napaka pri ustvarjanju naloge');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('sl-SI', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
            <Text style={styles.cancelButton}>Prekliči</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nova naloga</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting || !title.trim() || !assignedTo}>
            <Text style={[styles.saveButton, (!title.trim() || !assignedTo || isSubmitting) && styles.disabledButton]}>
              Shrani
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Naslov naloge *</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="npr. Pospravi sobo"
              maxLength={100}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Opis (opcijsko)</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Dodatne podrobnosti naloge..."
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tip naloge</Text>
            <View style={styles.taskTypeContainer}>
              <TouchableOpacity
                style={[styles.taskTypeButton, taskType === 'one_time' && styles.activeTaskType]}
                onPress={() => setTaskType('one_time')}
              >
                <Text style={[styles.taskTypeText, taskType === 'one_time' && styles.activeTaskTypeText]}>
                  Enkratna naloga
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.taskTypeButton, taskType === 'weekly' && styles.activeTaskType]}
                onPress={() => setTaskType('weekly')}
              >
                <Text style={[styles.taskTypeText, taskType === 'weekly' && styles.activeTaskTypeText]}>
                  Tedensko (7 dni)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rok dokončanja (opcijsko)</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.datePickerText, dueDate && styles.selectedDateText]}>
                {dueDate ? formatDate(dueDate) : '📅 Nastavi rok dokončanja'}
              </Text>
            </TouchableOpacity>
            {dueDate && (
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={() => setDueDate(null)}
              >
                <Text style={styles.clearDateText}>Odstrani rok</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dodeli komu *</Text>
            <View style={styles.membersGrid}>
              {FAMILY_MEMBERS.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.memberOption,
                    assignedTo === member.id && styles.selectedMember,
                    { borderColor: member.avatar_color },
                  ]}
                  onPress={() => setAssignedTo(member.id)}
                >
                  <View style={[styles.memberAvatar, { backgroundColor: member.avatar_color }]}>
                    <Text style={styles.memberAvatarText}>{member.name[0]}</Text>
                  </View>
                  <Text style={styles.memberName}>{member.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {showDatePicker && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
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
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  taskTypeContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  taskTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTaskType: {
    backgroundColor: '#007AFF',
  },
  taskTypeText: {
    fontSize: 14,
    color: '#666',
  },
  activeTaskTypeText: {
    color: 'white',
    fontWeight: '600',
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  memberOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'white',
    minWidth: 80,
  },
  selectedMember: {
    backgroundColor: '#f0f8ff',
    borderWidth: 3,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  memberAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  datePickerButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 16,
    color: '#666',
  },
  selectedDateText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  clearDateButton: {
    marginTop: 8,
    alignSelf: 'center',
  },
  clearDateText: {
    fontSize: 14,
    color: '#FF3B30',
    textDecorationLine: 'underline',
  },
});