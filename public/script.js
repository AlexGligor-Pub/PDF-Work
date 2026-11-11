let selectedFile = null;
let downloadBlob = null;

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFile = document.getElementById('removeFile');
const convertButton = document.getElementById('convertButton');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultSection = document.getElementById('resultSection');
const resultMessage = document.getElementById('resultMessage');
const downloadButton = document.getElementById('downloadButton');
const resetButton = document.getElementById('resetButton');

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

removeFile.addEventListener('click', () => {
    resetUpload();
});

convertButton.addEventListener('click', async () => {
    if (!selectedFile) return;
    
    await processFile();
});

downloadButton.addEventListener('click', () => {
    if (downloadBlob) {
        const url = URL.createObjectURL(downloadBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadBlob.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});

resetButton.addEventListener('click', () => {
    resetUpload();
});

function handleFileSelect(file) {
    const allowedTypes = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf'
    ];
    
    const allowedExtensions = ['.doc', '.docx', '.pdf'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        alert('Tipul de fișier nu este acceptat. Folosiți doar DOC, DOCX sau PDF.');
        return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
        alert('Fișierul este prea mare. Dimensiunea maximă este 50MB.');
        return;
    }
    
    selectedFile = file;
    
    dropZone.style.display = 'none';
    fileInfo.style.display = 'block';
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    convertButton.disabled = false;
    
    resultSection.style.display = 'none';
}

async function processFile() {
    if (!selectedFile) return;
    
    convertButton.disabled = true;
    progressSection.style.display = 'block';
    resultSection.style.display = 'none';
    
    progressFill.style.width = '30%';
    progressText.textContent = 'Se încarcă fișierul...';
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
        progressFill.style.width = '60%';
        progressText.textContent = 'Se procesează fișierul...';
        
        const response = await fetch('/api/convert', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Eroare la procesarea fișierului');
        }
        
        progressFill.style.width = '90%';
        progressText.textContent = 'Se finalizează...';
        
        const blob = await response.blob();
        const outputFileName = selectedFile.name.replace(/\.(doc|docx|pdf)$/i, '_processed.pdf');
        downloadBlob = new Blob([blob], { type: 'application/pdf' });
        downloadBlob.name = outputFileName;
        
        const originalSize = response.headers.get('X-Original-Size');
        const compressedSize = response.headers.get('X-Compressed-Size');
        const compressionRatio = response.headers.get('X-Compression-Ratio');
        const fileSize = response.headers.get('X-File-Size');
        
        let message = '';
        if (selectedFile.name.toLowerCase().endsWith('.pdf')) {
            if (compressionRatio) {
                message = `PDF comprimat cu succes! Reducere: ${compressionRatio}%<br>`;
                message += `Dimensiune originală: ${formatFileSize(parseInt(originalSize))}<br>`;
                message += `Dimensiune nouă: ${formatFileSize(parseInt(compressedSize))}`;
            } else {
                message = 'PDF procesat cu succes!';
            }
        } else {
            message = `Document convertit în PDF cu succes!<br>`;
            if (fileSize) {
                message += `Dimensiune: ${formatFileSize(parseInt(fileSize))}`;
            }
        }
        
        progressFill.style.width = '100%';
        progressText.textContent = 'Complet!';
        
        setTimeout(() => {
            progressSection.style.display = 'none';
            resultSection.style.display = 'block';
            resultMessage.innerHTML = message;
        }, 500);
        
    } catch (error) {
        console.error('Eroare:', error);
        alert('Eroare: ' + error.message);
        progressSection.style.display = 'none';
        convertButton.disabled = false;
    }
}

function resetUpload() {
    selectedFile = null;
    downloadBlob = null;
    fileInput.value = '';
    
    dropZone.style.display = 'block';
    fileInfo.style.display = 'none';
    progressSection.style.display = 'none';
    resultSection.style.display = 'none';
    
    convertButton.disabled = true;
    progressFill.style.width = '0%';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function checkServerHealth() {
    try {
        const response = await fetch('/api/health');
        if (response.ok) {
            console.log('Server conectat cu succes');
        }
    } catch (error) {
        console.error('Nu s-a putut conecta la server:', error);
    }
}

checkServerHealth();
