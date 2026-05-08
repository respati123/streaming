export interface Entity {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  direction: number; // 1 for right, -1 for left
  currentAction: string;
  currentFrame: number;
  frameTimer: number;
  scale: number;
}

const ACTION_FRAMES: Record<string, number> = {
  "Attacking": 12,
  "Dying": 15,
  "Hurt": 12,
  "Idle": 12,
  "Idle Blink": 12,
  "Jump Loop": 6,
  "Jump Start": 6,
  "Taunt": 18,
  "Walking": 18
};

const ACTIONS = Object.keys(ACTION_FRAMES);

export interface EngineConfig {
  minYPercentage?: number; // 0.0 to 1.0
  maxYPercentage?: number; // 0.0 to 1.0
}

export class SpriteEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sprites: Record<string, HTMLImageElement[]> = {};
  private entities: Entity[] = [];
  private isRunning = false;
  private lastTime = 0;
  private config: EngineConfig;

  // FPS calculation
  private fpsCounter = 0;
  private currentFps = 0;
  private lastFpsTime = 0;
  
  constructor(canvas: HTMLCanvasElement, config: EngineConfig = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.config = config;
    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
  }

  // Pre-load all action images
  public async loadAssets(basePath = "/images/characters/character_1", prefix = "Golem_01_") {
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
          // Construct URL, ensuring spaces are encoded properly
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
    const id = crypto.randomUUID();
    const x = 100 + Math.random() * (this.canvas.width - 200);
    
    // Determine Y boundaries based on config (defaults to lower half)
    const minY = (this.config.minYPercentage ?? 0.5) * this.canvas.height;
    const maxY = (this.config.maxYPercentage ?? 0.9) * this.canvas.height;
    const y = minY + Math.random() * (maxY - minY);
    
    this.entities.push({
      id,
      x,
      y,
      targetX: x,
      targetY: y,
      speed: 40 + Math.random() * 40, // 40-80 pixels per second
      direction: Math.random() > 0.5 ? 1 : -1,
      currentAction: "Idle",
      currentFrame: 0,
      frameTimer: 0,
      scale: 0.8 + Math.random() * 0.4 // randomize size slightly
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

    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // Calculate FPS
    this.fpsCounter++;
    if (timestamp - this.lastFpsTime >= 1000) {
      this.currentFps = this.fpsCounter;
      this.fpsCounter = 0;
      this.lastFpsTime = timestamp;
    }

    this.update(deltaTime);
    this.draw();

    requestAnimationFrame(this.loop.bind(this));
  }

  private update(dt: number) {
    // dt is in milliseconds
    const dtSeconds = dt / 1000;

    this.entities.forEach(e => {
      // 1. Movement AI & Boundaries
      if (e.currentAction === "Walking") {
        if (Math.abs(e.x - e.targetX) < 5 && Math.abs(e.y - e.targetY) < 5) {
          // Reached target -> become Idle
          e.currentAction = "Idle";
          e.currentFrame = 0;
        } else {
          // Move towards target
          const dx = e.targetX - e.x;
          const dy = e.targetY - e.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          const vx = (dx / dist) * e.speed * dtSeconds;
          const vy = (dy / dist) * e.speed * dtSeconds;

          e.x += vx;
          e.y += vy;

          // Boundary Constraints (User Request: do not cross web width/height)
          const padding = 50 * e.scale;
          const minY = (this.config.minYPercentage ?? 0.5) * this.canvas.height;
          const maxY = (this.config.maxYPercentage ?? 0.9) * this.canvas.height;

          if (e.x < padding) e.x = padding;
          if (e.x > this.canvas.width - padding) e.x = this.canvas.width - padding;
          if (e.y < minY) e.y = minY;
          if (e.y > maxY) e.y = maxY;

          // Update direction
          if (Math.abs(dx) > 1) {
            e.direction = dx > 0 ? 1 : -1;
          }
        }
      }

      // 2. Animation Logic & State Transitions
      const fps = e.currentAction === "Attacking" ? 24 : 12; 
      const timePerFrame = 1000 / fps;
      const currentActionMaxFrames = ACTION_FRAMES[e.currentAction];

      e.frameTimer += dt;
      if (e.frameTimer >= timePerFrame) {
        e.frameTimer -= timePerFrame;
        e.currentFrame++;

        // If animation cycle finishes
        if (e.currentFrame >= currentActionMaxFrames) {
          e.currentFrame = 0; // Loop by default
          
          // Randomly transition to a new state at the end of an animation cycle
          if (Math.random() < 0.4) { // 40% chance to change state
             const nextAction = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
             e.currentAction = nextAction;
             e.currentFrame = 0;

             // If new action is Walking, pick a target within canvas bounds
             if (e.currentAction === "Walking") {
               const padding = 50 * e.scale;
               e.targetX = padding + Math.random() * (this.canvas.width - padding * 2);
               
               const minY = (this.config.minYPercentage ?? 0.5) * this.canvas.height;
               const maxY = (this.config.maxYPercentage ?? 0.9) * this.canvas.height;
               e.targetY = minY + Math.random() * (maxY - minY);
             }
          }
        }
      }
    });
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Sort by Y so characters lower on screen render in front
    const sortedEntities = [...this.entities].sort((a, b) => a.y - b.y);

    sortedEntities.forEach(e => {
      const actionSprites = this.sprites[e.currentAction];
      if (!actionSprites) return; // Action not loaded yet

      const sprite = actionSprites[e.currentFrame];
      if (!sprite) return; // Frame not loaded yet

      const dw = sprite.width * e.scale;
      const dh = sprite.height * e.scale;

      this.ctx.save();
      this.ctx.translate(e.x, e.y);
      this.ctx.scale(e.direction, 1);
      
      // Draw image centered
      this.ctx.drawImage(sprite, -dw / 2, -dh / 2, dw, dh);
      
      this.ctx.restore();
    });

    // Draw FPS overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(10, 10, 80, 30);
    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.fillText(`FPS: ${this.currentFps}`, 20, 30);
  }

  public destroy() {
    this.stop();
    window.removeEventListener('resize', this.resize.bind(this));
  }
}
