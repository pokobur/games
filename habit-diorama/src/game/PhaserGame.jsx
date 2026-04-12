import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { getPlacedItems, savePlacedItems, getInventory, placeItem, removeFromPlaced } from '../utils/storage';

const GRID_COLS = 10;
const GRID_ROWS = 7;
const CELL_SIZE = 64;
const CANVAS_W = GRID_COLS * CELL_SIZE;
const CANVAS_H = GRID_ROWS * CELL_SIZE;

// パーツごとのカラー定義（ソリッドな不透明デザイン）
const PART_COLORS = {
  house:    { fill: 0xe74c3c, roof: 0xc0392b },
  tree:     { fill: 0x27ae60, trunk: 0x8B4513 },
  flower:   { fill: 0xff69b4, center: 0xffd700 },
  car:      { fill: 0x3498db, wheel: 0x2c3e50 },
  train:    { fill: 0x2ecc71, stripe: 0xf1c40f },
  shop:     { fill: 0xf39c12, door: 0x8B4513 },
  pond:     { fill: 0x3498db, edge: 0x2980b9 },
  fence:    { fill: 0xdeb887, post: 0x8B4513 },
  bench:    { fill: 0xCD853F, legs: 0x8B4513 },
  slide:    { fill: 0xff6347, frame: 0x708090 },
  castle:   { fill: 0x9b59b6, tower: 0x8e44ad },
  fountain: { fill: 0x1abc9c, water: 0x16a085 },
};

