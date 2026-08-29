import { useHud } from "./useHud";
import { loadSave } from "@/game/store";
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
      onClick={onClick}
      className={
        primary
          ? "group relative w-72 skew-x-[-12deg] border border-accent bg-accent/15 px-6 py-3 text-sm tracking-[0.35em] text-accent transition-all hover:bg-accent/30 hover:shadow-[0_0_28px_rgba(46,230,255,0.45)]"
          : "w-72 skew-x-[-12deg] border border-hud-line bg-hud-panel px-6 py-3 text-sm tracking-[0.35em] text-foreground/80 transition-all hover:border-accent/70 hover:text-accent"
      }
    >
      <span className="block skew-x-[12deg]">{children}</span>
    </button>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/78 backdrop-blur-[3px] font-display">
      {children}
    </div>
  );
}

export function Overlays({ game }: { game: Game | null }) {
  const s = useHud();
  const save = typeof window === "undefined" ? null : loadSave();

  if (s.screen === "MENU") {
    return (
      <div className="absolute inset-0 z-20 font-display">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
        <div className="absolute inset-y-0 left-0 flex w-full max-w-2xl flex-col justify-center gap-8 px-14">
          <div>
            <div className="text-xs tracking-[0.6em] text-warning">EXPERIMENTAL COMBAT UNIT · 00</div>
            <h1 className="mt-3 text-7xl leading-none tracking-[0.12em] text-foreground drop-shadow-[0_0_30px_rgba(46,230,255,0.35)]">
              ROGUE<span className="text-accent"> ZERO</span>
            </h1>
            <p className="mt-3 text-sm tracking-[0.35em] text-muted-foreground">
              THE MACHINE THAT REFUSED TO DIE.
            </p>
          </div>
          <div className="space-y-3">
            <Btn primary onClick={() => game?.startRun()}>
              START RUN
            </Btn>
            <Btn onClick={() => game?.showGarage()}>GARAGE</Btn>
            <Btn onClick={() => game?.showGarage()}>UPGRADES</Btn>
            <Btn onClick={() => game?.showGarage()}>ARCHIVE</Btn>
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
      <div className="absolute inset-0 z-20 font-display">
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
              className="w-64 border border-hud-line bg-hud-panel p-6 text-left transition-all hover:-translate-y-1 hover:border-accent hover:shadow-[0_0_30px_rgba(46,230,255,0.3)]"
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
