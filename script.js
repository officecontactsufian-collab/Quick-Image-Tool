// ----------------------------
// Elements
// ----------------------------
const imageInput = document.getElementById('imageInput');
const output = document.getElementById('output');
const downloadBtn = document.getElementById('downloadBtn');
const message = document.getElementById('message');
const resizeBtn = document.getElementById('resizeBtn');
const removeBgBtn = document.getElementById('removeBgBtn');
const compressBtn = document.getElementById('compressBtn');
const convertBtn = document.getElementById('convertBtn');
const watermarkBtn = document.getElementById('watermarkBtn');

// ----------------------------
// Helpers
// ----------------------------
function setBtnState(selector, isLoading, text, iconClass) {
    const btn = document.querySelector(selector);
    if (!btn) return;
    const icon = btn.querySelector('i');
    const span = btn.querySelector('span');
    
    if (isLoading) {
        btn.disabled = true;
        if (icon) icon.className = 'fas fa-spinner fa-spin';
        if (span) span.innerText = ' Processing...';
    } else {
        btn.disabled = false;
        if (icon) icon.className = iconClass;
        if (span) span.innerText = text;
    }
}

function notify(msg, type = 'success') {
    if (!message) return;
    message.innerText = msg;
    message.style.color = type === 'error' ? '#ef4444' : '#10b981';
}

// ----------------------------
// Load API Key (hidden)
// ----------------------------
async function getApiKey() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/Soufiyan/QuickImageTool/main/API/remove-bg.js');
        const key = await response.text();
        return key.trim();
    } catch {
        notify('❌ Failed to load API Key', 'error');
        return null;
    }
}

// ----------------------------
// Image Upload
// ----------------------------
if(imageInput) {
    imageInput.addEventListener('change', function() {
        if (this.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                output.src = e.target.result;
                if(downloadBtn) downloadBtn.disabled = false;
                notify('✅ Image uploaded successfully');
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
}

// ----------------------------
// Resize
// ----------------------------
async function resizeImage() {
    if (!imageInput.files[0]) return notify('❌ Please select an image first', 'error');
    setBtnState('#resizeBtn', true, '', '');
    const width = parseInt(prompt('Enter width in px:', '800')) || 800;
    const height = parseInt(prompt('Enter height in px:', '800')) || 800;

    const img = new Image();
    img.src = URL.createObjectURL(imageInput.files[0]);
    img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        try {
            await pica().resize(img, canvas);
            output.src = canvas.toDataURL();
            notify('✨ Image resized successfully');
        } catch {
            notify('❌ Failed to resize image', 'error');
        } finally {
            setBtnState('#resizeBtn', false, ' Resize', 'fas fa-expand-arrows-alt');
        }
    };
}

// ----------------------------
// Remove Background
// ----------------------------
async function removeBackground() {
    if (!imageInput.files[0]) return notify('❌ Please select an image first', 'error');
    setBtnState('#removeBgBtn', true, '', '');

    try {
        const API_KEY = await getApiKey();
        if (!API_KEY) throw new Error('No API Key');

        const formData = new FormData();
        formData.append('image_file', imageInput.files[0]);
        formData.append('size', 'auto');

        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: { 'X-Api-Key': API_KEY },
            body: formData
        });

        if (!response.ok) throw new Error('API error or quota exceeded');
        const blob = await response.blob();
        output.src = URL.createObjectURL(blob);
        notify('🪄 Background removed successfully');
    } catch (e) {
        console.error(e);
        notify('❌ Failed to remove background', 'error');
    } finally {
        setBtnState('#removeBgBtn', false, ' Remove Background', 'fas fa-magic');
    }
}

// ----------------------------
// Compress
// ----------------------------
async function compressImage() {
    if (!imageInput.files[0]) return notify('❌ Please select an image first', 'error');
    setBtnState('#compressBtn', true, '', '');
    const quality = parseFloat(prompt('Enter quality (0.1 to 1):', '0.8')) || 0.8;

    const img = new Image();
    img.src = URL.createObjectURL(imageInput.files[0]);
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        output.src = canvas.toDataURL('image/jpeg', quality);
        notify(`🔧 Image compressed to ${Math.round(quality*100)}% quality`);
        setBtnState('#compressBtn', false, ' Compress', 'fas fa-compress');
    };
}

// ----------------------------
// Convert
// ----------------------------
function convertImage() {
    if (!imageInput.files[0]) return notify('❌ Please select an image first', 'error');
    setBtnState('#convertBtn', true, '', '');
    const format = prompt('Enter format (jpg/png/webp):', 'png').toLowerCase() || 'png';

    const img = new Image();
    img.src = output.src || URL.createObjectURL(imageInput.files[0]);
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        output.src = canvas.toDataURL(`image/${format}`);
        notify(`🔄 Image converted to ${format.toUpperCase()}`);
        setBtnState('#convertBtn', false, ' Convert', 'fas fa-exchange-alt');
    };
}

// ----------------------------
// Add Watermark
// ----------------------------
function addWatermark() {
    if (!imageInput.files[0]) return notify('❌ Please select an image first', 'error');
    setBtnState('#watermarkBtn', true, '', '');

    const watermark = prompt('Enter watermark text:', '© Imagenova') || '© Imagenova';
    const img = new Image();
    img.src = output.src || URL.createObjectURL(imageInput.files[0]);
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        ctx.font = `${Math.round(img.width/20)}px Arial`;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'right';
        ctx.fillText(watermark, img.width-10, img.height-10);
        output.src = canvas.toDataURL();
        notify('💧 Watermark added successfully');
        setBtnState('#watermarkBtn', false, ' Watermark', 'fas fa-water');
    };
}

// ----------------------------
// Download
// ----------------------------
if(downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        if(!output.src) return notify('❌ No image to download', 'error');
        const a = document.createElement('a');
        a.href = output.src;
        a.download = `Imagenova_${Date.now()}.png`;
        a.click();
        notify('📥 Image downloaded');
    });
}

// ----------------------------
// Bind Buttons
// ----------------------------
if(resizeBtn) resizeBtn.addEventListener('click', resizeImage);
if(removeBgBtn) removeBgBtn.addEventListener('click', removeBackground);
if(compressBtn) compressBtn.addEventListener('click', compressImage);
if(convertBtn) convertBtn.addEventListener('click', convertImage);
if(watermarkBtn) watermarkBtn.addEventListener('click', addWatermark);
