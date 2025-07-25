// app/_layout.tsx
import React from "react";
import { Slot } from "expo-router";
import { Platform } from "react-native";
import { useFonts } from "expo-font";

export default function RootLayout() {
  // Load Basier TTFs everywhere (native + web)
  const [fontsLoaded] = useFonts({
    Basier:     require("../assets/fonts/BasierCircle-Regular.ttf"),
    BasierBold: require("../assets/fonts/BasierCircle-CondensedBold.ttf"),
  });

  // On native, hold the splash until fonts finish loading
  if (Platform.OS !== "web" && !fontsLoaded) {
    return null;
  }

  return <Slot />;
}
