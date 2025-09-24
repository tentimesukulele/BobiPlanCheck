import apiClient, { ApiError } from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/api';
import { OfflineService } from './OfflineService';

export interface Grade {
  id: number;
  student_id: number;
  subject: string;
  grade: number;
  description?: string;
  date_received: string;
  weight: number;
  teacher?: string;
  grade_type: 'test' | 'homework' | 'oral' | 'project' | 'other';
  semester: '1' | '2';
  school_year: string;
  added_by: number;
  created_at: string;
  updated_at: string;
  student_name?: string;
  added_by_name?: string;
}

export interface CreateGradeRequest {
  student_id: number;
  subject: string;
  grade: number;
  description?: string;
  date_received: string;
  weight?: number;
  teacher?: string;
  grade_type?: 'test' | 'homework' | 'oral' | 'project' | 'other';
  semester: '1' | '2';
  school_year: string;
}

export interface GradeStatistics {
  subject_averages: {
    subject: string;
    average: number;
    grade_count: number;
    total_weight: number;
  }[];
  overall_average: number;
  total_subjects: number;
}

export class GradesService {
  // Get grades for a specific student
  static async getGradesForStudent(
    studentId: number,
    filters?: {
      subject?: string;
      semester?: string;
      school_year?: string;
    }
  ): Promise<Grade[]> {
    // Validate studentId
    if (!studentId || isNaN(studentId) || studentId <= 0) {
      console.warn('Invalid student ID provided to getGradesForStudent:', studentId);
      return [];
    }

    const cacheKey = `grades_student_${studentId}_${JSON.stringify(filters || {})}`;

    try {
      const queryParams: any = { student_id: studentId };
      if (filters?.subject) queryParams.subject = filters.subject;
      if (filters?.semester) queryParams.semester = filters.semester;
      if (filters?.school_year) queryParams.school_year = filters.school_year;

      const queryString = apiClient.buildQueryString(queryParams);
      const response = await apiClient.get<Grade[]>(`${API_ENDPOINTS.GRADES.GET_ALL}${queryString}`);
      const data = response.data || [];

      // Cache the data for offline use
      await OfflineService.cacheData(cacheKey, data);

      return data;
    } catch (error) {
      console.error('Error fetching student grades:', error);

      // Try to get cached data when offline
      const cachedData = await OfflineService.getCachedData(cacheKey);
      if (cachedData) {
        console.log('Using cached grades data');
        return cachedData;
      }

      throw error;
    }
  }

  // Get all grades (for parents to see all children)
  static async getAllGrades(filters?: {
    semester?: string;
    school_year?: string;
  }): Promise<Grade[]> {
    const cacheKey = `grades_all_${JSON.stringify(filters || {})}`;

    try {
      const queryParams: any = {};
      if (filters?.semester) queryParams.semester = filters.semester;
      if (filters?.school_year) queryParams.school_year = filters.school_year;

      const queryString = apiClient.buildQueryString(queryParams);
      const response = await apiClient.get<Grade[]>(`${API_ENDPOINTS.GRADES.GET_ALL_STUDENTS}${queryString}`);
      const data = response.data || [];

      // Cache the data for offline use
      await OfflineService.cacheData(cacheKey, data);

      return data;
    } catch (error) {
      console.error('Error fetching all grades:', error);

      // Try to get cached data when offline
      const cachedData = await OfflineService.getCachedData(cacheKey);
      if (cachedData) {
        console.log('Using cached all grades data');
        return cachedData;
      }

      throw error;
    }
  }

