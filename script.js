let currentTool = '';
let currentFile = null;
const pica = window.pica ? window.pica() : null;

// Navigation
function selectTool(tool) {
    currentTool = tool;
    document.getElementById('tools-dashboard').classList.add('hidden');
    document.getElementById('workspace').classList.remove('hidden');
    
    const titles = {
        resize: 'Resize Image',
        compress: 'Compress Image',
        convert: 'Convert Format',
        removebg: 'Remove Background (AI)'
    };
    document.getElementById('tool-title').textContent = titles[tool];
    setupControls(tool);
    resetEditor();
}

function goHome() {
    document.getElementById('workspace').classList.add('hidden');
    document.getElementById('tools-dashboard').classList.remove('hidden');
}

function setupControls(tool) {
    const container = document.getElementById('dynamic-controls');
    container.innerHTML = '';

    if (tool === 'resize') {
        container.innerHTML = `
            <div class="control-group"><label>Width (px)</label><input type="number" id="width" placeholder="Auto"></div>
            <div class="control-group"><label>Height (px)</label><input type="number" id="height" placeholder="Auto"></div>`;
    } else if (tool === 'compress') {
        container.innerHTML = `
            <div class="control-group"><label>Quality (0.1 - 1.0)</label><input type="range" id="quality" min="0.1" max="1.0" step="0.1" value="0.8"></div>`;
    } else if (tool === 'convert') {
        container.innerHTML = `
            <div class="control-group"><label>Format</label>
                <select id="format">
                    <option value="image/jpeg">JPG</option>
                    <option value="image/png">PNG</option>
                    <option value="image/webp">WebP</option>
                </select></div>`;
    } else if (tool === 'removebg') {
        container.innerHTML = `<p style="text-align:center; color:#64748b;">AI processing handled securely.</p>`;
    }
}

// File Handling
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => loadFile(e.target.files[0]));

dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.background = '#e0e7ff'; });
dropZone.addEventListener('dragleave', () => dropZone.style.background = '#eff6ff');
dropZone.addEventListener('drop', (e) => { e.preventDefault(); loadFile(e.dataTransfer.files[0]); });

function loadFile(file) {
    if (!file || !file.type.startsWith('image/')) return notify('Invalid file type', 'error');
    currentFile = file;
    const url = URL.createObjectURL(file);
    document.getElementById('image-preview').src = url;
    dropZone.classList.add('hidden');
    document.getElementById('editor-area').classList.remove('hidden');
    
    const img = new Image();
    img.src = url;
    img.onload = () => {
        if(document.getElementById('width')) document.getElementById('width').value = img.width;
        if(document.getElementById('height')) document.getElementById('height').value = img.height;
    };
}

function resetEditor() {
    currentFile = null;
    dropZone.classList.remove('hidden');
    document.getElementById('editor-area').classList.add('hidden');
    document.getElementById('download-btn').classList.add('hidden');
    document.getElementById('process-btn').classList.remove('hidden');
    dropZone.style.background = '#eff6ff';
}

// Processing
document.getElementById('process-btn').addEventListener('click', async () => {
    if (!currentFile) return;
    const btn = document.getElementById('process-btn');
    const spinner = document.getElementById('loading-spinner');
    
    btn.disabled = true;
    btn.textContent = 'Processing...';
    spinner.classList.remove('hidden');
    
    try {
        if (currentTool === 'removebg') {
            await handleRemoveBG();
        } else {
            await handleClientSide();
        }
        notify('Success!', 'success');
    } catch (err) {
        console.error(err);
        notify('Error: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Process Image';
        spinner.classList.add('hidden');
    }
});

async function handleRemoveBG() {
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    const base64Image = await toBase64(currentFile);

    // Call our own internal API
    const res = await fetch('/api/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Server error');

    showDownload(data.result, 'imagenova-nobg.png');
}

async function handleClientSide() {
    const img = document.getElementById('image-preview');
    const canvas = document.createElement('canvas');
    let width = img.naturalWidth;
    let height = img.naturalHeight;
    let quality = 0.9;
    let mime = 'image/jpeg';

    if (currentTool === 'resize') {
        width = parseInt(document.getElementById('width').value) || width;
        height = parseInt(document.getElementById('height').value) || height;
    } else if (currentTool === 'compress') {
        quality = parseFloat(document.getElementById('quality').value);
    } else if (currentTool === 'convert') {
        mime = document.getElementById('format').value;
    }

    canvas.width = width;
    canvas.height = height;

    if (currentTool === 'resize' && pica) {
        await pica.resize(img, canvas);
    } else {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
    }

    const dataUrl = canvas.toDataURL(mime, quality);
    const ext = mime.split('/')[1];
    showDownload(dataUrl, `imagenova-edited.${ext}`);
}

function showDownload(url, filename) {
    const dlBtn = document.getElementById('download-btn');
    document.getElementById('image-preview').src = url;
    dlBtn.href = url;
    dlBtn.download = filename;
    dlBtn.classList.remove('hidden');
    document.getElementById('process-btn').classList.add('hidden');
}

function notify(msg, type) {
    const area = document.getElementById('notification-area');
    const div = document.createElement('div');
    div.className = `notif notif-${type}`;
    div.innerText = msg;
    area.appendChild(div);
    setTimeout(() => div.remove(), 4000);
}
