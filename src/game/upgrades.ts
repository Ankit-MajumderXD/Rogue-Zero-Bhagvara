import type { Modifiers, Upgrade } from "./store";

export function baseModifiers(): Modifiers {
  return {
    damage: 1,
    fireRate: 1,
    dashCd: 1,
    empRadius: 1,
    maxHp: 1,
    regen: 0,
    moveSpeed: 1,
    energyRegen: 1,
  };
}

export const UPGRADES: Upgrade[] = [
  {
    id: "plasma_overdrive",
    name: "PLASMA OVERDRIVE",
    desc: "+25% weapon damage",
    apply: (m) => (m.damage *= 1.25),
  },
  {
    id: "cyclic_feed",
    name: "CYCLIC FEED",
    desc: "+20% fire rate",
    apply: (m) => (m.fireRate *= 1.2),
  },
  {
    id: "nano_repair",
    name: "NANO REPAIR",
    desc: "Regenerate 2% HP every 5s",
    apply: (m) => (m.regen += 0.004),
  },
  {
    id: "void_dash",
    name: "VOID DASH",
    desc: "Dash cooldown -25%",
    apply: (m) => (m.dashCd *= 0.75),
  },
  {
    id: "emp_amplifier",
    name: "EMP AMPLIFIER",
    desc: "EMP radius +35%",
    apply: (m) => (m.empRadius *= 1.35),
  },
  {
    id: "reinforced_chassis",
    name: "REINFORCED CHASSIS",
    desc: "+30 max HP, fully repaired",
    apply: (m) => (m.maxHp += 0.3),
  },
  {
    id: "servo_boost",
    name: "SERVO BOOST",
    desc: "+15% movement speed",
    apply: (m) => (m.moveSpeed *= 1.15),
  },
  {
    id: "cold_core",
    name: "COLD CORE",
    desc: "+40% energy recharge",
    apply: (m) => (m.energyRegen *= 1.4),
  },
];

export function rollUpgrades(count = 3): Upgrade[] {
  const pool = [...UPGRADES];
  const out: Upgrade[] = [];
  while (out.length < count && pool.length) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}
