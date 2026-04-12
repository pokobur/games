import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pagesなどでリポジトリ名がURLのパスになる場合、
  // アセット（JS/CSSなど）の読み込みエラーを防ぐために相対パスを指定します
  base: './',
});
