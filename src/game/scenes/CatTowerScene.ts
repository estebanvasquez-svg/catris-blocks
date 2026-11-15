import Phaser from 'phaser';
import { CatColor, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { createGlossyButton, drawGridBackground, drawHudPanel } from '../kawaiiArtwork';
import { sound } from '../audio';
import { loadSave, writeSave } from '../storage';
import { getPlayerPoolCats } from './MinigamesScene';

export class CatTowerScene extends Phaser.Scene {
  private pool: CatColor[] = [];
  private towerContainer!: Phaser.GameObjects.Container;
  private pendulumCat!: Phaser.GameObjects.Image;
  private yarnLine!: Phaser.GameObjects.Graphics;
  private currentCatColor: CatColor = 'orange';

  private swingAngle = 0;
  private swingSpeed = 2.4;
  private isDropping = false;
  private isGameOver = false;

  private stackTopY = 670;
  private stackTopX = GAME_WIDTH / 2;
  private towerHeight = 0;
  private score = 0;
  private combo = 0;

  private scoreText!: Phaser.GameObjects.Text;
  private heightText!: Phaser.GameObjects.Text;

  private readonly catSize = 68;

  constructor() {
    super('CatTowerScene');
  }

  create(): void {
    this.pool = getPlayerPoolCats();
    this.swingAngle = 0;
    this.swingSpeed = 2.4;
    this.isDropping = false;
    this.isGameOver = false;
    this.stackTopY = 680;
    this.stackTopX = GAME_WIDTH / 2;
    this.towerHeight = 0;
    this.score = 0;
    this.combo = 0;

    drawGridBackground(this, true);

    // Top HUD
    drawHudPanel(this, 106, 50, 146, 56, 0xff9b35);
    this.scoreText = this.add
      .text(106, 50, 'SCORE: 0', {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffe066',
      })
      .setOrigin(0.5);

    drawHudPanel(this, 256, 50, 120, 56, 0x4fc3ff);
    this.heightText = this.add
      .text(256, 50, 'ALT: 0', {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '18px',
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

    // Tower container + grass/cushion base
    this.towerContainer = this.add.container(0, 0);
    const base = this.add.graphics();
    base.fillStyle(0x5cd65c, 1);
    base.lineStyle(4, 0x1b2447, 1);
    base.fillRoundedRect(GAME_WIDTH / 2 - 90, 712, 180, 32, 16);
    base.strokeRoundedRect(GAME_WIDTH / 2 - 90, 712, 180, 32, 16);
    this.towerContainer.add(base);

    // Base starter cat
    const baseCat = this.pickRandomCat();
    const starter = this.add
      .image(this.stackTopX, this.stackTopY, `cat_${baseCat}_sticker`)
      .setDisplaySize(this.catSize, this.catSize);
    this.towerContainer.add(starter);

    // Swinging yarn & pendulum cat
    this.yarnLine = this.add.graphics();
    this.currentCatColor = this.pickRandomCat();
    this.pendulumCat = this.add
      .image(GAME_WIDTH / 2, 195, `cat_${this.currentCatColor}_sticker`)
      .setDisplaySize(this.catSize, this.catSize);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 26, '¡Toca la pantalla para soltar al gato!', {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#bfe8ff',
        stroke: '#101d3b',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.worldY < 90 || this.isDropping || this.isGameOver) return;
      sound.unlock();
      this.dropCurrentCat();
    });
  }

  private pickRandomCat(): CatColor {
    return this.pool[Math.floor(Math.random() * this.pool.length)];
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver || this.isDropping) return;

    const dt = delta / 1000;
    this.swingAngle += this.swingSpeed * dt;
    const px = GAME_WIDTH / 2 + Math.sin(this.swingAngle) * 145;
    const py = 188 + Math.abs(Math.cos(this.swingAngle)) * 18;

    this.pendulumCat.setPosition(px, py);
    this.pendulumCat.setAngle(Math.sin(this.swingAngle) * 10);

    this.yarnLine.clear();
    this.yarnLine.lineStyle(4, 0xff8bb7, 1);
    this.yarnLine.lineBetween(GAME_WIDTH / 2, 95, px, py - 24);
  }

  private dropCurrentCat(): void {
    this.isDropping = true;
    this.yarnLine.clear();
    const dropX = this.pendulumCat.x;
    const targetScreenY = this.stackTopY - 56 + this.towerContainer.y;

    const dx = Math.abs(dropX - this.stackTopX);
    const hit = dx <= 48;

    if (hit) {
      this.tweens.add({
        targets: this.pendulumCat,
        y: targetScreenY,
        angle: 0,
        duration: 240,
        ease: 'Cubic.easeIn',
        onComplete: () => this.onCatLanded(dropX, dx),
      });
    } else {
      // Missed! Tumble off screen
      sound.playGameOver();
      this.tweens.add({
        targets: this.pendulumCat,
        y: GAME_HEIGHT + 90,
        angle: dropX < this.stackTopX ? -220 : 220,
        duration: 550,
        ease: 'Cubic.easeIn',
        onComplete: () => this.finishGame(),
      });
    }
  }

  private onCatLanded(dropX: number, dx: number): void {
    const isPerfect = dx <= 14;
    if (isPerfect) {
      this.combo++;
      this.score += 100 + this.combo * 25;
      sound.playMeowPop(2);
    } else {
      this.combo = 0;
      this.score += 50;
      sound.playLock();
    }

    this.towerHeight++;
    this.stackTopY -= 56;
    this.stackTopX = isPerfect ? this.stackTopX : dropX;

    // Add landed cat into scrolling tower container
    const landed = this.add
      .image(this.stackTopX, this.stackTopY, `cat_${this.currentCatColor}_sticker`)
      .setDisplaySize(this.catSize, this.catSize);
    this.towerContainer.add(landed);

    // Squash & stretch bounce on landing
    landed.setDisplaySize(this.catSize * 1.18, this.catSize * 0.82);
    this.tweens.add({
      targets: landed,
      displayWidth: this.catSize,
      displayHeight: this.catSize,
      duration: 180,
      ease: 'Back.easeOut',
    });

    if (isPerfect) {
      const worldY = this.stackTopY + this.towerContainer.y;
      const pop = this.add
        .text(this.stackTopX, worldY - 30, `PERFECT! x${this.combo}`, {
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '20px',
          fontStyle: 'bold',
          color: '#ffe066',
          stroke: '#162447',
          strokeThickness: 6,
        })
        .setOrigin(0.5);
      this.tweens.add({
        targets: pop,
        y: '-=36',
        alpha: 0,
        duration: 650,
        onComplete: () => pop.destroy(),
      });
    }

    this.scoreText.setText(`SCORE: ${this.score}`);
    this.heightText.setText(`ALT: ${this.towerHeight}`);

    // Scroll tower down smoothly so top stays around y = 460
    const desiredOffset = Math.max(0, 460 - this.stackTopY);
    if (desiredOffset > this.towerContainer.y) {
      this.tweens.add({
        targets: this.towerContainer,
        y: desiredOffset,
        duration: 240,
        ease: 'Sine.easeOut',
      });
    }

    // Speed up slightly as tower grows
    this.swingSpeed = Math.min(4.8, 2.4 + this.towerHeight * 0.12);
    this.currentCatColor = this.pickRandomCat();
    this.pendulumCat.setTexture(`cat_${this.currentCatColor}_sticker`);
    this.pendulumCat.setDisplaySize(this.catSize, this.catSize);
    this.isDropping = false;
  }

  private finishGame(): void {
    this.isGameOver = true;
    const pawsEarned = Math.max(1, Math.floor(this.towerHeight / 2));
    const save = loadSave();
    save.pawsCurrency += pawsEarned;
    writeSave(save);

    const c = this.add.container(0, 0).setDepth(50);
    c.add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x060d20, 0.78).setInteractive());
    c.add(drawHudPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 340, 320, 0xff9b35));

    c.add(
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 110, 'TORRE CAÍDA!', {
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '32px',
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
          `Altura: ${this.towerHeight} gatos\nScore: ${this.score}\nGanaste: +${pawsEarned} 🐾`,
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
