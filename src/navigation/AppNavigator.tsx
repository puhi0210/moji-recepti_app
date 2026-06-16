import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { useAuthStore } from "../auth/auth.store";
import { setUnauthorizedHandler } from "../api/client";
import { RecipesStack } from "./RecipesStack";
import { InventoryStack } from "./InventoryStack";
import { ShoppingListsStack } from "./ShoppingListsStack";

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Recepti"
        component={RecipesStack}
        options={{ title: "Recepti" }}
      />
      <Tab.Screen
        name="Inventar"
        component={InventoryStack}
        options={{ title: "Inventar" }}
      />
      <Tab.Screen
        name="Listki"
        component={ShoppingListsStack}
        options={{ title: "Listki" }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hydrate = useAuthStore((state) => state.hydrate);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    hydrate();
  }, [hydrate, logout]);

  if (!isHydrated) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator />
        <Text style={styles.text}>Preverjam prijavo...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <LoginScreen />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#f8f9fa",
  },
  text: {
    fontSize: 16,
    color: "#495057",
  },
});