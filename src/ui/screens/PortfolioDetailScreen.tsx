import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useStore } from '../../store/store';
import { AssetRow } from '../components/AssetRow';
import { DonutChart } from '../components/DonutChart';
import { theme } from '../theme';
import { Asset, AssetType } from '../../models/types';

type DetailRouteProp = RouteProp<RootStackParamList, 'PortfolioDetail'>;

export const PortfolioDetailScreen = () => {
  const route = useRoute<DetailRouteProp>();
  const { portfolioId } = route.params;
  const { assets, livePrices, addAsset, editAsset, removeAsset } = useStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [invested, setInvested] = useState('');
  const [current, setCurrent] = useState('');
  const [type, setType] = useState<AssetType>(AssetType.Stock);

  const portfolioAssets = assets.filter(a => a.portfolioId === portfolioId);

  const { totalInvested, totalCurrent, donutData, t1D } = useMemo(() => {
    let tInv = 0;
    let tCurr = 0;
    let t1DVal = 0;
    const typeTotals = { Stock: 0, ETF: 0, MF: 0 };
    
    portfolioAssets.forEach(a => {
      tInv += a.totalInvested;
      tCurr += a.currentValue;
      typeTotals[a.assetType as keyof typeof typeTotals] += a.currentValue;
      
      const livePrice = livePrices[a.tickerSymbol];
      if (livePrice && livePrice.dailyChangePercent !== undefined) {
          t1DVal += (a.currentValue * (livePrice.dailyChangePercent / 100));
      }
    });

    const dData = [
      { type: 'Stock', value: typeTotals.Stock },
      { type: 'ETF', value: typeTotals.ETF },
      { type: 'MF', value: typeTotals.MF },
    ].filter(d => d.value > 0);

    return { totalInvested: tInv, totalCurrent: tCurr, donutData: dData, t1D: t1DVal };
  }, [portfolioAssets, livePrices]);

  const totalProfit = totalCurrent - totalInvested;
  const totalProfitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  const total1DPercent = (totalCurrent - t1D) > 0 ? (t1D / (totalCurrent - t1D)) * 100 : 0;

  const isProfitPos = totalProfit >= 0;
  const is1DPos = t1D >= 0;

  const openCreateModal = () => {
      setEditingId(null);
      setTicker(''); setName(''); setInvested(''); setCurrent('');
      setType(AssetType.Stock);
      setModalVisible(true);
  };

  const openEditModal = (a: Asset) => {
      setEditingId(a.id!);
      setTicker(a.tickerSymbol);
      setName(a.name || '');
      setInvested(a.totalInvested.toString());
      setCurrent(a.currentValue.toString());
      setType(a.assetType);
      setModalVisible(true);
  };

  const handleSave = () => {
    if (ticker && invested && current) {
      const assetData: Asset = {
        portfolioId,
        tickerSymbol: ticker.toUpperCase(),
        name: name.trim(),
        assetType: type,
        totalInvested: parseFloat(invested),
        currentValue: parseFloat(current)
      };

      if (editingId) {
          editAsset(editingId, assetData);
      } else {
          addAsset(assetData);
      }
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={portfolioAssets}
        keyExtractor={a => a.id!.toString()}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          portfolioAssets.length > 0 ? (
            <View>
              {/* Top Header Card */}
              <View style={styles.headerCard}>
                  <View style={styles.headerRow}>
                      <View style={{flex: 1}}>
                          <Text style={styles.headerLabel}>Total Invested</Text>
                          <Text style={styles.headerVal}>${totalInvested.toFixed(2)}</Text>
                      </View>
                      <View style={{flex: 1, alignItems: 'center'}}>
                          <Text style={styles.headerLabel}>Current Price</Text>
                          <Text style={styles.headerVal}>${totalCurrent.toFixed(2)}</Text>
                      </View>
                  </View>
                  
                  <View style={styles.headerDivider} />

                  <View style={styles.headerRow}>
                      <View style={{flex: 1}}>
                          <Text style={styles.headerLabel}>Total P&L</Text>
                          <Text style={[styles.headerSubVal, {color: isProfitPos ? theme.colors.accent : theme.colors.danger}]}>
                              {isProfitPos ? '+' : ''}${totalProfit.toFixed(2)} ({isProfitPos ? '+' : ''}{totalProfitPercent.toFixed(2)}%)
                          </Text>
                      </View>
                      <View style={{flex: 1, alignItems: 'center'}}>
                          <Text style={styles.headerLabel}>1D Return</Text>
                          <Text style={[styles.headerSubVal, {color: is1DPos ? theme.colors.accent : theme.colors.danger}]}>
                              {is1DPos ? '+' : ''}${t1D.toFixed(2)} ({is1DPos ? '+' : ''}{total1DPercent.toFixed(2)}%)
                          </Text>
                      </View>
                  </View>
              </View>

              {/* Chart */}
              <View style={styles.chartContainer}>
                <DonutChart data={donutData} totalValue={totalCurrent} />
                <View style={styles.legend}>
                  {donutData.map(d => (
                    <View key={d.type} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: d.type === 'Stock' ? '#00E676' : d.type === 'ETF' ? '#00B0FF' : '#D500F9' }]} />
                      <Text style={styles.legendText}>{d.type}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <AssetRow 
              asset={item} 
              livePrice={livePrices[item.tickerSymbol]} 
              onEdit={() => openEditModal(item)}
              onDelete={() => removeAsset(item.id!, portfolioId, item.tickerSymbol)}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No assets in this portfolio. Add one below!</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{editingId ? 'Edit Asset' : 'Add Asset'}</Text>
                
                <View style={styles.typeSelector}>
                  {(['Stock', 'ETF', 'MF'] as AssetType[]).map(t => (
                    <TouchableOpacity 
                      key={t}
                      style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                      onPress={() => setType(t)}
                    >
                      <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput style={styles.input} placeholder="Stockname (e.g. Apple Inc)" placeholderTextColor={theme.colors.textMuted} value={name} onChangeText={setName} />
                <TextInput style={styles.input} placeholder="Symbol/Ticker (e.g. AAPL)" placeholderTextColor={theme.colors.textMuted} value={ticker} onChangeText={setTicker} autoCapitalize="characters" />
                
                <View style={{flexDirection: 'row', gap: 10}}>
                    <TextInput style={[styles.input, {flex: 1}]} placeholder="Invested Price ($)" placeholderTextColor={theme.colors.textMuted} value={invested} onChangeText={setInvested} keyboardType="numeric" />
                    <TextInput style={[styles.input, {flex: 1}]} placeholder="Current price ($)" placeholderTextColor={theme.colors.textMuted} value={current} onChangeText={setCurrent} keyboardType="numeric" />
                </View>
                
                <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
                  <Text style={styles.submitBtnText}>{editingId ? 'Save Changes' : 'Add Asset'}</Text>
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
  list: { padding: theme.spacing.m, paddingBottom: 100 },
  headerCard: { backgroundColor: theme.colors.navyMid, padding: 20, borderRadius: theme.borderRadius.m, marginBottom: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.navyLight },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  headerDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 16 },
  headerLabel: { color: theme.colors.textMuted, fontSize: 12, textTransform: 'uppercase', marginBottom: 4 },
  headerVal: { color: theme.colors.textPrimary, fontSize: 22, fontWeight: 'bold' },
  headerSubVal: { fontSize: 16, fontWeight: 'bold' },
  chartContainer: { alignItems: 'center', marginBottom: theme.spacing.xl, padding: theme.spacing.m, backgroundColor: theme.colors.navyMid, borderRadius: theme.borderRadius.m, borderWidth: 1, borderColor: theme.colors.navyLight },
  legend: { flexDirection: 'row', gap: 16, marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: theme.colors.textPrimary, fontSize: 12 },
  emptyText: { color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  fabIcon: { color: theme.colors.navy, fontSize: 30, fontWeight: 'bold' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalScroll: { justifyContent: 'flex-end', flexGrow: 1 },
  modalContent: { backgroundColor: theme.colors.navy, padding: 24, paddingBottom: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitle: { color: theme.colors.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.navyLight, alignItems: 'center' },
  typeBtnActive: { backgroundColor: theme.colors.navyLight, borderColor: theme.colors.accent },
  typeBtnText: { color: theme.colors.textMuted, fontWeight: 'bold' },
  typeBtnTextActive: { color: theme.colors.accent },
  input: { borderWidth: 1, borderColor: theme.colors.navyLight, borderRadius: 8, padding: 16, color: theme.colors.textPrimary, marginBottom: 16, backgroundColor: theme.colors.navyMid },
  submitBtn: { backgroundColor: theme.colors.accent, padding: 16, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: theme.colors.navy, fontWeight: 'bold', fontSize: 16 }
});
