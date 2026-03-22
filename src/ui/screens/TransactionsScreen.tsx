import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, Switch } from 'react-native';
import { useStore } from '../../store/store';
import { TransactionRow } from '../components/TransactionRow';
import { theme } from '../theme';
import { Transaction } from '../../models/types';

type FilterType = 'All' | 'Buy' | 'Sell';

export const TransactionsScreen = () => {
  const { transactions, portfolios, addManualTransaction, removeTransaction } = useStore();
  const [filter, setFilter] = useState<FilterType>('All');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [portfolioId, setPortfolioId] = useState<number | null>(portfolios[0]?.id || null);
  const [isBuy, setIsBuy] = useState(true);
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [units, setUnits] = useState('');
  const [price, setPrice] = useState('');

  const filteredData = React.useMemo(() => {
    if (filter === 'All') return transactions;
    return transactions.filter(t => t.type.toLowerCase() === filter.toLowerCase());
  }, [transactions, filter]);

  const handleAdd = () => {
    if (portfolioId && ticker && units && price) {
      addManualTransaction({
        portfolioId,
        tickerSymbol: ticker.toUpperCase(),
        name,
        type: isBuy ? 'buy' : 'sell',
        units: parseFloat(units),
        price: parseFloat(price),
        date: new Date().toISOString()
      });
      setModalVisible(false);
      setTicker(''); setName(''); setUnits(''); setPrice('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        {(['All', 'Buy', 'Sell'] as FilterType[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={t => t.id!.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <TransactionRow transaction={item} onDelete={() => removeTransaction(item.id!)} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions found.</Text>
            <Text style={styles.emptySubtext}>Log a buy or sell above to see history.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Log Manual Transaction</Text>
                
                <Text style={styles.label}>Select Portfolio:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.portList}>
                    {portfolios.map(p => (
                        <TouchableOpacity 
                            key={p.id} 
                            style={[styles.portChip, portfolioId === p.id && styles.portChipActive]}
                            onPress={() => setPortfolioId(p.id!)}
                        >
                            <Text style={[styles.portChipText, portfolioId === p.id && styles.portChipTextActive]}>{p.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.switchRow}>
                    <Text style={[styles.switchLabel, { color: isBuy ? theme.colors.accent : theme.colors.textMuted }]}>Buy</Text>
                    <Switch value={!isBuy} onValueChange={(val) => setIsBuy(!val)} trackColor={{ false: theme.colors.accent, true: theme.colors.danger }} />
                    <Text style={[styles.switchLabel, { color: !isBuy ? theme.colors.danger : theme.colors.textMuted }]}>Sell</Text>
                </View>

                <TextInput style={styles.input} placeholder="Ticker Symbol (e.g. AAPL)" placeholderTextColor={theme.colors.textMuted} value={ticker} onChangeText={setTicker} autoCapitalize="characters" />
                <TextInput style={styles.input} placeholder="Stock/Asset Name (Optional)" placeholderTextColor={theme.colors.textMuted} value={name} onChangeText={setName} />
                <View style={{flexDirection: 'row', gap: 10}}>
                    <TextInput style={[styles.input, {flex: 1}]} placeholder="Amount (Units)" placeholderTextColor={theme.colors.textMuted} value={units} onChangeText={setUnits} keyboardType="numeric" />
                    <TextInput style={[styles.input, {flex: 1}]} placeholder="Price per unit" placeholderTextColor={theme.colors.textMuted} value={price} onChangeText={setPrice} keyboardType="numeric" />
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
                  <Text style={styles.submitBtnText}>Log Transaction</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.colors.navyMid, marginTop: 10 }]} onPress={() => setModalVisible(false)}>
                  <Text style={[styles.submitBtnText, { color: theme.colors.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>
                <View style={{height: 400}} />
              </View>
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.navy },
  filterBar: { flexDirection: 'row', padding: theme.spacing.m, gap: theme.spacing.s, backgroundColor: theme.colors.navyMid, borderBottomWidth: 1, borderBottomColor: theme.colors.navyLight },
  filterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 20, borderWidth: 1, borderColor: theme.colors.navyLight },
  filterBtnActive: { backgroundColor: theme.colors.navyLight, borderColor: theme.colors.accent },
  filterText: { color: theme.colors.textMuted, fontWeight: 'bold' },
  filterTextActive: { color: theme.colors.accent },
  list: { padding: theme.spacing.m, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySubtext: { color: theme.colors.textMuted, textAlign: 'center' },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  fabIcon: { color: theme.colors.navy, fontSize: 30, fontWeight: 'bold' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalScroll: { justifyContent: 'flex-end', flexGrow: 1 },
  modalContent: { backgroundColor: theme.colors.navy, padding: 24, paddingBottom: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitle: { color: theme.colors.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  label: { color: theme.colors.textMuted, marginBottom: 8 },
  portList: { flexDirection: 'row', marginBottom: 20 },
  portChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.navyMid, marginRight: 8, borderWidth: 1, borderColor: theme.colors.navyLight },
  portChipActive: { backgroundColor: theme.colors.navyLight, borderColor: theme.colors.accent },
  portChipText: { color: theme.colors.textMuted },
  portChipTextActive: { color: theme.colors.accent, fontWeight: 'bold' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, gap: 10 },
  switchLabel: { fontSize: 18, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: theme.colors.navyLight, borderRadius: 8, padding: 16, color: theme.colors.textPrimary, marginBottom: 16, backgroundColor: theme.colors.navyMid },
  submitBtn: { backgroundColor: theme.colors.accent, padding: 16, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: theme.colors.navy, fontWeight: 'bold', fontSize: 16 }
});
