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
  username?: string;
  userColor?: string;
  badge?: string;
  chatText?: string;
  chatTimer?: number;
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
  private badges: Record<string, HTMLImageElement> = {};
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

        promises.push(new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            this.sprites[action][i] = img;
            resolve();
          };
          img.onerror = () => {
            console.warn(`[SpriteEngine] Missing: ${basePath}/${action}/${frameName}`);
            resolve();
          };
          img.src = `${basePath}/${action.replace(/ /g, "%20")}/${frameName.replace(/ /g, "%20")}`;
        }));
      }
    }

    for (const name of ["pokeball", "shield_blue", "shield_gold", "shield_futuristic", "viper"]) {
      promises.push(new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          this.badges[name] = img;
          resolve();
        };
        img.onerror = () => resolve();
        img.src = `/images/badges/${name}.png`;
      }));
    }

    await Promise.all(promises);
  }

  public spawnForUser(username: string, badge?: string, color?: string) {
    if (this.entities.some(e => e.username === username)) return;

    const minX = (this.config.minXPercentage ?? 0.1) * this.canvas.width;
    const maxX = (this.config.maxXPercentage ?? 0.9) * this.canvas.width;
    const x = minX + Math.random() * (maxX - minX);

    const minY = (this.config.minYPercentage ?? 0.5) * this.canvas.height;
    const maxY = (this.config.maxYPercentage ?? 0.9) * this.canvas.height;
    const y = minY + Math.random() * (maxY - minY);

    this.entities.push({
      id: crypto.randomUUID(),
      x, y,
      targetX: x, targetY: y,
      speed: 40 + Math.random() * 40,
      direction: Math.random() > 0.5 ? 1 : -1,
      currentAction: "Idle",
      currentFrame: 0,
      frameTimer: 0,
      scale: this.config.scaleMultiplier ?? 1.0,
      username,
      badge,
      userColor: color,
    });
  }

  public removeUser(username: string) {
    this.entities = this.entities.filter(e => e.username !== username);
  }

  public getEntity(username: string): Entity | undefined {
    return this.entities.find(e => e.username === username);
  }

  public showChat(username: string, text: string) {
    const e = this.entities.find(ent => ent.username === username);
    if (!e) return;
    e.chatText = text;
    e.chatTimer = 4000;
  }

  public getEntities(): Entity[] {
    return this.entities;
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
      "Idle": 3, "Walking": 3, "Jumping": 1, "Attacking": 1,
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

      if (e.chatTimer !== undefined) {
        e.chatTimer -= dt;
        if (e.chatTimer <= 0) {
          e.chatText = undefined;
          e.chatTimer = undefined;
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

      if (e.username) {
        this.drawLabel(e, drawY);
      }
    });
  }

  private drawLabel(e: Entity, spriteTop: number) {
    const fontSize = Math.max(10, Math.round(12 * e.scale));
    const badgeSize = fontSize + 2;
    const pad = 4;

    let currentY = spriteTop - 3;

    // Chat bubble
    if (e.chatText) {
      const bubbleFont = Math.max(12, Math.round(14 * e.scale));
      this.ctx.font = `${bubbleFont}px monospace`;

      const maxW = 120;
      const lines = this.wrapText(e.chatText, maxW);
      const lineH = bubbleFont + 2;
      const padX = 8, padY = 5;
      const bubbleW = maxW + padX * 2;
      const bubbleH = lines.length * lineH + padY * 2;

      const bubbleX = e.x - bubbleW / 2;
      const bubbleY = currentY - bubbleH;

      const alpha = (e.chatTimer ?? 0) < 500 ? (e.chatTimer ?? 0) / 500 : 1;
      this.ctx.save();
      this.ctx.globalAlpha = alpha;

      // White bg
      this.ctx.fillStyle = "#FFFFFF";
      this.drawRoundRect(bubbleX, bubbleY, bubbleW, bubbleH, 4);
      this.ctx.fill();

      // Black border
      this.ctx.strokeStyle = "#000000";
      this.ctx.lineWidth = 1.5;
      this.drawRoundRect(bubbleX, bubbleY, bubbleW, bubbleH, 4);
      this.ctx.stroke();

      // Tail
      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.beginPath();
      this.ctx.moveTo(e.x - 4, bubbleY + bubbleH);
      this.ctx.lineTo(e.x, bubbleY + bubbleH + 5);
      this.ctx.lineTo(e.x + 4, bubbleY + bubbleH);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.strokeStyle = "#000000";
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(e.x - 4, bubbleY + bubbleH);
      this.ctx.lineTo(e.x, bubbleY + bubbleH + 5);
      this.ctx.lineTo(e.x + 4, bubbleY + bubbleH);
      this.ctx.stroke();

      // Text
      this.ctx.fillStyle = "#000000";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "top";
      lines.forEach((line, i) => {
        this.ctx.fillText(line, e.x, bubbleY + padY + i * lineH);
      });

      this.ctx.globalAlpha = 1;
      this.ctx.restore();

      currentY = bubbleY - 3;
    }

    // Name + badge — no background, colored text with outline
    this.ctx.font = `bold ${fontSize}px monospace`;
    const textW = this.ctx.measureText(e.username).width;
    const badgeW = e.badge && this.badges[e.badge] ? badgeSize + 3 : 0;
    const totalW = textW + badgeW;
    const nameX = e.x - totalW / 2;
    const nameY = currentY - badgeSize;

    // Badge
    if (e.badge && this.badges[e.badge]) {
      this.ctx.save();
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.drawImage(
        this.badges[e.badge],
        nameX,
        nameY + (badgeSize - (fontSize + 2)) / 2,
        badgeSize,
        badgeSize
      );
      this.ctx.restore();
    }

    // Username with tier color + dark outline
    const textColor = e.userColor || "#FFFFFF";
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "bottom";
    this.ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
    this.ctx.lineWidth = 3;
    this.ctx.strokeText(e.username, nameX + badgeW, currentY);
    this.ctx.fillStyle = textColor;
    this.ctx.fillText(e.username, nameX + badgeW, currentY);
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (this.ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [text];
  }

  private drawRoundRect(x: number, y: number, w: number, h: number, r: number) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.arcTo(x + w, y, x + w, y + r, r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.arcTo(x, y + h, x, y + h - r, r);
    this.ctx.lineTo(x, y + r);
    this.ctx.arcTo(x, y, x + r, y, r);
    this.ctx.closePath();
  }

  public destroy() {
    this.stop();
    window.removeEventListener('resize', this.resize.bind(this));
  }
}
