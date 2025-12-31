// العناصر الأساسية
const imageInput = document.getElementById('imageInput');
const output = document.getElementById('output');
const downloadBtn = document.getElementById('downloadBtn');
const message = document.getElementById('message');
const resizeBtn = document.getElementById('resizeBtn');
const removeBgBtn = document.getElementById('removeBgBtn');

// مفتاح API لإزالة الخلفية
const API_KEY = 'gmE4r63VDu3y98NpkNcidxdt';

// دالة لتغيير حالة الزر أثناء المعالجة
function setBtnState(btn, isLoading, text, iconClass) {
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
    if (!message) return;
    message.innerText = msg;
    message.style.color = type === 'error' ? '#ef4444' : '#10b981';
}

// رفع الصورة وعرضها
if (imageInput) {
    imageInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (output) output.src = e.target.result;
                if (downloadBtn) downloadBtn.disabled = false;
                notify('✅ تم رفع الصورة بنجاح');
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
}

// تغيير حجم الصورة إلى 800x800 باستخدام pica
if (resizeBtn) {
    resizeBtn.addEventListener('click', async () => {
        if (!imageInput.files[0]) return notify('❌ اختر صورة أولاً', 'error');
        setBtnState(resizeBtn, true, '', '');
        
        const img = new Image();
        img.src = URL.createObjectURL(imageInput.files[0]);
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 800;
            try {
                await pica().resize(img, canvas);
                if (output) output.src = canvas.toDataURL();
                notify('✨ تم تغيير الحجم بنجاح');
            } catch (err) {
                notify('❌ فشل تغيير الحجم', 'error');
            } finally {
                setBtnState(resizeBtn, false, 'تغيير الحجم', 'fas fa-expand-arrows-alt');
            }
        };
    });
}

// إزالة الخلفية باستخدام API
if (removeBgBtn) {
    removeBgBtn.addEventListener('click', async () => {
        if (!imageInput.files[0]) return notify('❌ اختر صورة أولاً', 'error');
        setBtnState(removeBgBtn, true, '', '');

        const formData = new FormData();
        formData.append('image_file', imageInput.files[0]);
        formData.append('size', 'auto');

        try {
            const response = await fetch('https://api.remove.bg/v1.0/removebg', {
                method: 'POST',
                headers: { 'X-Api-Key': API_KEY },
                body: formData
            });

            if (!response.ok) throw new Error('API Error');

            const blob = await response.blob();
            if (output) output.src = URL.createObjectURL(blob);
            notify('🪄 تمت إزالة الخلفية بنجاح');
        } catch (err) {
            notify('❌ خطأ في الـ API أو الرصيد انتهى', 'error');
        } finally {
            setBtnState(removeBgBtn, false, 'إزالة الخلفية', 'fas fa-magic');
        }
    });
}

// تحميل الصورة
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        if (!output || !output.src) return notify('❌ لا توجد صورة للتحميل', 'error');
        const a = document.createElement('a');
        a.href = output.src;
        a.download = `QuickTool_${Date.now()}.png`;
        a.click();
        notify('📥 تم التحميل');
    });
}
