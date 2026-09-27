import * as THREE from "three";
import { Fx } from "./fx";
import { buildBossArena, buildReactorArena, type ArenaData, type Destructible } from "./arena";
import { buildEnemy, buildWarden, buildZero, type EnemyKind, type Rig } from "./robots";
import { MAT } from "./materials";
import { hudStore, loadSave, persistSave, type Modifiers, type Upgrade } from "./store";
import { baseModifiers, rollUpgrades } from "./upgrades";
import { sfx } from "./audio";

type Enemy = {
  kind: EnemyKind;
  rig: Rig;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  hp: number;
  maxHp: number;
  state: "IDLE" | "PATROL" | "CHASE" | "ATTACK" | "RETREAT" | "STUN" | "DEAD";
  timer: number;
  atkCd: number;
  stun: number;
  flash: number;
  radius: number;
  speed: number;
  dmg: number;
  range: number;
  detect: number;
  flying: boolean;
  bobPhase: number;
  strafe: number;
  anim: number;
  deathT: number;
  barGroup: THREE.Group;
  barFill: THREE.Mesh;
  barShow: number;
  yaw: number;
};

type Proj = {
  mesh: THREE.Mesh;
  light: THREE.PointLight | null;
  vel: THREE.Vector3;
  life: number;
  dmg: number;
  from: "player" | "enemy";
  radius: number;
  color: number;
  alive: boolean;
};

type Shard = { mesh: THREE.Mesh; pos: THREE.Vector3; life: number; alive: boolean; vy: number };

type WaveDef = { label: string; spawns: { kind: EnemyKind; count: number }[] };

const WAVES: WaveDef[] = [
  { label: "WAVE 01", spawns: [{ kind: "SCOUT", count: 3 }] },
  {
    label: "WAVE 02",
    spawns: [
      { kind: "SCOUT", count: 2 },
      { kind: "SENTINEL", count: 1 },
    ],
  },
  {
    label: "WAVE 03",
    spawns: [
      { kind: "HUNTER", count: 2 },
      { kind: "TANK", count: 1 },
    ],
  },
  {
    label: "WAVE 04",
    spawns: [
      { kind: "DRONE", count: 2 },
      { kind: "SENTINEL", count: 2 },
      { kind: "TANK", count: 1 },
    ],
  },
];

const STATS: Record<
  EnemyKind,
  { hp: number; speed: number; dmg: number; range: number; detect: number; radius: number; cd: number }
> = {
  SCOUT: { hp: 55, speed: 7.4, dmg: 9, range: 2.4, detect: 60, radius: 0.6, cd: 1.1 },
  SENTINEL: { hp: 90, speed: 3.4, dmg: 11, range: 22, detect: 70, radius: 0.7, cd: 1.9 },
  TANK: { hp: 320, speed: 2.1, dmg: 22, range: 20, detect: 80, radius: 1.7, cd: 2.8 },
  HUNTER: { hp: 110, speed: 6.4, dmg: 7, range: 16, detect: 70, radius: 0.65, cd: 0.9 },
  DRONE: { hp: 65, speed: 5.6, dmg: 10, range: 20, detect: 80, radius: 0.7, cd: 1.7 },
};

