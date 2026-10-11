import React, { useEffect, useRef, useCallback } from 'react';
import Phaser from 'phaser';
import {
  getPlacedItems,
  savePlacedItems,
  getInventory,
  placeItem,
  removeFromPlaced,
  DIORAMA_THEMES,
} from '../utils/storage';
import { playPlaceSound, playRemoveSound } from '../utils/sound';

const GRID_COLS = 10;
const GRID_ROWS = 7;
const CELL_SIZE = 64;
const CANVAS_W = GRID_COLS * CELL_SIZE;
const CANVAS_H = GRID_ROWS * CELL_SIZE;

// パーツごとのカラー定義（ポップ＆ソリッドなデザイン）
const PART_COLORS = {
  house:    { fill: 0xe74c3c, roof: 0xc0392b, door: 0x8B4513, window: 0xfff9c4 },
  tree:     { fill: 0x27ae60, trunk: 0x8B4513, leaf2: 0x2ecc71 },
  flower:   { fill: 0xff69b4, center: 0xffd700, stem: 0x27ae60 },
  car:      { fill: 0x3498db, wheel: 0x2c3e50, glass: 0x87CEEB, light: 0xffeb3b },
  train:    { fill: 0x2ecc71, stripe: 0xf1c40f, window: 0xffffff, wheel: 0x2c3e50 },
  shop:     { fill: 0xf39c12, door: 0x8B4513, awning: 0xe67e22, sign: 0xffffff },
  pond:     { fill: 0x3498db, edge: 0x2980b9, wave: 0xffffff },
  fence:    { fill: 0xdeb887, post: 0x8B4513 },
  bench:    { fill: 0xCD853F, legs: 0x8B4513 },
  slide:    { fill: 0xff6347, frame: 0x708090, step: 0xffd700 },
  castle:   { fill: 0x9b59b6, tower: 0x8e44ad, roof: 0xe74c3c, flag: 0xf1c40f },
  fountain: { fill: 0xbdc3c7, water: 0x1abc9c, ripple: 0x48dbfb },
};

