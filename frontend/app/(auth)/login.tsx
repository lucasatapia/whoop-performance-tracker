// frontend/app/(auth)/login.tsx
import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { storage } from "@/lib/storage";   // ✅ wrapper → SecureStore on native, localStorage on web
import { login } from "../../lib/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const router            = useRouter();

  async function handleLogin() {
    try {
      const { token } = await login(email, pass);
      await storage.setItem("token", token);   // store once (web/native handled inside)
      router.replace("/");                     // go to main tabs
    } catch (err: any) {
      alert(err.message ?? "Log‑in failed");
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Log in" }} />

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={pass}
        onChangeText={setPass}
        style={styles.input}
      />

      <Button title="Log in" onPress={handleLogin} />
      <Button
        title="Need an account? Sign up"
        onPress={() => router.push("/signup")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12, padding: 24, justifyContent: "center" },
  input:     { borderWidth: 1, padding: 8, borderRadius: 6 },
});
