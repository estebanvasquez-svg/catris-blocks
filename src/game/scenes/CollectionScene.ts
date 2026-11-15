import Phaser from 'phaser';
import { CAT_CATALOG, CAT_HEX, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { createGlossyButton, drawGridBackground } from '../kawaiiArtwork';
import { sound } from '../audio';
import { loadSave } from '../storage';

const CATS_PER_PAGE = 12;

export class CollectionScene extends Phaser.Scene {
  private currentPage = 0;
  private gridContainer!: Phaser.GameObjects.Container;
  private pageText!: Phaser.GameObjects.Text;

  constructor() {
    super('CollectionScene');
  }

  create(): void {
    drawGridBackground(this, true);
    const save = loadSave();

    const collectedCount = CAT_CATALOG.filter(
      (cat) => (save.collectedCats[cat.id] ?? 0) > 0 || (save.levelStars[cat.index] ?? 0) > 0
    ).length;

    // Title
    this.add
      .text(GAME_WIDTH / 2, 52, 'COLECCIÓN DE GATOS', {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#162447',
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 88, `${collectedCount} / ${CAT_CATALOG.length} Gatitos`, {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffe875',
        stroke: '#162447',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    // Main panel
    const panelW = 404;
    const panelH = 472;
    const panelX = GAME_WIDTH / 2 - panelW / 2;
    const panelY = 114;

    const panel = this.add.graphics();
    panel.fillStyle(0x1f4b8f, 0.92);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 26);
    panel.lineStyle(5, 0x6ac5ff, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 26);

    this.gridContainer = this.add.container(0, 0);

    const totalPages = Math.ceil(CAT_CATALOG.length / CATS_PER_PAGE);

    createGlossyButton(this, {
      x: 78,
      y: 620,
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
      .text(GAME_WIDTH / 2, 620, `Pág. 1 / ${totalPages}`, {
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
      y: 620,
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

    this.renderPage();

    // BACK button
    createGlossyButton(this, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 84,
      width: 180,
      height: 60,
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

  private renderPage(): void {
    this.gridContainer.removeAll(true);
    const save = loadSave();
    const totalPages = Math.ceil(CAT_CATALOG.length / CATS_PER_PAGE);
    this.pageText.setText(`Pág. ${this.currentPage + 1} / ${totalPages}`);

    const panelW = 404;
    const panelH = 472;
    const panelX = GAME_WIDTH / 2 - panelW / 2;
    const panelY = 114;

    const cols = 3;
    const rows = 4;
    const cellW = panelW / cols;
    const cellH = panelH / rows;

    const start = this.currentPage * CATS_PER_PAGE;
    const pageCats = CAT_CATALOG.slice(start, start + CATS_PER_PAGE);

    pageCats.forEach((cat, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const cx = panelX + col * cellW + cellW / 2;
      const cy = panelY + row * cellH + cellH / 2;

      const count = save.collectedCats[cat.id] ?? 0;
      const isUnlocked = count > 0 || (save.levelStars[cat.index] ?? 0) > 0 || cat.index <= save.unlockedLevel;
      const isCollected = count > 0 || (save.levelStars[cat.index] ?? 0) > 0;

      // Card background
      const card = this.add.graphics();
      card.fillStyle(isCollected ? 0x16366d : 0x11244a, 0.9);
      card.lineStyle(2.5, isCollected ? CAT_HEX[cat.id] : 0x3b588f, 1);
      card.fillRoundedRect(cx - 56, cy - 50, 112, 100, 14);
      card.strokeRoundedRect(cx - 56, cy - 50, 112, 100, 14);
      this.gridContainer.add(card);

      // Cat sprite
      const sprite = this.add
        .image(cx, cy - 12, `cat_${cat.id}_sticker`)
        .setDisplaySize(58, 58);
      if (!isUnlocked) {
        sprite.setTint(0x0b1328).setAlpha(0.75);
      } else if (!isCollected) {
        sprite.setAlpha(0.6);
      }
      this.gridContainer.add(sprite);

      // Name or lock label
      const label = isUnlocked ? cat.name : `Nv. ${cat.index}`;
      const nameTxt = this.add
        .text(cx, cy + 26, label, {
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold',
          color: isCollected ? '#ffffff' : '#89a7d6',
          stroke: '#0c1833',
          strokeThickness: 3,
          align: 'center',
          wordWrap: { width: 104 },
        })
        .setOrigin(0.5);
      this.gridContainer.add(nameTxt);

      // Number badge (#1..59)
      const numTxt = this.add
        .text(cx - 46, cy - 42, `#${cat.index}`, {
          fontFamily: 'Silkscreen, Fredoka, sans-serif',
          fontSize: '10px',
          color: '#bfe8ff',
        })
        .setOrigin(0, 0);
      this.gridContainer.add(numTxt);

      if (count > 0) {
        const cntTxt = this.add
          .text(cx + 46, cy - 42, `x${count}`, {
            fontFamily: 'Silkscreen, Fredoka, sans-serif',
            fontSize: '10px',
            color: '#ffe875',
          })
          .setOrigin(1, 0);
        this.gridContainer.add(cntTxt);
      }
    });
  }
}
