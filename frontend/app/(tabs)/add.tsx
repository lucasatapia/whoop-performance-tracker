// app/(tabs)/add.tsx
import React, { useState } from "react";
import { ScrollView, Text, TextInput, Pressable } from "react-native";
import { storage } from "@/lib/storage";          // ✅ wrapper (localStorage on web, SecureStore native)
import { postWorkout } from "@/lib/api";
import { EXERCISES, ExerciseName } from "@/constants/exercises";
import { Card } from "@/ui/Card";
import { theme } from "@/theme";

/* ——— Local‑time ISO helper ——— */
function todayLocalISO(): string {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export default function AddWorkout() {
  const [exercise, setExercise] = useState<ExerciseName>("Bench Press");
  const [date, setDate]         = useState(todayLocalISO());
  const [weight, setWeight]     = useState("");
  const [reps, setReps]         = useState("");

  /* ——— Save handler ——— */
  const onSave = async () => {
    try {
      const token = await storage.getItem("token");      // ⬅ unified storage
      if (!token) return alert("Not logged in");

      await postWorkout(token, {
        date,
        note: "",
        sets: [
          {
            exercise,
            weight_kg: weight ? Number(weight) : null,
            reps:      reps   ? Number(reps)   : null,
            is_top_set: false,
          },
        ],
      });

      setWeight("");
      setReps("");
      alert("Workout saved!");
    } catch (err: any) {
      console.error(err);
      alert("Save failed");
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        padding: theme.spacing(4),
        gap:     theme.spacing(4),
        backgroundColor: theme.colors.bg,
      }}
    >
      <Text style={{ fontSize: 24, fontFamily: theme.fonts.headline, color: theme.colors.text }}>
        Log Workout
      </Text>

      {/* ——— Exercise picker ——— */}
      <Card>
        <Text style={{ color: theme.colors.text, marginBottom: theme.spacing(2) }}>
          Exercise
        </Text>
        {EXERCISES.map((ex) => (
          <Pressable
            key={ex}
            onPress={() => setExercise(ex)}
            style={{
              marginRight: theme.spacing(2),
              marginBottom: theme.spacing(2),
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: ex === exercise ? theme.colors.accent : theme.colors.muted,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: theme.colors.text }}>{ex}</Text>
          </Pressable>
        ))}
      </Card>

      {/* ——— Weight + reps ——— */}
      <Card>
        <Text style={{ color: theme.colors.text }}>Weight</Text>
        <TextInput
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
          placeholder="e.g. 100"
          placeholderTextColor={theme.colors.muted}
          style={{
            color: theme.colors.text,
            borderBottomWidth: 1,
            borderColor: theme.colors.muted,
            marginBottom: theme.spacing(4),
          }}
        />

        <Text style={{ color: theme.colors.text }}>Reps</Text>
        <TextInput
          keyboardType="numeric"
          value={reps}
          onChangeText={setReps}
          placeholder="e.g. 5"
          placeholderTextColor={theme.colors.muted}
          style={{
            color: theme.colors.text,
            borderBottomWidth: 1,
            borderColor: theme.colors.muted,
          }}
        />
      </Card>

      {/* ——— Date ——— */}
      <Card>
        <Text style={{ color: theme.colors.text }}>Date (YYYY‑MM‑DD)</Text>
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="2025-06-17"
          placeholderTextColor={theme.colors.muted}
          style={{
            color: theme.colors.text,
            borderBottomWidth: 1,
            borderColor: theme.colors.muted,
          }}
        />
      </Card>

      {/* ——— Save button ——— */}
      <Pressable
        onPress={onSave}
        style={{
          backgroundColor: theme.colors.accent,
          paddingVertical: theme.spacing(4),
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ fontFamily: theme.fonts.headline, color: theme.colors.bg }}>
          Save
        </Text>
      </Pressable>
    </ScrollView>
  );
}
