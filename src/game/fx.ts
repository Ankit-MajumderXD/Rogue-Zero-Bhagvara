import * as THREE from "three";

type P = {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  grav: number;
  spin: number;
  alive: boolean;
};

type Ring = {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  maxR: number;
  alive: boolean;
};

const GEO = new THREE.BoxGeometry(1, 1, 1);

/** Pooled particle + ring effects. Small fixed budget, no per-frame allocation. */
export class Fx {
  private parts: P[] = [];
  private rings: Ring[] = [];
  private group = new THREE.Group();
  private maxParts = 320;

  constructor(scene: THREE.Scene) {
    scene.add(this.group);
  }

  private take(): P | null {
    for (const p of this.parts) if (!p.alive) return p;
    if (this.parts.length >= this.maxParts) return null;
    const mesh = new THREE.Mesh(
      GEO,
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }),
    );
    mesh.visible = false;
    this.group.add(mesh);
    const p: P = {
      mesh,
      vel: new THREE.Vector3(),
      life: 0,
      maxLife: 1,
      grav: 0,
      spin: 0,
      alive: false,
    };
    this.parts.push(p);
    return p;
  }

  burst(
    pos: THREE.Vector3,
    opts: {
      count?: number;
      color?: number;
      speed?: number;
      size?: number;
      life?: number;
      grav?: number;
      spread?: number;
      up?: number;
    } = {},
  ) {
    const {
      count = 10,
      color = 0x2ee6ff,
      speed = 6,
      size = 0.09,
      life = 0.5,
      grav = 9,
      spread = 1,
      up = 0.4,
    } = opts;
    for (let i = 0; i < count; i++) {
      const p = this.take();
      if (!p) return;
      p.alive = true;
      p.mesh.visible = true;
      p.mesh.position.copy(pos);
      const s = size * (0.6 + Math.random() * 0.9);
      p.mesh.scale.setScalar(s);
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(color);
      mat.opacity = 1;
      p.vel.set(
        (Math.random() - 0.5) * 2 * spread,
        Math.random() * up + 0.1,
        (Math.random() - 0.5) * 2 * spread,
      );
      p.vel.normalize().multiplyScalar(speed * (0.5 + Math.random()));
      p.grav = grav;
      p.spin = (Math.random() - 0.5) * 12;
      p.maxLife = life * (0.7 + Math.random() * 0.6);
      p.life = p.maxLife;
    }
  }

  trail(pos: THREE.Vector3, color = 0x2ee6ff, size = 0.08) {
    const p = this.take();
    if (!p) return;
    p.alive = true;
    p.mesh.visible = true;
    p.mesh.position.copy(pos);
    p.mesh.scale.setScalar(size);
    const mat = p.mesh.material as THREE.MeshBasicMaterial;
    mat.color.setHex(color);
    mat.opacity = 0.9;
    p.vel.set(0, 0.3, 0);
    p.grav = 0;
    p.spin = 0;
    p.maxLife = 0.28;
    p.life = 0.28;
  }

  ring(pos: THREE.Vector3, maxR: number, color = 0x2ee6ff, dur = 0.6, vertical = false) {
    let r = this.rings.find((x) => !x.alive);
    if (!r) {
      const mesh = new THREE.Mesh(
        new THREE.RingGeometry(0.85, 1, 48),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      mesh.visible = false;
      this.group.add(mesh);
      r = { mesh, life: 0, maxLife: dur, maxR, alive: false };
      this.rings.push(r);
    }
    r.alive = true;
    r.mesh.visible = true;
    r.mesh.position.copy(pos);
    r.mesh.rotation.set(vertical ? 0 : -Math.PI / 2, 0, 0);
    r.maxR = maxR;
    r.maxLife = dur;
    r.life = dur;
    (r.mesh.material as THREE.MeshBasicMaterial).color.setHex(color);
  }

  update(dt: number) {
    for (const p of this.parts) {
      if (!p.alive) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.alive = false;
        p.mesh.visible = false;
        continue;
      }
      p.vel.y -= p.grav * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      if (p.mesh.position.y < 0.03) {
        p.mesh.position.y = 0.03;
        p.vel.y = Math.abs(p.vel.y) * 0.35;
        p.vel.x *= 0.6;
        p.vel.z *= 0.6;
      }
      p.mesh.rotation.x += p.spin * dt;
      p.mesh.rotation.y += p.spin * dt;
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.min(1, p.life / p.maxLife);
    }
    for (const r of this.rings) {
      if (!r.alive) continue;
      r.life -= dt;
      if (r.life <= 0) {
        r.alive = false;
        r.mesh.visible = false;
        continue;
      }
      const t = 1 - r.life / r.maxLife;
      r.mesh.scale.setScalar(0.2 + t * r.maxR);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.85;
    }
  }
}
