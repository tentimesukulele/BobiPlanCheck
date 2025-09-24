import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { CalendarEvent, FamilyMember } from '../types';
import { CalendarService } from '../services/CalendarService';
import { CreateEventModal } from './CreateEventModal';

const FAMILY_MEMBERS: FamilyMember[] = [
  { id: 1, name: 'Marko', role: 'parent', avatar_color: '#007AFF', created_at: '', updated_at: '' },
  { id: 2, name: 'Jasna', role: 'parent', avatar_color: '#FF3B30', created_at: '', updated_at: '' },
  { id: 3, name: 'Anže', role: 'child', avatar_color: '#34C759', created_at: '', updated_at: '' },
  { id: 4, name: 'David', role: 'child', avatar_color: '#FF9500', created_at: '', updated_at: '' },
  { id: 5, name: 'Filip', role: 'child', avatar_color: '#AF52DE', created_at: '', updated_at: '' },
];

interface FamilyCalendarProps {
  currentUserId: number;
}

type CalendarFilter = 'upcoming' | 'all' | 'my_events';

export function FamilyCalendar({ currentUserId }: FamilyCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filter, setFilter] = useState<CalendarFilter>('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Debug logging
  console.log('🎯 FamilyCalendar - currentUserId received:', currentUserId);

  useEffect(() => {
    loadEvents();
  }, [filter, currentUserId]);

  const loadEvents = async () => {
    try {
      let loadedEvents: CalendarEvent[];
      switch (filter) {
        case 'upcoming':
          loadedEvents = await CalendarService.getUpcomingEvents();
          break;
        case 'my_events':
          loadedEvents = await CalendarService.getEventsForMember(currentUserId);
          break;
        default:
          loadedEvents = await CalendarService.getAllEvents();
      }
      setEvents(loadedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleDeleteEvent = (eventId: number) => {
    Alert.alert(
      'Izbriši dogodek',
      'Ali si prepričan, da želiš izbrisati ta dogodek?',
      [
        { text: 'Prekliči', style: 'cancel' },
        {
          text: 'Izbriši',
          style: 'destructive',
          onPress: async () => {
            try {
              await CalendarService.deleteEvent(eventId);
              loadEvents();
            } catch (error) {
              Alert.alert('Napaka', 'Napaka pri brisanju dogodka');
            }
          },
        },
      ]
    );
  };

  const handleEventResponse = async (eventId: number, response: 'accepted' | 'declined') => {
    try {
      await CalendarService.respondToEvent(eventId, currentUserId, response);
      loadEvents();
    } catch (error) {
      Alert.alert('Napaka', 'Napaka pri odgovoru na dogodek');
    }
  };

  const getMemberName = (memberId: number): string => {
    const member = FAMILY_MEMBERS.find(m => m.id === memberId);
    return member?.name || 'Neznan';
  };

  const getMemberColor = (memberId: number): string => {
    const member = FAMILY_MEMBERS.find(m => m.id === memberId);
    return member?.avatar_color || '#007AFF';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sl-SI', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('sl-SI', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventTypeIcon = (eventType: string): string => {
    switch (eventType) {
      case 'appointment': return '🏥';
      case 'meeting': return '👥';
      case 'reminder': return '⏰';
      default: return '📅';
    }
  };

  const getEventTypeText = (eventType: string): string => {
    switch (eventType) {
      case 'appointment': return 'Termin';
      case 'meeting': return 'Sestanek';
      case 'reminder': return 'Opomnik';
      default: return 'Dogodek';
    }
  };

  const isUpcoming = (dateString: string): boolean => {
    return new Date(dateString) > new Date();
  };

  const renderEvent = ({ item: event }: { item: CalendarEvent }) => {
    const isEventCreator = event.created_by === currentUserId;
    const myParticipation = event.participants.find(p => p.member_id === currentUserId);
    const canRespond = myParticipation && myParticipation.response === 'pending' && isUpcoming(event.start_time);
    const canDelete = isEventCreator;

    return (
      <View style={[styles.eventCard, !isUpcoming(event.start_time) && styles.pastEvent]}>
        <View style={styles.eventHeader}>
          <View style={styles.eventTitleContainer}>
            <Text style={styles.eventIcon}>{getEventTypeIcon(event.event_type)}</Text>
            <View>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventType}>{getEventTypeText(event.event_type)}</Text>
            </View>
          </View>
          {canDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteEvent(event.id)}
            >
              <Text style={styles.deleteButtonText}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {event.description && (
          <Text style={styles.eventDescription}>{event.description}</Text>
        )}

        <View style={styles.eventDetails}>
          <Text style={styles.eventDate}>
            📅 {formatDate(event.start_time)}
          </Text>
          <Text style={styles.eventTime}>
            🕐 {formatTime(event.start_time)}
            {event.end_time && ` - ${formatTime(event.end_time)}`}
          </Text>
          {event.location && (
            <Text style={styles.eventLocation}>📍 {event.location}</Text>
          )}
        </View>

        <View style={styles.participantsSection}>
          <Text style={styles.participantsTitle}>Udeleženci:</Text>
          <View style={styles.participantsList}>
            {event.participants.map((participant, index) => (
              <View key={`${event.id}-${participant.member_id}-${index}`} style={styles.participant}>
                <View
                  style={[
                    styles.participantDot,
                    { backgroundColor: getMemberColor(participant.member_id) }
                  ]}
                />
                <Text style={styles.participantName}>
                  {getMemberName(participant.member_id)}
                </Text>
                <Text
                  style={[
                    styles.participantResponse,
                    { color: getResponseColor(participant.response) }
                  ]}
                >
                  {getResponseText(participant.response)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {canRespond && (
          <View style={styles.responseButtons}>
            <TouchableOpacity
              style={[styles.responseButton, styles.acceptButton]}
              onPress={() => handleEventResponse(event.id, 'accepted')}
            >
              <Text style={styles.responseButtonText}>Sprejmem</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.responseButton, styles.declineButton]}
              onPress={() => handleEventResponse(event.id, 'declined')}
            >
              <Text style={styles.responseButtonText}>Zavrnjem</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.eventFooter}>
          <View style={[styles.creatorDot, { backgroundColor: getMemberColor(event.created_by) }]} />
          <Text style={styles.creatorText}>
            Ustvaril: {getMemberName(event.created_by)}
          </Text>
        </View>
      </View>
    );
  };

  const getResponseColor = (response: string): string => {
    switch (response) {
      case 'accepted': return '#34C759';
      case 'declined': return '#FF3B30';
      default: return '#FF9500';
    }
  };

  const getResponseText = (response: string): string => {
    switch (response) {
      case 'accepted': return '✓';
      case 'declined': return '✗';
      default: return '?';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Družinski koledar</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>+ Dogodek</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'upcoming' && styles.activeFilter]}
          onPress={() => setFilter('upcoming')}
        >
          <Text style={[styles.filterText, filter === 'upcoming' && styles.activeFilterText]}>
            Prihaja
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'my_events' && styles.activeFilter]}
          onPress={() => setFilter('my_events')}
        >
          <Text style={[styles.filterText, filter === 'my_events' && styles.activeFilterText]}>
            Moji
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            Vsi
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.eventsList}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>Ni dogodkov za prikaz</Text>
        )}
      />

      <CreateEventModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        currentUserId={currentUserId}
        onEventCreated={loadEvents}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
    fontWeight: '600',
  },
  eventsList: {
    flexGrow: 1,
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pastEvent: {
    opacity: 0.7,
    backgroundColor: '#f8f8f8',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  eventType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  eventDetails: {
    marginBottom: 16,
  },
  eventDate: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: '#333',
  },
  participantsSection: {
    marginBottom: 16,
  },
  participantsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  participantsList: {
    gap: 6,
  },
  participant: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  participantName: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  participantResponse: {
    fontSize: 14,
    fontWeight: '600',
  },
  responseButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  responseButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  declineButton: {
    backgroundColor: '#FF3B30',
  },
  responseButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  creatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  creatorText: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 40,
  },
});