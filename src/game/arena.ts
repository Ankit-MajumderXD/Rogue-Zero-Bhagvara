import * as THREE from "three";
import { MAT, box, cyl } from "./materials";

export type Platform = { x: number; z: number; w: number; d: number; top: number };
export type Obstacle = { x: number; z: number; r: number };
export type Destructible = {
  mesh: THREE.Object3D;
  x: number;
  z: number;
  y: number;
  r: number;
  hp: number;
  explosive: boolean;
  dead: boolean;
};

export type ArenaData = {
  group: THREE.Group;
  radius: number;
  platforms: Platform[];
  obstacles: Obstacle[];
  spawnPoints: THREE.Vector3[];
  destructibles: Destructible[];
  vents: THREE.Vector3[];
  animate: (t: number) => void;
  bossArena: boolean;
};

function warnLight(x: number, y: number, z: number, group: THREE.Group, anim: ((t: number) => void)[]) {
  const mat = MAT.warning();
  const m = box(0.28, 0.28, 0.12, mat, x, y, z);
  group.add(m);
  const light = new THREE.PointLight(0xff2a1f, 6, 14, 2);
  light.position.set(x, y, z);
  group.add(light);
  const phase = Math.random() * 6;
  anim.push((t) => {
    const p = (Math.sin(t * 2.2 + phase) + 1) / 2;
    mat.emissiveIntensity = 0.4 + p * 3;
    light.intensity = 1 + p * 8;
  });
}

function holoScreen(x: number, y: number, z: number, ry: number, group: THREE.Group, anim: ((t: number) => void)[]) {
  const mat = MAT.screen(0x27d7ff);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.3), mat);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  group.add(m);
  const frame = box(2.5, 1.6, 0.12, MAT.darkSteel(), x, y, z);
  frame.rotation.y = ry;
  group.add(frame);
  const phase = Math.random() * 10;
  anim.push((t) => {
    mat.opacity = 0.28 + Math.abs(Math.sin(t * 1.3 + phase)) * 0.4;
  });
}

function brokenRobot(x: number, z: number, group: THREE.Group) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = Math.random() * Math.PI * 2;
  const dark = MAT.darkSteel();
  const t = box(0.5, 0.45, 0.32, dark, 0, 0.3, 0);
  t.rotation.z = 1.3;
  g.add(t);
  g.add(box(0.2, 0.2, 0.24, MAT.steel(), 0.55, 0.12, 0.2));
  const arm = box(0.14, 0.5, 0.14, MAT.steel(), -0.5, 0.1, -0.2);
  arm.rotation.z = 1.6;
  g.add(arm);
  const leg = box(0.16, 0.6, 0.16, dark, 0.25, 0.1, -0.4);
  leg.rotation.x = 1.4;
  g.add(leg);
  group.add(g);
}

function debris(x: number, z: number, group: THREE.Group) {
  for (let i = 0; i < 4; i++) {
    const s = 0.15 + Math.random() * 0.35;
    const m = box(s, s * 0.4, s * 1.4, MAT.darkSteel(), x + (Math.random() - 0.5) * 3, s * 0.2, z + (Math.random() - 0.5) * 3);
    m.rotation.y = Math.random() * 3;
    m.rotation.z = (Math.random() - 0.5) * 0.4;
    group.add(m);
  }
}

function crate(
  x: number,
  z: number,
  y: number,
  explosive: boolean,
  group: THREE.Group,
  dest: Destructible[],
) {
  const g = new THREE.Group();
  g.position.set(x, y + 0.5, z);
  const mat = explosive
    ? new THREE.MeshStandardMaterial({ color: 0x51230f, metalness: 0.7, roughness: 0.5 })
    : MAT.brushed();
  g.add(box(1, 1, 1, mat));
  g.add(box(1.06, 0.12, 1.06, MAT.darkSteel(), 0, 0.42, 0));
  g.add(box(1.06, 0.12, 1.06, MAT.darkSteel(), 0, -0.42, 0));
  if (explosive) {
    g.add(box(0.35, 0.35, 0.04, MAT.energy(0xff8a1f, 2.6), 0, 0, 0.52));
  } else {
    g.add(box(0.3, 0.06, 0.04, MAT.energy(0x2ee6ff, 1.6), 0, 0.16, 0.52));
  }
  group.add(g);
  dest.push({ mesh: g, x, z, y: y + 0.5, r: 0.8, hp: explosive ? 10 : 22, explosive, dead: false });
}

