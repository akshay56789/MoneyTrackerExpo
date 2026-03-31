import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme';
import { verifyPin } from '../../store/secureStore';

export const PinLockScreen = ({ onUnlock }: { onUnlock: () => void }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        if (pin.length === 4) {
            checkPin();
        }
    }, [pin]);

    const checkPin = async () => {
        const isValid = await verifyPin(pin);
        if (isValid) {
            onUnlock();
        } else {
            setError(true);
            setTimeout(() => setPin(''), 100);
        }
    };

    const handlePress = (num: string) => {
        if (pin.length < 4) {
            setError(false);
            setPin(p => p + num);
        }
    };

    const handleDelete = () => {
        setPin(p => p.slice(0, -1));
    };

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Feather name="lock" size={48} color={theme.colors.accent} />
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Enter your PIN to access your vault</Text>
            </View>

            <View style={styles.dotsContainer}>
                {[0, 1, 2, 3].map(i => (
                    <View key={i} style={[
                        styles.dot, 
                        { backgroundColor: i < pin.length ? theme.colors.accent : 'transparent' },
                        error && styles.dotError
                    ]} />
                ))}
            </View>

            <View style={styles.padContainer}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <TouchableOpacity key={num} style={styles.padButton} onPress={() => handlePress(num.toString())}>
                        <Text style={styles.padText}>{num}</Text>
                    </TouchableOpacity>
                ))}
                <View style={styles.emptyButton} />
                <TouchableOpacity style={styles.padButton} onPress={() => handlePress('0')}>
                    <Text style={styles.padText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.padButton} onPress={handleDelete}>
                    <Feather name="delete" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1, backgroundColor: theme.colors.navy,
        justifyContent: 'center', alignItems: 'center',
        padding: 20
    },
    iconContainer: {
        alignItems: 'center', marginBottom: 50
    },
    title: {
        color: theme.colors.textPrimary, fontSize: 24, fontWeight: 'bold', marginTop: 16
    },
    subtitle: {
        color: theme.colors.textMuted, fontSize: 14, marginTop: 8
    },
    dotsContainer: {
        flexDirection: 'row', gap: 20, marginBottom: 60
    },
    dot: {
        width: 16, height: 16, borderRadius: 8,
        borderWidth: 1, borderColor: theme.colors.accent
    },
    dotError: {
        borderColor: '#FF5252', backgroundColor: 'transparent'
    },
    padContainer: {
        flexDirection: 'row', flexWrap: 'wrap',
        width: 280, justifyContent: 'space-between', rowGap: 30
    },
    padButton: {
        width: 70, height: 70, borderRadius: 35,
        backgroundColor: theme.colors.navyMid,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: theme.colors.navyLight
    },
    emptyButton: {
        width: 70, height: 70
    },
    padText: {
        color: theme.colors.textPrimary, fontSize: 28, fontWeight: 'bold'
    }
});
