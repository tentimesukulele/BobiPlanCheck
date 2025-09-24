import { SchoolSchedule } from '../types';
import apiClient, { ApiError } from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/api';
import { OfflineService } from './OfflineService';

interface CreateScheduleRequest {
  student_id: number;
  week_type: 'A' | 'B';
  day_of_week: number;
  subject: string;
  start_time: string;
  end_time: string;
  teacher?: string;
  classroom?: string;
}

export class ScheduleService {
  static async getScheduleForStudent(studentId: number): Promise<SchoolSchedule[]> {
    const cacheKey = `schedule_student_${studentId}`;

    try {
      const response = await apiClient.get<SchoolSchedule[]>(API_ENDPOINTS.SCHEDULE.GET_BY_STUDENT(studentId));
      const data = response.data || [];

      // Cache the data for offline use
      await OfflineService.cacheData(cacheKey, data);

      return data;
    } catch (error) {
      console.error('Error fetching student schedule:', error);

      // Try to get cached data when offline
      const cachedData = await OfflineService.getCachedData(cacheKey);
      if (cachedData) {
        console.log('Using cached schedule data');
        return cachedData;
      }

      throw error;
    }
  }

  static async createScheduleItem(currentUserId: number, scheduleData: CreateScheduleRequest): Promise<SchoolSchedule> {
    const isOnline = await OfflineService.isOnline();

    if (!isOnline) {
      // Queue for later sync
      await OfflineService.queueOfflineAction({
        type: 'CREATE',
        endpoint: API_ENDPOINTS.SCHEDULE.CREATE,
        data: scheduleData
      });

      // Return a temporary schedule item for immediate UI update
      const tempId = Date.now();
      return {
        id: tempId,
        ...scheduleData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as SchoolSchedule;
    }

    try {
      // Set current user for the API client
      console.log('📝 ScheduleService.createScheduleItem - Setting user ID:', currentUserId);
      apiClient.setCurrentUserId(currentUserId);
      console.log('🔧 API Client current user ID:', apiClient.getCurrentUserId());

      const response = await apiClient.post<SchoolSchedule>(API_ENDPOINTS.SCHEDULE.CREATE, scheduleData);

      if (!response.data) {
        throw new Error('No schedule data returned from server');
      }

      return response.data;
    } catch (error) {
      console.error('Error creating schedule item:', error);

      // If request fails, queue for later sync
      await OfflineService.queueOfflineAction({
        type: 'CREATE',
        endpoint: API_ENDPOINTS.SCHEDULE.CREATE,
        data: scheduleData
      });

      throw error;
    }
  }

  static async deleteScheduleItem(scheduleId: number): Promise<void> {
    const isOnline = await OfflineService.isOnline();

    if (!isOnline) {
      // Queue for later sync
      await OfflineService.queueOfflineAction({
        type: 'DELETE',
        endpoint: API_ENDPOINTS.SCHEDULE.DELETE(scheduleId),
        data: { id: scheduleId }
      });
      return;
    }

    try {
      const response = await apiClient.delete(API_ENDPOINTS.SCHEDULE.DELETE(scheduleId));

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete schedule item');
      }
    } catch (error) {
      console.error('Error deleting schedule item:', error);

      // If request fails, queue for later sync
      await OfflineService.queueOfflineAction({
        type: 'DELETE',
        endpoint: API_ENDPOINTS.SCHEDULE.DELETE(scheduleId),
        data: { id: scheduleId }
      });

      throw error;
    }
  }

  static async updateScheduleItem(scheduleId: number, updateData: Partial<CreateScheduleRequest>): Promise<SchoolSchedule> {
    try {
      const response = await apiClient.put<SchoolSchedule>(API_ENDPOINTS.SCHEDULE.UPDATE(scheduleId), updateData);

      if (!response.data) {
        throw new Error('No updated schedule data returned from server');
      }

      return response.data;
    } catch (error) {
      console.error('Error updating schedule item:', error);
      throw error;
    }
  }

  static async getScheduleForWeek(studentId: number, weekType: 'A' | 'B'): Promise<SchoolSchedule[]> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.SCHEDULE.GET_WEEK(studentId, weekType));
      // The server returns grouped schedule data, extract the schedule array
      return response.data?.schedule ? Object.values(response.data.schedule).flatMap((day: any) => day.subjects) : [];
    } catch (error) {
      console.error('Error fetching weekly schedule:', error);
      throw error;
    }
  }

  static async getAllStudentSchedules(): Promise<SchoolSchedule[]> {
    try {
      const response = await apiClient.get<SchoolSchedule[]>(API_ENDPOINTS.SCHEDULE.GET_ALL);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching all schedules:', error);
      throw error;
    }
  }


  // Helper method to get current week type based on school calendar
  static async getCurrentWeekType(): Promise<'A' | 'B'> {
    try {
      const response = await apiClient.get<{ current_week_type: 'A' | 'B' }>(API_ENDPOINTS.SCHEDULE.GET_CURRENT_WEEK);
      return response.data?.current_week_type || 'A';
    } catch (error) {
      console.error('Error fetching current week type:', error);
      // Fallback to client-side calculation
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 8, 1); // September 1st
      const weekNumber = Math.ceil((now.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return weekNumber % 2 === 1 ? 'A' : 'B';
    }
  }

  // Helper method to get schedule for a specific date
  static async getScheduleForDate(studentId: number, date: Date): Promise<SchoolSchedule[]> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.SCHEDULE.GET_TODAY(studentId));
      return response.data?.schedule || [];
    } catch (error) {
      console.error('Error fetching schedule for date:', error);
      throw error;
    }
  }
}