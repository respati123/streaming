export interface Entity {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  direction: number;
  currentAction: string;
  currentFrame: number;
  frameTimer: number;
  scale: number;
}

const ACTION_FRAMES: Record<string, number> = {
  "Idle": 8,
  "Walking": 8,
  "Jumping": 8,
  "Attacking": 8,
};

const ACTIONS = Object.keys(ACTION_FRAMES);

const ACTION_FPS: Record<string, number> = {
  "Idle": 5,
  "Walking": 10,
  "Jumping": 8,
  "Attacking": 12,
};

const LOOP_ACTIONS = new Set(["Idle", "Walking"]);

export interface EngineConfig {
  minXPercentage?: number;
  maxXPercentage?: number;
  minYPercentage?: number;
  maxYPercentage?: number;
  allowedActions?: string[];
  scaleMultiplier?: number;
}

export class SpriteEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sprites: Record<string, HTMLImageElement[]> = {};
  private entities: Entity[] = [];
  private isRunning = false;
  private lastTime = 0;
  private config: EngineConfig;

  constructor(canvas: HTMLCanvasElement, config: EngineConfig = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.config = config;
    this.ctx.imageSmoothingEnabled = false;
    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
  }

  public async loadAssets(basePath = "/images/characters/char_1", prefix = "char_1_") {
    const promises: Promise<void>[] = [];

    for (const [action, count] of Object.entries(ACTION_FRAMES)) {
      this.sprites[action] = [];
      for (let i = 0; i < count; i++) {
        const frameName = `${prefix}${action}_${i.toString().padStart(3, '0')}.png`;

        promises.push(new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            this.sprites[action][i] = img;
            resolve();
          };
          img.onerror = (err) => {
            console.error(`Failed to load ${frameName}`, err);
            reject(err);
          };
          img.src = `${basePath}/${action.replace(/ /g, "%20")}/${frameName.replace(/ /g, "%20")}`;
        }));
      }
    }

    await Promise.all(promises);
  }

  public spawnInitial(count: number) {
    this.entities = [];
    for (let i = 0; i < count; i++) {
      this.spawn();
    }
  }

  public spawn() {
    const minX = (this.config.minXPercentage ?? 0.1) * this.canvas.width;
    const maxX = (this.config.maxXPercentage ?? 0.9) * this.canvas.width;
    const x = minX + Math.random() * (maxX - minX);

    const minY = (this.config.minYPercentage ?? 0.5) * this.canvas.height;
    const maxY = (this.config.maxYPercentage ?? 0.9) * this.canvas.height;
    const y = minY + Math.random() * (maxY - minY);

    this.entities.push({
      id: crypto.randomUUID(),
      x,
      y,
      targetX: x,
      targetY: y,
      speed: 40 + Math.random() * 40,
      direction: Math.random() > 0.5 ? 1 : -1,
      currentAction: "Idle",
      currentFrame: 0,
      frameTimer: 0,
      scale: this.config.scaleMultiplier ?? 1.0,
    });
  }

  public triggerGlobalAttack() {
    this.entities.forEach(e => {
      e.currentAction = "Attacking";
      e.currentFrame = 0;
      e.frameTimer = 0;
    });
  }

  private resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx.imageSmoothingEnabled = false;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  public stop() {
    this.isRunning = false;
  }

  private loop(timestamp: number) {
    if (!this.isRunning) return;

    const dt = Math.min(timestamp - this.lastTime, 100);
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame(this.loop.bind(this));
  }

  private pickNextAction(e: Entity) {
    const available = this.config.allowedActions?.length
      ? this.config.allowedActions
      : ACTIONS;

    const weights: Record<string, number> = {
      "Idle": 3,
      "Walking": 3,
      "Jumping": 1,
      "Attacking": 1,
    };

    const pool = available.flatMap(a => Array(weights[a] ?? 1).fill(a));
    const next = pool[Math.floor(Math.random() * pool.length)];

    e.currentAction = next;
    e.currentFrame = 0;
    e.frameTimer = 0;

    if (next === "Walking") {
      const minX = (this.config.minXPercentage ?? 0.1) * this.canvas.width;
      const maxX = (this.config.maxXPercentage ?? 0.9) * this.canvas.width;
      e.targetX = minX + Math.random() * (maxX - minX);

      const minY = (this.config.minYPercentage ?? 0.5) * this.canvas.height;
      const maxY = (this.config.maxYPercentage ?? 0.9) * this.canvas.height;
      e.targetY = minY + Math.random() * (maxY - minY);
    }
  }

  private update(dt: number) {
    const dtSec = dt / 1000;

    this.entities.forEach(e => {
      if (e.currentAction === "Walking") {
        const dx = e.targetX - e.x;
        const dy = e.targetY - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 5) {
          e.currentAction = "Idle";
          e.currentFrame = 0;
          e.frameTimer = 0;
        } else {
          e.x += (dx / dist) * e.speed * dtSec;
          e.y += (dy / dist) * e.speed * dtSec;

          const minX = (this.config.minXPercentage ?? 0.1) * this.canvas.width;
          const maxX = (this.config.maxXPercentage ?? 0.9) * this.canvas.width;
          const minY = (this.config.minYPercentage ?? 0.5) * this.canvas.height;
          const maxY = (this.config.maxYPercentage ?? 0.9) * this.canvas.height;

          e.x = Math.max(minX, Math.min(maxX, e.x));
          e.y = Math.max(minY, Math.min(maxY, e.y));

          if (Math.abs(dx) > 1) {
            e.direction = dx > 0 ? 1 : -1;
          }
        }
      }

      const fps = ACTION_FPS[e.currentAction] ?? 8;
      const timePerFrame = 1000 / fps;
      const maxFrames = ACTION_FRAMES[e.currentAction];

      e.frameTimer += dt;
      if (e.frameTimer >= timePerFrame) {
        e.frameTimer -= timePerFrame;
        e.currentFrame++;

        if (e.currentFrame >= maxFrames) {
          if (LOOP_ACTIONS.has(e.currentAction)) {
            e.currentFrame = 0;

            if (e.currentAction === "Idle" && Math.random() < 0.3) {
              this.pickNextAction(e);
            }
          } else {
            this.pickNextAction(e);
          }
        }
      }
    });
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const sorted = [...this.entities].sort((a, b) => a.y - b.y);

    sorted.forEach(e => {
      const frames = this.sprites[e.currentAction];
      if (!frames) return;

      const sprite = frames[e.currentFrame];
      if (!sprite) return;

      const dw = sprite.width * e.scale;
      const dh = sprite.height * e.scale;

      const drawX = e.x - (dw / 2);
      const drawY = e.y - dh;

      this.ctx.save();
      this.ctx.translate(drawX + dw / 2, drawY);
      this.ctx.scale(e.direction, 1);
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.drawImage(sprite, -dw / 2, 0, dw, dh);
      this.ctx.restore();
    });
  }

  public destroy() {
    this.stop();
    window.removeEventListener('resize', this.resize.bind(this));
  }
}
