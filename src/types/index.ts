export interface FamilyMember {
  id: number;
  name: string;
  role: 'parent' | 'child' | 'member';
  avatar_color: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  created_by: number;
  assigned_to: number;
  status: 'pending' | 'completed' | 'disputed';
  task_type: 'one_time' | 'weekly';
  weekly_start_date?: string;
  weekly_end_date?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskDispute {
  id: number;
  task_id: number;
  disputed_by: number;
  reason: string;
  status: 'open' | 'resolved' | 'rejected';
  created_at: string;
  resolved_at?: string;
}

export interface SchoolSchedule {
  id: number;
  student_id: number;
  week_type: 'A' | 'B';
  day_of_week: number;
  subject: string;
  start_time: string;
  end_time: string;
  teacher?: string;
  classroom?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  location?: string;
  event_type: 'appointment' | 'reminder' | 'meeting';
  created_by: number;
  created_at: string;
  updated_at: string;
  participants: CalendarParticipant[];
}

export interface CalendarParticipant {
  id: number;
  event_id: number;
  member_id: number;
  response: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export interface NotificationToken {
  id: number;
  member_id: number;
  token: string;
  platform: 'ios' | 'android';
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  assigned_to: number;
  task_type: 'one_time' | 'weekly';
  weekly_start_date?: string;
  weekly_end_date?: string;
  due_date?: string;
}

export interface CreateCalendarEventRequest {
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  location?: string;
  event_type: 'appointment' | 'reminder' | 'meeting';
  participant_ids: number[];
}