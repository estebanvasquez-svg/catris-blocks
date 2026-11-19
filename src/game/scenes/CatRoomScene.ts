import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  CatColor,
  CAT_MAP,
  CAT_IDS,
} from '../constants';
import { createGlossyButton, drawHudPanel } from '../kawaiiArtwork';
import { sound } from '../audio';
import { loadSave, writeSave } from '../storage';
import { getPlayerPoolCats } from './MinigamesScene';

const FONT_FAMILY = 'Fredoka, sans-serif';

// Background source is 1024x572; scaled to full vertical 800px height -> 1432x800 wide room
const WORLD_HEIGHT = GAME_HEIGHT;
const WORLD_WIDTH = Math.round(1024 * (GAME_HEIGHT / 572));
const MIN_SCROLL_X = -(WORLD_WIDTH - GAME_WIDTH);
const FLOOR_TOP_Y = 445;
const FLOOR_BOTTOM_Y = WORLD_HEIGHT - 28;
const CAT_RADIUS = 22;

interface HitboxDef {
  label: string;
  nx: number;
  ny: number;
  nw: number;
  nh: number;
}

interface WorldRect {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// Solid floor obstacles: cats walk around these and cannot pass through
const SOLID_DEFS: HitboxDef[] = [
  { label: 'Casita / Rascador', nx: 0.04, ny: 0.59, nw: 0.145, nh: 0.17 },
  { label: 'Plato Azul', nx: 0.08, ny: 0.83, nw: 0.1, nh: 0.1 },
  { label: 'Plato Naranja', nx: 0.16, ny: 0.78, nw: 0.1, nh: 0.1 },
  { label: 'Tronco del Árbol', nx: 0.45, ny: 0.58, nw: 0.13, nh: 0.17 },
  { label: 'Silla Rosa Izq.', nx: 0.675, ny: 0.56, nw: 0.055, nh: 0.12 },
  { label: 'Mesa Ventana', nx: 0.715, ny: 0.59, nw: 0.105, nh: 0.09 },
  { label: 'Silla Rosa Der.', nx: 0.815, ny: 0.57, nw: 0.055, nh: 0.12 },
  { label: 'Mesa Derecha', nx: 0.895, ny: 0.6, nw: 0.105, nh: 0.17 },
  { label: 'Banquito Rosa', nx: 0.695, ny: 0.84, nw: 0.065, nh: 0.11 },
  { label: 'Mesa Grande', nx: 0.755, ny: 0.83, nw: 0.245, nh: 0.17 },
];

// Elevated furniture & tree perches: cats can hop up and stroll within each hitbox
const PERCH_DEFS: HitboxDef[] = [
  { label: 'Repisa Alta', nx: 0.065, ny: 0.3, nw: 0.24, nh: 0.055 },
  { label: 'Repisa Media Izq.', nx: 0.065, ny: 0.435, nw: 0.085, nh: 0.04 },
  { label: 'Repisa Colgante', nx: 0.175, ny: 0.485, nw: 0.065, nh: 0.035 },
  { label: 'Puente Colgante', nx: 0.215, ny: 0.39, nw: 0.155, nh: 0.065 },
  { label: 'Plataforma Alta Árbol', nx: 0.34, ny: 0.195, nw: 0.085, nh: 0.035 },
  { label: 'Plataforma Copa', nx: 0.445, ny: 0.245, nw: 0.065, nh: 0.035 },
  { label: 'Hamaca Naranja', nx: 0.385, ny: 0.36, nw: 0.11, nh: 0.065 },
  { label: 'Balcón del Árbol', nx: 0.525, ny: 0.275, nw: 0.13, nh: 0.06 },
  { label: 'Rama Media Izq.', nx: 0.425, ny: 0.445, nw: 0.095, nh: 0.035 },
  { label: 'Rama Media Der.', nx: 0.555, ny: 0.415, nw: 0.065, nh: 0.035 },
  { label: 'Escalera Espiral', nx: 0.42, ny: 0.54, nw: 0.2, nh: 0.075 },
  { label: 'Tope Mesa Ventana', nx: 0.72, ny: 0.545, nw: 0.095, nh: 0.04 },
  { label: 'Cama Cojín', nx: 0.915, ny: 0.705, nw: 0.075, nh: 0.05 },
  { label: 'Tope Mesa Der.', nx: 0.9, ny: 0.575, nw: 0.095, nh: 0.045 },
  { label: 'Tope Mesa Grande', nx: 0.77, ny: 0.835, nw: 0.21, nh: 0.065 },
];

type DesireType = 'fish' | 'yarn' | 'pet';

interface RoomCat {
  color: CatColor;
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  bubble: Phaser.GameObjects.Container | null;
  desire: DesireType | null;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  perch: WorldRect | null;
  jumping: boolean;
  waitTimer: number;
  perchTimer: number;
  phase: number;
}

function toWorldRect(def: HitboxDef): WorldRect {
  return {
    label: def.label,
    x: Math.round(def.nx * WORLD_WIDTH),
    y: Math.round(def.ny * WORLD_HEIGHT),
    w: Math.round(def.nw * WORLD_WIDTH),
    h: Math.round(def.nh * WORLD_HEIGHT),
  };
}

export class CatRoomScene extends Phaser.Scene {
  private roomContainer!: Phaser.GameObjects.Container;
  private hitboxOverlay!: Phaser.GameObjects.Container;
  private scrollThumb!: Phaser.GameObjects.Rectangle;
  private pawsText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;