  // Create a new grade
  static async createGrade(addedBy: number, gradeData: CreateGradeRequest): Promise<Grade> {
    const isOnline = await OfflineService.isOnline();

    if (!isOnline) {
      // Queue for later sync
      await OfflineService.queueOfflineAction({
        type: 'CREATE',
        endpoint: API_ENDPOINTS.GRADES.CREATE,
        data: { ...gradeData, added_by: addedBy }
      });

      // Return a temporary grade for immediate UI update
      const tempId = Date.now();
      return {
        id: tempId,
        ...gradeData,
        added_by: addedBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Grade;
    }

    try {
      // Set current user for the API client
      console.log('📝 GradesService.createGrade - Setting user ID:', addedBy);
      apiClient.setCurrentUserId(addedBy);
      console.log('🔧 API Client current user ID:', apiClient.getCurrentUserId());

      const response = await apiClient.post<Grade>(API_ENDPOINTS.GRADES.CREATE, gradeData);

      if (!response.data) {
        throw new Error('No grade data returned from server');
      }

      return response.data;
    } catch (error) {
      console.error('Error creating grade:', error);

      // If request fails, queue for later sync
      await OfflineService.queueOfflineAction({
        type: 'CREATE',
        endpoint: API_ENDPOINTS.GRADES.CREATE,
        data: { ...gradeData, added_by: addedBy }
      });

      throw error;
    }
  }

  // Update a grade
  static async updateGrade(gradeId: number, updateData: Partial<CreateGradeRequest>): Promise<Grade> {
    const isOnline = await OfflineService.isOnline();

    if (!isOnline) {
      // Queue for later sync
      await OfflineService.queueOfflineAction({
        type: 'UPDATE',
        endpoint: API_ENDPOINTS.GRADES.UPDATE(gradeId),
        data: updateData
      });

      // Return updated grade for immediate UI update (simplified)
      return {
        id: gradeId,
        ...updateData,
        updated_at: new Date().toISOString()
      } as Grade;
    }

    try {
      const response = await apiClient.put<Grade>(API_ENDPOINTS.GRADES.UPDATE(gradeId), updateData);

      if (!response.data) {
        throw new Error('No updated grade data returned from server');
      }

      return response.data;
    } catch (error) {
      console.error('Error updating grade:', error);

      // If request fails, queue for later sync
      await OfflineService.queueOfflineAction({
        type: 'UPDATE',
        endpoint: API_ENDPOINTS.GRADES.UPDATE(gradeId),
        data: updateData
      });

      throw error;
    }
  }

  // Delete a grade
  static async deleteGrade(gradeId: number): Promise<void> {
    const isOnline = await OfflineService.isOnline();

    if (!isOnline) {
      // Queue for later sync
      await OfflineService.queueOfflineAction({
        type: 'DELETE',
        endpoint: API_ENDPOINTS.GRADES.DELETE(gradeId),
        data: { id: gradeId }
      });
      return;
    }

    try {
      const response = await apiClient.delete(API_ENDPOINTS.GRADES.DELETE(gradeId));

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete grade');
      }
    } catch (error) {
      console.error('Error deleting grade:', error);

      // If request fails, queue for later sync
      await OfflineService.queueOfflineAction({
        type: 'DELETE',
        endpoint: API_ENDPOINTS.GRADES.DELETE(gradeId),
        data: { id: gradeId }
      });

      throw error;
    }
  }

  // Get grade statistics for a student
  static async getGradeStatistics(
    studentId: number,
    filters?: {
      semester?: string;
      school_year?: string;
    }
  ): Promise<GradeStatistics> {
    const cacheKey = `grade_stats_${studentId}_${JSON.stringify(filters || {})}`;

    try {
      const queryParams: any = {};
      if (filters?.semester) queryParams.semester = filters.semester;
      if (filters?.school_year) queryParams.school_year = filters.school_year;

      const queryString = apiClient.buildQueryString(queryParams);
      const response = await apiClient.get<GradeStatistics>(
        `${API_ENDPOINTS.GRADES.GET_STATS(studentId)}${queryString}`
      );
      const data = response.data || { subject_averages: [], overall_average: 0, total_subjects: 0 };

      // Cache the data for offline use
      await OfflineService.cacheData(cacheKey, data);

      return data;
    } catch (error) {
      console.error('Error fetching grade statistics:', error);

      // Try to get cached data when offline
      const cachedData = await OfflineService.getCachedData(cacheKey);
      if (cachedData) {
        console.log('Using cached grade statistics');
        return cachedData;
      }

      throw error;
    }
  }

  // Helper method to get current school year
  static getCurrentSchoolYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 0-based to 1-based

    // School year starts in September
    if (month >= 9) {
      return `${year}/${year + 1}`;
    } else {
      return `${year - 1}/${year}`;
    }
  }

  // Helper method to get current semester
  static getCurrentSemester(): '1' | '2' {
    const now = new Date();
    const month = now.getMonth() + 1; // 0-based to 1-based

    // First semester: September to January
    // Second semester: February to June
    if (month >= 9 || month <= 1) {
      return '1';
    } else {
      return '2';
    }
  }

  // Get grades for current semester and school year
  static async getCurrentGrades(studentId: number): Promise<Grade[]> {
    return this.getGradesForStudent(studentId, {
      semester: this.getCurrentSemester(),
      school_year: this.getCurrentSchoolYear()
    });
  }

  // Calculate subject average from grades array
  static calculateSubjectAverage(grades: Grade[], subject: string): number {
    const subjectGrades = grades.filter(grade => grade.subject === subject);
    if (subjectGrades.length === 0) return 0;

    const weightedSum = subjectGrades.reduce((sum, grade) => sum + (grade.grade * grade.weight), 0);
    const totalWeight = subjectGrades.reduce((sum, grade) => sum + grade.weight, 0);

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  // Calculate overall average from grades array
  static calculateOverallAverage(grades: Grade[]): number {
    const subjects = [...new Set(grades.map(grade => grade.subject))];
    if (subjects.length === 0) return 0;

    const averages = subjects.map(subject => this.calculateSubjectAverage(grades, subject));
    return averages.reduce((sum, avg) => sum + avg, 0) / averages.length;
  }
}