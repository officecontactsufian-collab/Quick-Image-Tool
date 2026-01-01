const imageInput = document.getElementById('imageInput');
const output = document.getElementById('output');
const downloadBtn = document.getElementById('downloadBtn');
const message = document.getElementById('message');

const resizeBtn = document.getElementById('resizeBtn');
const compressBtn = document.getElementById('compressBtn');
const convertBtn = document.getElementById('convertBtn');
const watermarkBtn = document.getElementById('watermarkBtn');
const removeBgBtn = document.getElementById('removeBgBtn');

// API Key مخفي في GitHub file
const API_KEY_PATH = 'API/remove-bg-js/apiKey.js'; 

// تحميل API Key
let API_KEY;
fetch(API_KEY_PATH)
.then(res => res.text())
.then(key => { API_KEY = key.trim(); });

// Notify
function notify(msg, type='success'){ if(!message) return; message.innerText=msg; message.style.color=(type==='error'?'#ef4444':'#10b981'); }

// تحميل الصورة وعرضها
imageInput?.addEventListener('change', function(){
  if(this.files[0]){
    const reader = new FileReader();
    reader.onload = (e)=>{ output.src=e.target.result; downloadBtn.disabled=false; notify('✅ Image uploaded successfully'); };
    reader.readAsDataURL(this.files[0]);
  }
});

// تحميل الصورة
downloadBtn?.addEventListener('click', ()=>{
  if(!output.src) return notify('❌ No image to download','error');
  const a=document.createElement('a');
  a.href=output.src;
  a.download=`Imagenova_${Date.now()}.png`;
  a.click();
  notify('📥 Image downloaded');
});

// Resize
resizeBtn?.addEventListener('click', async ()=>{
  if(!imageInput.files[0]) return notify('❌ Please select an image first','error');
  const img=new Image();
  img.src=URL.createObjectURL(imageInput.files[0]);
  img.onload=async()=>{
    const canvas=document.createElement('canvas');
    canvas.width=800; canvas.height=800;
    try{ await pica().resize(img,canvas); output.src=canvas.toDataURL(); notify('✨ Image resized successfully'); } 
    catch(e){ notify('❌ Resize failed','error'); }
  };
});

// Compress
compressBtn?.addEventListener('click', ()=>{
  if(!output.src) return notify('❌ Please select an image first','error');
  const canvas=document.createElement('canvas');
  const img=new Image(); img.src=output.src;
  img.onload=()=>{
    canvas.width=img.width; canvas.height=img.height;
    const ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0);
    const compressed=canvas.toDataURL('image/jpeg',0.6);
    output.src=compressed;
    notify('💎 Image compressed successfully');
  };
});

// Convert
convertBtn?.addEventListener('click', ()=>{
  if(!output.src) return notify('❌ Please select an image first','error');
  const format=prompt('Enter format: jpg, png, webp','png');
  if(!['jpg','png','webp'].includes(format.toLowerCase())) return notify('❌ Invalid format','error');
  const canvas=document.createElement('canvas');
  const img=new Image(); img.src=output.src;
  img.onload=()=>{
    canvas.width=img.width; canvas.height=img.height;
    canvas.getContext('2d').drawImage(img,0,0);
    output.src=canvas.toDataURL(`image/${format}`);
    notify(`🔄 Image converted to ${format.toUpperCase()}`);
  };
});

// Watermark
watermarkBtn?.addEventListener('click', ()=>{
  if(!output.src) return notify('❌ Please select an image first','error');
  const text=prompt('Enter watermark text','Imagenova');
  const canvas=document.createElement('canvas');
  const img=new Image(); img.src=output.src;
  img.onload=()=>{
    canvas.width=img.width; canvas.height=img.height;
    const ctx=canvas.getContext('2d');
    ctx.drawImage(img,0,0);
    ctx.font=`30px Arial`; ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.fillText(text,20,40);
    output.src=canvas.toDataURL();
    notify('💧 Watermark added');
  };
});

// Remove Background
removeBgBtn?.addEventListener('click', async ()=>{
  if(!imageInput.files[0]) return notify('❌ Please select an image first','error');
  if(!API_KEY) return notify('❌ API Key not loaded','error');
  notify('⏳ Removing background...');
  const formData=new FormData();
  formData.append('image_file', imageInput.files[0]);
  formData.append('size','auto');
  try{
    const res=await fetch('https://api.remove.bg/v1.0/removebg',{ method:'POST', headers:{ 'X-Api-Key':API_KEY }, body:formData });
    if(!res.ok) throw new Error();
    const blob=await res.blob();
    output.src=URL.createObjectURL(blob);
    notify('🪄 Background removed successfully');
  }catch(e){ notify('❌ API error or quota exceeded','error'); }
});
