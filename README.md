# BobiPlan - Family Task Management App

A private family app for managing tasks, schedules, and calendar events built with React Native and Expo.

## Features

### 👨‍👩‍👧‍👦 Family Members
- **Marko** (Parent)
- **Jasna** (Parent)
- **Anže** (Child)
- **David** (Child)
- **Filip** (Child)

### 📋 Task Management
- **Create & Assign Tasks**: Family members can create tasks and assign them to others
- **Task Types**: Support for one-time tasks and weekly recurring tasks
- **Task Status**: Pending, Completed, Disputed
- **Task Disputes**: Members can dispute assigned tasks with reasoning
- **Smart Reassignment**: Task creators can reassign or delete tasks
- **Weekly Task Automation**: Weekly tasks automatically create new instances when completed

### 📚 School Schedule (A/B Weeks)
- **Elementary School Support**: Designed for Slovenian elementary schools with A/B week schedules
- **Student Access**: Available for Anže, David, and Filip
- **Schedule Management**: Add, edit, and delete school subjects with times, teachers, and classrooms
- **Current Week Indicator**: Shows which week type (A or B) is currently active
- **Conflict Detection**: Prevents scheduling conflicts

### 📅 Family Calendar
- **Event Types**: Appointments, meetings, reminders
- **Multi-participant Events**: Invite multiple family members to events
- **Event Responses**: Accept/decline event invitations
- **Location Support**: Add location details to events
- **Event Management**: Edit and delete events
- **Smart Scheduling**: Conflict detection and availability checking

### 📱 Push Notifications
- **Task Notifications**: Get notified when tasks are assigned, completed, or disputed
- **Calendar Notifications**: Event invitations and reminders
- **Automatic Reminders**: 1-hour and 15-minute event reminders
- **Weekly Task Reminders**: Notifications for new weekly task cycles

## Technical Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **Notifications**: Expo Notifications
- **Database**: Designed for Supabase or MySQL with Node.js backend
- **Platform**: Optimized for iOS with TestFlight deployment

## Database Schema

The app uses a relational database with the following main tables:
- `family_members` - User profiles
- `tasks` - Task management
- `task_disputes` - Task dispute tracking
- `school_schedules` - A/B week school schedules
- `calendar_events` - Family calendar events
- `calendar_participants` - Event participant tracking
- `notification_tokens` - Push notification management

## Getting Started

### Backend Setup (Required First)

1. **Set up the MySQL + Node.js backend**:
   ```bash
   cd server
   npm install
   npm run setup
   ```

2. **Configure environment variables**:
   Edit `server/.env` with your MySQL credentials:
   ```bash
   DB_HOST=localhost
   DB_PASSWORD=your_mysql_password
   EXPO_ACCESS_TOKEN=your_expo_token
   ```

3. **Start the backend server**:
   ```bash
   npm run dev
   ```
   Server will run on http://localhost:3000

### React Native App Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Update API configuration**:
   Edit `src/config/api.ts` if your backend URL differs from http://localhost:3000

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Run on iOS simulator**:
   ```bash
   npm run ios
   ```

## Deployment

### TestFlight Deployment
1. Install EAS CLI: `npm install -g @expo/eas-cli`
2. Configure EAS: `eas build:configure`
3. Build for iOS: `eas build --platform ios --profile preview`
4. Submit to TestFlight: `eas submit --platform ios`

### Environment Setup
- Update `projectId` in `app.json` with your Expo project ID
- Configure push notification credentials
- Set up backend API endpoints for production

## Features in Slovenian

- **Naloge**: Create tasks like "Anže dodeli Davidu košnjo trave"
- **Ugovarjanje**: Members can "ugovoriti" against task assignments
- **Tedenski urnik**: A and B week schedules for elementary school
- **Družinski koledar**: Family calendar with appointments like dentist visits

## Privacy & Security

This is a private family app designed for internal use only. All data is contained within the family unit with no external sharing or social features.

## Support

For technical issues or feature requests, please contact the development team.
