// frontend/app/_layout.tsx
import React from "react";
import { Slot } from "expo-router";
import { useFonts } from "expo-font";
import { Platform } from "react-native";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Basier: require("../assets/fonts/BasierCircle-Regular.ttf"),
    BasierBold: require("../assets/fonts/BasierCircle-CondensedBold.ttf"),
  });

  // On web, don't block rendering on font load to avoid white screen if fonts fail to decode.
  if (Platform.OS !== "web" && !fontsLoaded) return null;

  return <Slot />;
}
