import Phaser from 'phaser';
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import './style.css';
import { GAME_HEIGHT, GAME_WIDTH } from './game/constants';
import { BootScene } from './game/scenes/BootScene';
import { LoadingScene } from './game/scenes/LoadingScene';
import { MenuScene } from './game/scenes/MenuScene';
import { LevelSelectScene } from './game/scenes/LevelSelectScene';
import { GameScene } from './game/scenes/GameScene';
import { VictoryScene } from './game/scenes/VictoryScene';
import { ShopScene } from './game/scenes/ShopScene';
import { OptionsScene } from './game/scenes/OptionsScene';
import { CollectionScene } from './game/scenes/CollectionScene';

if (Capacitor.isNativePlatform()) {
  void SystemBars.setStyle({ style: SystemBarsStyle.Dark }).catch(() => {});
}

// Render internal WebGL canvas at 2x-3x Retina HD while keeping 450x800 logical world coordinates
const HD_SCALE = Math.min(Math.max(Math.ceil(window.devicePixelRatio || 2), 2), 3);

// Ensure every Phaser.GameObjects.Text rasterizes at full Retina HD resolution
const origTextFactory = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (
  x: number,
  y: number,
  text: string | string[],
  style?: Phaser.Types.GameObjects.Text.TextStyle
) {
  const txt = origTextFactory.call(this, x, y, text, style);
  txt.setResolution(HD_SCALE);
  return txt;
};

class HiDpiPlugin extends Phaser.Plugins.ScenePlugin {
  boot(): void {
    this.systems?.events.on(Phaser.Scenes.Events.CREATE, () => {
      const cam = this.systems?.cameras.main;
      if (cam) {
        cam.setZoom(HD_SCALE);
        cam.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
      }
    });
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH * HD_SCALE,
  height: GAME_HEIGHT * HD_SCALE,
  backgroundColor: '#122652',
  render: {
    antialias: true,
    antialiasGL: true,
    pixelArt: false,
    roundPixels: false,
    mipmapFilter: 'LINEAR_MIPMAP_LINEAR',
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  plugins: {
    scene: [
      {
        key: 'HiDpiPlugin',
        plugin: HiDpiPlugin,
        mapping: 'hiDpi',
      },
    ],
  },
  scene: [
    BootScene,
    LoadingScene,
    MenuScene,
    LevelSelectScene,
    GameScene,
    VictoryScene,
    ShopScene,
    OptionsScene,
    CollectionScene,
  ],
};

new Phaser.Game(config);
