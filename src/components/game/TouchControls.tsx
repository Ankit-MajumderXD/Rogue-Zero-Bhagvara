import { useEffect, useRef, useState } from "react";
import type { Game } from "@/game/engine";
import { useHud } from "./useHud";

/** Virtual stick + action buttons for touch devices. */
export function TouchControls({ game }: { game: Game | null }) {
  const s = useHud();
  const [touch, setTouch] = useState(false);
  const moveRef = useRef<HTMLDivElement>(null);
  const lookRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setTouch(typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    if (!game || !touch) return;
    const move = moveRef.current;
    const look = lookRef.current;
    if (!move || !look) return;
    let moveId: number | null = null;
    let lookId: number | null = null;
    let lookLast = { x: 0, y: 0 };

    const onStart = (e: PointerEvent) => {
      const inMove = move.contains(e.target as Node);
      if (inMove && moveId === null) moveId = e.pointerId;
      else if (!inMove && lookId === null) {
        lookId = e.pointerId;
        lookLast = { x: e.clientX, y: e.clientY };
      }
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId === moveId) {
        const r = move.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        const cx = Math.max(-1, Math.min(1, dx));
        const cy = Math.max(-1, Math.min(1, dy));
        game.touch.moveX = cx;
        game.touch.moveY = cy;
        setKnob({ x: cx * 30, y: cy * 30 });
      } else if (e.pointerId === lookId) {
        game.touch.lookX = (e.clientX - lookLast.x) * 0.12;
        game.touch.lookY = (e.clientY - lookLast.y) * 0.12;
        lookLast = { x: e.clientX, y: e.clientY };
      }
    };
    const onEnd = (e: PointerEvent) => {
      if (e.pointerId === moveId) {
        moveId = null;
        game.touch.moveX = 0;
        game.touch.moveY = 0;
        setKnob({ x: 0, y: 0 });
      }
      if (e.pointerId === lookId) {
        lookId = null;
        game.touch.lookX = 0;
        game.touch.lookY = 0;
      }
    };
    window.addEventListener("pointerdown", onStart);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    const decay = setInterval(() => {
      if (lookId === null) {
        game.touch.lookX = 0;
        game.touch.lookY = 0;
      }
    }, 80);
    return () => {
      window.removeEventListener("pointerdown", onStart);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      clearInterval(decay);
    };
  }, [game, touch]);

  if (!touch || s.screen !== "PLAYING") return null;

  const action = (name: "fire" | "dash" | "emp" | "melee" | "aim", label: string) => (
    <button
      key={name}
      onPointerDown={() => game?.setAction(name, true)}
      onPointerUp={() => game?.setAction(name, false)}
      onPointerLeave={() => game?.setAction(name, false)}
      className="h-16 w-16 rounded-full border border-accent/60 bg-hud-panel/80 text-[10px] tracking-widest text-accent"
    >
      {label}
    </button>
  );

  return (
    <div className="absolute inset-0 z-10 font-display">
      <div ref={lookRef} className="absolute inset-0" />
      <div
        ref={moveRef}
        className="absolute bottom-10 left-8 h-32 w-32 rounded-full border border-accent/40 bg-hud-panel/50"
      >
        <div
          className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/70 bg-accent/25"
          style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
        />
      </div>
      <div className="absolute bottom-10 right-8 grid grid-cols-2 gap-3">
        {action("fire", "FIRE")}
        {action("aim", "AIM")}
        {action("melee", "BLADE")}
        {action("dash", "DASH")}
        {action("emp", "EMP")}
      </div>
    </div>
  );
}
