/* ==========================================================
   viewport.js - パン（スクロール移動）＆ ピンチズーム制御
   Matrix Transform による高速・滑らかで操作ストレスのないビューポート
   ========================================================== */
(function () {
    'use strict';
    const DM = (window.DM = window.DM || {});
    const U = DM.util;

    class Viewport {
        constructor(containerEl, contentEl, fieldW, fieldH) {
            this.container = containerEl;
            this.content = contentEl;
            this.fieldW = fieldW || 2400;
            this.fieldH = fieldH || 1500;

            this.scale = 1.0;
            this.minScale = 0.5;
            this.maxScale = 2.6;
            this.baseScale = 1.0;

            this.tx = 0;
            this.ty = 0;

            // ポインター追跡
            this.pointers = new Map();
            this.prevDistance = 0;
            this.isDragging = false;
            this.hasMovedSignificantly = false;
            this.dragStartX = 0;
            this.dragStartY = 0;
            this.startTx = 0;
            this.startTy = 0;

            this._onPointerDown = this.onPointerDown.bind(this);
            this._onPointerMove = this.onPointerMove.bind(this);
            this._onPointerUp = this.onPointerUp.bind(this);
            this._onWheel = this.onWheel.bind(this);

            this.initEvents();
        }

        initEvents() {
            this.container.addEventListener('pointerdown', this._onPointerDown);
            window.addEventListener('pointermove', this._onPointerMove);
            window.addEventListener('pointerup', this._onPointerUp);
            window.addEventListener('pointercancel', this._onPointerUp);
            this.container.addEventListener('wheel', this._onWheel, { passive: false });
        }

        destroy() {
            this.container.removeEventListener('pointerdown', this._onPointerDown);
            window.removeEventListener('pointermove', this._onPointerMove);
            window.removeEventListener('pointerup', this._onPointerUp);
            window.removeEventListener('pointercancel', this._onPointerUp);
            this.container.removeEventListener('wheel', this._onWheel);
        }

        /** コンテナサイズに合わせて全体がちょうど収まるベース倍率を計算 */
        fit() {
            const cw = this.container.clientWidth;
            const ch = this.container.clientHeight;
            if (!cw || !ch) return;

            // 横長見開きが画面幅または高さに収まるスケール
            const scaleX = cw / this.fieldW;
            const scaleY = ch / this.fieldH;
            this.baseScale = Math.min(scaleX, scaleY) * 0.98; // 少し余白を持たせる
            this.minScale = this.baseScale * 0.95;
            this.maxScale = Math.max(2.4, this.baseScale * 3.5);

            // デフォルトは全体表示、または見開きの左ページが見える程度に少しズーム
            this.scale = this.baseScale;
            // 中央配置
            this.tx = (cw - this.fieldW * this.scale) / 2;
            this.ty = (ch - this.fieldH * this.scale) / 2;

            this.applyTransform();
        }

        applyTransform(animate = false) {
            if (animate) {
                this.content.style.transition = 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)';
            } else {
                this.content.style.transition = 'none';
            }
            this.content.style.transform = `translate3d(${U.f(this.tx)}px, ${U.f(this.ty)}px, 0) scale(${U.f(this.scale * 1000) / 1000})`;
        }

        clampPosition() {
            const cw = this.container.clientWidth;
            const ch = this.container.clientHeight;
            const scaledW = this.fieldW * this.scale;
            const scaledH = this.fieldH * this.scale;

            // 画面サイズより小さい場合は中央寄せ
            if (scaledW <= cw) {
                this.tx = (cw - scaledW) / 2;
            } else {
                const minTx = cw - scaledW;
                const maxTx = 0;
                this.tx = U.clamp(this.tx, minTx, maxTx);
            }

            if (scaledH <= ch) {
                this.ty = (ch - scaledH) / 2;
            } else {
                const minTy = ch - scaledH;
                const maxTy = 0;
                this.ty = U.clamp(this.ty, minTy, maxTy);
            }
        }

        onPointerDown(e) {
            this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (this.pointers.size === 1) {
                this.isDragging = true;
                this.hasMovedSignificantly = false;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                this.startTx = this.tx;
                this.startTy = this.ty;
            } else if (this.pointers.size === 2) {
                this.isDragging = false;
                const [p1, p2] = Array.from(this.pointers.values());
                this.prevDistance = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            }
        }

        onPointerMove(e) {
            if (!this.pointers.has(e.pointerId)) return;
            this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (this.pointers.size === 1 && this.isDragging) {
                const dx = e.clientX - this.dragStartX;
                const dy = e.clientY - this.dragStartY;
                if (Math.hypot(dx, dy) > 8) {
                    this.hasMovedSignificantly = true;
                }
                this.tx = this.startTx + dx;
                this.ty = this.startTy + dy;
                this.clampPosition();
                this.applyTransform();
            } else if (this.pointers.size === 2) {
                this.hasMovedSignificantly = true;
                const [p1, p2] = Array.from(this.pointers.values());
                const curDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                if (this.prevDistance > 0 && curDist > 0) {
                    const factor = curDist / this.prevDistance;
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;
                    this.zoomBy(factor, midX, midY);
                }
                this.prevDistance = curDist;
            }
        }

        onPointerUp(e) {
            this.pointers.delete(e.pointerId);
            if (this.pointers.size === 1) {
                const remaining = Array.from(this.pointers.values())[0];
                this.isDragging = true;
                this.dragStartX = remaining.x;
                this.dragStartY = remaining.y;
                this.startTx = this.tx;
                this.startTy = this.ty;
            } else if (this.pointers.size === 0) {
                this.isDragging = false;
                this.prevDistance = 0;
            }
        }

        onWheel(e) {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.12 : 0.89;
            this.zoomBy(factor, e.clientX, e.clientY);
        }

        zoomBy(factor, clientX, clientY) {
            const rect = this.container.getBoundingClientRect();
            const cx = clientX !== undefined ? clientX - rect.left : rect.width / 2;
            const cy = clientY !== undefined ? clientY - rect.top : rect.height / 2;

            const oldScale = this.scale;
            let newScale = oldScale * factor;
            newScale = U.clamp(newScale, this.minScale, this.maxScale);

            // ズーム中心に合わせて平行移動量を調整
            const scaleRatio = newScale / oldScale;
            this.tx = cx - (cx - this.tx) * scaleRatio;
            this.ty = cy - (cy - this.ty) * scaleRatio;
            this.scale = newScale;

            this.clampPosition();
            this.applyTransform();
        }

        /** 補助ボタン用ズームイン */
        zoomIn() {
            this.zoomBy(1.3);
            this.applyTransform(true);
        }

        /** 補助ボタン用ズームアウト */
        zoomOut() {
            this.zoomBy(0.77);
            this.applyTransform(true);
        }

        /** 全体表示にリセット */
        reset() {
            this.fit();
            this.applyTransform(true);
        }

        /** 指定したフィールド内座標 (x, y) にフォーカスして拡大（ヒント機能用） */
        focusOn(fx, fy, targetScale = null) {
            const cw = this.container.clientWidth;
            const ch = this.container.clientHeight;
            this.scale = targetScale || Math.max(1.5, this.baseScale * 1.8);
            this.tx = cw / 2 - fx * this.scale;
            this.ty = ch / 2 - fy * this.scale;
            this.clampPosition();
            this.applyTransform(true);
        }
    }

    DM.Viewport = Viewport;
})();
