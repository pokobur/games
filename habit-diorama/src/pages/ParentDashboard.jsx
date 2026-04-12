import React, { useState, useEffect } from 'react';
import { getTasks, addTask, updateTask, deleteTask, getDailyLog, getTodayKey, getInventory, getPlacedItems, resetDailyTasks, getPendingApprovals, approveTask, rejectApproval, rollGacha, addToInventory, getPin, setPin } from '../utils/storage';

const CATEGORIES = ['せいかつ', 'おべんきょう', 'おてつだい', 'うんどう'];

export default function ParentDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', category: 'せいかつ', difficulty: 1 });
  const [stats, setStats] = useState({ todayCompleted: 0, totalParts: 0, placedParts: 0 });
  const [dailyLog, setDailyLog] = useState({});
  const [pending, setPending] = useState([]);
  const [approvedItem, setApprovedItem] = useState(null);
  const [showPinChange, setShowPinChange] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState('');

  useEffect(() => {
    if (authenticated) {
      refreshData();
      // 承認待ちを定期チェック
      const interval = setInterval(refreshData, 3000);
      return () => clearInterval(interval);
    }
  }, [authenticated]);

  const refreshData = () => {
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
    });
    setPending(getPendingApprovals());
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === getPin()) {
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

  const handleEdit = (task) => {
    setFormData({ title: task.title, category: task.category, difficulty: task.difficulty });
    setEditingId(task.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('このタスクを削除しますか？')) {
      deleteTask(id);
      refreshData();
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ title: '', category: 'せいかつ', difficulty: 1 });
  };

  const handleResetDaily = () => {
    if (window.confirm('全タスクの完了状態と承認待ちをリセットしますか？\n（翌日用にタスクを未完了に戻します）')) {
      resetDailyTasks();
      refreshData();
    }
  };

  const handleApprove = (pendingItem) => {
    // 承認→タスク完了→ガチャ→インベントリ追加
    approveTask(pendingItem.id);
    const gachaResult = rollGacha(pendingItem.difficulty);
    addToInventory(gachaResult);
    setApprovedItem({ task: pendingItem.taskTitle, part: gachaResult });
    refreshData();
    // 3秒後に承認結果を消す
    setTimeout(() => setApprovedItem(null), 4000);
  };

  const handleReject = (pendingItem) => {
    if (window.confirm(`「${pendingItem.taskTitle}」を差し戻しますか？`)) {
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
          <h2>保護者用管理画面</h2>
          <p>PINコードを入力してください</p>
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
            {pinError && <p className="pin-error">PINが違います</p>}
            <button type="submit" className="primary-btn pin-submit">ログイン</button>
          </form>
        </div>
      </div>
    );
  }

  // ========== 管理画面本体 ==========
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>⚙️ 保護者用 管理画面</h2>
        <div className="header-actions">
          <button className="secondary-btn" onClick={() => setShowPinChange(!showPinChange)}>🔑 PIN変更</button>
          <button className="secondary-btn" onClick={() => setAuthenticated(false)}>🔒 ロック</button>
        </div>
      </div>

      {/* PIN変更フォーム */}
      {showPinChange && (
        <div className="pin-change-card card">
          <h3>🔑 PINコード変更</h3>
          <form onSubmit={handlePinChange} className="pin-change-form">
            <div className="form-group">
              <label>新しいPIN</label>
              <input type="password" inputMode="numeric" maxLength={8} value={newPin}
                onChange={(e) => setNewPin(e.target.value)} placeholder="新しいPIN" className="form-input" autoFocus />
            </div>
            <div className="form-group">
              <label>確認用PIN</label>
              <input type="password" inputMode="numeric" maxLength={8} value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)} placeholder="もう一度入力" className="form-input" />
            </div>
            <div className="form-actions">
              <button type="submit" className="primary-btn">変更する</button>
              <button type="button" className="secondary-btn" onClick={() => { setShowPinChange(false); setNewPin(''); setConfirmPin(''); }}>キャンセル</button>
            </div>
          </form>
        </div>
      )}

      {pinChangeMsg && <div className="pin-change-msg">{pinChangeMsg}</div>}

      {/* 承認通知 */}
      {approvedItem && (
        <div className="approval-toast">
          ✅ 「{approvedItem.task}」を承認！ → 「{approvedItem.part.name}」({approvedItem.part.emoji}) をプレゼント！
        </div>
      )}

      {/* 承認待ちセクション */}
      {pending.length > 0 && (
        <div className="approval-section card">
          <h3>🔔 承認待ち ({pending.length}件)</h3>
          <div className="approval-list">
            {pending.map(p => (
              <div key={p.id} className="approval-item">
                <div className="approval-item-info">
                  <span className="approval-task-name">⭐ {p.taskTitle}</span>
                  <span className="approval-time">{new Date(p.submittedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="approval-item-actions">
                  <button className="approve-btn" onClick={() => handleApprove(p)}>✅ 承認</button>
                  <button className="reject-btn" onClick={() => handleReject(p)}>❌ 差し戻し</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 統計 */}
      <div className="dashboard-grid">
        <div className="stat-card card">
          <div className="stat-emoji">📋</div>
          <div className="stat-value">{tasks.length}</div>
          <div className="stat-label">登録タスク</div>
        </div>
        <div className="stat-card card">
          <div className="stat-emoji">✅</div>
          <div className="stat-value">{stats.todayCompleted}</div>
          <div className="stat-label">本日のクリア</div>
        </div>
        <div className="stat-card card">
          <div className="stat-emoji">🧩</div>
          <div className="stat-value">{stats.totalParts + stats.placedParts}</div>
          <div className="stat-label">獲得パーツ</div>
        </div>
      </div>

      {/* タスク管理 */}
      <div className="task-manager-section">
        <div className="section-header">
          <h3>📝 タスク管理</h3>
          <div className="section-actions">
            <button className="secondary-btn" onClick={handleResetDaily}>🔄 日次リセット</button>
            <button className="primary-btn add-btn" onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ title: '', category: 'せいかつ', difficulty: 1 }); }}>
              {showForm ? '✕ 閉じる' : '＋ 新しいタスク'}
            </button>
          </div>
        </div>

        {showForm && (
          <form className="task-form card" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>タスク名</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例: はみがきをする"
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
                <label>難易度 ({'⭐'.repeat(formData.difficulty)})</label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
                  className="form-range"
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="primary-btn">
                {editingId ? '✏️ 変更' : '✅ 追加'}
              </button>
              <button type="button" className="secondary-btn" onClick={handleCancel}>
                キャンセル
              </button>
            </div>
          </form>
        )}

        <div className="task-list-admin">
          {tasks.length === 0 ? (
            <div className="empty-state card">
              <p>タスクが登録されていません。<br/>「新しいタスク」ボタンから追加してください。</p>
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className={`task-item card ${task.completed ? 'task-done' : ''}`}>
                <div className="task-item-info">
                  <span className="task-category-badge">{task.category}</span>
                  <span className="task-item-title">{task.title}</span>
                  <span className="task-difficulty">{'⭐'.repeat(task.difficulty)}</span>
                  {task.completed && <span className="task-done-badge">完了</span>}
                </div>
                <div className="task-item-actions">
                  <button className="icon-btn edit-btn" onClick={() => handleEdit(task)} title="編集">✏️</button>
                  <button className="icon-btn delete-btn" onClick={() => handleDelete(task.id)} title="削除">🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 進捗状況の可視化 */}
      <div className="progress-section card">
        <h3>📅 日々のきろく</h3>
        {Object.keys(dailyLog).length === 0 ? (
          <p className="empty-state">まだ記録がありません。</p>
        ) : (
          <div className="daily-log-list">
            {Object.entries(dailyLog)
              .sort((a, b) => b[0].localeCompare(a[0])) // 日付の降順
              .map(([dateStr, taskIds]) => {
                const dateObj = new Date(dateStr);
                const displayDate = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
                
                return (
                  <div key={dateStr} className="daily-log-item">
                    <div className="daily-log-date">{displayDate}</div>
                    <div className="daily-log-details">
                      <span className="daily-log-count">
                        クリア: {taskIds.length} コ
                      </span>
                      <div className="daily-log-stars">
                        {'⭐'.repeat(Math.min(taskIds.length, 10))}{taskIds.length > 10 && '...'}
                      </div>
                    </div>
                  </div>
                );
            })}
          </div>
        )}
      </div>

      {/* おすすめコンテンツ */}
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
