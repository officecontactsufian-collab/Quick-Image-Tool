const imageInput = document.getElementById('imageInput');
const output = document.getElementById('output');
const downloadBtn = document.getElementById('downloadBtn');
const message = document.getElementById('message');
const placeholderText = document.getElementById('placeholderText');

const resizeBtn = document.getElementById('resizeBtn');
const compressBtn = document.getElementById('compressBtn');
const convertBtn = document.getElementById('convertBtn');
const removeBgBtn = document.getElementById('removeBgBtn');

const resizeWidthInput = document.getElementById('resizeWidth');
const resizeHeightInput = document.getElementById('resizeHeight');
const compressQualityInput = document.getElementById('compressQuality');
const qualityValue = document.getElementById('qualityValue');

const allActionBtns = [resizeBtn, compressBtn, convertBtn, removeBgBtn];

let currentFile = null;
let currentFormat = 'png';
let originalFileName = 'image';

// --------------------
// Utils
// --------------------
function notify(msg, type = 'success') {
  message.innerText = msg;
  message.style.color = type === 'error' ? 'var(--danger)' : 'var(--success)';
  setTimeout(() => (message.innerText = ''), 4000);
}

function toggleButtons(disabled) {
  allActionBtns.forEach(btn => btn && (btn.disabled = disabled));
}

function setProgress(btn, value) {
  btn.style.background = `linear-gradient(to right, var(--primary) ${value}%, #ddd ${value}%)`;
}

// --------------------
// Upload
// --------------------
imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (!file || !file.type.startsWith('image/')) {
    return notify('❌ Invalid image file', 'error');
  }

  currentFile = file;
  originalFileName = file.name.split('.')[0];
  currentFormat = file.type.split('/')[1];

  const reader = new FileReader();
  reader.onload = e => {
    output.src = e.target.result;
    output.style.display = 'block';
    placeholderText.style.display = 'none';
    toggleButtons(false);
    downloadBtn.disabled = false;
    notify(`✅ Loaded: ${file.name}`);
  };
  reader.readAsDataURL(file);
});

// --------------------
// Resize
// --------------------
resizeBtn.addEventListener('click', async () => {
  if (!output.src) return;

  const width = parseInt(resizeWidthInput.value);
  const height = parseInt(resizeHeightInput.value);
  if (!width || !height) {
    return notify('❌ Enter valid width & height', 'error');
  }

  const img = new Image();
  img.src = output.src;
  img.onload = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    await pica().resize(img, canvas);
    output.src = canvas.toDataURL(`image/${currentFormat}`);
    notify(`✨ Resized to ${width}x${height}px`);
  };
});

// --------------------
// Compress
// --------------------
compressQualityInput.addEventListener('input', () => {
  qualityValue.innerText = `${compressQualityInput.value}%`;
});

compressBtn.addEventListener('click', () => {
  if (!output.src) return;

  const quality = compressQualityInput.value / 100;
  const img = new Image();
  img.src = output.src;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    if (currentFormat.includes('jp')) {
      ctx.fillStyle = '#FFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0);
    output.src = canvas.toDataURL(`image/${currentFormat}`, quality);
    notify('✨ Compressed');
  };
});

// --------------------
// Convert
// --------------------
convertBtn.addEventListener('click', () => {
  const format = document.getElementById('convertFormat').value;
  if (!format) return;

  const img = new Image();
  img.src = output.src;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    if (format === 'jpeg') {
      ctx.fillStyle = '#FFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0);
    currentFormat = format;
    output.src = canvas.toDataURL(`image/${format}`);
    notify(`🔄 Converted to ${format}`);
  };
});

// --------------------
// Remove Background
// --------------------
removeBgBtn.addEventListener('click', async () => {
  if (!currentFile) return notify('❌ Upload image first', 'error');

  setProgress(removeBgBtn, 0);
  try {
    const formData = new FormData();
    formData.append('image_file', currentFile);

    const res = await fetch('/api/remove-bg', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error();

    const blob = await res.blob();
    output.src = URL.createObjectURL(blob);
    currentFormat = 'png';
    setProgress(removeBgBtn, 100);
    notify('✨ Background removed');
    setTimeout(() => setProgress(removeBgBtn, 0), 500);
  } catch {
    notify('❌ Failed to remove background', 'error');
  }
});

// --------------------
// Download
// --------------------
downloadBtn.addEventListener('click', () => {
  const a = document.createElement('a');
  a.download = `${originalFileName}_imagenova.${currentFormat}`;
  a.href = output.src;
  a.click();
});
