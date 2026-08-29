import * as THREE from "three";

export const MAT = {
  steel: () =>
    new THREE.MeshStandardMaterial({ color: 0x2b3138, metalness: 0.95, roughness: 0.42 }),
  darkSteel: () =>
    new THREE.MeshStandardMaterial({ color: 0x14181d, metalness: 0.9, roughness: 0.55 }),
  brushed: () =>
    new THREE.MeshStandardMaterial({ color: 0x3a424b, metalness: 0.8, roughness: 0.3 }),
  concrete: () =>
    new THREE.MeshStandardMaterial({ color: 0x1b1c20, metalness: 0.1, roughness: 0.95 }),
  floor: () =>
    new THREE.MeshStandardMaterial({ color: 0x191d22, metalness: 0.85, roughness: 0.35 }),
  rubber: () =>
    new THREE.MeshStandardMaterial({ color: 0x0d0f12, metalness: 0.2, roughness: 0.9 }),
  glass: () =>
    new THREE.MeshStandardMaterial({
      color: 0x0a2630,
      metalness: 0.4,
      roughness: 0.08,
      transparent: true,
      opacity: 0.45,
    }),
  energy: (color = 0x2ee6ff, intensity = 2.4) =>
    new THREE.MeshStandardMaterial({
      color,
      emissive: new THREE.Color(color),
      emissiveIntensity: intensity,
      metalness: 0.2,
      roughness: 0.3,
    }),
  screen: (color = 0x27d7ff) =>
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 }),
  warning: () =>
    new THREE.MeshStandardMaterial({
      color: 0xff3b30,
      emissive: new THREE.Color(0xff2a1f),
      emissiveIntensity: 2.2,
      roughness: 0.4,
    }),
};

export function box(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function cyl(
  rt: number,
  rb: number,
  h: number,
  seg: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
