// Elements
const imageInput = document.getElementById('imageInput');
const output = document.getElementById('output');
const downloadBtn = document.getElementById('downloadBtn');
const message = document.getElementById('message');

const resizeBtn = document.getElementById('resizeBtn');
const compressBtn = document.getElementById('compressBtn');
const convertBtn = document.getElementById('convertBtn');
const removeBgBtn = document.getElementById('removeBgBtn');
const watermarkBtn = document.getElementById('watermarkBtn');

// API Key hidden in separate file
import { REMOVE_BG_API_KEY } from './API/remove-bg-js.js';

// Utility functions
function setBtnState(btn, isLoading, text = '', iconClass = '') {
    if (!btn) return;
    const icon = btn.querySelector('i');
    const span = btn.querySelector('span');
    btn.disabled = isLoading;
    if (isLoading) { if(icon) icon.className='fas fa-spinner fa-spin'; if(span) span.innerText=' Processing...'; }
    else { if(icon) icon.className=iconClass; if(span) span.innerText=text; }
}

function notify(msg, type='success') {
    if(!message) return;
    message.innerText = msg;
    message.style.color = type==='error'? '#ef4444':'#10b981';
}

// Load image
if(imageInput) {
    imageInput.addEventListener('change', function(){
        if(this.files[0]){
            const reader = new FileReader();
            reader.onload = e => {
                output.src = e.target.result;
                downloadBtn.disabled=false;
                notify('✅ Image uploaded successfully');
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
}

// Resize
async function resizeImage() {
    if(!imageInput.files[0]) return notify('❌ Please select an image first', 'error');
    setBtnState(resizeBtn,true);
    const img = new Image();
    img.src = URL.createObjectURL(imageInput.files[0]);
    img.onload = async () => {
        const canvas=document.createElement('canvas');
        canvas.width=800; canvas.height=800;
        try { await pica().resize(img,canvas); output.src=canvas.toDataURL(); notify('✨ Image resized'); }
        catch(e){ notify('❌ Resize failed','error'); }
        finally{ setBtnState(resizeBtn,false,' Resize','fas fa-expand-arrows-alt'); }
    };
}

// Remove Background
async function removeBackground() {
    if(!imageInput.files[0]) return notify('❌ Select an image first','error');
    setBtnState(removeBgBtn,true);
    const formData = new FormData();
    formData.append('image_file',imageInput.files[0]);
    formData.append('size','auto');
    try {
        const response = await fetch('https://api.remove.bg/v1.0/removebg',{
            method:'POST',
            headers:{'X-Api-Key':REMOVE_BG_API_KEY},
            body:formData
        });
        if(!response.ok) throw new Error();
        const blob = await response.blob();
        output.src = URL.createObjectURL(blob);
        notify('🪄 Background removed');
    } catch(e){ notify('❌ API error or quota exceeded','error'); }
    finally{ setBtnState(removeBgBtn,false,' Remove BG','fas fa-magic'); }
}

// Placeholder: compress, convert, watermark (add real logic later)
function compressImage(){ notify('⚡ Compress not implemented'); }
function convertImage(){ notify('⚡ Convert not implemented'); }
function addWatermark(){ notify('⚡ Watermark not implemented'); }

// Download
if(downloadBtn) downloadBtn.addEventListener('click',()=>{ if(!output.src) return notify('❌ No image','error'); const a=document.createElement('a'); a.href=output.src; a.download=`Imagenova_${Date.now()}.png`; a.click(); notify('📥 Image downloaded'); });

// Buttons
if(resizeBtn) resizeBtn.addEventListener('click',resizeImage);
if(removeBgBtn) removeBgBtn.addEventListener('click',removeBackground);
if(compressBtn) compressBtn.addEventListener('click',compressImage);
if(convertBtn) convertBtn.addEventListener('click',convertImage);
if(watermarkBtn) watermarkBtn.addEventListener('click',addWatermark);
