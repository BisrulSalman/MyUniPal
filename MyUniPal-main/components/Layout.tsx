import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface HeaderProps {
  title: string;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onBack }) => {
  return (
    <View style={styles.header}>
      {onBack && (
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
      )}
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
};

export const AppContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#0f172a',
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    top: 64,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: '#eff6ff',
  },
});
