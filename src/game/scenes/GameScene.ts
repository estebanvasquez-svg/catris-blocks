import Phaser from 'phaser';
import {
  BOARD_COLS,
  BOARD_ROWS,
  CAT_HEX,
  CatColor,
  GAME_HEIGHT,
  GAME_WIDTH,
  LEVELS,
  LevelConfig,
  TETROMINOES,
  TETROMINO_TYPES,
  TetrominoType,
} from '../constants';
import {
  createGlossyButton,
  drawGridBackground,
  drawHudPanel,
  getActiveTheme,
} from '../kawaiiArtwork';
import { sound } from '../audio';
import { loadSave, writeSave } from '../storage';

interface ActivePiece {
  type: TetrominoType;
  color: CatColor;
  matrix: number[][];
  row: number;
  col: number;
}

export interface GameSceneData {
  levelId?: number;
}

export class GameScene extends Phaser.Scene {
  private levelConfig!: LevelConfig;
  private grid: (CatColor | null)[][] = [];
  private activePiece: ActivePiece | null = null;
  private nextType: TetrominoType = 'T';
  private holdType: TetrominoType | null = null;
  private canHold = true;
  private bag: TetrominoType[] = [];

  private score = 0;
  private linesCleared = 0;
  private lives = 3;
  private startTimeMs = 0;
  private dropAccumulator = 0;
  private isPaused = false;
  private isGameOver = false;
  private isClearing = false;

  // Board geometry
  private readonly cellSize = 36;
  private readonly boardX = 22;
  private readonly boardY = 116;

  // Graphics layers
  private boardContainer!: Phaser.GameObjects.Container;
  private trailGraphics!: Phaser.GameObjects.Graphics;
  private ghostGraphics!: Phaser.GameObjects.Graphics;
  private cellsLayer!: Phaser.GameObjects.Container;
  private activeLayer!: Phaser.GameObjects.Container;
  private nextPreviewLayer!: Phaser.GameObjects.Container;
  private holdPreviewLayer!: Phaser.GameObjects.Container;
  private mascotCat!: Phaser.GameObjects.Image;
  private comboCount = 0;

  // HUD text
  private scoreText!: Phaser.GameObjects.Text;
  private linesText!: Phaser.GameObjects.Text;

  // Overlay container
  private overlayContainer: Phaser.GameObjects.Container | null = null;

  // Touch gesture tracking
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartTime = 0;
  private lastStepX = 0;
  private lastStepY = 0;
  private isBoardDragging = false;

  constructor() {
    super('GameScene');
  }

  init(data?: GameSceneData): void {
    const id = data?.levelId ?? 1;
    this.levelConfig = LEVELS.find((l) => l.id === id) ?? LEVELS[0];
  }

  create(): void {
    this.resetState();
    drawGridBackground(this, true);
    this.createTopHud();
    this.createBoardFrame();
    this.createSidePanels();
    this.createTouchControls();
    this.setupKeyboard();
    this.setupBoardGestures();

    this.nextType = this.drawFromBag();
    this.spawnPiece();
    this.renderAll();

    // Pause automatically if app goes to background (mobile lifecycle best practice)
    this.game.events.on(Phaser.Core.Events.BLUR, () => {
      if (!this.isPaused && !this.isGameOver) {
        this.togglePause(true);
      }
    });
  }

  private resetState(): void {
    this.grid = Array.from({ length: BOARD_ROWS }, () =>
      Array<CatColor | null>(BOARD_COLS).fill(null)
    );
    this.bag = [];
    this.activePiece = null;
    this.holdType = null;
    this.canHold = true;
    this.score = 0;
    this.linesCleared = 0;
    this.lives = 3;
    this.startTimeMs = this.time.now;
    this.dropAccumulator = 0;
    this.isPaused = false;
    this.isGameOver = false;
    this.isClearing = false;
    this.comboCount = 0;
    this.overlayContainer = null;
  }

