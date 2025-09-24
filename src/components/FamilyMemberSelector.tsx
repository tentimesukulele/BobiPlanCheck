import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { FamilyMember } from '../types';
import { UserService } from '../services/UserService';

const FAMILY_MEMBERS: FamilyMember[] = [
  { id: 1, name: 'Marko', role: 'parent', avatar_color: '#007AFF', created_at: '', updated_at: '' },
  { id: 2, name: 'Jasna', role: 'parent', avatar_color: '#FF3B30', created_at: '', updated_at: '' },
  { id: 3, name: 'Anže', role: 'child', avatar_color: '#34C759', created_at: '', updated_at: '' },
  { id: 4, name: 'David', role: 'child', avatar_color: '#FF9500', created_at: '', updated_at: '' },
  { id: 5, name: 'Filip', role: 'child', avatar_color: '#AF52DE', created_at: '', updated_at: '' },
];

export function FamilyMemberSelector() {
  const router = useRouter();

  const handleMemberSelect = async (member: FamilyMember) => {
    try {
      // Save user to AsyncStorage
      await UserService.saveUser({
        id: member.id,
        name: member.name,
        role: member.role
      });

      console.log('👤 User saved and navigating to dashboard:', member);

      // Navigate to dashboard
      router.push(`/dashboard?userId=${member.id}&userName=${member.name}`);
    } catch (error) {
      console.error('Error saving user:', error);
      Alert.alert('Napaka', 'Napaka pri shranjevanju uporabnika');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kdo si?</Text>
      <Text style={styles.subtitle}>Izberi družinskega člana</Text>

      <View style={styles.membersContainer}>
        {FAMILY_MEMBERS.map((member) => (
          <TouchableOpacity
            key={member.id}
            style={[styles.memberButton, { borderColor: member.avatar_color }]}
            onPress={() => handleMemberSelect(member)}
          >
            <View style={[styles.avatar, { backgroundColor: member.avatar_color }]}>
              <Text style={styles.avatarText}>{member.name[0]}</Text>
            </View>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberRole}>
              {member.role === 'parent' ? 'Starš' : 'Otrok'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  membersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },
  memberButton: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 3,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 120,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  memberRole: {
    fontSize: 14,
    color: '#666',
  },
});