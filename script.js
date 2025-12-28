const imageInput = document.getElementById('imageInput');
const output = document.getElementById('output');
const downloadBtn = document.getElementById('downloadBtn');
const message = document.getElementById('message');

const API_KEY = 'gmE4r63VDu3y98NpkNcidxdt';

function setBtnState(selector, isLoading, text, iconClass) {
    const btn = document.querySelector(selector);
    const icon = btn.querySelector('i');
    const span = btn.querySelector('span');
    
    if (isLoading) {
        btn.disabled = true;
        icon.className = 'fas fa-spinner fa-spin';
        span.innerText = ' جاري المعالجة...';
    } else {
        btn.disabled = false;
        icon.className = iconClass;
        span.innerText = text;
    }
}

function notify(msg, type = 'success') {
    message.innerText = msg;
    message.style.color = type === 'error' ? '#ef4444' : '#10b981';
}

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

async function resizeImage() {
    if (!imageInput.files[0]) return notify('❌ اختر صورة أولاً', 'error');
    setBtnState('.btn-secondary', true);
    
    const img = new Image();
    img.src = URL.createObjectURL(imageInput.files[0]);
    img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 800; canvas.height = 800;
        try {
            await pica().resize(img, canvas);
            output.src = canvas.toDataURL();
            notify('✨ تم تغيير الحجم بنجاح');
        } catch (e) { notify('❌ فشل تغيير الحجم', 'error'); }
        finally { setBtnState('.btn-secondary', false, ' تغيير الحجم', 'fas fa-expand-arrows-alt'); }
    };
}

async function removeBackground() {
    if (!imageInput.files[0]) return notify('❌ اختر صورة أولاً', 'error');
    setBtnState('#removeBgBtn', true);
    
    const formData = new FormData();
    formData.append('image_file', imageInput.files[0]);
    formData.append('size', 'auto');

    try {
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: { 'X-Api-Key': API_KEY },
            body: formData
        });

        if (!response.ok) {
            const errMsg = await response.text();
            throw new Error(errMsg || 'API Error');
        }

        const blob = await response.blob();
        output.src = URL.createObjectURL(blob);
        notify('🪄 تمت إزالة الخلفية بنجاح');
    } catch (e) {
        notify(`❌ خطأ في إزالة الخلفية: ${e.message}`, 'error');
    } finally {
        setBtnState('#removeBgBtn', false, ' إزالة الخلفية', 'fas fa-magic');
    }
}

downloadBtn.addEventListener('click', () => {
    if (!output.src) return notify('❌ لا توجد صورة للتحميل', 'error');

    fetch(output.src)
        .then(res => res.blob())
        .then(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `QuickTool_${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            notify('📥 تم التحميل');
        })
        .catch(() => notify('❌ فشل التحميل', 'error'));
});
