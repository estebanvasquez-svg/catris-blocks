export type CatColor =
  // 1-8: Basic cats (Levels 1-8)
  | 'turquoise'
  | 'yellow'
  | 'orange'
  | 'purple'
  | 'pink'
  | 'blue'
  | 'green'
  | 'red'
  // 9-20: Row 2
  | 'celeste'
  | 'lila'
  | 'fucsia'
  | 'coral'
  | 'magenta'
  | 'salmon'
  | 'menta'
  | 'aguamarina'
  | 'verde_lima'
  | 'oliva'
  | 'esmeralda'
  | 'verde_bosque'
  // 21-30: Row 3
  | 'marron'
  | 'chocolate'
  | 'ocre'
  | 'beige'
  | 'crema'
  | 'blanco'
  | 'gris_claro'
  | 'gris_oscuro'
  | 'plata'
  | 'oro'
  // 31-40: Row 4
  | 'borgona'
  | 'vino'
  | 'rubi'
  | 'ambar'
  | 'bronce'
  | 'mostaza'
  | 'miscaza'
  | 'arena'
  | 'terracota'
  | 'indigo'
  // 41-50: Row 5
  | 'lavanda'
  | 'violeta'
  | 'purpura_oscuro'
  | 'turquesa_oscuro'
  | 'azul_marino'
  | 'azul_electrico'
  | 'melocoton'
  | 'atigrado_naranja'
  | 'atigrado_gris'
  | 'manchado'
  // 51-59: Row 6
  | 'calico'
  | 'siames'
  | 'carey'
  | 'cafe_con_leche'
  | 'arcoiris'
  | 'galaxia'
  | 'menta_chocolate'
  | 'cereza'
  | 'amarillo_neon';

export interface CatSpecies {
  id: CatColor;
  name: string;
  hex: number;
  index: number; // 1..59
  isBasic: boolean;
}

export const CAT_CATALOG: CatSpecies[] = [
  // Row 1 (1-8: Basic)
  { id: 'turquoise', name: 'Turquesa', hex: 0x4de0d0, index: 1, isBasic: true },
  { id: 'yellow', name: 'Amarillo', hex: 0xffd942, index: 2, isBasic: true },
  { id: 'orange', name: 'Naranja', hex: 0xff9b35, index: 3, isBasic: true },
  { id: 'purple', name: 'Morado', hex: 0xb16ef5, index: 4, isBasic: true },
  { id: 'pink', name: 'Rosa', hex: 0xff8bb7, index: 5, isBasic: true },
  { id: 'blue', name: 'Azul', hex: 0x5dbbff, index: 6, isBasic: true },
  { id: 'green', name: 'Verde', hex: 0x7ad647, index: 7, isBasic: true },
  { id: 'red', name: 'Rojo', hex: 0xf44949, index: 8, isBasic: true },
  // Row 2 (9-20)
  { id: 'celeste', name: 'Celeste', hex: 0xa8d8e9, index: 9, isBasic: false },
  { id: 'lila', name: 'Lila', hex: 0xce99e1, index: 10, isBasic: false },
  { id: 'fucsia', name: 'Fucsia', hex: 0xf24092, index: 11, isBasic: false },
  { id: 'coral', name: 'Coral', hex: 0xfb7469, index: 12, isBasic: false },
  { id: 'magenta', name: 'Magenta', hex: 0xd835a2, index: 13, isBasic: false },
  { id: 'salmon', name: 'Salmón', hex: 0xfe9884, index: 14, isBasic: false },
  { id: 'menta', name: 'Menta', hex: 0xa2edb8, index: 15, isBasic: false },
  { id: 'aguamarina', name: 'Aguamarina', hex: 0x6ef8bd, index: 16, isBasic: false },
  { id: 'verde_lima', name: 'Verde Lima', hex: 0xa1e23f, index: 17, isBasic: false },
  { id: 'oliva', name: 'Oliva', hex: 0x8d9635, index: 18, isBasic: false },
  { id: 'esmeralda', name: 'Esmeralda', hex: 0x03a85b, index: 19, isBasic: false },
  { id: 'verde_bosque', name: 'Verde Bosque', hex: 0x316b37, index: 20, isBasic: false },
  // Row 3 (21-30)
  { id: 'marron', name: 'Marrón', hex: 0x9b5b35, index: 21, isBasic: false },
  { id: 'chocolate', name: 'Chocolate', hex: 0x724325, index: 22, isBasic: false },
  { id: 'ocre', name: 'Ocre', hex: 0xd29633, index: 23, isBasic: false },
  { id: 'beige', name: 'Beige', hex: 0xe5c597, index: 24, isBasic: false },
  { id: 'crema', name: 'Crema', hex: 0xfdeabf, index: 25, isBasic: false },
  { id: 'blanco', name: 'Blanco', hex: 0xfefefe, index: 26, isBasic: false },
  { id: 'gris_claro', name: 'Gris Claro', hex: 0x3a3a3a, index: 27, isBasic: false },
  { id: 'gris_oscuro', name: 'Gris Oscuro', hex: 0x989da0, index: 28, isBasic: false },
  { id: 'plata', name: 'Plata', hex: 0xbebfbe, index: 29, isBasic: false },
  { id: 'oro', name: 'Oro', hex: 0xe8c152, index: 30, isBasic: false },
  // Row 4 (31-40)
  { id: 'borgona', name: 'Borgoña', hex: 0x8e2235, index: 31, isBasic: false },
  { id: 'vino', name: 'Vino', hex: 0x95234e, index: 32, isBasic: false },
  { id: 'rubi', name: 'Rubí', hex: 0xce252e, index: 33, isBasic: false },
  { id: 'ambar', name: 'Ámbar', hex: 0xe67201, index: 34, isBasic: false },
  { id: 'bronce', name: 'Bronce', hex: 0xc57923, index: 35, isBasic: false },
  { id: 'mostaza', name: 'Mostaza', hex: 0xb07739, index: 36, isBasic: false },
  { id: 'miscaza', name: 'Miscaza', hex: 0xcf9c20, index: 37, isBasic: false },
  { id: 'arena', name: 'Arena', hex: 0xddb883, index: 38, isBasic: false },
  { id: 'terracota', name: 'Terracota', hex: 0xcd6346, index: 39, isBasic: false },
  { id: 'indigo', name: 'Índigo', hex: 0x494984, index: 40, isBasic: false },
  // Row 5 (41-50)
  { id: 'lavanda', name: 'Lavanda', hex: 0xc1a2e6, index: 41, isBasic: false },
  { id: 'violeta', name: 'Violeta', hex: 0xa161d4, index: 42, isBasic: false },
  { id: 'purpura_oscuro', name: 'Púrpura Oscuro', hex: 0x652d8b, index: 43, isBasic: false },
  { id: 'turquesa_oscuro', name: 'Turquesa Oscuro', hex: 0x02868b, index: 44, isBasic: false },
  { id: 'azul_marino', name: 'Azul Marino', hex: 0x143676, index: 45, isBasic: false },
  { id: 'azul_electrico', name: 'Azul Eléctrico', hex: 0x0599f4, index: 46, isBasic: false },
  { id: 'melocoton', name: 'Melocotón', hex: 0xfeaa85, index: 47, isBasic: false },
  { id: 'atigrado_naranja', name: 'Atigrado Naranja', hex: 0xfe9d41, index: 48, isBasic: false },
  { id: 'atigrado_gris', name: 'Atigrado Gris', hex: 0xaeaba6, index: 49, isBasic: false },
  { id: 'manchado', name: 'Manchado', hex: 0xe6e6e6, index: 50, isBasic: false },
  // Row 6 (51-59)
  { id: 'calico', name: 'Calicó', hex: 0xf4a261, index: 51, isBasic: false },
  { id: 'siames', name: 'Siamés', hex: 0x8b6f5c, index: 52, isBasic: false },
  { id: 'carey', name: 'Carey', hex: 0xbb8150, index: 53, isBasic: false },
  { id: 'cafe_con_leche', name: 'Café con Leche', hex: 0xd8ad83, index: 54, isBasic: false },
  { id: 'arcoiris', name: 'Arcoíris', hex: 0xfbda3e, index: 55, isBasic: false },
  { id: 'galaxia', name: 'Galaxia', hex: 0x8850bf, index: 56, isBasic: false },
  { id: 'menta_chocolate', name: 'Menta Chocolate', hex: 0x93ebb4, index: 57, isBasic: false },
  { id: 'cereza', name: 'Cereza', hex: 0xe11a51, index: 58, isBasic: false },
  { id: 'amarillo_neon', name: 'Amarillo Neón', hex: 0xeafd24, index: 59, isBasic: false },
];

