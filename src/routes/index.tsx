import { createFileRoute } from "@tanstack/react-router";
import GameShell from "@/components/game/GameShell";

export const Route = createFileRoute("/")({
  ssr: false, // WebGL canvas must never render on the server
  head: () => ({
    meta: [
      { title: "Rogue Zero — 3D Sci-Fi Roguelite Arena Combat" },
      {
        name: "description",
        content:
          "Play Rogue Zero: pilot ZERO, an experimental combat robot, through reactor arenas of hostile machines, roguelite upgrades and the Warden boss fight.",
      },
      { property: "og:title", content: "Rogue Zero — The Machine That Refused To Die" },
      {
        property: "og:description",
        content:
          "A browser 3D third-person action roguelite: plasma rifle combat, energy blade, dash, EMP burst, enemy AI waves and a multi-phase boss.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GameShell,
});