function pipeRun(y: number, radius: number, group: THREE.Group, count = 5) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + 0.3;
    const p = cyl(0.22, 0.22, 12 + Math.random() * 6, 8, MAT.brushed(), Math.cos(a) * radius, y, Math.sin(a) * radius);
    p.rotation.z = Math.PI / 2;
    p.rotation.y = -a;
    group.add(p);
  }
}

/** ARENA 01 — THE REACTOR */
export function buildReactorArena(): ArenaData {
  const group = new THREE.Group();
  const anim: ((t: number) => void)[] = [];
  const platforms: Platform[] = [];
  const obstacles: Obstacle[] = [];
  const destructibles: Destructible[] = [];
  const vents: THREE.Vector3[] = [];
  const R = 42;

  // Floor
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R, 64), MAT.floor());
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);
  // Floor plating detail
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const seam = box(0.25, 0.04, R - 8, MAT.darkSteel(), Math.cos(a) * (R / 2), 0.02, Math.sin(a) * (R / 2));
    seam.rotation.y = -a;
    seam.receiveShadow = false;
    seam.castShadow = false;
    group.add(seam);
  }
  const inner = new THREE.Mesh(new THREE.RingGeometry(9, 12, 48), MAT.concrete());
  inner.rotation.x = -Math.PI / 2;
  inner.position.y = 0.03;
  inner.receiveShadow = true;
  group.add(inner);

  // Outer wall
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(R + 0.5, R + 0.5, 34, 64, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x171a1f,
      metalness: 0.6,
      roughness: 0.8,
      side: THREE.BackSide,
    }),
  );
  wall.position.y = 17;
  wall.receiveShadow = true;
  group.add(wall);
  // Ceiling structure
  const ceil = new THREE.Mesh(new THREE.CircleGeometry(R, 48), MAT.concrete());
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = 32;
  group.add(ceil);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const beam = box(1.2, 1.2, R * 1.9, MAT.darkSteel(), 0, 29, 0);
    beam.rotation.y = a;
    group.add(beam);
  }

  // Central reactor
  const reactorCore = MAT.energy(0x2ee6ff, 2.4);
  const reactor = new THREE.Group();
  group.add(reactor);
  reactor.add(cyl(6, 7.2, 3, 32, MAT.brushed(), 0, 1.5, 0));
  reactor.add(cyl(4.4, 4.4, 20, 32, MAT.steel(), 0, 12, 0));
  const coreCol = cyl(3.2, 3.2, 18, 24, reactorCore, 0, 12, 0);
  reactor.add(coreCol);
  for (let i = 0; i < 4; i++) {
    reactor.add(cyl(5.2, 5.2, 0.7, 32, MAT.darkSteel(), 0, 5 + i * 5, 0));
  }
  reactor.add(cyl(7.4, 6.4, 1.2, 32, MAT.darkSteel(), 0, 22.5, 0));
  const coreLight = new THREE.PointLight(0x2ee6ff, 120, 60, 2);
  coreLight.position.set(0, 8, 0);
  group.add(coreLight);
  obstacles.push({ x: 0, z: 0, r: 7.6 });
  anim.push((t) => {
    reactorCore.emissiveIntensity = 1.8 + Math.sin(t * 1.7) * 0.6 + Math.sin(t * 5.3) * 0.15;
    coreLight.intensity = 90 + Math.sin(t * 1.7) * 40;
    coreCol.rotation.y = t * 0.15;
  });

  // Raised platforms with stair access
  const platDefs = [
    { a: 0.5, dist: 26, w: 12, d: 10, h: 3.2 },
    { a: 2.6, dist: 27, w: 11, d: 11, h: 4.4 },
    { a: 4.2, dist: 25, w: 13, d: 9, h: 2.6 },
    { a: 5.6, dist: 28, w: 10, d: 10, h: 5.2 },
  ];
  for (const p of platDefs) {
    const px = Math.cos(p.a) * p.dist;
    const pz = Math.sin(p.a) * p.dist;
    const deck = box(p.w, 0.5, p.d, MAT.floor(), px, p.h, pz);
    group.add(deck);
    platforms.push({ x: px, z: pz, w: p.w, d: p.d, top: p.h + 0.25 });
    // Support columns
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        group.add(cyl(0.35, 0.35, p.h, 8, MAT.brushed(), px + (sx * p.w) / 2.4, p.h / 2, pz + (sz * p.d) / 2.4));
      }
    // Railings
    const rail = box(p.w, 0.1, 0.1, MAT.brushed(), px, p.h + 1.1, pz - p.d / 2);
    group.add(rail);
    group.add(box(p.w, 0.06, 0.06, MAT.energy(0x2ee6ff, 1.2), px, p.h + 0.7, pz - p.d / 2));

    // Stairs stepping toward the arena centre
    const inward = new THREE.Vector2(-Math.cos(p.a), -Math.sin(p.a));
    const steps = Math.ceil(p.h / 0.55);
    for (let s = 0; s < steps; s++) {
      const top = p.h - s * 0.55;
      const dist = p.d / 2 + 0.7 + s * 1.0;
      const sxp = px + inward.x * dist;
      const szp = pz + inward.y * dist;
      const stair = box(4.4, 0.4, 1.1, MAT.brushed(), sxp, top - 0.2, szp);
      stair.rotation.y = -p.a;
      group.add(stair);
      platforms.push({ x: sxp, z: szp, w: 4.6, d: 1.6, top });
    }
    crate(px + 2, pz + 2, p.h + 0.25, Math.random() > 0.6, group, destructibles);
    holoScreen(px, p.h + 2.2, pz + p.d / 2 - 0.2, Math.PI + p.a, group, anim);
    warnLight(px + p.w / 2 - 0.4, p.h + 1.8, pz, group, anim);
  }

  // Perimeter machinery, pillars, doors
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.26;
    const d = 36;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (i % 3 === 0) {
      // Big door
      const door = new THREE.Group();
      door.position.set(Math.cos(a) * (R - 0.4), 0, Math.sin(a) * (R - 0.4));
      door.rotation.y = -a + Math.PI / 2;
      door.add(box(10, 14, 0.6, MAT.darkSteel(), 0, 7, 0));
      door.add(box(0.4, 14, 0.8, MAT.brushed(), 0, 7, 0.2));
      door.add(box(10.6, 0.6, 1, MAT.brushed(), 0, 14, 0.2));
      door.add(box(8, 0.3, 0.1, MAT.energy(0xff3b30, 2), 0, 1.2, 0.4));
      group.add(door);
      warnLight(Math.cos(a) * (R - 1.2), 15.4, Math.sin(a) * (R - 1.2), group, anim);
    } else {
      // Machinery block
      const h = 4 + Math.random() * 5;
      const mach = new THREE.Group();
      mach.position.set(x, 0, z);
      mach.rotation.y = -a;
      mach.add(box(5, h, 3.4, MAT.steel(), 0, h / 2, 0));
      mach.add(box(5.2, 0.5, 3.6, MAT.brushed(), 0, h, 0));
      mach.add(box(1.4, 1.4, 0.2, MAT.screen(0x27d7ff), 0, h * 0.6, 1.8));
      mach.add(cyl(0.8, 0.8, h * 0.7, 12, MAT.brushed(), 2.9, h * 0.4, 0));
      group.add(mach);
      obstacles.push({ x, z, r: 3.1 });
      platforms.push({ x, z, w: 5, d: 3.4, top: h });
      if (i % 2 === 0) vents.push(new THREE.Vector3(x * 0.86, 0.2, z * 0.86));
    }
    if (i % 4 === 1) {
      const pillar = cyl(1.1, 1.4, 32, 10, MAT.concrete(), Math.cos(a) * 20, 16, Math.sin(a) * 20);
      group.add(pillar);
      obstacles.push({ x: Math.cos(a) * 20, z: Math.sin(a) * 20, r: 1.6 });
    }
  }

  pipeRun(24, 39, group, 7);
  pipeRun(12, 40, group, 5);

  // Control panels near the reactor
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.9;
    const x = Math.cos(a) * 13.5;
    const z = Math.sin(a) * 13.5;
    const panel = new THREE.Group();
    panel.position.set(x, 0, z);
    panel.rotation.y = -a + Math.PI;
    panel.add(box(2.6, 1.1, 0.9, MAT.steel(), 0, 0.6, 0));
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.7), MAT.screen(i % 2 ? 0x27d7ff : 0xff6a3c));
    scr.position.set(0, 1.05, 0.1);
    scr.rotation.x = -0.9;
    panel.add(scr);
    group.add(panel);
    obstacles.push({ x, z, r: 1.5 });
  }

  // Environmental storytelling
  for (let i = 0; i < 9; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = 15 + Math.random() * 22;
    brokenRobot(Math.cos(a) * d, Math.sin(a) * d, group);
  }
  for (let i = 0; i < 7; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = 14 + Math.random() * 24;
    debris(Math.cos(a) * d, Math.sin(a) * d, group);
  }
  for (let i = 0; i < 7; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = 16 + Math.random() * 18;
    crate(Math.cos(a) * d, Math.sin(a) * d, 0, i % 3 === 0, group, destructibles);
  }

  // Hanging sparking cables
  for (let i = 0; i < 8; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = 18 + Math.random() * 18;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    const cable = cyl(0.06, 0.06, 6 + Math.random() * 5, 5, MAT.rubber(), x, 26, z);
    cable.rotation.z = (Math.random() - 0.5) * 0.5;
    group.add(cable);
    vents.push(new THREE.Vector3(x, 22, z));
  }

  const spawnPoints: THREE.Vector3[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    spawnPoints.push(new THREE.Vector3(Math.cos(a) * 30, 0, Math.sin(a) * 30));
  }

  return {
    group,
    radius: R - 1.5,
    platforms,
    obstacles,
    spawnPoints,
    destructibles,
    vents,
    animate: (t) => anim.forEach((f) => f(t)),
    bossArena: false,
  };
}

