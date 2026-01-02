// العناصر الأساسية
const imageInput = document.getElementById('imageInput');
const output = document.getElementById('output');
const downloadBtn = document.getElementById('downloadBtn');
const message = document.getElementById('message');

const resizeBtn = document.getElementById('resizeBtn');
const compressBtn = document.getElementById('compressBtn');
const convertBtn = document.getElementById('convertBtn');
const removeBgBtn = document.getElementById('removeBgBtn');

// Default settings
let currentFile = null;
let currentFormat = 'png';
let currentQuality = 0.9; // For compression

// إشعار للمستخدم
function notify(msg, type = 'success') {
    if (!message) return;
    message.innerText = msg;
    message.style.color = type === 'error' ? '#ef4444' : '#10b981';
}

// تفعيل زر التحميل
function enableDownload() {
    if(downloadBtn) downloadBtn.disabled = !output.src;
}

// تحميل الصورة
if(downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        if(!output.src) return notify('❌ No image to download', 'error');
        const a = document.createElement('a');
        a.href = output.src;
        a.download = `Imagenova_${Date.now()}.${currentFormat}`;
        a.click();
        notify('📥 Image downloaded');
    });
}

// رفع الصورة وعرضها
if(imageInput) {
    imageInput.addEventListener('change', function() {
        if (this.files[0]) {
            currentFile = this.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                output.src = e.target.result;
                enableDownload();
                notify('✅ Image uploaded successfully');
            };
            reader.readAsDataURL(currentFile);
        }
    });
}

// مساعدة الزر أثناء المعالجة
function setBtnState(btn, isLoading, text, iconClass) {
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

/* ---------------------------
        أداة Resize
---------------------------- */
async function resizeImage() {
    if(!currentFile) return notify('❌ Please select an image first', 'error');
    setBtnState(resizeBtn, true, '', '');

    const img = new Image();
    img.src = URL.createObjectURL(currentFile);
    img.onload = async () => {
        const canvas = document.createElement('canvas');

        // طلب المستخدم للأبعاد
        const width = prompt("Enter new width (px)", img.width);
        const height = prompt("Enter new height (px)", img.height);

        canvas.width = width || img.width;
        canvas.height = height || img.height;

        try {
            await pica().resize(img, canvas);
            output.src = canvas.toDataURL(currentFormat, currentQuality);
            notify('✨ Image resized successfully');
            enableDownload();
        } catch(e) {
            notify('❌ Failed to resize image', 'error');
        } finally {
            setBtnState(resizeBtn, false, ' Resize', 'fas fa-expand-arrows-alt');
        }
    };
}

/* ---------------------------
        أداة Compress
---------------------------- */
async function compressImage() {
    if(!currentFile) return notify('❌ Please select an image first', 'error');
    setBtnState(compressBtn, true, '', '');

    const img = new Image();
    img.src = URL.createObjectURL(currentFile);
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img,0,0);

        // طلب الجودة من المستخدم
        const quality = prompt("Enter compression quality (0.1 to 1.0)", currentQuality);
        currentQuality = parseFloat(quality) || currentQuality;

        output.src = canvas.toDataURL(currentFormat, currentQuality);
        notify('✨ Image compressed successfully');
        enableDownload();
        setBtnState(compressBtn, false, ' Compress', 'fas fa-compress');
    };
}

/* ---------------------------
        أداة Convert
---------------------------- */
async function convertImage() {
    if(!currentFile) return notify('❌ Please select an image first', 'error');
    setBtnState(convertBtn, true, '', '');

    const format = prompt("Enter format: png / jpeg / webp", currentFormat);
    if(!format) return setBtnState(convertBtn, false, ' Convert', 'fas fa-exchange-alt');

    currentFormat = format.toLowerCase();

    const img = new Image();
    img.src = URL.createObjectURL(currentFile);
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img,0,0);

        output.src = canvas.toDataURL(currentFormat, currentQuality);
        notify(`🔄 Converted to ${currentFormat}`);
        enableDownload();
        setBtnState(convertBtn, false, ' Convert', 'fas fa-exchange-alt');
    };
}

/* ---------------------------
        Remove Background
---------------------------- */
async function removeBackground() {
  if(!currentFile) return notify('❌ Please select an image first', 'error');
  setBtnState(removeBgBtn, true, '', '');

  try {
    const formData = new FormData();
    formData.append('image_file', currentFile);

    const response = await fetch('/api/remove-bg.js', {
      method: 'POST',
      body: formData
    });

    if(!response.ok) throw new Error();
    const blob = await response.blob();
    output.src = URL.createObjectURL(blob);
    notify('🪄 Background removed successfully');
    enableDownload();

  } catch(e) {
    notify('❌ Remove background failed', 'error');
  } finally {
    setBtnState(removeBgBtn, false, ' Remove Background', 'fas fa-magic');
  }
}

// ربط الأزرار
if(resizeBtn) resizeBtn.addEventListener('click', resizeImage);
if(compressBtn) compressBtn.addEventListener('click', compressImage);
if(convertBtn) convertBtn.addEventListener('click', convertImage);
if(removeBgBtn) removeBgBtn.addEventListener('click', removeBackground);
