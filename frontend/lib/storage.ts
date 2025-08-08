// frontend/lib/storage.ts
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

type Adapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  isAvailable: () => Promise<boolean>;
};

const web: Adapter = {
  async getItem(key) {
    return typeof localStorage !== "undefined"
      ? localStorage.getItem(key)
      : null;
  },
  async setItem(key, value) {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
  },
  async removeItem(key) {
    if (typeof localStorage !== "undefined") localStorage.removeItem(key);
  },
  async isAvailable() {
    return typeof localStorage !== "undefined";
  },
};

const native: Adapter = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
  isAvailable: SecureStore.isAvailableAsync,
};

export const storage: Adapter = Platform.OS === "web" ? web : native;
export default storage; // optional, keeps both named and default exports
