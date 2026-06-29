#!/bin/bash

# エラーが発生した場合はすぐに処理を停止する
set -e
export PATH="/usr/local/bin:$PATH"

echo "🚀 デプロイ用ファイルの準備を開始します..."

# 以前のビルド結果を削除して新しい _site フォルダを作成
rm -rf _site
mkdir -p _site

echo "📁 静的ファイル（HTMLなど）をコピー中..."
cp -r AIzukan _site/
cp -r brainrot-game _site/
cp -r purupoyo-chain _site/
cp -r junban-maker _site/
cp index.html _site/
echo "game.plyo.blog" > _site/CNAME

echo "🚢 戦艦スタディ (battleship-study) をビルド中..."
cd battleship-study
npm install
npm run build
cp -r dist ../_site/battleship-study
cd ..

echo "🏞️ 習慣ジオラマ (habit-diorama) をビルド中..."
cd habit-diorama
npm install
npm run build
cp -r dist ../_site/habit-diorama
cd ..

echo "✨ ピクセルマジックアドベンチャー (pixel-magic-adventurer) をビルド中..."
cd pixel-magic-adventurer
npm install
npm run build
cp -r dist ../_site/pixel-magic-adventurer
cd ..

echo "🌳 どうぶつステップ (animal-step) をビルド中..."
cd animal-step
npm install
npm run build
cp -r dist ../_site/animal-step
cd ..

echo "🔮 らくがき3D召喚 (magic-sketch-3d) をビルド中..."
cd magic-sketch-3d
npm install
npm run build
cp -r dist ../_site/magic-sketch-3d
cd ..

echo "⏱️ ビジュアルタイマー (kodomo-timer) をビルド中..."
cd kodomo-timer
npm install
npm run build
cp -r dist ../_site/kodomo-timer
cd ..

echo "☁️ GitHubの gh-pages ブランチにプッシュしています..."
# 元のリポジトリURLを取得
REMOTE_URL=$(git config --get remote.origin.url)

cd _site
git init
git checkout -b gh-pages
git add .
git commit -m "Deploy to GitHub Pages via local script"
git remote add origin $REMOTE_URL

# gh-pagesブランチへ強制プッシュ（ビルド結果だけを上書き更新します）
git push -f origin gh-pages

cd ..
echo "🎉 デプロイが完了しました！"
