import React, { useState, useEffect, useCallback } from 'react';
import PhaserGame from '../game/PhaserGame';
import GachaModal from '../components/GachaModal';
import TaskCompleteEffect from '../components/TaskCompleteEffect';
import {
  getTasks,
  getInventory,
  getPlacedItems,
  addPendingApproval,
  getPendingApprovals,
  getPendingGachas,
  consumePendingGacha,
  getStreakCount,
  getDioramaTheme,
  setDioramaTheme,
  DIORAMA_THEMES,
  removeFromPlaced,
  clearAllPlaced,
  subscribeDataChange,
} from '../utils/storage';
import { playSubmitSound, playClickSound, playRemoveSound } from '../utils/sound';

export default function ChildPlayroom() {
  const [tasks, setTasks] = useState(() => getTasks());
  const [inventory, setInventory] = useState(() => getInventory());
  const [placedItems, setPlacedItems] = useState(() => getPlacedItems());
  const [pendingIds, setPendingIds] = useState(() => getPendingApprovals().map(p => p.taskId));
  const [pendingGachas, setPendingGachas] = useState(() => getPendingGachas());
  const [streak, setStreak] = useState(() => getStreakCount());
  const [theme, setTheme] = useState(() => getDioramaTheme());

  // モーダル・演出
  const [showGacha, setShowGacha] = useState(false);
  const [currentGachaTicket, setCurrentGachaTicket] = useState(null);
  const [showEffect, setShowEffect] = useState(false);
  const [completedTaskName, setCompletedTaskName] = useState('');

  // 選択中アイテム（インベントリから配置）
  const [selectedItem, setSelectedItem] = useState(null);
  // 選択中配置済みアイテム（撤去など）
  const [selectedPlaced, setSelectedPlaced] = useState(null);

  const refreshData = useCallback(() => {
    setTasks(getTasks());
    setInventory(getInventory());
    const placed = getPlacedItems();
    setPlacedItems(placed);
    const pending = getPendingApprovals();
    setPendingIds(pending.map(p => p.taskId));
    const gachas = getPendingGachas();
    setPendingGachas(gachas);
    setStreak(getStreakCount());
    setTheme(getDioramaTheme());
  }, []);

  useEffect(() => {
    // イベント購読（即時反映）
    const unsubscribe = subscribeDataChange(() => {
      refreshData();
    });
    // バックアップの定期チェック（別ブラウザ・タブ用）
    const interval = setInterval(refreshData, 3000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [refreshData]);

  // タスク完了申請
  const handleSubmitTask = (task) => {
    playSubmitSound();
    addPendingApproval(task.id, task.title, task.difficulty);
    setCompletedTaskName(task.title);
    setShowEffect(true);
    refreshData();
  };

  const handleEffectFinish = () => {
    setShowEffect(false);
  };

  // 未受け取りガチャを開く
  const handleOpenTicketGacha = (ticket) => {
    playClickSound();
    setCurrentGachaTicket(ticket);
    setShowGacha(true);
  };

  // ガチャ終了時
  const handleGachaClose = () => {
    if (currentGachaTicket) {
      consumePendingGacha(currentGachaTicket.id);
      setCurrentGachaTicket(null);
    }
    setShowGacha(false);
    refreshData();
  };

  const handleSelectInventoryItem = (item) => {
    playClickSound();
    if (selectedItem && selectedItem.id === item.id) {
      setSelectedItem(null);
    } else {
      setSelectedItem(item);
      setSelectedPlaced(null);
    }
  };

  const handleItemPlaced = () => {
    setSelectedItem(null);
    refreshData();
  };

  const handlePlacedUpdate = useCallback(() => {
    refreshData();
  }, [refreshData]);

  // テーマ切り替え
  const handleThemeChange = (newTheme) => {
    playClickSound();
    setTheme(newTheme);
    setDioramaTheme(newTheme);
  };

  // 選択したパーツをリュックに戻す
  const handleRemoveSelectedPlaced = () => {
    if (!selectedPlaced) return;
    playRemoveSound();
    removeFromPlaced(selectedPlaced.placedAt);
    setSelectedPlaced(null);
    refreshData();
  };

  // 全パーツを片付ける
  const handleClearAll = () => {
    if (placedItems.length === 0) return;
    if (window.confirm('まちのパーツを ぜんぶ リュックに もどす？')) {
      playRemoveSound();
      clearAllPlaced();
      setSelectedPlaced(null);
      refreshData();
    }
  };

  const unfinishedTasks = tasks.filter(t => !t.completed);
  const finishedTasks = tasks.filter(t => t.completed);

  // まちの発展レベル計算
  const placedCount = placedItems.length;
  let townLevel = 1;
  let townTitle = 'ちいさな ひろば';
  if (placedCount >= 18) {
    townLevel = 4;
    townTitle = '大としかい（メガシティ）🌟';
  } else if (placedCount >= 10) {
    townLevel = 3;
    townTitle = 'にぎやかな まち 🏢';
  } else if (placedCount >= 4) {
    townLevel = 2;
    townTitle = 'かわいい むら 🏡';
  }

  return (
    <div className="playroom-container">
      {/* タスク完了ファンファーレ＆紙吹雪 */}
      <TaskCompleteEffect
        isActive={showEffect}
        taskName={completedTaskName}
        onFinish={handleEffectFinish}
      />

      {/* ガチャモーダル */}
      <GachaModal
        isOpen={showGacha}
        onClose={handleGachaClose}
        difficulty={currentGachaTicket ? currentGachaTicket.difficulty : 1}
        ticketTitle={currentGachaTicket ? currentGachaTicket.taskTitle : ''}
      />

      {/* トップステータスバー（連続記録＆未受け取りガチャ） */}
      <div className="playroom-hero-bar">
        <div className="streak-badge">
          <span className="streak-icon">🔥</span>
          <span className="streak-text">
            まいにちれんぞく <strong>{streak}</strong> にちクリア中！
          </span>
        </div>

        {pendingGachas.length > 0 && (
          <div className="pending-gacha-alert">
            <span className="bounce-icon">🎁</span>
            <span>おうちのひとから <strong>{pendingGachas.length}こ</strong> のごほうび！</span>
            <button
              className="claim-gacha-btn pulse-anim"
              onClick={() => handleOpenTicketGacha(pendingGachas[0])}
            >
              🎰 ガチャをまわす！
            </button>
          </div>
        )}
      </div>

      {/* タスク一覧（子ども向け大きくポップなボタン） */}
      <div className="task-list">
        <div className="section-title-wrap">
          <h2>⭐ きょうの やることリスト</h2>
          <span className="task-counter-pill">
            のこり {unfinishedTasks.length} / ぜんぶで {tasks.length}
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="empty-tasks">
            <p>タスクがまだないよ！<br />おとなの「⚙️ おやよう」から タスクを つくってもらおう！</p>
          </div>
        ) : (
          <>
            <div className="task-buttons">
              {unfinishedTasks.map(t => {
                const isPending = pendingIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => !isPending && handleSubmitTask(t)}
                    className={`task-btn ${isPending ? 'task-btn-pending' : ''}`}
                    disabled={isPending}
                  >
                    <span className="task-btn-emoji">
                      {isPending ? '⏳' : '⭐'}
                    </span>
                    <div className="task-btn-content">
                      <span className="task-btn-label">{t.title}</span>
                      <span className="task-btn-diff">
                        {'★'.repeat(t.difficulty || 1)}
                      </span>
                    </div>
                    {isPending ? (
                      <span className="task-pending-badge">おうちのひとに おねがいちゅう…</span>
                    ) : (
                      <span className="task-do-badge">できた！</span>
                    )}
                  </button>
                );
              })}
            </div>

            {finishedTasks.length > 0 && (
              <div className="finished-section">
                <h3>🎉 きょう クリアしたよ！（{finishedTasks.length}こ）</h3>
                <div className="finished-list">
                  {finishedTasks.map(t => (
                    <span key={t.id} className="finished-badge">
                      ✅ {t.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ジオラマまちづくりエリア */}
      <div className="diorama-area">
        <div className="diorama-header">
          <div className="town-level-info">
            <h2>🏘️ ぼく・わたしの まち</h2>
            <div className="town-badge">
              Lv.{townLevel} {townTitle}（パーツ: {placedCount}こ）
            </div>
          </div>

          {/* まちのテーマ切り替え */}
          <div className="theme-selector">
            <span className="theme-label">きせかえ:</span>
            {DIORAMA_THEMES.map(th => (
              <button
                key={th.id}
                onClick={() => handleThemeChange(th.id)}
                className={`theme-btn ${theme === th.id ? 'active' : ''}`}
                title={th.name}
              >
                {th.icon} {th.name.split('（')[0]}
              </button>
            ))}
          </div>
        </div>

        {selectedItem && (
          <div className="placement-hint">
            ✨ <strong>「{selectedItem.emoji} {selectedItem.name}」</strong> をおく場所をクリックしてね！
            <button className="cancel-place-btn" onClick={() => setSelectedItem(null)}>
              ✕ やめる
            </button>
          </div>
        )}

        {selectedPlaced && (
          <div className="selected-placed-toolbar">
            <span>
              えらんだパーツ: <strong>{selectedPlaced.emoji} {selectedPlaced.name}</strong>
            </span>
            <button className="remove-item-btn" onClick={handleRemoveSelectedPlaced}>
              🎒 リュックにもどす
            </button>
            <button className="cancel-place-btn" onClick={() => setSelectedPlaced(null)}>
              とじる
            </button>
          </div>
        )}

        <PhaserGame
          theme={theme}
          selectedItem={selectedItem}
          onItemPlaced={handleItemPlaced}
          onPlacedUpdate={handlePlacedUpdate}
          onSelectPlacedItem={(item) => setSelectedPlaced(item)}
          selectedPlacedId={selectedPlaced ? selectedPlaced.placedAt : null}
        />

        <div className="diorama-footer-actions">
          <div className="diorama-help">
            <span>🖱️ ドラッグ: いどう</span>
            <span>👆 タップ: えらんでリュックへもどす</span>
          </div>
          {placedCount > 0 && (
            <button className="clean-all-btn" onClick={handleClearAll}>
              🧹 まちをかたづける
            </button>
          )}
        </div>
      </div>

      {/* もちものパネル（リュック） */}
      <div className="inventory-panel">
        <div className="inventory-header">
          <h3>
            🎒 まちのリュック（もちもの）
            {inventory.length > 0 && <span className="inventory-count">{inventory.length}こ</span>}
          </h3>
          <span className="inventory-sub">タップして まちに おいてみよう！</span>
        </div>

        {inventory.length === 0 ? (
          <div className="inventory-empty-box">
            <p className="inventory-empty">
              まだパーツがないよ！<br />
              タスクをクリアしておうちのひとにしょうにんしてもらうと、ガチャでパーツがもらえるよ🎁
            </p>
          </div>
        ) : (
          <div className="inventory-grid">
            {inventory.map((item, i) => (
              <button
                key={item.id || i}
                className={`inventory-slot ${selectedItem && selectedItem.id === item.id ? 'selected' : ''}`}
                onClick={() => handleSelectInventoryItem(item)}
                title={`${item.name}をおく`}
              >
                <span className="inventory-slot-emoji">{item.emoji}</span>
                <span className="inventory-slot-name">{item.name}</span>
                <span className="inventory-slot-stars">{'★'.repeat(item.rarity || 1)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
