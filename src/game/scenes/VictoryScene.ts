import Phaser from 'phaser';
import { CAT_MAP, GAME_HEIGHT, GAME_WIDTH, LEVELS } from '../constants';
import { createGlossyButton, drawGridBackground, drawHudPanel } from '../kawaiiArtwork';
import { sound } from '../audio';

export interface VictorySceneData {
  levelId: number;
  score: number;
  lives: number;
  elapsedSeconds: number;
  stars: number;
}

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  create(data: VictorySceneData): void {
    drawGridBackground(this, false);
    sound.playVictory();

    // Confetti particles
    const confetti = this.add.particles(0, -10, 'particle_confetti', {
      x: { min: 10, max: GAME_WIDTH - 10 },
      speedY: { min: 70, max: 170 },
      speedX: { min: -30, max: 30 },
      rotate: { min: 0, max: 360 },
      scale: { start: 0.25, end: 0.15 },
      tint: [0xff6b8b, 0xffd54f, 0x64e39b, 0x5cc8ff, 0xb983ff],
      lifespan: 5000,
      quantity: 2,
      frequency: 110,
    });
    confetti.setDepth(1);

    // Festive balloons (matching pantallas.jpg bottom-middle)
    const balloons = [
      { x: 46, y: 120, color: 0x6ad65a },
      { x: 38, y: 235, color: 0xb77dff },
      { x: GAME_WIDTH - 46, y: 135, color: 0xff5e73 },
      { x: GAME_WIDTH - 42, y: 245, color: 0xffd447 },
    ];
    balloons.forEach((b, i) => {
      const g = this.add.graphics();
      g.lineStyle(2, 0xcfdcff, 0.8);
      g.lineBetween(b.x, b.y + 30, b.x, b.y + 92);
      g.fillStyle(b.color, 1);
      g.lineStyle(3, 0x1b2447, 1);
      g.fillEllipse(b.x, b.y, 48, 58);
      g.strokeEllipse(b.x, b.y, 48, 58);
      g.fillStyle(0xffffff, 0.38);
      g.fillEllipse(b.x - 10, b.y - 12, 12, 18);

      this.tweens.add({
        targets: g,
        y: -10,
        duration: 1600 + i * 220,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // Curved ribbon banner: STAGE CLEAR! / VICTORY!
    const ribbon = this.add.graphics();
    ribbon.fillStyle(0xff9eb8, 1);
    ribbon.lineStyle(4, 0x261738, 1);
    ribbon.fillRoundedRect(38, 72, GAME_WIDTH - 76, 62, 24);
    ribbon.strokeRoundedRect(38, 72, GAME_WIDTH - 76, 62, 24);

    this.add
      .text(GAME_WIDTH / 2, 103, 'STAGE CLEAR!', {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#ffe875',
        stroke: '#261738',
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 168, 'VICTORY!', {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '46px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#1a2750',
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    // Stars earned
    for (let i = 0; i < 3; i++) {
      const sx = GAME_WIDTH / 2 - 58 + i * 58;
      const star = this.add
        .image(sx, 228, 'deco_star')
        .setScale(i < data.stars ? 0.3375 : 0.2625)
        .setTint(i < data.stars ? 0xffffff : 0x3b4d77);
      if (i < data.stars) {
        this.tweens.add({
          targets: star,
          angle: { from: -8, to: 8 },
          duration: 700,
          yoyo: true,
          repeat: -1,
          delay: i * 140,
        });
      }
    }

    // 3 Celebrating cats (center cat is the level's collected cat!)
    const lvlCfg = LEVELS.find((l) => l.id === data.levelId) ?? LEVELS[0];
    const targetCat = CAT_MAP[lvlCfg.targetCat];
    const leftCat = this.add.image(102, 342, 'cat_purple_sticker').setScale(0.38).setAngle(-6);
    const centerCat = this.add.image(GAME_WIDTH / 2, 332, `cat_${targetCat.id}_sticker`).setScale(0.46);
    const rightCat = this.add.image(GAME_WIDTH - 102, 342, 'cat_blue_sticker').setScale(0.38).setAngle(6);

    this.add
      .text(GAME_WIDTH / 2, 404, `¡Gato ${targetCat.name} desbloqueado!`, {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffe875',
        stroke: '#1a2750',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    // Party hat on center cat
    const hat = this.add.graphics();
    hat.fillStyle(0xffd24c, 1);
    hat.lineStyle(3, 0x261738, 1);
    hat.fillTriangle(GAME_WIDTH / 2 - 22, 268, GAME_WIDTH / 2 + 22, 268, GAME_WIDTH / 2, 224);
    hat.strokeTriangle(GAME_WIDTH / 2 - 22, 268, GAME_WIDTH / 2 + 22, 268, GAME_WIDTH / 2, 224);
    hat.fillStyle(0xff6b8b, 1);
    hat.fillCircle(GAME_WIDTH / 2, 222, 7);

    this.tweens.add({
      targets: [leftCat, centerCat, rightCat, hat],
      y: '-=10',
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Stats card (SCORE, LIVES, TIME)
    drawHudPanel(this, GAME_WIDTH / 2, 472, 386, 102, 0x4ca9ff);

    const mins = Math.floor(data.elapsedSeconds / 60);
    const secs = String(data.elapsedSeconds % 60).padStart(2, '0');
    const timeStr = `${mins}:${secs}`;

    const cols = [
      { label: 'SCORE:', value: data.score.toLocaleString(), x: GAME_WIDTH / 2 - 120 },
      { label: 'LIVES:', value: `${data.lives}`, x: GAME_WIDTH / 2 },
      { label: 'TIME:', value: timeStr, x: GAME_WIDTH / 2 + 120 },
    ];
    cols.forEach((c) => {
      this.add
        .text(c.x, 450, c.label, {
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          color: '#a8d5ff',
        })
        .setOrigin(0.5);
      this.add
        .text(c.x, 488, c.value, {
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '28px',
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: '#111d3d',
          strokeThickness: 5,
        })
        .setOrigin(0.5);
    });

    const hasNext = data.levelId < LEVELS.length;
    const nextId = hasNext ? data.levelId + 1 : 1;

    createGlossyButton(this, {
      x: GAME_WIDTH / 2 - 96,
      y: 610,
      width: 178,
      height: 70,
      label: hasNext ? 'NEXT LEVEL' : 'PLAY AGAIN',
      sublabel: hasNext ? 'Siguiente nivel' : 'Volver a empezar',
      fillColor: 0xffcf33,
      topHighlight: 0xfff5a8,
      fontSize: 20,
      onClick: () => {
        sound.playClick();
        this.scene.start('GameScene', { levelId: nextId });
      },
    });

    createGlossyButton(this, {
      x: GAME_WIDTH / 2 + 96,
      y: 610,
      width: 178,
      height: 70,
      label: 'REPLAY',
      sublabel: 'Rejugar',
      fillColor: 0x5cd65c,
      topHighlight: 0xbef7be,
      fontSize: 22,
      onClick: () => {
        sound.playClick();
        this.scene.start('GameScene', { levelId: data.levelId });
      },
    });

    createGlossyButton(this, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 90,
      width: 180,
      height: 48,
      label: 'LEVELS',
      fillColor: 0x4fc3ff,
      topHighlight: 0xb8ebff,
      fontSize: 20,
      onClick: () => {
        sound.playClick();
        this.scene.start('LevelSelectScene');
      },
    });
  }
}
