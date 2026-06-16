import { Pressable, StyleSheet, Text, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { InventoryListScreen } from "../screens/inventory/InventoryListScreen";
import { InventoryDetailScreen } from "../screens/inventory/InventoryDetailScreen";
import { useAuthStore } from "../auth/auth.store";

export type InventoryStackParamList = {
  InventoryList: undefined;
  InventoryDetail: { id: number };
};

const Stack = createNativeStackNavigator<InventoryStackParamList>();

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

export function InventoryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="InventoryList"
        component={InventoryListScreen}
        options={{
          title: "Inventar",
          headerRight: () => <UserHeaderButton />,
        }}
      />
      <Stack.Screen
        name="InventoryDetail"
        component={InventoryDetailScreen}
        options={{
          title: "Sestavina",
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