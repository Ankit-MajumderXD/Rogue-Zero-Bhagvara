import { useEffect, useRef, useState } from "react";
import { Game } from "@/game/engine";
import { Hud } from "./Hud";
import { Overlays } from "./Overlays";
import { TouchControls } from "./TouchControls";
import { useHud } from "./useHud";

export default function GameShell() {
  const mount = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState<Game | null>(null);
  const s = useHud();

  useEffect(() => {
    if (!mount.current) return;
    const g = new Game(mount.current);
    setGame(g);
    return () => g.dispose();
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <div ref={mount} className="absolute inset-0" />
      <Hud />
      <Overlays game={game} />
      <TouchControls game={game} />
      {s.screen === "PLAYING" && (
        <div className="pointer-events-none absolute bottom-1/2 left-1/2 hidden -translate-x-1/2 text-[10px] tracking-[0.3em] text-accent/70 md:block">
          {typeof document !== "undefined" && document.pointerLockElement ? "" : "CLICK TO CAPTURE MOUSE"}
        </div>
      )}
    </div>
  );
}
