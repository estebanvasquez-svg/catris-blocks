import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SHOP_THEMES } from '../constants';
import { createGlossyButton, drawGridBackground, drawHudPanel } from '../kawaiiArtwork';
import { sound } from '../audio';
import { loadSave, writeSave } from '../storage';

export class ShopScene extends Phaser.Scene {
  constructor() {
    super('ShopScene');
  }

  create(): void {
    drawGridBackground(this, true);
    const save = loadSave();

    this.add
      .text(GAME_WIDTH / 2, 72, 'CAT SHOP', {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#162447',
        strokeThickness: 9,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 118, `Your Paws: 🐾 ${save.pawsCurrency}`, {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ffe066',
        stroke: '#111d3a',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    SHOP_THEMES.forEach((theme, idx) => {
      const cy = 225 + idx * 145;
      drawHudPanel(this, GAME_WIDTH / 2, cy, 380, 116, theme.frameColor);

      // Color swatch preview
      const sw = this.add.graphics();
      sw.fillStyle(theme.bgColor, 1);
      sw.lineStyle(4, theme.frameColor, 1);
      sw.fillRoundedRect(GAME_WIDTH / 2 - 165, cy - 36, 72, 72, 14);
      sw.strokeRoundedRect(GAME_WIDTH / 2 - 165, cy - 36, 72, 72, 14);

      this.add.image(GAME_WIDTH / 2 - 129, cy, 'cat_pink_sticker').setScale(0.2);

      this.add
        .text(GAME_WIDTH / 2 - 74, cy - 22, theme.name, {
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '23px',
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(0, 0.5);

      const isUnlocked = save.unlockedThemes.includes(theme.id);
      const isActive = save.activeTheme === theme.id;

      let btnLabel = `🐾 ${theme.cost}`;
      let btnColor = 0xffcf33;
      let btnHi = 0xfff5a8;
      if (isActive) {
        btnLabel = 'EQUIPPED';
        btnColor = 0x5cd65c;
        btnHi = 0xbef7be;
      } else if (isUnlocked) {
        btnLabel = 'EQUIP';
        btnColor = 0x4fc3ff;
        btnHi = 0xb8ebff;
      }

      createGlossyButton(this, {
        x: GAME_WIDTH / 2 + 106,
        y: cy + 12,
        width: 132,
        height: 46,
        label: btnLabel,
        fillColor: btnColor,
        topHighlight: btnHi,
        fontSize: 18,
        onClick: () => {
          sound.playClick();
          const current = loadSave();
          if (current.unlockedThemes.includes(theme.id)) {
            current.activeTheme = theme.id;
            writeSave(current);
            this.scene.restart();
          } else if (current.pawsCurrency >= theme.cost) {
            current.pawsCurrency -= theme.cost;
            current.unlockedThemes.push(theme.id);
            current.activeTheme = theme.id;
            writeSave(current);
            sound.playMeowPop(2);
            this.scene.restart();
          }
        },
      });
    });

    createGlossyButton(this, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 86,
      width: 190,
      height: 58,
      label: 'BACK',
      fillColor: 0xff6f96,
      topHighlight: 0xffc7d7,
      fontSize: 26,
      onClick: () => {
        sound.playClick();
        this.scene.start('MenuScene');
      },
    });
  }
}
