import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useStore } from '../../store/store';
import { PortfolioCard } from '../components/PortfolioCard';
import { theme } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type PortfoliosScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Portfolios'>;

export const PortfoliosScreen = () => {
  const { portfolios, addPortfolio, editPortfolio } = useStore();
  const navigation = useNavigation<PortfoliosScreenNavigationProp>();
  
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

  const navToTransactions = () => {
    navigation.navigate('Transactions', {});
  };

  return (
    <View style={styles.container}>
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

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => {}}>
          <Text style={[styles.tabText, { color: theme.colors.accent }]}>Portfolios</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={navToTransactions}>
          <Text style={styles.tabText}>History</Text>
        </TouchableOpacity>
      </View>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.navy },
  list: { padding: theme.spacing.m, paddingBottom: 100 },
  emptyText: { color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', backgroundColor: theme.colors.navyMid,
    paddingBottom: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.navyLight
  },
  tabBtn: { flex: 1, alignItems: 'center' },
  tabText: { color: theme.colors.textMuted, fontWeight: 'bold' },
  fab: { 
    position: 'absolute', bottom: 80, right: 20, 
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