const tmpV = new THREE.Vector3();
const tmpV2 = new THREE.Vector3();

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private fx: Fx;
  private arena!: ArenaData;
  private raf = 0;
  private container: HTMLElement;
  private disposed = false;

  // Player
  private zero: Rig;
  private pos = new THREE.Vector3(0, 0, 24);
  private vel = new THREE.Vector3();
  private vy = 0;
  private grounded = true;
  private yaw = Math.PI;
  private camYaw = Math.PI;
  private camPitch = -0.12;
  private hp = 100;
  private maxHp = 100;
  private energy = 100;
  private maxEnergy = 100;
  private fireCd = 0;
  private meleeCd = 0;
  private meleeT = 0;
  private dashCd = 0;
  private dashT = 0;
  private dashDir = new THREE.Vector3();
  private empCd = 0;
  private invuln = 0;
  private aiming = false;
  private walkPhase = 0;
  private stepAcc = 0;
  private recoil = 0;
  private hitFlash = 0;
  private regenAcc = 0;

  // World
  private enemies: Enemy[] = [];
  private projs: Proj[] = [];
  private shards: Shard[] = [];
  private mods: Modifiers = baseModifiers();
  private owned: string[] = [];
  private wave = 0;
  private waveTimer = 0;
  private phase: "IDLE" | "FIGHT" | "CLEARED" | "UPGRADE" | "BOSS_INTRO" | "OVER" = "IDLE";
  private paused = false;
  private running = false;
  private kills = 0;
  private xp = 0;
  private credits = 0;
  private shakeAmt = 0;
  private camDist = 6.4;
  private hudAcc = 0;
  private ventAcc = 0;
  private aimPoint = new THREE.Vector3();
  private raycaster = new THREE.Raycaster();

  // Boss
  private boss: {
    rig: ReturnType<typeof buildWarden>;
    pos: THREE.Vector3;
    hp: number;
    maxHp: number;
    phase: number;
    atkT: number;
    state: string;
    stateT: number;
    yaw: number;
    laserAngle: number;
    laser: THREE.Mesh;
    shockR: number;
    charge: THREE.Vector3;
  } | null = null;

  private keys = new Set<string>();
  private mouse = { left: false, right: false };
  private runId = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";

    this.camera = new THREE.PerspectiveCamera(62, container.clientWidth / container.clientHeight, 0.1, 400);
    this.scene.fog = new THREE.FogExp2(0x05070a, 0.012);
    this.scene.background = new THREE.Color(0x05070a);

    this.zero = buildZero();
    this.scene.add(this.zero.group);
    this.fx = new Fx(this.scene);

    this.setupLights();
    this.loadArena(false);

    const save = loadSave();
    this.xp = save.xp;
    this.credits = save.credits;
    hudStore.set({ xp: save.xp, credits: save.credits, level: save.level });

    window.addEventListener("resize", this.onResize);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    const el = this.renderer.domElement;
    el.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    document.addEventListener("mousemove", this.onMouseMove);
    el.addEventListener("click", this.requestLock);
    el.addEventListener("contextmenu", (e) => e.preventDefault());

    this.clock.start();
    this.loop();
  }

  // ---------- setup ----------

  private ambient = new THREE.HemisphereLight(0x33506b, 0x0a0c10, 0.55);
  private sun = new THREE.DirectionalLight(0x9fd8ff, 1.1);
  private playerLight = new THREE.PointLight(0x2ee6ff, 12, 14, 2);

  private setupLights() {
    this.scene.add(this.ambient);
    this.sun.position.set(24, 40, 18);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 5;
    this.sun.shadow.camera.far = 130;
    const c = this.sun.shadow.camera as THREE.OrthographicCamera;
    c.left = -55;
    c.right = 55;
    c.top = 55;
    c.bottom = -55;
    this.scene.add(this.sun);
    this.scene.add(this.playerLight);
    const fill = new THREE.DirectionalLight(0xff5a3c, 0.35);
    fill.position.set(-30, 18, -25);
    this.scene.add(fill);
  }

  private loadArena(boss: boolean) {
    if (this.arena) {
      this.scene.remove(this.arena.group);
      this.arena.group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
    }
    this.arena = boss ? buildBossArena() : buildReactorArena();
    this.scene.add(this.arena.group);
  }

  // ---------- input ----------

  private requestLock = () => {
    if (this.running && !this.paused) this.renderer.domElement.requestPointerLock?.();
  };

  private onResize = () => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Escape") {
      if (this.running) this.paused ? this.resume() : this.pause();
      return;
    }
    if (["Space", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) e.preventDefault();
    this.keys.add(e.code);
  };
  private onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.code);
  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) this.mouse.left = true;
    if (e.button === 2) this.mouse.right = true;
  };
  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) this.mouse.left = false;
    if (e.button === 2) this.mouse.right = false;
  };
  private onMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement !== this.renderer.domElement) return;
    const s = 0.0022;
    this.camYaw -= e.movementX * s;
    this.camPitch = THREE.MathUtils.clamp(this.camPitch - e.movementY * s, -0.85, 0.6);
  };

  /** Mobile / on-screen control bridge. */
  public touch = { moveX: 0, moveY: 0, lookX: 0, lookY: 0 };
  public setAction(name: "fire" | "aim" | "dash" | "emp" | "melee", down: boolean) {
    if (name === "fire") this.mouse.left = down;
    else if (name === "aim") this.mouse.right = down;
    else if (down && name === "dash") this.keys.add("Space");
    else if (!down && name === "dash") this.keys.delete("Space");
    else if (down && name === "emp") this.keys.add("KeyQ");
    else if (!down && name === "emp") this.keys.delete("KeyQ");
    else if (down && name === "melee") this.keys.add("KeyE");
    else if (!down && name === "melee") this.keys.delete("KeyE");
  }

  // ---------- run lifecycle ----------

  startRun() {
    this.runId++;
    this.mods = baseModifiers();
    this.owned = [];
    this.maxHp = 100;
    this.hp = 100;
    this.energy = this.maxEnergy = 100;
    this.kills = 0;
    this.wave = 0;
    this.pos.set(0, 0, 24);
    this.vel.set(0, 0, 0);
    this.vy = 0;
    this.camYaw = Math.PI;
    this.camPitch = -0.1;
    // Reset all transient combat state so restarts are clean.
    this.keys.clear();
    this.mouse.left = false;
    this.mouse.right = false;
    this.fireCd = 0;
    this.meleeCd = 0;
    this.meleeT = 0;
    this.dashCd = 0;
    this.dashT = 0;
    this.empCd = 0;
    this.invuln = 0;
    this.recoil = 0;
    this.hitFlash = 0;
    this.regenAcc = 0;
    this.shakeAmt = 0;
    this.aiming = false;
    if (this.zero.blade) this.zero.blade.visible = false;
    this.zero.group.rotation.z = 0;
    this.clearEntities();
    this.loadArena(false);
    this.running = true;
    this.paused = false;
    this.phase = "IDLE";
    this.waveTimer = 1.6;
    hudStore.set({
      screen: "PLAYING",
      choices: [],
      ownedUpgrades: [],
      bossName: null,
      kills: 0,
      wave: 0,
      totalWaves: WAVES.length + 1,
      objective: "Survive the reactor defense grid",
      hp: this.hp,
      maxHp: this.maxHp,
    });
    sfx.unlock();
    sfx.startAmbient(false);
    sfx.playMusic("game");
    sfx.alarm();
    const save = loadSave();
    persistSave({ ...save, runs: save.runs + 1 });
    setTimeout(() => this.requestLock(), 60);
  }

  pause() {
    if (!this.running) return;
    this.paused = true;
    document.exitPointerLock?.();
    hudStore.set({ screen: "PAUSED" });
  }

  resume() {
    if (!this.running) return;
    this.paused = false;
    hudStore.set({
      screen:
        this.phase === "UPGRADE" ? "UPGRADE" : this.phase === "CLEARED" ? "WAVE_COMPLETE" : "PLAYING",
    });
    this.requestLock();
  }

  toMenu() {
    this.running = false;
    this.paused = false;
    this.phase = "IDLE";
    this.clearEntities();
    this.loadArena(false);
    this.pos.set(6, 0, 20);
    this.camYaw = Math.PI - 0.4;
    sfx.stopAmbient();
    document.exitPointerLock?.();
    hudStore.set({ screen: "MENU", bossName: null });
  }

  showGarage() {
    this.running = false;
    this.paused = false;
    this.clearEntities();
    document.exitPointerLock?.();
    hudStore.set({ screen: "GARAGE" });
  }

  chooseUpgrade(id: string) {
    const up = hudStore.get().choices.find((c) => c.id === id);
    if (!up) return;
    up.apply(this.mods);
    this.owned = [...this.owned, up.name];
    const newMax = Math.round(100 * this.mods.maxHp);
    this.hp = Math.min(newMax, this.hp + (newMax - this.maxHp) + (up.id === "reinforced_chassis" ? newMax : 0));
    this.maxHp = newMax;
    sfx.ui();
    hudStore.set({ choices: [], ownedUpgrades: this.owned, screen: "PLAYING" });
    this.phase = "IDLE";
    this.waveTimer = 1.2;
    this.requestLock();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    sfx.stopAmbient();
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("mouseup", this.onMouseUp);
    document.removeEventListener("mousemove", this.onMouseMove);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private clearEntities() {
    for (const e of this.enemies) {
      this.scene.remove(e.rig.group);
      this.scene.remove(e.barGroup);
    }
    this.enemies = [];
    for (const p of this.projs) {
      p.alive = false;
      p.mesh.visible = false;
      if (p.light) p.light.visible = false;
    }
    for (const s of this.shards) {
      s.alive = false;
      s.mesh.visible = false;
    }
    if (this.boss) {
      this.scene.remove(this.boss.rig.group);
      this.scene.remove(this.boss.laser);
      this.boss = null;
    }
  }

  // ---------- waves ----------

  private startWave() {
    if (this.wave >= WAVES.length) {
      this.startBoss();
      return;
    }
    const def = WAVES[this.wave]!;
    const diff = 1 + this.wave * 0.22;
    let idx = 0;
    for (const s of def.spawns) {
      for (let i = 0; i < s.count; i++) {
        const sp = this.arena.spawnPoints[(idx * 3 + i * 2) % this.arena.spawnPoints.length]!;
        this.spawnEnemy(s.kind, sp, diff);
        idx++;
      }
    }
    this.phase = "FIGHT";
    hudStore.set({
      wave: this.wave + 1,
      screen: "PLAYING",
      objective: `${def.label} — eliminate all hostiles`,
      enemiesLeft: this.enemies.length,
      toast: def.label,
    });
    setTimeout(() => hudStore.set({ toast: null }), 1800);
  }

  private spawnEnemy(kind: EnemyKind, at: THREE.Vector3, diff: number) {
    const st = STATS[kind];
    const rig = buildEnemy(kind);
    this.scene.add(rig.group);
    // Never spawn on top of ZERO
    let p = at.clone();
    let tries = 0;
    while (p.distanceTo(this.pos) < 14 && tries++ < 12) {
      const a = Math.random() * Math.PI * 2;
      const d = this.arena.radius * 0.72;
      p = new THREE.Vector3(Math.cos(a) * d, 0, Math.sin(a) * d);
    }
    const flying = kind === "DRONE";
    p.y = flying ? 4.5 : 0;
    rig.group.position.copy(p);

    const barGroup = new THREE.Group();
    const bg = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.13),
      new THREE.MeshBasicMaterial({ color: 0x101418, transparent: true, opacity: 0.8, depthTest: false }),
    );
    const fill = new THREE.Mesh(
      new THREE.PlaneGeometry(1.16, 0.09),
      new THREE.MeshBasicMaterial({ color: 0xff3b30, depthTest: false }),
    );
    fill.position.z = 0.01;
    barGroup.add(bg, fill);
    barGroup.renderOrder = 999;
    barGroup.visible = false;
    this.scene.add(barGroup);

    this.enemies.push({
      kind,
      rig,
      pos: p,
      vel: new THREE.Vector3(),
      hp: st.hp * diff,
      maxHp: st.hp * diff,
      state: "IDLE",
      timer: Math.random(),
      atkCd: 0.6 + Math.random(),
      stun: 0,
      flash: 0,
      radius: st.radius,
      speed: st.speed,
      dmg: st.dmg * diff,
      range: st.range,
      detect: st.detect,
      flying,
      bobPhase: Math.random() * 6,
      strafe: Math.random() > 0.5 ? 1 : -1,
      anim: Math.random() * 6,
      deathT: 0,
      barGroup,
      barFill: fill,
      barShow: 0,
      yaw: 0,
    });
  }

  private startBoss() {
    this.clearEntities();
    this.loadArena(true);
    this.pos.set(0, 0, 22);
    this.vel.set(0, 0, 0);
    const rig = buildWarden();
    rig.group.position.set(0, 0, -14);
    this.scene.add(rig.group);
    const laser = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.7, 70),
      MAT.energy(0xff3b30, 3.4),
    );
    laser.visible = false;
    this.scene.add(laser);
    const maxHp = 2600;
    this.boss = {
      rig,
      pos: new THREE.Vector3(0, 0, -14),
      hp: maxHp,
      maxHp,
      phase: 1,
      atkT: 2.2,
      state: "IDLE",
      stateT: 0,
      yaw: 0,
      laserAngle: 0,
      laser,
      shockR: 0,
      charge: new THREE.Vector3(),
    };
    this.phase = "FIGHT";
    sfx.stopAmbient();
    sfx.startAmbient(true);
    sfx.alarm();
    hudStore.set({
      wave: WAVES.length + 1,
      screen: "PLAYING",
      bossName: "THE WARDEN",
      bossHp: 1,
      bossPhase: 1,
      objective: "Destroy THE WARDEN",
      toast: "BOSS — THE WARDEN",
      enemiesLeft: 1,
    });
    setTimeout(() => hudStore.set({ toast: null }), 2400);
  }

  private waveCleared() {
    this.phase = "CLEARED";
    this.waveTimer = 2.0;
    this.wave++;
    const reward = 120 + this.wave * 60;
    this.xp += reward;
    this.credits += Math.round(reward * 0.7);
    hudStore.set({
      screen: "WAVE_COMPLETE",
      toast: null,
      xp: this.xp,
      credits: this.credits,
      objective: "Sector secured",
    });
    sfx.ui();
    document.exitPointerLock?.();
  }

  private victory() {
    this.phase = "OVER";
    this.running = false;
    sfx.stopAmbient();
    document.exitPointerLock?.();
    const save = loadSave();
    persistSave({
      ...save,
      xp: this.xp,
      credits: this.credits,
      level: Math.max(save.level, 1 + Math.floor(this.xp / 1200)),
      bestWave: Math.max(save.bestWave, WAVES.length + 1),
      victories: save.victories + 1,
    });
    hudStore.set({ screen: "VICTORY", xp: this.xp, credits: this.credits });
  }

  private defeat() {
    this.phase = "OVER";
    this.running = false;
    sfx.stopAmbient();
    sfx.explosion();
    document.exitPointerLock?.();
    const save = loadSave();
    persistSave({
      ...save,
      xp: this.xp,
      credits: this.credits,
      level: Math.max(save.level, 1 + Math.floor(this.xp / 1200)),
      bestWave: Math.max(save.bestWave, this.wave + 1),
    });
    hudStore.set({ screen: "DEFEAT", xp: this.xp, credits: this.credits });
  }

  // ---------- collision helpers ----------

  private groundHeight(x: number, z: number, currentY: number): number {
    let h = 0;
    for (const p of this.arena.platforms) {
      if (
        Math.abs(x - p.x) < p.w / 2 + 0.3 &&
        Math.abs(z - p.z) < p.d / 2 + 0.3 &&
        p.top <= currentY + 0.75 &&
        p.top > h
      )
        h = p.top;
    }
    return h;
  }

  private resolveObstacles(p: THREE.Vector3, radius: number) {
    for (const o of this.arena.obstacles) {
      const dx = p.x - o.x;
      const dz = p.z - o.z;
      const d = Math.hypot(dx, dz);
      const min = o.r + radius;
      if (d < min && d > 0.0001 && p.y < 12) {
        p.x = o.x + (dx / d) * min;
        p.z = o.z + (dz / d) * min;
      }
    }
    const dist = Math.hypot(p.x, p.z);
    const lim = this.arena.radius - radius;
    if (dist > lim) {
      p.x = (p.x / dist) * lim;
      p.z = (p.z / dist) * lim;
    }
  }

  // ---------- projectiles ----------

  private fireProjectile(
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    speed: number,
    dmg: number,
    from: "player" | "enemy",
    color: number,
    radius = 0.28,
    life = 3,
  ) {
    let p = this.projs.find((x) => !x.alive);
    if (!p) {
      if (this.projs.length > 90) return;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(1, 8, 8),
        new THREE.MeshBasicMaterial({ color }),
      );
      const light = this.projs.length < 12 ? new THREE.PointLight(color, 6, 8, 2) : null;
      if (light) mesh.add(light);
      this.scene.add(mesh);
      p = {
        mesh,
        light,
        vel: new THREE.Vector3(),
        life: 0,
        dmg: 0,
        from,
        radius,
        color,
        alive: false,
      };
      this.projs.push(p);
    }
    p.alive = true;
    p.mesh.visible = true;
    p.mesh.position.copy(origin);
    p.mesh.scale.set(radius, radius, radius * 2.4);
    p.mesh.lookAt(tmpV.copy(origin).add(dir));
    (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(color);
    if (p.light) {
      p.light.color.setHex(color);
      p.light.visible = true;
    }
    p.vel.copy(dir).normalize().multiplyScalar(speed);
    p.life = life;
    p.dmg = dmg;
    p.from = from;
    p.radius = radius;
    p.color = color;
  }

  private killProj(p: Proj) {
    p.alive = false;
    p.mesh.visible = false;
    if (p.light) p.light.visible = false;
  }

  private spawnShards(at: THREE.Vector3, count: number) {
    for (let i = 0; i < count; i++) {
      let s = this.shards.find((x) => !x.alive);
      if (!s) {
        const mesh = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.22),
          MAT.energy(0x7cf3ff, 2.6),
        );
        this.scene.add(mesh);
        s = { mesh, pos: new THREE.Vector3(), life: 0, alive: false, vy: 0 };
        this.shards.push(s);
      }
      s.alive = true;
      s.mesh.visible = true;
      s.pos.copy(at).add(new THREE.Vector3((Math.random() - 0.5) * 2, 0.6, (Math.random() - 0.5) * 2));
      s.vy = 2 + Math.random() * 2;
      s.life = 22;
    }
  }

  // ---------- damage ----------

  private damageEnemy(e: Enemy, dmg: number, knock?: THREE.Vector3) {
    if (e.state === "DEAD") return;
    e.hp -= dmg;
    e.flash = 0.12;
    e.barShow = 3;
    if (knock) e.vel.addScaledVector(knock, e.kind === "TANK" ? 1.5 : 6);
    if (e.hp <= 0) {
      e.state = "DEAD";
      e.deathT = 1.1;
      this.kills++;
      this.fx.burst(e.rig.group.position.clone().setY(e.flying ? e.pos.y : 1), {
        count: 22,
        color: 0xffa63c,
        speed: 9,
        size: 0.14,
        life: 0.8,
      });
      this.fx.ring(e.rig.group.position.clone().setY(0.1), 3.4, 0xffa63c, 0.5);
      sfx.explosion();
      this.spawnShards(e.rig.group.position, 2 + Math.floor(Math.random() * 2));
      hudStore.set({ kills: this.kills });
    } else {
      sfx.hit();
    }
  }

  private damagePlayer(dmg: number) {
    if (this.invuln > 0 || this.phase === "OVER") return;
    this.hp -= dmg;
    this.hitFlash = 0.45;
    this.shakeAmt = Math.min(0.5, this.shakeAmt + dmg * 0.012);
    this.invuln = 0.25;
    sfx.hit();
    hudStore.set({ damageFlash: performance.now() });
    if (this.hp <= 0) {
      this.hp = 0;
      this.fx.burst(this.pos.clone().setY(1), { count: 30, color: 0x2ee6ff, speed: 10, life: 1 });
      this.defeat();
    }
  }

  private splash(at: THREE.Vector3, radius: number, dmg: number, hitPlayer: boolean) {
    for (const e of this.enemies) {
      if (e.state === "DEAD") continue;
      const d = e.rig.group.position.distanceTo(at);
      if (d < radius)
        this.damageEnemy(e, dmg * (1 - d / radius), tmpV.copy(e.pos).sub(at).setY(0).normalize());
    }
    if (hitPlayer && this.pos.distanceTo(at) < radius) this.damagePlayer(dmg * 0.5);
    for (const d of this.arena.destructibles) {
      if (d.dead) continue;
      if (tmpV.set(d.x, d.y, d.z).distanceTo(at) < radius) this.hitDestructible(d, 999);
    }
  }

  private hitDestructible(d: Destructible, dmg: number) {
    if (d.dead) return;
    d.hp -= dmg;
    if (d.hp > 0) {
      this.fx.burst(tmpV.set(d.x, d.y, d.z), { count: 4, color: 0xffa63c, speed: 4, size: 0.07 });
      return;
    }
    d.dead = true;
    d.mesh.visible = false;
    const at = new THREE.Vector3(d.x, d.y, d.z);
    if (d.explosive) {
      this.fx.burst(at, { count: 26, color: 0xff7a1f, speed: 12, size: 0.18, life: 0.9 });
      this.fx.ring(at.clone().setY(0.1), 6, 0xff7a1f, 0.5);
      this.splash(at, 7, 70, true);
      this.shakeAmt = Math.min(0.6, this.shakeAmt + 0.25);
      sfx.explosion();
    } else {
      this.fx.burst(at, { count: 12, color: 0x8899aa, speed: 6, size: 0.12 });
      sfx.hit();
    }
  }

  // ---------- update ----------

  private updatePlayer(dt: number) {
    const alive = this.hp > 0;
    // Input direction
    let ix = 0;
    let iz = 0;
    if (this.keys.has("KeyW")) iz -= 1;
    if (this.keys.has("KeyS")) iz += 1;
    if (this.keys.has("KeyA")) ix -= 1;
    if (this.keys.has("KeyD")) ix += 1;
    ix += this.touch.moveX;
    iz += this.touch.moveY;
    if (this.touch.lookX || this.touch.lookY) {
      this.camYaw -= this.touch.lookX * dt * 2.6;
      this.camPitch = THREE.MathUtils.clamp(this.camPitch - this.touch.lookY * dt * 1.8, -0.85, 0.6);
    }
    const len = Math.hypot(ix, iz);
    if (len > 1) {
      ix /= len;
      iz /= len;
    }
    const sprint = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");
    this.aiming = this.mouse.right;
    const baseSpeed = (this.aiming ? 4.2 : sprint ? 11 : 7.2) * this.mods.moveSpeed;

    // Camera-relative movement
    const fwd = tmpV.set(Math.sin(this.camYaw), 0, Math.cos(this.camYaw));
    const right = tmpV2.set(Math.sin(this.camYaw - Math.PI / 2), 0, Math.cos(this.camYaw - Math.PI / 2));
    const desired = new THREE.Vector3()
      .addScaledVector(fwd, iz)
      .addScaledVector(right, ix)
      .multiplyScalar(alive ? baseSpeed : 0);

    // Dash
    this.dashCd = Math.max(0, this.dashCd - dt);
    if (this.keys.has("Space") && this.dashCd <= 0 && this.dashT <= 0 && alive && this.energy >= 15) {
      this.dashT = 0.22;
      this.dashCd = 1.5 * this.mods.dashCd;
      this.energy -= 15;
      this.invuln = 0.3;
      this.dashDir.copy(desired.lengthSq() > 0.1 ? desired : fwd.clone().multiplyScalar(-1)).setY(0).normalize();
      sfx.dash();
      this.fx.ring(this.pos.clone().setY(0.15), 2.4, 0x2ee6ff, 0.35);
      this.camDist += 1.4;
    }
    if (this.dashT > 0) {
      this.dashT -= dt;
      this.vel.copy(this.dashDir).multiplyScalar(26);
      this.fx.trail(this.pos.clone().setY(0.9 + Math.random() * 0.6), 0x2ee6ff, 0.12);
    } else {
      const k = desired.lengthSq() > 0.01 ? 12 : 9;
      const f = 1 - Math.exp(-k * dt);
      this.vel.lerp(desired, f);
    }

    // Gravity + platform support
    this.vy -= 26 * dt;
    const next = this.pos.clone().addScaledVector(this.vel, dt);
    next.y += this.vy * dt;
    this.resolveObstacles(next, 0.55);
    const gh = this.groundHeight(next.x, next.z, this.pos.y);
    if (next.y <= gh) {
      next.y = gh;
      this.vy = 0;
      this.grounded = true;
    } else this.grounded = false;
    this.pos.copy(next);

    // Facing
    const moving = this.vel.lengthSq() > 1;
    const targetYaw = this.aiming || this.mouse.left ? this.camYaw : moving ? Math.atan2(this.vel.x, this.vel.z) : this.yaw;
    let diff = targetYaw - this.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.yaw += diff * (1 - Math.exp(-14 * dt));
    this.zero.group.position.copy(this.pos);
    this.zero.group.rotation.y = this.yaw;

    // Energy / regen / cooldowns
    this.energy = Math.min(this.maxEnergy, this.energy + 14 * this.mods.energyRegen * dt);
    this.empCd = Math.max(0, this.empCd - dt);
    this.fireCd = Math.max(0, this.fireCd - dt);
    this.meleeCd = Math.max(0, this.meleeCd - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.recoil = Math.max(0, this.recoil - dt * 5);
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    if (this.mods.regen > 0 && alive) {
      this.regenAcc += dt;
      if (this.regenAcc >= 5) {
        this.regenAcc = 0;
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * this.mods.regen * 5);
      }
    }

    // Aim point (screen centre raycast)
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hits = this.raycaster.intersectObjects([this.arena.group], true);
    this.aimPoint.copy(
      hits.length && hits[0]!.distance < 120
        ? hits[0]!.point
        : this.camera.position.clone().addScaledVector(this.raycaster.ray.direction, 80),
    );

    // Fire
    const rof = 0.16 / this.mods.fireRate;
    if (this.mouse.left && this.fireCd <= 0 && alive && this.energy >= 4 && this.phase !== "OVER") {
      this.fireCd = rof;
      this.energy -= 4;
      this.recoil = 1;
      const origin = new THREE.Vector3();
      this.zero.muzzle.getWorldPosition(origin);
      const dir = this.aimPoint.clone().sub(origin).normalize();
      dir.x += (Math.random() - 0.5) * (this.aiming ? 0.008 : 0.03);
      dir.y += (Math.random() - 0.5) * (this.aiming ? 0.008 : 0.03);
      this.fireProjectile(origin, dir, 78, 24 * this.mods.damage, "player", 0x7cf3ff, 0.16);
      this.fx.burst(origin, { count: 4, color: 0x9fefff, speed: 4, size: 0.07, life: 0.16, grav: 0 });
      this.shakeAmt = Math.min(0.25, this.shakeAmt + 0.02);
      sfx.shot();
    }

    // Melee
    if (this.keys.has("KeyE") && this.meleeCd <= 0 && alive) {
      this.meleeCd = 0.75;
      this.meleeT = 0.35;
      sfx.melee();
      if (this.zero.blade) this.zero.blade.visible = true;
      const fdir = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
      const at = this.pos.clone().addScaledVector(fdir, 1.6).setY(1.1);
      this.fx.ring(at, 2.4, 0x9fefff, 0.3, true);
      for (const e of this.enemies) {
        if (e.state === "DEAD") continue;
        const d = e.rig.group.position.distanceTo(this.pos);
        if (d < 3.4) {
          const to = tmpV.copy(e.rig.group.position).sub(this.pos).setY(0).normalize();
          if (to.dot(fdir) > 0.2) {
            this.damageEnemy(e, 62 * this.mods.damage, to);
            this.fx.burst(e.rig.group.position.clone().setY(1.2), {
              count: 12,
              color: 0x9fefff,
              speed: 7,
              size: 0.1,
            });
          }
        }
      }
      if (this.boss && this.pos.distanceTo(this.boss.pos) < 7) this.damageBoss(70 * this.mods.damage);
    }
    if (this.meleeT > 0) {
      this.meleeT -= dt;
      if (this.meleeT <= 0 && this.zero.blade) this.zero.blade.visible = false;
    }

    // EMP
    if (this.keys.has("KeyQ") && this.empCd <= 0 && alive && this.energy >= 35) {
      this.empCd = 9;
      this.energy -= 35;
      const radius = 12 * this.mods.empRadius;
      this.fx.ring(this.pos.clone().setY(0.4), radius, 0x9fefff, 0.7);
      this.fx.burst(this.pos.clone().setY(1), {
        count: 26,
        color: 0x7cf3ff,
        speed: 12,
        size: 0.1,
        life: 0.6,
        grav: 2,
      });
      this.shakeAmt = Math.min(0.6, this.shakeAmt + 0.3);
      sfx.emp();
      for (const e of this.enemies) {
        if (e.state === "DEAD") continue;
        const d = e.rig.group.position.distanceTo(this.pos);
        if (d < radius) {
          e.stun = 2.6;
          e.state = "STUN";
          this.damageEnemy(e, 30 * this.mods.damage);
        }
      }
      if (this.boss && this.pos.distanceTo(this.boss.pos) < radius + 4)
        this.damageBoss(60 * this.mods.damage);
      for (const p of this.projs) if (p.alive && p.from === "enemy") this.killProj(p);
    }

    // Procedural animation
    const speed2d = Math.hypot(this.vel.x, this.vel.z);
    this.walkPhase += dt * (2 + speed2d * 1.15);
    const stride = THREE.MathUtils.clamp(speed2d / 8, 0, 1);
    const swing = Math.sin(this.walkPhase * 2) * 0.7 * stride;
    this.zero.legR.rotation.x = swing;
    this.zero.legL.rotation.x = -swing;
    this.zero.torso.position.y = 1.18 + Math.sin(this.walkPhase * 4) * 0.045 * stride + (this.grounded ? 0 : 0.05);
    this.zero.torso.rotation.z = Math.sin(this.walkPhase * 2) * 0.04 * stride;
    const idle = Math.sin(this.walkPhase * 1.4) * 0.05 * (1 - stride);
    const aimPose = this.aiming || this.mouse.left ? 1 : 0;
    const armAim = THREE.MathUtils.lerp(-0.25, -1.45, aimPose);
    this.zero.armR.rotation.x = THREE.MathUtils.lerp(
      this.zero.armR.rotation.x,
      armAim - this.recoil * 0.3 + idle,
      1 - Math.exp(-12 * dt),
    );
    this.zero.armL.rotation.x = THREE.MathUtils.lerp(
      this.zero.armL.rotation.x,
      this.meleeT > 0 ? -2.2 + Math.sin((0.35 - this.meleeT) * 12) : -swing * 0.7 + idle,
      1 - Math.exp(-14 * dt),
    );
    this.zero.head.rotation.x = THREE.MathUtils.clamp(this.camPitch * 0.4, -0.3, 0.3);
    if (this.dashT > 0) this.zero.torso.rotation.x = 0.35;
    else this.zero.torso.rotation.x = THREE.MathUtils.lerp(this.zero.torso.rotation.x, stride * 0.12, 1 - Math.exp(-10 * dt));
    if (this.hp <= 0) {
      this.zero.group.rotation.z = THREE.MathUtils.lerp(this.zero.group.rotation.z, 1.4, 1 - Math.exp(-4 * dt));
      this.zero.torso.position.y = THREE.MathUtils.lerp(this.zero.torso.position.y, 0.55, 1 - Math.exp(-4 * dt));
    } else this.zero.group.rotation.z = 0;

    // Footstep audio
    if (stride > 0.2 && this.grounded) {
      this.stepAcc += dt * (2 + speed2d);
      if (this.stepAcc > 3.4) {
        this.stepAcc = 0;
        sfx.step();
      }
    }

    // Visor flash on damage
    const em = 3.2 + (this.hitFlash > 0 ? 4 : 0) + Math.sin(this.walkPhase) * 0.2;
    this.zero.glowMats[0]!.emissiveIntensity = em;
    this.zero.glowMats[0]!.color.setHex(this.hitFlash > 0 ? 0xff4a3c : 0x2ee6ff);
    this.zero.glowMats[0]!.emissive.setHex(this.hitFlash > 0 ? 0xff4a3c : 0x2ee6ff);
    this.playerLight.position.copy(this.pos).setY(1.4);
  }

  private updateEnemies(dt: number) {
    const playerPos = this.pos;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]!;
      const g = e.rig.group;

      if (e.state === "DEAD") {
        e.deathT -= dt;
        const t = Math.max(0, e.deathT / 1.1);
        g.rotation.z += dt * 2.2;
        g.position.y = Math.max(0, g.position.y - dt * 3);
        g.scale.setScalar(Math.max(0.01, t));
        e.barGroup.visible = false;
        if (e.deathT <= 0) {
          this.scene.remove(g);
          this.scene.remove(e.barGroup);
          this.enemies.splice(i, 1);
        }
        continue;
      }

      const toPlayer = tmpV.copy(playerPos).sub(e.pos);
      const dist = toPlayer.length();
      const dirFlat = tmpV2.copy(toPlayer).setY(0).normalize();
      e.timer -= dt;
      e.atkCd -= dt;
      e.flash = Math.max(0, e.flash - dt);
      e.barShow = Math.max(0, e.barShow - dt);
      e.anim += dt;

      if (e.stun > 0) {
        e.stun -= dt;
        e.state = e.stun > 0 ? "STUN" : "CHASE";
        e.vel.multiplyScalar(1 - Math.exp(-4 * dt));
        g.rotation.z = Math.sin(e.anim * 40) * 0.12;
        e.rig.glowMats[0]!.emissiveIntensity = Math.random() > 0.5 ? 0.2 : 3;
        e.pos.addScaledVector(e.vel, dt);
        this.resolveObstacles(e.pos, e.radius);
        g.position.copy(e.pos);
        continue;
      }
      g.rotation.z = 0;
      e.rig.glowMats[0]!.emissiveIntensity = e.flash > 0 ? 6 : 2.6;
      for (const m of e.rig.bodyMats) {
        m.emissive.setHex(e.flash > 0 ? 0xffffff : 0x000000);
        m.emissiveIntensity = e.flash > 0 ? 0.9 : 0;
      }

      // ---- FSM ----
      let move = new THREE.Vector3();
      const alivePlayer = this.hp > 0;
      if (!alivePlayer) e.state = "IDLE";
      else if (e.state === "IDLE" || e.state === "PATROL") {
        if (dist < e.detect) e.state = "CHASE";
        else if (e.timer <= 0) {
          e.timer = 2 + Math.random() * 2;
          e.strafe *= -1;
        }
        move.set(Math.cos(e.anim * 0.4) * e.strafe, 0, Math.sin(e.anim * 0.4)).multiplyScalar(0.25);
      } else {
        const desiredRange = e.kind === "SCOUT" ? 1.6 : e.kind === "HUNTER" ? 9 : e.kind === "TANK" ? 14 : 15;
        if (dist > desiredRange * 1.25) e.state = "CHASE";
        else if (dist < desiredRange * 0.65 && e.kind !== "SCOUT") e.state = "RETREAT";
        else e.state = "ATTACK";

        if (e.state === "CHASE") move.copy(dirFlat);
        else if (e.state === "RETREAT") move.copy(dirFlat).multiplyScalar(-1);
        // Strafe / flank behaviour
        const side = tmpV.set(-dirFlat.z, 0, dirFlat.x).multiplyScalar(e.strafe);
        if (e.kind === "HUNTER") move.addScaledVector(side, 1.1);
        else if (e.kind === "DRONE") move.addScaledVector(side, 1.4);
        else if (e.kind !== "SCOUT") move.addScaledVector(side, 0.45);
        if (e.timer <= 0) {
          e.timer = 1.6 + Math.random() * 2.2;
          e.strafe *= -1;
        }

        // Attacks
        if (e.atkCd <= 0 && dist < e.range + 2) {
          e.atkCd = STATS[e.kind].cd * (0.85 + Math.random() * 0.4);
          if (e.kind === "SCOUT" || (e.kind === "HUNTER" && dist < 3)) {
            if (dist < 3.2) {
              this.damagePlayer(e.dmg);
              this.fx.burst(playerPos.clone().setY(1.1), { count: 8, color: 0xff5a3c, speed: 6, size: 0.09 });
              sfx.melee();
            }
          } else {
            const origin = new THREE.Vector3();
            e.rig.muzzle.getWorldPosition(origin);
            const aim = tmpV
              .copy(playerPos)
              .setY(playerPos.y + 1.1)
              .sub(origin)
              .normalize();
            aim.x += (Math.random() - 0.5) * 0.05;
            aim.y += (Math.random() - 0.5) * 0.03;
            const cfg =
              e.kind === "TANK"
                ? { s: 34, r: 0.5, c: 0xffa63c }
                : e.kind === "DRONE"
                  ? { s: 30, r: 0.32, c: 0x2ee6ff }
                  : e.kind === "HUNTER"
                    ? { s: 52, r: 0.2, c: 0x38ff9e }
                    : { s: 40, r: 0.28, c: 0x9b6bff };
            this.fireProjectile(origin, aim, cfg.s, e.dmg, "enemy", cfg.c, cfg.r, 4);
            this.fx.burst(origin, { count: 3, color: cfg.c, speed: 3, size: 0.07, life: 0.14, grav: 0 });
            sfx.enemyShot();
          }
        }
      }

      // Separation from other enemies
      for (const o of this.enemies) {
        if (o === e || o.state === "DEAD") continue;
        const dx = e.pos.x - o.pos.x;
        const dz = e.pos.z - o.pos.z;
        const d2 = Math.hypot(dx, dz);
        const min = e.radius + o.radius + 0.4;
        if (d2 < min && d2 > 0.001) move.add(tmpV.set(dx / d2, 0, dz / d2).multiplyScalar(1.4));
      }

      if (move.lengthSq() > 0.0001) move.normalize();
      const targetVel = move.multiplyScalar(e.speed * (e.state === "ATTACK" ? 0.6 : 1));
      e.vel.lerp(targetVel, 1 - Math.exp(-8 * dt));
      e.pos.addScaledVector(e.vel, dt);
      this.resolveObstacles(e.pos, e.radius);
      if (e.flying) {
        const targetY = 4.2 + Math.sin(e.anim * 1.4 + e.bobPhase) * 1.1;
        e.pos.y += (targetY - e.pos.y) * (1 - Math.exp(-3 * dt));
      } else {
        const gh = this.groundHeight(e.pos.x, e.pos.z, e.pos.y + 0.4);
        e.pos.y += (gh - e.pos.y) * (1 - Math.exp(-10 * dt));
      }
      g.position.copy(e.pos);

      // Face the player
      if (dist < e.detect) {
        const wanted = Math.atan2(dirFlat.x, dirFlat.z);
        let d = wanted - e.yaw;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        e.yaw += d * (1 - Math.exp(-9 * dt));
        g.rotation.y = e.yaw;
      }

      // Procedural locomotion
      const sp = Math.hypot(e.vel.x, e.vel.z);
      if (e.flying) {
        e.rig.torso.rotation.z = Math.sin(e.anim * 3) * 0.08;
        e.rig.torso.rotation.x = -sp * 0.03;
        e.rig.torso.rotation.y += dt * 1.2;
      } else {
        const st = THREE.MathUtils.clamp(sp / e.speed, 0, 1);
        const sw = Math.sin(e.anim * (5 + e.speed * 0.5)) * 0.6 * st;
        e.rig.legR.rotation.x = sw;
        e.rig.legL.rotation.x = -sw;
        e.rig.armR.rotation.x = e.state === "ATTACK" ? -1.3 : -sw * 0.5;
        e.rig.armL.rotation.x = sw * 0.5;
        e.rig.torso.position.y =
          (e.kind === "TANK" ? 1.9 : e.kind === "SENTINEL" ? 1.2 : e.kind === "HUNTER" ? 1.15 : 1.0) +
          Math.abs(Math.sin(e.anim * 8)) * 0.05 * st;
      }

      // Health bar billboard
      const showBar = e.barShow > 0 || dist < 22;
      e.barGroup.visible = showBar;
      if (showBar) {
        e.barGroup.position.copy(g.position).setY(g.position.y + e.rig.height + 0.5);
        e.barGroup.quaternion.copy(this.camera.quaternion);
        const ratio = Math.max(0, e.hp / e.maxHp);
        e.barFill.scale.x = ratio;
        e.barFill.position.x = -(1 - ratio) * 0.58;
        (e.barFill.material as THREE.MeshBasicMaterial).color.setHex(
          ratio > 0.5 ? 0x38ff9e : ratio > 0.25 ? 0xffa63c : 0xff3b30,
        );
        const s = THREE.MathUtils.clamp(dist / 22, 0.5, 1.4);
        e.barGroup.scale.setScalar(s * (e.kind === "TANK" ? 1.7 : 1));
      }
    }
  }

  private damageBoss(dmg: number) {
    if (!this.boss) return;
    const shielded = this.boss.phase === 1;
    this.boss.hp -= dmg * (shielded ? 0.55 : 1);
    sfx.hit();
    if (shielded) {
      const m = this.boss.rig.shield.material as THREE.MeshStandardMaterial;
      m.opacity = 0.5;
    }
    const ratio = this.boss.hp / this.boss.maxHp;
    let phase = 1;
    if (ratio < 0.33) phase = 3;
    else if (ratio < 0.66) phase = 2;
    if (phase !== this.boss.phase) {
      this.boss.phase = phase;
      this.shakeAmt = 0.6;
      sfx.explosion();
      this.fx.ring(this.boss.pos.clone().setY(1), 16, phase === 2 ? 0x2ee6ff : 0xff3b30, 0.9);
      if (phase >= 2) this.boss.rig.shield.visible = false;
      hudStore.set({ bossPhase: phase, toast: phase === 2 ? "SHIELD BREACHED" : "WARDEN ENRAGED" });
      setTimeout(() => hudStore.set({ toast: null }), 1800);
    }
    hudStore.set({ bossHp: Math.max(0, ratio) });
    if (this.boss.hp <= 0) {
      const p = this.boss.pos.clone();
      this.fx.burst(p.clone().setY(4), { count: 60, color: 0xffa63c, speed: 16, size: 0.25, life: 1.6 });
      this.fx.ring(p.clone().setY(0.2), 22, 0xffa63c, 1.2);
      this.scene.remove(this.boss.rig.group);
      this.scene.remove(this.boss.laser);
      this.boss = null;
      this.shakeAmt = 0.8;
      this.kills++;
      this.xp += 900;
      this.credits += 700;
      sfx.explosion();
      hudStore.set({ bossName: null, kills: this.kills });
      setTimeout(() => this.victory(), 1600);
    }
  }

  private updateBoss(dt: number) {
    const b = this.boss;
    if (!b) return;
    const rig = b.rig;
    const toPlayer = tmpV.copy(this.pos).sub(b.pos).setY(0);
    const dist = toPlayer.length();
    const dir = toPlayer.clone().normalize();
    const wanted = Math.atan2(dir.x, dir.z);
    let d = wanted - b.yaw;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    b.yaw += d * (1 - Math.exp(-2.4 * dt));
    rig.group.rotation.y = b.yaw;

    const speedMul = b.phase === 3 ? 1.6 : b.phase === 2 ? 1.25 : 1;
    b.atkT -= dt * speedMul;
    b.stateT -= dt;

    if (b.state === "IDLE") {
      // Reposition
      if (dist > 16) b.pos.addScaledVector(dir, 3.4 * speedMul * dt);
      else if (dist < 10) b.pos.addScaledVector(dir, -2.2 * dt);
      const walk = Math.sin(performance.now() * 0.003 * speedMul) * 0.35;
      rig.legR.rotation.x = walk;
      rig.legL.rotation.x = -walk;
      rig.torso.position.y = 5 + Math.abs(Math.sin(performance.now() * 0.006)) * 0.15;
      if (b.atkT <= 0) {
        const options = ["BARRAGE", "SHOCK", "LASER", "CHARGE"];
        if (b.phase >= 2) options.push("SUMMON", "BARRAGE");
        b.state = options[Math.floor(Math.random() * options.length)]!;
        b.stateT = b.state === "LASER" ? 2.6 : b.state === "CHARGE" ? 1.6 : b.state === "BARRAGE" ? 1.6 : 1.0;
        b.atkT = (b.phase === 3 ? 1.6 : 2.6) + Math.random();
        if (b.state === "CHARGE") b.charge.copy(dir);
        if (b.state === "SHOCK") b.shockR = 0;
        if (b.state === "LASER") b.laserAngle = b.yaw - 0.9;
        sfx.alarm();
      }
    } else if (b.state === "BARRAGE") {
      rig.armR.rotation.x = -0.7;
      rig.armL.rotation.x = -0.7;
      if (Math.random() < dt * 9) {
        const origin = new THREE.Vector3();
        (Math.random() > 0.5 ? rig.cannonR : rig.cannonL).getWorldPosition(origin);
        const aim = tmpV2
          .copy(this.pos)
          .setY(this.pos.y + 1.2)
          .sub(origin)
          .normalize();
        aim.x += (Math.random() - 0.5) * 0.14;
        aim.z += (Math.random() - 0.5) * 0.14;
        this.fireProjectile(origin, aim, 42, 14, "enemy", 0xff3b30, 0.38, 4);
        this.fx.burst(origin, { count: 4, color: 0xff7a3c, speed: 5, size: 0.12, life: 0.2, grav: 0 });
        sfx.enemyShot();
      }
      if (b.stateT <= 0) b.state = "IDLE";
    } else if (b.state === "SHOCK") {
      rig.torso.position.y = 5 - Math.min(1.2, (1.0 - b.stateT) * 3);
      if (b.stateT <= 0.55 && b.shockR === 0) {
        b.shockR = 0.1;
        this.fx.ring(b.pos.clone().setY(0.2), 30, 0xffa63c, 1.0);
        this.shakeAmt = 0.5;
        sfx.explosion();
      }
      if (b.shockR > 0) {
        b.shockR += dt * 28;
        const pd = this.pos.distanceTo(b.pos);
        if (Math.abs(pd - b.shockR) < 2.4 && this.invuln <= 0) this.damagePlayer(20);
      }
      if (b.stateT <= 0) {
        b.state = "IDLE";
        b.shockR = 0;
      }
    } else if (b.state === "LASER") {
      b.laserAngle += dt * 0.85;
      const lp = b.pos.clone().setY(5);
      b.laser.visible = true;
      b.laser.position.copy(lp).add(
        new THREE.Vector3(Math.sin(b.laserAngle) * 30, 0, Math.cos(b.laserAngle) * 30),
      );
      b.laser.lookAt(lp);
      rig.group.rotation.y = b.laserAngle;
      const toP = tmpV.copy(this.pos).sub(b.pos).setY(0);
      const pa = Math.atan2(toP.x, toP.z);
      let ad = pa - b.laserAngle;
      while (ad > Math.PI) ad -= Math.PI * 2;
      while (ad < -Math.PI) ad += Math.PI * 2;
      if (Math.abs(ad) < 0.09 && this.invuln <= 0) {
        this.damagePlayer(16);
        this.fx.burst(this.pos.clone().setY(1), { count: 6, color: 0xff3b30, speed: 6, size: 0.1 });
      }
      if (b.stateT <= 0) {
        b.laser.visible = false;
        b.state = "IDLE";
      }
    } else if (b.state === "CHARGE") {
      b.pos.addScaledVector(b.charge, 26 * dt);
      this.fx.trail(b.pos.clone().setY(1 + Math.random() * 3), 0xff3b30, 0.3);
      if (this.pos.distanceTo(b.pos) < 6 && this.invuln <= 0) {
        this.damagePlayer(26);
        this.vel.addScaledVector(b.charge, 14);
      }
      if (b.stateT <= 0) b.state = "IDLE";
    } else if (b.state === "SUMMON") {
      if (b.stateT > 0.9) {
        for (let i = 0; i < 2; i++) {
          const a = Math.random() * Math.PI * 2;
          this.spawnEnemy("DRONE", new THREE.Vector3(Math.cos(a) * 18, 0, Math.sin(a) * 18), 1.3);
        }
        this.fx.ring(b.pos.clone().setY(6), 8, 0x2ee6ff, 0.6);
        b.stateT = 0.5;
      }
      if (b.stateT <= 0) b.state = "IDLE";
    }

    // Keep the boss on the platform
    const bd = Math.hypot(b.pos.x, b.pos.z);
    if (bd > this.arena.radius - 6) {
      b.pos.x = (b.pos.x / bd) * (this.arena.radius - 6);
      b.pos.z = (b.pos.z / bd) * (this.arena.radius - 6);
      if (b.state === "CHARGE") b.state = "IDLE";
    }
    rig.group.position.copy(b.pos);
    const sm = rig.shield.material as THREE.MeshStandardMaterial;
    sm.opacity = THREE.MathUtils.lerp(sm.opacity, 0.22, 1 - Math.exp(-4 * dt));
    rig.shield.rotation.y += dt * 0.4;
  }

  private updateProjectiles(dt: number) {
    for (const p of this.projs) {
      if (!p.alive) continue;
      p.life -= dt;
      if (p.life <= 0) {
        this.killProj(p);
        continue;
      }
      p.mesh.position.addScaledVector(p.vel, dt);
      if (Math.random() < 0.5) this.fx.trail(p.mesh.position.clone(), p.color, p.radius * 0.7);
      const pp = p.mesh.position;

      // World bounds
      if (pp.y < 0.05 || Math.hypot(pp.x, pp.z) > this.arena.radius + 2 || pp.y > 34) {
        this.fx.burst(pp.clone(), { count: 5, color: p.color, speed: 4, size: 0.08, life: 0.3 });
        this.killProj(p);
        continue;
      }
      // Obstacles
      let blocked = false;
      for (const o of this.arena.obstacles) {
        if (Math.hypot(pp.x - o.x, pp.z - o.z) < o.r && pp.y < 12) blocked = true;
      }
      if (blocked) {
        this.fx.burst(pp.clone(), { count: 6, color: p.color, speed: 5, size: 0.08, life: 0.35 });
        sfx.hit();
        this.killProj(p);
        continue;
      }

      if (p.from === "player") {
        let hit = false;
        for (const e of this.enemies) {
          if (e.state === "DEAD") continue;
          const c = tmpV.copy(e.pos).setY(e.pos.y + e.rig.height * 0.55);
          if (c.distanceTo(pp) < e.radius + e.rig.height * 0.32 + p.radius) {
            this.damageEnemy(e, p.dmg, tmpV2.copy(p.vel).setY(0).normalize().multiplyScalar(0.2));
            this.fx.burst(pp.clone(), { count: 7, color: 0x9fefff, speed: 6, size: 0.09, life: 0.35 });
            hit = true;
            break;
          }
        }
        if (!hit && this.boss) {
          const bc = tmpV.copy(this.boss.pos).setY(5);
          if (bc.distanceTo(pp) < 4.4) {
            this.damageBoss(p.dmg);
            this.fx.burst(pp.clone(), {
              count: 8,
              color: this.boss.phase === 1 ? 0x2ee6ff : 0xffa63c,
              speed: 6,
              size: 0.1,
              life: 0.35,
            });
            hit = true;
          }
        }
        if (!hit) {
          for (const d of this.arena.destructibles) {
            if (d.dead) continue;
            if (tmpV.set(d.x, d.y, d.z).distanceTo(pp) < d.r + p.radius) {
              this.hitDestructible(d, p.dmg);
              hit = true;
              break;
            }
          }
        }
        if (hit) this.killProj(p);
      } else {
        const pc = tmpV.copy(this.pos).setY(this.pos.y + 1.0);
        if (pc.distanceTo(pp) < 0.75 + p.radius) {
          this.damagePlayer(p.dmg);
          this.fx.burst(pp.clone(), { count: 8, color: p.color, speed: 6, size: 0.09, life: 0.35 });
          this.killProj(p);
        }
      }
    }
  }

  private updateShards(dt: number) {
    for (const s of this.shards) {
      if (!s.alive) continue;
      s.life -= dt;
      s.vy -= 14 * dt;
      s.pos.y += s.vy * dt;
      if (s.pos.y < 0.4) {
        s.pos.y = 0.4;
        s.vy = 0;
      }
      const toP = tmpV.copy(this.pos).setY(this.pos.y + 0.7).sub(s.pos);
      const d = toP.length();
      if (d < 5) s.pos.addScaledVector(toP.normalize(), (5 - d) * 3 * dt);
      s.mesh.position.copy(s.pos);
      s.mesh.rotation.y += dt * 3;
      s.mesh.rotation.x += dt * 2;
      if (d < 1.2 || s.life <= 0) {
        s.alive = false;
        s.mesh.visible = false;
        if (d < 1.2) {
          this.xp += 25;
          this.credits += 12;
          this.energy = Math.min(this.maxEnergy, this.energy + 6);
          this.fx.burst(s.pos.clone(), { count: 4, color: 0x7cf3ff, speed: 3, size: 0.06, life: 0.3 });
          hudStore.set({ xp: this.xp, credits: this.credits });
        }
      }
    }
  }

  private updateCamera(dt: number) {
    const sprint = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");
    const targetFov = this.aiming ? 52 : sprint ? 70 : 62;
    this.camera.fov += (targetFov - this.camera.fov) * (1 - Math.exp(-6 * dt));
    this.camera.updateProjectionMatrix();

    const targetDist = this.aiming ? 3.6 : 6.4;
    this.camDist += (targetDist - this.camDist) * (1 - Math.exp(-6 * dt));

    const focus = tmpV.copy(this.pos).setY(this.pos.y + 1.65);
    const shoulder = tmpV2
      .set(Math.sin(this.camYaw - Math.PI / 2), 0, Math.cos(this.camYaw - Math.PI / 2))
      .multiplyScalar(this.aiming ? 0.85 : 0.55);
    focus.add(shoulder);

    const dir = new THREE.Vector3(
      Math.sin(this.camYaw) * Math.cos(this.camPitch),
      Math.sin(this.camPitch),
      Math.cos(this.camYaw) * Math.cos(this.camPitch),
    );
    let dist = this.camDist;
    // Wall avoidance
    this.raycaster.set(focus, dir.clone().normalize());
    this.raycaster.far = dist + 0.6;
    const hits = this.raycaster.intersectObject(this.arena.group, true);
    if (hits.length) dist = Math.max(1.6, hits[0]!.distance - 0.5);
    const camTarget = focus.clone().addScaledVector(dir, dist).setY(focus.y + dist * 0.16 + 0.3);
    this.camera.position.lerp(camTarget, 1 - Math.exp(-16 * dt));

    this.shakeAmt = Math.max(0, this.shakeAmt - dt * 1.6);
    if (this.shakeAmt > 0.001) {
      const s = this.shakeAmt * 0.35;
      this.camera.position.x += (Math.random() - 0.5) * s;
      this.camera.position.y += (Math.random() - 0.5) * s;
      this.camera.position.z += (Math.random() - 0.5) * s;
    }
    this.camera.lookAt(focus.x, focus.y - 0.15, focus.z);
  }

  private updateMenuCamera(t: number, dt: number) {
    const target = new THREE.Vector3(6, 1.6, 20);
    this.zero.group.position.set(6, 0, 20);
    this.zero.group.rotation.y = Math.PI + Math.sin(t * 0.25) * 0.4;
    this.zero.torso.position.y = 1.18 + Math.sin(t * 1.2) * 0.03;
    this.zero.armR.rotation.x = -0.25 + Math.sin(t * 0.9) * 0.05;
    this.zero.armL.rotation.x = -0.2 + Math.sin(t * 0.9 + 1) * 0.05;
    const a = t * 0.12;
    const camPos = new THREE.Vector3(6 + Math.sin(a) * 6.5, 2.6 + Math.sin(t * 0.3) * 0.4, 20 + Math.cos(a) * 6.5);
    this.camera.position.lerp(camPos, 1 - Math.exp(-3 * dt));
    this.camera.fov += (55 - this.camera.fov) * (1 - Math.exp(-4 * dt));
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(target);
    this.playerLight.position.set(6, 1.6, 20);
  }

  private pushHud() {
    hudStore.set({
      hp: Math.max(0, Math.round(this.hp)),
      maxHp: this.maxHp,
      energy: Math.round(this.energy),
      maxEnergy: this.maxEnergy,
      dashReady: 1 - this.dashCd / (1.5 * this.mods.dashCd),
      empReady: 1 - this.empCd / 9,
      enemiesLeft: this.enemies.filter((e) => e.state !== "DEAD").length + (this.boss ? 1 : 0),
      level: 1 + Math.floor(this.xp / 1200),
    });
  }

  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const raw = this.clock.getDelta();
    const dt = Math.min(raw, 0.05);
    const t = this.clock.elapsedTime;
    this.arena.animate(t);

    // Ambient vent sparks
    this.ventAcc += dt;
    if (this.ventAcc > 0.35 && this.arena.vents.length) {
      this.ventAcc = 0;
      const v = this.arena.vents[Math.floor(Math.random() * this.arena.vents.length)]!;
      this.fx.burst(v, {
        count: 3,
        color: Math.random() > 0.5 ? 0xffa63c : 0x8899aa,
        speed: 3,
        size: 0.07,
        life: 0.7,
        grav: v.y > 5 ? 8 : -1.5,
      });
    }

    if (!this.running) {
      this.updateMenuCamera(t, dt);
      this.fx.update(dt);
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (!this.paused) {
      if (this.phase === "IDLE") {
        this.waveTimer -= dt;
        if (this.waveTimer <= 0) this.startWave();
      } else if (this.phase === "CLEARED") {
        this.waveTimer -= dt;
        if (this.waveTimer <= 0) {
          if (this.wave >= WAVES.length) {
            this.phase = "IDLE";
            this.waveTimer = 0.2;
            hudStore.set({ screen: "PLAYING" });
          } else {
            this.phase = "UPGRADE";
            hudStore.set({ screen: "UPGRADE", choices: rollUpgrades(3) });
          }
        }
      } else if (this.phase === "FIGHT") {
        if (!this.boss && this.enemies.length === 0) this.waveCleared();
      }

      if (this.phase !== "UPGRADE") {
        this.updatePlayer(dt);
        this.updateEnemies(dt);
        this.updateBoss(dt);
        this.updateProjectiles(dt);
        this.updateShards(dt);
      }
      this.updateCamera(dt);
      this.fx.update(dt);
      this.hudAcc += dt;
      if (this.hudAcc > 0.1) {
        this.hudAcc = 0;
        this.pushHud();
      }
    }

    this.renderer.render(this.scene, this.camera);
  };
}
