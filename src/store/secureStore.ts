import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'moneytracker_pin';
const PIN_ENABLED_KEY = 'moneytracker_pin_enabled';

export const setPin = async (pin: string): Promise<void> => {
    await SecureStore.setItemAsync(PIN_KEY, pin);
    await SecureStore.setItemAsync(PIN_ENABLED_KEY, 'true');
};

export const verifyPin = async (inputPin: string): Promise<boolean> => {
    const savedPin = await SecureStore.getItemAsync(PIN_KEY);
    return savedPin === inputPin;
};

export const disablePin = async (): Promise<void> => {
    await SecureStore.setItemAsync(PIN_ENABLED_KEY, 'false');
};

export const enablePin = async (): Promise<void> => {
    const savedPin = await SecureStore.getItemAsync(PIN_KEY);
    if (savedPin) {
        await SecureStore.setItemAsync(PIN_ENABLED_KEY, 'true');
    } else {
        throw new Error("No PIN set");
    }
};

export const hasPinEnabled = async (): Promise<boolean> => {
    const enabled = await SecureStore.getItemAsync(PIN_ENABLED_KEY);
    return enabled === 'true';
};
