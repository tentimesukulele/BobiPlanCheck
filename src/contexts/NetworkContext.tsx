import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OfflineService } from '../services/OfflineService';

interface NetworkContextType {
  isOnline: boolean;
  pendingActionsCount: number;
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: true,
  pendingActionsCount: 0,
});

export const useNetwork = () => useContext(NetworkContext);

interface NetworkProviderProps {
  children: React.ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActionsCount, setPendingActionsCount] = useState(0);

  useEffect(() => {
    // Initialize offline service
    OfflineService.initialize();

    // Listen for network changes
    const unsubscribe = OfflineService.addNetworkListener((online) => {
      setIsOnline(online);
      if (online) {
        updatePendingActionsCount();
      }
    });

    // Update pending actions count
    updatePendingActionsCount();

    return unsubscribe;
  }, []);

  const updatePendingActionsCount = async () => {
    try {
      const actions = await OfflineService.getOfflineActions();
      setPendingActionsCount(actions.length);
    } catch (error) {
      console.error('Error updating pending actions count:', error);
    }
  };

  return (
    <NetworkContext.Provider value={{ isOnline, pendingActionsCount }}>
      {children}
      {!isOnline && (
        <View style={styles.offlineBar}>
          <Text style={styles.offlineText}>
            📱 Offline mode - {pendingActionsCount} pending actions
          </Text>
        </View>
      )}
      {isOnline && pendingActionsCount > 0 && (
        <View style={styles.syncingBar}>
          <Text style={styles.syncingText}>
            ⏫ Syncing {pendingActionsCount} actions...
          </Text>
        </View>
      )}
    </NetworkContext.Provider>
  );
};

const styles = StyleSheet.create({
  offlineBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF6B47',
    paddingVertical: 8,
    paddingHorizontal: 16,
    paddingTop: 50, // Account for status bar
    zIndex: 1000,
  },
  offlineText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  syncingBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#34C759',
    paddingVertical: 8,
    paddingHorizontal: 16,
    paddingTop: 50, // Account for status bar
    zIndex: 1000,
  },
  syncingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});