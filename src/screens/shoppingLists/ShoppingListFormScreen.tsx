import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  createShoppingList,
  getShoppingList,
  updateShoppingList,
  type SaveShoppingListPayload,
} from "../../api/shoppingLists.api";
import { getApiErrorMessage } from "../../api/client";
import { FormActions } from "../../components/FormActions";
import { FormTextInput } from "../../components/FormTextInput";
import type { ShoppingListsStackParamList } from "../../navigation/ShoppingListsStack";

type Props = NativeStackScreenProps<
  ShoppingListsStackParamList,
  "ShoppingListForm"
>;

const STATUSES = [
  { value: "active", label: "Aktiven" },
  { value: "done", label: "Zaključen" },
  { value: "archived", label: "Arhiviran" },
];

export function ShoppingListFormScreen({ navigation, route }: Props) {
  const queryClient = useQueryClient();

  const listId = route.params?.id;
  const isEdit = typeof listId === "number";

  const [name, setName] = useState("");
  const [status, setStatus] = useState("active");
  const [error, setError] = useState("");

  const listQuery = useQuery({
    queryKey: ["shoppingList", listId],
    queryFn: () => getShoppingList(listId as number),
    enabled: isEdit,
  });

  useEffect(() => {
    const list = listQuery.data;

    if (!list) {
      return;
    }

    setName(list.name ?? "");
    setStatus(list.status || "active");
  }, [listQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: SaveShoppingListPayload) => {
      if (isEdit && listId) {
        return updateShoppingList(listId, payload);
      }

      return createShoppingList(payload);
    },
    onSuccess: async (savedList) => {
      await queryClient.invalidateQueries({ queryKey: ["shoppingLists"] });

      if (isEdit && listId) {
        await queryClient.invalidateQueries({
          queryKey: ["shoppingList", listId],
        });
        navigation.goBack();
        return;
      }

      const newId = savedList?.id;

      if (newId) {
        navigation.replace("ShoppingListDetail", { id: newId });
      } else {
        navigation.goBack();
      }
    },
  });

  function buildPayload(): SaveShoppingListPayload {
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new Error("Ime listka je obvezno.");
    }

    return {
      name: trimmedName,
      status,
    };
  }

  async function handleSave() {
    setError("");

    try {
      const payload = buildPayload();
      await saveMutation.mutateAsync(payload);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  if (isEdit && listQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.centerText}>Nalagam listek...</Text>
      </View>
    );
  }

  if (isEdit && listQuery.isError) {
    return (
      <View style={styles.screen}>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Napaka pri nalaganju</Text>
          <Text style={styles.errorText}>
            {getApiErrorMessage(listQuery.error)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>
        {isEdit ? "Uredi listek" : "Nov listek"}
      </Text>

      <FormTextInput
        label="Ime listka *"
        value={name}
        onChangeText={setName}
        placeholder="npr. Tedenski nakup"
      />

      <Text style={styles.label}>Status</Text>

      <View style={styles.statusRow}>
        {STATUSES.map((item) => {
          const active = status === item.value;

          return (
            <Pressable
              key={item.value}
              style={[styles.statusButton, active && styles.statusButtonActive]}
              onPress={() => setStatus(item.value)}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  active && styles.statusButtonTextActive,
                ]}
              >
                {active ? "✓ " : ""}
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.errorTextBox}>{error}</Text> : null}

      <FormActions
        saving={saveMutation.isPending}
        onCancel={() => navigation.goBack()}
        onSave={handleSave}
        saveTitle={isEdit ? "Shrani spremembe" : "Dodaj listek"}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#f8f9fa",
  },
  centerText: {
    color: "#6c757d",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#212529",
    marginBottom: 16,
  },
  label: {
    color: "#212529",
    fontWeight: "700",
    marginBottom: 8,
  },
  statusRow: {
    gap: 8,
    marginBottom: 16,
  },
  statusButton: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ced4da",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  statusButtonActive: {
    backgroundColor: "#e7f5ff",
    borderColor: "#74c0fc",
  },
  statusButtonText: {
    color: "#495057",
    fontWeight: "700",
  },
  statusButtonTextActive: {
    color: "#0b7285",
  },
  errorBox: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff5f5",
    gap: 10,
  },
  errorTitle: {
    color: "#c92a2a",
    fontSize: 16,
    fontWeight: "800",
  },
  errorText: {
    color: "#842029",
  },
  errorTextBox: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#fff5f5",
    color: "#c92a2a",
    marginBottom: 12,
  },
});