import React, { useState, useEffect, useCallback } from 'react';
import {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  getDailyLog,
  getTodayKey,
  getInventory,
  getPlacedItems,
  resetDailyTasks,
  getPendingApprovals,
  approveTask,
  rejectApproval,
  getPin,
  setPin,
  getStreakCount,
  subscribeDataChange,
} from '../utils/storage';
import { playClickSound, playSuccessSound, playRemoveSound } from '../utils/sound';

const CATEGORIES = ['せいかつ', 'おべんきょう', 'おてつだい', 'うんどう'];

const PRESET_TASKS = [
  { title: 'あさ はみがきをする', category: 'せいかつ', difficulty: 1 },
  { title: 'よる はみがきをする', category: 'せいかつ', difficulty: 1 },
  { title: 'じぶんの くつを そろえる', category: 'せいかつ', difficulty: 1 },
  { title: 'きょうの しゅくだいを おわらせる', category: 'おべんきょう', difficulty: 2 },
  { title: 'ほんを 1さつ よむ', category: 'おべんきょう', difficulty: 2 },
  { title: 'つくえの うえを かたづける', category: 'おてつだい', difficulty: 1 },
  { title: 'しょっきを はこぶ', category: 'おてつだい', difficulty: 1 },
  { title: 'おもちゃを かたづける', category: 'おてつだい', difficulty: 1 },
  { title: 'げんきに あいさつをする', category: 'せいかつ', difficulty: 1 },
  { title: 'おふろに はいる', category: 'せいかつ', difficulty: 1 },
];

