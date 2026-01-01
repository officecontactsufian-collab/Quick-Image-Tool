// ==========================
// العناصر الأساسية
// ==========================
const imageInput = document.getElementById('imageInput');
const output = document.getElementById('output');
const downloadBtn = document.getElementById('downloadBtn');
const message = document.getElementById('message');

const resizeBtn = document.getElementById('resizeBtn');
const removeBgBtn = document.getElementById('removeBgBtn');
const compressBtn = document.getElementById('compressBtn');
const convertBtn = document.getElementById('convertBtn');

// ==========================
// Helper Functions
// ==========================

// عرض الرسائل للمستخدم
function notify(msg, type = 'success') {
    if (!message) return;
    message.innerText = msg;
    message.style.color = type === 'error' ? '#ef4444' : '#10b981';
}

// تحديث حالة الأزرار أثناء المعالجة
function setBtnState(btn, isLoading, text = '', iconClass = '') {
    if (!btn) return;
    const icon = btn.querySelector('i');
    const span = btn.querySelector('span');
    if (isLoading) {
        btn.disabled = true;
        if (icon) icon.className = 'fas fa-spinner fa-spin';
        if (span) span.innerText = ' Processing...';
    } else {
        btn.disabled = false;
        if (icon && iconClass) icon.className = iconClass;
        if (span && text) span.innerText = text;
    }
}

// ==========================
// رفع الصورة وعرضها
// ==========================
imageInput.addEventListener('change', () => {
    if (imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            output.src = e.target.result;
            downloadBtn.disabled = false;
            notify('✅ Image uploaded successfully');
        };
        reader.readAsDataURL(imageInput.files[0]);
    }
});

// ==========================
// Resize
// ==========================
async function resizeImage() {
    if (!imageInput.files[0]) return notify('❌ Please select an image first', 'error');

    setBtnState(resizeBtn, true);

    const img = new Image();
    img.src = URL.createObjectURL(imageInput.files[0]);
    img.onload = async () => {
        const canvas = document.createElement('canvas');
        const maxSize = 800; // أقصى حجم افتراضي
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        try {
            await pica().resize(img, canvas);
            output.src = canvas.toDataURL();
            notify(`✨ Image resized to ${canvas.width}x${canvas.height}`);
        } catch (e) {
            notify('❌ Failed to resize image', 'error');
        } finally {
            setBtnState(resizeBtn, false, ' Resize', 'fas fa-expand-arrows-alt');
        }
    };
}

// ==========================
// Remove Background
// ==========================
async function removeBackground() {
    if (!imageInput.files[0]) return notify('❌ Please select an image first', 'error');

    setBtnState(removeBgBtn, true);

    try {
        // Fetch API Key from external file
        const res = await fetch('API/remove-bg-js');
        const data = await res.json();
        const API_KEY = data.API_KEY;

        const formData = new FormData();
        formData.append('image_file', imageInput.files[0]);
        formData.append('size', 'auto');

        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: { 'X-Api-Key': API_KEY },
            body: formData
        });

        if (!response.ok) throw new Error();

        const blob = await response.blob();
        output.src = URL.createObjectURL(blob);
        notify('🪄 Background removed successfully');

    } catch (e) {
        console.error(e);
        notify('❌ Failed to remove background', 'error');
    } finally {
        setBtnState(removeBgBtn, false, ' Remove Background', 'fas fa-magic');
    }
}

// ==========================
// Compress
// ==========================
async function compressImage() {
    if (!output.src) return notify('❌ No image to compress', 'error');

    setBtnState(compressBtn, true);

    const img = new Image();
    img.src = output.src;
    img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // جودة الضغط 0.7 افتراضي
        const compressed = canvas.toDataURL('image/jpeg', 0.7);
        output.src = compressed;
        notify('💎 Image compressed successfully');
        setBtnState(compressBtn, false, ' Compress', 'fas fa-compress');
    };
}

// ==========================
// Convert
// ==========================
async function convertImage() {
    if (!output.src) return notify('❌ No image to convert', 'error');

    setBtnState(convertBtn, true);

    const format = prompt("Enter format (jpeg/png/webp):", "png");
    if (!format || !['jpeg','png','webp'].includes(format.toLowerCase())) {
        notify('❌ Invalid format', 'error');
        setBtnState(convertBtn, false, ' Convert', 'fas fa-file-export');
        return;
    }

    const img = new Image();
    img.src = output.src;
    img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        output.src = canvas.toDataURL(`image/${format}`);
        notify(`🎨 Image converted to ${format.toUpperCase()}`);
        setBtnState(convertBtn, false, ' Convert', 'fas fa-file-export');
    };
}

// ==========================
// Download
// ==========================
downloadBtn.addEventListener('click', () => {
    if (!output.src) return notify('❌ No image to download', 'error');
    const a = document.createElement('a');
    a.href = output.src;
    a.download = `Imagenova_${Date.now()}.png`;
    a.click();
    notify('📥 Image downloaded');
});

// ==========================
// ربط الأزرار
// ==========================
resizeBtn.addEventListener('click', resizeImage);
removeBgBtn.addEventListener('click', removeBackground);
compressBtn.addEventListener('click', compressImage);
convertBtn.addEventListener('click', convertImage);
