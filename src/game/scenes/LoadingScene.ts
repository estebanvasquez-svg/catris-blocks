import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { createCatrisLogo, drawGridBackground } from '../kawaiiArtwork';
import { sound } from '../audio';

export class LoadingScene extends Phaser.Scene {
  private progress = 0;
  private paws: Phaser.GameObjects.Image[] = [];
  private fillBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super('LoadingScene');
  }

  create(): void {
    drawGridBackground(this, true);

    // Fluffy white clouds at the bottom (matching pantallas.jpg top-left)
    const clouds = this.add.graphics();
    clouds.fillStyle(0xffffff, 0.96);
    const cloudCircles = [
      { x: 30, y: GAME_HEIGHT - 12, r: 58 },
      { x: 105, y: GAME_HEIGHT - 4, r: 66 },
      { x: 195, y: GAME_HEIGHT - 16, r: 62 },
      { x: 285, y: GAME_HEIGHT - 8, r: 68 },
      { x: 375, y: GAME_HEIGHT - 14, r: 64 },
      { x: 440, y: GAME_HEIGHT - 4, r: 55 },
    ];
    cloudCircles.forEach((c) => clouds.fillCircle(c.x, c.y, c.r));

    // Falling cats with vertical trails (matching pantallas.jpg top-left)
    const fallingCats = [
      { key: 'cat_purple_sticker', x: 225, y: 115, scale: 0.25 },
      { key: 'cat_red_sticker', x: 64, y: 205, scale: 0.22 },
      { key: 'cat_yellow_sticker', x: 82, y: 505, scale: 0.25 },
      { key: 'cat_green_sticker', x: 375, y: 455, scale: 0.25 },
    ];
    fallingCats.forEach((fc, idx) => {
      const trail = this.add.graphics();
      trail.fillStyle(0xffffff, 0.22);
      trail.fillRoundedRect(fc.x - 16, fc.y - 88, 32, 76, 12);

      const cat = this.add.image(fc.x, fc.y, fc.key).setScale(fc.scale);
      this.tweens.add({
        targets: [cat, trail],
        y: '+=16',
        duration: 950 + idx * 140,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    createCatrisLogo(this, GAME_WIDTH / 2, 295, 1.04);

    // Paw-print progress bar (matching pantallas.jpg top-left)
    const barW = 310;
    const barH = 44;
    const barX = GAME_WIDTH / 2 - barW / 2;
    const barY = 540;

    const barFrame = this.add.graphics();
    barFrame.fillStyle(0x0c1b3e, 0.9);
    barFrame.fillRoundedRect(barX, barY, barW, barH, 22);
    barFrame.lineStyle(4, 0x62bfff, 1);
    barFrame.strokeRoundedRect(barX, barY, barW, barH, 22);

    this.fillBar = this.add.graphics();

    this.paws = [];
    for (let i = 0; i < 5; i++) {
      const px = barX + 36 + i * 58;
      const py = barY + barH / 2;
      const paw = this.add.image(px, py, 'deco_paw').setScale(0.2375).setTint(0x3a4d7a);
      this.paws.push(paw);
    }

    this.add
      .text(GAME_WIDTH / 2, 608, 'Loading...', {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#14244b',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.input.once('pointerdown', () => sound.unlock());

    this.progress = 0;
    this.time.addEvent({
      delay: 30,
      repeat: 40,
      callback: () => {
        this.progress = Math.min(1, this.progress + 0.025);
        this.renderProgress(barX, barY, barW, barH);
        if (this.progress >= 1) {
          this.time.delayedCall(200, () => {
            this.scene.start('MenuScene');
          });
        }
      },
    });
  }

  private renderProgress(barX: number, barY: number, barW: number, barH: number): void {
    this.fillBar.clear();
    const fillW = Math.max(24, (barW - 12) * this.progress);
    this.fillBar.fillStyle(0xffd24c, 1);
    this.fillBar.fillRoundedRect(barX + 6, barY + 6, fillW, barH - 12, 16);

    const litCount = Math.floor(this.progress * 5.05);
    this.paws.forEach((p, idx) => {
      if (idx < litCount) {
        p.setTint(0xfff4c2).setScale(0.2625);
      } else {
        p.setTint(0x3a4d7a).setScale(0.225);
      }
    });
  }
}
