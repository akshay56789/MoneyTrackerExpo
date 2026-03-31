import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSettingsStore } from '../../store/settingsStore';
import { setPin, verifyPin, disablePin, hasPinEnabled } from '../../store/secureStore';
import { theme } from '../theme';

export const SettingsScreen = () => {
    const { usdToInr, setUsdToInr } = useSettingsStore();
    const [rateInput, setRateInput] = useState(usdToInr.toString());

    // Security State
    const [pinEnabled, setPinEnabled] = useState(false);
    const [authModalVisible, setAuthModalVisible] = useState(false);
    const [authPin, setAuthPin] = useState('');
    const [authAction, setAuthAction] = useState<'enable' | 'disable'>('enable');

    React.useEffect(() => {
        hasPinEnabled().then(setPinEnabled);
    }, []);

    const handleSave = () => {
        const parsed = parseFloat(rateInput);
        if (isNaN(parsed) || parsed <= 0) {
            Alert.alert('Invalid Rate', 'Please enter a valid positive exchange rate.');
            return;
        }
        setUsdToInr(parsed);
        Alert.alert('Saved', `Exchange rate updated: 1 USD = ₹${parsed.toFixed(2)}`);
    };

    const handleAuthSubmit = async () => {
        if (authPin.length !== 4) {
            Alert.alert("Invalid PIN", "PIN must be exactly 4 digits.");
            return;
        }
        
        if (authAction === 'enable') {
            await setPin(authPin);
            setPinEnabled(true);
            Alert.alert("Vault Secured", "PIN Lock has been enabled.");
        } else {
            const isValid = await verifyPin(authPin);
            if (isValid) {
                await disablePin();
                setPinEnabled(false);
                Alert.alert("Vault Unlocked", "PIN Lock has been disabled.");
            } else {
                Alert.alert("Access Denied", "Incorrect PIN.");
                return;
            }
        }
        setAuthModalVisible(false);
        setAuthPin('');
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
                    • <Text style={{color: theme.colors.textPrimary}}>US assets</Text> are tracked in USD ($).{'\n'}
                    • <Text style={{color: theme.colors.textPrimary}}>Indian assets</Text> are tracked in INR (₹).{'\n'}
                    • Tap the <Text style={{color: theme.colors.accent}}>₹↔$ icon</Text> next to any USD value in your portfolio to instantly see it in INR.
                </Text>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Security</Text>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Feather name="lock" size={20} color={theme.colors.accent} />
                    <Text style={styles.cardTitle}>App Vault PIN</Text>
                </View>
                <Text style={styles.cardDesc}>
                    {pinEnabled 
                        ? 'Your app is currently secured with a 4-digit PIN. You will be asked for it every time you open the app.' 
                        : 'Add a 4-digit PIN to secure your local portfolios and prevent unauthorized access on this device.'}
                </Text>

                <TouchableOpacity 
                    style={[styles.saveBtn, { backgroundColor: pinEnabled ? 'transparent' : theme.colors.accent, borderWidth: pinEnabled ? 1 : 0, borderColor: theme.colors.accent }]} 
                    onPress={() => {
                        setAuthAction(pinEnabled ? 'disable' : 'enable');
                        setAuthPin('');
                        setAuthModalVisible(true);
                    }}>
                    <Feather name={pinEnabled ? 'unlock' : 'lock'} size={16} color={pinEnabled ? theme.colors.accent : theme.colors.navy} />
                    <Text style={[styles.saveBtnText, { color: pinEnabled ? theme.colors.accent : theme.colors.navy }]}>
                        {pinEnabled ? 'Disable PIN Lock' : 'Enable PIN Lock'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Auth Modal */}
            <Modal visible={authModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Feather name="shield" size={40} color={theme.colors.accent} style={{alignSelf: 'center', marginBottom: 16}} />
                        <Text style={styles.modalTitle}>{authAction === 'enable' ? 'Set New PIN' : 'Verify Current PIN'}</Text>
                        <Text style={styles.modalSubtitle}>
                            {authAction === 'enable' ? 'Choose a 4-digit numeric code' : 'Enter your 4-digit code to turn off security'}
                        </Text>
                        
                        <TextInput
                            style={styles.pinInput}
                            value={authPin}
                            onChangeText={(text) => setAuthPin(text.replace(/[^0-9]/g, '').slice(0, 4))}
                            keyboardType="number-pad"
                            secureTextEntry={true}
                            autoFocus={true}
                            maxLength={4}
                            placeholder="****"
                            placeholderTextColor={theme.colors.textMuted}
                        />

                        <View style={{flexDirection: 'row', gap: 10, marginTop: 20}}>
                            <TouchableOpacity style={[styles.saveBtn, {flex: 1, backgroundColor: theme.colors.navy}]} onPress={() => setAuthModalVisible(false)}>
                                <Text style={[styles.saveBtnText, {color: theme.colors.textPrimary}]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.saveBtn, {flex: 1}]} onPress={handleAuthSubmit}>
                                <Text style={styles.saveBtnText}>{authAction === 'enable' ? 'Set PIN' : 'Disable'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: theme.colors.navyMid, padding: 24, borderRadius: 16, width: '85%', borderWidth: 1, borderColor: theme.colors.navyLight },
    modalTitle: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
    modalSubtitle: { color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 24 },
    pinInput: { backgroundColor: theme.colors.navy, borderWidth: 1, borderColor: theme.colors.navyLight, padding: 16, borderRadius: 8, color: theme.colors.textPrimary, fontSize: 32, letterSpacing: 16, textAlign: 'center', fontWeight: 'bold' }
});
