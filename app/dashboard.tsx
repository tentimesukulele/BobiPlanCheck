import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TaskList } from '../src/components/TaskList';
import { FamilyCalendar } from '../src/components/FamilyCalendar';
import { SchoolSchedule } from '../src/components/SchoolSchedule';
import { CreateTaskModal } from '../src/components/CreateTaskModal';
import { useNotifications } from '../src/hooks/useNotifications';

type TabType = 'tasks' | 'calendar' | 'schedule';

export default function DashboardScreen() {
  const { userId, userName } = useLocalSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [showCreateTask, setShowCreateTask] = useState(false);

  const currentUserId = parseInt(userId as string);
  const isChild = [3, 4, 5].includes(currentUserId); // Anže, David, Filip

  const {
    isInitialized,
    pushToken,
    permissions,
    requestPermissions
  } = useNotifications(currentUserId);

  useEffect(() => {
    // Request notification permissions on first load
    if (isInitialized && !permissions?.granted && permissions?.canAskAgain) {
      requestPermissions();
    }
  }, [isInitialized, permissions]);

  useEffect(() => {
    // Redirect to the new tabs structure
    router.replace(`/(tabs)/tasks?userId=${userId}&userName=${userName}`);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Odjava',
      'Ali se res želite odjaviti?',
      [
        {
          text: 'Prekliči',
          style: 'cancel',
        },
        {
          text: 'Odjavi se',
          style: 'destructive',
          onPress: () => {
            // Navigate back to member selection
            router.replace('/');
          },
        },
      ]
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tasks':
        return <TaskList currentUserId={currentUserId} />;
      case 'calendar':
        return <FamilyCalendar currentUserId={currentUserId} />;
      case 'schedule':
        return isChild ? (
          <SchoolSchedule studentId={currentUserId} />
        ) : (
          <Text style={styles.noAccess}>Urnik ni na voljo za starše</Text>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.welcomeText}>Pozdravljeni, {userName}!</Text>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Odjava</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerBottom}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateTask(true)}
          >
            <Text style={styles.createButtonText}>+ Nova naloga</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {renderTabContent()}
      </View>

      <View style={styles.bottomTabContainer}>
        <TouchableOpacity
          style={[styles.bottomTab, activeTab === 'tasks' && styles.activeBottomTab]}
          onPress={() => setActiveTab('tasks')}
        >
          <Text style={styles.bottomTabIcon}>📋</Text>
          <Text style={[styles.bottomTabText, activeTab === 'tasks' && styles.activeBottomTabText]}>
            Naloge
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomTab, activeTab === 'calendar' && styles.activeBottomTab]}
          onPress={() => setActiveTab('calendar')}
        >
          <Text style={styles.bottomTabIcon}>📅</Text>
          <Text style={[styles.bottomTabText, activeTab === 'calendar' && styles.activeBottomTabText]}>
            Koledar
          </Text>
        </TouchableOpacity>

        {isChild && (
          <TouchableOpacity
            style={[styles.bottomTab, activeTab === 'schedule' && styles.activeBottomTab]}
            onPress={() => setActiveTab('schedule')}
          >
            <Text style={styles.bottomTabIcon}>🏫</Text>
            <Text style={[styles.bottomTabText, activeTab === 'schedule' && styles.activeBottomTabText]}>
              Urnik
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <CreateTaskModal
        visible={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        currentUserId={currentUserId}
      />
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 140,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    minWidth: 70,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  bottomTabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 34, // Safe area padding for iOS
    paddingTop: 8,
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeBottomTab: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  bottomTabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  bottomTabText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeBottomTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  noAccess: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 40,
  },
});