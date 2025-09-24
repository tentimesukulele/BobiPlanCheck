import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Task, FamilyMember } from '../types';
import { TaskService } from '../services/TaskService';

const FAMILY_MEMBERS: FamilyMember[] = [
  { id: 1, name: 'Marko', role: 'parent', avatar_color: '#007AFF', created_at: '', updated_at: '' },
  { id: 2, name: 'Jasna', role: 'parent', avatar_color: '#FF3B30', created_at: '', updated_at: '' },
  { id: 3, name: 'Anže', role: 'child', avatar_color: '#34C759', created_at: '', updated_at: '' },
  { id: 4, name: 'David', role: 'child', avatar_color: '#FF9500', created_at: '', updated_at: '' },
  { id: 5, name: 'Filip', role: 'child', avatar_color: '#AF52DE', created_at: '', updated_at: '' },
];

interface TaskListProps {
  currentUserId: number;
}

export function TaskList({ currentUserId }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'created'>('assigned');

  useEffect(() => {
    loadTasks();
  }, [filter, currentUserId]);

  const loadTasks = async () => {
    try {
      let loadedTasks: Task[];
      switch (filter) {
        case 'assigned':
          loadedTasks = await TaskService.getTasksAssignedTo(currentUserId);
          break;
        case 'created':
          loadedTasks = await TaskService.getTasksCreatedBy(currentUserId);
          break;
        default:
          loadedTasks = await TaskService.getAllTasks();
      }
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      await TaskService.completeTask(taskId);
      loadTasks();
    } catch (error) {
      Alert.alert('Napaka', 'Napaka pri dokončevanju naloge');
    }
  };


  const handleDeleteTask = (taskId: number) => {
    Alert.alert(
      'Izbriši nalogo',
      'Ali si prepričan, da želiš izbrisati to nalogo?',
      [
        { text: 'Prekliči', style: 'cancel' },
        {
          text: 'Izbriši',
          style: 'destructive',
          onPress: async () => {
            try {
              await TaskService.deleteTask(taskId);
              loadTasks();
            } catch (error) {
              Alert.alert('Napaka', 'Napaka pri brisanju naloge');
            }
          },
        },
      ]
    );
  };


  const getMemberName = (memberId: number): string => {
    const member = FAMILY_MEMBERS.find(m => m.id === memberId);
    return member?.name || 'Neznan';
  };

  const getMemberColor = (memberId: number): string => {
    const member = FAMILY_MEMBERS.find(m => m.id === memberId);
    return member?.avatar_color || '#007AFF';
  };

  const formatDueDate = (dueDateString: string): string => {
    const dueDate = new Date(dueDateString);
    return dueDate.toLocaleDateString('sl-SI', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const isTaskOverdue = (dueDateString: string): boolean => {
    const dueDate = new Date(dueDateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const renderTask = ({ item: task }: { item: Task }) => {
    const isAssignedToMe = task.assigned_to === currentUserId;
    const isCreatedByMe = task.created_by === currentUserId;
    const canComplete = isAssignedToMe && task.status === 'pending';
    const canDelete = isCreatedByMe;

    return (
      <View style={[styles.taskCard, task.status === 'completed' && styles.completedTask]}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <View style={styles.statusBadge}>
            <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
              {getStatusText(task.status)}
            </Text>
          </View>
        </View>

        {task.description && (
          <Text style={styles.taskDescription}>{task.description}</Text>
        )}

        <View style={styles.taskInfo}>
          <View style={styles.memberInfo}>
            <View style={[styles.memberDot, { backgroundColor: getMemberColor(task.created_by) }]} />
            <Text style={styles.memberText}>
              Ustvaril: {getMemberName(task.created_by)}
            </Text>
          </View>
          <View style={styles.memberInfo}>
            <View style={[styles.memberDot, { backgroundColor: getMemberColor(task.assigned_to) }]} />
            <Text style={styles.memberText}>
              Dodeljen: {getMemberName(task.assigned_to)}
            </Text>
          </View>
        </View>

        {task.task_type === 'weekly' && task.weekly_start_date && (
          <Text style={styles.weeklyInfo}>
            Tedensko: {task.weekly_start_date} - {task.weekly_end_date}
          </Text>
        )}

        {task.due_date && (
          <View style={styles.dueDateContainer}>
            <Text style={[styles.dueDateText, isTaskOverdue(task.due_date) && styles.overdueDateText]}>
              📅 Rok: {formatDueDate(task.due_date)}
              {isTaskOverdue(task.due_date) && ' (Zamujeno!)'}
            </Text>
          </View>
        )}


        <View style={styles.taskActions}>
          {canComplete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleCompleteTask(task.id)}
            >
              <Text style={styles.actionButtonText}>Dokončaj</Text>
            </TouchableOpacity>
          )}


          {canDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteTask(task.id)}
            >
              <Text style={styles.actionButtonText}>Izbriši</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#34C759';
      default: return '#FF9500';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'completed': return 'Dokončano';
      default: return 'V teku';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'assigned' && styles.activeFilter]}
          onPress={() => setFilter('assigned')}
        >
          <Text style={[styles.filterText, filter === 'assigned' && styles.activeFilterText]}>
            Moje naloge
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'created' && styles.activeFilter]}
          onPress={() => setFilter('created')}
        >
          <Text style={[styles.filterText, filter === 'created' && styles.activeFilterText]}>
            Ustvarjene
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            Vse naloge
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>Ni nalog za prikaz</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
    fontWeight: '600',
  },
  taskCard: {
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
  completedTask: {
    opacity: 0.7,
    backgroundColor: '#f8f8f8',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  taskInfo: {
    marginBottom: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  memberText: {
    fontSize: 14,
    color: '#666',
  },
  weeklyInfo: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#34C759',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 40,
  },
  dueDateContainer: {
    marginBottom: 8,
  },
  dueDateText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  overdueDateText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
});