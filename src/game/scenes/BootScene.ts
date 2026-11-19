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
    this.load.image('cat_room_bg', 'assets/cat_room_bg.jpg');
  }

  create(): void {
    this.generateDecoTextures();
    this.scene.start('LoadingScene');
  }

  private generateDecoTextures(): void {
    // Generate all procedural deco textures at 4x HD (128x128) so large badges/stars never blur
    const S = 4;

    // 1. Golden Star (128x128)
    const star = this.make.graphics({ x: 0, y: 0 });
    star.fillStyle(0xffd84d, 1);
    star.lineStyle(2 * S, 0x261a36, 1);
    this.drawStarPath(star, 16 * S, 16 * S, 5, 13 * S, 6 * S);
    star.generateTexture('deco_star', 32 * S, 32 * S);
    star.destroy();

    // 2. Pink Heart (120x120)
    const heart = this.make.graphics({ x: 0, y: 0 });
    heart.fillStyle(0xff5c8d, 1);
    heart.lineStyle(2 * S, 0x261a36, 1);
    heart.fillCircle(10 * S, 11 * S, 7 * S);
    heart.fillCircle(20 * S, 11 * S, 7 * S);
    heart.fillTriangle(3.5 * S, 13 * S, 26.5 * S, 13 * S, 15 * S, 26 * S);
    heart.generateTexture('deco_heart', 30 * S, 30 * S);
    heart.destroy();

    // 3. Cute Paw Print (128x128)
    const paw = this.make.graphics({ x: 0, y: 0 });
    paw.fillStyle(0xff9eb8, 1);
    paw.fillEllipse(16 * S, 20 * S, 14 * S, 10 * S);
    paw.fillCircle(8 * S, 12 * S, 3.5 * S);
    paw.fillCircle(13.5 * S, 8 * S, 3.5 * S);
    paw.fillCircle(19.5 * S, 8 * S, 3.5 * S);
    paw.fillCircle(24 * S, 12 * S, 3.5 * S);
    paw.generateTexture('deco_paw', 32 * S, 32 * S);
    paw.destroy();

    // 4. 4-Point Sparkle (128x128)
    const sp = this.make.graphics({ x: 0, y: 0 });
    sp.fillStyle(0x7be7ff, 1);
    sp.fillTriangle(16 * S, 2 * S, 19 * S, 13 * S, 13 * S, 13 * S);
    sp.fillTriangle(16 * S, 30 * S, 19 * S, 19 * S, 13 * S, 19 * S);
    sp.fillTriangle(2 * S, 16 * S, 13 * S, 19 * S, 13 * S, 13 * S);
    sp.fillTriangle(30 * S, 16 * S, 19 * S, 19 * S, 19 * S, 13 * S);
    sp.fillCircle(16 * S, 16 * S, 3.5 * S);
    sp.generateTexture('deco_sparkle', 32 * S, 32 * S);
    sp.destroy();

    // 5. White Confetti Square (40x40)
    const conf = this.make.graphics({ x: 0, y: 0 });
    conf.fillStyle(0xffffff, 1);
    conf.fillRoundedRect(0, 0, 10 * S, 10 * S, 2 * S);
    conf.generateTexture('particle_confetti', 10 * S, 10 * S);
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
