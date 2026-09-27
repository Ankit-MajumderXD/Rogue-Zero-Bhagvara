import { useSyncExternalStore } from "react";
import { useHud } from "./useHud";
import { loadSave } from "@/game/store";
import { audioStore, sfx } from "@/game/audio";
import type { Game } from "@/game/engine";

function Btn({
  children,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={() => {
        sfx.ui();
        onClick();
      }}
      className={
        primary
          ? "group relative w-72 skew-x-[-12deg] border border-accent bg-accent/15 px-6 py-3 text-sm tracking-[0.35em] text-accent transition-all duration-200 hover:bg-accent/30 hover:shadow-[0_0_28px_rgba(46,230,255,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
          : "w-72 skew-x-[-12deg] border border-hud-line bg-hud-panel px-6 py-3 text-sm tracking-[0.35em] text-foreground/80 transition-all duration-200 hover:border-accent/70 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
      }
    >
      <span className="block skew-x-[12deg]">{children}</span>
    </button>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="overlay-enter absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/78 backdrop-blur-[3px] font-display">
      {children}
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block w-72">
      <span className="mb-2 flex justify-between text-[10px] tracking-[0.3em] text-muted-foreground">
        <span>{label}</span>
        <span className="text-accent tabular-nums">{Math.round(value * 100)}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-hud-line accent-[oklch(0.84_0.15_205)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      />
    </label>
  );
}

function SettingsPanel({ game }: { game: Game | null }) {
  const prefs = useSyncExternalStore(audioStore.subscribe, audioStore.get, audioStore.get);
  return (
    <Panel>
      <h2 className="text-4xl tracking-[0.4em] text-accent">SETTINGS</h2>
      <p className="mt-2 text-[10px] tracking-[0.35em] text-muted-foreground">
        AUDIO SYSTEMS · PREFERENCES SAVED AUTOMATICALLY
      </p>
      <div className="mt-10 space-y-6">
        <Slider label="MUSIC" value={prefs.music} onChange={(v) => sfx.setMusicVolume(v)} />
        <Slider label="SOUND EFFECTS" value={prefs.sfx} onChange={(v) => sfx.setSfxVolume(v)} />
        <button
          onClick={() => {
            sfx.setMuted(!prefs.muted);
            sfx.ui();
          }}
          aria-pressed={prefs.muted}
          className="w-72 skew-x-[-12deg] border border-hud-line bg-hud-panel px-6 py-3 text-sm tracking-[0.35em] transition-all duration-200 hover:border-accent/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] text-foreground/80"
        >
          <span className="block skew-x-[12deg]">
            {prefs.muted ? <span className="text-warning">MUTED</span> : <span className="text-accent">SOUND ON</span>}
          </span>
        </button>
      </div>
      <p className="mt-8 max-w-sm text-center text-[10px] leading-relaxed tracking-[0.2em] text-muted-foreground">
        ALL MUSIC AND SOUND EFFECTS ARE ORIGINAL, GENERATED LIVE IN YOUR BROWSER.
      </p>
      <div className="mt-8">
        <Btn primary onClick={() => game?.toMenu()}>
          BACK
        </Btn>
      </div>
    </Panel>
  );
}

export function Overlays({ game }: { game: Game | null }) {
  const s = useHud();
  const save = typeof window === "undefined" ? null : loadSave();

  if (s.screen === "MENU") {
    return (
      <div className="overlay-enter absolute inset-0 z-20 font-display">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
        <div className="absolute inset-y-0 left-0 flex w-full max-w-2xl flex-col justify-center gap-8 px-14">
          <div>
            <div className="text-xs tracking-[0.6em] text-warning">EXPERIMENTAL COMBAT UNIT · 00</div>
            <h2 className="mt-3 text-7xl leading-none tracking-[0.12em] text-foreground drop-shadow-[0_0_30px_rgba(46,230,255,0.35)]">
              ROGUE<span className="text-accent"> ZERO</span>
            </h2>

            <p className="mt-3 text-sm tracking-[0.35em] text-muted-foreground">
              THE MACHINE THAT REFUSED TO DIE.
            </p>
          </div>
          <div className="space-y-3">
            <Btn primary onClick={() => game?.startRun()}>
              START RUN
            </Btn>
            <Btn onClick={() => game?.showGarage()}>GARAGE</Btn>
            <Btn onClick={() => game?.showSettings()}>SETTINGS</Btn>
          </div>
          <div className="text-[10px] tracking-[0.3em] text-muted-foreground">
            WASD MOVE · MOUSE AIM · LMB FIRE · SHIFT SPRINT · SPACE DASH · E BLADE · Q EMP · ESC PAUSE
            {save ? (
              <div className="mt-2 text-accent/70">
                BEST WAVE {save.bestWave} · RUNS {save.runs} · VICTORIES {save.victories}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (s.screen === "SETTINGS") {
    return <SettingsPanel game={game} />;
  }

  if (s.screen === "GARAGE") {
    const stats = [
      ["LEVEL", String(s.level)],
      ["HP", String(s.maxHp)],
      ["ENERGY", String(s.maxEnergy)],
      ["DAMAGE", "24 / SHOT"],
      ["ARMOR", "MK-II PLATE"],
      ["MOBILITY", "DASH CORE"],
    ];
    return (
      <div className="overlay-enter absolute inset-0 z-20 font-display">
        <div className="absolute inset-y-0 right-0 w-full max-w-md bg-background/80 p-10 backdrop-blur">
          <h2 className="text-3xl tracking-[0.3em] text-accent">GARAGE</h2>
          <p className="mt-1 text-[10px] tracking-[0.3em] text-muted-foreground">
            UNIT ZERO · CHASSIS DIAGNOSTICS
          </p>
          <div className="mt-8 space-y-3">
            {stats.map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-hud-line pb-2 text-xs tracking-[0.25em]">
                <span className="text-muted-foreground">{k}</span>
                <span className="text-foreground">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 text-[10px] tracking-[0.25em]">
            {["WEAPON · PLASMA RIFLE", "CORE · ARC CELL", "ARMOR · MK-II", "MOBILITY · DASH V2"].map((m) => (
              <div key={m} className="border border-hud-line bg-hud-panel p-3 text-accent/80">
                {m}
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Btn primary onClick={() => game?.toMenu()}>
              BACK
            </Btn>
          </div>
        </div>
      </div>
    );
  }

  if (s.screen === "PAUSED") {
    return (
      <Panel>
        <h2 className="text-5xl tracking-[0.45em] text-accent">PAUSED</h2>
        <div className="mt-10 space-y-3">
          <Btn primary onClick={() => game?.resume()}>
            RESUME
          </Btn>
          <Btn onClick={() => game?.startRun()}>RESTART RUN</Btn>
          <Btn onClick={() => game?.showSettings()}>SETTINGS</Btn>
          <Btn onClick={() => game?.toMenu()}>QUIT TO MENU</Btn>
        </div>
      </Panel>
    );
  }

  if (s.screen === "UPGRADE") {
    return (
      <Panel>
        <h2 className="text-4xl tracking-[0.4em] text-accent">CHOOSE YOUR UPGRADE</h2>
        <p className="mt-2 text-[10px] tracking-[0.35em] text-muted-foreground">
          SALVAGED SUBROUTINE · SELECT ONE
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-6">
          {s.choices.map((c) => (
            <button
              key={c.id}
              onClick={() => game?.chooseUpgrade(c.id)}
              className="w-64 border border-hud-line bg-hud-panel p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-[0_0_30px_rgba(46,230,255,0.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
            >
              <div className="text-sm tracking-[0.25em] text-accent">{c.name}</div>
              <div className="mt-3 text-xs leading-relaxed tracking-wider text-muted-foreground">
                {c.desc}
              </div>
            </button>
          ))}
        </div>
        {s.ownedUpgrades.length > 0 && (
          <div className="mt-10 text-[10px] tracking-[0.3em] text-muted-foreground">
            INSTALLED: {s.ownedUpgrades.join(" · ")}
          </div>
        )}
      </Panel>
    );
  }

  if (s.screen === "DEFEAT" || s.screen === "VICTORY") {
    const win = s.screen === "VICTORY";
    return (
      <Panel>
        <h2
          className={
            win
              ? "text-5xl tracking-[0.4em] text-accent drop-shadow-[0_0_24px_rgba(46,230,255,0.5)]"
              : "text-5xl tracking-[0.4em] text-warning drop-shadow-[0_0_24px_rgba(255,59,48,0.5)]"
          }
        >
          {win ? "FACILITY PURGED" : "SYSTEM FAILURE"}
        </h2>
        <p className="mt-2 text-xs tracking-[0.4em] text-muted-foreground">
          {win ? "THE WARDEN IS OFFLINE" : "RUN ENDED"}
        </p>
        <div className="mt-10 grid grid-cols-2 gap-x-14 gap-y-4 text-xs tracking-[0.25em]">
          {[
            ["ENEMIES DEFEATED", String(s.kills)],
            ["WAVE REACHED", String(s.wave)],
            ["XP TOTAL", s.xp.toLocaleString()],
            ["CREDITS", s.credits.toLocaleString()],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col">
              <span className="text-muted-foreground">{k}</span>
              <span className="mt-1 text-2xl text-foreground tabular-nums">{v}</span>
            </div>
          ))}
        </div>
        <div className="mt-12 space-y-3">
          <Btn primary onClick={() => game?.startRun()}>
            RESTART RUN
          </Btn>
          <Btn onClick={() => game?.toMenu()}>MAIN MENU</Btn>
        </div>
      </Panel>
    );
  }

  return null;
}
