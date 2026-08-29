// Lightweight external store for HUD/menu state. The 3D simulation writes here
// at a throttled rate; React subscribes via useSyncExternalStore.

export type GameScreen =
  | "MENU"
  | "GARAGE"
  | "ARCHIVE"
  | "SETTINGS"
  | "LOADING"
  | "PLAYING"
  | "PAUSED"
  | "WAVE_COMPLETE"
  | "UPGRADE"
  | "VICTORY"
  | "DEFEAT";

export type Upgrade = {
  id: string;
  name: string;
  desc: string;
  apply: (m: Modifiers) => void;
};

export type Modifiers = {
  damage: number;
  fireRate: number;
  dashCd: number;
  empRadius: number;
  maxHp: number;
  regen: number;
  moveSpeed: number;
  energyRegen: number;
};

export type HudState = {
  screen: GameScreen;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  dashReady: number; // 0..1
  empReady: number; // 0..1
  wave: number;
  totalWaves: number;
  enemiesLeft: number;
  xp: number;
  credits: number;
  level: number;
  kills: number;
  objective: string;
  bossName: string | null;
  bossHp: number;
  bossPhase: number;
  choices: Upgrade[];
  ownedUpgrades: string[];
  damageFlash: number;
  toast: string | null;
  locked: boolean;
};

export type SaveData = {
  xp: number;
  credits: number;
  level: number;
  bestWave: number;
  runs: number;
  victories: number;
};

const SAVE_KEY = "rogue-zero-save-v1";

export function loadSave(): SaveData {
  if (typeof localStorage === "undefined")
    return { xp: 0, credits: 0, level: 1, bestWave: 0, runs: 0, victories: 0 };
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return { ...emptySave(), ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return emptySave();
}

function emptySave(): SaveData {
  return { xp: 0, credits: 0, level: 1, bestWave: 0, runs: 0, victories: 0 };
}

export function persistSave(data: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

const listeners = new Set<() => void>();

let state: HudState = {
  screen: "MENU",
  hp: 100,
  maxHp: 100,
  energy: 100,
  maxEnergy: 100,
  dashReady: 1,
  empReady: 1,
  wave: 0,
  totalWaves: 5,
  enemiesLeft: 0,
  xp: 0,
  credits: 0,
  level: 1,
  kills: 0,
  objective: "Awaiting activation",
  bossName: null,
  bossHp: 1,
  bossPhase: 1,
  choices: [],
  ownedUpgrades: [],
  damageFlash: 0,
  toast: null,
  locked: false,
};

export const hudStore = {
  get: () => state,
  set(patch: Partial<HudState>) {
    let changed = false;
    for (const k of Object.keys(patch) as (keyof HudState)[]) {
      if (state[k] !== patch[k]) changed = true;
    }
    if (!changed) return;
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
