import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import apiClient from '../utils/apiClient';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize push notifications
  async initialize(userId: number): Promise<string | null> {
    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      // Get the token that identifies this installation
      if (!Device.isDevice) {
        console.log('Must use physical device for push notifications');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      this.expoPushToken = token.data;

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('family-tasks', {
          name: 'Family Tasks',
          description: 'Notifications for family task assignments',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007AFF',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('family-calendar', {
          name: 'Family Calendar',
          description: 'Notifications for family calendar events',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#34C759',
          sound: 'default',
        });
      }

      // Save token to backend database
      console.log(`💾 Saving push token for user ${userId}: ${token.data}`);

      try {
        // Save token to database via API
        await apiClient.post('/notifications/register-token', {
          memberId: userId,
          token: token.data,
          deviceType: Platform.OS
        });

        console.log('✅ Push token saved to database');
      } catch (apiError) {
        console.error('Failed to save push token to database:', apiError);
        // Still return the token even if saving fails
      }

      return token.data;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return null;
    }
  }

  // Send local notification (for testing purposes)
  async sendLocalNotification(notification: NotificationData): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
        },
        trigger: null, // Send immediately
      });

      console.log(`📱 Sent local notification: ${notification.title}`);
      return notificationId;
    } catch (error) {
      console.error('Error sending local notification:', error);
      throw error;
    }
  }

  // Schedule notification for later
  async scheduleNotification(
    notification: NotificationData,
    trigger: Date | number
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
        },
        trigger: trigger instanceof Date ? trigger : { seconds: trigger },
      });

      console.log(`⏰ Scheduled notification: ${notification.title}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  // Cancel scheduled notification
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`❌ Cancelled notification: ${notificationId}`);
    } catch (error) {
      console.error('Error cancelling notification:', error);
      throw error;
    }
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('❌ Cancelled all notifications');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
      throw error;
    }
  }

  // Task-specific notification methods
  async sendTaskAssignedNotification(taskTitle: string, assignedBy: string, assignedTo: number): Promise<void> {
    const notification: NotificationData = {
      title: 'Nova naloga dodeljena!',
      body: `${assignedBy} ti je dodelil nalogo: "${taskTitle}"`,
      data: {
        type: 'task_assigned',
        taskTitle,
        assignedBy,
      },
    };

    await this.sendLocalNotification(notification);
  }

  async sendTaskCompletedNotification(taskTitle: string, completedBy: string, taskCreator: number): Promise<void> {
    const notification: NotificationData = {
      title: 'Naloga dokončana!',
      body: `${completedBy} je dokončal nalogo: "${taskTitle}"`,
      data: {
        type: 'task_completed',
        taskTitle,
        completedBy,
      },
    };

    await this.sendLocalNotification(notification);
  }

  async sendTaskDisputedNotification(taskTitle: string, disputedBy: string, taskCreator: number, reason: string): Promise<void> {
    const notification: NotificationData = {
      title: 'Naloga izpodbijana!',
      body: `${disputedBy} je izpodbil nalogo: "${taskTitle}" - ${reason}`,
      data: {
        type: 'task_disputed',
        taskTitle,
        disputedBy,
        reason,
      },
    };

    await this.sendLocalNotification(notification);
  }

  async sendWeeklyTaskReminderNotification(taskTitle: string, assignedTo: number): Promise<void> {
    const notification: NotificationData = {
      title: 'Nova tedenska naloga!',
      body: `Nova tedenska naloga je na voljo: "${taskTitle}"`,
      data: {
        type: 'weekly_task_reminder',
        taskTitle,
      },
    };

    await this.sendLocalNotification(notification);
  }

  // Calendar-specific notification methods
  async sendEventInvitationNotification(eventTitle: string, invitedBy: string, invitedUser: number, eventDate: string): Promise<void> {
    const notification: NotificationData = {
      title: 'Nova vabljitev na dogodek!',
      body: `${invitedBy} vas vabi na dogodek: "${eventTitle}" (${new Date(eventDate).toLocaleDateString('sl-SI')})`,
      data: {
        type: 'event_invitation',
        eventTitle,
        invitedBy,
        eventDate,
      },
    };

    await this.sendLocalNotification(notification);
  }

  async sendEventReminderNotification(eventTitle: string, participantId: number, eventTime: string): Promise<void> {
    const eventDate = new Date(eventTime);
    const timeString = eventDate.toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' });

    const notification: NotificationData = {
      title: 'Opomnik za dogodek!',
      body: `Dogodek "${eventTitle}" se bo začel ob ${timeString}`,
      data: {
        type: 'event_reminder',
        eventTitle,
        eventTime,
      },
    };

    await this.sendLocalNotification(notification);
  }

  async sendEventResponseNotification(eventTitle: string, responderName: string, response: string, eventCreator: number): Promise<void> {
    const responseText = response === 'accepted' ? 'sprejel' : 'zavrnil';

    const notification: NotificationData = {
      title: 'Odgovor na dogodek!',
      body: `${responderName} je ${responseText} vabljenje na "${eventTitle}"`,
      data: {
        type: 'event_response',
        eventTitle,
        responderName,
        response,
      },
    };

    await this.sendLocalNotification(notification);
  }

  // Schedule event reminders (1 hour and 15 minutes before)
  async scheduleEventReminders(eventTitle: string, eventTime: string, participantIds: number[]): Promise<string[]> {
    const eventDate = new Date(eventTime);
    const now = new Date();

    const notificationIds: string[] = [];

    // Schedule 1 hour reminder
    const oneHourBefore = new Date(eventDate.getTime() - 60 * 60 * 1000);
    if (oneHourBefore > now) {
      const notificationId = await this.scheduleNotification(
        {
          title: 'Dogodek v 1 uri!',
          body: `Dogodek "${eventTitle}" se bo začel čez 1 uro`,
          data: {
            type: 'event_reminder_1h',
            eventTitle,
            eventTime,
          },
        },
        oneHourBefore
      );
      notificationIds.push(notificationId);
    }

    // Schedule 15 minute reminder
    const fifteenMinutesBefore = new Date(eventDate.getTime() - 15 * 60 * 1000);
    if (fifteenMinutesBefore > now) {
      const notificationId = await this.scheduleNotification(
        {
          title: 'Dogodek v 15 minutah!',
          body: `Dogodek "${eventTitle}" se bo začel čez 15 minut`,
          data: {
            type: 'event_reminder_15m',
            eventTitle,
            eventTime,
          },
        },
        fifteenMinutesBefore
      );
      notificationIds.push(notificationId);
    }

    return notificationIds;
  }

  // Get notification settings
  async getNotificationSettings() {
    const permissions = await Notifications.getPermissionsAsync();
    return {
      granted: permissions.status === 'granted',
      canAskAgain: permissions.canAskAgain,
      expires: permissions.expires,
      ios: permissions.ios,
      android: permissions.android,
    };
  }

  // Set up notification listeners
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseReceivedListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Helper method to send push notifications in production
  // This would typically call your backend API which then sends via Expo's push service
  async sendPushNotificationToUser(userId: number, notification: NotificationData): Promise<void> {
    // In a real app, you would:
    // 1. Get the user's push token from your database
    // 2. Send the notification via your backend API
    // 3. Your backend would use Expo's push service to deliver the notification

    // For now, we'll just log what would be sent
    console.log(`📤 Would send push notification to user ${userId}:`, {
      title: notification.title,
      body: notification.body,
      data: notification.data,
      sound: 'default',
    });

    // For testing purposes, we'll send a local notification instead
    await this.sendLocalNotification(notification);
  }

  getPushToken(): string | null {
    return this.expoPushToken;
  }
}