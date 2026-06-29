/**
 * Simple hash-based SPA router for ビジュアルタイマー
 */

export type Route = 'home' | 'timer' | 'stamp' | 'cooldown' | 'settings';

type RouteHandler = (params?: Record<string, string>) => void;

const routes: Map<Route, RouteHandler> = new Map();
let currentRoute: Route | null = null;
let appContainer: HTMLElement | null = null;

export function registerRoute(route: Route, handler: RouteHandler): void {
  routes.set(route, handler);
}

export function navigate(route: Route, params?: Record<string, string>): void {
  const paramStr = params
    ? '?' + Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
    : '';
  window.location.hash = `/${route}${paramStr}`;
}

export function getCurrentRoute(): Route | null {
  return currentRoute;
}

export function getAppContainer(): HTMLElement {
  if (!appContainer) {
    appContainer = document.getElementById('app');
    if (!appContainer) throw new Error('App container not found');
  }
  return appContainer;
}

function parseHash(): { route: Route; params: Record<string, string> } {
  const hash = window.location.hash.slice(1) || '/home';
  const [path, queryStr] = hash.split('?');
  const route = (path.replace('/', '') || 'home') as Route;
  const params: Record<string, string> = {};
  if (queryStr) {
    queryStr.split('&').forEach(pair => {
      const [k, v] = pair.split('=');
      if (k) params[k] = decodeURIComponent(v || '');
    });
  }
  return { route, params };
}

function handleRouteChange(): void {
  const { route, params } = parseHash();
  const handler = routes.get(route);
  if (handler) {
    // Screen transition animation
    const container = getAppContainer();
    const currentScreen = container.querySelector('.screen');
    if (currentScreen) {
      currentScreen.classList.add('screen-exit');
      setTimeout(() => {
        currentRoute = route;
        handler(params);
      }, 200);
    } else {
      currentRoute = route;
      handler(params);
    }
  } else {
    // Default to home if route not found
    navigate('home');
  }
}

export function initRouter(): void {
  window.addEventListener('hashchange', handleRouteChange);
  // Handle initial load
  handleRouteChange();
}
