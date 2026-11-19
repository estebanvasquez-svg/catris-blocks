import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import {
  createCatrisLogo,
  createGlossyButton,
  drawGridBackground,
} from '../kawaiiArtwork';
import { sound } from '../audio';
import { loadSave } from '../storage';

type BadgeIconType = 'bag' | 'gear' | 'book' | 'star';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create(): void {
    drawGridBackground(this, true);
    this.drawDreamyAtmosphere();
    this.drawSideCatStacks();

    const logo = createCatrisLogo(this, GAME_WIDTH / 2, 175, 1.05);
    this.enhanceLogo(logo);
    this.tweens.add({
      targets: logo,
      y: 183,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Big glossy yellow PLAY button with paw icon
    createGlossyButton(this, {
      x: GAME_WIDTH / 2,
      y: 375,
      width: 270,
      height: 76,
      label: 'PLAY',
      fillColor: 0xffcf33,
      topHighlight: 0xfff5a8,
      fontSize: 38,
      pawIcon: true,
      onClick: () => {
        sound.playClick();
        const save = loadSave();
        this.scene.start('GameScene', { levelId: save.unlockedLevel });
      },
    });

    // Glossy sky-blue LEVELS button
    createGlossyButton(this, {
      x: GAME_WIDTH / 2,
      y: 472,
      width: 235,
      height: 62,
      label: 'LEVELS',
      fillColor: 0x4fc3ff,
      topHighlight: 0xb8ebff,
      fontSize: 28,
      onClick: () => {
        sound.playClick();
        this.scene.start('LevelSelectScene');
      },
    });

    // Middle row: SHOP (green) & OPTIONS (pink)
    createGlossyButton(this, {
      x: GAME_WIDTH / 2 - 86,
      y: 558,
      width: 154,
      height: 54,
      label: 'SHOP',
      fillColor: 0x5cd65c,
      topHighlight: 0xbef7be,
      fontSize: 23,
      onClick: () => {
        sound.playClick();
        this.scene.start('ShopScene');
      },
    });
    this.addCornerBadgeIcon(GAME_WIDTH / 2 - 144, 533, 'bag');

    createGlossyButton(this, {
      x: GAME_WIDTH / 2 + 86,
      y: 558,
      width: 154,
      height: 54,
      label: 'OPTIONS',
      fillColor: 0xff6b9e,
      topHighlight: 0xffc4d9,
      fontSize: 22,
      onClick: () => {
        sound.playClick();
        this.scene.start('OptionsScene');
      },
    });
    this.addCornerBadgeIcon(GAME_WIDTH / 2 + 28, 533, 'gear');

    // Lower row: COLECCIÓN (purple) & MINIGAMES (mint)
    createGlossyButton(this, {
      x: GAME_WIDTH / 2 - 86,
      y: 632,
      width: 154,
      height: 54,
      label: 'COLECCIÓN',
      fillColor: 0xb16ef5,
      topHighlight: 0xe2c7ff,
      fontSize: 19,
      onClick: () => {
        sound.playClick();
        this.scene.start('CollectionScene');
      },
    });
    this.addCornerBadgeIcon(GAME_WIDTH / 2 - 144, 607, 'book');

    createGlossyButton(this, {
      x: GAME_WIDTH / 2 + 86,
      y: 632,
      width: 154,
      height: 54,
      label: 'MINIGAMES',
      fillColor: 0x56d896,
      topHighlight: 0xaaf5cd,
      fontSize: 19,
      onClick: () => {
        sound.playClick();
        this.scene.start('MinigamesScene');
      },
    });
    this.addCornerBadgeIcon(GAME_WIDTH / 2 + 28, 607, 'star');

    // Peeking orange cat (bottom-left) & blue cat (bottom-right)
    const orangeCat = this.add
      .image(72, GAME_HEIGHT - 42, 'cat_orange_sticker')
      .setScale(0.47)
      .setAngle(-7);
    const blueCat = this.add
      .image(GAME_WIDTH - 72, GAME_HEIGHT - 38, 'cat_blue_sticker')
      .setScale(0.44)
      .setAngle(7);

    this.tweens.add({
      targets: orangeCat,
      y: GAME_HEIGHT - 52,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: blueCat,
      y: GAME_HEIGHT - 48,
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Paws currency badge at bottom center
    const save = loadSave();
    this.add.image(GAME_WIDTH / 2 - 22, GAME_HEIGHT - 32, 'deco_paw').setScale(0.2);
    this.add
      .text(GAME_WIDTH / 2 + 6, GAME_HEIGHT - 32, `${save.pawsCurrency}`, {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '21px',
        fontStyle: 'bold',
        color: '#ffe066',
        stroke: '#111d3a',
        strokeThickness: 5,
      })
      .setOrigin(0, 0.5);
  }

  private drawDreamyAtmosphere(): void {
    // Soft dreamy clouds drifting behind the logo/PLAY gap
    const drawCloud = (cx: number, cy: number, flip = 1) => {
      const g = this.add.graphics();
      g.fillStyle(0xb9d6ff, 0.14);
      g.fillEllipse(cx, cy + 8, 128, 36);
      g.fillCircle(cx - 28 * flip, cy - 2, 26);
      g.fillCircle(cx + 4 * flip, cy - 10, 32);
      g.fillCircle(cx + 34 * flip, cy, 22);
      return g;
    };

    const leftCloud = drawCloud(44, 268, 1);
    const rightCloud = drawCloud(GAME_WIDTH - 42, 264, -1);

    this.tweens.add({
      targets: leftCloud,
      x: 10,
      duration: 4200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: rightCloud,
      x: -10,
      duration: 4600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Paw constellations on left and right
    const drawConstellation = (pts: Array<{ x: number; y: number }>) => {
      const lineG = this.add.graphics();
      lineG.lineStyle(1.6, 0x9ec4ff, 0.24);
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const steps = 6;
        for (let s = 0; s < steps; s += 2) {
          const x1 = Phaser.Math.Linear(a.x, b.x, s / steps);
          const y1 = Phaser.Math.Linear(a.y, b.y, s / steps);
          const x2 = Phaser.Math.Linear(a.x, b.x, Math.min(1, (s + 1) / steps));
          const y2 = Phaser.Math.Linear(a.y, b.y, Math.min(1, (s + 1) / steps));
          lineG.lineBetween(x1, y1, x2, y2);
        }
      }
      pts.forEach((p, idx) => {
        this.add
          .image(p.x, p.y, 'deco_paw')
          .setScale(idx % 2 === 0 ? 0.14 : 0.11)
          .setAlpha(0.28)
          .setTint(0xb5d6ff)
          .setAngle(idx * 14 - 18);
      });
    };

    drawConstellation([
      { x: 38, y: 332 },
      { x: 64, y: 312 },
      { x: 96, y: 326 },
      { x: 132, y: 310 },
    ]);
    drawConstellation([
      { x: GAME_WIDTH - 134, y: 318 },
      { x: GAME_WIDTH - 96, y: 304 },
      { x: GAME_WIDTH - 68, y: 328 },
      { x: GAME_WIDTH - 36, y: 312 },
    ]);

    // Soft glowing bokeh dots
    const bokeh = [
      { x: 52, y: 120, r: 4, c: 0xffe066 },
      { x: GAME_WIDTH - 48, y: 146, r: 4, c: 0xff8fbd },
      { x: 46, y: 376, r: 5, c: 0x7ce6ff },
      { x: GAME_WIDTH - 42, y: 404, r: 4, c: 0xffe066 },
      { x: GAME_WIDTH / 2 + 54, y: 745, r: 4, c: 0x7ce6ff },
    ];
    bokeh.forEach((b, idx) => {
      const dot = this.add.circle(b.x, b.y, b.r, b.c, 0.65);
      this.tweens.add({
        targets: dot,
        alpha: 0.2,
        scale: 1.35,
        duration: 1400 + idx * 240,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  private drawSideCatStacks(): void {
    const leftCats = ['cat_green', 'cat_blue', 'cat_orange', 'cat_purple'];
    leftCats.forEach((key, idx) => {
      const cat = this.add
        .image(42, GAME_HEIGHT - 165 - idx * 54, key)
        .setScale(0.24)
        .setAlpha(0.88);
      this.tweens.add({
        targets: cat,
        angle: idx % 2 === 0 ? 3 : -3,
        duration: 2100 + idx * 180,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    const rightCats = ['cat_yellow', 'cat_pink', 'cat_turquoise', 'cat_purple'];
    rightCats.forEach((key, idx) => {
      const cat = this.add
        .image(GAME_WIDTH - 42, GAME_HEIGHT - 172 - idx * 54, key)
        .setScale(0.24)
        .setAlpha(0.88);
      this.tweens.add({
        targets: cat,
        angle: idx % 2 === 0 ? -3 : 3,
        duration: 2200 + idx * 180,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  private enhanceLogo(logo: Phaser.GameObjects.Container): void {
    // Heart & paw flanking "Kawaii Cat Blocks!"
    const leftHeart = this.add.image(-112, 44, 'deco_heart').setScale(0.19).setAngle(-10);
    const rightPaw = this.add.image(112, 44, 'deco_paw').setScale(0.19).setAngle(12);

    // Extra sparkles around the ears & letters
    const s1 = this.add.image(-122, -40, 'deco_sparkle').setScale(0.2).setTint(0xffe066);
    const s2 = this.add.image(124, -44, 'deco_sparkle').setScale(0.22).setTint(0xffe066);
    const s3 = this.add.image(16, -66, 'deco_star').setScale(0.17).setTint(0xff99cc);
    const s4 = this.add.image(-142, 6, 'deco_star').setScale(0.15).setTint(0x88e5ff);

    logo.add([leftHeart, rightPaw, s1, s2, s3, s4]);
  }

  private addCornerBadgeIcon(x: number, y: number, type: BadgeIconType): void {
    const g = this.add.graphics();

    if (type === 'bag') {
      g.lineStyle(2.5, 0x164a1c, 1);
      g.strokeCircle(x, y - 8, 5);
      g.fillStyle(0x47c447, 1);
      g.fillRoundedRect(x - 10, y - 6, 20, 18, 4);
      g.lineStyle(2.5, 0x164a1c, 1);
      g.strokeRoundedRect(x - 10, y - 6, 20, 18, 4);
      g.fillStyle(0xbef7be, 0.9);
      g.fillRoundedRect(x - 7, y - 3, 14, 5, 2);
    } else if (type === 'gear') {
      g.fillStyle(0xff5a93, 1);
      g.lineStyle(2.5, 0x5c1733, 1);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        g.fillCircle(x + Math.cos(a) * 8, y + Math.sin(a) * 8, 3.5);
      }
      g.fillCircle(x, y, 8.5);
      g.strokeCircle(x, y, 8.5);
      g.fillStyle(0xffd6e6, 1);
      g.fillCircle(x, y, 3.5);
    } else if (type === 'book') {
      g.fillStyle(0x8d52e8, 1);
      g.fillRoundedRect(x - 10, y - 9, 20, 20, 4);
      g.lineStyle(2.5, 0x331666, 1);
      g.strokeRoundedRect(x - 10, y - 9, 20, 20, 4);
      g.fillStyle(0xeadbff, 1);
      g.fillRoundedRect(x - 6, y - 5, 13, 12, 2);
      g.lineStyle(2, 0x6230b8, 1);
      g.lineBetween(x - 4, y - 1, x + 5, y - 1);
      g.lineBetween(x - 4, y + 3, x + 4, y + 3);
    } else if (type === 'star') {
      this.add.image(x, y, 'deco_star').setScale(0.24).setTint(0x6af0b5).setAngle(-10);
    }
  }
}
