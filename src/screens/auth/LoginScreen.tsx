import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { getApiErrorMessage } from "../../api/client";
import { useAuthStore } from "../../auth/auth.store";
import {
  getServerBaseUrl,
  resetServerBaseUrl,
  saveServerBaseUrl,
} from "../../utils/serverUrlStorage";

export function LoginScreen() {
  const login = useAuthStore((state) => state.login);

  const [serverUrl, setServerUrl] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingServerUrl, setIsLoadingServerUrl] = useState(true);

  useEffect(() => {
    async function loadServerUrl() {
      try {
        const currentServerUrl = await getServerBaseUrl();
        setServerUrl(currentServerUrl);
      } catch {
        setError("Napaka pri nalaganju naslova strežnika.");
      } finally {
        setIsLoadingServerUrl(false);
      }
    }

    loadServerUrl();
  }, []);

  async function handleResetServerUrl() {
    setError("");

    try {
      await resetServerBaseUrl();
      const currentServerUrl = await getServerBaseUrl();
      setServerUrl(currentServerUrl);
    } catch {
      setError("Napaka pri ponastavitvi naslova strežnika.");
    }
  }

  async function handleLogin() {
    setError("");

    if (!serverUrl.trim()) {
      setError("Vnesi naslov strežnika.");
      return;
    }

    if (!serverUrl.startsWith("http://") && !serverUrl.startsWith("https://")) {
      setError("Naslov strežnika se mora začeti s http:// ali https://.");
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError("Vnesi email in geslo.");
      return;
    }

    setIsSubmitting(true);

    try {
      await saveServerBaseUrl(serverUrl);
      await login(email.trim(), password);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingServerUrl) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Nalagam nastavitve...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Moji Recepti</Text>
          <Text style={styles.subtitle}>Prijavi se v svoj račun</Text>

          <Text style={styles.sectionTitle}>Strežnik</Text>

          <Text style={styles.label}>API naslov</Text>
          <TextInput
            style={styles.input}
            placeholder="http://192.168.1.50:3000"
            placeholderTextColor="#868e96"
            value={serverUrl}
            onChangeText={setServerUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Text style={styles.helperText}>
            Za Expo Go na telefonu uporabi IP računalnika, ne localhost.
          </Text>

          <Pressable style={styles.secondaryButton} onPress={handleResetServerUrl}>
            <Text style={styles.secondaryButtonText}>
              Ponastavi na .env naslov
            </Text>
          </Pressable>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Prijava</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            placeholderTextColor="#868e96"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Geslo</Text>
          <TextInput
            style={styles.input}
            placeholder="Geslo"
            placeholderTextColor="#868e96"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.buttonText}>Prijava</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  loadingText: {
    color: "#495057",
  },
  screen: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    gap: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#212529",
  },
  subtitle: {
    color: "#6c757d",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#212529",
    marginTop: 6,
  },
  label: {
    fontWeight: "700",
    color: "#212529",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#212529",
    backgroundColor: "#ffffff",
    marginBottom: 4,
  },
  helperText: {
    color: "#6c757d",
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: "#e9ecef",
    marginVertical: 12,
  },
  error: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#fff5f5",
    color: "#c92a2a",
  },
  button: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: "#212529",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ced4da",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  secondaryButtonText: {
    color: "#495057",
    fontWeight: "700",
  },
});