import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Transaction } from '../../models/types';
import { theme } from '../theme';

interface Props {
  transaction: Transaction;
  onDelete: () => void;
}

export const TransactionRow = ({ transaction, onDelete }: Props) => {
  const isBuy = transaction.type === 'buy';
  const totalValue = transaction.units * transaction.price;
  const date = new Date(transaction.date);
  const formattedDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const confirmDelete = () => {
    Alert.alert("Delete Transaction", "Are you sure you want to delete this log?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", onPress: onDelete, style: "destructive" }
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.leftCol}>
        <View style={[styles.badge, { backgroundColor: isBuy ? theme.colors.accent : theme.colors.danger }]}>
          <Text style={styles.badgeText}>{isBuy ? 'BUY' : 'SELL'}</Text>
        </View>
        <View style={{ marginLeft: theme.spacing.m }}>
          <Text style={styles.ticker}>{transaction.tickerSymbol} <Text style={styles.name}>{transaction.name}</Text></Text>
          <Text style={styles.details}>{transaction.units} @ ${transaction.price.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.rightCol}>
        <Text style={styles.value}>${totalValue.toFixed(2)}</Text>
        <Text style={styles.date}>{formattedDate}</Text>
        <TouchableOpacity onPress={confirmDelete} style={{ marginTop: 8 }}>
            <Feather name="trash-2" size={16} color={theme.colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.navyMid,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.navyLight,
  },
  leftCol: { flexDirection: 'row', flex: 1, alignItems: 'center' },
  rightCol: { alignItems: 'flex-end', width: 100 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, width: 44, alignItems: 'center' },
  badgeText: { color: theme.colors.navy, fontSize: 10, fontWeight: 'bold' },
  ticker: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: 'bold' },
  name: { color: theme.colors.textMuted, fontSize: 12, fontWeight: 'normal' },
  details: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  value: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: 'bold' },
  date: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
});
