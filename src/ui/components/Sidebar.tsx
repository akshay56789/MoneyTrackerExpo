import React, { useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Animated, Dimensions, TouchableWithoutFeedback, ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useStore } from '../../store/store';
import { theme } from '../theme';

const SIDEBAR_WIDTH = Dimensions.get('window').width * 0.72;

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface SidebarMenuItem {
    icon: string;
    label: string;
    sublabel: string;
    screen: keyof RootStackParamList;
}

const MENU_ITEMS: SidebarMenuItem[] = [
    {
        icon: 'search',
        label: 'Ticker Search',
        sublabel: 'Find stocks & ETF symbols',
        screen: 'TickerSearch',
    },
    {
        icon: 'settings',
        label: 'Settings',
        sublabel: 'Exchange rate & preferences',
        screen: 'Settings',
    },
    {
        icon: 'clock',
        label: 'Transaction History',
        sublabel: 'Full ledger of trades',
        screen: 'Transactions',
    },
];

interface Props {
    visible: boolean;
    onClose: () => void;
}

export const Sidebar = ({ visible, onClose }: Props) => {
    const navigation = useNavigation<NavigationProp>();
    const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

    React.useEffect(() => {
        Animated.timing(translateX, {
            toValue: visible ? 0 : -SIDEBAR_WIDTH,
            duration: 280,
            useNativeDriver: true,
        }).start();
    }, [visible]);

    const navigate = (screen: keyof RootStackParamList) => {
        onClose();
        setTimeout(() => {
            navigation.navigate(screen as any);
        }, 180);
    };

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            {/* Dimmed backdrop */}
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.backdrop} />
            </TouchableWithoutFeedback>

            {/* Sidebar Panel */}
            <Animated.View style={[styles.sidebar, { transform: [{ translateX }] }]}>
                <View style={styles.header}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoText}>M</Text>
                    </View>
                    <View>
                        <Text style={styles.appName}>MoneyTracker</Text>
                        <Text style={styles.appTagline}>Your wealth, visualized</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.menu}>
                    {MENU_ITEMS.map((item) => (
                        <TouchableOpacity
                            key={item.screen}
                            style={styles.menuItem}
                            onPress={() => navigate(item.screen)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.menuIconCircle}>
                                <Feather name={item.icon as any} size={18} color={theme.colors.accent} />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={styles.menuLabel}>{item.label}</Text>
                                <Text style={styles.menuSublabel}>{item.sublabel}</Text>
                            </View>
                            <Feather name="chevron-right" size={16} color={theme.colors.textMuted} />
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.divider} />

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Powered by Finnhub & AlphaVantage</Text>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 1000,
        flexDirection: 'row',
    },
    backdrop: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sidebar: {
        width: SIDEBAR_WIDTH,
        height: '100%',
        backgroundColor: theme.colors.navyMid,
        borderRightWidth: 1,
        borderRightColor: theme.colors.navyLight,
        paddingTop: 60,
        paddingBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 6, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 14,
    },
    logoCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: theme.colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        color: theme.colors.navy,
        fontSize: 22,
        fontWeight: 'bold',
    },
    appName: {
        color: theme.colors.textPrimary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    appTagline: {
        color: theme.colors.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.navyLight,
        marginHorizontal: 20,
        marginBottom: 16,
    },
    menu: {
        flex: 1,
        paddingHorizontal: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 4,
    },
    menuIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(0,230,118,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuText: { flex: 1 },
    menuLabel: {
        color: theme.colors.textPrimary,
        fontSize: 15,
        fontWeight: 'bold',
    },
    menuSublabel: {
        color: theme.colors.textMuted,
        fontSize: 11,
        marginTop: 2,
    },
    cloudBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        marginBottom: 8,
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.navyLight,
    },
    footerText: {
        color: theme.colors.textMuted,
        fontSize: 11,
        textAlign: 'center',
    },
});
