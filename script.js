// ---------------------------
// ELEMENTS & VARIABLES
// ---------------------------
const imageInput = document.getElementById('imageInput');
const output = document.getElementById('output');
const downloadBtn = document.getElementById('downloadBtn');
const message = document.getElementById('message');
const placeholderText = document.getElementById('placeholderText');

const resizeBtn = document.getElementById('resizeBtn');
const compressBtn = document.getElementById('compressBtn');
const convertBtn = document.getElementById('convertBtn');
const removeBgBtn = document.getElementById('removeBgBtn');
const convertFormat = document.getElementById('convertFormat');

const allActionBtns = [resizeBtn, compressBtn, convertBtn, removeBgBtn];

let currentFile = null;
let currentFormat = 'png';
let originalFileName = 'image';

// ---------------------------
// UTILITIES
// ---------------------------
function notify(msg, type = 'success') {
    if(!message) return;
    message.innerText = msg;
    message.style.color = type === 'error' ? 'var(--danger)' : 'var(--success)';
    setTimeout(() => { message.innerText = ''; }, 5000);
}

function toggleButtons(disabled) {
    allActionBtns.forEach(btn => { if(btn) btn.disabled = disabled; });
}

function setLoading(btn, isLoading, originalText, iconClass) {
    if(!btn) return;
    const icon = btn.querySelector('i');
    const span = btn.querySelector('span');
    
    if (isLoading) {
        toggleButtons(true);
        if(icon && btn.id !== 'removeBgBtn') icon.className = 'fas fa-spinner fa-spin';
        if(span) span.innerText = ' Processing...';
    } else {
        toggleButtons(false);
        if(icon) icon.className = iconClass;
        if(span) span.innerText = originalText;
    }
}

// ---------------------------
// UPLOAD HANDLER
// ---------------------------
if(imageInput) {
    imageInput.addEventListener('change', function() {
        if(this.files && this.files[0]) {
            const file = this.files[0];
            if (!file.type.startsWith('image/')) {
                return notify('❌ Please upload a valid image file', 'error');
            }

            currentFile = file;
            originalFileName = file.name.split('.')[0];
            currentFormat = file.type.split('/')[1];

            const reader = new FileReader();
            reader.onload = (e) => {
                output.src = e.target.result;
                output.style.display = 'block';
                if(placeholderText) placeholderText.style.display = 'none';
                toggleButtons(false);
                if(downloadBtn) downloadBtn.disabled = false;
                notify(`✅ Loaded: ${file.name}`);
            };
            reader.readAsDataURL(file);
        }
    });
}

// ---------------------------
// RESIZE
// ---------------------------
async function resizeImage() {
    if(!output.src) return;
    const img = new Image();
    img.src = output.src;
    img.onload = async () => {
        const newWidth = prompt(`Current width: ${img.width}px. Enter new width:`, img.width);
        if(!newWidth || isNaN(newWidth)) return;
        
        const aspectRatio = img.height / img.width;
        const newHeight = Math.round(newWidth * aspectRatio);

        setLoading(resizeBtn, true, '', '');
        const canvas = document.createElement('canvas');
        canvas.width = parseInt(newWidth);
        canvas.height = newHeight;

        try {
            if (typeof pica === 'undefined') throw new Error("Resize lib missing");
            await pica().resize(img, canvas);
            output.src = canvas.toDataURL(`image/${currentFormat}`);
            notify(`✨ Resized to ${newWidth}x${newHeight}px`);
        } catch(e) {
            notify('❌ Resize failed', 'error');
        } finally {
            setLoading(resizeBtn, false, ' Resize', 'fas fa-expand-arrows-alt');
        }
    };
}

// ---------------------------
// COMPRESS
// ---------------------------
function compressImage() {
    if(!output.src) return;
    const quality = prompt("Enter quality (0.1 - 1.0)", "0.7");
    if(!quality) return;

    setLoading(compressBtn, true, '', '');
    const img = new Image();
    img.src = output.src;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (currentFormat.includes('jp')) { ctx.fillStyle="#FFF"; ctx.fillRect(0,0,canvas.width,canvas.height); }
        ctx.drawImage(img, 0, 0);
        output.src = canvas.toDataURL(`image/${currentFormat}`, parseFloat(quality));
        notify(`✨ Compressed`);
        setLoading(compressBtn, false, ' Compress', 'fas fa-compress');
    };
}

// ---------------------------
// CONVERT
// ---------------------------
function convertImage() {
    if(!output.src) return;
    const format = convertFormat.value;
    if(!format) return;

    setLoading(convertBtn, true, '', '');
    const img = new Image();
    img.src = output.src;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if(format.includes('jp')) { ctx.fillStyle="#FFF"; ctx.fillRect(0,0,canvas.width,canvas.height); }
        ctx.drawImage(img, 0, 0);
        currentFormat = format.toLowerCase();
        output.src = canvas.toDataURL(`image/${currentFormat}`);
        notify(`🔄 Converted to ${currentFormat.toUpperCase()}`);
        setLoading(convertBtn, false, ' Convert', 'fas fa-exchange-alt');
    };
}

// ---------------------------
// REMOVE BACKGROUND
// ---------------------------
removeBgBtn.addEventListener('click', async () => {
  if (!currentFile) return notify('❌ Please upload an image first', 'error');

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

  } catch (e) {
    console.error(e);
    notify('❌ Failed to remove background', 'error');
  }
});

// ---------------------------
// DOWNLOAD
// ---------------------------
if(downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        if(!output.src) return;
        const a = document.createElement('a');
        a.download = `${originalFileName}_imagenova.${currentFormat}`;
        a.href = output.src;
        a.click();
    });
}

// ---------------------------
// LISTENERS
// ---------------------------
if(resizeBtn) resizeBtn.addEventListener('click', resizeImage);
if(compressBtn) compressBtn.addEventListener('click', compressImage);
if(convertBtn) convertBtn.addEventListener('click', convertImage);