export default function PhaserGame({ onPlacedUpdate, selectedItem, onItemPlaced }) {
  const gameRef = useRef(null);
  const gameInstance = useRef(null);
  const sceneRef = useRef(null);
  const placedSpritesRef = useRef(new Map());
  const highlightRef = useRef(null);

  // 選択中アイテム配置のためのクリックハンドラ
  const selectedItemRef = useRef(selectedItem);
  useEffect(() => {
    selectedItemRef.current = selectedItem;
  }, [selectedItem]);

  useEffect(() => {
    if (gameInstance.current) return;

    const config = {
      type: Phaser.AUTO,
      width: CANVAS_W,
      height: CANVAS_H,
      parent: gameRef.current,
      backgroundColor: '#71cc65',
      scene: {
        create: createScene,
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
      }
    };
  }, []);

  // selectedItemが変わったらハイライト制御を更新
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (selectedItem) {
      // カーソル追従ハイライトを表示
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
    highlightRef.current.fillStyle(0xffd700, 0.2);
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

    // 描画
    const scene = sceneRef.current;
    if (scene) {
      const container = drawPart(scene, { ...item, gridX: gx, gridY: gy });
      makeDraggable(scene, container, { ...item, gridX: gx, gridY: gy });
    }

    if (highlightRef.current) {
      highlightRef.current.destroy();
      highlightRef.current = null;
    }

    if (onItemPlaced) onItemPlaced(item);
    if (onPlacedUpdate) onPlacedUpdate();
  }, [onItemPlaced, onPlacedUpdate]);

  function createScene() {
    const scene = this;
    sceneRef.current = scene;

    // 背景グリッド
    drawGrid(scene);

    // 配置済みパーツを描画・ドラッグ可能にする
    const placedItems = getPlacedItems();
    placedItems.forEach(item => {
      const container = drawPart(scene, item);
      makeDraggable(scene, container, item);
    });

    // 何もなければ案内表示
    if (placedItems.length === 0 && getInventory().length === 0) {
      const guide = scene.add.text(CANVAS_W / 2, CANVAS_H / 2, 'タスクをクリアして\nパーツをあつめよう！', {
        font: 'bold 22px "M PLUS Rounded 1c", Arial',
        fill: '#ffffff',
        stroke: '#3d7a35',
        strokeThickness: 5,
        align: 'center',
      }).setOrigin(0.5).setDepth(50);
    }
  }

  function makeDraggable(scene, container, item) {
    container.setSize(CELL_SIZE, CELL_SIZE);
    container.setInteractive({ draggable: true, useHandCursor: true });

    let startGridX = item.gridX;
    let startGridY = item.gridY;

    container.on('dragstart', () => {
      container.setDepth(200);
      startGridX = Math.round(container.x / CELL_SIZE);
      startGridY = Math.round(container.y / CELL_SIZE);
    });

    container.on('drag', (pointer, dragX, dragY) => {
      container.x = dragX;
      container.y = dragY;
    });

    container.on('dragend', () => {
      const gx = Math.max(0, Math.min(GRID_COLS - 1, Math.round(container.x / CELL_SIZE)));
      const gy = Math.max(0, Math.min(GRID_ROWS - 1, Math.round(container.y / CELL_SIZE)));

      // 占有チェック
      const placed = getPlacedItems();
      const occupied = placed.find(p => p.gridX === gx && p.gridY === gy && p.placedAt !== item.placedAt);

      if (occupied) {
        // 元に戻す
        container.x = startGridX * CELL_SIZE;
        container.y = startGridY * CELL_SIZE;
      } else {
        container.x = gx * CELL_SIZE;
        container.y = gy * CELL_SIZE;

        // データ更新
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
      }
      container.setDepth(10);
      if (onPlacedUpdate) onPlacedUpdate();
    });

    // 右クリック / 長押しで撤去
    container.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown()) {
        handleRemoveItem(scene, container, item);
      }
    });

    // 長押し検出用
    let longPressTimer = null;
    container.on('pointerdown', (pointer) => {
      if (pointer.leftButtonDown()) {
        longPressTimer = setTimeout(() => {
          handleRemoveItem(scene, container, item);
        }, 600);
      }
    });
    container.on('pointerup', () => { clearTimeout(longPressTimer); });
    container.on('pointermove', () => { clearTimeout(longPressTimer); });
    container.on('dragstart', () => { clearTimeout(longPressTimer); });
  }

  function handleRemoveItem(scene, container, item) {
    removeFromPlaced(item.placedAt);
    container.destroy();
    if (onPlacedUpdate) onPlacedUpdate();
  }

  function drawGrid(scene) {
    const graphics = scene.add.graphics();
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const shade = ((x + y) % 2 === 0) ? 0x6bc45e : 0x71cc65;
        graphics.fillStyle(shade);
        graphics.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
    graphics.lineStyle(1, 0x5aaa4e, 0.3);
    for (let x = 0; x <= GRID_COLS; x++) {
      graphics.lineBetween(x * CELL_SIZE, 0, x * CELL_SIZE, CANVAS_H);
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
      graphics.lineBetween(0, y * CELL_SIZE, CANVAS_W, y * CELL_SIZE);
    }
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
        g.fillStyle(colors.fill);
        g.fillRect(12, 28, 40, 30);
        g.fillStyle(colors.roof);
        g.fillTriangle(cx, 10, 8, 30, 56, 30);
        g.fillStyle(0x8B4513);
        g.fillRect(27, 40, 10, 18);
        g.fillStyle(0x87CEEB);
        g.fillRect(16, 33, 8, 8);
        g.fillRect(40, 33, 8, 8);
        break;
      case 'tree':
        g.fillStyle(0x8B4513);
        g.fillRect(26, 35, 12, 22);
        g.fillStyle(colors.fill);
        g.fillCircle(cx, 25, 18);
        g.fillStyle(0x2ecc71);
        g.fillCircle(cx - 6, 20, 12);
        g.fillCircle(cx + 6, 20, 12);
        break;
      case 'flower':
        g.fillStyle(0x27ae60);
        g.fillRect(30, 35, 4, 20);
        g.fillStyle(colors.fill);
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
          g.fillCircle(cx + Math.cos(angle) * 9, 28 + Math.sin(angle) * 9, 7);
        }
        g.fillStyle(colors.center);
        g.fillCircle(cx, 28, 5);
        break;
      case 'car':
        g.fillStyle(colors.fill);
        g.fillRoundedRect(8, 30, 48, 18, 6);
        g.fillStyle(0x2980b9);
        g.fillRoundedRect(16, 18, 32, 14, 4);
        g.fillStyle(0x87CEEB);
        g.fillRect(20, 21, 11, 9);
        g.fillRect(34, 21, 11, 9);
        g.fillStyle(colors.wheel);
        g.fillCircle(20, 50, 6);
        g.fillCircle(44, 50, 6);
        break;
      case 'train':
        g.fillStyle(colors.fill);
        g.fillRoundedRect(6, 22, 52, 25, 4);
        g.fillStyle(colors.stripe);
        g.fillRect(6, 38, 52, 5);
        g.fillStyle(0x87CEEB);
        for (let i = 0; i < 3; i++) g.fillRect(12 + i * 16, 26, 10, 10);
        g.fillStyle(0x2c3e50);
        for (let i = 0; i < 3; i++) g.fillCircle(16 + i * 16, 52, 5);
        break;
      case 'shop':
        g.fillStyle(colors.fill);
        g.fillRect(8, 22, 48, 34);
        g.fillStyle(0xe67e22);
        g.fillRect(4, 18, 56, 8);
        g.fillStyle(0xf39c12);
        for (let i = 0; i < 7; i += 2) g.fillRect(4 + i * 8, 18, 8, 8);
        g.fillStyle(colors.door);
        g.fillRect(26, 38, 12, 18);
        break;
      case 'pond':
        g.fillStyle(colors.edge);
        g.fillEllipse(cx, cy + 4, 52, 36);
        g.fillStyle(colors.fill);
        g.fillEllipse(cx, cy + 4, 44, 28);
        g.fillStyle(0xffffff);
        g.fillCircle(cx - 8, cy, 3);
        g.fillCircle(cx + 5, cy + 6, 2);
        break;
      case 'fence':
        g.fillStyle(colors.fill);
        for (let i = 0; i < 4; i++) g.fillRect(8 + i * 14, 20, 6, 38);
        g.fillStyle(colors.post);
        g.fillRect(6, 28, 52, 5);
        g.fillRect(6, 44, 52, 5);
        break;
      case 'bench':
        g.fillStyle(colors.fill);
        g.fillRoundedRect(8, 32, 48, 8, 2);
        g.fillRoundedRect(8, 22, 48, 6, 2);
        g.fillStyle(colors.legs);
        g.fillRect(12, 40, 5, 14);
        g.fillRect(47, 40, 5, 14);
        break;
      case 'slide':
        g.fillStyle(colors.frame);
        g.fillRect(10, 12, 5, 44);
        g.fillRect(22, 12, 5, 44);
        for (let i = 0; i < 5; i++) g.fillRect(10, 16 + i * 9, 17, 3);
        g.fillStyle(colors.fill);
        g.beginPath();
        g.moveTo(24, 14);
        g.lineTo(54, 50);
        g.lineTo(54, 54);
        g.lineTo(20, 18);
        g.closePath();
        g.fillPath();
        break;
      case 'castle':
        g.fillStyle(colors.fill);
        g.fillRect(12, 24, 40, 32);
        g.fillStyle(colors.tower);
        g.fillRect(14, 10, 12, 18);
        g.fillRect(38, 10, 12, 18);
        g.fillStyle(0xff0000);
        g.fillTriangle(20, 6, 20, 14, 30, 10);
        g.fillTriangle(44, 6, 44, 14, 54, 10);
        g.fillStyle(0x6c3483);
        g.fillRoundedRect(26, 38, 12, 18, { tl: 6, tr: 6, bl: 0, br: 0 });
        break;
      case 'fountain':
        g.fillStyle(0xbdc3c7);
        g.fillRect(16, 42, 32, 10);
        g.fillRect(10, 48, 44, 8);
        g.fillRect(28, 20, 8, 24);
        g.fillStyle(colors.water);
        g.fillCircle(cx, 20, 6);
        g.fillStyle(0x48dbfb);
        g.fillCircle(cx - 10, 30, 3);
        g.fillCircle(cx + 10, 30, 3);
        g.fillCircle(cx - 6, 25, 2);
        g.fillCircle(cx + 6, 25, 2);
        break;
      default:
        g.fillStyle(0x999999);
        g.fillRect(8, 8, 48, 48);
        break;
    }

    return container;
  }

  return (
    <div className="phaser-wrapper">
      <div
        ref={gameRef}
        style={{ border: '8px solid #a3753b', borderRadius: '12px', overflow: 'hidden', cursor: selectedItem ? 'crosshair' : 'default' }}
        onContextMenu={(e) => e.preventDefault()}
      ></div>
    </div>
  );
}
