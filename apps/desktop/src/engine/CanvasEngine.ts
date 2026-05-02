/**
 * CanvasEngine — singleton rAF loop with FPS modes, pause/resume, visibility detection.
 * External to React. Subscribers pull animation state, no push.
 */
export type FPSMode = 'full'|'eco'|'min';
type FrameCallback = (dt:number, time:number) => void;

class CanvasEngine {
  private rafId = 0;
  private lastTime = 0;
  private running = false;
  private callbacks: FrameCallback[] = [];
  private _mode: FPSMode = 'full';
  private frameSkip = 1;
  private frameCount = 0;
  private _fps = 60;
  private idleTimer = 0;
  private readonly IDLE_THRESHOLD = 30000;

  constructor() {
    this.handleVisibility = this.handleVisibility.bind(this);
    this.handleActivity = this.handleActivity.bind(this);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibility);
      document.addEventListener('mousemove', this.handleActivity, {passive:true});
      document.addEventListener('keydown', this.handleActivity, {passive:true});
    }
  }

  private handleVisibility() {
    if (document.hidden) this.pause();
    else if (this.callbacks.length > 0) this.resume();
  }

  private handleActivity() {
    this.idleTimer = 0;
    if (this._mode === 'min') this.setMode('eco');
  }

  setMode(mode: FPSMode) {
    this._mode = mode;
    this.frameSkip = mode === 'full' ? 1 : mode === 'eco' ? 2 : 4;
    this._fps = mode === 'full' ? 60 : mode === 'eco' ? 30 : 15;
  }

  get mode() { return this._mode; }
  get fps() { return this._fps; }

  subscribe(cb: FrameCallback) {
    this.callbacks.push(cb);
    if (!this.running) this.resume();
    return () => { this.callbacks = this.callbacks.filter(c => c !== cb); };
  }

  resume() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  pause() {
    this.running = false;
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = 0; }
  }

  private loop = (now: number) => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.loop);

    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05); // cap at 50ms

    // Idle detection
    this.idleTimer += rawDt * 1000;
    if (this.idleTimer > this.IDLE_THRESHOLD && this._mode === 'full') {
      this.setMode('eco');
    }

    // Frame skipping for eco/min modes
    this.frameCount++;
    if (this.frameCount % this.frameSkip !== 0) return;

    for (const cb of this.callbacks) {
      cb(dt * this.frameSkip, now);
    }
  };

  destroy() {
    this.pause();
    this.callbacks = [];
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibility);
      document.removeEventListener('mousemove', this.handleActivity);
      document.removeEventListener('keydown', this.handleActivity);
    }
  }
}

export const canvasEngine = new CanvasEngine();
