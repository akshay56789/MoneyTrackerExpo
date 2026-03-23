import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSettingsStore } from '../../store/settingsStore';
import { theme } from '../theme';

export const SettingsScreen = () => {
    const { usdToInr, setUsdToInr } = useSettingsStore();
    const [rateInput, setRateInput] = useState(usdToInr.toString());

    const handleSave = () => {
        const parsed = parseFloat(rateInput);
        if (isNaN(parsed) || parsed <= 0) {
            Alert.alert('Invalid Rate', 'Please enter a valid positive exchange rate.');
            return;
        }
        setUsdToInr(parsed);
        Alert.alert('Saved', `Exchange rate updated: 1 USD = ₹${parsed.toFixed(2)}`);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.sectionTitle}>Currency Settings</Text>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Feather name="dollar-sign" size={20} color={theme.colors.accent} />
                    <Text style={styles.cardTitle}>USD → INR Exchange Rate</Text>
                </View>
                <Text style={styles.cardDesc}>
                    This rate is used to convert US portfolio values into Indian Rupees. 
                    Set it manually to match the current market rate.
                </Text>

                <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>1 USD =</Text>
                    <TextInput
                        style={styles.rateInput}
                        value={rateInput}
                        onChangeText={setRateInput}
                        keyboardType="numeric"
                        placeholderTextColor={theme.colors.textMuted}
                    />
                    <Text style={styles.rateLabel}>INR</Text>
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Feather name="check" size={16} color={theme.colors.navy} />
                    <Text style={styles.saveBtnText}>Save Rate</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Feather name="info" size={20} color={theme.colors.accent} />
                    <Text style={styles.cardTitle}>How Currency Works</Text>
                </View>
                <Text style={styles.cardDesc}>
                    • <Text style={{color: theme.colors.textPrimary}}>US assets</Text> are tracked in USD ($) using Finnhub API.{'\n'}
                    • <Text style={{color: theme.colors.textPrimary}}>Indian assets</Text> are tracked in INR (₹) using AlphaVantage API.{'\n'}
                    • Tap the <Text style={{color: theme.colors.accent}}>₹↔$ icon</Text> next to any USD value in your portfolio to instantly see it in INR.
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.navy },
    content: { padding: theme.spacing.m },
    sectionTitle: { color: theme.colors.textMuted, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: theme.spacing.m },
    card: {
        backgroundColor: theme.colors.navyMid,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        marginBottom: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.navyLight,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    cardTitle: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: 'bold' },
    cardDesc: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 16 },
    rateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    rateLabel: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: 'bold' },
    rateInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: theme.colors.navyLight,
        borderRadius: 8,
        padding: 12,
        color: theme.colors.textPrimary,
        backgroundColor: theme.colors.navy,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: theme.colors.accent,
        padding: 14,
        borderRadius: 8,
    },
    saveBtnText: { color: theme.colors.navy, fontWeight: 'bold', fontSize: 16 },
});
