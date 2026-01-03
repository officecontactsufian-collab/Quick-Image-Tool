const imageInput = document.getElementById('imageInput');
const output = document.getElementById('output');
const downloadBtn = document.getElementById('downloadBtn');
const message = document.getElementById('message');

const resizeBtn = document.getElementById('resizeBtn');
const compressBtn = document.getElementById('compressBtn');
const convertBtn = document.getElementById('convertBtn');
const removeBgBtn = document.getElementById('removeBgBtn');

const resizeWidthInput = document.getElementById('resizeWidth');
const resizeHeightInput = document.getElementById('resizeHeight');
const compressQualityInput = document.getElementById('compressQuality');
const qualityValue = document.getElementById('qualityValue');

let currentFile = null;
let currentFormat = 'png';
let originalFileName = 'image';

function notify(msg, type = 'success') {
  message.innerText = msg;
  message.style.color = type === 'error' ? 'red' : 'green';
  setTimeout(() => (message.innerText = ''), 4000);
}

// Upload
imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (!file || !file.type.startsWith('image/')) {
    return notify('❌ Invalid image', 'error');
  }

  currentFile = file;
  originalFileName = file.name.split('.')[0];
  currentFormat = file.type.split('/')[1];

  const reader = new FileReader();
  reader.onload = e => {
    output.src = e.target.result;
    output.style.display = 'block';
    notify(`✅ Loaded ${file.name}`);
  };
  reader.readAsDataURL(file);
});

// Resize
resizeBtn.addEventListener('click', async () => {
  const w = parseInt(resizeWidthInput.value);
  const h = parseInt(resizeHeightInput.value);
  if (!w || !h) return notify('❌ Invalid size', 'error');

  const img = new Image();
  img.src = output.src;
  img.onload = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    await pica().resize(img, canvas);
    output.src = canvas.toDataURL(`image/${currentFormat}`);
    notify('✨ Resized');
  };
});

// Compress
compressQualityInput.addEventListener('input', () => {
  qualityValue.innerText = compressQualityInput.value + '%';
});

compressBtn.addEventListener('click', () => {
  const quality = compressQualityInput.value / 100;
  const img = new Image();
  img.src = output.src;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    output.src = canvas.toDataURL(`image/${currentFormat}`, quality);
    notify('✨ Compressed');
  };
});

// Convert
convertBtn.addEventListener('click', () => {
  const format = document.getElementById('convertFormat').value;
  const img = new Image();
  img.src = output.src;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    if (format === 'jpeg') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0);
    currentFormat = format;
    output.src = canvas.toDataURL(`image/${format}`);
    notify(`🔄 Converted to ${format}`);
  };
});

// Remove background
removeBgBtn.addEventListener('click', async () => {
  if (!currentFile) return notify('❌ Upload image first', 'error');

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
    notify('✨ Background removed');
  } catch {
    notify('❌ Failed to remove background', 'error');
  }
});

// Download
downloadBtn.addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = output.src;
  a.download = `${originalFileName}_imagenova.${currentFormat}`;
  a.click();
});
