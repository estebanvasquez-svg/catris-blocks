import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, LEVELS } from '../constants';
import {
  createGlossyButton,
  drawGridBackground,
  drawPadlock,
  drawPawBadge,
  drawYarnBadge,
} from '../kawaiiArtwork';
import { sound } from '../audio';
import { loadSave } from '../storage';

export class LevelSelectScene extends Phaser.Scene {
  private selectedLevel = 1;
  private selectorRing!: Phaser.GameObjects.Graphics;

  constructor() {
    super('LevelSelectScene');
  }

  create(): void {
    drawGridBackground(this, true);
    const save = loadSave();
    this.selectedLevel = save.unlockedLevel;

    // Title: SELECT LEVEL
    this.add
      .text(GAME_WIDTH / 2, 72, 'SELECT LEVEL', {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '38px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#162447',
        strokeThickness: 9,
      })
      .setOrigin(0.5);

    // Main rounded blue container (matching pantallas.jpg top-right & bottom-right)
    const panelW = 396;
    const panelH = 420;
    const panelX = GAME_WIDTH / 2 - panelW / 2;
    const panelY = 128;

    const panel = this.add.graphics();
    panel.fillStyle(0x1f4b8f, 0.92);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 28);
    panel.lineStyle(5, 0x6ac5ff, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 28);

    // Subtle 3x2 grid divider lines inside panel
    panel.lineStyle(2, 0x4b87d6, 0.55);
    panel.lineBetween(panelX + panelW / 3, panelY + 18, panelX + panelW / 3, panelY + panelH - 18);
    panel.lineBetween(panelX + (panelW * 2) / 3, panelY + 18, panelX + (panelW * 2) / 3, panelY + panelH - 18);
    panel.lineBetween(panelX + 18, panelY + panelH / 2, panelX + panelW - 18, panelY + panelH / 2);

    this.selectorRing = this.add.graphics();

    const cellW = panelW / 3;
    const cellH = panelH / 2;

    LEVELS.forEach((lvl, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const cx = panelX + col * cellW + cellW / 2;
      const cy = panelY + row * cellH + cellH / 2 - 10;

      const isUnlocked = lvl.id <= save.unlockedLevel;
      const stars = save.levelStars[lvl.id] ?? 0;
      const isCleared = stars > 0;
      const isNuevo = lvl.id === save.newlyUnlockedLevel && !isCleared;

      // Badge color
      const badgeColor = isCleared
        ? 0xffcf40
        : lvl.badgeType === 'yarn'
        ? 0xff7aa8
        : 0xf9a476;

      if (lvl.badgeType === 'yarn') {
        drawYarnBadge(this, cx, cy, badgeColor, !isUnlocked);
      } else {
        drawPawBadge(this, cx, cy, badgeColor, !isUnlocked);
      }

      // Level number
      this.add
        .text(cx, cy + 8, `${lvl.id}`, {
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '26px',
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: '#1e2444',
          strokeThickness: 6,
        })
        .setOrigin(0.5);

      if (!isUnlocked) {
        drawPadlock(this, cx + 22, cy + 20);
      } else if (isCleared) {
        // Golden stars & CLEARED!
        for (let s = 0; s < 3; s++) {
          const sx = cx - 22 + s * 22;
          const sy = cy - 36;
          this.add
            .image(sx, sy, 'deco_star')
            .setScale(0.62)
            .setTint(s < stars ? 0xffffff : 0x3f5380);
        }
        this.add
          .text(cx, cy + 48, 'CLEARED!', {
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#fff3a8',
            stroke: '#162447',
            strokeThickness: 4,
          })
          .setOrigin(0.5);
      }

      if (isNuevo) {
        const badge = this.add.graphics();
        badge.fillStyle(0xffffff, 1);
        badge.lineStyle(2.5, 0x1b2447, 1);
        badge.fillRoundedRect(cx + 8, cy - 42, 54, 22, 11);
        badge.strokeRoundedRect(cx + 8, cy - 42, 54, 22, 11);
        this.add
          .text(cx + 35, cy - 31, 'NUEVO', {
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '11px',
            fontStyle: 'bold',
            color: '#1b2447',
          })
          .setOrigin(0.5);

        // Cute peeking cat
        this.add.image(cx + 36, cy + 6, 'cat_orange_sticker').setScale(0.16);
      }

      if (lvl.id === this.selectedLevel) {
        this.drawSelectionRing(cx, cy);
      }

      const hit = this.add
        .rectangle(cx, cy + 8, cellW - 10, cellH - 14, 0x000000, 0)
        .setInteractive({ useHandCursor: isUnlocked });

      hit.on('pointerdown', () => {
        if (!isUnlocked) return;
        sound.playClick();
        this.selectedLevel = lvl.id;
        this.drawSelectionRing(cx, cy);
      });
    });

    // Selected level info bar
    const infoText = this.add
      .text(
        GAME_WIDTH / 2,
        588,
        `${LEVELS[this.selectedLevel - 1].name} • ${LEVELS[this.selectedLevel - 1].targetLines} Lines`,
        {
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '20px',
          fontStyle: 'bold',
          color: '#bfe8ff',
          stroke: '#111d3d',
          strokeThickness: 5,
        }
      )
      .setOrigin(0.5);

    this.events.on('update', () => {
      const cfg = LEVELS[this.selectedLevel - 1];
      infoText.setText(`${cfg.name} • ${cfg.targetLines} Lines`);
    });

    // Bottom buttons: BACK (pink) & START (green)
    createGlossyButton(this, {
      x: GAME_WIDTH / 2 - 96,
      y: GAME_HEIGHT - 100,
      width: 168,
      height: 62,
      label: 'BACK',
      fillColor: 0xff6f96,
      topHighlight: 0xffc7d7,
      fontSize: 27,
      onClick: () => {
        sound.playClick();
        this.scene.start('MenuScene');
      },
    });

    createGlossyButton(this, {
      x: GAME_WIDTH / 2 + 96,
      y: GAME_HEIGHT - 100,
      width: 168,
      height: 62,
      label: 'START',
      fillColor: 0x5cd65c,
      topHighlight: 0xbef7be,
      fontSize: 27,
      onClick: () => {
        sound.playClick();
        this.scene.start('GameScene', { levelId: this.selectedLevel });
      },
    });
  }

  private drawSelectionRing(cx: number, cy: number): void {
    this.selectorRing.clear();
    this.selectorRing.lineStyle(4, 0xffe066, 1);
    this.selectorRing.strokeCircle(cx, cy + 4, 44);
  }
}
