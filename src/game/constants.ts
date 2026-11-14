export type CatColor =
  | 'turquoise'
  | 'yellow'
  | 'orange'
  | 'purple'
  | 'pink'
  | 'blue'
  | 'green'
  | 'red';

export type TetrominoType = 'I' | 'O' | 'T' | 'L' | 'J' | 'S' | 'Z';

export const BOARD_COLS = 8;
export const BOARD_ROWS = 14;

export const GAME_WIDTH = 450;
export const GAME_HEIGHT = 800;

export const CAT_HEX: Record<CatColor, number> = {
  turquoise: 0x4de0d0,
  yellow: 0xffd942,
  orange: 0xff9b35,
  purple: 0xb16ef5,
  pink: 0xff8bb7,
  blue: 0x5dbbff,
  green: 0x7ad647,
  red: 0xf44949,
};

export interface TetrominoDef {
  type: TetrominoType;
  color: CatColor;
  matrix: number[][];
}

// Exact color mapping from idea/blocks.jpg & idea/partida.jpg
export const TETROMINOES: Record<TetrominoType, TetrominoDef> = {
  I: {
    type: 'I',
    color: 'turquoise',
    matrix: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
  O: {
    type: 'O',
    color: 'yellow',
    matrix: [
      [1, 1],
      [1, 1],
    ],
  },
  T: {
    type: 'T',
    color: 'purple',
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  L: {
    type: 'L',
    color: 'orange',
    matrix: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  J: {
    type: 'J',
    color: 'blue',
    matrix: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  S: {
    type: 'S',
    color: 'green',
    matrix: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
  },
  Z: {
    type: 'Z',
    color: 'red',
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
  },
};

export const TETROMINO_TYPES: TetrominoType[] = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];

export interface LevelConfig {
  id: number;
  name: string;
  targetLines: number;
  dropIntervalMs: number;
  badgeType: 'paw' | 'yarn';
  starThresholds: [number, number, number];
}

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Kitty Meadow',
    targetLines: 5,
    dropIntervalMs: 780,
    badgeType: 'paw',
    starThresholds: [300, 700, 1200],
  },
  {
    id: 2,
    name: 'Yarn Garden',
    targetLines: 8,
    dropIntervalMs: 680,
    badgeType: 'paw',
    starThresholds: [600, 1200, 2000],
  },
  {
    id: 3,
    name: 'Purr Cloud',
    targetLines: 10,
    dropIntervalMs: 590,
    badgeType: 'paw',
    starThresholds: [900, 1700, 2600],
  },
  {
    id: 4,
    name: 'Woolly Party',
    targetLines: 14,
    dropIntervalMs: 500,
    badgeType: 'yarn',
    starThresholds: [1300, 2300, 3400],
  },
  {
    id: 5,
    name: 'Starry Nap',
    targetLines: 18,
    dropIntervalMs: 420,
    badgeType: 'yarn',
    starThresholds: [1800, 3000, 4500],
  },
  {
    id: 6,
    name: 'Kawaii Master',
    targetLines: 22,
    dropIntervalMs: 350,
    badgeType: 'paw',
    starThresholds: [2400, 3800, 5600],
  },
];

export interface ShopTheme {
  id: string;
  name: string;
  cost: number;
  bgColor: number;
  gridColor: number;
  frameColor: number;
}

export const SHOP_THEMES: ShopTheme[] = [
  {
    id: 'navy',
    name: 'Classic Night',
    cost: 0,
    bgColor: 0x132856,
    gridColor: 0x1e3c78,
    frameColor: 0x52b6ff,
  },
  {
    id: 'berry',
    name: 'Berry Milk',
    cost: 4,
    bgColor: 0x3b1c4a,
    gridColor: 0x542b68,
    frameColor: 0xff8bb7,
  },
  {
    id: 'mint',
    name: 'Matcha Dream',
    cost: 8,
    bgColor: 0x123a3d,
    gridColor: 0x1c5458,
    frameColor: 0x62e5b8,
  },
];
