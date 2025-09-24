import { CalendarEvent, CalendarParticipant, CreateCalendarEventRequest } from '../types';
import apiClient, { ApiError } from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/api';


export class CalendarService {
  static async getAllEvents(): Promise<CalendarEvent[]> {
    try {
      const response = await apiClient.get<CalendarEvent[]>(API_ENDPOINTS.CALENDAR.GET_ALL);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching all events:', error);
      throw error;
    }
  }

  static async getUpcomingEvents(): Promise<CalendarEvent[]> {
    try {
      const queryString = apiClient.buildQueryString({ upcoming_only: true });
      const response = await apiClient.get<CalendarEvent[]>(`${API_ENDPOINTS.CALENDAR.GET_ALL}${queryString}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      throw error;
    }
  }

  static async getEventsForMember(memberId: number): Promise<CalendarEvent[]> {
    try {
      const queryString = apiClient.buildQueryString({ member_id: memberId });
      const response = await apiClient.get<CalendarEvent[]>(`${API_ENDPOINTS.CALENDAR.GET_ALL}${queryString}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching member events:', error);
      throw error;
    }
  }

  static async getEventsCreatedBy(memberId: number): Promise<CalendarEvent[]> {
    try {
      const queryString = apiClient.buildQueryString({ created_by: memberId });
      const response = await apiClient.get<CalendarEvent[]>(`${API_ENDPOINTS.CALENDAR.GET_ALL}${queryString}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching created events:', error);
      throw error;
    }
  }

  static async createEvent(createdBy: number, eventData: CreateCalendarEventRequest): Promise<CalendarEvent> {
    try {
      // Set current user for the API client
      console.log('📝 CalendarService.createEvent - Setting user ID:', createdBy);
      apiClient.setCurrentUserId(createdBy);
      console.log('🔧 API Client current user ID:', apiClient.getCurrentUserId());

      const response = await apiClient.post<CalendarEvent>(API_ENDPOINTS.CALENDAR.CREATE, eventData);

      if (!response.data) {
        throw new Error('No event data returned from server');
      }

      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  static async deleteEvent(eventId: number): Promise<void> {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.CALENDAR.DELETE(eventId));

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  static async respondToEvent(eventId: number, memberId: number, response: 'accepted' | 'declined'): Promise<void> {
    try {
      // Set current user for the API client
      apiClient.setCurrentUserId(memberId);

      const apiResponse = await apiClient.put(API_ENDPOINTS.CALENDAR.RESPOND(eventId), { response });

      if (!apiResponse.success) {
        throw new Error(apiResponse.error || 'Failed to respond to event');
      }
    } catch (error) {
      console.error('Error responding to event:', error);
      throw error;
    }
  }

  static async updateEvent(eventId: number, updateData: Partial<CreateCalendarEventRequest>): Promise<CalendarEvent> {
    try {
      const response = await apiClient.put<CalendarEvent>(API_ENDPOINTS.CALENDAR.UPDATE(eventId), updateData);

      if (!response.data) {
        throw new Error('No updated event data returned from server');
      }

      return response.data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  static async getEventsForDateRange(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      const queryString = apiClient.buildQueryString({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });
      const response = await apiClient.get<CalendarEvent[]>(`${API_ENDPOINTS.CALENDAR.GET_ALL}${queryString}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching events for date range:', error);
      throw error;
    }
  }

  static async getEventsForDate(date: Date): Promise<CalendarEvent[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getEventsForDateRange(startOfDay, endOfDay);
  }

  static async getTodaysEvents(): Promise<CalendarEvent[]> {
    return this.getEventsForDate(new Date());
  }

  static async getConflictingEvents(
    memberId: number,
    startTime: string,
    endTime: string,
    excludeEventId?: number
  ): Promise<CalendarEvent[]> {
    try {
      // This would need a specific endpoint on the server for conflict checking
      const queryString = apiClient.buildQueryString({
        member_id: memberId,
        start_time: startTime,
        end_time: endTime,
        exclude_event_id: excludeEventId
      });
      const response = await apiClient.get<CalendarEvent[]>(`${API_ENDPOINTS.CALENDAR.GET_ALL}/conflicts${queryString}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching conflicting events:', error);
      throw error;
    }
  }

  // Helper method to check if member is available at a specific time
  static async isMemberAvailable(
    memberId: number,
    startTime: string,
    endTime: string,
    excludeEventId?: number
  ): Promise<boolean> {
    const conflicts = await this.getConflictingEvents(memberId, startTime, endTime, excludeEventId);
    return conflicts.length === 0;
  }

  // Get upcoming events for member (next 7 days)
  static async getUpcomingEventsForMember(memberId: number, days: number = 7): Promise<CalendarEvent[]> {
    try {
      const queryString = apiClient.buildQueryString({ member_id: memberId });
      const response = await apiClient.get<CalendarEvent[]>(`${API_ENDPOINTS.CALENDAR.GET_UPCOMING(days)}${queryString}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching upcoming events for member:', error);
      throw error;
    }
  }
}