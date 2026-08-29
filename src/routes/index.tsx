import { createFileRoute } from "@tanstack/react-router";
import GameShell from "@/components/game/GameShell";

export const Route = createFileRoute("/")({
  ssr: false, // WebGL canvas must never render on the server
  head: () => ({
    meta: [
      { title: "Rogue Zero — 3D Sci-Fi Roguelite Arena Combat", key: "title" },
      {
        name: "description",
        content:
          "Play Rogue Zero: pilot ZERO, an experimental combat robot, through reactor arenas of hostile machines, roguelite upgrades and the Warden boss fight.",
        key: "description",
      },
      {
        property: "og:title",
        content: "Rogue Zero — The Machine That Refused To Die",
        key: "og:title",
      },
      {
        property: "og:description",
        content:
          "A browser 3D third-person action roguelite: plasma rifle combat, energy blade, dash, EMP burst, enemy AI waves and a multi-phase boss.",
        key: "og:description",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://rogue-zero-core.lovable.app/", key: "og:url" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://rogue-zero-core.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "VideoGame",
          name: "Rogue Zero",
          alternateName: "Rogue Zero — The Machine That Refused To Die",
          url: "https://rogue-zero-core.lovable.app/",
          applicationCategory: "Game",
          genre: ["Roguelite", "Action", "Third-person shooter"],
          operatingSystem: "Web Browser",
          gamePlatform: "Web Browser",
          playMode: "SinglePlayer",
          description:
            "A browser-based 3D third-person sci-fi action roguelite: pilot the combat robot ZERO through reactor arenas, fight machine enemy waves with a plasma rifle, energy blade, dash and EMP burst, collect roguelite upgrades and face the multi-phase Warden boss.",
        }),
      },
    ],
  }),
  component: GameShell,
});
