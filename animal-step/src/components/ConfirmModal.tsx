import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  message,
  confirmLabel,
  cancelLabel = 'キャンセル',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-4 border-[#a5d6a7] text-gray-800 flex flex-col items-center animate-in zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-base sm:text-lg font-bold text-[#2e7d32] text-center leading-relaxed mb-6 whitespace-pre-line">
          {message}
        </p>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onConfirm}
            className="w-full py-3 px-4 bg-[#43a047] hover:bg-[#2e7d32] text-white font-bold rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full border border-gray-300 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
