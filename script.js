// === العناصر الأساسية ===
const imageInput = document.getElementById('imageInput');
const output = document.getElementById('output');
const downloadBtn = document.getElementById('downloadBtn');
const message = document.getElementById('message');
const resizeBtn = document.getElementById('resizeBtn');
const removeBgBtn = document.getElementById('removeBgBtn');

// مفتاح API لإزالة الخلفية
const API_KEY = 'gmE4r63VDu3y98NpkNcidxdt';

// === دالة تغيير حالة الزر أثناء المعالجة ===
function setBtnState(btn, isLoading, text, iconClass) {
  if (!btn) return;
  const icon = btn.querySelector('i');
  const span = btn.querySelector('span');

  if (isLoading) {
    btn.disabled = true;
    if(icon) icon.className = 'fas fa-spinner fa-spin';
    if(span) span.innerText = ' Processing...';
  } else {
    btn.disabled = false;
    if(icon) icon.className = iconClass;
    if(span) span.innerText = text;
  }
}

// === دالة اظهار الرسائل للمستخدم ===
function notify(msg, type='success'){
  if(!message) return;
  message.innerText = msg;
  message.style.color = type==='error' ? '#ef4444' : '#10b981';
}

// === رفع الصورة وعرضها ===
if(imageInput){
  imageInput.addEventListener('change', function(){
    if(this.files[0]){
      const reader = new FileReader();
      reader.onload = (e)=>{
        output.src = e.target.result;
        downloadBtn.disabled = false;
        notify('✅ Image uploaded successfully');
      };
      reader.readAsDataURL(this.files[0]);
    }
  });
}

// === تغيير حجم الصورة ===
async function resizeImage() {
  if(!imageInput.files[0]) return notify('❌ Please select an image first','error');
  setBtnState(resizeBtn,true,'','');

  const img = new Image();
  img.src = URL.createObjectURL(imageInput.files[0]);
  img.onload = async ()=>{
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 800;
    try {
      await pica().resize(img,canvas);
      output.src = canvas.toDataURL();
      notify('✨ Image resized successfully');
    } catch(e) {
      notify('❌ Failed to resize image','error');
    } finally {
      setBtnState(resizeBtn,false,' Resize','fas fa-expand-arrows-alt');
    }
  };
}

// === إزالة الخلفية باستخدام API ===
async function removeBackground() {
  if(!imageInput.files[0]) return notify('❌ Please select an image first','error');
  setBtnState(removeBgBtn,true,'','');

  const formData = new FormData();
  formData.append('image_file',imageInput.files[0]);
  formData.append('size','auto');

  try {
    const response = await fetch('https://api.remove.bg/v1.0/removebg',{
      method:'POST',
      headers:{'X-Api-Key':API_KEY},
      body: formData
    });
    if(!response.ok) throw new Error();
    const blob = await response.blob();
    output.src = URL.createObjectURL(blob);
    notify('🪄 Background removed successfully');
  } catch(e){
    notify('❌ API error or quota exceeded','error');
  } finally {
    setBtnState(removeBgBtn,false,' Remove Background','fas fa-magic');
  }
}

// === تحميل الصورة ===
if(downloadBtn){
  downloadBtn.addEventListener('click',()=>{
    if(!output.src) return notify('❌ No image to download','error');
    const a = document.createElement('a');
    a.href = output.src;
    a.download = `QuickTool_${Date.now()}.png`;
    a.click();
    notify('📥 Image downloaded');
  });
}

// === ربط الأزرار ===
resizeBtn.addEventListener('click',resizeImage);
removeBgBtn.addEventListener('click',removeBackground);
