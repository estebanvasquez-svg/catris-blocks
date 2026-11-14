import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { createGlossyButton, drawGridBackground, drawHudPanel } from '../kawaiiArtwork';
import { sound } from '../audio';
import { GameOptions, loadSave, writeSave } from '../storage';

export class OptionsScene extends Phaser.Scene {
  constructor() {
    super('OptionsScene');
  }

  create(): void {
    drawGridBackground(this, true);

    this.add
      .text(GAME_WIDTH / 2, 74, 'OPTIONS', {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#162447',
        strokeThickness: 9,
      })
      .setOrigin(0.5);

    const rows: { key: keyof GameOptions; label: string }[] = [
      { key: 'music', label: 'Kawaii Music' },
      { key: 'sfx', label: 'Sound Effects (Meow!)' },
      { key: 'haptics', label: 'Vibration / Haptics' },
      { key: 'ghostPiece', label: 'Ghost Piece Guide' },
      { key: 'showTouchControls', label: 'On-Screen Buttons' },
    ];

    const save = loadSave();

    rows.forEach((row, idx) => {
      const cy = 175 + idx * 96;
      drawHudPanel(this, GAME_WIDTH / 2, cy, 386, 74, 0x4ca9ff);

      this.add
        .text(GAME_WIDTH / 2 - 168, cy, row.label, {
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '20px',
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(0, 0.5);

      const isOn = save.options[row.key];
      createGlossyButton(this, {
        x: GAME_WIDTH / 2 + 124,
        y: cy,
        width: 96,
        height: 44,
        label: isOn ? 'ON' : 'OFF',
        fillColor: isOn ? 0x5cd65c : 0xff6b8b,
        topHighlight: isOn ? 0xbef7be : 0xffc4d9,
        fontSize: 19,
        onClick: () => {
          const current = loadSave();
          current.options[row.key] = !current.options[row.key];
          writeSave(current);
          sound.syncMusicOption();
          sound.playClick();
          this.scene.restart();
        },
      });
    });

    createGlossyButton(this, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 86,
      width: 190,
      height: 58,
      label: 'BACK',
      fillColor: 0xff6f96,
      topHighlight: 0xffc7d7,
      fontSize: 26,
      onClick: () => {
        sound.playClick();
        this.scene.start('MenuScene');
      },
    });
  }
}
