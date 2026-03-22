import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useStore } from '../store/store';
import { AssetType } from '../models/types';

export const Dashboard = () => {
  const { portfolios, assets, livePrices, addAsset } = useStore();
  const [modalVisible, setModalVisible] = React.useState(false);
  
  const [ticker, setTicker] = React.useState('');
  const [units, setUnits] = React.useState('');
  const [cost, setCost] = React.useState('');

  const currentPortfolio = portfolios[0];

  const handleAddAsset = async () => {
      if (!ticker || !units || !cost) return;
      await addAsset({
          portfolioId: currentPortfolio.id!,
          tickerSymbol: ticker.toUpperCase(),
          assetType: AssetType.Stock,
          totalUnits: parseFloat(units),
          averageCost: parseFloat(cost)
      });
      setTicker('');
      setUnits('');
      setCost('');
      setModalVisible(false);
  };

  let totalCost = 0;
  let totalLiveValue = 0;

  assets.forEach(a => {
      totalCost += a.totalUnits * a.averageCost;
      const priceData = livePrices[a.tickerSymbol];
      if (priceData) {
          totalLiveValue += priceData.currentPrice * a.totalUnits;
      }
  });

  const gain = totalLiveValue - totalCost;
  const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0;
  const isPositive = gain >= 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MoneyTracker</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.summaryCard}>
            <Text style={styles.subtitle}>Total Value</Text>
            <Text style={styles.valueTitle}>${totalLiveValue.toFixed(2)}</Text>
            <Text style={[styles.gainText, { color: isPositive ? '#00E676' : '#FF1744' }]}>
                {isPositive ? '+' : ''}${Math.abs(gain).toFixed(2)} ({Math.abs(gainPercent).toFixed(2)}%) All Time
            </Text>
        </View>

        <Text style={styles.sectionTitle}>Your Assets</Text>
        
        {assets.length === 0 && <Text style={{color: '#8892B0'}}>No assets added yet. Tap + to add NVDA!</Text>}

        {assets.map((a, idx) => {
            const live = livePrices[a.tickerSymbol];
            const currentAssetValue = live ? live.currentPrice * a.totalUnits : 0;
            const assetIsPositive = live && live.dailyChangePercent >= 0;

            return (
                <View key={idx} style={styles.assetCard}>
                    <View>
                        <Text style={styles.assetTicker}>{a.tickerSymbol}</Text>
                        <Text style={styles.assetUnits}>{a.totalUnits} Units</Text>
                    </View>
                    <View style={{alignItems: 'flex-end'}}>
                        {live ? (
                            <>
                                <Text style={styles.assetValue}>${currentAssetValue.toFixed(2)}</Text>
                                <Text style={[styles.assetGain, { color: assetIsPositive ? '#00E676' : '#FF1744' }]}>
                                    {assetIsPositive ? '+' : ''}{live.dailyChangePercent.toFixed(2)}% (1D)
                                </Text>
                            </>
                        ) : (
                            <ActivityIndicator color="#00E676" />
                        )}
                    </View>
                </View>
            )
        })}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalBg}>
              <View style={styles.modalContent}>
                  <Text style={styles.sectionTitle}>Add New Asset</Text>
                  
                  <TextInput 
                      style={styles.input} 
                      placeholder="Ticker (e.g. NVDA)" 
                      placeholderTextColor="#8892B0"
                      value={ticker}
                      onChangeText={setTicker}
                  />
                  <TextInput 
                      style={styles.input} 
                      placeholder="Total Units" 
                      placeholderTextColor="#8892B0"
                      keyboardType="numeric"
                      value={units}
                      onChangeText={setUnits}
                  />
                  <TextInput 
                      style={styles.input} 
                      placeholder="Average Purchase Cost" 
                      placeholderTextColor="#8892B0"
                      keyboardType="numeric"
                      value={cost}
                      onChangeText={setCost}
                  />

                  <TouchableOpacity style={styles.submitBtn} onPress={handleAddAsset}>
                      <Text style={styles.submitBtnText}>Add Asset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.submitBtn, {backgroundColor: '#112240', marginTop: 10}]} onPress={() => setModalVisible(false)}>
                      <Text style={[styles.submitBtnText, {color: '#FFF'}]}>Cancel</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A192F' },
  header: { paddingTop: 60, paddingBottom: 20, alignItems: 'center', backgroundColor: '#0A192F' },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  scroll: { padding: 16, paddingBottom: 100 },
  summaryCard: { backgroundColor: '#1A365D', padding: 24, borderRadius: 16, marginBottom: 24 },
  subtitle: { color: '#8892B0', fontSize: 16, marginBottom: 8 },
  valueTitle: { color: 'white', fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  gainText: { fontSize: 16, fontWeight: 'bold' },
  sectionTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  assetCard: { backgroundColor: '#112240', padding: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  assetTicker: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  assetUnits: { color: '#8892B0', marginTop: 4 },
  assetValue: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  assetGain: { fontSize: 12, marginTop: 4, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#00E676', alignItems: 'center', justifyContent: 'center', elevation: 5 },
  fabIcon: { color: 'black', fontSize: 30, fontWeight: 'bold' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0A192F', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  input: { borderWidth: 1, borderColor: '#8892B0', borderRadius: 8, padding: 16, color: 'white', marginBottom: 16 },
  submitBtn: { backgroundColor: '#00E676', padding: 16, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: 'black', fontWeight: 'bold', fontSize: 16 }
});