  private solidRects: WorldRect[] = [];
  private perchRects: WorldRect[] = [];
  private cats: RoomCat[] = [];

  private showHitboxes = false;
  private isDragging = false;
  private dragMoved = false;
  private lastPointerX = 0;
  private panVelocity = 0;
  private sessionEarned = 0;

  constructor() {
    super('CatRoomScene');
  }

  create(): void {
    this.cats = [];
    this.showHitboxes = false;
    this.isDragging = false;
    this.dragMoved = false;
    this.panVelocity = 0;
    this.sessionEarned = 0;

    this.solidRects = SOLID_DEFS.map(toWorldRect);
    this.perchRects = PERCH_DEFS.map(toWorldRect);

    // Scrollable room container (strictly vertical 450x800 viewport panning horizontally)
    const startOffsetX = Math.round(MIN_SCROLL_X / 2);
    this.roomContainer = this.add.container(startOffsetX, 0);

    const bg = this.add
      .image(0, 0, 'cat_room_bg')
      .setOrigin(0, 0)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT);
    this.roomContainer.add(bg);

    this.buildHitboxOverlay();
    this.spawnCats();
    this.buildHud();
    this.setupPanAndTapInput();

    this.time.addEvent({
      delay: 2600,
      loop: true,
      callback: () => {
        const idle = this.cats.filter((c) => !c.desire);
        if (idle.length > 0) {
          this.assignDesire(Phaser.Utils.Array.GetRandom(idle));
        }
      },
    });
  }

  private buildHitboxOverlay(): void {
    this.hitboxOverlay = this.add.container(0, 0).setDepth(900).setVisible(false);
    const g = this.add.graphics();

    for (const r of this.solidRects) {
      g.fillStyle(0xff4d6d, 0.25);
      g.fillRect(r.x, r.y, r.w, r.h);
      g.lineStyle(2, 0xff4d6d, 0.9);
      g.strokeRect(r.x, r.y, r.w, r.h);
      const lbl = this.add
        .text(r.x + 4, r.y + 2, r.label, {
          fontFamily: FONT_FAMILY,
          fontSize: '10px',
          color: '#ffffff',
          backgroundColor: '#b31b3b',
        });
      this.hitboxOverlay.add(lbl);
    }

    for (const r of this.perchRects) {
      g.fillStyle(0x3de08e, 0.24);
      g.fillRect(r.x, r.y, r.w, r.h);
      g.lineStyle(2, 0x3de08e, 0.9);
      g.strokeRect(r.x, r.y, r.w, r.h);
      const lbl = this.add
        .text(r.x + 4, r.y + 2, r.label, {
          fontFamily: FONT_FAMILY,
          fontSize: '10px',
          color: '#102b1c',
          backgroundColor: '#7ff2b7',
        });
      this.hitboxOverlay.add(lbl);
    }

    this.hitboxOverlay.add(g);
    this.hitboxOverlay.sendToBack(g);
    this.roomContainer.add(this.hitboxOverlay);
  }