export default function PhaserGame({
  onPlacedUpdate,
  selectedItem,
  onItemPlaced,
  theme = 'grass',
  onSelectPlacedItem,
  selectedPlacedId = null,
}) {
  const gameRef = useRef(null);
  const gameInstance = useRef(null);
  const sceneRef = useRef(null);
  const highlightRef = useRef(null);
  const themeRef = useRef(theme);
  const selectedItemRef = useRef(selectedItem);
  const selectedPlacedIdRef = useRef(selectedPlacedId);

  useEffect(() => {
    themeRef.current = theme;
    if (sceneRef.current && sceneRef.current.redrawBackground) {
      sceneRef.current.redrawBackground();
    }
  }, [theme]);

  useEffect(() => {
    selectedItemRef.current = selectedItem;
  }, [selectedItem]);

  useEffect(() => {
    selectedPlacedIdRef.current = selectedPlacedId;
  }, [selectedPlacedId]);

  // Phaserインスタンス初期化
  useEffect(() => {
    if (gameInstance.current) return;

    const currentThemeObj = DIORAMA_THEMES.find(t => t.id === theme) || DIORAMA_THEMES[0];

    const config = {
      type: Phaser.AUTO,
      width: CANVAS_W,
      height: CANVAS_H,
      parent: gameRef.current,
      backgroundColor: currentThemeObj.bg1,
      scene: {
        create: createScene,
        update: updateScene,
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    gameInstance.current = new Phaser.Game(config);

    return () => {
      if (gameInstance.current) {
        gameInstance.current.destroy(true);
        gameInstance.current = null;
        sceneRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // selectedItemが変わった時のカーソル追従・ハイライト制御
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (selectedItem) {
      scene.input.on('pointermove', handlePointerMove);
      scene.input.on('pointerdown', handlePointerDown);
    } else {
      scene.input.off('pointermove', handlePointerMove);
      scene.input.off('pointerdown', handlePointerDown);
      if (highlightRef.current) {
        highlightRef.current.destroy();
        highlightRef.current = null;
      }
    }

    return () => {
      if (scene && scene.input) {
        scene.input.off('pointermove', handlePointerMove);
        scene.input.off('pointerdown', handlePointerDown);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem]);

  const handlePointerMove = useCallback((pointer) => {
    const scene = sceneRef.current;
    if (!scene || !selectedItemRef.current) return;

    const gx = Math.floor(pointer.x / CELL_SIZE);
    const gy = Math.floor(pointer.y / CELL_SIZE);
    if (gx < 0 || gx >= GRID_COLS || gy < 0 || gy >= GRID_ROWS) return;

    if (!highlightRef.current) {
      highlightRef.current = scene.add.graphics();
      highlightRef.current.setDepth(100);
    }
    highlightRef.current.clear();
    highlightRef.current.lineStyle(3, 0xffd700, 0.9);
    highlightRef.current.fillStyle(0xffd700, 0.25);
    highlightRef.current.fillRect(gx * CELL_SIZE, gy * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    highlightRef.current.strokeRect(gx * CELL_SIZE, gy * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  }, []);

  const handlePointerDown = useCallback((pointer) => {
    const item = selectedItemRef.current;
    if (!item) return;

    const gx = Math.floor(pointer.x / CELL_SIZE);
    const gy = Math.floor(pointer.y / CELL_SIZE);
    if (gx < 0 || gx >= GRID_COLS || gy < 0 || gy >= GRID_ROWS) return;

    // 占有チェック
    const placed = getPlacedItems();
    const occupied = placed.find(p => p.gridX === gx && p.gridY === gy);
    if (occupied) return;

    // 配置実行
    placeItem(item.id, gx, gy);
    playPlaceSound();

    // 描画
    const scene = sceneRef.current;
    if (scene) {
      const container = drawPart(scene, { ...item, gridX: gx, gridY: gy });
      makeDraggable(scene, container, { ...item, gridX: gx, gridY: gy });
      if (scene.emptyGuide) {
        scene.emptyGuide.destroy();
        scene.emptyGuide = null;
      }
    }

    if (highlightRef.current) {
      highlightRef.current.destroy();
      highlightRef.current = null;
    }

    if (onItemPlaced) onItemPlaced(item);
    if (onPlacedUpdate) onPlacedUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onItemPlaced, onPlacedUpdate]);

  function createScene() {
    const scene = this;
    sceneRef.current = scene;

    scene.bgGraphics = scene.add.graphics();
    scene.nightStars = [];

    scene.redrawBackground = () => {
      const currentThemeObj = DIORAMA_THEMES.find(t => t.id === themeRef.current) || DIORAMA_THEMES[0];
      const bg1Color = Phaser.Display.Color.HexStringToColor(currentThemeObj.bg1).color;
      const bg2Color = Phaser.Display.Color.HexStringToColor(currentThemeObj.bg2).color;

      scene.bgGraphics.clear();

      for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
          const shade = ((x + y) % 2 === 0) ? bg2Color : bg1Color;
          scene.bgGraphics.fillStyle(shade, 1);
          scene.bgGraphics.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }

      // グリッド線
      scene.bgGraphics.lineStyle(1, currentThemeObj.gridLine, 0.35);
      for (let x = 0; x <= GRID_COLS; x++) {
        scene.bgGraphics.lineBetween(x * CELL_SIZE, 0, x * CELL_SIZE, CANVAS_H);
      }
      for (let y = 0; y <= GRID_ROWS; y++) {
        scene.bgGraphics.lineBetween(0, y * CELL_SIZE, CANVAS_W, y * CELL_SIZE);
      }

      // 夜テーマのときは星空を描画
      if (themeRef.current === 'night') {
        scene.bgGraphics.fillStyle(0xffffff, 0.8);
        for (let i = 0; i < 20; i++) {
          const sx = (i * 37 + 15) % CANVAS_W;
          const sy = (i * 23 + 10) % CANVAS_H;
          scene.bgGraphics.fillCircle(sx, sy, (i % 3 === 0) ? 2 : 1.2);
        }
      }
    };

    scene.redrawBackground();

    // 配置済みパーツを描画
    const placedItems = getPlacedItems();
    placedItems.forEach(item => {
      const container = drawPart(scene, item);
      makeDraggable(scene, container, item);
    });

    // 案内ガイド表示
    if (placedItems.length === 0 && getInventory().length === 0) {
      scene.emptyGuide = scene.add.text(CANVAS_W / 2, CANVAS_H / 2, 'タスクをクリアして\nパーツをあつめよう！', {
        font: 'bold 22px "M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", Arial',
        fill: '#ffffff',
        stroke: '#2c3e50',
        strokeThickness: 5,
        align: 'center',
      }).setOrigin(0.5).setDepth(50);
    }
  }

  function updateScene() {
    // 軽いアニメーションループ（必要に応じて）
  }

  function makeDraggable(scene, container, item) {
    container.setSize(CELL_SIZE, CELL_SIZE);
    container.setInteractive({ draggable: true, useHandCursor: true });

    let startGridX = item.gridX;
    let startGridY = item.gridY;
    let isDragging = false;

    container.on('dragstart', () => {
      isDragging = true;
      container.setDepth(200);
      startGridX = Math.round(container.x / CELL_SIZE);
      startGridY = Math.round(container.y / CELL_SIZE);
      scene.tweens.add({
        targets: container,
        scale: 1.15,
        duration: 100,
        ease: 'Power1',
      });
    });

    container.on('drag', (pointer, dragX, dragY) => {
      container.x = dragX;
      container.y = dragY;
    });

    container.on('dragend', () => {
      scene.tweens.add({
        targets: container,
        scale: 1.0,
        duration: 100,
        ease: 'Power1',
      });

      const gx = Math.max(0, Math.min(GRID_COLS - 1, Math.round(container.x / CELL_SIZE)));
      const gy = Math.max(0, Math.min(GRID_ROWS - 1, Math.round(container.y / CELL_SIZE)));

      // 占有チェック
      const placed = getPlacedItems();
      const occupied = placed.find(p => p.gridX === gx && p.gridY === gy && p.placedAt !== item.placedAt);

      if (occupied) {
        // 元の位置に戻す
        scene.tweens.add({
          targets: container,
          x: startGridX * CELL_SIZE,
          y: startGridY * CELL_SIZE,
          duration: 150,
          ease: 'Back.easeOut',
        });
      } else {
        container.x = gx * CELL_SIZE;
        container.y = gy * CELL_SIZE;

        const updatedPlaced = placed.map(p => {
          if (p.placedAt === item.placedAt) {
            return { ...p, gridX: gx, gridY: gy };
          }
          return p;
        });
        savePlacedItems(updatedPlaced);
        item.gridX = gx;
        item.gridY = gy;
        startGridX = gx;
        startGridY = gy;
        playPlaceSound();
      }
      container.setDepth(10);
      setTimeout(() => { isDragging = false; }, 50);
      if (onPlacedUpdate) onPlacedUpdate();
    });

    // クリック・タップで選択
    container.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown()) {
        handleRemoveItem(scene, container, item);
        return;
      }
      if (onSelectPlacedItem) {
        onSelectPlacedItem(item);
      }
    });

    // 長押しで片付け（撤去）
    let longPressTimer = null;
    container.on('pointerdown', (pointer) => {
      if (pointer.leftButtonDown()) {
        longPressTimer = setTimeout(() => {
          if (!isDragging) {
            handleRemoveItem(scene, container, item);
          }
        }, 700);
      }
    });
    container.on('pointerup', () => { clearTimeout(longPressTimer); });
    container.on('pointermove', () => { clearTimeout(longPressTimer); });
  }

  function handleRemoveItem(scene, container, item) {
    playRemoveSound();
    scene.tweens.add({
      targets: container,
      scale: 0.1,
      alpha: 0,
      duration: 180,
      ease: 'Back.easeIn',
      onComplete: () => {
        removeFromPlaced(item.placedAt);
        container.destroy();
        if (onPlacedUpdate) onPlacedUpdate();
      },
    });
  }

  function drawPart(scene, item) {
    const x = item.gridX * CELL_SIZE;
    const y = item.gridY * CELL_SIZE;
    const cx = CELL_SIZE / 2;
    const cy = CELL_SIZE / 2;

    const container = scene.add.container(x, y);
    container.setDepth(10);
    const g = scene.add.graphics();
    container.add(g);

    const colors = PART_COLORS[item.type] || { fill: 0x999999 };

    switch (item.type) {
      case 'house':
        g.fillStyle(colors.fill, 1);
        g.fillRect(12, 28, 40, 30);
        g.fillStyle(colors.roof, 1);
        g.fillTriangle(cx, 8, 6, 29, 58, 29);
        g.fillStyle(colors.door, 1);
        g.fillRect(27, 40, 10, 18);
        g.fillStyle(colors.window, 1);
        g.fillRect(16, 33, 8, 8);
        g.fillRect(40, 33, 8, 8);
        // えんとつ
        g.fillStyle(0x7f8c8d, 1);
        g.fillRect(42, 12, 6, 12);
        break;

      case 'tree':
        g.fillStyle(colors.trunk, 1);
        g.fillRect(26, 35, 12, 24);
        g.fillStyle(colors.fill, 1);
        g.fillCircle(cx, 24, 19);
        g.fillStyle(colors.leaf2, 1);
        g.fillCircle(cx - 7, 20, 13);
        g.fillCircle(cx + 7, 20, 13);
        // りんごの実
        g.fillStyle(0xe74c3c, 1);
        g.fillCircle(cx - 4, 25, 3);
        g.fillCircle(cx + 8, 22, 3);
        break;

      case 'flower':
        g.fillStyle(colors.stem, 1);
        g.fillRect(30, 34, 4, 22);
        // はっぱ
        g.fillEllipse(26, 44, 8, 4);
        g.fillEllipse(38, 46, 8, 4);
        g.fillStyle(colors.fill, 1);
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
          g.fillCircle(cx + Math.cos(angle) * 10, 26 + Math.sin(angle) * 10, 7);
        }
        g.fillStyle(colors.center, 1);
        g.fillCircle(cx, 26, 6);
        break;

      case 'car':
        g.fillStyle(colors.fill, 1);
        g.fillRoundedRect(6, 28, 52, 20, 6);
        g.fillStyle(colors.glass, 1);
        g.fillRoundedRect(15, 17, 34, 14, 4);
        g.fillStyle(colors.light, 1);
        g.fillRect(54, 34, 4, 6); // ヘッドライト
        g.fillStyle(colors.wheel, 1);
        g.fillCircle(18, 49, 7);
        g.fillCircle(46, 49, 7);
        g.fillStyle(0xbdc3c7, 1);
        g.fillCircle(18, 49, 3);
        g.fillCircle(46, 49, 3);
        break;

      case 'train':
        g.fillStyle(colors.fill, 1);
        g.fillRoundedRect(4, 20, 56, 28, 5);
        g.fillStyle(colors.stripe, 1);
        g.fillRect(4, 37, 56, 5);
        g.fillStyle(colors.window, 1);
        for (let i = 0; i < 3; i++) g.fillRect(10 + i * 16, 24, 11, 10);
        g.fillStyle(colors.wheel, 1);
        for (let i = 0; i < 3; i++) g.fillCircle(14 + i * 18, 50, 5);
        break;

      case 'shop':
        g.fillStyle(colors.fill, 1);
        g.fillRect(8, 22, 48, 34);
        g.fillStyle(colors.awning, 1);
        g.fillRect(4, 18, 56, 8);
        g.fillStyle(0xffffff, 1);
        for (let i = 0; i < 7; i += 2) g.fillRect(4 + i * 8, 18, 8, 8);
        g.fillStyle(colors.door, 1);
        g.fillRect(26, 38, 12, 18);
        g.fillStyle(0x87ceeb, 1);
        g.fillRect(11, 30, 11, 12);
        g.fillRect(42, 30, 11, 12);
        break;

      case 'pond':
        g.fillStyle(colors.edge, 1);
        g.fillEllipse(cx, cy + 4, 54, 38);
        g.fillStyle(colors.fill, 1);
        g.fillEllipse(cx, cy + 4, 46, 30);
        g.fillStyle(colors.wave, 0.7);
        g.fillCircle(cx - 8, cy + 1, 3);
        g.fillCircle(cx + 6, cy + 6, 2.5);
        break;

      case 'fence':
        g.fillStyle(colors.fill, 1);
        for (let i = 0; i < 4; i++) g.fillRect(8 + i * 14, 18, 6, 40);
        g.fillStyle(colors.post, 1);
        g.fillRect(6, 26, 52, 5);
        g.fillRect(6, 44, 52, 5);
        break;

      case 'bench':
        g.fillStyle(colors.fill, 1);
        g.fillRoundedRect(6, 30, 52, 8, 2);
        g.fillRoundedRect(6, 20, 52, 6, 2);
        g.fillStyle(colors.legs, 1);
        g.fillRect(10, 38, 6, 16);
        g.fillRect(48, 38, 6, 16);
        break;

      case 'slide':
        g.fillStyle(colors.frame, 1);
        g.fillRect(10, 10, 5, 46);
        g.fillRect(22, 10, 5, 46);
        g.fillStyle(colors.step, 1);
        for (let i = 0; i < 5; i++) g.fillRect(10, 15 + i * 9, 17, 3);
        g.fillStyle(colors.fill, 1);
        g.beginPath();
        g.moveTo(24, 12);
        g.lineTo(56, 50);
        g.lineTo(56, 54);
        g.lineTo(20, 16);
        g.closePath();
        g.fillPath();
        break;

      case 'castle':
        g.fillStyle(colors.fill, 1);
        g.fillRect(12, 24, 40, 32);
        g.fillStyle(colors.tower, 1);
        g.fillRect(13, 10, 12, 18);
        g.fillRect(39, 10, 12, 18);
        g.fillStyle(colors.roof, 1);
        g.fillTriangle(19, 4, 11, 12, 27, 12);
        g.fillTriangle(45, 4, 37, 12, 53, 12);
        g.fillStyle(colors.flag, 1);
        g.fillRect(25, 8, 14, 16);
        g.fillStyle(0x34495e, 1);
        g.fillRoundedRect(26, 38, 12, 18, { tl: 6, tr: 6, bl: 0, br: 0 });
        break;

      case 'fountain':
        g.fillStyle(colors.fill, 1);
        g.fillRect(16, 42, 32, 10);
        g.fillRect(8, 48, 48, 8);
        g.fillRect(28, 20, 8, 24);
        g.fillStyle(colors.water, 1);
        g.fillCircle(cx, 18, 7);
        g.fillStyle(colors.ripple, 0.9);
        g.fillCircle(cx - 10, 28, 3.5);
        g.fillCircle(cx + 10, 28, 3.5);
        g.fillCircle(cx - 6, 23, 2.5);
        g.fillCircle(cx + 6, 23, 2.5);
        break;

      default:
        g.fillStyle(0x999999, 1);
        g.fillRect(8, 8, 48, 48);
        break;
    }

    return container;
  }

  return (
    <div className="phaser-wrapper">
      <div
        ref={gameRef}
        className="phaser-canvas-box"
        style={{ cursor: selectedItem ? 'crosshair' : 'default' }}
        onContextMenu={(e) => e.preventDefault()}
      ></div>
    </div>
  );
}
