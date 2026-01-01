// العناصر الأساسية
const imageInput = document.getElementById('imageInput');
const output = document.getElementById('output');
const downloadBtn = document.getElementById('downloadBtn');
const message = document.getElementById('message');

const resizeBtn = document.getElementById('resizeBtn');
const compressBtn = document.getElementById('compressBtn');
const convertBtn = document.getElementById('convertBtn');
const removeBgBtn = document.getElementById('removeBgBtn');
const watermarkBtn = document.getElementById('watermarkBtn');

// API Key مخفي (import من GitHub)
async function getApiKey() {
    const res = await fetch('/API/remove-bg-js');
    const data = await res.json();
    return data.key; // يجب أن يكون JSON يحتوي { "key": "..." }
}

// دالة لإظهار الرسائل
function notify(msg, type='success') {
    if(!message) return;
    message.innerText = msg;
    message.style.color = type==='error' ? '#ef4444' : '#10b981';
}

// رفع الصورة وعرضها
imageInput?.addEventListener('change', function() {
    if(this.files[0]){
        const reader = new FileReader();
        reader.onload = (e) => {
            output.src = e.target.result;
            downloadBtn.disabled = false;
            notify('✅ Image uploaded successfully');
        };
        reader.readAsDataURL(this.files[0]);
    }
});

// Resize مع اختيار الحجم
async function resizeImage() {
    if(!imageInput.files[0]) return notify('❌ Please select an image first','error');

    const width = prompt('Enter width (px):', '800');
    const height = prompt('Enter height (px):', '800');
    if(!width || !height) return;

    const img = new Image();
    img.src = URL.createObjectURL(imageInput.files[0]);
    img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = parseInt(width);
        canvas.height = parseInt(height);
        await pica().resize(img, canvas);
        output.src = canvas.toDataURL();
        notify('✨ Image resized successfully');
    };
}

// Compress مع اختيار الجودة
function compressImage() {
    if(!imageInput.files[0]) return notify('❌ Please select an image first','error');
    const quality = prompt('Enter quality (0.1 to 1):', '0.8');
    const img = new Image();
    img.src = URL.createObjectURL(imageInput.files[0]);
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img,0,0);
        output.src = canvas.toDataURL('image/jpeg', parseFloat(quality));
        notify('✨ Image compressed successfully');
    };
}

// Convert مع اختيار الصيغة
function convertImage() {
    if(!imageInput.files[0]) return notify('❌ Please select an image first','error');
    const format = prompt('Enter format (png/jpeg/webp):','png');
    const img = new Image();
    img.src = URL.createObjectURL(imageInput.files[0]);
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img,0,0);
        output.src = canvas.toDataURL('image/'+format);
        notify('✨ Image converted successfully');
    };
}

// Remove Background باستخدام API
async function removeBackground() {
    if(!imageInput.files[0]) return notify('❌ Please select an image first','error');
    notify('🪄 Removing background...');
    const key = await getApiKey();
    const formData = new FormData();
    formData.append('image_file', imageInput.files[0]);
    formData.append('size','auto');

    try {
        const res = await fetch('https://api.remove.bg/v1.0/removebg',{
            method:'POST',
            headers:{'X-Api-Key':key},
            body:formData
        });
        if(!res.ok) throw new Error();
        const blob = await res.blob();
        output.src = URL.createObjectURL(blob);
        notify('🪄 Background removed successfully');
    } catch(e) {
        notify('❌ API error or quota exceeded','error');
    }
}

// Watermark
function addWatermark() {
    if(!imageInput.files[0]) return notify('❌ Please select an image first','error');
    const text = prompt('Enter watermark text:','© Imagenova');
    if(!text) return;
    const img = new Image();
    img.src = URL.createObjectURL(imageInput.files[0]);
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img,0,0);
        ctx.font = '48px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.textAlign = 'right';
        ctx.fillText(text, canvas.width - 20, canvas.height - 20);
        output.src = canvas.toDataURL();
        notify('✨ Watermark added successfully');
    };
}

// Download
downloadBtn?.addEventListener('click', ()=>{
    if(!output.src) return notify('❌ No image to download','error');
    const a = document.createElement('a');
    a.href = output.src;
    a.download = `Imagenova_${Date.now()}.png`;
    a.click();
    notify('📥 Image downloaded');
});

// ربط الأزرار
resizeBtn?.addEventListener('click',resizeImage);
compressBtn?.addEventListener('click',compressImage);
convertBtn?.addEventListener('click',convertImage);
removeBgBtn?.addEventListener('click',removeBackground);
watermarkBtn?.addEventListener('click',addWatermark);
