const imageInput=document.getElementById('imageInput');
const output=document.getElementById('output');
const downloadBtn=document.getElementById('downloadBtn');
const message=document.getElementById('message');
const placeholderText=document.getElementById('placeholderText');

const resizeBtn=document.getElementById('resizeBtn');
const compressBtn=document.getElementById('compressBtn');
const convertBtn=document.getElementById('convertBtn');
const removeBgBtn=document.getElementById('removeBgBtn');

const resizeWidthInput=document.getElementById('resizeWidth');
const resizeHeightInput=document.getElementById('resizeHeight');
const compressQualityInput=document.getElementById('compressQuality');
const qualityValue=document.getElementById('qualityValue');

const allActionBtns=[resizeBtn,compressBtn,convertBtn,removeBgBtn];
let currentFile=null;
let currentFormat='png';
let originalFileName='image';

function notify(msg,type='success'){
    if(!message) return;
    message.innerText=msg;
    message.style.color=type==='error'?'var(--danger)':'var(--success)';
    setTimeout(()=>{message.innerText='';},5000);
}

function toggleButtons(disabled){
    allActionBtns.forEach(btn=>{if(btn)btn.disabled=disabled;});
}

function setProgress(btn,value){
    btn.style.background=`linear-gradient(to right, var(--primary) ${value}%, #ddd ${value}%)`;
}

// Upload
if(imageInput){
    imageInput.addEventListener('change',function(){
        if(this.files && this.files[0]){
            const file=this.files[0];
            if(!file.type.startsWith('image/')) return notify('❌ Please upload a valid image file','error');
            currentFile=file;
            originalFileName=file.name.split('.')[0];
            currentFormat=file.type.split('/')[1];
            const reader=new FileReader();
            reader.onload=(e)=>{
                output.src=e.target.result;
                output.style.display='block';
                if(placeholderText) placeholderText.style.display='none';
                toggleButtons(false);
                if(downloadBtn) downloadBtn.disabled=false;
                notify(`✅ Loaded: ${file.name}`);
            };
            reader.readAsDataURL(file);
        }
    });
}

// Resize
resizeBtn.addEventListener('click',async()=>{
    if(!output.src) return;
    const width=parseInt(resizeWidthInput.value);
    const height=parseInt(resizeHeightInput.value);
    if(!width||!height) return notify('❌ Enter valid width & height','error');
    const img=new Image();
    img.src=output.src;
    img.onload=async()=>{
        const canvas=document.createElement('canvas');
        canvas.width=width;
        canvas.height=height;
        if(typeof pica==='undefined') return notify('❌ Resize lib missing','error');
        await pica().resize(img,canvas);
        output.src=canvas.toDataURL(`image/${currentFormat}`);
        notify(`✨ Resized to ${width}x${height}px`);
    };
});

// Compress
compressQualityInput.addEventListener('input',()=>{qualityValue.innerText=`${compressQualityInput.value}%`;});
compressBtn.addEventListener('click',()=>{
    if(!output.src) return;
    const quality=parseInt(compressQualityInput.value)/100;
    const img=new Image();
    img.src=output.src;
    img.onload=()=>{
        const canvas=document.createElement('canvas');
        canvas.width=img.width; canvas.height=img.height;
        const ctx=canvas.getContext('2d');
        if(currentFormat.includes('jp')){ctx.fillStyle='#FFF';ctx.fillRect(0,0,canvas.width,canvas.height);}
        ctx.drawImage(img,0,0);
        output.src=canvas.toDataURL(`image/${currentFormat}`,quality);
        notify('✨ Compressed');
    };
});

// Convert
convertBtn.addEventListener('click',()=>{
    if(!output.src) return;
    const format=prompt('Convert to: png, jpeg, webp','jpeg');
    if(!format) return;
    const img=new Image();
    img.src=output.src;
    img.onload=()=>{
        const canvas=document.createElement('canvas');
        canvas.width=img.width; canvas.height=img.height;
        const ctx=canvas.getContext('2d');
        if(format.includes('jp')){ctx.fillStyle='#FFF';ctx.fillRect(0,0,canvas.width,canvas.height);}
        ctx.drawImage(img,0,0);
        currentFormat=format.toLowerCase();
        output.src=canvas.toDataURL(`image/${currentFormat}`);
        notify(`🔄 Converted to ${currentFormat}`);
    };
});

// Remove BG
removeBgBtn.addEventListener('click',async()=>{
    if(!currentFile) return notify('❌ Please upload an image first','error');
    setProgress(removeBgBtn,0);
    try{
        const formData=new FormData();
        formData.append('image_file',currentFile);
        const response=await fetch('/api/remove-bg',{method:'POST',body:formData});
        if(!response.ok) throw new Error('Remove BG failed');
        const blob=await response.blob();
        output.src=URL.createObjectURL(blob);
        currentFormat='png';
        notify('✨ Background removed successfully');
        setProgress(removeBgBtn,100);
        setTimeout(()=>setProgress(removeBgBtn,0),500);
    }catch(e){console.error(e);notify('❌ Failed to remove background','error');}
});

// Download
if(downloadBtn){
    downloadBtn.addEventListener('click',()=>{
        if(!output.src) return;
        const a=document.createElement('a');
        a.download=`${originalFileName}_imagenova.${currentFormat}`;
        a.href=output.src;
        a.click();
    });
}
