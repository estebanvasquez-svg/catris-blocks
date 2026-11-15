import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  CatColor,
  CAT_MAP,
  CAT_IDS,
} from '../constants';

const FONT_FAMILY = 'Fredoka, sans-serif';
import {
  drawGridBackground,
  createGlossyButton,
  drawHudPanel,
} from '../kawaiiArtwork';
import { sound } from '../audio';
import { loadSave, writeSave } from '../storage';
import { getPlayerPoolCats } from './MinigamesScene';

interface CrowdCat {
  sprite: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  baseScale: number;
  phase: number;
  isTarget: boolean;
}

const ARENA_TOP = 215;
const ARENA_BOTTOM = 768;
const ARENA_LEFT = 32;
const ARENA_RIGHT = GAME_WIDTH - 32;

export class FindCatScene extends Phaser.Scene {
  private pool: CatColor[] = [];
  private crowd: CrowdCat[] = [];
  private targetColor: CatColor = 'orange';

  private score = 0;
  private streak = 0;
  private timeLeft = 20;
  private gameOver = false;
  private roundLocked = false;
  private pawsAwarded = 0;

  private targetIcon!: Phaser.GameObjects.Image;
  private targetNameText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private streakText!: Phaser.GameObjects.Text;

  constructor() {
    super('FindCatScene');
  }

