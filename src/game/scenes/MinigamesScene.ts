import Phaser from 'phaser';
import { CAT_IDS, CatColor, GAME_HEIGHT, GAME_WIDTH, getUnlockedCatsForLevel } from '../constants';
import { createGlossyButton, drawGridBackground, drawHudPanel } from '../kawaiiArtwork';
import { sound } from '../audio';
import { loadSave } from '../storage';

export function getPlayerPoolCats(): CatColor[] {
  const save = loadSave();
  const collected = Object.keys(save.collectedCats).filter(
    (k): k is CatColor => (save.collectedCats[k] ?? 0) > 0 && CAT_IDS.includes(k as CatColor)
  );
  const unlocked = getUnlockedCatsForLevel(save.unlockedLevel);
  const merged = Array.from(new Set<CatColor>([...unlocked, ...collected]));
  return merged.length >= 8 ? merged : CAT_IDS.slice(0, 8);
}

export class MinigamesScene extends Phaser.Scene {
  constructor() {
    super('MinigamesScene');
  }

  create(): void {
    drawGridBackground(this, true);
    const save = loadSave();

    this.add
      .text(GAME_WIDTH / 2, 66, 'MINIGAMES', {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '38px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#162447',
        strokeThickness: 9,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 108, `Gatos disponibles: ${getPlayerPoolCats().length}/59  •  🐾 ${save.pawsCurrency}`, {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffe066',
        stroke: '#111d3a',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const games = [
      {
        scene: 'CatTowerScene',
        title: 'CAT TOWER',
        desc: 'Apila gatos al ritmo de la grúa',
        cat: 'cat_orange_sticker',
        color: 0xff9b35,
        hi: 0xffd29e,
      },
      {
        scene: 'MiauHeroScene',
        title: 'MIAU HERO',
        desc: 'Toca huellas al ritmo musical',
        cat: 'cat_purple_sticker',
        color: 0xb16ef5,
        hi: 0xe2c7ff,
      },
      {
        scene: 'FindCatScene',
        title: '¿DÓNDE ESTÁ?',
        desc: 'Encuentra al gato objetivo rápido',
        cat: 'cat_blue_sticker',
        color: 0x4fc3ff,
        hi: 0xb8ebff,
      },
      {
        scene: 'CatCafeScene',
        title: 'CAT CAFÉ',
        desc: 'Acaricia y alimenta a tus gatos',
        cat: 'cat_pink_sticker',
        color: 0xff6b9e,
        hi: 0xffc4d9,
      },
    ];

    games.forEach((g, idx) => {
      const cy = 195 + idx * 124;
      drawHudPanel(this, GAME_WIDTH / 2, cy, 392, 104, g.color);

      this.add.image(GAME_WIDTH / 2 - 142, cy, g.cat).setScale(0.16);

      this.add
        .text(GAME_WIDTH / 2 - 86, cy - 16, g.title, {
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '23px',
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: '#14244b',
          strokeThickness: 5,
        })
        .setOrigin(0, 0.5);

      this.add
        .text(GAME_WIDTH / 2 - 86, cy + 16, g.desc, {
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '14px',
          color: '#cfe8ff',
        })
        .setOrigin(0, 0.5);

      createGlossyButton(this, {
        x: GAME_WIDTH / 2 + 132,
        y: cy,
        width: 92,
        height: 46,
        label: 'JUGAR',
        fillColor: g.color,
        topHighlight: g.hi,
        fontSize: 17,
        onClick: () => {
          sound.playClick();
          this.scene.start(g.scene);
        },
      });
    });

    createGlossyButton(this, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 66,
      width: 190,
      height: 54,
      label: 'BACK',
      fillColor: 0xff6f96,
      topHighlight: 0xffc7d7,
      fontSize: 25,
      onClick: () => {
        sound.playClick();
        this.scene.start('MenuScene');
      },
    });
  }
}
