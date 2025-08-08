// frontend/app/index.tsx
import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { storage } from "@/lib/storage";

export default function Index() {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const once = useRef(false);

  useEffect(() => {
    (async () => {
      const t = await storage.getItem("token");
      setAuthed(!!t);
      setChecked(true);
    })();
  }, []);

  useEffect(() => {
    if (!checked || once.current) return;
    once.current = true;
    router.replace(authed ? "/(tabs)/add" : "/login");
  }, [checked, authed]);

  return null;
}