  private createTopHud(): void {
    // 3 compact HUD boxes + Pause button at top
    drawHudPanel(this, 82, 54, 118, 66, 0x3b7be0);
    this.add
      .text(82, 34, 'SCORE', {
        fontFamily: 'Silkscreen, Fredoka, sans-serif',
        fontSize: '13px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.scoreText = this.add
      .text(82, 62, '0', {
        fontFamily: 'Silkscreen, Fredoka, sans-serif',
        fontSize: '20px',
        color: '#ffd84d',
      })
      .setOrigin(0.5);

    drawHudPanel(this, 198, 54, 96, 66, 0x3b7be0);
    this.add
      .text(198, 34, 'LEVEL', {
        fontFamily: 'Silkscreen, Fredoka, sans-serif',
        fontSize: '13px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.add
      .text(198, 62, String(this.levelConfig.id).padStart(2, '0'), {
        fontFamily: 'Silkscreen, Fredoka, sans-serif',
        fontSize: '20px',
        color: '#ffd84d',
      })
      .setOrigin(0.5);

    drawHudPanel(this, 310, 54, 110, 66, 0x3b7be0);
    this.add
      .text(310, 34, 'LINES', {
        fontFamily: 'Silkscreen, Fredoka, sans-serif',
        fontSize: '13px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.linesText = this.add
      .text(310, 62, `0/${this.levelConfig.targetLines}`, {
        fontFamily: 'Silkscreen, Fredoka, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    createGlossyButton(this, {
      x: 404,
      y: 54,
      width: 56,
      height: 54,
      label: 'II',
      fillColor: 0x4fc3ff,
      topHighlight: 0xb8ebff,
      fontSize: 22,
      onClick: () => {
        sound.playClick();
        this.togglePause();
      },
    });
  }

  private createBoardFrame(): void {
    const theme = getActiveTheme();
    const bw = BOARD_COLS * this.cellSize;
    const bh = BOARD_ROWS * this.cellSize;

    const frame = this.add.graphics();
    // Dark board interior
    frame.fillStyle(0x0b1736, 0.92);
    frame.fillRoundedRect(this.boardX - 4, this.boardY - 4, bw + 8, bh + 8, 16);

    // Subtle internal grid (matching partida.jpg)
    frame.lineStyle(1, theme.gridColor, 0.55);
    for (let c = 1; c < BOARD_COLS; c++) {
      const gx = this.boardX + c * this.cellSize;
      frame.lineBetween(gx, this.boardY, gx, this.boardY + bh);
    }
    for (let r = 1; r < BOARD_ROWS; r++) {
      const gy = this.boardY + r * this.cellSize;
      frame.lineBetween(this.boardX, gy, this.boardX + bw, gy);
    }

    // Thick rounded sky-blue border
    frame.lineStyle(7, theme.frameColor, 1);
    frame.strokeRoundedRect(this.boardX - 4, this.boardY - 4, bw + 8, bh + 8, 16);

    this.boardContainer = this.add.container(0, 0);
    this.trailGraphics = this.add.graphics();
    this.ghostGraphics = this.add.graphics();
    this.cellsLayer = this.add.container(0, 0);
    this.activeLayer = this.add.container(0, 0);
    this.boardContainer.add([this.trailGraphics, this.ghostGraphics, this.cellsLayer, this.activeLayer]);
  }

  private createSidePanels(): void {
    const rx = 378;

    // NEXT box (matching partida.jpg right side)
    this.add
      .text(rx, 142, 'NEXT', {
        fontFamily: 'Silkscreen, Fredoka, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
        stroke: '#101d3b',
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    drawHudPanel(this, rx, 214, 108, 108, 0x52b6ff);
    this.nextPreviewLayer = this.add.container(rx, 214);

    // HOLD box (tappable!)
    this.add
      .text(rx, 302, 'HOLD', {
        fontFamily: 'Silkscreen, Fredoka, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
        stroke: '#101d3b',
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    drawHudPanel(this, rx, 374, 108, 108, 0x52b6ff);
    this.holdPreviewLayer = this.add.container(rx, 374);

    const holdHit = this.add
      .rectangle(rx, 374, 108, 108, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    holdHit.on('pointerdown', () => this.performHold());

    // Cute animated mascot cat & deco on right side
    this.add.image(rx - 28, 466, 'deco_paw').setScale(0.75).setAlpha(0.75);
    this.add.image(rx + 28, 474, 'deco_heart').setScale(0.65).setAlpha(0.8);
    this.mascotCat = this.add.image(rx, 542, 'cat_pink_sticker').setScale(0.32);
    this.tweens.add({
      targets: this.mascotCat,
      y: 534,
      scaleY: 0.34,
      scaleX: 0.305,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createTouchControls(): void {
    const opts = loadSave().options;
    if (!opts.showTouchControls) return;

    const yRow1 = 674;
    const yRow2 = 744;

    // Left thumb cluster: Left, Down, Right
    createGlossyButton(this, {
      x: 56,
      y: yRow2,
      width: 68,
      height: 56,
      label: '◀',
      fillColor: 0x3b7be0,
      topHighlight: 0x8ec5ff,
      fontSize: 24,
      onClick: () => this.moveHorizontal(-1),
    });

    createGlossyButton(this, {
      x: 132,
      y: yRow2,
      width: 68,
      height: 56,
      label: '▼',
      fillColor: 0x3b7be0,
      topHighlight: 0x8ec5ff,
      fontSize: 24,
      onClick: () => this.softDrop(),
    });

    createGlossyButton(this, {
      x: 208,
      y: yRow2,
      width: 68,
      height: 56,
      label: '▶',
      fillColor: 0x3b7be0,
      topHighlight: 0x8ec5ff,
      fontSize: 24,
      onClick: () => this.moveHorizontal(1),
    });

    // Right thumb cluster: Rotate, Hard Drop, Hold
    createGlossyButton(this, {
      x: 382,
      y: yRow1,
      width: 102,
      height: 56,
      label: '↻ ROT',
      fillColor: 0xffcf33,
      topHighlight: 0xfff5a8,
      fontSize: 19,
      onClick: () => this.rotatePiece(),
    });

    createGlossyButton(this, {
      x: 314,
      y: yRow2,
      width: 92,
      height: 56,
      label: 'HOLD',
      fillColor: 0xff6b9e,
      topHighlight: 0xffc4d9,
      fontSize: 18,
      onClick: () => this.performHold(),
    });

    createGlossyButton(this, {
      x: 406,
      y: yRow2,
      width: 72,
      height: 56,
      label: '⤓',
      fillColor: 0x5cd65c,
      topHighlight: 0xbef7be,
      fontSize: 26,
      onClick: () => this.hardDrop(),
    });
  }

  private setupKeyboard(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    kb.on('keydown-LEFT', () => this.moveHorizontal(-1));
    kb.on('keydown-A', () => this.moveHorizontal(-1));
    kb.on('keydown-RIGHT', () => this.moveHorizontal(1));
    kb.on('keydown-D', () => this.moveHorizontal(1));
    kb.on('keydown-DOWN', () => this.softDrop());
    kb.on('keydown-S', () => this.softDrop());
    kb.on('keydown-UP', () => this.rotatePiece());
    kb.on('keydown-W', () => this.rotatePiece());
    kb.on('keydown-SPACE', () => this.hardDrop());
    kb.on('keydown-C', () => this.performHold());
    kb.on('keydown-SHIFT', () => this.performHold());
    kb.on('keydown-P', () => this.togglePause());
    kb.on('keydown-ESC', () => this.togglePause());
  }

  private setupBoardGestures(): void {
    const bw = BOARD_COLS * this.cellSize;
    const bh = BOARD_ROWS * this.cellSize;
    const boardZone = this.add
      .rectangle(this.boardX + bw / 2, this.boardY + bh / 2, bw, bh, 0x000000, 0)
      .setInteractive();

    boardZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      sound.unlock();
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
      this.dragStartTime = this.time.now;
      this.lastStepX = pointer.x;
      this.lastStepY = pointer.y;
      this.isBoardDragging = true;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isBoardDragging || !pointer.isDown || this.isPaused || this.isGameOver) return;
      const dx = pointer.x - this.lastStepX;
      const dy = pointer.y - this.lastStepY;

      if (Math.abs(dx) >= this.cellSize * 0.8) {
        const dir = dx > 0 ? 1 : -1;
        this.moveHorizontal(dir);
        this.lastStepX = pointer.x;
      }
      if (dy >= this.cellSize * 0.85) {
        this.softDrop();
        this.lastStepY = pointer.y;
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.isBoardDragging) return;
      this.isBoardDragging = false;
      if (this.isPaused || this.isGameOver) return;

      const totalDx = pointer.x - this.dragStartX;
      const totalDy = pointer.y - this.dragStartY;
      const elapsed = this.time.now - this.dragStartTime;

      // Tap -> Rotate
      if (Math.hypot(totalDx, totalDy) < 14 && elapsed < 260) {
        this.rotatePiece();
      } else if (totalDy > 68 && elapsed < 260 && Math.abs(totalDx) < 55) {
        // Fast flick down -> Hard Drop
        this.hardDrop();
      } else if (totalDy < -60 && elapsed < 300 && Math.abs(totalDx) < 55) {
        // Swipe up -> Hold
        this.performHold();
      }
    });
  }

  update(_time: number, delta: number): void {
    if (this.isPaused || this.isGameOver || this.isClearing || !this.activePiece) return;

    this.dropAccumulator += delta;
    if (this.dropAccumulator >= this.levelConfig.dropIntervalMs) {
      this.dropAccumulator = 0;
      this.stepDown();
    }
  }

  private drawFromBag(): TetrominoType {
    if (this.bag.length === 0) {
      this.bag = [...TETROMINO_TYPES];
      Phaser.Utils.Array.Shuffle(this.bag);
    }
    return this.bag.pop()!;
  }

  private spawnPiece(forcedType?: TetrominoType): void {
    const type = forcedType ?? this.nextType;
    if (!forcedType) {
      this.nextType = this.drawFromBag();
    }
    const def = TETROMINOES[type];
    const matrix = def.matrix.map((r) => [...r]);
    const col = Math.floor((BOARD_COLS - matrix[0].length) / 2);
    const row = 0;

    this.activePiece = {
      type,
      color: def.color,
      matrix,
      row,
      col,
    };
    this.canHold = true;
    this.dropAccumulator = 0;

    if (!this.isValidPosition(matrix, row, col)) {
      this.triggerGameOver();
      return;
    }
    this.renderAll();

    // Pop-in animation on newly spawned piece
    this.activeLayer.list.forEach((child) => {
      const img = child as Phaser.GameObjects.Image;
      const targetW = img.displayWidth;
      const targetH = img.displayHeight;
      img.setDisplaySize(targetW * 0.5, targetH * 0.5);
      this.tweens.add({
        targets: img,
        displayWidth: targetW,
        displayHeight: targetH,
        duration: 140,
        ease: 'Back.easeOut',
      });
    });
  }

  private isValidPosition(matrix: number[][], row: number, col: number): boolean {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (!matrix[r][c]) continue;
        const nr = row + r;
        const nc = col + c;
        if (nc < 0 || nc >= BOARD_COLS || nr >= BOARD_ROWS) return false;
        if (nr >= 0 && this.grid[nr][nc] !== null) return false;
      }
    }
    return true;
  }

  private moveHorizontal(dir: -1 | 1): void {
    if (!this.activePiece || this.isPaused || this.isGameOver || this.isClearing) return;
    if (this.isValidPosition(this.activePiece.matrix, this.activePiece.row, this.activePiece.col + dir)) {
      this.activePiece.col += dir;
      sound.playMove();
      this.renderAll();
    }
  }

  private softDrop(): void {
    if (!this.activePiece || this.isPaused || this.isGameOver || this.isClearing) return;
    if (this.isValidPosition(this.activePiece.matrix, this.activePiece.row + 1, this.activePiece.col)) {
      this.activePiece.row += 1;
      this.score += 1;
      this.dropAccumulator = 0;
      this.renderAll();
    } else {
      this.lockPiece();
    }
  }

  private hardDrop(): void {
    if (!this.activePiece || this.isPaused || this.isGameOver || this.isClearing) return;
    let dropped = 0;
    while (
      this.isValidPosition(this.activePiece.matrix, this.activePiece.row + 1, this.activePiece.col)
    ) {
      this.activePiece.row += 1;
      dropped++;
    }
    this.score += dropped * 2;
    this.lockPiece();
  }

  private stepDown(): void {
    if (!this.activePiece) return;
    if (this.isValidPosition(this.activePiece.matrix, this.activePiece.row + 1, this.activePiece.col)) {
      this.activePiece.row += 1;
      this.renderAll();
    } else {
      this.lockPiece();
    }
  }

  private rotatePiece(): void {
    if (!this.activePiece || this.isPaused || this.isGameOver || this.isClearing) return;
    if (this.activePiece.type === 'O') {
      sound.playRotate();
      return;
    }

    const m = this.activePiece.matrix;
    const N = m.length;
    const rotated = Array.from({ length: N }, () => Array<number>(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        rotated[c][N - 1 - r] = m[r][c];
      }
    }

    const kicks = [0, -1, 1, -2, 2];
    for (const dx of kicks) {
      if (this.isValidPosition(rotated, this.activePiece.row, this.activePiece.col + dx)) {
        this.activePiece.matrix = rotated;
        this.activePiece.col += dx;
        sound.playRotate();
        this.renderAll();
        this.activeLayer.list.forEach((child) => {
          const img = child as Phaser.GameObjects.Image;
          const w = img.displayWidth;
          const h = img.displayHeight;
          img.setDisplaySize(w * 1.16, h * 0.86);
          this.tweens.add({
            targets: img,
            displayWidth: w,
            displayHeight: h,
            duration: 110,
            ease: 'Back.easeOut',
          });
        });
        return;
      }
    }
  }

  private performHold(): void {
    if (!this.activePiece || !this.canHold || this.isPaused || this.isGameOver || this.isClearing) {
      return;
    }
    const currentType = this.activePiece.type;
    sound.playHold();

    if (this.holdType === null) {
      this.holdType = currentType;
      this.spawnPiece();
    } else {
      const swapType = this.holdType;
      this.holdType = currentType;
      this.spawnPiece(swapType);
    }
    this.canHold = false;
    this.renderAll();
  }

  private lockPiece(): void {
    if (!this.activePiece) return;
    const { matrix, row, col, color } = this.activePiece;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (!matrix[r][c]) continue;
        const gr = row + r;
        const gc = col + c;
        if (gr >= 0 && gr < BOARD_ROWS && gc >= 0 && gc < BOARD_COLS) {
          this.grid[gr][gc] = color;
          const sx = this.boardX + gc * this.cellSize + this.cellSize / 2;
          const sy = this.boardY + gr * this.cellSize + this.cellSize / 2;
          const puff = this.add.image(sx, sy, 'deco_sparkle').setScale(0.45).setAlpha(0.85);
          this.tweens.add({
            targets: puff,
            y: sy - 10,
            scale: 0.8,
            alpha: 0,
            duration: 220,
            onComplete: () => puff.destroy(),
          });
        }
      }
    }
    sound.playLock();
    this.activePiece = null;
    this.checkAndClearLines();
  }

  private checkAndClearLines(): void {
    const fullRows: number[] = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      if (this.grid[r].every((cell) => cell !== null)) {
        fullRows.push(r);
      }
    }

    if (fullRows.length === 0) {
      this.comboCount = 0;
      this.spawnPiece();
      return;
    }

    this.isClearing = true;
    this.comboCount++;
    const count = fullRows.length;
    const lineScores = [0, 100, 300, 500, 800];
    const gained = (lineScores[count] ?? count * 250) * this.levelConfig.id * Math.min(3, this.comboCount);
    this.score += gained;
    this.linesCleared += count;

    // Score HUD pop animation
    this.tweens.add({
      targets: this.scoreText,
      scale: 1.28,
      duration: 120,
      yoyo: true,
      ease: 'Back.easeOut',
    });

    // Mascot cat happy jump & spin
    this.tweens.add({
      targets: this.mascotCat,
      angle: 360,
      scaleX: 0.4,
      scaleY: 0.4,
      duration: 420,
      yoyo: true,
      ease: 'Back.easeOut',
      onComplete: () => this.mascotCat.setAngle(0),
    });

    sound.playMeowPop(count);
    if (count >= 2) {
      this.cameras.main.shake(180, 0.008);
    }

    // Visual "¡pop!" & "¡miau!" comic bubbles + sparkle burst (matching partida.jpg!)
    const firstRowY = this.boardY + fullRows[0] * this.cellSize + this.cellSize / 2;
    this.spawnPopMiauEffects(fullRows, firstRowY, gained);
    this.renderAll();

    this.time.delayedCall(260, () => {
      // Compute new collapsed grid and how many rows each surviving cat drops
      const remaining: (CatColor | null)[][] = [];
      const dropRowsPerSurvivingRow: number[] = [];

      for (let r = 0; r < BOARD_ROWS; r++) {
        if (fullRows.includes(r)) continue;
        const dropCount = fullRows.filter((fr) => fr > r).length;
        remaining.push(this.grid[r]);
        dropRowsPerSurvivingRow.push(dropCount);
      }

      const emptyRowsNeeded = BOARD_ROWS - remaining.length;
      const dropDistances: number[][] = Array.from({ length: BOARD_ROWS }, () =>
        Array<number>(BOARD_COLS).fill(0)
      );

      for (let i = 0; i < remaining.length; i++) {
        const newR = emptyRowsNeeded + i;
        dropDistances[newR].fill(dropRowsPerSurvivingRow[i]);
      }

      while (remaining.length < BOARD_ROWS) {
        remaining.unshift(Array<CatColor | null>(BOARD_COLS).fill(null));
      }

      this.grid = remaining;
      this.renderAll(dropDistances);

      const maxDrop = Math.max(0, ...dropRowsPerSurvivingRow);
      const fallDuration = maxDrop > 0 ? 240 + maxDrop * 45 + BOARD_COLS * 12 : 40;

      this.time.delayedCall(fallDuration, () => {
        this.isClearing = false;
        if (this.linesCleared >= this.levelConfig.targetLines) {
          this.handleVictory();
        } else {
          this.spawnPiece();
        }
      });
    });
  }

  private spawnPopMiauEffects(fullRows: number[], anchorY: number, gainedScore: number): void {
    const bw = BOARD_COLS * this.cellSize;

    // Bright pastel glow bar over each cleared row
    fullRows.forEach((r) => {
      const ry = this.boardY + r * this.cellSize;
      const flash = this.add.graphics();
      flash.fillStyle(0xffffff, 0.85);
      flash.fillRoundedRect(this.boardX, ry, bw, this.cellSize, 10);
      this.tweens.add({
        targets: flash,
        alpha: 0,
        scaleY: 1.25,
        duration: 320,
        onComplete: () => flash.destroy(),
      });

      // Sparkle particles across the cleared row
      for (let c = 0; c < BOARD_COLS; c += 2) {
        const sx = this.boardX + c * this.cellSize + 18;
        const sy = ry + 18;
        const sp = this.add.image(sx, sy, c % 4 === 0 ? 'deco_star' : 'deco_sparkle').setScale(0.75);
        this.tweens.add({
          targets: sp,
          y: sy - 26,
          alpha: 0,
          scale: 1.3,
          duration: 380,
          onComplete: () => sp.destroy(),
        });
      }
    });

    // Floating "¡pop!" and "¡miau!" text bubbles (matching partida.jpg)
    const popX = this.boardX + bw + 8;
    const popTxt = this.add
      .text(popX, anchorY - 16, '¡pop!', {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#162447',
        strokeThickness: 6,
      })
      .setOrigin(0, 0.5);

    const miauTxt = this.add
      .text(popX + 4, anchorY + 14, '¡miau!', {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ffd84d',
        stroke: '#162447',
        strokeThickness: 6,
      })
      .setOrigin(0, 0.5);

    const scoreLabel = this.comboCount > 1 ? `+${gainedScore} COMBO x${this.comboCount}!` : `+${gainedScore}`;
    const scorePopup = this.add
      .text(this.boardX + bw / 2, anchorY, scoreLabel, {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: this.comboCount > 1 ? '26px' : '22px',
        fontStyle: 'bold',
        color: this.comboCount > 1 ? '#ff8bb7' : '#7be7ff',
        stroke: '#101d3b',
        strokeThickness: 7,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: [popTxt, miauTxt, scorePopup],
      y: '-=34',
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        popTxt.destroy();
        miauTxt.destroy();
        scorePopup.destroy();
      },
    });
  }

  private getGhostRow(): number {
    if (!this.activePiece) return 0;
    let r = this.activePiece.row;
    while (this.isValidPosition(this.activePiece.matrix, r + 1, this.activePiece.col)) {
      r++;
    }
    return r;
  }

  private renderAll(dropDistances?: number[][]): void {
    this.scoreText.setText(String(this.score));
    this.linesText.setText(`${Math.min(this.linesCleared, this.levelConfig.targetLines)}/${this.levelConfig.targetLines}`);

    this.trailGraphics.clear();
    this.ghostGraphics.clear();
    this.cellsLayer.removeAll(true);
    this.activeLayer.removeAll(true);

    // 1. Placed grid cats
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const color = this.grid[r][c];
        if (!color) continue;
        const cx = this.boardX + c * this.cellSize + this.cellSize / 2;
        const cy = this.boardY + r * this.cellSize + this.cellSize / 2;
        const drop = dropDistances?.[r]?.[c] ?? 0;
        const startY = drop > 0 ? cy - drop * this.cellSize : cy;

        const sprite = this.add
          .image(cx, startY, `cat_${color}`)
          .setDisplaySize(this.cellSize + 3, this.cellSize + 3);
        this.cellsLayer.add(sprite);

        if (drop > 0) {
          this.tweens.add({
            targets: sprite,
            y: cy,
            duration: 210 + drop * 45,
            delay: c * 12,
            ease: 'Bounce.easeOut',
          });
        }
      }
    }

    // 2. Ghost piece + Falling piece + vertical motion trails
    if (this.activePiece) {
      const { matrix, row, col, color } = this.activePiece;
      const showGhost = loadSave().options.ghostPiece;
      const ghostRow = this.getGhostRow();

      if (showGhost && ghostRow > row) {
        this.ghostGraphics.fillStyle(0xffffff, 0.14);
        this.ghostGraphics.lineStyle(2, 0x9ec9ff, 0.35);
        for (let r = 0; r < matrix.length; r++) {
          for (let c = 0; c < matrix[r].length; c++) {
            if (!matrix[r][c]) continue;
            const gx = this.boardX + (col + c) * this.cellSize + 2;
            const gy = this.boardY + (ghostRow + r) * this.cellSize + 2;
            this.ghostGraphics.fillRoundedRect(gx, gy, this.cellSize - 4, this.cellSize - 4, 7);
            this.ghostGraphics.strokeRoundedRect(gx, gy, this.cellSize - 4, this.cellSize - 4, 7);
          }
        }
      }

      // Vertical speed trails above active piece (matching partida.jpg)
      this.trailGraphics.fillStyle(CAT_HEX[color], 0.22);
      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (!matrix[r][c]) continue;
          const tx = this.boardX + (col + c) * this.cellSize + 6;
          const ty = this.boardY + (row + r) * this.cellSize - 26;
          if (ty >= this.boardY) {
            this.trailGraphics.fillRoundedRect(tx, ty, this.cellSize - 12, 30, 8);
          }
        }
      }

      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (!matrix[r][c]) continue;
          const px = this.boardX + (col + c) * this.cellSize + this.cellSize / 2;
          const py = this.boardY + (row + r) * this.cellSize + this.cellSize / 2;
          const sprite = this.add
            .image(px, py, `cat_${color}`)
            .setDisplaySize(this.cellSize + 3, this.cellSize + 3);
          this.activeLayer.add(sprite);
        }
      }
    }