export const CAT_IDS: CatColor[] = CAT_CATALOG.map((c) => c.id);

export const CAT_HEX: Record<CatColor, number> = Object.fromEntries(
  CAT_CATALOG.map((c) => [c.id, c.hex])
) as Record<CatColor, number>;

export const CAT_MAP: Record<CatColor, CatSpecies> = Object.fromEntries(
  CAT_CATALOG.map((c) => [c.id, c])
) as Record<CatColor, CatSpecies>;

/**
 * Levels 1-8 use the 8 basic cats.
 * Level 9 introduces cat #9 (9 random species), Level 10 adds cat #10 (10 random species), etc.
 */
export function getUnlockedCatsForLevel(levelId: number): CatColor[] {
  const count = levelId <= 8 ? 8 : Math.min(levelId, CAT_IDS.length);
  return CAT_IDS.slice(0, count);
}

export type TetrominoType = 'I' | 'O' | 'T' | 'L' | 'J' | 'S' | 'Z';

export const BOARD_COLS = 6;
export const BOARD_ROWS = 13;

export const GAME_WIDTH = 450;
export const GAME_HEIGHT = 800;

export interface TetrominoDef {
  type: TetrominoType;
  color: CatColor;
  matrix: number[][];
}

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
  targetCat: CatColor;
  targetCatCount: number;
  targetLines: number;
  dropIntervalMs: number;
  badgeType: 'paw' | 'yarn';
  starThresholds: [number, number, number];
}

export const LEVELS: LevelConfig[] = CAT_CATALOG.map((cat, idx) => {
  const id = idx + 1;
  const targetCatCount = 4 + Math.floor(idx / 6);
  const targetLines = 4 + Math.floor(idx / 2);
  const dropIntervalMs = Math.max(250, Math.round(780 - idx * 9));
  const baseScore = 300 + idx * 180;
  return {
    id,
    name: `Gato ${cat.name}`,
    targetCat: cat.id,
    targetCatCount,
    targetLines,
    dropIntervalMs,
    badgeType: id % 4 === 0 ? 'yarn' : 'paw',
    starThresholds: [baseScore, Math.round(baseScore * 1.8), Math.round(baseScore * 2.8)],
  };
});

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
