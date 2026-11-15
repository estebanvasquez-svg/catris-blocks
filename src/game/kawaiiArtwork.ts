import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SHOP_THEMES } from './constants';
import { loadSave } from './storage';

export function getActiveTheme() {
  const save = loadSave();
  return SHOP_THEMES.find((t) => t.id === save.activeTheme) ?? SHOP_THEMES[0];
}

export function drawGridBackground(
  scene: Phaser.Scene,
  withDecorations = true
): Phaser.GameObjects.Container {
  const theme = getActiveTheme();
  const container = scene.add.container(0, 0);

  const bg = scene.add.graphics();
  bg.fillStyle(theme.bgColor, 1);
  bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Subtle square grid matching idea/pantallas.jpg & idea/partida.jpg
  bg.lineStyle(1, theme.gridColor, 0.7);
  const step = 32;
  for (let x = 0; x <= GAME_WIDTH; x += step) {
    bg.lineBetween(x, 0, x, GAME_HEIGHT);
  }
  for (let y = 0; y <= GAME_HEIGHT; y += step) {
    bg.lineBetween(0, y, GAME_WIDTH, y);
  }
  container.add(bg);

  if (withDecorations) {
    const decoPositions = [
      { key: 'deco_star', x: 36, y: 74, scale: 0.175, alpha: 0.7 },
      { key: 'deco_heart', x: 412, y: 92, scale: 0.1875, alpha: 0.75 },
      { key: 'deco_paw', x: 48, y: 210, scale: 0.1625, alpha: 0.55 },
      { key: 'deco_sparkle', x: 405, y: 245, scale: 0.2, alpha: 0.7 },
      { key: 'deco_heart', x: 34, y: 540, scale: 0.1625, alpha: 0.6 },
      { key: 'deco_paw', x: 418, y: 590, scale: 0.175, alpha: 0.55 },
      { key: 'deco_star', x: 398, y: 745, scale: 0.1625, alpha: 0.7 },
      { key: 'deco_sparkle', x: 52, y: 735, scale: 0.175, alpha: 0.6 },
    ];
    decoPositions.forEach((d, idx) => {
      const sprite = scene.add.image(d.x, d.y, d.key).setScale(d.scale).setAlpha(d.alpha);
      container.add(sprite);
      scene.tweens.add({
        targets: sprite,
        y: d.y - 6,
        alpha: d.alpha * 0.65,
        duration: 1800 + idx * 210,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  return container;
}

export function createCatrisLogo(
  scene: Phaser.Scene,
  x: number,
  y: number,
  scale = 1
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y).setScale(scale);

  // Giant cat ears behind the logo (matching pantallas.jpg)
  const ears = scene.add.graphics();
  // Left ear
  ears.fillStyle(0xffffff, 1);
  ears.fillTriangle(-112, -16, -98, -74, -48, -34);
  ears.lineStyle(5, 0x2a183b, 1);
  ears.strokeTriangle(-112, -16, -98, -74, -48, -34);
  ears.fillStyle(0xff8eb5, 1);
  ears.fillTriangle(-100, -24, -92, -58, -58, -34);

  // Right ear
  ears.fillStyle(0xffffff, 1);
  ears.fillTriangle(112, -16, 98, -74, 48, -34);
  ears.lineStyle(5, 0x2a183b, 1);
  ears.strokeTriangle(112, -16, 98, -74, 48, -34);
  ears.fillStyle(0x9b82f3, 1);
  ears.fillTriangle(100, -24, 92, -58, 58, -34);
  container.add(ears);

  // Rainbow letters C-A-T-R-I-S
  const letters = ['C', 'A', 'T', 'R', 'I', 'S'];
  const colors = ['#ff6b8b', '#ffd54f', '#64e39b', '#5cc8ff', '#ff9b42', '#b983ff'];
  const spacing = 44;
  const startX = -((letters.length - 1) * spacing) / 2;

  letters.forEach((ch, idx) => {
    const lx = startX + idx * spacing;
    const ly = idx % 2 === 0 ? -4 : 2;
    const txt = scene.add
      .text(lx, ly, ch, {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '58px',
        fontStyle: 'bold',
        color: colors[idx],
        stroke: '#261738',
        strokeThickness: 12,
        shadow: {
          offsetX: 0,
          offsetY: 4,
          color: '#ffffff',
          blur: 0,
          stroke: true,
          fill: false,
        },
      })
      .setOrigin(0.5);
    container.add(txt);
  });

  const subtitle = scene.add
    .text(0, 44, 'Kawaii Tetris!', {
      fontFamily: 'Fredoka, sans-serif',
      fontSize: '23px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#162954',
      strokeThickness: 6,
    })
    .setOrigin(0.5);
  container.add(subtitle);

  return container;
}

export interface PillButtonOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  sublabel?: string;
  fillColor: number;
  topHighlight: number;
  borderColor?: number;
  textColor?: string;
  fontSize?: number;
  pawIcon?: boolean;
  onClick: () => void;
}

export function createGlossyButton(
  scene: Phaser.Scene,
  opts: PillButtonOptions
): Phaser.GameObjects.Container {
  const {
    x,
    y,
    width,
    height,
    label,
    sublabel,
    fillColor,
    topHighlight,
    borderColor = 0x1b2447,
    textColor = '#ffffff',
    fontSize = 26,
    pawIcon = false,
    onClick,
  } = opts;

  const container = scene.add.container(x, y);
  const g = scene.add.graphics();
  const r = height / 2;

  // Drop shadow
  g.fillStyle(0x0a132c, 0.55);
  g.fillRoundedRect(-width / 2, -height / 2 + 5, width, height, r);

  // Main pill body
  g.fillStyle(fillColor, 1);
  g.fillRoundedRect(-width / 2, -height / 2, width, height, r);

  // Top glossy sheen
  g.fillStyle(topHighlight, 0.45);
  g.fillRoundedRect(-width / 2 + 6, -height / 2 + 4, width - 12, height * 0.44, r * 0.7);

  // Crisp dark outline
  g.lineStyle(4, borderColor, 1);
  g.strokeRoundedRect(-width / 2, -height / 2, width, height, r);
  container.add(g);

  if (pawIcon) {
    const paw = scene.add.image(-width * 0.27, 0, 'deco_paw').setScale(0.1875);
    container.add(paw);
  }

  const labelY = sublabel ? -7 : 0;
  const txt = scene.add
    .text(pawIcon ? 14 : 0, labelY, label, {
      fontFamily: 'Fredoka, sans-serif',
      fontSize: `${fontSize}px`,
      fontStyle: 'bold',
      color: textColor,
      stroke: '#1c2445',
      strokeThickness: 6,
    })
    .setOrigin(0.5);
  container.add(txt);

  if (sublabel) {
    const sub = scene.add
      .text(0, 14, sublabel, {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#fff6d6',
        stroke: '#1c2445',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    container.add(sub);
  }

  const hit = scene.add
    .rectangle(0, 0, width, height, 0x000000, 0)
    .setInteractive({ useHandCursor: true });
  container.add(hit);

  hit.on('pointerdown', () => {
    scene.tweens.add({
      targets: container,
      scaleX: 0.94,
      scaleY: 0.94,
      duration: 70,
      yoyo: true,
      onComplete: () => onClick(),
    });
  });

  return container;
}

export function drawHudPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  borderColor = 0x3b7be0
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(0x0d1c40, 0.86);
  g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14);
  g.lineStyle(3, borderColor, 0.95);
  g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 14);
  return g;
}

export function drawPawBadge(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
  locked = false
): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const outline = 0x1b2342;
  const fill = locked ? 0x5c6882 : color;

  // Main pad
  g.fillStyle(fill, 1);
  g.lineStyle(3.5, outline, 1);
  g.fillEllipse(0, 8, 44, 34);
  g.strokeEllipse(0, 8, 44, 34);

  // 4 toe beans
  const toes = [
    { tx: -21, ty: -10, r: 9 },
    { tx: -7, ty: -20, r: 9.5 },
    { tx: 8, ty: -20, r: 9.5 },
    { tx: 21, ty: -10, r: 9 },
  ];
  toes.forEach((t) => {
    g.fillStyle(fill, 1);
    g.fillCircle(t.tx, t.ty, t.r);
    g.strokeCircle(t.tx, t.ty, t.r);
  });

  c.add(g);
  return c;
}

export function drawYarnBadge(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
  locked = false
): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const fill = locked ? 0x5c6882 : color;
  const outline = 0x1b2342;

  g.fillStyle(fill, 1);
  g.lineStyle(3.5, outline, 1);
  g.fillCircle(0, 0, 27);
  g.strokeCircle(0, 0, 27);

  // Yarn swirl lines
  g.lineStyle(2.5, outline, 0.55);
  g.beginPath();
  g.arc(-6, -4, 18, -0.6, 1.4);
  g.strokePath();
  g.beginPath();
  g.arc(8, 6, 16, 2.2, 4.2);
  g.strokePath();

  // Loose yarn tail
  g.lineStyle(4, fill, 1);
  g.lineBetween(18, 18, 34, 24);
  g.lineStyle(2, outline, 1);
  g.lineBetween(18, 20, 34, 26);

  c.add(g);
  return c;
}

export function drawPadlock(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.lineStyle(3.5, 0x261a10, 1);
  g.strokeCircle(0, -6, 7);
  g.fillStyle(0xffc93c, 1);
  g.fillRoundedRect(-10, -2, 20, 16, 4);
  g.strokeRoundedRect(-10, -2, 20, 16, 4);
  g.fillStyle(0x261a10, 1);
  g.fillCircle(0, 5, 2.5);
  c.add(g);
  return c;
}
