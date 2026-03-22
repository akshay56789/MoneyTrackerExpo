import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initDB } from './src/db/DatabaseService';
import { useStore } from './src/store/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { theme } from './src/ui/theme';

export default function App() {
  const { loading, loadData } = useStore();
  const [dbReady, setDbReady] = React.useState(false);

  useEffect(() => {
    initDB();
    setDbReady(true);
    loadData();
  }, []);

  if (!dbReady || loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="light" />
        </NavigationContainer>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
