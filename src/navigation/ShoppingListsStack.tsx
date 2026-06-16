import { Pressable, StyleSheet, Text, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ShoppingListsScreen } from "../screens/shoppingLists/ShoppingListsScreen";
import { ShoppingListDetailScreen } from "../screens/shoppingLists/ShoppingListDetailScreen";
import { useAuthStore } from "../auth/auth.store";

export type ShoppingListsStackParamList = {
  ShoppingLists: undefined;
  ShoppingListDetail: { id: number };
};

const Stack = createNativeStackNavigator<ShoppingListsStackParamList>();

function UserHeaderButton() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const displayName = user?.fullName || user?.name || user?.email || "Uporabnik";

  return (
    <View style={styles.headerRight}>
      <Text style={styles.userName} numberOfLines={1}>
        {displayName}
      </Text>

      <Pressable onPress={logout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Odjava</Text>
      </Pressable>
    </View>
  );
}

export function ShoppingListsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ShoppingLists"
        component={ShoppingListsScreen}
        options={{
          title: "Listki",
          headerRight: () => <UserHeaderButton />,
        }}
      />
      <Stack.Screen
        name="ShoppingListDetail"
        component={ShoppingListDetailScreen}
        options={{
          title: "Nakupovalni listek",
          headerRight: () => <UserHeaderButton />,
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    maxWidth: 190,
  },
  userName: {
    color: "#495057",
    fontSize: 13,
    fontWeight: "600",
    maxWidth: 110,
  },
  logoutButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  logoutText: {
    color: "#0d6efd",
    fontWeight: "700",
  },
});