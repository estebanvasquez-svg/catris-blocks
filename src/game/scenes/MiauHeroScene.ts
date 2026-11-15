import Phaser from 'phaser';
import { CAT_HEX, CatColor, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { createGlossyButton, drawGridBackground, drawHudPanel } from '../kawaiiArtwork';
import { sound } from '../audio';
import { loadSave, writeSave } from '../storage';
import { getPlayerPoolCats } from './MinigamesScene';

interface FallingNote {
  lane: number;
  sprite: Phaser.GameObjects.Image;
  hit: boolean;
}

export class MiauHeroScene extends Phaser.Scene {
  private bandCats: CatColor[] = [];
  private bandSprites: Phaser.GameObjects.Image[] = [];
  private notes: FallingNote[] = [];
  private readonly laneX = [74, 174, 274, 374];
  private readonly laneFreqs = [523.25, 587.33, 659.25, 783.99];
  private readonly targetY = 660;

  private score = 0;
  private combo = 0;
  private maxCombo = 0;
  private timeLeft = 26;
  private isFinished = false;

  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private spawnTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('MiauHeroScene');
  }

  create(): void {
    const pool = [...getPlayerPoolCats()];
    Phaser.Utils.Array.Shuffle(pool);
    this.bandCats = pool.slice(0, 4);
    this.bandSprites = [];
    this.notes = [];
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.timeLeft = 26;
    this.isFinished = false;

    drawGridBackground(this, true);

    // Top HUD
    drawHudPanel(this, 108, 50, 150, 56, 0xb16ef5);
    this.scoreText = this.add
      .text(108, 50, 'SCORE: 0', {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffe066',
      })
      .setOrigin(0.5);

    drawHudPanel(this, 256, 50, 118, 56, 0x4fc3ff);
    this.timerText = this.add
      .text(256, 50, '26s', {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    createGlossyButton(this, {
      x: 382,
      y: 50,
      width: 96,
      height: 46,
      label: 'SALIR',
      fillColor: 0xff6f96,
      topHighlight: 0xffc7d7,
      fontSize: 17,
      onClick: () => {
        sound.playClick();
        this.scene.start('MinigamesScene');
      },
    });

    // Draw 4 lanes + hit circles + 4 singing cats
    const lanesG = this.add.graphics();
    this.laneX.forEach((lx, i) => {
      const catColor = CAT_HEX[this.bandCats[i]];
      lanesG.fillStyle(0x0c1b3e, 0.55);
      lanesG.fillRoundedRect(lx - 40, 105, 80, 620, 18);
      lanesG.lineStyle(3, catColor, 0.75);
      lanesG.strokeRoundedRect(lx - 40, 105, 80, 620, 18);

      // Hit target ring
      lanesG.lineStyle(4, 0xffffff, 0.65);
      lanesG.strokeCircle(lx, this.targetY, 34);

      const catSprite = this.add
        .image(lx, this.targetY + 54, `cat_${this.bandCats[i]}_sticker`)
        .setDisplaySize(72, 72)
        .setInteractive({ useHandCursor: true });
      this.bandSprites.push(catSprite);

      // Whole lane tappable for fast mobile play
      const laneHit = this.add
        .rectangle(lx, 440, 86, 590, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      laneHit.on('pointerdown', () => this.hitLane(i));
    });

    // Keyboard shortcuts D, F, J, K
    const kb = this.input.keyboard;
    kb?.on('keydown-D', () => this.hitLane(0));
    kb?.on('keydown-F', () => this.hitLane(1));
    kb?.on('keydown-J', () => this.hitLane(2));
    kb?.on('keydown-K', () => this.hitLane(3));

    this.spawnTimer = this.time.addEvent({
      delay: 460,
      loop: true,
      callback: () => {
        if (this.isFinished || this.timeLeft <= 2) return;
        const lane = Math.floor(Math.random() * 4);
        const paw = this.add
          .image(this.laneX[lane], 118, 'deco_paw')
          .setScale(0.36)
          .setTint(CAT_HEX[this.bandCats[lane]]);
        this.notes.push({ lane, sprite: paw, hit: false });
      },
    });

    this.time.addEvent({
      delay: 1000,
      repeat: 25,
      callback: () => {
        if (this.isFinished) return;
        this.timeLeft = Math.max(0, this.timeLeft - 1);
        this.timerText.setText(`${this.timeLeft}s`);
        if (this.timeLeft === 0) {
          this.spawnTimer?.remove();
          this.finishSong();
        }
      },
    });
  }

  update(_time: number, delta: number): void {
    if (this.isFinished) return;
    const speed = 290 * (delta / 1000);

    for (let i = this.notes.length - 1; i >= 0; i--) {
      const n = this.notes[i];
      if (n.hit) continue;
      n.sprite.y += speed;
      if (n.sprite.y > this.targetY + 75) {
        n.sprite.destroy();
        this.notes.splice(i, 1);
        this.combo = 0;
      }
    }
  }

  private hitLane(lane: number): void {
    if (this.isFinished) return;
    sound.unlock();

    const cat = this.bandSprites[lane];
    this.tweens.add({
      targets: cat,
      y: this.targetY + 42,
      scaleX: cat.scaleX * 1.12,
      scaleY: cat.scaleY * 1.12,
      duration: 85,
      yoyo: true,
    });

    // Find closest note in this lane
    let bestIdx = -1;
    let bestDist = 999;
    this.notes.forEach((n, idx) => {
      if (n.lane === lane && !n.hit) {
        const d = Math.abs(n.sprite.y - this.targetY);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = idx;
        }
      }
    });

    if (bestIdx !== -1 && bestDist <= 62) {
      const note = this.notes[bestIdx];
      note.hit = true;
      note.sprite.destroy();
      this.notes.splice(bestIdx, 1);

      const isPerfect = bestDist <= 28;
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.score += (isPerfect ? 100 : 50) + this.combo * 5;
      this.scoreText.setText(`SCORE: ${this.score}`);

      sound.playMeowNote(this.laneFreqs[lane]);

      const msg = this.add
        .text(this.laneX[lane], this.targetY - 26, isPerfect ? '¡MIAU!' : 'GOOD', {
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          color: isPerfect ? '#ffe066' : '#7be7ff',
          stroke: '#101d3b',
          strokeThickness: 5,
        })
        .setOrigin(0.5);
      this.tweens.add({
        targets: msg,
        y: '-=34',
        alpha: 0,
        duration: 420,
        onComplete: () => msg.destroy(),
      });
    }
  }

  private finishSong(): void {
    this.isFinished = true;
    sound.playVictory();
    const pawsEarned = Math.max(1, Math.floor(this.score / 500));
    const save = loadSave();
    save.pawsCurrency += pawsEarned;
    writeSave(save);

    const c = this.add.container(0, 0).setDepth(50);
    c.add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x060d20, 0.78).setInteractive());
    c.add(drawHudPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 340, 320, 0xb16ef5));

    c.add(
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 110, '¡CONCIERTO MIAU!', {
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '30px',
          fontStyle: 'bold',
          color: '#ffe066',
          stroke: '#162447',
          strokeThickness: 7,
        })
        .setOrigin(0.5)
    );

    c.add(
      this.add
        .text(
          GAME_WIDTH / 2,
          GAME_HEIGHT / 2 - 50,
          `Score: ${this.score}\nCombo Máx: ${this.maxCombo}\nGanaste: +${pawsEarned} 🐾`,
          {
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '20px',
            align: 'center',
            color: '#ffffff',
          }
        )
        .setOrigin(0.5)
    );

    c.add(
      createGlossyButton(this, {
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2 + 44,
        width: 210,
        height: 52,
        label: 'REJUGAR',
        fillColor: 0x5cd65c,
        topHighlight: 0xbef7be,
        fontSize: 22,
        onClick: () => {
          sound.playClick();
          this.scene.restart();
        },
      })
    );

    c.add(
      createGlossyButton(this, {
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2 + 110,
        width: 210,
        height: 48,
        label: 'MINIGAMES',
        fillColor: 0x4fc3ff,
        topHighlight: 0xb8ebff,
        fontSize: 20,
        onClick: () => {
          sound.playClick();
          this.scene.start('MinigamesScene');
        },
      })
    );
  }
}
