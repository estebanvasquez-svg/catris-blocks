import Phaser from 'phaser';
import { CAT_IDS } from '../constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    for (const color of CAT_IDS) {
      this.load.image(`cat_${color}`, `assets/cats/cat_${color}.png`);
      this.load.image(`cat_${color}_sticker`, `assets/cats/cat_${color}_sticker.png`);
    }
  }

  create(): void {
    this.generateDecoTextures();
    this.scene.start('LoadingScene');
  }

  private generateDecoTextures(): void {
    // 1. Golden Star
    const star = this.make.graphics({ x: 0, y: 0 });
    star.fillStyle(0xffd84d, 1);
    star.lineStyle(2, 0x261a36, 1);
    this.drawStarPath(star, 16, 16, 5, 13, 6);
    star.generateTexture('deco_star', 32, 32);
    star.destroy();

    // 2. Pink Heart
    const heart = this.make.graphics({ x: 0, y: 0 });
    heart.fillStyle(0xff5c8d, 1);
    heart.lineStyle(2, 0x261a36, 1);
    heart.fillCircle(10, 11, 7);
    heart.fillCircle(20, 11, 7);
    heart.fillTriangle(3.5, 13, 26.5, 13, 15, 26);
    heart.generateTexture('deco_heart', 30, 30);
    heart.destroy();

    // 3. Cute Paw Print
    const paw = this.make.graphics({ x: 0, y: 0 });
    paw.fillStyle(0xff9eb8, 1);
    paw.fillEllipse(16, 20, 14, 10);
    paw.fillCircle(8, 12, 3.5);
    paw.fillCircle(13.5, 8, 3.5);
    paw.fillCircle(19.5, 8, 3.5);
    paw.fillCircle(24, 12, 3.5);
    paw.generateTexture('deco_paw', 32, 32);
    paw.destroy();

    // 4. 4-Point Sparkle
    const sp = this.make.graphics({ x: 0, y: 0 });
    sp.fillStyle(0x7be7ff, 1);
    sp.fillTriangle(16, 2, 19, 13, 13, 13);
    sp.fillTriangle(16, 30, 19, 19, 13, 19);
    sp.fillTriangle(2, 16, 13, 19, 13, 13);
    sp.fillTriangle(30, 16, 19, 19, 19, 13);
    sp.fillCircle(16, 16, 3.5);
    sp.generateTexture('deco_sparkle', 32, 32);
    sp.destroy();

    // 5. White Confetti Square
    const conf = this.make.graphics({ x: 0, y: 0 });
    conf.fillStyle(0xffffff, 1);
    conf.fillRoundedRect(0, 0, 10, 10, 2);
    conf.generateTexture('particle_confetti', 10, 10);
    conf.destroy();
  }

  private drawStarPath(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    spikes: number,
    outerR: number,
    innerR: number
  ): void {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    const pts: Phaser.Types.Math.Vector2Like[] = [];
    for (let i = 0; i < spikes; i++) {
      pts.push({ x: cx + Math.cos(rot) * outerR, y: cy + Math.sin(rot) * outerR });
      rot += step;
      pts.push({ x: cx + Math.cos(rot) * innerR, y: cy + Math.sin(rot) * innerR });
      rot += step;
    }
    g.fillPoints(pts, true);
    g.strokePoints(pts, true);
  }
}
