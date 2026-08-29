import * as THREE from "three";
import { MAT, box, cyl } from "./materials";

export type Rig = {
  group: THREE.Group;
  torso: THREE.Object3D;
  head: THREE.Object3D;
  armL: THREE.Object3D;
  armR: THREE.Object3D;
  legL: THREE.Object3D;
  legR: THREE.Object3D;
  muzzle: THREE.Object3D;
  blade?: THREE.Object3D;
  glowMats: THREE.MeshStandardMaterial[];
  bodyMats: THREE.MeshStandardMaterial[];
  height: number;
};

function collectMats(root: THREE.Object3D) {
  const bodyMats: THREE.MeshStandardMaterial[] = [];
  root.traverse((o) => {
    const m = (o as THREE.Mesh).material;
    if (m instanceof THREE.MeshStandardMaterial && !bodyMats.includes(m)) bodyMats.push(m);
  });
  return bodyMats;
}

/** ZERO — armored humanoid prototype. */
export function buildZero(accent = 0x2ee6ff): Rig {
  const group = new THREE.Group();
  const steel = MAT.steel();
  const dark = MAT.darkSteel();
  const brushed = MAT.brushed();
  const glow = MAT.energy(accent, 3.2);
  const glowSoft = MAT.energy(accent, 1.6);

  const torso = new THREE.Group();
  torso.position.y = 1.18;
  group.add(torso);

  // Chest / abdomen
  torso.add(box(0.62, 0.5, 0.38, steel, 0, 0.16, 0));
  torso.add(box(0.5, 0.28, 0.32, dark, 0, -0.2, 0));
  torso.add(box(0.2, 0.14, 0.06, glow, 0, 0.14, 0.2)); // energy core
  torso.add(cyl(0.09, 0.09, 0.08, 12, glowSoft, 0, 0.14, 0.2));
  torso.add(box(0.66, 0.1, 0.42, brushed, 0, 0.4, 0)); // collar
  // Back module
  const back = box(0.42, 0.42, 0.22, dark, 0, 0.15, -0.27);
  torso.add(back);
  torso.add(box(0.1, 0.3, 0.06, glowSoft, -0.14, 0.15, -0.39));
  torso.add(box(0.1, 0.3, 0.06, glowSoft, 0.14, 0.15, -0.39));
  torso.add(cyl(0.06, 0.06, 0.3, 8, brushed, -0.26, 0.2, -0.3));
  torso.add(cyl(0.06, 0.06, 0.3, 8, brushed, 0.26, 0.2, -0.3));

  // Head
  const head = new THREE.Group();
  head.position.y = 0.6;
  torso.add(head);
  head.add(box(0.3, 0.26, 0.3, steel, 0, 0.02, 0));
  head.add(box(0.24, 0.07, 0.04, glow, 0, 0.03, 0.16)); // visor
  head.add(box(0.1, 0.12, 0.12, dark, 0.17, 0.02, 0));
  head.add(box(0.1, 0.12, 0.12, dark, -0.17, 0.02, 0));
  head.add(box(0.06, 0.2, 0.06, brushed, 0.1, 0.2, -0.06)); // antenna
  head.add(box(0.16, 0.08, 0.24, dark, 0, 0.16, -0.04));

  // Shoulders + arms
  const mkArm = (side: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(0.42 * side, 0.3, 0);
    torso.add(pivot);
    const pauldron = box(0.26, 0.24, 0.34, brushed, 0.04 * side, 0.04, 0);
    pivot.add(pauldron);
    pivot.add(box(0.06, 0.1, 0.2, glowSoft, 0.16 * side, 0.06, 0));
    const upper = box(0.15, 0.34, 0.16, steel, 0.02 * side, -0.24, 0);
    pivot.add(upper);
    pivot.add(cyl(0.09, 0.09, 0.12, 10, dark, 0.02 * side, -0.42, 0));
    const fore = box(0.16, 0.32, 0.17, steel, 0.02 * side, -0.6, 0);
    pivot.add(fore);
    const hand = box(0.13, 0.14, 0.14, dark, 0.02 * side, -0.8, 0);
    pivot.add(hand);
    return pivot;
  };
  const armR = mkArm(1);
  const armL = mkArm(-1);

  // Plasma rifle mounted on right arm
  const gun = new THREE.Group();
  gun.position.set(0.06, -0.78, 0.22);
  gun.rotation.x = Math.PI / 2;
  armR.add(gun);
  gun.add(box(0.14, 0.5, 0.16, dark, 0, 0.06, 0));
  gun.add(box(0.1, 0.2, 0.1, brushed, 0, 0.3, 0));
  gun.add(box(0.05, 0.24, 0.05, glowSoft, 0.09, 0.06, 0));
  gun.add(box(0.05, 0.24, 0.05, glowSoft, -0.09, 0.06, 0));
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 0.44, 0);
  gun.add(muzzle);
  gun.add(cyl(0.06, 0.075, 0.1, 10, glow, 0, 0.44, 0));

  // Energy blade on the left forearm (hidden until melee)
  const blade = new THREE.Group();
  blade.position.set(-0.02, -0.86, 0.12);
  blade.visible = false;
  armL.add(blade);
  const bladeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 1.0, 0.02),
    MAT.energy(0x9fefff, 3.6),
  );
  bladeMesh.rotation.x = Math.PI / 2;
  bladeMesh.position.z = 0.4;
  blade.add(bladeMesh);

  // Hips + legs
  torso.add(box(0.5, 0.16, 0.3, brushed, 0, -0.38, 0));
  const mkLeg = (side: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(0.17 * side, -0.42, 0);
    torso.add(pivot);
    pivot.add(box(0.2, 0.4, 0.22, steel, 0, -0.22, 0));
    pivot.add(cyl(0.1, 0.1, 0.14, 10, dark, 0, -0.44, 0));
    pivot.add(box(0.18, 0.38, 0.19, steel, 0, -0.64, 0));
    pivot.add(box(0.06, 0.2, 0.05, glowSoft, 0.11 * side, -0.6, 0));
    const foot = box(0.22, 0.12, 0.34, dark, 0, -0.86, 0.05);
    pivot.add(foot);
    return pivot;
  };
  const legR = mkLeg(1);
  const legL = mkLeg(-1);

  group.traverse((o) => {
    o.castShadow = true;
  });

  return {
    group,
    torso,
    head,
    armL,
    armR,
    legL,
    legR,
    muzzle,
    blade,
    glowMats: [glow, glowSoft],
    bodyMats: collectMats(group).filter((m) => m !== glow && m !== glowSoft),
    height: 1.9,
  };
}

