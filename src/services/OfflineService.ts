import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  data: any;
  timestamp: number;
}

export class OfflineService {
  private static readonly OFFLINE_ACTIONS_KEY = 'offline_actions';
  private static readonly CACHED_DATA_PREFIX = 'cached_data_';
  private static listeners: Array<(isOnline: boolean) => void> = [];

  static async initialize() {
    NetInfo.addEventListener(state => {
      const isOnline = state.isConnected && state.isInternetReachable;
      this.listeners.forEach(listener => listener(!!isOnline));

      if (isOnline) {
        this.syncOfflineActions();
      }
    });
  }

  static addNetworkListener(listener: (isOnline: boolean) => void) {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  static async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return !!(state.isConnected && state.isInternetReachable);
  }

  // Cache data locally
  static async cacheData(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${this.CACHED_DATA_PREFIX}${key}`,
        JSON.stringify({
          data,
          timestamp: Date.now()
        })
      );
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  // Get cached data
  static async getCachedData(key: string): Promise<any | null> {
    try {
      const cached = await AsyncStorage.getItem(`${this.CACHED_DATA_PREFIX}${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Return cached data regardless of age when offline
        const isOnline = await this.isOnline();
        if (!isOnline || Date.now() - timestamp < 30 * 60 * 1000) { // 30 minutes cache
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  // Queue offline action
  static async queueOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp'>): Promise<void> {
    try {
      const offlineAction: OfflineAction = {
        ...action,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now()
      };

      const existingActions = await this.getOfflineActions();
      const updatedActions = [...existingActions, offlineAction];

      await AsyncStorage.setItem(
        this.OFFLINE_ACTIONS_KEY,
        JSON.stringify(updatedActions)
      );
    } catch (error) {
      console.error('Error queuing offline action:', error);
    }
  }

  // Get all offline actions
  static async getOfflineActions(): Promise<OfflineAction[]> {
    try {
      const actions = await AsyncStorage.getItem(this.OFFLINE_ACTIONS_KEY);
      return actions ? JSON.parse(actions) : [];
    } catch (error) {
      console.error('Error getting offline actions:', error);
      return [];
    }
  }

  // Clear offline actions
  static async clearOfflineActions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.OFFLINE_ACTIONS_KEY);
    } catch (error) {
      console.error('Error clearing offline actions:', error);
    }
  }

  // Sync offline actions when online
  static async syncOfflineActions(): Promise<void> {
    try {
      const actions = await this.getOfflineActions();
      if (actions.length === 0) return;

      console.log(`Syncing ${actions.length} offline actions...`);

      for (const action of actions) {
        try {
          await this.executeAction(action);
          console.log(`Synced action: ${action.type} ${action.endpoint}`);
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
          // Could implement retry logic here
        }
      }

      // Clear all actions after successful sync
      await this.clearOfflineActions();
      console.log('Offline actions synced successfully');
    } catch (error) {
      console.error('Error syncing offline actions:', error);
    }
  }

  // Execute a single action
  private static async executeAction(action: OfflineAction): Promise<void> {
    const baseUrl = 'http://bobeki.anglezko.eu'; // Replace with your server URL

    const options: RequestInit = {
      method: action.type === 'DELETE' ? 'DELETE' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (action.type !== 'DELETE') {
      options.body = JSON.stringify(action.data);
    }

    const response = await fetch(`${baseUrl}${action.endpoint}`, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  // Clear all cached data (useful for logout)
  static async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHED_DATA_PREFIX));
      await AsyncStorage.multiRemove([...cacheKeys, this.OFFLINE_ACTIONS_KEY]);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}