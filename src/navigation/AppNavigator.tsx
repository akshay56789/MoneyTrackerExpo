import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PortfoliosScreen } from '../ui/screens/PortfoliosScreen';
import { PortfolioDetailScreen } from '../ui/screens/PortfolioDetailScreen';
import { TransactionsScreen } from '../ui/screens/TransactionsScreen';
import { theme } from '../ui/theme';

export type RootStackParamList = {
  Portfolios: undefined;
  PortfolioDetail: { portfolioId: number; portfolioName: string };
  Transactions: { portfolioId?: number };
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
        options={{ title: 'MoneyTracker' }} 
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
    </Stack.Navigator>
  );
};
