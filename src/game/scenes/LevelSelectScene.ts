import Phaser from 'phaser';
import { CAT_HEX, CAT_MAP, GAME_HEIGHT, GAME_WIDTH, LEVELS } from '../constants';
import {
  createGlossyButton,
  drawGridBackground,
  drawPadlock,
  drawPawBadge,
  drawYarnBadge,
} from '../kawaiiArtwork';
import { sound } from '../audio';
import { loadSave } from '../storage';

const LEVELS_PER_PAGE = 9;

export class LevelSelectScene extends Phaser.Scene {
  private selectedLevel = 1;
  private currentPage = 0;
  private selectorRing!: Phaser.GameObjects.Graphics;
  private gridContainer!: Phaser.GameObjects.Container;
  private pageText!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;

  constructor() {
    super('LevelSelectScene');
  }

  create(): void {
    drawGridBackground(this, true);
    const save = loadSave();
    this.selectedLevel = save.unlockedLevel;
    this.currentPage = Math.floor((this.selectedLevel - 1) / LEVELS_PER_PAGE);

    // Title: SELECT LEVEL
    this.add
      .text(GAME_WIDTH / 2, 62, 'SELECT LEVEL', {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#162447',
        strokeThickness: 9,
      })
      .setOrigin(0.5);

    // Main rounded blue container (3x3 grid for 9 levels per page)
    const panelW = 396;
    const panelH = 444;
    const panelX = GAME_WIDTH / 2 - panelW / 2;
    const panelY = 104;

    const panel = this.add.graphics();
    panel.fillStyle(0x1f4b8f, 0.92);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 28);
    panel.lineStyle(5, 0x6ac5ff, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 28);

    // Subtle 3x3 grid divider lines
    panel.lineStyle(2, 0x4b87d6, 0.45);
    panel.lineBetween(panelX + panelW / 3, panelY + 14, panelX + panelW / 3, panelY + panelH - 14);
    panel.lineBetween(panelX + (panelW * 2) / 3, panelY + 14, panelX + (panelW * 2) / 3, panelY + panelH - 14);
    panel.lineBetween(panelX + 14, panelY + panelH / 3, panelX + panelW - 14, panelY + panelH / 3);
    panel.lineBetween(panelX + 14, panelY + (panelH * 2) / 3, panelX + panelW - 14, panelY + (panelH * 2) / 3);

    this.gridContainer = this.add.container(0, 0);
    this.selectorRing = this.add.graphics();

    // Pagination bar
    const totalPages = Math.ceil(LEVELS.length / LEVELS_PER_PAGE);
    createGlossyButton(this, {
      x: 78,
      y: 578,
      width: 68,
      height: 44,
      label: '◀',
      fillColor: 0x3b7be0,
      topHighlight: 0x8ec5ff,
      fontSize: 20,
      onClick: () => {
        if (this.currentPage > 0) {
          sound.playClick();
          this.currentPage--;
          this.renderPage();
        }
      },
    });

    this.pageText = this.add
      .text(GAME_WIDTH / 2, 578, `Pág. ${this.currentPage + 1} / ${totalPages}`, {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#162447',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    createGlossyButton(this, {
      x: GAME_WIDTH - 78,
      y: 578,
      width: 68,
      height: 44,
      label: '▶',
      fillColor: 0x3b7be0,
      topHighlight: 0x8ec5ff,
      fontSize: 20,
      onClick: () => {
        if (this.currentPage < totalPages - 1) {
          sound.playClick();
          this.currentPage++;
          this.renderPage();
        }
      },
    });

