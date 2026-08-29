import { useEffect, useState } from "react";
import { useHud } from "./useHud";

function Bar({
  value,
  max,
  variant,
}: {
  value: number;
  max: number;
  variant: "hp" | "energy";
}) {
  const pct = Math.max(0, Math.min(1, value / max)) * 100;
  return (
    <div className="h-2 w-44 skew-x-[-14deg] border border-hud-line bg-hud-panel">
      <div
        className={
          variant === "hp"
            ? "h-full bg-gradient-to-r from-hp-low to-hp-high transition-[width] duration-150"
            : "h-full bg-gradient-to-r from-accent-dim to-accent transition-[width] duration-150"
        }
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Hud() {
  const s = useHud();
  const [flash, setFlash] = useState(0);

  useEffect(() => {
    if (!s.damageFlash) return;
    setFlash(1);
    const id = setTimeout(() => setFlash(0), 260);
    return () => clearTimeout(id);
  }, [s.damageFlash]);

  const playing = s.screen === "PLAYING" || s.screen === "WAVE_COMPLETE";
  if (!playing && s.screen !== "PAUSED" && s.screen !== "UPGRADE") return null;

  return (
    <div className="pointer-events-none absolute inset-0 select-none font-display">
      {/* damage vignette */}
      <div
        className="absolute inset-0 transition-opacity duration-200"
        style={{
          opacity: flash,
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(255,50,40,0.55) 100%)",
        }}
      />

      {/* top left — status */}
      <div className="absolute left-6 top-5 space-y-1.5">
        <div className="flex items-baseline gap-2">
          <span className="text-lg tracking-[0.35em] text-foreground">ZERO</span>
          <span className="text-xs tracking-widest text-accent">LV {String(s.level).padStart(2, "0")}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-14 text-[10px] tracking-[0.25em] text-muted-foreground">HP</span>
          <Bar value={s.hp} max={s.maxHp} variant="hp" />
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {s.hp}/{s.maxHp}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-14 text-[10px] tracking-[0.25em] text-muted-foreground">ENERGY</span>
          <Bar value={s.energy} max={s.maxEnergy} variant="energy" />
        </div>
      </div>

      {/* top center — wave / boss */}
      <div className="absolute left-1/2 top-5 -translate-x-1/2 text-center">
        <div className="text-xs tracking-[0.4em] text-muted-foreground">
          {s.bossName ? "FINAL ENCOUNTER" : `WAVE ${String(s.wave).padStart(2, "0")} / ${String(s.totalWaves).padStart(2, "0")}`}
        </div>
        {s.bossName ? (
          <div className="mt-2 w-[46vw] min-w-72">
            <div className="flex items-center justify-between text-[10px] tracking-[0.3em] text-warning">
              <span>{s.bossName}</span>
              <span>PHASE {s.bossPhase}</span>
            </div>
            <div className="mt-1 h-3 border border-warning/60 bg-hud-panel">
              <div
                className="h-full bg-gradient-to-r from-warning to-hp-low transition-[width] duration-200"
                style={{ width: `${s.bossHp * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-1 text-[10px] tracking-[0.3em] text-accent/80">
            HOSTILES {s.enemiesLeft}
          </div>
        )}
      </div>

      {/* top right — economy */}
      <div className="absolute right-6 top-5 text-right text-[11px] tracking-[0.25em]">
        <div className="text-muted-foreground">XP</div>
        <div className="text-base text-accent tabular-nums">{s.xp.toLocaleString()}</div>
        <div className="mt-1 text-muted-foreground">CREDITS</div>
        <div className="text-base text-warning tabular-nums">{s.credits.toLocaleString()}</div>
      </div>

      {/* crosshair */}
      {s.screen === "PLAYING" && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative h-6 w-6">
            <span className="absolute left-1/2 top-0 h-1.5 w-px -translate-x-1/2 bg-accent" />
            <span className="absolute bottom-0 left-1/2 h-1.5 w-px -translate-x-1/2 bg-accent" />
            <span className="absolute left-0 top-1/2 h-px w-1.5 -translate-y-1/2 bg-accent" />
            <span className="absolute right-0 top-1/2 h-px w-1.5 -translate-y-1/2 bg-accent" />
            <span className="absolute left-1/2 top-1/2 h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
          </div>
        </div>
      )}

      {/* bottom right — loadout */}
      <div className="absolute bottom-5 right-6 space-y-1 text-right text-[10px] tracking-[0.25em] text-muted-foreground">
        <div className="text-sm tracking-[0.3em] text-foreground">PLASMA RIFLE</div>
        <div>[ LMB ] FIRE · [ RMB ] AIM</div>
        <div className={s.empReady >= 1 ? "text-accent" : ""}>
          EMP [ Q ] {s.empReady >= 1 ? "READY" : `${Math.round(s.empReady * 100)}%`}
        </div>
        <div className={s.dashReady >= 1 ? "text-accent" : ""}>
          DASH [ SPACE ] {s.dashReady >= 1 ? "READY" : `${Math.round(s.dashReady * 100)}%`}
        </div>
        <div>BLADE [ E ] · SPRINT [ SHIFT ]</div>
      </div>

      {/* bottom left — objective */}
      <div className="absolute bottom-5 left-6 max-w-xs text-[10px] tracking-[0.25em] text-muted-foreground">
        <div className="text-accent">OBJECTIVE</div>
        <div className="mt-1 text-foreground/80">{s.objective}</div>
      </div>

      {/* toast */}
      {s.toast && (
        <div className="absolute left-1/2 top-[28%] -translate-x-1/2 animate-pulse text-center text-3xl tracking-[0.45em] text-accent drop-shadow-[0_0_18px_rgba(46,230,255,0.6)]">
          {s.toast}
        </div>
      )}

      {s.screen === "WAVE_COMPLETE" && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-4xl tracking-[0.45em] text-accent">WAVE CLEARED</div>
          <div className="mt-2 text-xs tracking-[0.35em] text-muted-foreground">
            ENERGY SHARDS RECOVERED · SECTOR SECURED
          </div>
        </div>
      )}
    </div>
  );
}