export default function ParentDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [tasks, setTasks] = useState(() => getTasks());
  const [showForm, setShowForm] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', category: 'せいかつ', difficulty: 1 });
  const [stats, setStats] = useState(() => {
    const log = getDailyLog();
    const today = getTodayKey();
    const todayEntries = log[today] || [];
    return {
      todayCompleted: todayEntries.length,
      totalParts: getInventory().length,
      placedParts: getPlacedItems().length,
      streak: getStreakCount(),
    };
  });
  const [dailyLog, setDailyLog] = useState(() => getDailyLog());
  const [pending, setPending] = useState(() => getPendingApprovals());
  const [approvedToast, setApprovedToast] = useState('');
  const [showPinChange, setShowPinChange] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState('');

  const refreshData = useCallback(() => {
    const loadedTasks = getTasks();
    setTasks(loadedTasks);
    const log = getDailyLog();
    setDailyLog(log);
    const today = getTodayKey();
    const todayEntries = log[today] || [];
    setStats({
      todayCompleted: todayEntries.length,
      totalParts: getInventory().length,
      placedParts: getPlacedItems().length,
      streak: getStreakCount(),
    });
    setPending(getPendingApprovals());
  }, []);

  useEffect(() => {
    if (authenticated) {
      const unsubscribe = subscribeDataChange(() => {
        refreshData();
      });
      const interval = setInterval(refreshData, 3000);
      return () => {
        unsubscribe();
        clearInterval(interval);
      };
    }
  }, [authenticated, refreshData]);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === getPin()) {
      playClickSound();
      setAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    playClickSound();
    if (editingId) {
      updateTask(editingId, formData);
    } else {
      addTask(formData);
    }
    setFormData({ title: '', category: 'せいかつ', difficulty: 1 });
    setEditingId(null);
    setShowForm(false);
    refreshData();
  };

  const handleAddPreset = (preset) => {
    playClickSound();
    addTask(preset);
    refreshData();
  };

  const handleEdit = (task) => {
    playClickSound();
    setFormData({ title: task.title, category: task.category, difficulty: task.difficulty });
    setEditingId(task.id);
    setShowForm(true);
    setShowPresets(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('このタスクを削除しますか？')) {
      playRemoveSound();
      deleteTask(id);
      refreshData();
    }
  };

  const handleCancel = () => {
    playClickSound();
    setShowForm(false);
    setEditingId(null);
    setFormData({ title: '', category: 'せいかつ', difficulty: 1 });
  };

  const handleResetDaily = () => {
    if (window.confirm('全タスクの完了状態と承認待ちをリセットしますか？\n（毎日の自動更新もありますが、今すぐやり直したい場合に使用します）')) {
      playClickSound();
      resetDailyTasks();
      refreshData();
    }
  };

  const handleApprove = (pendingItem) => {
    playSuccessSound();
    approveTask(pendingItem.id);
    setApprovedToast(`「${pendingItem.taskTitle}」を承認しました！子ども画面にガチャチケットを付与しました🎁`);
    refreshData();
    setTimeout(() => setApprovedToast(''), 4500);
  };

  const handleReject = (pendingItem) => {
    if (window.confirm(`「${pendingItem.taskTitle}」を差し戻しますか？`)) {
      playRemoveSound();
      rejectApproval(pendingItem.id);
      refreshData();
    }
  };

  const handlePinChange = (e) => {
    e.preventDefault();
    if (!newPin || newPin.length < 4) {
      setPinChangeMsg('PINは4文字以上で入力してください');
      return;
    }
    if (newPin !== confirmPin) {
      setPinChangeMsg('PINが一致しません');
      return;
    }
    playClickSound();
    setPin(newPin);
    setNewPin('');
    setConfirmPin('');
    setPinChangeMsg('PINを変更しました ✅');
    setShowPinChange(false);
    setTimeout(() => setPinChangeMsg(''), 3000);
  };

  // ========== PIN入力画面 ==========
  if (!authenticated) {
    return (
      <div className="pin-screen">
        <div className="pin-card">
          <div className="pin-icon">🔒</div>
          <h2>保護者用 管理画面</h2>
          <p>4桁のPINコードを入力してください（初期値: 1234）</p>
          <form onSubmit={handlePinSubmit} className="pin-form">
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="PINコード"
              className="pin-input"
              autoFocus
            />
            {pinError && <p className="pin-error">PINコードが正しくありません</p>}
            <button type="submit" className="primary-btn pin-submit">
              ログイン
            </button>
          </form>
          <p className="pin-hint">※お子さまの誤操作を防ぐためのロック機能です</p>
        </div>
      </div>
    );
  }

  // 今日の達成率計算
  const todayProgress = tasks.length > 0 ? Math.round((stats.todayCompleted / tasks.length) * 100) : 0;

  // ========== 管理画面本体 ==========
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h2>⚙️ 保護者用 管理ダッシュボード</h2>
          <p className="header-sub">お子さまの習慣づけタスクの設定と完了承認を行います</p>
        </div>
        <div className="header-actions">
          <button className="secondary-btn" onClick={() => setShowPinChange(!showPinChange)}>
            🔑 PIN変更
          </button>
          <button className="secondary-btn" onClick={() => setAuthenticated(false)}>
            🔒 ロックする
          </button>
        </div>
      </div>

      {/* PIN変更フォーム */}
      {showPinChange && (
        <div className="pin-change-card card">
          <h3>🔑 PINコード変更</h3>
          <form onSubmit={handlePinChange} className="pin-change-form">
            <div className="form-group">
              <label>新しいPIN（4桁以上）</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="新しいPIN"
                className="form-input"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>確認用PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="もう一度入力"
                className="form-input"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="primary-btn">変更する</button>
              <button type="button" className="secondary-btn" onClick={() => { setShowPinChange(false); setNewPin(''); setConfirmPin(''); }}>
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {pinChangeMsg && <div className="pin-change-msg">{pinChangeMsg}</div>}

      {/* 承認完了トースト通知 */}
      {approvedToast && (
        <div className="approval-toast">
          ✅ {approvedToast}
        </div>
      )}

      {/* 承認待ちセクション */}
      {pending.length > 0 && (
        <div className="approval-section card">
          <div className="approval-header">
            <h3>🔔 お子さまからの承認待ち（{pending.length}件）</h3>
            <span className="approval-hint">「できたよ！」を確認して承認してあげましょう</span>
          </div>
          <div className="approval-list">
            {pending.map(p => (
              <div key={p.id} className="approval-item">
                <div className="approval-item-info">
                  <span className="approval-task-name">⭐ {p.taskTitle}</span>
                  <span className="approval-diff">難易度: {'★'.repeat(p.difficulty || 1)}</span>
                  <span className="approval-time">
                    {new Date(p.submittedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="approval-item-actions">
                  <button className="approve-btn" onClick={() => handleApprove(p)}>
                    ✅ 承認する（ガチャ付与）
                  </button>
                  <button className="reject-btn" onClick={() => handleReject(p)}>
                    ❌ 差し戻し
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 統計サマリーカード */}
      <div className="dashboard-grid">
        <div className="stat-card card">
          <div className="stat-emoji">📋</div>
          <div className="stat-value">{tasks.length}</div>
          <div className="stat-label">登録タスク数</div>
        </div>
        <div className="stat-card card">
          <div className="stat-emoji">✅</div>
          <div className="stat-value">{stats.todayCompleted}</div>
          <div className="stat-label">本日のクリア</div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${Math.min(todayProgress, 100)}%` }}></div>
          </div>
          <span className="progress-label">{todayProgress}% 達成</span>
        </div>
        <div className="stat-card card">
          <div className="stat-emoji">🔥</div>
          <div className="stat-value">{stats.streak}日</div>
          <div className="stat-label">連続達成日数</div>
        </div>
        <div className="stat-card card">
          <div className="stat-emoji">🏘️</div>
          <div className="stat-value">{stats.placedParts + stats.totalParts}</div>
          <div className="stat-label">獲得パーツ総数</div>
        </div>
      </div>

      {/* タスク管理 */}
      <div className="task-manager-section card">
        <div className="section-header">
          <div>
            <h3>📝 タスク管理</h3>
            <p className="section-sub">毎日の習慣にしたいタスクを登録・編集します</p>
          </div>
          <div className="section-actions">
            <button className="secondary-btn" onClick={() => { setShowPresets(!showPresets); setShowForm(false); }}>
              {showPresets ? '✕ 定型文を閉じる' : '✨ おすすめタスクから追加'}
            </button>
            <button className="secondary-btn" onClick={handleResetDaily} title="今日すでにクリアしたタスクを未完了に戻します">
              🔄 タスク状態リセット
            </button>
            <button
              className="primary-btn add-btn"
              onClick={() => {
                setShowForm(!showForm);
                setShowPresets(false);
                setEditingId(null);
                setFormData({ title: '', category: 'せいかつ', difficulty: 1 });
              }}
            >
              {showForm ? '✕ 閉じる' : '＋ 新しいタスク'}
            </button>
          </div>
        </div>

        {/* 定型おすすめタスクピッカー */}
        {showPresets && (
          <div className="presets-box">
            <h4>💡 クリックして簡単に追加できます：</h4>
            <div className="presets-grid">
              {PRESET_TASKS.map((preset, idx) => (
                <button
                  key={idx}
                  className="preset-pill-btn"
                  onClick={() => handleAddPreset(preset)}
                >
                  ＋ {preset.title}（{preset.category}）
                </button>
              ))}
            </div>
          </div>
        )}

        {/* タスク登録・編集フォーム */}
        {showForm && (
          <form className="task-form" onSubmit={handleSubmit}>
            <h4>{editingId ? '✏️ タスクの編集' : '＋ 新規タスクの登録'}</h4>
            <div className="form-group">
              <label>タスク名（ひらがな中心がおすすめです）</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例: あさ はみがきをする"
                className="form-input"
                autoFocus
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>カテゴリ</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-select"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>難易度 / ごほうび期待度 ({'★'.repeat(formData.difficulty)})</label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
                  className="form-range"
                />
                <span className="diff-desc">
                  {formData.difficulty === 1 ? 'かんたん（★）' : formData.difficulty === 2 ? 'ふつう（★★）' : 'がんばり（★★★ レアパーツ確率UP!）'}
                </span>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="primary-btn">
                {editingId ? '✏️ 更新する' : '✅ 登録する'}
              </button>
              <button type="button" className="secondary-btn" onClick={handleCancel}>
                キャンセル
              </button>
            </div>
          </form>
        )}

        <div className="task-list-admin">
          {tasks.length === 0 ? (
            <div className="empty-state">
              <p>タスクがまだ登録されていません。<br />「＋ 新しいタスク」または「おすすめタスクから追加」で追加してください。</p>
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className={`task-item ${task.completed ? 'task-done' : ''}`}>
                <div className="task-item-info">
                  <span className="task-category-badge">{task.category}</span>
                  <span className="task-item-title">{task.title}</span>
                  <span className="task-difficulty">{'★'.repeat(task.difficulty)}</span>
                  {task.completed && <span className="task-done-badge">本日クリア済み</span>}
                </div>
                <div className="task-item-actions">
                  <button className="icon-btn edit-btn" onClick={() => handleEdit(task)} title="編集">✏️ 編集</button>
                  <button className="icon-btn delete-btn" onClick={() => handleDelete(task.id)} title="削除">🗑️ 削除</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 日々のきろく（進捗履歴） */}
      <div className="progress-section card">
        <div className="section-header">
          <div>
            <h3>📅 日々のきろく（実施履歴）</h3>
            <p className="section-sub">日ごとの達成タスク数とがんばりの記録です</p>
          </div>
        </div>

        {Object.keys(dailyLog).length === 0 ? (
          <p className="empty-state">まだ記録がありません。タスクをクリアするとここに記録されます。</p>
        ) : (
          <div className="daily-log-list">
            {Object.entries(dailyLog)
              .sort((a, b) => b[0].localeCompare(a[0]))
              .slice(0, 14) // 直近14日分
              .map(([dateStr, taskIds]) => {
                const dateObj = new Date(dateStr);
                const displayDate = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
                const isToday = dateStr === getTodayKey();

                return (
                  <div key={dateStr} className={`daily-log-item ${isToday ? 'today-item' : ''}`}>
                    <div className="daily-log-date">
                      {displayDate} {isToday && <span className="today-badge">今日</span>}
                    </div>
                    <div className="daily-log-details">
                      <span className="daily-log-count">
                        クリア: {taskIds.length} 個
                      </span>
                      <div className="daily-log-stars">
                        {'⭐'.repeat(Math.min(taskIds.length, 10))}{taskIds.length > 10 && '…'}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* おすすめ知育コンテンツ */}
      <div className="monetization-area card">
        <h3>💡 おすすめ知育コンテンツ</h3>
        <p>
          <a href="https://plyo.blog" target="_blank" rel="noreferrer">
            🧩 空間認識能力を育てる構成遊び（plyo.blog）
          </a>
        </p>
      </div>
    </div>
  );
}
