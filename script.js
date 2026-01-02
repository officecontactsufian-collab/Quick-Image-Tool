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
        if(icon) icon.className = 'fas fa-spinner fa-spin';
        if(span) span.innerText = ' Processing...';
    } else {
        toggleButtons(false);
        if(icon) icon.className = iconClass;
        if(span) span.innerText = originalText;
    }
}

// ---------------------------
// HELPER: Auto-Compress for API (Fixes Vercel 4.5MB Limit)
// ---------------------------
async function prepareImageForAPI(file) {
    // 1. إذا كان الملف أقل من 3.5 ميجابايت، أرسله كما هو
    if (file.size < 3.5 * 1024 * 1024) return file;

    notify('⚠️ Image is large, optimizing before upload...', 'info');

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            
            // حساب أبعاد جديدة (Max 1920px) للحفاظ على الجودة وتقليل الحجم
            let width = img.width;
            let height = img.height;
            const maxSize = 1920;

            if (width > height) {
                if (width > maxSize) {
                    height *= maxSize / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width *= maxSize / height;
                    height = maxSize;
                }
            }

            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // التحويل إلى JPEG بجودة 80% لضمان أن الحجم أقل من 4MB
            canvas.toBlob((blob) => {
                if (blob) {
                    console.log(`Original: ${file.size}, Compressed: ${blob.size}`);
                    resolve(blob);
                } else {
                    reject(new Error("Compression failed"));
                }
            }, 'image/jpeg', 0.8);
        };
        img.onerror = (e) => reject(e);
    });
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
// 1. RESIZE IMAGE
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
// 2. COMPRESS IMAGE
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
// 3. CONVERT FORMAT
// ---------------------------
function convertImage() {
    if(!output.src) return;
    const format = prompt("Convert to: png, jpeg, webp", "jpeg");
    if(!format) return;

    setLoading(convertBtn, true, '', '');
    const img = new Image();
    img.src = output.src;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (format.includes('jp')) { ctx.fillStyle="#FFF"; ctx.fillRect(0,0,canvas.width,canvas.height); }
        ctx.drawImage(img, 0, 0);
        currentFormat = format.toLowerCase();
        output.src = canvas.toDataURL(`image/${currentFormat}`);
        notify(`🔄 Converted to ${currentFormat}`);
        setLoading(convertBtn, false, ' Convert', 'fas fa-exchange-alt');
    };
}

async function removeBackground() {
    if(!currentFile) return notify('❌ Please upload an image first', 'error');

    setLoading(removeBgBtn, true, '', '');

    try {
        const response = await fetch('/api/remove-bg', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: 'hello' })
        });

        const data = await response.json();
        console.log(data); // شوف شنو راجع من السيرفر
        notify(`✅ Server responded: ${JSON.stringify(data)}`);

    } catch(e) {
        notify(`❌ Error: ${e.message}`, 'error');
    } finally {
        setLoading(removeBgBtn, false, ' Remove BG', 'fas fa-magic');
    }
}
// ---------------------------
// DOWNLOAD & LISTENERS
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

if(resizeBtn) resizeBtn.addEventListener('click', resizeImage);
if(compressBtn) compressBtn.addEventListener('click', compressImage);
if(convertBtn) convertBtn.addEventListener('click', convertImage);
if(removeBgBtn) removeBgBtn.addEventListener('click', removeBackground);
