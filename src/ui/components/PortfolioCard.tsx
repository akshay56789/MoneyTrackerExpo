import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Portfolio } from '../../models/types';
import { useStore } from '../../store/store';
import { theme } from '../theme';

interface Props {
  portfolio: Portfolio;
  onPress: () => void;
  onEdit: () => void;
}

export const PortfolioCard = ({ portfolio, onPress, onEdit }: Props) => {
  const { assets, livePrices } = useStore();

  const stats = useMemo(() => {
    const portAssets = assets.filter(a => a.portfolioId === portfolio.id);
    let invested = 0;
    let current = 0;
    let previous = 0;

    let stocks = 0;
    let etfs = 0;
    let mfs = 0;

    portAssets.forEach(a => {
      invested += a.totalInvested;
      current += a.currentValue;
      
      const price = livePrices[a.tickerSymbol];
      if (price && price.dailyChangePercent !== undefined) {
        previous += a.currentValue - (a.currentValue * (price.dailyChangePercent / 100));
      } else {
        previous += a.currentValue;
      }

      if (a.assetType === 'Stock') stocks++;
      if (a.assetType === 'ETF') etfs++;
      if (a.assetType === 'MF') mfs++;
    });

    const gain = current - invested;
    const gainPercent = invested > 0 ? (gain / invested) * 100 : 0;
    const dayChange = current - previous;
    const dayChangePercent = previous > 0 ? (dayChange / previous) * 100 : 0;

    return { invested, current, gainPercent, dayChange, dayChangePercent, counts: { stocks, etfs, mfs } };
  }, [portfolio.id, assets, livePrices]);

  const isPositive = stats.dayChange >= 0;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.cardContainer}>
      <LinearGradient
        colors={[theme.colors.navyMid, theme.colors.navyLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={styles.title}>{portfolio.name}</Text>
            <TouchableOpacity onPress={onEdit} style={{marginLeft: 10, padding: 4}}>
              <Feather name="edit-2" size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.badgeContainer}>
            {stats.counts.stocks > 0 && <Text style={styles.badge}>{stats.counts.stocks} Stocks</Text>}
            {stats.counts.etfs > 0 && <Text style={styles.badge}>{stats.counts.etfs} ETFs</Text>}
            {stats.counts.mfs > 0 && <Text style={styles.badge}>{stats.counts.mfs} MFs</Text>}
          </View>
        </View>

        <View style={styles.body}>
          <View>
            <Text style={styles.label}>Invested</Text>
            <Text style={styles.valueSec}>${stats.invested.toFixed(2)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.label}>Current Value</Text>
            <Text style={styles.valueTitle}>${stats.current.toFixed(2)}</Text>
            <Text style={[styles.dayChange, { color: isPositive ? theme.colors.accent : theme.colors.danger }]}>
              {isPositive ? '+' : ''}{stats.dayChangePercent.toFixed(2)}% (1D)
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  card: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  title: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
  badgeContainer: { flexDirection: 'row', gap: 4 },
  badge: { backgroundColor: theme.colors.navy, color: theme.colors.textMuted, fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  body: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  label: { color: theme.colors.textMuted, fontSize: 12, marginBottom: 4 },
  valueSec: { color: theme.colors.textMuted, fontSize: 16, fontWeight: '600' },
  valueTitle: { color: theme.colors.textPrimary, fontSize: 24, fontWeight: 'bold' },
  dayChange: { fontSize: 14, fontWeight: '600', marginTop: 4 },
});