  create(): void {
    this.score = 0;
    this.streak = 0;
    this.timeLeft = 20;
    this.gameOver = false;
    this.roundLocked = false;
    this.pawsAwarded = 0;
    this.crowd = [];

    const playerCats = getPlayerPoolCats();
    this.pool = playerCats.length >= 6 ? playerCats : [...CAT_IDS];

    drawGridBackground(this, false);

    // Header
    createGlossyButton(this, {
      x: 58,
      y: 38,
      width: 82,
      height: 36,
      label: '← SALIR',
      fillColor: 0xff7da6,
      topHighlight: 0xffc4d8,
      fontSize: 13,
      onClick: () => {
        sound.playClick();
        this.scene.start('MinigamesScene');
      },
    });

    this.add
      .text(GAME_WIDTH / 2 + 24, 38, '¿DÓNDE ESTÁ?', {
        fontFamily: FONT_FAMILY,
        fontSize: '21px',
        color: '#8b4d5d',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Stats & Target Card
    drawHudPanel(this, 18, 66, GAME_WIDTH - 36, 126, 0xffb7d0);

    this.timerText = this.add.text(34, 80, '⏱ 20s', {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: '#e84a76',
      fontStyle: 'bold',
    });

    this.scoreText = this.add
      .text(GAME_WIDTH - 34, 80, 'Encontrados: 0', {
        fontFamily: FONT_FAMILY,
        fontSize: '16px',
        color: '#8b4d5d',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);

    this.streakText = this.add
      .text(GAME_WIDTH - 34, 104, 'Racha: 0', {
        fontFamily: FONT_FAMILY,
        fontSize: '13px',
        color: '#b87088',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);

    // Target badge
    const badgeBg = this.add.graphics();
    badgeBg.fillStyle(0xfff1f6, 1);
    badgeBg.fillRoundedRect(34, 110, 74, 70, 14);
    badgeBg.lineStyle(3, 0xff8bb4, 1);
    badgeBg.strokeRoundedRect(34, 110, 74, 70, 14);

    this.targetIcon = this.add.image(71, 145, 'cat_orange_sticker').setDisplaySize(58, 58);

    this.add.text(120, 118, 'BUSCA A ESTE GATO:', {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#b87088',
      fontStyle: 'bold',
    });

    this.targetNameText = this.add.text(120, 138, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '22px',
      color: '#8b4d5d',
      fontStyle: 'bold',
    });

    // Arena panel
    drawHudPanel(this, 16, 200, GAME_WIDTH - 32, ARENA_BOTTOM - 186, 0xe8c7ff);

    this.spawnRound();
  }

  private spawnRound(): void {
    for (const c of this.crowd) {
      c.sprite.destroy();
    }
    this.crowd = [];
    this.roundLocked = false;

    const shuffled = Phaser.Utils.Array.Shuffle([...this.pool]);
    this.targetColor = shuffled[0];

    this.targetIcon.setTexture(`cat_${this.targetColor}_sticker`).setDisplaySize(58, 58);
    this.targetNameText.setText(CAT_MAP[this.targetColor].name);

    const distractorCount = Math.min(28, 10 + this.score * 2);
    const totalCount = distractorCount + 1;
    const speedBase = Math.min(115, 24 + this.score * 5);
    const targetScale = this.score >= 8 ? 0.115 : 0.132;

    const decoysPool = shuffled.slice(1);
    if (decoysPool.length === 0) decoysPool.push('orange');

    for (let i = 0; i < totalCount; i++) {
      const isTarget = i === totalCount - 1;
      const color = isTarget
        ? this.targetColor
        : decoysPool[i % decoysPool.length];

      const x = Phaser.Math.Between(ARENA_LEFT + 14, ARENA_RIGHT - 14);
      const y = Phaser.Math.Between(ARENA_TOP + 14, ARENA_BOTTOM - 14);

      const sprite = this.add
        .image(x, y, `cat_${color}_sticker`)
        .setScale(targetScale)
        .setInteractive({ useHandCursor: true })
        .setDepth(isTarget ? 12 : 10);

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const spd = Phaser.Math.FloatBetween(speedBase * 0.65, speedBase * 1.15);

      const entry: CrowdCat = {
        sprite,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        baseScale: targetScale,
        phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
        isTarget,
      };

      sprite.on('pointerdown', () => this.onCatTapped(entry));
      this.crowd.push(entry);
    }
  }

  private onCatTapped(cat: CrowdCat): void {
    if (this.gameOver || this.roundLocked) return;
    sound.unlock();

    if (cat.isTarget) {
      this.roundLocked = true;
      this.score += 1;
      this.streak += 1;
      const bonusSec = this.streak >= 3 ? 3 : 2;
      this.timeLeft = Math.min(30, this.timeLeft + bonusSec);

      sound.playMeowPop(Math.min(4, this.streak));
      this.scoreText.setText(`Encontrados: ${this.score}`);
      this.streakText.setText(`Racha: ${this.streak}`);

      this.showFloatingMsg(cat.sprite.x, cat.sprite.y - 24, `+${bonusSec}s!`, '#28a86b');

      this.tweens.add({
        targets: cat.sprite,
        scaleX: cat.baseScale * 1.45,
        scaleY: cat.baseScale * 1.45,
        duration: 180,
        yoyo: true,
        ease: 'Back.easeOut',
        onComplete: () => {
          if (!this.gameOver) this.spawnRound();
        },
      });
    } else {
      this.streak = 0;
      this.timeLeft = Math.max(0, this.timeLeft - 2);
      sound.playGameOver();
      this.streakText.setText('Racha: 0');
      this.showFloatingMsg(cat.sprite.x, cat.sprite.y - 20, '-2s', '#e84a76');
      this.tweens.add({
        targets: cat.sprite,
        angle: { from: -16, to: 16 },
        duration: 70,
        yoyo: true,
        repeat: 2,
        onComplete: () => cat.sprite.setAngle(0),
      });
    }
  }

  private showFloatingMsg(x: number, y: number, text: string, color: string): void {
    const label = this.add
      .text(x, y, text, {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        color,
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(50);

    this.tweens.add({
      targets: label,
      y: y - 34,
      alpha: 0,
      duration: 600,
      onComplete: () => label.destroy(),
    });
  }

  update(time: number, delta: number): void {
    if (this.gameOver) return;

    const dt = delta / 1000;
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    this.timerText.setText(`⏱ ${Math.ceil(this.timeLeft)}s`);

    for (const c of this.crowd) {
      if (this.roundLocked && c.isTarget) continue;

      c.sprite.x += c.vx * dt;
      c.sprite.y += c.vy * dt;

      if (c.sprite.x < ARENA_LEFT) {
        c.sprite.x = ARENA_LEFT;
        c.vx = Math.abs(c.vx);
      } else if (c.sprite.x > ARENA_RIGHT) {
        c.sprite.x = ARENA_RIGHT;
        c.vx = -Math.abs(c.vx);
      }

      if (c.sprite.y < ARENA_TOP) {
        c.sprite.y = ARENA_TOP;
        c.vy = Math.abs(c.vy);
      } else if (c.sprite.y > ARENA_BOTTOM) {
        c.sprite.y = ARENA_BOTTOM;
        c.vy = -Math.abs(c.vy);
      }

      const wobble = Math.sin(time * 0.008 + c.phase) * 0.08;
      c.sprite.setScale(c.baseScale * (1 + wobble), c.baseScale * (1 - wobble * 0.6));
    }

    if (this.timeLeft <= 0) {
      this.endGame();
    }
  }

  private endGame(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    sound.playVictory();

    this.pawsAwarded = this.score * 6;
    if (this.pawsAwarded > 0) {
      const save = loadSave();
      save.pawsCurrency += this.pawsAwarded;
      writeSave(save);
    }

    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x3b1e35, 0.55)
      .setDepth(90)
      .setInteractive();

    drawHudPanel(this, 42, 235, GAME_WIDTH - 84, 300, 0xff8bb4).setDepth(91);

    this.add
      .text(GAME_WIDTH / 2, 275, '¡TIEMPO AGOTADO!', {
        fontFamily: FONT_FAMILY,
        fontSize: '26px',
        color: '#8b4d5d',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(92);

    this.add
      .text(
        GAME_WIDTH / 2,
        345,
        `Gatos encontrados: ${this.score}\nRecompensa: +${this.pawsAwarded} 🐾`,
        {
          fontFamily: FONT_FAMILY,
          fontSize: '20px',
          color: '#a36478',
          fontStyle: 'bold',
          align: 'center',
          lineSpacing: 10,
        },
      )
      .setOrigin(0.5)
      .setDepth(92);

    createGlossyButton(this, {
      x: GAME_WIDTH / 2,
      y: 432,
      width: 210,
      height: 50,
      label: 'JUGAR DE NUEVO',
      fillColor: 0x56d896,
      topHighlight: 0xaaf5cd,
      fontSize: 18,
      onClick: () => {
        sound.playClick();
        this.scene.restart();
      },
    }).setDepth(92);

    createGlossyButton(this, {
      x: GAME_WIDTH / 2,
      y: 495,
      width: 210,
      height: 44,
      label: 'VOLVER AL HUB',
      fillColor: 0xb16ef5,
      topHighlight: 0xe2c7ff,
      fontSize: 16,
      onClick: () => {
        sound.playClick();
        this.scene.start('MinigamesScene');
      },
    }).setDepth(92);
  }
}
