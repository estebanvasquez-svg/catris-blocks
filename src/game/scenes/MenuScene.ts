import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import {
  createCatrisLogo,
  createGlossyButton,
  drawGridBackground,
} from '../kawaiiArtwork';
import { sound } from '../audio';
import { loadSave } from '../storage';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create(): void {
    drawGridBackground(this, true);

    // Subtle stacked cat towers on left & right (matching pantallas.jpg top-middle)
    const leftCats = ['cat_green', 'cat_blue', 'cat_orange', 'cat_purple'];
    leftCats.forEach((key, idx) => {
      this.add
        .image(42, GAME_HEIGHT - 160 - idx * 54, key)
        .setScale(0.21)
        .setAlpha(0.35);
    });
    const rightCats = ['cat_yellow', 'cat_pink', 'cat_turquoise', 'cat_purple'];
    rightCats.forEach((key, idx) => {
      this.add
        .image(GAME_WIDTH - 42, GAME_HEIGHT - 180 - idx * 54, key)
        .setScale(0.21)
        .setAlpha(0.35);
    });

    const logo = createCatrisLogo(this, GAME_WIDTH / 2, 175, 1.05);
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

    // Bottom row: SHOP (green) & OPTIONS (pink)
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

    // Collection button (purple)
    createGlossyButton(this, {
      x: GAME_WIDTH / 2,
      y: 632,
      width: 235,
      height: 54,
      label: 'COLECCIÓN',
      fillColor: 0xb16ef5,
      topHighlight: 0xe2c7ff,
      fontSize: 24,
      onClick: () => {
        sound.playClick();
        this.scene.start('CollectionScene');
      },
    });

    // Peeking orange cat (bottom-left) & blue cat (bottom-right)
    const orangeCat = this.add
      .image(70, GAME_HEIGHT - 44, 'cat_orange_sticker')
      .setScale(0.45)
      .setAngle(-8);
    const blueCat = this.add
      .image(GAME_WIDTH - 70, GAME_HEIGHT - 40, 'cat_blue_sticker')
      .setScale(0.42)
      .setAngle(8);

    this.tweens.add({
      targets: orangeCat,
      y: GAME_HEIGHT - 54,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: blueCat,
      y: GAME_HEIGHT - 50,
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Paws currency badge at bottom center
    const save = loadSave();
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 34, `🐾 ${save.pawsCurrency}`, {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffe066',
        stroke: '#111d3a',
        strokeThickness: 5,
      })
      .setOrigin(0.5);
  }
}
