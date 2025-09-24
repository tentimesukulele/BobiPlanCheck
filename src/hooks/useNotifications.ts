import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '../services/NotificationService';

interface NotificationHookState {
  isInitialized: boolean;
  pushToken: string | null;
  permissions: {
    granted: boolean;
    canAskAgain: boolean;
  } | null;
  lastNotification: Notifications.Notification | null;
  lastNotificationResponse: Notifications.NotificationResponse | null;
}

export function useNotifications(userId?: number) {
  const [state, setState] = useState<NotificationHookState>({
    isInitialized: false,
    pushToken: null,
    permissions: null,
    lastNotification: null,
    lastNotificationResponse: null,
  });

  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    if (!userId) return;

    // Initialize notifications
    const initializeNotifications = async () => {
      try {
        const pushToken = await notificationService.initialize(userId);
        const settings = await notificationService.getNotificationSettings();

        setState(prev => ({
          ...prev,
          isInitialized: true,
          pushToken,
          permissions: {
            granted: settings.granted,
            canAskAgain: settings.canAskAgain,
          },
        }));
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
        setState(prev => ({
          ...prev,
          isInitialized: true,
          pushToken: null,
        }));
      }
    };

    initializeNotifications();
  }, [userId]);

  useEffect(() => {
    // Set up notification listeners
    const notificationReceivedSubscription = notificationService.addNotificationReceivedListener(
      (notification) => {
        setState(prev => ({
          ...prev,
          lastNotification: notification,
        }));
      }
    );

    const notificationResponseSubscription = notificationService.addNotificationResponseReceivedListener(
      (response) => {
        setState(prev => ({
          ...prev,
          lastNotificationResponse: response,
        }));
      }
    );

    return () => {
      notificationReceivedSubscription.remove();
      notificationResponseSubscription.remove();
    };
  }, []);

  // Helper methods
  const requestPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const settings = await notificationService.getNotificationSettings();

      setState(prev => ({
        ...prev,
        permissions: {
          granted: settings.granted,
          canAskAgain: settings.canAskAgain,
        },
      }));

      return status === 'granted';
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  };

  const sendTestNotification = async () => {
    if (!state.permissions?.granted) {
      console.log('Notifications not permitted');
      return;
    }

    try {
      await notificationService.sendLocalNotification({
        title: 'Test obvestilo',
        body: 'To je testno obvestilo iz BobiPlan aplikacije!',
        data: { test: true },
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  const scheduleTaskReminder = async (taskTitle: string, reminderTime: Date) => {
    if (!state.permissions?.granted) {
      console.log('Notifications not permitted');
      return null;
    }

    try {
      return await notificationService.scheduleNotification(
        {
          title: 'Opomnik za nalogo',
          body: `Ne pozabi dokončati naloge: "${taskTitle}"`,
          data: {
            type: 'task_reminder',
            taskTitle,
          },
        },
        reminderTime
      );
    } catch (error) {
      console.error('Failed to schedule task reminder:', error);
      return null;
    }
  };

  const cancelNotification = async (notificationId: string) => {
    try {
      await notificationService.cancelNotification(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await notificationService.cancelAllNotifications();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  };

  return {
    ...state,
    requestPermissions,
    sendTestNotification,
    scheduleTaskReminder,
    cancelNotification,
    cancelAllNotifications,
    notificationService,
  };
}