    // Selected level info bar
    this.infoText = this.add
      .text(GAME_WIDTH / 2, 628, '', {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#bfe8ff',
        stroke: '#111d3d',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.renderPage();

    // Bottom buttons: BACK (pink) & START (green)
    createGlossyButton(this, {
      x: GAME_WIDTH / 2 - 96,
      y: GAME_HEIGHT - 88,
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
      y: GAME_HEIGHT - 88,
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

  private renderPage(): void {
    this.gridContainer.removeAll(true);
    this.selectorRing.clear();

    const save = loadSave();
    const totalPages = Math.ceil(LEVELS.length / LEVELS_PER_PAGE);
    this.pageText.setText(`Pág. ${this.currentPage + 1} / ${totalPages}`);

    const panelW = 396;
    const panelH = 444;
    const panelX = GAME_WIDTH / 2 - panelW / 2;
    const panelY = 104;
    const cellW = panelW / 3;
    const cellH = panelH / 3;

    const startIdx = this.currentPage * LEVELS_PER_PAGE;
    const pageLevels = LEVELS.slice(startIdx, startIdx + LEVELS_PER_PAGE);

    pageLevels.forEach((lvl, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const cx = panelX + col * cellW + cellW / 2;
      const cy = panelY + row * cellH + cellH / 2 - 4;

      const isUnlocked = lvl.id <= save.unlockedLevel;
      const stars = save.levelStars[lvl.id] ?? 0;
      const isCleared = stars > 0;
      const isNuevo = lvl.id === save.newlyUnlockedLevel && !isCleared;

      // Badge tinted with the level's target cat color!
      const catColorHex = CAT_HEX[lvl.targetCat];
      const gBadge = this.add.graphics();
      this.gridContainer.add(gBadge);

      // Draw badge directly into gridContainer via temporary helper or scene graphics added to container
      if (lvl.badgeType === 'yarn') {
        const b = drawYarnBadge(this, cx, cy, catColorHex, !isUnlocked);
        this.gridContainer.add(b);
      } else {
        const b = drawPawBadge(this, cx, cy, catColorHex, !isUnlocked);
        this.gridContainer.add(b);
      }

      // Level number
      const numTxt = this.add
        .text(cx, cy + 6, `${lvl.id}`, {
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '23px',
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: '#1e2444',
          strokeThickness: 6,
        })
        .setOrigin(0.5);
      this.gridContainer.add(numTxt);

      // Mini target cat sticker on bottom-left of tile
      const miniCat = this.add
        .image(cx - 34, cy + 22, `cat_${lvl.targetCat}_sticker`)
        .setScale(0.14);
      if (!isUnlocked) {
        miniCat.setTint(0x283555);
      }
      this.gridContainer.add(miniCat);

      if (!isUnlocked) {
        const lock = drawPadlock(this, cx + 24, cy + 20);
        this.gridContainer.add(lock);
      } else if (isCleared) {
        for (let s = 0; s < 3; s++) {
          const sx = cx - 20 + s * 20;
          const sy = cy - 36;
          const star = this.add
            .image(sx, sy, 'deco_star')
            .setScale(0.55)
            .setTint(s < stars ? 0xffffff : 0x3f5380);
          this.gridContainer.add(star);
        }
        const clr = this.add
          .text(cx, cy + 44, 'CLEARED!', {
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#fff3a8',
            stroke: '#162447',
            strokeThickness: 4,
          })
          .setOrigin(0.5);
        this.gridContainer.add(clr);
      }

      if (isNuevo) {
        const badge = this.add.graphics();
        badge.fillStyle(0xffffff, 1);
        badge.lineStyle(2.5, 0x1b2447, 1);
        badge.fillRoundedRect(cx + 6, cy - 44, 52, 20, 10);
        badge.strokeRoundedRect(cx + 6, cy - 44, 52, 20, 10);
        const nuevoTxt = this.add
          .text(cx + 32, cy - 34, 'NUEVO', {
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '10px',
            fontStyle: 'bold',
            color: '#1b2447',
          })
          .setOrigin(0.5);
        this.gridContainer.add([badge, nuevoTxt]);
      }

      if (lvl.id === this.selectedLevel) {
        this.drawSelectionRing(cx, cy);
      }

      const hit = this.add
        .rectangle(cx, cy + 4, cellW - 8, cellH - 10, 0x000000, 0)
        .setInteractive({ useHandCursor: isUnlocked });
      this.gridContainer.add(hit);

      hit.on('pointerdown', () => {
        if (!isUnlocked) return;
        sound.playClick();
        this.selectedLevel = lvl.id;
        this.drawSelectionRing(cx, cy);
        this.updateInfoText();
      });
    });

    this.updateInfoText();
  }

  private updateInfoText(): void {
    const cfg = LEVELS[this.selectedLevel - 1];
    const cat = CAT_MAP[cfg.targetCat];
    const speciesCount = cfg.id <= 8 ? 8 : cfg.id;
    this.infoText.setText(
      `Nv.${cfg.id} • ${cat.name} • Meta: ${cfg.targetCatCount} gatos (${speciesCount} especies)`
    );
  }

  private drawSelectionRing(cx: number, cy: number): void {
    this.selectorRing.clear();
    this.selectorRing.lineStyle(4, 0xffe45e, 1);
    this.selectorRing.strokeCircle(cx, cy, 46);
  }
}