export type EnemyKind = "SCOUT" | "SENTINEL" | "TANK" | "HUNTER" | "DRONE";

/** Distinct enemy chassis, all built from the same rig contract. */
export function buildEnemy(kind: EnemyKind): Rig {
  const group = new THREE.Group();
  const dark = MAT.darkSteel();
  const steel = MAT.steel();
  const torso = new THREE.Group();
  group.add(torso);
  const head = new THREE.Group();
  const armL = new THREE.Group();
  const armR = new THREE.Group();
  const legL = new THREE.Group();
  const legR = new THREE.Group();
  const muzzle = new THREE.Object3D();
  let glow: THREE.MeshStandardMaterial;
  let height = 1.6;

  if (kind === "SCOUT") {
    glow = MAT.energy(0xff5a3c, 2.8);
    torso.position.y = 1.0;
    torso.add(box(0.42, 0.44, 0.3, steel, 0, 0, 0));
    torso.add(box(0.16, 0.1, 0.06, glow, 0, 0.1, 0.17));
    head.position.y = 0.34;
    torso.add(head);
    head.add(box(0.24, 0.18, 0.26, dark));
    head.add(box(0.2, 0.05, 0.04, glow, 0, 0.01, 0.14));
    armR.position.set(0.3, 0.16, 0);
    armL.position.set(-0.3, 0.16, 0);
    torso.add(armR, armL);
    for (const [a, s] of [
      [armR, 1],
      [armL, -1],
    ] as const) {
      a.add(box(0.12, 0.4, 0.12, steel, 0, -0.2, 0));
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.02), MAT.energy(0xff7a4c, 3));
      bl.position.set(0, -0.6, 0.1 * s);
      a.add(bl);
    }
    legR.position.set(0.13, -0.24, 0);
    legL.position.set(-0.13, -0.24, 0);
    torso.add(legR, legL);
    for (const l of [legR, legL]) {
      l.add(box(0.14, 0.42, 0.16, steel, 0, -0.22, 0));
      l.add(box(0.16, 0.34, 0.14, dark, 0, -0.56, 0));
      l.add(box(0.16, 0.08, 0.26, dark, 0, -0.76, 0.04));
    }
    muzzle.position.set(0, -0.5, 0.2);
    armR.add(muzzle);
    height = 1.7;
  } else if (kind === "SENTINEL") {
    glow = MAT.energy(0x9b6bff, 2.8);
    torso.position.y = 1.2;
    torso.add(box(0.56, 0.5, 0.36, steel));
    torso.add(cyl(0.2, 0.2, 0.16, 14, dark, 0, 0.3, 0));
    torso.add(box(0.26, 0.12, 0.06, glow, 0, 0.06, 0.2));
    head.position.y = 0.46;
    torso.add(head);
    head.add(cyl(0.14, 0.18, 0.22, 10, dark));
    head.add(box(0.22, 0.06, 0.06, glow, 0, 0.02, 0.14));
    armR.position.set(0.42, 0.2, 0);
    armL.position.set(-0.42, 0.2, 0);
    torso.add(armR, armL);
    armL.add(box(0.14, 0.44, 0.14, steel, 0, -0.24, 0));
    // Long cannon arm
    armR.add(box(0.16, 0.36, 0.16, steel, 0, -0.2, 0));
    const barrel = cyl(0.08, 0.09, 0.7, 12, dark, 0, -0.5, 0.16);
    barrel.rotation.x = Math.PI / 2.1;
    armR.add(barrel);
    armR.add(cyl(0.09, 0.09, 0.08, 12, glow, 0, -0.56, 0.48));
    muzzle.position.set(0, -0.56, 0.52);
    armR.add(muzzle);
    legR.position.set(0.16, -0.28, 0);
    legL.position.set(-0.16, -0.28, 0);
    torso.add(legR, legL);
    for (const l of [legR, legL]) {
      l.add(box(0.16, 0.46, 0.18, steel, 0, -0.24, 0));
      l.add(box(0.18, 0.38, 0.16, dark, 0, -0.62, 0));
      l.add(box(0.2, 0.1, 0.3, dark, 0, -0.84, 0.04));
    }
    height = 2.0;
  } else if (kind === "TANK") {
    glow = MAT.energy(0xffa63c, 2.6);
    torso.position.y = 1.9;
    torso.add(box(1.5, 1.1, 1.0, steel));
    torso.add(box(1.6, 0.24, 1.06, MAT.brushed(), 0, 0.55, 0));
    torso.add(box(0.5, 0.16, 0.08, glow, 0, 0.1, 0.52));
    torso.add(box(0.2, 0.5, 0.08, glow, -0.6, 0, 0.5));
    torso.add(box(0.2, 0.5, 0.08, glow, 0.6, 0, 0.5));
    head.position.set(0, 0.7, 0.1);
    torso.add(head);
    head.add(box(0.5, 0.3, 0.5, dark));
    head.add(box(0.42, 0.08, 0.06, glow, 0, 0.02, 0.26));
    armR.position.set(1.0, 0.3, 0);
    armL.position.set(-1.0, 0.3, 0);
    torso.add(armR, armL);
    armL.add(box(0.36, 0.9, 0.4, steel, 0, -0.4, 0));
    armR.add(box(0.4, 0.5, 0.44, steel, 0, -0.24, 0));
    const cannon = cyl(0.22, 0.26, 1.5, 14, dark, 0, -0.6, 0.5);
    cannon.rotation.x = Math.PI / 2.05;
    armR.add(cannon);
    armR.add(cyl(0.26, 0.26, 0.12, 14, glow, 0, -0.68, 1.2));
    muzzle.position.set(0, -0.68, 1.3);
    armR.add(muzzle);
    legR.position.set(0.45, -0.6, 0);
    legL.position.set(-0.45, -0.6, 0);
    torso.add(legR, legL);
    for (const l of [legR, legL]) {
      l.add(box(0.5, 0.7, 0.5, steel, 0, -0.36, 0));
      l.add(box(0.44, 0.6, 0.44, dark, 0, -0.96, 0));
      l.add(box(0.6, 0.2, 0.8, dark, 0, -1.32, 0.08));
    }
    height = 3.6;
  } else if (kind === "HUNTER") {
    glow = MAT.energy(0x38ff9e, 3.0);
    torso.position.y = 1.15;
    torso.add(box(0.46, 0.5, 0.34, steel));
    torso.add(box(0.6, 0.1, 0.26, MAT.brushed(), 0, 0.28, -0.02));
    torso.add(box(0.14, 0.24, 0.06, glow, 0, 0, 0.19));
    head.position.y = 0.4;
    torso.add(head);
    head.add(box(0.22, 0.2, 0.3, dark));
    head.add(box(0.06, 0.06, 0.08, glow, 0.07, 0.03, 0.17));
    head.add(box(0.06, 0.06, 0.08, glow, -0.07, 0.03, 0.17));
    armR.position.set(0.34, 0.22, 0);
    armL.position.set(-0.34, 0.22, 0);
    torso.add(armR, armL);
    for (const a of [armR, armL]) {
      a.add(box(0.13, 0.36, 0.13, steel, 0, -0.2, 0));
      a.add(box(0.12, 0.3, 0.24, dark, 0, -0.48, 0.05));
      a.add(cyl(0.05, 0.05, 0.08, 10, glow, 0, -0.5, 0.2));
    }
    muzzle.position.set(0, -0.5, 0.26);
    armR.add(muzzle);
    legR.position.set(0.14, -0.26, 0);
    legL.position.set(-0.14, -0.26, 0);
    torso.add(legR, legL);
    for (const l of [legR, legL]) {
      l.add(box(0.14, 0.44, 0.16, steel, 0, -0.24, 0));
      l.add(box(0.14, 0.4, 0.14, dark, 0, -0.62, -0.04));
      l.add(box(0.16, 0.08, 0.3, dark, 0, -0.84, 0.06));
    }
    height = 1.9;
  } else {
    // DRONE — flying
    glow = MAT.energy(0x2ee6ff, 3.2);
    torso.position.y = 0;
    torso.add(cyl(0.3, 0.36, 0.28, 8, steel));
    torso.add(cyl(0.16, 0.16, 0.1, 12, glow, 0, -0.18, 0));
    torso.add(box(0.9, 0.06, 0.16, MAT.brushed(), 0, 0.1, 0));
    torso.add(box(0.16, 0.06, 0.9, MAT.brushed(), 0, 0.1, 0));
    for (const [x, z] of [
      [0.45, 0],
      [-0.45, 0],
      [0, 0.45],
      [0, -0.45],
    ] as const) {
      torso.add(cyl(0.13, 0.13, 0.05, 12, dark, x, 0.14, z));
      torso.add(cyl(0.05, 0.05, 0.03, 8, glow, x, 0.1, z));
    }
    head.position.set(0, -0.18, 0.2);
    torso.add(head);
    head.add(box(0.18, 0.1, 0.16, dark));
    head.add(box(0.12, 0.05, 0.04, glow, 0, 0, 0.09));
    muzzle.position.set(0, -0.2, 0.34);
    torso.add(muzzle);
    height = 0.7;
  }

  group.traverse((o) => {
    o.castShadow = true;
  });

  return {
    group,
    torso,
    head,
    armL,
    armR,
    legL,
    legR,
    muzzle,
    glowMats: [glow],
    bodyMats: collectMats(group).filter((m) => m !== glow),
    height,
  };
}

