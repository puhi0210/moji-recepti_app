import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

type Props = TextInputProps & {
  label: string;
  helper?: string;
};

export function FormTextInput({ label, helper, style, ...props }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        placeholderTextColor="#868e96"
        style={[styles.input, style]}
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
      />

      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
    marginBottom: 12,
  },
  label: {
    color: "#212529",
    fontWeight: "700",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
    color: "#212529",
    fontSize: 16,
  },
  helper: {
    color: "#6c757d",
    fontSize: 12,
  },
});