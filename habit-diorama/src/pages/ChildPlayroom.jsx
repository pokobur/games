import React, { useState, useEffect, useCallback } from 'react';
import PhaserGame from '../game/PhaserGame';
import GachaModal from '../components/GachaModal';
import TaskCompleteEffect from '../components/TaskCompleteEffect';
import { getTasks, getInventory, getPlacedItems, addPendingApproval, getPendingApprovals } from '../utils/storage';

export default function ChildPlayroom() {
  const [tasks, setTasks] = useState([]);
  const [showGacha, setShowGacha] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState(1);
  const [showEffect, setShowEffect] = useState(false);
  const [completedTaskName, setCompletedTaskName] = useState('');
  const [inventory, setInventory] = useState([]);
  const [dioramaKey, setDioramaKey] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [placedCount, setPlacedCount] = useState(0);
  const [pendingIds, setPendingIds] = useState([]);
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    refreshData();
    // 承認チェック用のポーリング（3秒ごと）
    const interval = setInterval(() => {
      checkForApprovedRewards();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = useCallback(() => {
    setTasks(getTasks());
    setInventory(getInventory());
    setPlacedCount(getPlacedItems().length);
    const pending = getPendingApprovals();
    setPendingIds(pending.map(p => p.taskId));
  }, []);

  const checkForApprovedRewards = () => {
    // タスクが承認されて完了状態になったかチェック
    const currentTasks = getTasks();
    const pending = getPendingApprovals();
    const pendingTaskIds = pending.map(p => p.taskId);
    
    // 承認待ちだったタスクが完了になっていたら === 親が承認した
    setTasks(currentTasks);
    setPendingIds(pendingTaskIds);
    setInventory(getInventory());
  };

  const handleSubmitTask = (task) => {
    // 子どもは「できたよ！」を送信するだけ
    addPendingApproval(task.id, task.title, task.difficulty);
    setCompletedTaskName(task.title);
    setShowEffect(true);
    refreshData();
    setJustSubmitted(true);
  };

  const handleEffectFinish = () => {
    setShowEffect(false);
    if (justSubmitted) {
      setJustSubmitted(false);
      // ガチャは開かない（親の承認待ち）
    }
  };

  // 親画面から承認された時にガチャを起動するための監視
  // 承認されたことを検知するためにポーリングで状態チェック
  const handleOpenGacha = (difficulty) => {
    setCurrentDifficulty(difficulty);
    setShowGacha(true);
  };

  const handleGachaResult = (part) => {
    refreshData();
  };

  const handleGachaClose = () => {
    setShowGacha(false);
    refreshData();
  };

  const handleSelectInventoryItem = (item) => {
    if (selectedItem && selectedItem.id === item.id) {
      setSelectedItem(null);
    } else {
      setSelectedItem(item);
    }
  };

  const handleItemPlaced = (item) => {
    setSelectedItem(null);
    refreshData();
  };

  const handlePlacedUpdate = useCallback(() => {
    refreshData();
  }, [refreshData]);

  const unfinishedTasks = tasks.filter(t => !t.completed);
  const finishedTasks = tasks.filter(t => t.completed);

  return (
    <div className="playroom-container">
      {/* エフェクト */}
      <TaskCompleteEffect
        isActive={showEffect}
        taskName={completedTaskName}
        onFinish={handleEffectFinish}
      />

      {/* ガチャ */}
      <GachaModal
        isOpen={showGacha}
        onClose={handleGachaClose}
        onResult={handleGachaResult}
        difficulty={currentDifficulty}
      />

      {/* タスク一覧 */}
      <div className="task-list">
        <h2>⭐ やることリスト</h2>
        {tasks.length === 0 ? (
          <div className="empty-tasks">
            <p>タスクがまだないよ！<br/>おやの「かんりがめん」からタスクをついかしてね。</p>
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
                    <span className="task-btn-emoji">⭐</span>
                    <span className="task-btn-label">{t.title}</span>
                    {isPending && <span className="task-pending-badge">しんさちゅう…</span>}
                  </button>
                );
              })}
            </div>

            {finishedTasks.length > 0 && (
              <div className="finished-section">
                <h3>✅ クリアずみ！</h3>
                <div className="finished-list">
                  {finishedTasks.map(t => (
                    <span key={t.id} className="finished-badge">{t.title}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ジオラマ */}
      <div className="diorama-area">
        <h2>🏘️ ぼくの・わたしの まち</h2>

        {selectedItem && (
          <div className="placement-hint">
            ✨ 「{selectedItem.name}」をおくばしょをえらんでね！（まちをクリック）
          </div>
        )}

        <PhaserGame
          key={dioramaKey}
          selectedItem={selectedItem}
          onItemPlaced={handleItemPlaced}
          onPlacedUpdate={handlePlacedUpdate}
        />

        <div className="diorama-help">
          <span>🖱️ ドラッグ: いどう</span>
          <span>📱 ながおし: もどす</span>
        </div>
      </div>

      {/* もちものパネル */}
      <div className="inventory-panel">
        <h3>🎒 もちもの {inventory.length > 0 && <span className="inventory-count">{inventory.length}</span>}</h3>
        {inventory.length === 0 ? (
          <p className="inventory-empty">まだパーツがないよ。タスクをクリアしてゲットしよう！</p>
        ) : (
          <div className="inventory-grid">
            {inventory.map((item, i) => (
              <button
                key={item.id || i}
                className={`inventory-slot ${selectedItem && selectedItem.id === item.id ? 'selected' : ''}`}
                onClick={() => handleSelectInventoryItem(item)}
                title={`${item.name}をせっち`}
              >
                <span className="inventory-slot-emoji">{item.emoji}</span>
                <span className="inventory-slot-name">{item.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
