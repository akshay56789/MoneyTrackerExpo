import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Asset, PriceData } from '../../models/types';
import { theme } from '../theme';

interface Props {
  asset: Asset;
  livePrice?: PriceData;
  onEdit: () => void;
  onDelete: () => void;
}

export const AssetRow = ({ asset, livePrice, onEdit, onDelete }: Props) => {
  const invested = asset.totalInvested;
  const current = asset.currentValue;
  const profit = current - invested;
  const profitPercent = invested > 0 ? (profit / invested) * 100 : 0;
  const isProfitPositive = profit >= 0;

  const oneDayPercent = livePrice?.dailyChangePercent || 0;
  const oneDayValue = current * (oneDayPercent / 100);
  const is1DPositive = oneDayValue >= 0;

  const confirmDelete = () => {
      Alert.alert(
          "Delete Asset",
          `Are you sure you want to delete ${asset.tickerSymbol}?`,
          [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", onPress: onDelete, style: "destructive" }
          ]
      );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.ticker}>{asset.tickerSymbol} <Text style={styles.name}>{asset.name}</Text></Text>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{asset.assetType}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
              <Feather name="edit-2" size={16} color={theme.colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDelete} style={styles.iconBtn}>
              <Feather name="trash-2" size={16} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.grid}>
          <View style={styles.col}>
              <Text style={styles.label}>Invested Price</Text>
              <Text style={styles.value}>${invested.toFixed(2)}</Text>
          </View>

          <View style={styles.col}>
              <Text style={styles.label}>Current Value</Text>
              <Text style={styles.value}>${current.toFixed(2)}</Text>
              {oneDayPercent !== 0 && (
                <>
                  <Text style={[styles.subtext, { color: is1DPositive ? theme.colors.accent : theme.colors.danger }]}>
                     {is1DPositive ? '+' : ''}${oneDayValue.toFixed(2)} (1D)
                  </Text>
                  <Text style={[styles.subtext, { color: is1DPositive ? theme.colors.accent : theme.colors.danger }]}>
                     {is1DPositive ? '+' : ''}{oneDayPercent.toFixed(2)}%
                  </Text>
                </>
              )}
          </View>

          <View style={[styles.col, { alignItems: 'flex-end' }]}>
              <Text style={styles.label}>P&L</Text>
              <Text style={[styles.value, { color: isProfitPositive ? theme.colors.accent : theme.colors.danger }]}>
                 {isProfitPositive ? '+' : ''}${profit.toFixed(2)}
              </Text>
              <Text style={[styles.subtext, { color: isProfitPositive ? theme.colors.accent : theme.colors.danger }]}>
                 {isProfitPositive ? '+' : ''}{profitPercent.toFixed(2)}%
              </Text>
          </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.navyMid,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.navyLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 8
  },
  ticker: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: 'bold' },
  name: { color: theme.colors.textMuted, fontSize: 14, fontWeight: 'normal' },
  chip: { backgroundColor: theme.colors.navy, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
  chipText: { color: theme.colors.textMuted, fontSize: 10, fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 4 },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { flex: 1 },
  label: { color: theme.colors.textMuted, fontSize: 11, textTransform: 'uppercase', marginBottom: 4 },
  value: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  subtext: { color: theme.colors.textMuted, fontSize: 12, fontWeight: 'bold' },
});