    // 3. NEXT & HOLD previews
    this.renderMiniPiece(this.nextPreviewLayer, this.nextType);
    if (this.holdType) {
      this.renderMiniPiece(this.holdPreviewLayer, this.holdType);
    } else {
      this.holdPreviewLayer.removeAll(true);
    }
  }

  private renderMiniPiece(container: Phaser.GameObjects.Container, type: TetrominoType): void {
    container.removeAll(true);
    const def = TETROMINOES[type];
    const m = def.matrix;
    const miniSize = 23;

    // Bounding box of active cells for clean centering
    let minR = m.length, maxR = -1, minC = m[0].length, maxC = -1;
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (m[r][c]) {
          minR = Math.min(minR, r);
          maxR = Math.max(maxR, r);
          minC = Math.min(minC, c);
          maxC = Math.max(maxC, c);
        }
      }
    }
    const w = (maxC - minC + 1) * miniSize;
    const h = (maxR - minR + 1) * miniSize;

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        if (!m[r][c]) continue;
        const x = (c - minC) * miniSize - w / 2 + miniSize / 2;
        const y = (r - minR) * miniSize - h / 2 + miniSize / 2;
        const cat = this.add
          .image(x, y, `cat_${def.color}`)
          .setDisplaySize(miniSize + 2, miniSize + 2);
        container.add(cat);
      }
    }
  }

  private handleVictory(): void {
    this.isGameOver = true;
    const elapsedSeconds = Math.max(1, Math.floor((this.time.now - this.startTimeMs) / 1000));
    const [s1, s2, s3] = this.levelConfig.starThresholds;
    const stars = this.score >= s3 ? 3 : this.score >= s2 ? 2 : this.score >= s1 ? 1 : 1;

    const save = loadSave();
    save.levelStars[this.levelConfig.id] = Math.max(save.levelStars[this.levelConfig.id] ?? 0, stars);
    save.bestScores[this.levelConfig.id] = Math.max(save.bestScores[this.levelConfig.id] ?? 0, this.score);
    save.pawsCurrency += stars + 1;

    if (this.levelConfig.id >= save.unlockedLevel && this.levelConfig.id < LEVELS.length) {
      save.unlockedLevel = this.levelConfig.id + 1;
      save.newlyUnlockedLevel = save.unlockedLevel;
    }
    writeSave(save);

    this.scene.start('VictoryScene', {
      levelId: this.levelConfig.id,
      score: this.score,
      lives: this.lives,
      elapsedSeconds,
      stars,
    });
  }

  private triggerGameOver(): void {
    this.isGameOver = true;
    sound.playGameOver();
    this.showOverlay('GAME OVER', 'Try Again! ¡Ánimo!');
  }

  private togglePause(forcePause?: boolean): void {
    if (this.isGameOver) return;
    this.isPaused = forcePause !== undefined ? forcePause : !this.isPaused;
    if (this.isPaused) {
      this.showOverlay('PAUSED', `Level ${this.levelConfig.id}: ${this.levelConfig.name}`);
    } else if (this.overlayContainer) {
      this.overlayContainer.destroy();
      this.overlayContainer = null;
    }
  }

  private showOverlay(title: string, subtitle: string): void {
    if (this.overlayContainer) {
      this.overlayContainer.destroy();
    }
    const c = this.add.container(0, 0).setDepth(50);
    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x060d20, 0.78);
    dim.setInteractive();
    c.add(dim);

    const panel = drawHudPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 330, 340, 0x52b6ff);
    c.add(panel);

    const t1 = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 115, title, {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#ffe066',
        stroke: '#162447',
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    const t2 = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 72, subtitle, {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    c.add([t1, t2]);

    if (!this.isGameOver) {
      const resumeBtn = createGlossyButton(this, {
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2 - 10,
        width: 220,
        height: 54,
        label: 'RESUME',
        fillColor: 0x5cd65c,
        topHighlight: 0xbef7be,
        fontSize: 23,
        onClick: () => {
          sound.playClick();
          this.togglePause(false);
        },
      });
      c.add(resumeBtn);
    }

    const retryBtn = createGlossyButton(this, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2 + 58,
      width: 220,
      height: 54,
      label: 'RESTART',
      fillColor: 0xffcf33,
      topHighlight: 0xfff5a8,
      fontSize: 23,
      onClick: () => {
        sound.playClick();
        this.scene.restart({ levelId: this.levelConfig.id });
      },
    });

    const levelsBtn = createGlossyButton(this, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2 + 124,
      width: 220,
      height: 50,
      label: 'LEVELS',
      fillColor: 0xff6f96,
      topHighlight: 0xffc7d7,
      fontSize: 21,
      onClick: () => {
        sound.playClick();
        this.scene.start('LevelSelectScene');
      },
    });

    c.add([retryBtn, levelsBtn]);
    this.overlayContainer = c;
  }
}
