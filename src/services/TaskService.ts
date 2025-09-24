import { Task, CreateTaskRequest } from '../types';
import apiClient, { ApiError } from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/api';
import { OfflineService } from './OfflineService';

export class TaskService {
  static async getAllTasks(): Promise<Task[]> {
    const cacheKey = 'tasks_all';

    try {
      const response = await apiClient.get<Task[]>(API_ENDPOINTS.TASKS.GET_ALL);
      const data = response.data || [];

      // Cache the data for offline use
      await OfflineService.cacheData(cacheKey, data);

      return data;
    } catch (error) {
      console.error('Error fetching all tasks:', error);

      // Try to get cached data when offline
      const cachedData = await OfflineService.getCachedData(cacheKey);
      if (cachedData) {
        console.log('Using cached tasks data');
        return cachedData;
      }

      throw error;
    }
  }

  static async getTasksAssignedTo(userId: number): Promise<Task[]> {
    try {
      const queryString = apiClient.buildQueryString({ assigned_to: userId });
      const response = await apiClient.get<Task[]>(`${API_ENDPOINTS.TASKS.GET_ALL}${queryString}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching assigned tasks:', error);
      throw error;
    }
  }

  static async getTasksCreatedBy(userId: number): Promise<Task[]> {
    try {
      const queryString = apiClient.buildQueryString({ created_by: userId });
      const response = await apiClient.get<Task[]>(`${API_ENDPOINTS.TASKS.GET_ALL}${queryString}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching created tasks:', error);
      throw error;
    }
  }

  static async createTask(createdBy: number, taskData: CreateTaskRequest): Promise<Task> {
    const isOnline = await OfflineService.isOnline();

    if (!isOnline) {
      // Queue for later sync
      await OfflineService.queueOfflineAction({
        type: 'CREATE',
        endpoint: API_ENDPOINTS.TASKS.CREATE,
        data: { ...taskData, created_by: createdBy }
      });

      // Return a temporary task for immediate UI update
      const tempId = Date.now();
      return {
        id: tempId,
        ...taskData,
        created_by: createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'pending'
      } as Task;
    }

    try {
      // Set current user for the API client
      console.log('📝 TaskService.createTask - Setting user ID:', createdBy);
      apiClient.setCurrentUserId(createdBy);
      console.log('🔧 API Client current user ID:', apiClient.getCurrentUserId());

      const response = await apiClient.post<Task>(API_ENDPOINTS.TASKS.CREATE, taskData);

      if (!response.data) {
        throw new Error('No task data returned from server');
      }

      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);

      // If request fails, queue for later sync
      await OfflineService.queueOfflineAction({
        type: 'CREATE',
        endpoint: API_ENDPOINTS.TASKS.CREATE,
        data: { ...taskData, created_by: createdBy }
      });

      throw error;
    }
  }

  static async completeTask(taskId: number): Promise<void> {
    try {
      const response = await apiClient.put(API_ENDPOINTS.TASKS.COMPLETE(taskId));

      if (!response.success) {
        throw new Error(response.error || 'Failed to complete task');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }


  static async deleteTask(taskId: number): Promise<void> {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.TASKS.DELETE(taskId));

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  static async reassignTask(taskId: number, newAssigneeId: number): Promise<void> {
    try {
      const response = await apiClient.put(API_ENDPOINTS.TASKS.REASSIGN(taskId), {
        new_assigned_to: newAssigneeId
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to reassign task');
      }
    } catch (error) {
      console.error('Error reassigning task:', error);
      throw error;
    }
  }

}