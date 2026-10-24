import React from 'react';
import { promptInstall } from '../utils/pwa';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  canNativeInstall: boolean;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  canNativeInstall,
}) => {
  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      onClose();
    }
  };

  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-4 border-[#a5d6a7] text-gray-800 flex flex-col items-center">
        {/* App Icon */}
        <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md mb-3 border-2 border-[#81c784]">
          <img src="./icon-192.png" alt="どうぶつステップ アイコン" className="w-full h-full object-cover" />
        </div>

        <h3 className="text-xl font-black text-[#2e7d32] text-center mb-1">
          どうぶつステップ
        </h3>
        <p className="text-xs text-[#558b2f] font-bold text-center mb-4">
          ホーム画面に追加してアプリのように遊ぼう！
        </p>

        <div className="w-full bg-[#f1f8e9] rounded-2xl p-4 text-xs sm:text-sm text-gray-700 space-y-2 mb-5 border border-[#c8e6c9]">
          <div className="flex items-center gap-2 font-bold text-[#2e7d32]">
            <span>✨</span> メリット
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-gray-600 pl-1">
            <li>全画面（アドレスバーなし）で快適に対面プレイ！</li>
            <li>電波が届かない場所（オフライン）でも遊べる</li>
            <li>ワンタップですぐにスタート</li>
          </ul>
        </div>

        {canNativeInstall ? (
          <div className="w-full space-y-2">
            <button
              onClick={handleNativeInstall}
              className="w-full py-3 bg-[#43a047] hover:bg-[#2e7d32] text-white font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>📲</span> 今すぐインストール
            </button>
          </div>
        ) : isIOS ? (
          <div className="w-full bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-gray-700 space-y-2 mb-2">
            <div className="font-bold text-blue-900 flex items-center gap-1">
              <span>🍎</span> iPhone / iPad の追加方法
            </div>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>Safariの画面下部にある <b>「共有」アイコン</b>（四角から上矢印 ⎋）をタップ</li>
              <li>メニューから <b>「ホーム画面に追加」</b> を選ぶ</li>
              <li>右上の <b>「追加」</b> を押すと完了！</li>
            </ol>
          </div>
        ) : (
          <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-gray-700 space-y-1 mb-2">
            <div className="font-bold text-amber-900 flex items-center gap-1">
              <span>💡</span> 追加方法
            </div>
            <p className="text-gray-600">
              ブラウザメニュー（⋮ や共有アイコン）から <b>「ホーム画面に追加」</b> または <b>「アプリをインストール」</b> をタップしてください。
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-3 px-6 py-2 text-gray-500 hover:text-gray-700 text-xs font-bold transition-all cursor-pointer"
        >
          とじる
        </button>
      </div>
    </div>
  );
};
