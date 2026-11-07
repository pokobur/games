import { closeModal, openModal, toast } from './utils';

let activeStream: MediaStream | null = null;

function stopCurrentStream(): void {
  if (activeStream) {
    activeStream.getTracks().forEach((t) => t.stop());
    activeStream = null;
  }
}

/** Webカメラ撮影モーダルを開く（スマホ・PC両対応） */
export async function openCameraModal(onCapture: (blob: Blob) => void): Promise<void> {
  // ブラウザが getUserMedia に対応しているか確認
  if (!navigator.mediaDevices?.getUserMedia) {
    toast('このブラウザはカメラ直接アクセスに対応していません', 'error');
    // ネイティブのカメラ起動 input にフォールバック
    const fallback = document.querySelector<HTMLInputElement>('#cameraCaptureInput');
    fallback?.click();
    return;
  }

  stopCurrentStream();

  const wrap = document.createElement('div');
  wrap.className = 'camera-modal';
  wrap.innerHTML = `
    <div class="camera-head">
      <h3>📸 カメラで撮影</h3>
    </div>
    <div class="camera-view-wrap">
      <video class="camera-video" playsinline autoplay muted></video>
      <div class="camera-overlay-frame">
        <div class="frame-guide"></div>
        <span class="guide-text">枠内にカードイラストを合わせてください</span>
      </div>
    </div>
    <div class="camera-actions">
      <button type="button" class="btn small" id="camSwitchBtn" title="カメラ切替">🔄 切替</button>
      <button type="button" class="btn primary large-shutter" id="camSnapBtn" aria-label="シャッター">◉ 撮影</button>
      <button type="button" class="btn small danger-ghost" id="camCancelBtn">キャンセル</button>
    </div>
  `;

  openModal(wrap, () => {
    stopCurrentStream();
  });

  const video = wrap.querySelector<HTMLVideoElement>('.camera-video')!;
  let facing: 'environment' | 'user' = 'environment';

  async function startStream(): Promise<void> {
    stopCurrentStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      activeStream = stream;
      video.srcObject = stream;
      await video.play().catch(() => {});
    } catch (err) {
      console.warn('Camera open failed:', err);
      // environment がダメなら user でリトライ
      if (facing === 'environment') {
        facing = 'user';
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          activeStream = stream;
          video.srcObject = stream;
          await video.play().catch(() => {});
          return;
        } catch {}
      }
      toast('カメラへのアクセスを許可してください', 'error');
      closeModal();
      // 代替としてファイル入力（capture属性）を起動
      const fallback = document.querySelector<HTMLInputElement>('#cameraCaptureInput');
      fallback?.click();
    }
  }

  await startStream();

  // カメラ切替
  wrap.querySelector('#camSwitchBtn')?.addEventListener('click', async () => {
    facing = facing === 'environment' ? 'user' : 'environment';
    await startStream();
  });

  // キャンセル
  wrap.querySelector('#camCancelBtn')?.addEventListener('click', () => {
    closeModal();
  });

  // 撮影
  wrap.querySelector('#camSnapBtn')?.addEventListener('click', () => {
    if (!video.videoWidth || !video.videoHeight) {
      toast('カメラ映像を読み込み中です', 'error');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 前面カメラの場合は左右反転を補正
    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      closeModal();
      if (blob) {
        onCapture(blob);
        toast('写真を適用しました', 'success');
      } else {
        toast('写真の取得に失敗しました', 'error');
      }
    }, 'image/jpeg', 0.92);
  });
}
