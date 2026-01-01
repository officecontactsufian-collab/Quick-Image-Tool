// ====== Tabs Navigation ======
const tabs = document.querySelectorAll('.tab-btn');
const sections = document.querySelectorAll('.tool-section');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    sections.forEach(sec => sec.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(tab.dataset.tool).classList.add('active');
  });
});

// ====== Shared Elements ======
const API_KEY_URL = 'https://raw.githubusercontent.com/Soufiyan/API/main/remove-bg-js.js'; // مخفي على GitHub
let API_KEY = '';

// Load API Key dynamically
fetch(API_KEY_URL)
  .then(res => res.text())
  .then(key => { API_KEY = key.trim(); })
  .catch(e => console.error('API Key load error', e));

// Helper: Notify
function notify(message, type='success') {
  alert(message); // بسيط للتجربة، يمكن تطويره لاحقاً
}

// ====== Resize Tool ======
async function resizeImage() {
  const section = document.getElementById('resize');
  const input = section.querySelector('.image-input');
  const width = section.querySelector('.resize-width').value || 800;
  const height = section.querySelector('.resize-height').value || 800;
  const output = section.querySelector('.output-img');

  if(!input.files[0]) return notify('Select an image first', 'error');

  const img = new Image();
  img.src = URL.createObjectURL(input.files[0]);
  img.onload = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    await pica().resize(img, canvas);
    output.src = canvas.toDataURL();
    section.querySelector('.download-btn').disabled = false;
  };
}

// ====== Compress Tool ======
function compressImage() {
  const section = document.getElementById('compress');
  const input = section.querySelector('.image-input');
  const quality = Math.min(Math.max(section.querySelector('.compress-quality').value/100,0),1) || 0.8;
  const output = section.querySelector('.output-img');

  if(!input.files[0]) return notify('Select an image first', 'error');

  const img = new Image();
  img.src = URL.createObjectURL(input.files[0]);
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img,0,0);
    output.src = canvas.toDataURL('image/jpeg', quality);
    section.querySelector('.download-btn').disabled = false;
  };
}

// ====== Convert Tool ======
function convertImage() {
  const section = document.getElementById('convert');
  const input = section.querySelector('.image-input');
  const format = section.querySelector('.convert-format').value;
  const output = section.querySelector('.output-img');

  if(!input.files[0]) return notify('Select an image first', 'error');

  const img = new Image();
  img.src = URL.createObjectURL(input.files[0]);
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img,0,0);
    output.src = canvas.toDataURL(`image/${format}`);
    section.querySelector('.download-btn').disabled = false;
  };
}

// ====== Watermark Tool ======
function addWatermark() {
  const section = document.getElementById('watermark');
  const input = section.querySelector('.image-input');
  const text = section.querySelector('.watermark-text').value || '© ImageNova';
  const output = section.querySelector('.output-img');

  if(!input.files[0]) return notify('Select an image first', 'error');

  const img = new Image();
  img.src = URL.createObjectURL(input.files[0]);
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img,0,0);
    ctx.font = `${Math.floor(img.width/20)}px Arial`;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'right';
    ctx.fillText(text, img.width - 10, img.height - 10);
    output.src = canvas.toDataURL();
    section.querySelector('.download-btn').disabled = false;
  };
}

// ====== Remove Background ======
async function removeBackground() {
  const section = document.getElementById('removebg');
  const input = section.querySelector('.image-input');
  const output = section.querySelector('.output-img');

  if(!input.files[0]) return notify('Select an image first', 'error');
  if(!API_KEY) return notify('API Key not loaded', 'error');

  const formData = new FormData();
  formData.append('image_file', input.files[0]);
  formData.append('size', 'auto');

  try {
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': API_KEY },
      body: formData
    });
    if(!response.ok) throw new Error();
    const blob = await response.blob();
    output.src = URL.createObjectURL(blob);
    section.querySelector('.download-btn').disabled = false;
  } catch(e) {
    notify('Error removing background', 'error');
  }
}

// ====== Download Buttons ======
document.querySelectorAll('.download-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    const section = btn.closest('.tool-section');
    const img = section.querySelector('.output-img');
    if(!img.src) return notify('No image to download', 'error');

    const a = document.createElement('a');
    a.href = img.src;
    a.download = `ImageNova_${Date.now()}.png`;
    a.click();
  });
});