  private buildHud(): void {
    drawHudPanel(this, GAME_WIDTH / 2, 46, GAME_WIDTH - 20, 74, 0xff94b8).setDepth(1000);

    createGlossyButton(this, {
      x: 56,
      y: 36,
      width: 78,
      height: 34,
      label: '← SALIR',
      fillColor: 0xff7da6,
      topHighlight: 0xffc4d8,
      fontSize: 13,
      onClick: () => {
        sound.playClick();
        this.scene.start('MinigamesScene');
      },
    }).setDepth(1001);

    this.add
      .text(GAME_WIDTH / 2 + 8, 28, 'HABITACIÓN', {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#1c2b52',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(1001);

    const save = loadSave();
    this.pawsText = this.add
      .text(GAME_WIDTH - 24, 28, `🐾 ${save.pawsCurrency}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '16px',
        color: '#ffe066',
        fontStyle: 'bold',
        stroke: '#1c2b52',
        strokeThickness: 4,
      })
      .setOrigin(1, 0.5)
      .setDepth(1001);

    this.statusText = this.add
      .text(GAME_WIDTH / 2 - 22, 62, '↔ Desliza para explorar · Toca gatos o muebles', {
        fontFamily: FONT_FAMILY,
        fontSize: '11.5px',
        color: '#e5f0ff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(1001);

    // Hitboxes toggle button
    const hbBtn = createGlossyButton(this, {
      x: GAME_WIDTH - 54,
      y: 62,
      width: 78,
      height: 26,
      label: 'HITBOX',
      fillColor: 0x56d896,
      topHighlight: 0xaaf5cd,
      fontSize: 11,
      onClick: () => {
        sound.playClick();
        this.showHitboxes = !this.showHitboxes;
        this.hitboxOverlay.setVisible(this.showHitboxes);
        this.statusText.setText(
          this.showHitboxes
            ? 'Rojo: obstáculos · Verde: repisas y árbol'
            : '↔ Desliza para explorar · Toca gatos o muebles',
        );
      },
    });
    hbBtn.setDepth(1001);

    // Bottom horizontal panorama indicator bar
    const trackW = 190;
    const thumbW = Math.round((GAME_WIDTH / WORLD_WIDTH) * trackW);
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 16, trackW, 8, 0x132245, 0.7)
      .setDepth(1000);
    this.scrollThumb = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 16, thumbW, 8, 0xffd166, 0.95)
      .setDepth(1001);
    this.updateScrollThumb();
  }

  private spawnCats(): void {
    const pool = getPlayerPoolCats();
    const source = pool.length > 0 ? pool : [...CAT_IDS];
    const picked = Phaser.Utils.Array.Shuffle([...source]).slice(0, Math.min(9, source.length));

    picked.forEach((color, idx) => {
      // Spawn first 3 cats on perches (tree/bridge/shelf) and the rest safely on the floor
      const startPerch = idx < 3 ? this.perchRects[(idx * 3 + 3) % this.perchRects.length] : null;
      const pos = startPerch
        ? {
            x: startPerch.x + startPerch.w / 2,
            y: startPerch.y + startPerch.h * 0.6,
          }
        : this.findFreeFloorPoint();

      const container = this.add.container(pos.x, pos.y).setDepth(pos.y);
      const shadow = this.add.ellipse(0, 22, 46, 12, 0x000000, 0.18);
      const sprite = this.add
        .image(0, 0, `cat_${color}_sticker`)
        .setScale(0.115)
        .setInteractive({ useHandCursor: true });

      container.add([shadow, sprite]);
      this.roomContainer.add(container);

      const cat: RoomCat = {
        color,
        container,
        sprite,
        bubble: null,
        desire: null,
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
        targetX: pos.x,
        targetY: pos.y,
        perch: startPerch,
        jumping: false,
        waitTimer: 0.4 + idx * 0.35,
        perchTimer: startPerch ? Phaser.Math.FloatBetween(5, 10) : 0,
        phase: idx * 0.85,
      };

      sprite.on('pointerdown', () => {
        if (!this.dragMoved) this.onCatTapped(cat);
      });

      this.cats.push(cat);
      if (idx < 2) this.assignDesire(cat);
    });
  }

  private setupPanAndTapInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.worldY < 90) return;
      this.isDragging = true;
      this.dragMoved = false;
      this.lastPointerX = pointer.worldX;
      this.panVelocity = 0;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || !pointer.isDown) return;
      const dx = pointer.worldX - this.lastPointerX;
      if (Math.abs(dx) > 4) this.dragMoved = true;
      this.lastPointerX = pointer.worldX;
      this.setRoomScroll(this.roomContainer.x + dx);
      this.panVelocity = dx * 18;
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      if (!this.dragMoved && pointer.worldY > 92) {
        const roomX = pointer.worldX - this.roomContainer.x;
        const roomY = pointer.worldY;
        this.summonNearestCatTo(roomX, roomY);
      }
    });
  }

  private setRoomScroll(x: number): void {
    this.roomContainer.x = Phaser.Math.Clamp(x, MIN_SCROLL_X, 0);
    this.updateScrollThumb();
  }

  private updateScrollThumb(): void {
    if (!this.scrollThumb) return;
    const trackW = 190;
    const thumbW = this.scrollThumb.width;
    const progress = MIN_SCROLL_X === 0 ? 0.5 : this.roomContainer.x / MIN_SCROLL_X;
    const minX = GAME_WIDTH / 2 - trackW / 2 + thumbW / 2;
    const maxX = GAME_WIDTH / 2 + trackW / 2 - thumbW / 2;
    this.scrollThumb.x = Phaser.Math.Linear(minX, maxX, progress);
  }

  private summonNearestCatTo(roomX: number, roomY: number): void {
    if (this.cats.length === 0) return;
    sound.unlock();

    // Check if player tapped on an elevated furniture/tree perch
    const tappedPerch = this.perchRects.find(
      (p) => roomX >= p.x && roomX <= p.x + p.w && roomY >= p.y - 24 && roomY <= p.y + p.h + 18,
    );

    let closest = this.cats[0];
    let bestDist = Infinity;
    for (const c of this.cats) {
      if (c.jumping) continue;
      const d = Math.hypot(c.x - roomX, c.y - roomY);
      if (d < bestDist) {
        bestDist = d;
        closest = c;
      }
    }

    // Visual paw ping at tapped spot
    const ping = this.add.image(roomX, roomY, 'deco_paw').setScale(0.18).setDepth(950);
    this.roomContainer.add(ping);
    this.tweens.add({
      targets: ping,
      scale: 0.28,
      alpha: 0,
      duration: 500,
      onComplete: () => ping.destroy(),
    });

    if (tappedPerch) {
      const destX = Phaser.Math.Clamp(roomX, tappedPerch.x + 14, tappedPerch.x + tappedPerch.w - 14);
      const destY = tappedPerch.y + tappedPerch.h * 0.55;
      this.hopCatTo(closest, destX, destY, tappedPerch);
      this.statusText.setText(`${CAT_MAP[closest.color].name} saltó a ${tappedPerch.label}`);
    } else if (roomY >= FLOOR_TOP_Y - 10) {
      if (closest.perch) {
        const clamped = this.pushOutOfSolids(roomX, Phaser.Math.Clamp(roomY, FLOOR_TOP_Y, FLOOR_BOTTOM_Y));
        this.hopCatTo(closest, clamped.x, clamped.y, null);
      } else {
        const clamped = this.pushOutOfSolids(roomX, Phaser.Math.Clamp(roomY, FLOOR_TOP_Y, FLOOR_BOTTOM_Y));
        closest.targetX = clamped.x;
        closest.targetY = clamped.y;
        closest.waitTimer = 0;
      }
    }
  }

  private findFreeFloorPoint(): { x: number; y: number } {
    for (let attempt = 0; attempt < 30; attempt++) {
      const x = Phaser.Math.Between(46, WORLD_WIDTH - 46);
      const y = Phaser.Math.Between(FLOOR_TOP_Y + 10, FLOOR_BOTTOM_Y - 10);
      if (!this.isInsideAnySolid(x, y, CAT_RADIUS + 8)) {
        return { x, y };
      }
    }
    return { x: WORLD_WIDTH * 0.36, y: 610 };
  }

  private isInsideAnySolid(x: number, y: number, r: number): boolean {
    for (const s of this.solidRects) {
      const cx = Phaser.Math.Clamp(x, s.x, s.x + s.w);
      const cy = Phaser.Math.Clamp(y, s.y, s.y + s.h);
      if (Math.hypot(x - cx, y - cy) < r) return true;
    }
    return false;
  }

  private pushOutOfSolids(x: number, y: number): { x: number; y: number } {
    let px = Phaser.Math.Clamp(x, 34, WORLD_WIDTH - 34);
    let py = Phaser.Math.Clamp(y, FLOOR_TOP_Y, FLOOR_BOTTOM_Y);

    for (const s of this.solidRects) {
      const cx = Phaser.Math.Clamp(px, s.x, s.x + s.w);
      const cy = Phaser.Math.Clamp(py, s.y, s.y + s.h);
      const dx = px - cx;
      const dy = py - cy;
      const dist = Math.hypot(dx, dy);

      if (dist < CAT_RADIUS) {
        if (dist > 0.001) {
          const push = CAT_RADIUS - dist;
          px += (dx / dist) * push;
          py += (dy / dist) * push;
        } else {
          // Inside rect center: push out along nearest edge
          const left = px - s.x;
          const right = s.x + s.w - px;
          const top = py - s.y;
          const bottom = s.y + s.h - py;
          const minEdge = Math.min(left, right, top, bottom);
          if (minEdge === left) px = s.x - CAT_RADIUS;
          else if (minEdge === right) px = s.x + s.w + CAT_RADIUS;
          else if (minEdge === top) py = s.y - CAT_RADIUS;
          else py = s.y + s.h + CAT_RADIUS;
        }
      }
    }

    return {
      x: Phaser.Math.Clamp(px, 34, WORLD_WIDTH - 34),
      y: Phaser.Math.Clamp(py, FLOOR_TOP_Y, FLOOR_BOTTOM_Y),
    };
  }

  private hopCatTo(cat: RoomCat, destX: number, destY: number, targetPerch: WorldRect | null): void {
    if (cat.jumping) return;
    cat.jumping = true;
    cat.perch = targetPerch;
    cat.perchTimer = targetPerch ? Phaser.Math.FloatBetween(6, 12) : 0;
    cat.targetX = destX;
    cat.targetY = destY;
    cat.sprite.setFlipX(destX < cat.x);

    const startX = cat.x;
    const startY = cat.y;
    const arcHeight = Math.min(95, 36 + Math.hypot(destX - startX, destY - startY) * 0.25);

    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 460,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        const t = tween.getValue() ?? 0;
        cat.x = Phaser.Math.Linear(startX, destX, t);
        cat.y = Phaser.Math.Linear(startY, destY, t);
        cat.container.x = cat.x;
        cat.container.y = cat.y;
        cat.sprite.y = -Math.sin(t * Math.PI) * arcHeight;
        cat.container.setDepth(targetPerch ? 820 + cat.y : cat.y);
      },
      onComplete: () => {
        cat.jumping = false;
        cat.sprite.y = 0;
        cat.waitTimer = Phaser.Math.FloatBetween(1.2, 2.8);
      },
    });
  }

  private assignDesire(cat: RoomCat): void {
    if (cat.desire) return;
    const desires: DesireType[] = ['fish', 'yarn', 'pet'];
    const desire = Phaser.Utils.Array.GetRandom(desires);
    cat.desire = desire;

    const iconMap: Record<DesireType, string> = {
      fish: '🐟',
      yarn: '🧶',
      pet: '💕',
    };

    const bubble = this.add.container(0, -44);
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.96);
    bg.fillRoundedRect(-20, -18, 40, 32, 12);
    bg.lineStyle(2, 0xff94b8, 1);
    bg.strokeRoundedRect(-20, -18, 40, 32, 12);
    bg.fillTriangle(-5, 14, 5, 14, 0, 20);

    const txt = this.add.text(0, -2, iconMap[desire], { fontSize: '16px' }).setOrigin(0.5);
    bubble.add([bg, txt]);
    bubble.setSize(44, 38).setInteractive({ useHandCursor: true });
    bubble.on('pointerdown', () => {
      if (!this.dragMoved) this.onCatTapped(cat);
    });

    cat.container.add(bubble);
    cat.bubble = bubble;
  }

  private onCatTapped(cat: RoomCat): void {
    sound.unlock();
    if (cat.desire) {
      const reward = cat.desire === 'pet' ? 3 : 5;
      cat.desire = null;
      if (cat.bubble) {
        cat.bubble.destroy();
        cat.bubble = null;
      }
      sound.playMeowPop(2);
      this.sessionEarned += reward;
      const save = loadSave();
      save.pawsCurrency += reward;
      writeSave(save);
      this.pawsText.setText(`🐾 ${save.pawsCurrency}`);
      this.statusText.setText(`¡${CAT_MAP[cat.color].name} feliz! +${reward} 🐾`);

      const pop = this.add
        .text(cat.x, cat.y - 38, `+${reward} 🐾`, {
          fontFamily: FONT_FAMILY,
          fontSize: '16px',
          color: '#28a86b',
          fontStyle: 'bold',
          stroke: '#ffffff',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(960);
      this.roomContainer.add(pop);
      this.tweens.add({
        targets: pop,
        y: pop.y - 34,
        alpha: 0,
        duration: 700,
        onComplete: () => pop.destroy(),
      });
    } else {
      sound.playMeowNote(540);
      this.statusText.setText(`${CAT_MAP[cat.color].name} ronronea en la habitación ♪`);
    }

    this.tweens.add({
      targets: cat.sprite,
      scaleX: 0.135,
      scaleY: 0.098,
      duration: 110,
      yoyo: true,
    });
  }

  update(time: number, delta: number): void {
    const dt = delta / 1000;

    // Smooth horizontal pan momentum after swipe release
    if (!this.isDragging && Math.abs(this.panVelocity) > 4) {
      this.setRoomScroll(this.roomContainer.x + this.panVelocity * dt);
      this.panVelocity *= Math.pow(0.08, dt);
    }

    for (const cat of this.cats) {
      if (cat.jumping) continue;

      if (cat.perch) {
        cat.perchTimer -= dt;
        if (cat.perchTimer <= 0) {
          const drop = this.findFreeFloorPoint();
          this.hopCatTo(cat, drop.x, drop.y, null);
          continue;
        }

        const dx = cat.targetX - cat.x;
        if (Math.abs(dx) > 3) {
          const step = Math.sign(dx) * Math.min(Math.abs(dx), 36 * dt);
          cat.x += step;
          cat.sprite.setFlipX(dx < 0);
          cat.sprite.y = -Math.abs(Math.sin(time * 0.01 + cat.phase)) * 4;
        } else {
          cat.sprite.y = 0;
          cat.waitTimer -= dt;
          if (cat.waitTimer <= 0) {
            cat.waitTimer = Phaser.Math.FloatBetween(1.6, 3.6);
            cat.targetX = Phaser.Math.Between(cat.perch.x + 12, cat.perch.x + cat.perch.w - 12);
          }
        }
        cat.container.x = cat.x;
        cat.container.y = cat.y;
        cat.container.setDepth(820 + cat.y);
        continue;
      }

      // Floor navigation with solid obstacle avoidance
      const dx = cat.targetX - cat.x;
      const dy = cat.targetY - cat.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 6) {
        const speed = 48;
        const step = Math.min(dist, speed * dt);
        const nextX = cat.x + (dx / dist) * step;
        const nextY = cat.y + (dy / dist) * step;
        const resolved = this.pushOutOfSolids(nextX, nextY);

        // If blocked by furniture/tree hitbox, pick a new clear floor target or hop onto nearby perch
        if (Math.hypot(resolved.x - cat.x, resolved.y - cat.y) < step * 0.2) {
          const alt = this.findFreeFloorPoint();
          cat.targetX = alt.x;
          cat.targetY = alt.y;
        } else {
          cat.x = resolved.x;
          cat.y = resolved.y;
          cat.sprite.setFlipX(dx < -1);
          cat.sprite.y = -Math.abs(Math.sin(time * 0.011 + cat.phase)) * 5;
        }
      } else {
        cat.sprite.y = 0;
        cat.waitTimer -= dt;
        if (cat.waitTimer <= 0) {
          // 28% chance to hop up onto a nearby furniture or tree perch!
          if (Math.random() < 0.28) {
            const candidates = this.perchRects.filter(
              (p) => Math.hypot(p.x + p.w / 2 - cat.x, p.y + p.h / 2 - cat.y) < 340,
            );
            const chosen = candidates.length > 0
              ? Phaser.Utils.Array.GetRandom(candidates)
              : Phaser.Utils.Array.GetRandom(this.perchRects);
            this.hopCatTo(
              cat,
              Phaser.Math.Between(chosen.x + 12, chosen.x + chosen.w - 12),
              chosen.y + chosen.h * 0.55,
              chosen,
            );
            continue;
          }
          cat.waitTimer = Phaser.Math.FloatBetween(1.4, 3.4);
          const next = this.findFreeFloorPoint();
          cat.targetX = next.x;
          cat.targetY = next.y;
        }
      }

      cat.container.x = cat.x;
      cat.container.y = cat.y;
      cat.container.setDepth(cat.y);
    }
  }
}
