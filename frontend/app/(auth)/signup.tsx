/* frontend/app/(auth)/signup.tsx */
import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { storage } from "@/lib/storage";     // ✅ unified storage helper
import { signup }  from "../../lib/api";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const router            = useRouter();

  async function handleSignup() {
    try {
      const { token } = await signup(email, pass);   // ① call backend
      await storage.setItem("token", token);         // ② store once (web/native handled inside)
      router.replace("/");                           // ③ go to main app
    } catch (err: any) {
      alert(err.message ?? "Sign‑up failed");
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Sign up" }} />

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

      <Button title="Create account" onPress={handleSignup} />
      <Button
        title="Already have an account? Log in"
        onPress={() => router.push("/login")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12, padding: 24, justifyContent: "center" },
  input:     { borderWidth: 1, padding: 8, borderRadius: 6 },
});
