import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useStore } from '../../store/store';
import { AssetRow } from '../components/AssetRow';
import { DonutChart } from '../components/DonutChart';
import { theme } from '../theme';
import { Asset, AssetType } from '../../models/types';
import { Feather } from '@expo/vector-icons';
import { useSettingsStore } from '../../store/settingsStore';

type DetailRouteProp = RouteProp<RootStackParamList, 'PortfolioDetail'>;

export const PortfolioDetailScreen = () => {
  const route = useRoute<DetailRouteProp>();
  const { portfolioId } = route.params;
  const { assets, livePrices, addAsset, editAsset, removeAsset, syncPrices, syncing } = useStore();

  const { usdToInr } = useSettingsStore();
  const [showInInr, setShowInInr] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [invested, setInvested] = useState('');
  const [current, setCurrent] = useState('');
  const [units, setUnits] = useState('');
  const [avgPrice, setAvgPrice] = useState('');
  const [type, setType] = useState<AssetType>(AssetType.Stock);
  const [region, setRegion] = useState<'US' | 'IN'>('US');
  const [isSaving, setIsSaving] = useState(false);

  const portfolioAssets = assets.filter(a => a.portfolioId === portfolioId);

  const { totalInvested, totalCurrent, donutData, t1D } = useMemo(() => {
    let tInv = 0;
    let tCurr = 0;
    let t1DVal = 0;
    const typeTotals = { Stock: 0, ETF: 0, MF: 0 };
    
    portfolioAssets.forEach(a => {
      const isAssetInr = a.region === 'IN';
      
      // Normalize values to current view currency
      let invNorm = a.totalInvested;
      let currNorm = a.currentValue;
      
      if (showInInr && !isAssetInr) {
        // Convert US Asset to INR for the Aggregate
        invNorm = a.totalInvested * usdToInr;
        currNorm = a.currentValue * usdToInr;
      } else if (!showInInr && isAssetInr) {
        // Convert IN Asset to USD for the Aggregate
        invNorm = a.totalInvested / usdToInr;
        currNorm = a.currentValue / usdToInr;
      }

      tInv += invNorm;
      tCurr += currNorm;
      typeTotals[a.assetType as keyof typeof typeTotals] += currNorm;
      
      const livePrice = livePrices[a.tickerSymbol];
      const dailyChange = livePrice?.dailyChangePercent || a.dailyChangePercent || 0;
      if (dailyChange !== 0) {
          t1DVal += (currNorm * (dailyChange / 100));
      }
    });

    const dData = [
      { type: 'Stock', value: typeTotals.Stock },
      { type: 'ETF', value: typeTotals.ETF },
      { type: 'MF', value: typeTotals.MF },
    ].filter(d => d.value > 0);

    return { totalInvested: tInv, totalCurrent: tCurr, donutData: dData, t1D: t1DVal };
  }, [portfolioAssets, livePrices, showInInr, usdToInr]);

  const totalProfit = totalCurrent - totalInvested;
  const totalProfitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  const total1DPercent = (totalCurrent - t1D) > 0 ? (t1D / (totalCurrent - t1D)) * 100 : 0;

  const isProfitPos = totalProfit >= 0;
  const is1DPos = t1D >= 0;

  // Currency helpers for the header card
  const headerFmt = (val: number) => {
    if (showInInr) return `₹${val.toFixed(2)}`;
    return `$${val.toFixed(2)}`;
  };

  const openCreateModal = () => {
      setEditingId(null);
      setTicker(''); setName(''); setInvested(''); setCurrent('');
      setUnits(''); setAvgPrice('');
      setType(AssetType.Stock); setRegion('US');
      setModalVisible(true);
  };

  const openEditModal = (a: Asset) => {
      setEditingId(a.id!);
      setTicker(a.tickerSymbol);
      setName(a.name || '');
      setInvested(a.totalInvested.toString());
      setCurrent(a.currentValue.toString());
      setUnits(a.totalUnits.toString());
      setAvgPrice(a.averageCost.toString());
      setType(a.assetType);
      setRegion(a.region);
      setModalVisible(true);
  };

  const handleSave = async () => {
    if (ticker && invested && current) {
      if (!ticker.match(/^[A-Z0-9.]+$/i)) {
          Alert.alert("Validation", "Ticker symbol contains invalid characters.");
          return;
      }

      setIsSaving(true);

      const u = parseFloat(units) || 1;
      const avg = parseFloat(avgPrice) || (parseFloat(invested) / u);

      const assetData: Asset = {
        portfolioId,
        tickerSymbol: ticker.toUpperCase(),
        name: name.trim(),
        assetType: type,
        region,
        totalUnits: u,
        averageCost: avg,
        totalInvested: parseFloat(invested),
        currentValue: parseFloat(current)
      };

      try {
          if (editingId) {
              await editAsset(editingId, assetData);
          } else {
              await addAsset(assetData);
          }
          setModalVisible(false);
      } catch (error: any) {
          Alert.alert("Ticker API Error", error.message);
      } finally {
          setIsSaving(false);
      }
    } else {
        Alert.alert("Missing Fields", "Please populate Ticker, Invested amount, and Current value.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Sync Bar */}
      <View style={styles.syncBar}>
          <TouchableOpacity style={styles.syncBtn} onPress={syncPrices} disabled={syncing}>
              {syncing ? <ActivityIndicator color={theme.colors.accent} size="small" /> : <Feather name="refresh-cw" size={16} color={theme.colors.accent} />}
              <Text style={styles.syncBtnText}>{syncing ? "Syncing APIs..." : "Sync Live Prices"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
              style={[styles.syncBtn, { marginLeft: 8, borderColor: showInInr ? '#FFA726' : theme.colors.navyLight }]}
              onPress={() => setShowInInr(v => !v)}
          >
              <Text style={[styles.syncBtnText, { color: showInInr ? '#FFA726' : theme.colors.textMuted }]}>
                  {showInInr ? '₹ INR View' : '$ → ₹'}
              </Text>
          </TouchableOpacity>
      </View>

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
                          <Text style={styles.headerVal}>{headerFmt(totalInvested)}</Text>
                      </View>
                      <View style={{flex: 1, alignItems: 'center'}}>
                          <Text style={styles.headerLabel}>Current Price</Text>
                          <Text style={styles.headerVal}>{headerFmt(totalCurrent)}</Text>
                      </View>
                  </View>
                  
                  <View style={styles.headerDivider} />

                  <View style={styles.headerRow}>
                      <View style={{flex: 1}}>
                          <Text style={styles.headerLabel}>Total P&L</Text>
                          <Text style={[styles.headerSubVal, {color: isProfitPos ? theme.colors.accent : theme.colors.danger}]}>
                              {isProfitPos ? '+' : ''}{headerFmt(totalProfit)} ({isProfitPos ? '+' : ''}{totalProfitPercent.toFixed(2)}%)
                          </Text>
                      </View>
                      <View style={{flex: 1, alignItems: 'center'}}>
                          <Text style={styles.headerLabel}>1D Return</Text>
                          <Text style={[styles.headerSubVal, {color: is1DPos ? theme.colors.accent : theme.colors.danger}]}>
                              {is1DPos ? '+' : ''}{headerFmt(t1D)} ({is1DPos ? '+' : ''}{total1DPercent.toFixed(2)}%)
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
                
                {/* Region Selector */}
                <Text style={styles.label}>Region & API</Text>
                <View style={styles.typeSelector}>
                  {(['US', 'IN'] as const).map(r => (
                    <TouchableOpacity key={r} style={[styles.typeBtn, region === r && styles.typeBtnActive]} onPress={() => setRegion(r)}>
                      <Text style={[styles.typeBtnText, region === r && styles.typeBtnTextActive]}>{r === 'US' ? 'US (Finnhub)' : 'India (AlphaV)'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Asset Type Selector */}
                <Text style={styles.label}>Asset Type</Text>
                <View style={styles.typeSelector}>
                  {(['Stock', 'ETF', 'MF'] as AssetType[]).map(t => (
                    <TouchableOpacity key={t} style={[styles.typeBtn, type === t && styles.typeBtnActive]} onPress={() => setType(t)}>
                      <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput style={styles.input} placeholder="Stockname (e.g. Apple Inc)" placeholderTextColor={theme.colors.textMuted} value={name} onChangeText={setName} />
                <TextInput style={styles.input} placeholder="Symbol/Ticker (e.g. AAPL)" placeholderTextColor={theme.colors.textMuted} value={ticker} onChangeText={setTicker} autoCapitalize="characters" />
                
                <View style={{flexDirection: 'row', gap: 10}}>
                    <TextInput style={[styles.input, {flex: 1}]} placeholder="Units (e.g. 1.5)" placeholderTextColor={theme.colors.textMuted} value={units} onChangeText={setUnits} keyboardType="numeric" />
                    <TextInput style={[styles.input, {flex: 1}]} placeholder={region === 'IN' ? 'Avg Price (₹)' : 'Avg Price ($)'} placeholderTextColor={theme.colors.textMuted} value={avgPrice} onChangeText={setAvgPrice} keyboardType="numeric" />
                </View>

                <View style={{flexDirection: 'row', gap: 10}}>
                    <TextInput style={[styles.input, {flex: 1}]} placeholder={region === 'IN' ? 'Invested (₹)' : 'Invested Price ($)'} placeholderTextColor={theme.colors.textMuted} value={invested} onChangeText={v => {
                        setInvested(v);
                        if (units && v) setAvgPrice((parseFloat(v) / parseFloat(units)).toFixed(2));
                    }} keyboardType="numeric" />
                    <TextInput style={[styles.input, {flex: 1}]} placeholder={region === 'IN' ? 'Current Value (₹)' : 'Current price ($)'} placeholderTextColor={theme.colors.textMuted} value={current} onChangeText={setCurrent} keyboardType="numeric" />
                </View>
                
                <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={isSaving}>
                  {isSaving ? <ActivityIndicator color={theme.colors.navy} /> : <Text style={styles.submitBtnText}>{editingId ? 'Save Options & Validate Ticker' : 'Add Asset & Validate'}</Text>}
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.colors.navyMid, marginTop: 10 }]} onPress={() => setModalVisible(false)} disabled={isSaving}>
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
  syncBar: { backgroundColor: theme.colors.navyMid, padding: theme.spacing.m, borderBottomWidth: 1, borderBottomColor: theme.colors.navyLight, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  syncBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: theme.colors.accent },
  syncBtnText: { color: theme.colors.accent, fontWeight: 'bold' },
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
  label: { color: theme.colors.textMuted, fontSize: 12, marginBottom: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  input: { borderWidth: 1, borderColor: theme.colors.navyLight, borderRadius: 8, padding: 16, color: theme.colors.textPrimary, marginBottom: 16, backgroundColor: theme.colors.navyMid },
  submitBtn: { backgroundColor: theme.colors.accent, padding: 16, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: theme.colors.navy, fontWeight: 'bold', fontSize: 16 }
});
