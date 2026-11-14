import Phaser from 'phaser';
import { Capacitor } from '@capacitor/core';
import { SystemBars, SystemBarsStyle } from '@capacitor/core';
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

if (Capacitor.isNativePlatform()) {
  void SystemBars.setStyle({ style: SystemBarsStyle.Dark }).catch(() => {});
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#122652',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
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
  ],
};

new Phaser.Game(config);
