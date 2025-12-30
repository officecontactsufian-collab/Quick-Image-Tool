// العناصر الأساسية
const imageInput = document.getElementById('imageInput');
const output = document.getElementById('output');
const downloadBtn = document.getElementById('downloadBtn');
const message = document.getElementById('message');

// مفتاح API لإزالة الخلفية
const API_KEY = 'gmE4r63VDu3y98NpkNcidxdt';

// دالة لتغيير حالة الزر أثناء المعالجة
function setBtnState(selector, isLoading, text, iconClass) {
    const btn = document.querySelector(selector);
    if (!btn) return;
    const icon = btn.querySelector('i');
    const span = btn.querySelector('span');
    
    if (isLoading) {
        btn.disabled = true;
        if (icon) icon.className = 'fas fa-spinner fa-spin';
        if (span) span.innerText = ' جاري المعالجة...';
    } else {
        btn.disabled = false;
        if (icon) icon.className = iconClass;
        if (span) span.innerText = text;
    }
}

// دالة لإظهار الرسائل للمستخدم
function notify(msg, type = 'success') {
    message.innerText = msg;
    message.style.color = type === 'error' ? '#ef4444' : '#10b981';
}

// رفع الصورة وعرضها
imageInput.addEventListener('change', function() {
    if (this.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            output.src = e.target.result;
            downloadBtn.disabled = false;
            notify('✅ تم رفع الصورة بنجاح');
        };
        reader.readAsDataURL(this.files[0]);
    }
});

// تغيير حجم الصورة إلى 800x800 باستخدام pica
async function resizeImage() {
    if (!imageInput.files[0]) return notify('❌ اختر صورة أولاً', 'error');
    setBtnState('.btn-secondary', true, '', '');

    const img = new Image();
    img.src = URL.createObjectURL(imageInput.files[0]);
    img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 800;
        try {
            await pica().resize(img, canvas);
            output.src = canvas.toDataURL();
            notify('✨ تم تغيير الحجم بنجاح');
        } catch (e) {
            notify('❌ فشل تغيير الحجم', 'error');
        } finally {
            setBtnState('.btn-secondary', false, ' تغيير الحجم', 'fas fa-expand-arrows-alt');
        }
    };
}

// إزالة الخلفية باستخدام API
async function removeBackground() {
    if (!imageInput.files[0]) return notify('❌ اختر صورة أولاً', 'error');
    setBtnState('#removeBgBtn', true, '', '');

    const formData = new FormData();
    formData.append('image_file', imageInput.files[0]);
    formData.append('size', 'auto');

    try {
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: { 'X-Api-Key': API_KEY },
            body: formData
        });
        if (!response.ok) throw new Error();
        const blob = await response.blob();
        output.src = URL.createObjectURL(blob);
        notify('🪄 تمت إزالة الخلفية بنجاح');
    } catch (e) {
        notify('❌ خطأ في الـ API أو الرصيد انتهى', 'error');
    } finally {
        setBtnState('#removeBgBtn', false, ' إزالة الخلفية', 'fas fa-magic');
    }
}

// تحميل الصورة
downloadBtn.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = output.src;
    a.download = `QuickTool_${Date.now()}.png`;
    a.click();
    notify('📥 تم التحميل');
});
