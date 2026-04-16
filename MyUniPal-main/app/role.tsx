import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Header } from '../components/Layout';
import { auth } from '../database/config';
import { validateAdminCode } from '../services/adminService';
import { setUserRoleAndFaculty } from '../services/userService';

export default function RoleSelect() {
  const router = useRouter();

  const [adminModal, setAdminModal] = useState(false);
  const [code, setCode] = useState('');
  const [triesLeft, setTriesLeft] = useState(3);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const chooseCommunity = async () => {
    const user = auth.currentUser;
    if (!user) return alert('Please login again');
    await setUserRoleAndFaculty(user.uid, 'community');
    router.replace('./community');
  };

  const openAdmin = () => {
    setError('');
    setCode('');
    setTriesLeft(3);
    setAdminModal(true);
  };

  const checkAdminCode = async () => {
    const user = auth.currentUser;
    if (!user) return alert('Please login again');

    if (!code.trim()) {
      setError('Enter admin code');
      return;
    }

    try {
      setChecking(true);
      setError('');
console.log("1) validating code...");
      const result = await validateAdminCode(code.trim());
console.log("validate result:", result);

      if (!result.ok) {
        const next = triesLeft - 1;
        setTriesLeft(next);
        setError(next > 0 ? `Incorrect code. Tries left: ${next}` : 'Too many attempts. Try again later.');
        if (next <= 0) setAdminModal(false);
        return;
      }
console.log("2) saving role + faculty...");
      // Valid code -> save role + faculty
      await setUserRoleAndFaculty(user.uid, 'admin', result.faculty);
      setAdminModal(false);
      router.replace('./admin');

    } catch (e: any) {
      console.log("ADMIN ERROR:", e);
      setError(e.message ?? 'Failed to verify code');
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="MyUniPal" />

      <View style={styles.body}>
        <Text style={styles.subtitle}>Select your role</Text>

        <Pressable style={styles.roleBtn} onPress={chooseCommunity}>
          <Ionicons name="people" size={48} color="#0f172a" />
          <Text style={styles.roleText}>Community</Text>
        </Pressable>

        <Pressable style={styles.roleBtn} onPress={openAdmin}>
          <Ionicons name="laptop" size={48} color="#0f172a" />
          <Text style={styles.roleText}>Admin</Text>
        </Pressable>
      </View>

      {/* Admin code modal */}
      <Modal visible={adminModal} transparent animationType="fade" onRequestClose={() => setAdminModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Enter Admin Code</Text>

            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="e.g., FAS_UoV"
              style={styles.modalInput}
              autoCapitalize="none"
            />

            {!!error && <Text style={styles.error}>{error}</Text>}

            <Pressable style={styles.modalBtn} onPress={checkAdminCode} disabled={checking}>
              <Text style={styles.modalBtnText}>{checking ? 'Checking...' : 'Verify'}</Text>
            </Pressable>

            <Pressable onPress={() => setAdminModal(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>

            <Text style={styles.tryInfo}>Tries left: {triesLeft}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c8d2ea',
  },
  subtitle: {
    fontWeight: '700',
    fontSize: 18,
    color: '#94a3b8',
    marginBottom: 40,
  },
  roleBtn: {
    alignItems: 'center',
    marginBottom: 40,
  },
  roleText: {
    backgroundColor: '#0f172a',
    color: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
    fontWeight: '700',
    marginTop: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#0f172a',
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalBtn: {
    marginTop: 14,
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  cancel: {
    marginTop: 12,
    textAlign: 'center',
    color: '#64748b',
    fontWeight: '600',
  },
  error: {
    marginTop: 10,
    color: '#ef4444',
    fontWeight: '600',
  },
  tryInfo: {
    marginTop: 10,
    textAlign: 'center',
    color: '#94a3b8',
  },
});
