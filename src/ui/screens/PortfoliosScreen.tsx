import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useStore } from '../../store/store';
import { PortfolioCard } from '../components/PortfolioCard';
import { Sidebar } from '../components/Sidebar';
import { theme } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Feather } from '@expo/vector-icons';

type PortfoliosScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Portfolios'>;

export const PortfoliosScreen = () => {
  const { portfolios, addPortfolio, editPortfolio } = useStore();
  const navigation = useNavigation<PortfoliosScreenNavigationProp>();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setModalVisible(true);
  };

  const openEditModal = (p: any) => {
    setEditingId(p.id!);
    setName(p.name);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (name.trim()) {
      if (editingId) {
        editPortfolio(editingId, name.trim());
      } else {
        addPortfolio(name.trim());
      }
      setName('');
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.appHeader}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={() => setSidebarOpen(true)}>
          <Feather name="menu" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.appTitle}>MoneyTracker</Text>
        <View style={{ width: 38 }} />
      </View>

      <FlatList
        data={portfolios}
        keyExtractor={p => p.id!.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <PortfolioCard 
            portfolio={item} 
            onPress={() => navigation.navigate('PortfolioDetail', { portfolioId: item.id!, portfolioName: item.name })}
            onEdit={() => openEditModal(item)}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No portfolios yet. Create one!</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Portfolio' : 'Create Portfolio'}</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Retirement, Tech Growth" 
              placeholderTextColor={theme.colors.textMuted}
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
              <Text style={styles.submitBtnText}>{editingId ? 'Save Changes' : 'Create'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: theme.colors.navyMid, marginTop: 10 }]} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.submitBtnText, { color: theme.colors.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sidebar Overlay */}
      <Sidebar visible={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.navy },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: theme.colors.navy,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.navyLight,
  },
  hamburgerBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: theme.colors.navyMid,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.colors.navyLight,
  },
  appTitle: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
  list: { padding: theme.spacing.m, paddingBottom: 100 },
  emptyText: { color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 },
  fab: { 
    position: 'absolute', bottom: 30, right: 20, 
    width: 60, height: 60, borderRadius: 30, 
    backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center', 
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3 
  },
  fabIcon: { color: theme.colors.navy, fontSize: 30, fontWeight: 'bold' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.navy, padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: theme.colors.navyLight },
  modalTitle: { color: theme.colors.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: theme.colors.navyLight, borderRadius: 8, padding: 16, color: theme.colors.textPrimary, marginBottom: 16, backgroundColor: theme.colors.navyMid },
  submitBtn: { backgroundColor: theme.colors.accent, padding: 16, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: theme.colors.navy, fontWeight: 'bold', fontSize: 16 }
});
