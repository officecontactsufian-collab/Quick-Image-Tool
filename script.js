// ---------------------------
// ELEMENTS & VARIABLES
// ---------------------------
const imageInput = document.getElementById('imageInput');
const output = document.getElementById('output');
const downloadBtn = document.getElementById('downloadBtn');
const message = document.getElementById('message');
const placeholderText = document.getElementById('placeholderText');
const dropZone = document.getElementById('dropZone');

// Resize inputs
const resizeBtn = document.getElementById('resizeBtn');
const resizeWidth = document.getElementById('resizeWidth');
const resizeHeight = document.getElementById('resizeHeight');
const resizeProgress = document.getElementById('resizeProgress');

// Compress inputs
const compressBtn = document.getElementById('compressBtn');
const compressQuality = document.getElementById('compressQuality');
const compressFormat = document.getElementById('compressFormat');
const compressProgress = document.getElementById('compressProgress');

// Convert inputs
const convertBtn = document.getElementById('convertBtn');
const convertFormat = document.getElementById('convertFormat');
const convertProgress = document.getElementById('convertProgress');

// Remove BG
const removeBgBtn = document.getElementById('removeBgBtn');

let currentFile = null;
let currentFormat = 'png';
let originalFileName = 'image';

// ---------------------------
// UTILITIES
// ---------------------------
function notify(msg, type = 'success') {
  if (!message) return;
  message.innerText = msg;
  message.style.color = type === 'error' ? 'var(--danger)' : 'var(--success)';
  setTimeout(() => { message.innerText = ''; }, 5000);
}

function setProgress(bar, percent) {
  if (!bar) return;
  bar.style.width = `${percent}%`;
}

// ---------------------------
// DRAG & DROP + UPLOAD
// ---------------------------
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = '#6366f1';
});

dropZone.addEventListener('dragleave', () => {
  dropZone.style.borderColor = '#d1d5db';
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = '#d1d5db';
  const file = e.dataTransfer.files[0];
  handleFile(file);
});

if (imageInput) {
  imageInput.addEventListener('change', function () {
    if (this.files && this.files[0]) handleFile(this.files[0]);
  });
}

function handleFile(file) {
  if (!file.type.startsWith('image/')) return notify('❌ Please upload a valid image file', 'error');

  currentFile = file;
  originalFileName = file.name.split('.')[0];
  currentFormat = file.type.split('/')[1];

  const reader = new FileReader();
  reader.onload = (e) => {
    output.src = e.target.result;
    output.style.display = 'block';
    placeholderText.style.display = 'none';

    resizeBtn.disabled = false;
    compressBtn.disabled = false;
    convertBtn.disabled = false;
    removeBgBtn.disabled = false;
    downloadBtn.disabled = false;

    resizeWidth.value = output.naturalWidth;
    resizeHeight.value = output.naturalHeight;

    notify(`✅ Loaded: ${file.name}`);
  };
  reader.readAsDataURL(file);
}

// ---------------------------
// RESIZE
// ---------------------------
resizeBtn.addEventListener('click', async () => {
  if (!output.src) return;
  const img = new Image();
  img.src = output.src;
  img.onload = async () => {
    const newWidth = parseInt(resizeWidth.value) || img.width;
    const newHeight = parseInt(resizeHeight.value) || img.height;

    setProgress(resizeProgress, 0);
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;

    try {
      await pica().resize(img, canvas, {
        unsharpAmount: 80,
        unsharpRadius: 0.6,
        unsharpThreshold: 2
      });
      setProgress(resizeProgress, 50);
      output.src = canvas.toDataURL(`image/${currentFormat}`);
      setProgress(resizeProgress, 100);
      notify(`✨ Resized to ${newWidth}x${newHeight}px`);
    } catch (e) {
      notify('❌ Resize failed', 'error');
    } finally {
      setTimeout(() => setProgress(resizeProgress, 0), 500);
    }
  };
});

// ---------------------------
// COMPRESS
// ---------------------------
compressBtn.addEventListener('click', () => {
  if (!output.src) return;
  const quality = parseFloat(compressQuality.value) || 0.7;
  const format = compressFormat.value || currentFormat;

  const img = new Image();
  img.src = output.src;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (format.includes('jp')) ctx.fillStyle = '#FFF', ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    setProgress(compressProgress, 50);
    output.src = canvas.toDataURL(`image/${format}`, quality);
    currentFormat = format;
    setProgress(compressProgress, 100);
    notify('✨ Compressed successfully');

    setTimeout(() => setProgress(compressProgress, 0), 500);
  };
});

// ---------------------------
// CONVERT
// ---------------------------
convertBtn.addEventListener('click', () => {
  if (!output.src) return;
  const format = convertFormat.value || 'jpeg';
  const img = new Image();
  img.src = output.src;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (format.includes('jp')) ctx.fillStyle = '#FFF', ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    output.src = canvas.toDataURL(`image/${format}`);
    currentFormat = format;
    notify(`🔄 Converted to ${format}`);
  };
});

// ---------------------------
// REMOVE BACKGROUND
// ---------------------------
removeBgBtn.addEventListener('click', async () => {
  if (!currentFile) return notify('❌ Please upload an image first', 'error');

  setProgress(removeBgBtn, 0);
  try {
    const formData = new FormData();
    formData.append('image_file', currentFile);

    const response = await fetch('/api/remove-bg', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Remove BG failed');

    const blob = await response.blob();
    output.src = URL.createObjectURL(blob);
    currentFormat = 'png';
    notify('✨ Background removed successfully');
    setProgress(removeBgBtn, 100);

    setTimeout(() => setProgress(removeBgBtn, 0), 500);
  } catch (e) {
    console.error(e);
    notify('❌ Failed to remove background', 'error');
  }
});

// ---------------------------
// DOWNLOAD
// ---------------------------
downloadBtn.addEventListener('click', () => {
  if (!output.src) return;
  const a = document.createElement('a');
  a.download = `${originalFileName}_imagenova.${currentFormat}`;
  a.href = output.src;
  a.click();
});
