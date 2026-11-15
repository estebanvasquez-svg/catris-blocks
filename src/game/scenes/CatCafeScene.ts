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

type DesireType = 'fish' | 'yarn' | 'pet';

interface CafeCat {
  color: CatColor;
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  bubble: Phaser.GameObjects.Container | null;
  desire: DesireType | null;
  targetX: number;
  targetY: number;
  waitTimer: number;
  phase: number;
}

const FLOOR_LEFT = 54;
const FLOOR_RIGHT = GAME_WIDTH - 54;
const FLOOR_TOP = 210;
const FLOOR_BOTTOM = 735;

export class CatCafeScene extends Phaser.Scene {
  private cats: CafeCat[] = [];
  private pawsText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private sessionEarned = 0;

  constructor() {
    super('CatCafeScene');
  }

  create(): void {
    this.cats = [];
    this.sessionEarned = 0;

    drawGridBackground(this, false);
    this.drawCafeDecor();

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
      .text(GAME_WIDTH / 2 + 20, 36, 'CAT CAFÉ', {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        color: '#8b4d5d',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    drawHudPanel(this, 18, 66, GAME_WIDTH - 36, 70, 0x7ce2b1);

    const save = loadSave();
    this.pawsText = this.add.text(34, 78, `🐾 ${save.pawsCurrency} (+0)`, {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: '#28a86b',
      fontStyle: 'bold',
    });

    this.statusText = this.add.text(
      34,
      104,
      'Toca los globos 🐟/🧶 o acaricia a los gatitos',
      {
        fontFamily: FONT_FAMILY,
        fontSize: '13px',
        color: '#8b4d5d',
        fontStyle: 'bold',
      },
    );

    // Spawn 7 cats from player collection
    const pool = getPlayerPoolCats();
    const source = pool.length > 0 ? pool : [...CAT_IDS];
    const picked = Phaser.Utils.Array.Shuffle([...source]).slice(0, Math.min(7, source.length));

    picked.forEach((color, idx) => {
      const startX = Phaser.Math.Between(FLOOR_LEFT, FLOOR_RIGHT);
      const startY = Phaser.Math.Between(FLOOR_TOP + 30, FLOOR_BOTTOM - 20);

      const container = this.add.container(startX, startY).setDepth(startY);
      const shadow = this.add.ellipse(0, 32, 62, 16, 0x000000, 0.14);
      const sprite = this.add
        .image(0, 0, `cat_${color}_sticker`)
        .setScale(0.15)
        .setInteractive({ useHandCursor: true });

      container.add([shadow, sprite]);

      const cat: CafeCat = {
        color,
        container,
        sprite,
        bubble: null,
        desire: null,
        targetX: startX,
        targetY: startY,
        waitTimer: 0.6 + idx * 0.5,
        phase: idx * 0.9,
      };

      sprite.on('pointerdown', () => this.onCatInteract(cat));
      sprite.on('pointerover', () => {
        if (this.input.activePointer.isDown && cat.desire === 'pet') {
          this.fulfillDesire(cat);
        }
      });

      this.cats.push(cat);

      // Give first two cats immediate requests so the cafe feels lively right away
      if (idx < 2) {
        this.assignDesire(cat);
      }
    });

    // Periodic request generator
    this.time.addEvent({
      delay: 2400,
      loop: true,
      callback: () => {
        const idle = this.cats.filter((c) => c.desire === null);
        if (idle.length > 0) {
          const chosen = Phaser.Utils.Array.GetRandom(idle);
          this.assignDesire(chosen);
        }
      },
    });
  }

  private drawCafeDecor(): void {
    // Cozy cafe rug & wooden floor strip
    const floor = this.add.graphics();
    floor.fillStyle(0xffe7cf, 0.88);
    floor.fillRoundedRect(18, 152, GAME_WIDTH - 36, GAME_HEIGHT - 172, 24);
    floor.lineStyle(4, 0xf5c49b, 1);
    floor.strokeRoundedRect(18, 152, GAME_WIDTH - 36, GAME_HEIGHT - 172, 24);

    // Cute rug in the middle
    floor.fillStyle(0xffd7e5, 0.9);
    floor.fillRoundedRect(58, 360, GAME_WIDTH - 116, 220, 32);
    floor.lineStyle(3, 0xff9fc2, 0.85);
    floor.strokeRoundedRect(66, 368, GAME_WIDTH - 132, 204, 26);

    // Cafe counter top bar
    floor.fillStyle(0xd99b72, 1);
    floor.fillRoundedRect(34, 162, GAME_WIDTH - 68, 36, 12);
    floor.fillStyle(0xf4c39c, 1);
    floor.fillRoundedRect(38, 165, GAME_WIDTH - 76, 12, 8);
  }

  private assignDesire(cat: CafeCat): void {
    if (cat.desire) return;
    const desires: DesireType[] = ['fish', 'yarn', 'pet'];
    const desire = Phaser.Utils.Array.GetRandom(desires);
    cat.desire = desire;

    const iconMap: Record<DesireType, string> = {
      fish: '🐟',
      yarn: '🧶',
      pet: '💕',
    };

    const bubble = this.add.container(0, -56);
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.98);
    bg.fillRoundedRect(-24, -22, 48, 38, 14);
    bg.lineStyle(2.5, 0xff94b8, 1);
    bg.strokeRoundedRect(-24, -22, 48, 38, 14);
    bg.fillTriangle(-6, 16, 6, 16, 0, 24);

    const txt = this.add
      .text(0, -3, iconMap[desire], { fontSize: '20px' })
      .setOrigin(0.5);

    bubble.add([bg, txt]);
    bubble.setSize(52, 44).setInteractive({ useHandCursor: true });
    bubble.on('pointerdown', () => this.onCatInteract(cat));

    cat.container.add(bubble);
    cat.bubble = bubble;

    bubble.setScale(0.2);
    this.tweens.add({
      targets: bubble,
      scaleX: 1,
      scaleY: 1,
      duration: 240,
      ease: 'Back.easeOut',
    });
  }

  private onCatInteract(cat: CafeCat): void {
    sound.unlock();
    if (cat.desire) {
      this.fulfillDesire(cat);
      return;
    }

    // Friendly purr bounce even when idle
    sound.playMeowNote(520);
    this.statusText.setText(`${CAT_MAP[cat.color].name} está feliz ronroneando ♪`);
    this.tweens.add({
      targets: cat.sprite,
      scaleX: 0.17,
      scaleY: 0.13,
      duration: 120,
      yoyo: true,
    });
  }

  private fulfillDesire(cat: CafeCat): void {
    if (!cat.desire) return;
    const reward = cat.desire === 'pet' ? 3 : 5;
    cat.desire = null;

    if (cat.bubble) {
      cat.bubble.destroy();
      cat.bubble = null;
    }

    sound.playMeowPop(2);
    this.sessionEarned += reward;

    const save = loadSave();
    save.pawsCurrency += reward;
    writeSave(save);

    this.pawsText.setText(`🐾 ${save.pawsCurrency} (+${this.sessionEarned})`);
    this.statusText.setText(`¡${CAT_MAP[cat.color].name} te dio +${reward} 🐾!`);

    // Celebration heart burst
    for (let i = 0; i < 3; i++) {
      const heart = this.add
        .image(
          cat.container.x + Phaser.Math.Between(-18, 18),
          cat.container.y - 34,
          'deco_heart',
        )
        .setScale(0.22)
        .setDepth(900);

      this.tweens.add({
        targets: heart,
        y: heart.y - Phaser.Math.Between(36, 58),
        alpha: 0,
        duration: 650,
        delay: i * 70,
        onComplete: () => heart.destroy(),
      });
    }

    const rewardPop = this.add
      .text(cat.container.x, cat.container.y - 46, `+${reward} 🐾`, {
        fontFamily: FONT_FAMILY,
        fontSize: '18px',
        color: '#28a86b',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(905);

    this.tweens.add({
      targets: rewardPop,
      y: rewardPop.y - 38,
      alpha: 0,
      duration: 750,
      onComplete: () => rewardPop.destroy(),
    });

    this.tweens.add({
      targets: cat.sprite,
      y: -14,
      duration: 150,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  update(time: number, delta: number): void {
    const dt = delta / 1000;

    for (const cat of this.cats) {
      const dx = cat.targetX - cat.container.x;
      const dy = cat.targetY - cat.container.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 4) {
        const step = Math.min(dist, 46 * dt);
        cat.container.x += (dx / dist) * step;
        cat.container.y += (dy / dist) * step;
        cat.sprite.setFlipX(dx < -1);
        cat.sprite.y = -Math.abs(Math.sin(time * 0.01 + cat.phase)) * 6;
      } else {
        cat.sprite.y = 0;
        cat.waitTimer -= dt;
        if (cat.waitTimer <= 0) {
          cat.waitTimer = Phaser.Math.FloatBetween(1.8, 4.2);
          cat.targetX = Phaser.Math.Between(FLOOR_LEFT, FLOOR_RIGHT);
          cat.targetY = Phaser.Math.Between(FLOOR_TOP, FLOOR_BOTTOM);
        }
      }

      cat.container.setDepth(cat.container.y);
    }
  }
}