export type BossRig = Rig & {
  shield: THREE.Mesh;
  cannonL: THREE.Object3D;
  cannonR: THREE.Object3D;
};

/** THE WARDEN — phase boss. */
export function buildWarden(): BossRig {
  const group = new THREE.Group();
  const steel = MAT.steel();
  const dark = MAT.darkSteel();
  const brushed = MAT.brushed();
  const glow = MAT.energy(0xff3b30, 2.6);
  const core = MAT.energy(0xffd23c, 3.2);

  const torso = new THREE.Group();
  torso.position.y = 5.0;
  group.add(torso);
  torso.add(box(3.2, 2.4, 2.2, steel));
  torso.add(box(3.5, 0.5, 2.3, brushed, 0, 1.3, 0));
  torso.add(cyl(0.6, 0.6, 0.4, 16, core, 0, 0, 1.15));
  torso.add(box(0.5, 1.4, 0.14, glow, -1.2, 0, 1.12));
  torso.add(box(0.5, 1.4, 0.14, glow, 1.2, 0, 1.12));
  torso.add(box(2.4, 1.6, 0.7, dark, 0, 0.2, -1.3));

  const head = new THREE.Group();
  head.position.y = 1.85;
  torso.add(head);
  head.add(box(1.1, 0.8, 1.1, dark));
  head.add(box(0.95, 0.16, 0.1, glow, 0, 0.08, 0.58));
  head.add(box(0.3, 0.7, 0.3, brushed, 0.6, 0.5, -0.2));
  head.add(box(0.3, 0.7, 0.3, brushed, -0.6, 0.5, -0.2));

  const mkArm = (side: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(2.1 * side, 0.9, 0);
    torso.add(pivot);
    pivot.add(box(1.2, 1.1, 1.4, brushed, 0.15 * side, 0.1, 0));
    pivot.add(box(0.7, 1.5, 0.8, steel, 0.1 * side, -1.0, 0));
    const cannon = new THREE.Group();
    cannon.position.set(0.1 * side, -2.0, 0.2);
    pivot.add(cannon);
    cannon.add(box(0.8, 1.2, 0.9, dark));
    const barrel = cyl(0.28, 0.34, 2.2, 14, dark, 0, -0.4, 1.0);
    barrel.rotation.x = Math.PI / 2.05;
    cannon.add(barrel);
    cannon.add(cyl(0.34, 0.34, 0.16, 14, glow, 0, -0.5, 2.0));
    const muzzle = new THREE.Object3D();
    muzzle.position.set(0, -0.5, 2.2);
    cannon.add(muzzle);
    return { pivot, cannon, muzzle };
  };
  const right = mkArm(1);
  const left = mkArm(-1);

  // Extra mechanical limbs on the back
  for (const s of [-1, 1]) {
    const limb = new THREE.Group();
    limb.position.set(1.3 * s, 0.9, -1.2);
    torso.add(limb);
    limb.add(box(0.35, 1.6, 0.35, dark, 0, 0.6, -0.4));
    limb.add(box(0.3, 1.4, 0.3, brushed, 0.3 * s, 1.6, -1.1));
    limb.add(cyl(0.16, 0.16, 0.2, 10, glow, 0.5 * s, 2.3, -1.5));
  }

  torso.add(box(2.6, 0.7, 1.6, brushed, 0, -1.5, 0));
  const mkLeg = (side: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(1.0 * side, -1.7, 0);
    torso.add(pivot);
    pivot.add(box(1.0, 1.7, 1.1, steel, 0, -0.8, 0));
    pivot.add(cyl(0.42, 0.42, 0.5, 12, dark, 0, -1.7, 0));
    pivot.add(box(0.9, 1.5, 0.9, steel, 0, -2.5, 0));
    pivot.add(box(1.2, 0.4, 1.9, dark, 0, -3.4, 0.25));
    return pivot;
  };
  const legR = mkLeg(1);
  const legL = mkLeg(-1);

  const shield = new THREE.Mesh(
    new THREE.SphereGeometry(4.6, 24, 18),
    new THREE.MeshStandardMaterial({
      color: 0x2ee6ff,
      emissive: new THREE.Color(0x2ee6ff),
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      metalness: 0.1,
      roughness: 0.2,
    }),
  );
  shield.position.y = 4.6;
  group.add(shield);

  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });

  return {
    group,
    torso,
    head,
    armL: left.pivot,
    armR: right.pivot,
    legL,
    legR,
    muzzle: right.muzzle,
    cannonL: left.muzzle,
    cannonR: right.muzzle,
    shield,
    glowMats: [glow, core],
    bodyMats: collectMats(group).filter((m) => m !== glow && m !== core),
    height: 9,
  };
}