/** Boss arena — suspended reactor platform over a void. */
export function buildBossArena(): ArenaData {
  const group = new THREE.Group();
  const anim: ((t: number) => void)[] = [];
  const platforms: Platform[] = [];
  const obstacles: Obstacle[] = [];
  const destructibles: Destructible[] = [];
  const vents: THREE.Vector3[] = [];
  const R = 34;

  const floor = new THREE.Mesh(new THREE.CircleGeometry(R, 64), MAT.floor());
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.9, 8, 64), MAT.brushed());
  rim.rotation.x = Math.PI / 2;
  group.add(rim);
  const barrier = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, 9, 64, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x2ee6ff,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
    }),
  );
  barrier.position.y = 4.5;
  group.add(barrier);
  anim.push((t) => {
    (barrier.material as THREE.MeshBasicMaterial).opacity = 0.07 + Math.abs(Math.sin(t * 0.9)) * 0.09;
  });

  // Damaged floor patches
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.random() * (R - 6);
    const patch = new THREE.Mesh(
      new THREE.CircleGeometry(1 + Math.random() * 2.4, 8),
      MAT.concrete(),
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(Math.cos(a) * d, 0.04, Math.sin(a) * d);
    group.add(patch);
  }

  // Central reactor stub
  const coreMat = MAT.energy(0xff3b30, 2.2);
  group.add(cyl(3.4, 4.2, 1.4, 24, MAT.brushed(), 0, 0.7, 0));
  const beam = cyl(1.4, 1.4, 26, 20, coreMat, 0, 14, 0);
  group.add(beam);
  const bossLight = new THREE.PointLight(0xff3b30, 90, 70, 2);
  bossLight.position.set(0, 10, 0);
  group.add(bossLight);
  obstacles.push({ x: 0, z: 0, r: 4.4 });
  anim.push((t) => {
    coreMat.emissiveIntensity = 1.6 + Math.sin(t * 3.1) * 0.7;
    bossLight.intensity = 60 + Math.sin(t * 3.1) * 30;
    beam.rotation.y = -t * 0.4;
  });

  // Pillars + energy barriers around the rim
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x = Math.cos(a) * (R - 5);
    const z = Math.sin(a) * (R - 5);
    group.add(cyl(1.3, 1.7, 22, 8, MAT.concrete(), x, 11, z));
    group.add(box(0.5, 3, 0.12, MAT.energy(0x2ee6ff, 2), x, 4, z));
    obstacles.push({ x, z, r: 1.9 });
    warnLight(x, 8, z, group, anim);
    vents.push(new THREE.Vector3(x * 0.9, 0.2, z * 0.9));
  }
  for (let i = 0; i < 5; i++) {
    const a = Math.random() * Math.PI * 2;
    crate(Math.cos(a) * 16, Math.sin(a) * 16, 0, i % 2 === 0, group, destructibles);
  }
  for (let i = 0; i < 5; i++) {
    const a = Math.random() * Math.PI * 2;
    brokenRobot(Math.cos(a) * (10 + Math.random() * 14), Math.sin(a) * (10 + Math.random() * 14), group);
  }

  // Distant background structures
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const d = 70 + Math.random() * 50;
    const h = 30 + Math.random() * 60;
    const b = box(10 + Math.random() * 14, h, 10 + Math.random() * 14, MAT.concrete(), Math.cos(a) * d, h / 2 - 40, Math.sin(a) * d);
    group.add(b);
    if (i % 2 === 0)
      group.add(box(1.2, 0.3, 1.2, MAT.energy(0xff3b30, 2), Math.cos(a) * d, h - 40, Math.sin(a) * d));
  }

  const spawnPoints: THREE.Vector3[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    spawnPoints.push(new THREE.Vector3(Math.cos(a) * 24, 0, Math.sin(a) * 24));
  }

  return {
    group,
    radius: R - 1.5,
    platforms,
    obstacles,
    spawnPoints,
    destructibles,
    vents,
    animate: (t) => anim.forEach((f) => f(t)),
    bossArena: true,
  };
}
