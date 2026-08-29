import { useSyncExternalStore } from "react";
import { hudStore, type HudState } from "@/game/store";

export function useHud(): HudState {
  return useSyncExternalStore(hudStore.subscribe, hudStore.get, hudStore.get);
}
