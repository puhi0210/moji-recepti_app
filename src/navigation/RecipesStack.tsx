import { Pressable, StyleSheet, Text, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RecipesListScreen } from "../screens/recipes/RecipesListScreen";
import { RecipeDetailScreen } from "../screens/recipes/RecipeDetailScreen";
import { RecipeFormScreen } from "../screens/recipes/RecipeFormScreen";
import { RecipeIngredientFormScreen } from "../screens/recipes/RecipeIngredientFormScreen";
import { useAuthStore } from "../auth/auth.store";
import type { RecipeIngredient } from "../types/recipe.types";

export type RecipesStackParamList = {
  RecipesList: undefined;
  RecipeDetail: { id: number };
  RecipeForm: { id?: number } | undefined;
  RecipeIngredientForm: {
    recipeId: number;
    recipeIngredient?: RecipeIngredient;
  };
};

const Stack = createNativeStackNavigator<RecipesStackParamList>();

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

export function RecipesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RecipesList"
        component={RecipesListScreen}
        options={{
          title: "Recepti",
          headerRight: () => <UserHeaderButton />,
        }}
      />

      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{
          title: "Recept",
          headerRight: () => <UserHeaderButton />,
        }}
      />

      <Stack.Screen
        name="RecipeForm"
        component={RecipeFormScreen}
        options={({ route }) => ({
          title: route.params?.id ? "Uredi recept" : "Nov recept",
        })}
      />

      <Stack.Screen
        name="RecipeIngredientForm"
        component={RecipeIngredientFormScreen}
        options={({ route }) => ({
          title: route.params.recipeIngredient
            ? "Uredi sestavino"
            : "Dodaj sestavino",
        })}
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