import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, FlatList,
    TouchableOpacity, ActivityIndicator, Clipboard, Alert, Keyboard
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme';

interface SearchResult {
    symbol: string;
    description: string;
    type: string;
    displaySymbol: string;
}

const regionOptions = ['US', 'IN'] as const;

export const TickerSearchScreen = () => {
    const [query, setQuery] = useState('');
    const [region, setRegion] = useState<'US' | 'IN'>('US');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const finnhubKey = process.env.EXPO_PUBLIC_FINNHUB_API_KEY || '';
    const alphaKey = process.env.EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY || '';

    const handleSearch = async () => {
        const trimmed = query.trim();
        if (!trimmed) return;
        Keyboard.dismiss();
        setLoading(true);
        setSearched(true);
        setResults([]);

        try {
            if (region === 'US') {
                // Finnhub symbol search
                const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(trimmed)}&token=${finnhubKey}`;
                const res = await fetch(url);
                const json = await res.json();

                if (json.result && json.result.length > 0) {
                    const mapped: SearchResult[] = json.result.map((item: any) => ({
                        symbol: item.symbol,
                        displaySymbol: item.displaySymbol,
                        description: item.description,
                        type: item.type,
                    }));
                    setResults(mapped);
                } else {
                    setResults([]);
                }
            } else {
                // AlphaVantage symbol search
                const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(trimmed)}&apikey=${alphaKey}`;
                const res = await fetch(url);
                const json = await res.json();

                if (json.bestMatches && json.bestMatches.length > 0) {
                    const mapped: SearchResult[] = json.bestMatches.map((item: any) => ({
                        symbol: item['1. symbol'],
                        displaySymbol: item['1. symbol'],
                        description: item['2. name'],
                        type: item['3. type'],
                    }));
                    setResults(mapped);
                } else {
                    setResults([]);
                }
            }
        } catch (e: any) {
            Alert.alert('Search Failed', 'Could not reach the API. Check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (symbol: string) => {
        Clipboard.setString(symbol);
        Alert.alert('Copied!', `"${symbol}" copied to clipboard.`);
    };

    const renderItem = ({ item }: { item: SearchResult }) => (
        <View style={styles.resultCard}>
            <View style={styles.resultLeft}>
                <View style={styles.symbolRow}>
                    <Text style={styles.symbol}>{item.symbol}</Text>
                    {item.type ? (
                        <View style={styles.typeBadge}>
                            <Text style={styles.typeBadgeText}>{item.type}</Text>
                        </View>
                    ) : null}
                </View>
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
            </View>
            <TouchableOpacity style={styles.copyBtn} onPress={() => handleCopy(item.symbol)}>
                <Feather name="copy" size={16} color={theme.colors.navy} />
                <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Region Toggle */}
            <View style={styles.regionBar}>
                {regionOptions.map(r => (
                    <TouchableOpacity
                        key={r}
                        style={[styles.regionBtn, region === r && styles.regionBtnActive]}
                        onPress={() => { setRegion(r); setResults([]); setSearched(false); }}
                    >
                        <Text style={[styles.regionBtnText, region === r && styles.regionBtnTextActive]}>
                            {r === 'US' ? '🇺🇸 US Markets (Finnhub)' : '🇮🇳 India Markets (AlphaV)'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarRow}>
                <View style={styles.searchBar}>
                    <Feather name="search" size={18} color={theme.colors.textMuted} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={region === 'US' ? 'Search by name or ticker (e.g. Tesla)' : 'Search by name or ticker (e.g. RELIANCE)'}
                        placeholderTextColor={theme.colors.textMuted}
                        value={query}
                        onChangeText={setQuery}
                        onSubmitEditing={handleSearch}
                        autoCapitalize="characters"
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
                            <Feather name="x" size={18} color={theme.colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity style={styles.searchGoBtn} onPress={handleSearch}>
                    <Text style={styles.searchGoBtnText}>Search</Text>
                </TouchableOpacity>
            </View>

            {/* Results */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.accent} />
                    <Text style={styles.loadingText}>Searching {region === 'US' ? 'Finnhub' : 'AlphaVantage'}...</Text>
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item) => item.symbol}
                    contentContainerStyle={styles.list}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        searched ? (
                            <View style={styles.center}>
                                <Feather name="search" size={48} color={theme.colors.textMuted} />
                                <Text style={styles.emptyTitle}>No results found</Text>
                                <Text style={styles.emptySubtext}>Try a different keyword or ticker symbol</Text>
                            </View>
                        ) : (
                            <View style={styles.center}>
                                <Feather name="trending-up" size={48} color={theme.colors.navyLight} />
                                <Text style={styles.emptyTitle}>Find any ticker</Text>
                                <Text style={styles.emptySubtext}>Search for stocks, ETFs, or mutual funds above and copy the symbol to use when adding assets.</Text>
                            </View>
                        )
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.navy },
    regionBar: { flexDirection: 'row', padding: theme.spacing.m, gap: theme.spacing.s, backgroundColor: theme.colors.navyMid, borderBottomWidth: 1, borderBottomColor: theme.colors.navyLight },
    regionBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 20, borderWidth: 1, borderColor: theme.colors.navyLight },
    regionBtnActive: { backgroundColor: theme.colors.navyLight, borderColor: theme.colors.accent },
    regionBtnText: { color: theme.colors.textMuted, fontWeight: 'bold', fontSize: 11 },
    regionBtnTextActive: { color: theme.colors.accent },
    searchBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: theme.spacing.m, paddingBottom: 0 },
    searchBar: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: theme.colors.navyMid, borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 12,
        borderWidth: 1, borderColor: theme.colors.navyLight,
    },
    searchInput: { flex: 1, color: theme.colors.textPrimary, fontSize: 15 },
    searchGoBtn: {
        backgroundColor: theme.colors.accent, paddingHorizontal: 18, paddingVertical: 14,
        borderRadius: 12,
    },
    searchGoBtnText: { color: theme.colors.navy, fontWeight: 'bold', fontSize: 14 },
    list: { padding: theme.spacing.m },
    resultCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: theme.colors.navyMid,
        padding: theme.spacing.m, borderRadius: theme.borderRadius.m,
        marginBottom: theme.spacing.s,
        borderWidth: 1, borderColor: theme.colors.navyLight,
    },
    resultLeft: { flex: 1 },
    symbolRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    symbol: { color: theme.colors.textPrimary, fontSize: 17, fontWeight: 'bold' },
    typeBadge: { backgroundColor: 'rgba(0,230,118,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    typeBadgeText: { color: theme.colors.accent, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    description: { color: theme.colors.textMuted, fontSize: 12 },
    copyBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: theme.colors.accent, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    },
    copyBtnText: { color: theme.colors.navy, fontWeight: 'bold', fontSize: 13 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 40 },
    loadingText: { color: theme.colors.textMuted, marginTop: 12 },
    emptyTitle: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8, textAlign: 'center' },
    emptySubtext: { color: theme.colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
