import { openSettingsModal } from './settings';

export type TabName = 'home' | 'create' | 'collection' | 'deck';

const listeners: ((tab: TabName) => void)[] = [];
let current: TabName = 'home';

export function currentTab(): TabName {
  return current;
}

export function onTabChange(fn: (tab: TabName) => void): void {
  listeners.push(fn);
}

export function switchTab(tab: TabName): void {
  current = tab;
  document.querySelectorAll<HTMLElement>('.tab-panel').forEach((p) => {
    const active = p.id === `tab-${tab}`;
    p.hidden = !active;
    p.classList.toggle('active', active);
  });
  document.querySelectorAll<HTMLButtonElement>('.tabbar .tab').forEach((b) => {
    const active = b.dataset.tab === tab;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', String(active));
  });
  document.body.dataset.tab = tab;
  listeners.forEach((fn) => fn(tab));
}

export function initNav(): void {
  document.querySelectorAll<HTMLButtonElement>('.tabbar .tab').forEach((b) => {
    b.addEventListener('click', () => switchTab(b.dataset.tab as TabName));
  });
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-goto]');
    if (el) switchTab(el.dataset.goto as TabName);

    const openSettings = (e.target as HTMLElement).closest<HTMLElement>('[data-action="settings"]');
    if (openSettings) {
      e.preventDefault();
      openSettingsModal();
    }
  });

  // タイトルロゴクリックでホームへ
  document.querySelector('.header-logo-btn')?.addEventListener('click', () => {
    switchTab('home');
  });

  // 初期タブ表示
  switchTab('home');
}
