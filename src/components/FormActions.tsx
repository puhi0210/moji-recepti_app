import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  saving?: boolean;
  onCancel: () => void;
  onSave: () => void;
  saveTitle?: string;
};

export function FormActions({
  saving = false,
  onCancel,
  onSave,
  saveTitle = "Shrani",
}: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.button, styles.cancelButton]}
        onPress={onCancel}
        disabled={saving}
      >
        <Text style={styles.cancelText}>Prekliči</Text>
      </Pressable>

      <Pressable
        style={[styles.button, styles.saveButton, saving && styles.disabled]}
        onPress={onSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.saveText}>{saveTitle}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ced4da",
  },
  saveButton: {
    backgroundColor: "#212529",
  },
  disabled: {
    opacity: 0.65,
  },
  cancelText: {
    color: "#495057",
    fontWeight: "700",
  },
  saveText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});