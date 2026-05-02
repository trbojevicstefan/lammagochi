/**
 * PixelRenderer — Canvas 2D drawing primitives for pixel-art.
 * All coords in 64×64 viewBox units, scaled to canvas size.
 * imageSmoothingEnabled=false for crisp pixel edges.
 */
export class PixelRenderer {
  private ctx: CanvasRenderingContext2D;
  private scale: number;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false,
    })!;
    this.ctx.imageSmoothingEnabled = false;
    this.scale = 1;
  }

  setSize(w: number, h: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.scale = (w / 64) * dpr; // 64 = viewBox size
    this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  clear(bg = '#020617') {
    this.ctx.fillStyle = bg;
    this.ctx.fillRect(0, 0, 64, 64);
  }

  r(x: number, y: number, w: number, h: number, fill: string, rx = 0) {
    const c = this.ctx;
    c.fillStyle = fill;
    if (rx > 0) {
      c.beginPath();
      c.moveTo(x + rx, y);
      c.lineTo(x + w - rx, y);
      c.quadraticCurveTo(x + w, y, x + w, y + rx);
      c.lineTo(x + w, y + h - rx);
      c.quadraticCurveTo(x + w, y + h, x + w - rx, y + h);
      c.lineTo(x + rx, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - rx);
      c.lineTo(x, y + rx);
      c.quadraticCurveTo(x, y, x + rx, y);
      c.fill();
    } else {
      c.fillRect(x, y, w, h);
    }
  }

  /** Rounded rect centered at (cx, cy) — alias for .r() with auto-position */
  rr(cx: number, cy: number, w: number, h: number, fill: string, rx = 0) {
    this.r(cx - w/2, cy - h/2, w, h, fill, rx);
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, fill: string) {
    const c = this.ctx;
    c.fillStyle = fill;
    c.beginPath();
    c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
  }

  circle(cx: number, cy: number, r: number, fill: string) {
    this.ellipse(cx, cy, r, r, fill);
  }

  /** Line from (x1,y1) to (x2,y2) */
  line(x1: number, y1: number, x2: number, y2: number, stroke: string, width = 1) {
    const c = this.ctx;
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
  }

  /** Draw a single pixel at (x,y) — for pixel-art details */
  px(x: number, y: number, fill: string) {
    this.r(Math.round(x), Math.round(y), 1, 1, fill);
  }

  /** Draw text */
  text(x: number, y: number, content: string, size: number, fill: string, font = 'monospace') {
    const c = this.ctx;
    c.fillStyle = fill;
    c.font = `bold ${size}px ${font}`;
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText(content, x, y);
  }

  /** Save/restore transform state */
  save() { this.ctx.save(); }
  restore() { this.ctx.restore(); }
  translate(x: number, y: number) { this.ctx.translate(x, y); }
  rotate(angle: number) { this.ctx.rotate(angle); }
  scaleXY(sx: number, sy: number) { this.ctx.scale(sx, sy); }
}
