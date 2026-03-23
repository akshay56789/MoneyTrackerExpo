import { create } from 'zustand';

interface SettingsState {
    usdToInr: number;
    setUsdToInr: (rate: number) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    usdToInr: 84.0, // default fallback
    setUsdToInr: (rate: number) => set({ usdToInr: rate }),
}));

/**
 * Helper: Convert a USD amount to INR
 */
export const toInr = (usdAmount: number, rate: number): number => {
    return usdAmount * rate;
};

/**
 * Helper: Format currency with correct symbol based on region
 */
export const formatCurrency = (amount: number, region: 'US' | 'IN'): string => {
    if (region === 'IN') {
        return `₹${amount.toFixed(2)}`;
    }
    return `$${amount.toFixed(2)}`;
};
