// ---------------------------
// ELEMENTS
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

// ---------------------------
// STATE
// ---------------------------
let currentFile = null;
let currentFormat = 'png';
let originalFileName = 'image';

// ---------------------------
// UTILITIES
// ---------------------------
function notify(msg, type = 'success') {
    message.innerText = msg;
    message.style.color = type === 'error' ? 'var(--danger)' : 'var(--success)';
    // Clear message after 5 seconds
    setTimeout(() => { message.innerText = ''; }, 5000);
}

function toggleButtons(disabled) {
    allActionBtns.forEach(btn => btn.disabled = disabled);
}

function setLoading(btn, isLoading, originalText, iconClass) {
    const icon = btn.querySelector('i');
    const span = btn.querySelector('span');
    
    if (isLoading) {
        toggleButtons(true); // Disable all
        if(icon) icon.className = 'fas fa-spinner fa-spin';
        if(span) span.innerText = ' Processing...';
    } else {
        toggleButtons(false); // Enable all
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
            handleFile(this.files[0]);
        }
    });
}

function handleFile(file) {
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
        
        // Enable buttons
        toggleButtons(false);
        downloadBtn.disabled = false;
        
        notify(`✅ Loaded: ${file.name}`);
    };
    reader.readAsDataURL(file);
}

// ---------------------------
// 1. RESIZE IMAGE (Using Pica for High Quality)
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
            // Check if Pica is loaded
            if (typeof pica === 'undefined') throw new Error("Resize library not loaded.");

            const picaResizer = pica();
            await picaResizer.resize(img, canvas);
            
            output.src = canvas.toDataURL(`image/${currentFormat}`);
            notify(`✨ Resized to ${newWidth}x${newHeight}px`);
        } catch(e) {
            console.error(e);
            notify('❌ Resize failed. Try reloading.', 'error');
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

    const qualityInput = prompt("Enter quality (0.1 to 1.0). Lower is smaller file size.", "0.7");
    let quality = parseFloat(qualityInput);
    if(isNaN(quality) || quality < 0.1 || quality > 1) return notify('❌ Invalid quality', 'error');

    setLoading(compressBtn, true, '', '');

    const img = new Image();
    img.src = output.src;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        // Handle transparency for JPEGs (fill white)
        if (currentFormat === 'jpeg' || currentFormat === 'jpg') {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(img, 0, 0);
        
        output.src = canvas.toDataURL(`image/${currentFormat}`, quality);
        notify(`✨ Compressed with quality ${quality}`);
        setLoading(compressBtn, false, ' Compress', 'fas fa-compress');
    };
}

// ---------------------------
// 3. CONVERT FORMAT
// ---------------------------
function convertImage() {
    if(!output.src) return;

    const newFormat = prompt("Convert to: png, jpeg, or webp?", "jpeg");
    if(!newFormat) return;
    
    const validFormats = ['png', 'jpeg', 'jpg', 'webp'];
    if(!validFormats.includes(newFormat.toLowerCase())) {
        return notify('❌ Unsupported format', 'error');
    }

    setLoading(convertBtn, true, '', '');

    const img = new Image();
    img.src = output.src;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        // Handle transparency if converting PNG -> JPEG
        if (newFormat === 'jpeg' || newFormat === 'jpg') {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);
        
        currentFormat = newFormat.toLowerCase();
        output.src = canvas.toDataURL(`image/${currentFormat}`);
        
        notify(`🔄 Converted to ${currentFormat.toUpperCase()}`);
        setLoading(convertBtn, false, ' Convert', 'fas fa-exchange-alt');
    };
}

// ---------------------------
// 4. REMOVE BACKGROUND (API)
// ---------------------------
async function removeBackground() {
    if(!currentFile) return notify('❌ Please upload an image first', 'error');
    
    // تأكد من أن الملف ليس ضخماً جداً (Vercel Limit 4.5MB)
    if (currentFile.size > 4.5 * 1024 * 1024) {
        return notify('❌ Image too large. Max 4.5MB for this feature.', 'error');
    }

    setLoading(removeBgBtn, true, '', '');

    try {
        const formData = new FormData();
        formData.append('image_file', currentFile);

        const response = await fetch('/api/remove-bg', {
            method: 'POST',
            body: formData
        });

        // هنا التغيير المهم: نتحقق من نوع المحتوى قبل التحويل
        const contentType = response.headers.get("content-type");

        if (response.ok && contentType && contentType.includes("image")) {
            // نجاح: استلام الصورة
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            output.src = url;
            currentFormat = 'png';
            notify('🪄 Background removed successfully!');
        } else {
            // فشل: محاولة قراءة الخطأ كنص أو JSON
            const errorText = await response.text();
            let errorMessage = 'Unknown Server Error';
            try {
                // محاولة تحويل النص إلى JSON
                const jsonError = JSON.parse(errorText);
                errorMessage = jsonError.error;
            } catch(e) {
                // إذا فشل التحويل، استخدم النص كما هو (غالباً هذا هو سبب مشكلتك الحالية)
                errorMessage = errorText; 
            }
            throw new Error(errorMessage);
        }

    } catch(e) {
        console.error("Full Error Details:", e);
        notify(`❌ Error: ${e.message}`, 'error');
    } finally {
        setLoading(removeBgBtn, false, ' Remove BG', 'fas fa-magic');
    }
}

// ---------------------------
// DOWNLOAD
// ---------------------------
downloadBtn.addEventListener('click', () => {
    if(!output.src) return;
    const link = document.createElement('a');
    link.download = `${originalFileName}_edited.${currentFormat}`;
    link.href = output.src;
    link.click();
    notify('📥 Downloading...');
});

// ---------------------------
// LISTENERS
// ---------------------------
resizeBtn.addEventListener('click', resizeImage);
compressBtn.addEventListener('click', compressImage);
convertBtn.addEventListener('click', convertImage);
removeBgBtn.addEventListener('click', removeBackground);
