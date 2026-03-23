import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PortfoliosScreen } from '../ui/screens/PortfoliosScreen';
import { PortfolioDetailScreen } from '../ui/screens/PortfolioDetailScreen';
import { TransactionsScreen } from '../ui/screens/TransactionsScreen';
import { SettingsScreen } from '../ui/screens/SettingsScreen';
import { TickerSearchScreen } from '../ui/screens/TickerSearchScreen';
import { theme } from '../ui/theme';

export type RootStackParamList = {
  Portfolios: undefined;
  PortfolioDetail: { portfolioId: number; portfolioName: string };
  Transactions: { portfolioId?: number };
  Settings: undefined;
  TickerSearch: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.navy,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        cardStyle: { backgroundColor: theme.colors.navy },
      }}
    >
      <Stack.Screen 
        name="Portfolios" 
        component={PortfoliosScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="PortfolioDetail" 
        component={PortfolioDetailScreen} 
        options={({ route }) => ({ title: route.params.portfolioName })} 
      />
      <Stack.Screen 
        name="Transactions" 
        component={TransactionsScreen} 
        options={{ title: 'Transaction History' }} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }} 
      />
      <Stack.Screen 
        name="TickerSearch" 
        component={TickerSearchScreen} 
        options={{ title: 'Find Ticker Symbol' }} 
      />
    </Stack.Navigator>
  );
};
