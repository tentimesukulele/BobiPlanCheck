import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_STORAGE_KEY = '@BobiPlan:currentUser';

export interface CurrentUser {
  id: number;
  name: string;
  role: 'parent' | 'child';
}

export class UserService {
  private static currentUser: CurrentUser | null = null;

  // Save user to AsyncStorage
  static async saveUser(user: CurrentUser): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      this.currentUser = user;
      console.log('👤 User saved to storage:', user);
    } catch (error) {
      console.error('Error saving user to storage:', error);
      throw error;
    }
  }

  // Load user from AsyncStorage
  static async loadUser(): Promise<CurrentUser | null> {
    try {
      const userString = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userString) {
        const user = JSON.parse(userString);
        this.currentUser = user;
        console.log('👤 User loaded from storage:', user);
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error loading user from storage:', error);
      return null;
    }
  }

  // Get current user (from memory or storage)
  static async getCurrentUser(): Promise<CurrentUser | null> {
    if (this.currentUser) {
      return this.currentUser;
    }
    return await this.loadUser();
  }

  // Get current user ID (with fallback)
  static async getCurrentUserId(): Promise<number> {
    const user = await this.getCurrentUser();
    return user?.id || 1; // Default to user 1 (Marko) if no user found
  }

  // Clear user (logout)
  static async clearUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      this.currentUser = null;
      console.log('👤 User cleared from storage');
    } catch (error) {
      console.error('Error clearing user from storage:', error);
      throw error;
    }
  }

  // Check if user is logged in
  static async isLoggedIn(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  // Set user in memory (without saving to storage)
  static setCurrentUser(user: CurrentUser): void {
    this.currentUser = user;
  }

  // Get user by ID (static family member data)
  static getUserById(id: number): CurrentUser | null {
    const familyMembers = [
      { id: 1, name: 'Marko', role: 'parent' as const },
      { id: 2, name: 'Jasna', role: 'parent' as const },
      { id: 3, name: 'Anže', role: 'child' as const },
      { id: 4, name: 'David', role: 'child' as const },
      { id: 5, name: 'Filip', role: 'child' as const },
    ];

    return familyMembers.find(member => member.id === id) || null;
  }

  // Initialize user service (call on app startup)
  static async initialize(): Promise<CurrentUser | null> {
    try {
      const user = await this.loadUser();
      if (user) {
        console.log('👤 UserService initialized with user:', user);
      } else {
        console.log('👤 UserService initialized - no saved user');
      }
      return user;
    } catch (error) {
      console.error('Error initializing UserService:', error);
      return null;
    }
  }
}