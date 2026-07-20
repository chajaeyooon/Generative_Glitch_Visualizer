// app.js

// --- 1. DOM Elements ---
const canvas = document.getElementById('visualCanvas');
const ctx = canvas.getContext('2d');
const offscreenCanvas = document.getElementById('offscreenCanvas');
const offscreenCtx = offscreenCanvas.getContext('2d');

const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const imageGallery = document.getElementById('imageGallery');

// Parameters
const visualPreset = document.getElementById('visualPreset');
const gridSizeInput = document.getElementById('gridSize');
const gridSizeVal = document.getElementById('gridSizeVal');
const animSpeedInput = document.getElementById('animSpeed');
const animSpeedVal = document.getElementById('animSpeedVal');
const glitchRateInput = document.getElementById('glitchRate');
const glitchRateVal = document.getElementById('glitchRateVal');
const complexityInput = document.getElementById('complexity');
const complexityVal = document.getElementById('complexityVal');
const displaceAmountInput = document.getElementById('displaceAmount');
const displaceAmountVal = document.getElementById('displaceAmountVal');

// Morph / Blend
const colorBlendInput = document.getElementById('colorBlend');
const colorBlendVal = document.getElementById('colorBlendVal');
const sampleMethod = document.getElementById('sampleMethod');
const autoMorphInput = document.getElementById('autoMorph');
const morphSpeedGroup = document.getElementById('morphSpeedGroup');
const morphDurationInput = document.getElementById('morphDuration');
const morphDurationVal = document.getElementById('morphDurationVal');

// Audio Controls
const audioFileInput = document.getElementById('audioFileInput');
const audioDropZone = document.getElementById('audioDropZone');
const audioControlsContainer = document.getElementById('audioControlsContainer');
const audioTrackName = document.getElementById('audioTrackName');
const audioPlayBtn = document.getElementById('audioPlayBtn');
const audioStopBtn = document.getElementById('audioStopBtn');
const audioSensitivityInput = document.getElementById('audioSensitivity');
const audioSensitivityVal = document.getElementById('audioSensitivityVal');
const audioVisualizer = document.getElementById('audioVisualizer');
const audioVisualizerCtx = audioVisualizer.getContext('2d');

// Image Synthesis Dropdowns
const sourceSelectA = document.getElementById('sourceSelectA');
const sourceSelectB = document.getElementById('sourceSelectB');
const synthesisMixInput = document.getElementById('synthesisMix');
const synthesisMixVal = document.getElementById('synthesisMixVal');

// Vibe HUD Readouts
const vibeStatus = document.getElementById('vibeStatus');
const vibeEdgeBias = document.getElementById('vibeEdgeBias');
const vibeEntropyVal = document.getElementById('vibeEntropyVal');
const vibeContrastVal = document.getElementById('vibeContrastVal');
const vibeColorDna = document.getElementById('vibeColorDna');

// Manual Overrides
const enableVibeOverride = document.getElementById('enableVibeOverride');
const vibeOverrideSliders = document.getElementById('vibeOverrideSliders');
const vibeVerticalInput = document.getElementById('vibeVertical');
const vibeVerticalVal = document.getElementById('vibeVerticalVal');
const vibeHorizontalInput = document.getElementById('vibeHorizontal');
const vibeHorizontalVal = document.getElementById('vibeHorizontalVal');
const vibeEntropyInput = document.getElementById('vibeEntropy');
const vibeEntropyVal2 = document.getElementById('vibeEntropyVal2');
const vibeContrastInput = document.getElementById('vibeContrast');
const vibeContrastVal2 = document.getElementById('vibeContrastVal2');

// Recording
const recordBtn = document.getElementById('recordBtn');
const recStatusHud = document.getElementById('recStatusHud');
const recStatusText = document.getElementById('recStatusText');
const recTimeText = document.getElementById('recTimeText');
const autoStopRecInput = document.getElementById('autoStopRec');


// --- 2. State & Configuration ---
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

let params = {
    gridSize: parseInt(gridSizeInput.value),
    speed: parseFloat(animSpeedInput.value),
    glitchRate: parseInt(glitchRateInput.value) / 100,
    complexity: parseInt(complexityInput.value),
    displaceAmount: parseInt(displaceAmountInput.value),
    colorBlend: parseFloat(colorBlendInput.value),
    sampleMethod: sampleMethod.value,
    autoMorph: autoMorphInput.checked,
    morphDuration: parseInt(morphDurationInput.value),
    preset: visualPreset.value,
    autoStopRec: autoStopRecInput.checked,
    audioSensitivity: parseFloat(audioSensitivityInput.value),
    
    // Synthesis Mix & Manual Override States
    synthesisMix: parseInt(synthesisMixInput.value) / 100,
    enableOverride: enableVibeOverride.checked,
    manualVibe: {
        vertical: parseInt(vibeVerticalInput.value) / 100,
        horizontal: parseInt(vibeHorizontalInput.value) / 100,
        entropy: parseInt(vibeEntropyInput.value) / 100,
        contrast: parseInt(vibeContrastInput.value) / 100
    }
};

// Image handling
let uploadedImages = []; // List of { img, data, name, vibeAnalysis }
let defaultGradients = []; // Generated procedural images, including vibeAnalysis
let activeImageIndex = -1; // Current inspected image

// Active Synthesis Pointers
let activeSourceA = -1; // Default Gradient 1
let activeSourceB = -2; // Default Gradient 2

// Audio Analysis State
let audioCtx = null;
let audioSource = null;
let analyser = null;
let audioBufferLength = 0;
let audioDataArray = null;
let audioElement = new Audio();
audioElement.crossOrigin = "anonymous";
let isAudioPlaying = false;

// Reactive values extracted from audio analysis
let audioReactivity = {
    bass: 0,
    mids: 0,
    treble: 0,
    volume: 0
};

// Animation State
let time = 0;
let animationFrameId = null;
let morphStartTime = null;

// Recording State
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];
let recStartTime = 0;
let stream = null;
let selectedMimeType = 'video/webm';
let fileExtension = 'webm';

function selectRecordingFormat() {
    const mimeTypes = [
        'video/mp4;codecs=h264',
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=h264',
        'video/webm;codecs=vp9',
        'video/webm'
    ];

    for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
            selectedMimeType = type;
            if (type.includes('video/mp4')) {
                fileExtension = 'mp4';
            } else if (type.includes('codecs=h264')) {
                fileExtension = 'mp4';
            } else {
                fileExtension = 'webm';
            }
            break;
        }
    }
    
    const formatIndicator = document.getElementById('formatIndicator');
    if (formatIndicator) {
        if (selectedMimeType.includes('video/mp4')) {
            formatIndicator.innerText = 'MP4 (H.264)';
        } else if (selectedMimeType.includes('codecs=h264')) {
            formatIndicator.innerText = 'MP4 (WebM-H.264)';
        } else {
            formatIndicator.innerText = 'WebM (VP9/VP8)';
        }
    }
}


// --- 3. Computer Vision Image Vibe Analyzer ---
// Runs a Sobel gradient detection and standard-deviation entropy search on pixel data.
function analyzeImageVibe(imgData) {
    if (!imgData) {
        return {
            vertical: 0.25,
            horizontal: 0.25,
            entropy: 0.3,
            contrast: 0.2,
            palette: ['#ff007f', '#00f0ff', '#ffffff']
        };
    }
    
    const w = imgData.width;
    const h = imgData.height;
    const data = imgData.data;
    
    // Sample coordinates (Grid sampling to avoid browser locking)
    const sampleSteps = 60;
    const stepX = Math.floor(w / sampleSteps);
    const stepY = Math.floor(h / sampleSteps);
    
    let sumDx = 0;
    let sumDy = 0;
    let luminanceValues = [];
    
    const getPixelLum = (x, y) => {
        const idx = (y * w + x) * 4;
        return (data[idx] * 299 + data[idx+1] * 587 + data[idx+2] * 114) / 1000;
    };
    
    // 1. Edge orientation and entropy loop
    for (let sy = 1; sy < sampleSteps - 1; sy++) {
        for (let sx = 1; sx < sampleSteps - 1; sx++) {
            const px = sx * stepX;
            const py = sy * stepY;
            
            const lum = getPixelLum(px, py);
            luminanceValues.push(lum);
            
            // Sobel Kernel changes
            const l_left = getPixelLum(px - 1, py);
            const l_right = getPixelLum(px + 1, py);
            const l_top = getPixelLum(px, py - 1);
            const l_bottom = getPixelLum(px, py + 1);
            
            const dx = l_right - l_left;
            const dy = l_bottom - l_top;
            
            sumDx += Math.abs(dx);
            sumDy += Math.abs(dy);
        }
    }
    
    // Normalization of texture biases
    // High sumDx means lines run vertically (changes on X axis).
    // High sumDy means lines run horizontally (changes on Y axis).
    const totalGradients = sumDx + sumDy + 0.001;
    const verticalBias = sumDx / totalGradients;
    const horizontalBias = sumDy / totalGradients;
    
    // 2. Entropy calculation (Standard deviation of luminance)
    let sumL = 0;
    luminanceValues.forEach(val => sumL += val);
    const meanL = sumL / luminanceValues.length;
    
    let sumSqDiff = 0;
    luminanceValues.forEach(val => sumSqDiff += Math.pow(val - meanL, 2));
    const varianceL = sumSqDiff / luminanceValues.length;
    const stdDevL = Math.sqrt(varianceL);
    const entropy = Math.min(1.0, stdDevL / 110); // normalize roughly
    
    // 3. Contrast Depth (ratio of binary B&W values)
    let binaryPixels = 0;
    luminanceValues.forEach(val => {
        if (val < 45 || val > 210) {
            binaryPixels++;
        }
    });
    const contrast = binaryPixels / luminanceValues.length;
    
    // 4. Extract dominant palette colors
    const palette = [];
    for (let i = 0; i < 60; i++) {
        const rx = Math.floor(Math.random() * w);
        const ry = Math.floor(Math.random() * h);
        const idx = (ry * w + rx) * 4;
        const col = { r: data[idx], g: data[idx+1], b: data[idx+2] };
        const l = (col.r * 299 + col.g * 587 + col.b * 114) / 1000;
        
        if (l > 30) { // filter out black backgrounds
            palette.push(`rgb(${col.r}, ${col.g}, ${col.b})`);
        }
    }
    
    // Unique color filtering
    const cleanPalette = [...new Set(palette)].slice(0, 5);
    if (cleanPalette.length === 0) cleanPalette.push('#ff007f', '#00f0ff', '#ffffff');
    
    return {
        vertical: verticalBias,
        horizontal: horizontalBias,
        entropy: entropy,
        contrast: contrast,
        palette: cleanPalette
    };
}


// --- 4. Generate Procedural Default Gradients ---
// Ensures that the app has vibrant visual profiles out-of-the-box
function generateDefaultGradients() {
    const createGradientTexture = (drawFn, name) => {
        const off = document.createElement('canvas');
        off.width = CANVAS_WIDTH;
        off.height = CANVAS_HEIGHT;
        const oCtx = off.getContext('2d');
        drawFn(oCtx);
        const imgData = oCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Analyze procedural textures
        const vibe = analyzeImageVibe(imgData);
        
        return { img: off, data: imgData, name: name, vibeAnalysis: vibe };
    };

    // Preset 1: Grayscale Grid Blocks (High Blocky/Grid details)
    defaultGradients.push(createGradientTexture((c) => {
        c.fillStyle = '#08080c';
        c.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Random square grid structures
        for (let i = 0; i < 40; i++) {
            const sz = 80 + Math.random() * 200;
            const x = Math.random() * CANVAS_WIDTH;
            const y = Math.random() * CANVAS_HEIGHT;
            c.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.4})`;
            c.fillRect(x, y, sz, sz);
        }
        
        // Draw thin grid lines
        c.strokeStyle = 'rgba(255,255,255,0.15)';
        c.lineWidth = 1;
        for (let x = 0; x < CANVAS_WIDTH; x += 60) {
            c.beginPath(); c.moveTo(x, 0); c.lineTo(x, CANVAS_HEIGHT); c.stroke();
        }
    }, 'Procedural: Grayscale Architectural Grid'));

    // Preset 2: Teal/Orange Vertical Sorting (High Vertical edges)
    defaultGradients.push(createGradientTexture((c) => {
        const grad = c.createLinearGradient(0, 0, CANVAS_WIDTH, 0);
        grad.addColorStop(0, '#00f0ff');
        grad.addColorStop(0.5, '#ff007f');
        grad.addColorStop(1, '#ffaa00');
        c.fillStyle = grad;
        c.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Stretched vertical stripe textures
        for (let i = 0; i < 50; i++) {
            c.fillStyle = Math.random() > 0.5 ? '#000000' : '#ffffff';
            c.fillRect(Math.random() * CANVAS_WIDTH, 0, 2 + Math.random() * 8, CANVAS_HEIGHT);
        }
    }, 'Procedural: Colorful Vertical Sort'));

    // Preset 3: Glitchy Scanlines (High Horizontal edges)
    defaultGradients.push(createGradientTexture((c) => {
        c.fillStyle = '#08080c';
        c.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Draw horizontal scan bars
        for (let i = 0; i < 60; i++) {
            const h = 5 + Math.random() * 40;
            const y = Math.random() * CANVAS_HEIGHT;
            c.fillStyle = `rgba(0, 240, 255, ${0.2 + Math.random() * 0.5})`;
            c.fillRect(0, y, CANVAS_WIDTH, h);
        }
    }, 'Procedural: Glitch Horizontal Scanlines'));
}


// --- 5. Parameter Sync & Overrides ---
function syncUIAndParams() {
    gridSizeVal.innerText = `${params.gridSize}px`;
    animSpeedVal.innerText = params.speed.toFixed(1);
    glitchRateVal.innerText = `${Math.round(params.glitchRate * 100)}%`;
    complexityVal.innerText = params.complexity;
    colorBlendVal.innerText = params.colorBlend.toFixed(2);
    morphDurationVal.innerText = `${params.morphDuration}s`;
    displaceAmountVal.innerText = `${params.displaceAmount}px`;
    audioSensitivityVal.innerText = params.audioSensitivity.toFixed(1);
    
    // Synthesis Displays
    synthesisMixVal.innerText = `${Math.round(params.synthesisMix * 100)}%`;
    
    // Vibe Override display updates
    vibeVerticalVal.innerText = `${Math.round(params.manualVibe.vertical * 100)}%`;
    vibeHorizontalVal.innerText = `${Math.round(params.manualVibe.horizontal * 100)}%`;
    vibeEntropyVal2.innerText = `${Math.round(params.manualVibe.entropy * 100)}%`;
    vibeContrastVal2.innerText = `${Math.round(params.manualVibe.contrast * 100)}%`;
    
    if (params.autoMorph) {
        morphSpeedGroup.style.display = 'block';
    } else {
        morphSpeedGroup.style.display = 'none';
    }
    
    if (params.enableOverride) {
        vibeOverrideSliders.style.display = 'block';
    } else {
        vibeOverrideSliders.style.display = 'none';
    }
}

// Event Listeners for UI
gridSizeInput.addEventListener('input', (e) => { params.gridSize = parseInt(e.target.value); syncUIAndParams(); });
animSpeedInput.addEventListener('input', (e) => { params.speed = parseFloat(e.target.value); syncUIAndParams(); });
glitchRateInput.addEventListener('input', (e) => { params.glitchRate = parseInt(e.target.value) / 100; syncUIAndParams(); });
complexityInput.addEventListener('input', (e) => { params.complexity = parseInt(e.target.value); syncUIAndParams(); });
displaceAmountInput.addEventListener('input', (e) => { params.displaceAmount = parseInt(e.target.value); syncUIAndParams(); });
colorBlendInput.addEventListener('input', (e) => {
    params.colorBlend = parseFloat(e.target.value);
    if (params.autoMorph) {
        autoMorphInput.checked = false;
        params.autoMorph = false;
    }
    syncUIAndParams();
});
sampleMethod.addEventListener('change', (e) => { params.sampleMethod = e.target.value; });
visualPreset.addEventListener('change', (e) => { params.preset = e.target.value; });
autoMorphInput.addEventListener('change', (e) => {
    params.autoMorph = e.target.checked;
    if (params.autoMorph) morphStartTime = null;
    syncUIAndParams();
});
morphDurationInput.addEventListener('input', (e) => { params.morphDuration = parseInt(e.target.value); syncUIAndParams(); });
autoStopRecInput.addEventListener('change', (e) => { params.autoStopRec = e.target.checked; });
audioSensitivityInput.addEventListener('input', (e) => { params.audioSensitivity = parseFloat(e.target.value); syncUIAndParams(); });

// Image Synthesis Listeners
synthesisMixInput.addEventListener('input', (e) => { params.synthesisMix = parseInt(e.target.value) / 100; syncUIAndParams(); });
sourceSelectA.addEventListener('change', (e) => { activeSourceA = parseInt(e.target.value); updateInspectedVibeDisplay(); renderGallery(); });
sourceSelectB.addEventListener('change', (e) => { activeSourceB = parseInt(e.target.value); updateInspectedVibeDisplay(); renderGallery(); });

// Vibe Override Listeners
enableVibeOverride.addEventListener('change', (e) => {
    params.enableOverride = e.target.checked;
    syncUIAndParams();
});
vibeVerticalInput.addEventListener('input', (e) => { params.manualVibe.vertical = parseInt(e.target.value) / 100; syncUIAndParams(); });
vibeHorizontalInput.addEventListener('input', (e) => { params.manualVibe.horizontal = parseInt(e.target.value) / 100; syncUIAndParams(); });
vibeEntropyInput.addEventListener('input', (e) => { params.manualVibe.entropy = parseInt(e.target.value) / 100; syncUIAndParams(); });
vibeContrastInput.addEventListener('input', (e) => { params.manualVibe.contrast = parseInt(e.target.value) / 100; syncUIAndParams(); });

// Image File Input and Drag-and-Drop Listeners
fileInput.addEventListener('change', (e) => { handleImageUpload(e.target.files); });

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--accent-color)';
    dropZone.style.background = 'rgba(var(--accent-color-rgb), 0.05)';
});
dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    dropZone.style.background = 'rgba(255, 255, 255, 0.02)';
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    dropZone.style.background = 'rgba(255, 255, 255, 0.02)';
    if (e.dataTransfer.files.length > 0) handleImageUpload(e.dataTransfer.files);
});


// --- 6. Inspected Image & Vibe HUD Updates ---

function getVibeObjectByIndex(idx) {
    if (idx >= 0 && uploadedImages[idx]) {
        return uploadedImages[idx].vibeAnalysis;
    } else {
        const defaultIdx = Math.abs(idx) - 1;
        if (defaultGradients[defaultIdx]) {
            return defaultGradients[defaultIdx].vibeAnalysis;
        }
    }
    return defaultGradients[0].vibeAnalysis;
}

function getImageDataByIndex(index) {
    if (index >= 0 && uploadedImages[index]) {
        return uploadedImages[index].data;
    } else {
        const defaultIdx = Math.abs(index) - 1;
        if (defaultGradients[defaultIdx]) {
            return defaultGradients[defaultIdx].data;
        }
    }
    return defaultGradients[0] ? defaultGradients[0].data : null;
}

// Update HUD readouts based on currently selected Source A/B blend

function updateInspectedVibeDisplay() {
    vibeStatus.innerText = "ANALYZING...";
    vibeStatus.classList.remove('active');
    
    // Simulate analyzing latency for slick futuristic feel
    setTimeout(() => {
        const vibeA = getVibeObjectByIndex(activeSourceA);
        const vibeB = getVibeObjectByIndex(activeSourceB);
        const mix = params.synthesisMix;
        
        // Interpolate A & B values for HUD display
        const effVert = vibeA.vertical * (1 - mix) + vibeB.vertical * mix;
        const effHori = vibeA.horizontal * (1 - mix) + vibeB.horizontal * mix;
        const effEntr = vibeA.entropy * (1 - mix) + vibeB.entropy * mix;
        const effCont = vibeA.contrast * (1 - mix) + vibeB.contrast * mix;
        
        // Edge text
        if (Math.abs(effVert - effHori) < 0.1) {
            vibeEdgeBias.innerText = "Balanced Grid";
        } else if (effVert > effHori) {
            vibeEdgeBias.innerText = `Vertical Sorting (${Math.round(effVert * 100)}%)`;
        } else {
            vibeEdgeBias.innerText = `Horizontal Glitch (${Math.round(effHori * 100)}%)`;
        }
        
        // Entropy text
        if (effEntr > 0.6) {
            vibeEntropyVal.innerText = "High Glitch Noise";
        } else if (effEntr > 0.35) {
            vibeEntropyVal.innerText = "Medium Detail";
        } else {
            vibeEntropyVal.innerText = "Clean Structural Grid";
        }
        
        // Contrast text
        if (effCont > 0.55) {
            vibeContrastVal.innerText = "High Contrast Binary";
        } else {
            vibeContrastVal.innerText = "Soft Grayscale Curves";
        }
        
        // Update Color DNA Swatches
        vibeColorDna.innerHTML = '';
        const combinedPalette = [...vibeA.palette, ...vibeB.palette].slice(0, 6);
        combinedPalette.forEach(col => {
            const swatch = document.createElement('div');
            swatch.className = 'vibe-dna-color';
            swatch.style.background = col;
            vibeColorDna.appendChild(swatch);
        });
        
        vibeStatus.innerText = "READY";
        vibeStatus.classList.add('active');
    }, 350);
}


// --- 7. Image Upload & Gallery UI ---
function handleImageUpload(files) {
    Array.from(files).forEach((file) => {
        const isImage = file.type.startsWith('image/') || 
                        /\.(jpg|jpeg|png|gif|webp|jfif|svg)$/i.test(file.name);
        if (!isImage) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                offscreenCanvas.width = CANVAS_WIDTH;
                offscreenCanvas.height = CANVAS_HEIGHT;
                
                const imgRatio = img.width / img.height;
                const canvasRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
                let drawW, drawH, drawX, drawY;
                
                if (imgRatio > canvasRatio) {
                    drawH = CANVAS_HEIGHT;
                    drawW = CANVAS_HEIGHT * imgRatio;
                    drawX = (CANVAS_WIDTH - drawW) / 2;
                    drawY = 0;
                } else {
                    drawW = CANVAS_WIDTH;
                    drawH = CANVAS_WIDTH / imgRatio;
                    drawX = 0;
                    drawY = (CANVAS_HEIGHT - drawH) / 2;
                }
                
                offscreenCtx.fillStyle = '#000000';
                offscreenCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                offscreenCtx.drawImage(img, drawX, drawY, drawW, drawH);
                
                const imgData = offscreenCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                
                // Sobel analyze image
                const vibe = analyzeImageVibe(imgData);
                
                uploadedImages.push({
                    img: img,
                    data: imgData,
                    name: file.name,
                    vibeAnalysis: vibe
                });
                
                if (uploadedImages.length === 1) {
                    activeSourceA = 0;
                } else if (uploadedImages.length === 2) {
                    activeSourceB = 1;
                }
                
                activeImageIndex = uploadedImages.length - 1;
                populateDropdowns();
                updateInspectedVibeDisplay();
                renderGallery();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function populateDropdowns() {
    const updateSelect = (selectEl, activeVal) => {
        selectEl.innerHTML = '';
        defaultGradients.forEach((grad, index) => {
            const val = -(index + 1);
            const opt = document.createElement('option');
            opt.value = val; opt.innerText = grad.name; opt.selected = (activeVal === val);
            selectEl.appendChild(opt);
        });
        uploadedImages.forEach((imgObj, index) => {
            const opt = document.createElement('option');
            opt.value = index; opt.innerText = imgObj.name; opt.selected = (activeVal === index);
            selectEl.appendChild(opt);
        });
    };
    
    updateSelect(sourceSelectA, activeSourceA);
    updateSelect(sourceSelectB, activeSourceB);
}

function renderGallery() {
    imageGallery.innerHTML = '';
    
    const checkBadgeClass = (val) => {
        let classes = [];
        if (activeSourceA === val) classes.push('source-a');
        if (activeSourceB === val) classes.push('source-b');
        return classes.join(' ');
    };
    
    defaultGradients.forEach((grad, index) => {
        const val = -(index + 1);
        const item = document.createElement('div');
        item.className = `gallery-item ${activeImageIndex === val ? 'active' : ''} ${checkBadgeClass(val)}`;
        item.innerHTML = `<img src="${grad.img.toDataURL()}" title="${grad.name}">`;
        item.addEventListener('click', () => {
            activeImageIndex = val;
            renderGallery();
        });
        imageGallery.appendChild(item);
    });

    uploadedImages.forEach((imgObj, index) => {
        const item = document.createElement('div');
        item.className = `gallery-item ${activeImageIndex === index ? 'active' : ''} ${checkBadgeClass(index)}`;
        
        const imgTag = document.createElement('img');
        imgTag.src = imgObj.img.src;
        imgTag.title = imgObj.name;
        item.appendChild(imgTag);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            uploadedImages.splice(index, 1);
            
            if (activeSourceA === index) activeSourceA = -1;
            if (activeSourceB === index) activeSourceB = -2;
            if (activeImageIndex === index) activeImageIndex = -1;
            
            if (activeSourceA > index) activeSourceA--;
            if (activeSourceB > index) activeSourceB--;
            if (activeImageIndex > index) activeImageIndex--;
            
            populateDropdowns();
            updateInspectedVibeDisplay();
            renderGallery();
        });
        item.appendChild(deleteBtn);

        item.addEventListener('click', () => {
            activeImageIndex = index;
            renderGallery();
        });
        
        imageGallery.appendChild(item);
    });
}


// --- 8. Audio Reactive Logic (Web Audio API) ---

function initAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        audioBufferLength = analyser.frequencyBinCount;
        audioDataArray = new Uint8Array(audioBufferLength);
        
        audioSource = audioCtx.createMediaElementSource(audioElement);
        audioSource.connect(analyser);
        analyser.connect(audioCtx.destination);
    }
}

function handleAudioUpload(file) {
    if (!file) return;
    
    initAudioContext();
    const fileURL = URL.createObjectURL(file);
    audioElement.src = fileURL;
    audioTrackName.innerText = file.name;
    audioControlsContainer.style.display = 'block';
    audioPlayBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`;
    isAudioPlaying = false;
}

audioFileInput.addEventListener('change', (e) => { handleAudioUpload(e.target.files[0]); });

audioDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    audioDropZone.style.borderColor = 'var(--accent-secondary)';
    audioDropZone.style.background = 'rgba(0, 240, 255, 0.03)';
});
audioDropZone.addEventListener('dragleave', () => {
    audioDropZone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    audioDropZone.style.background = 'rgba(255, 255, 255, 0.02)';
});
audioDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    audioDropZone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    audioDropZone.style.background = 'rgba(255, 255, 255, 0.02)';
    if (e.dataTransfer.files.length > 0) handleAudioUpload(e.dataTransfer.files[0]);
});

audioPlayBtn.addEventListener('click', () => {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    if (!isAudioPlaying) {
        audioElement.play();
        isAudioPlaying = true;
        audioPlayBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/></svg>`;
    } else {
        audioElement.pause();
        isAudioPlaying = false;
        audioPlayBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`;
    }
});

audioStopBtn.addEventListener('click', () => {
    if (!audioCtx) return;
    audioElement.pause();
    audioElement.currentTime = 0;
    isAudioPlaying = false;
    audioPlayBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`;
    audioReactivity = { bass: 0, mids: 0, treble: 0, volume: 0 };
});

function updateAudioAnalysis() {
    if (!isAudioPlaying || !analyser) {
        audioReactivity = { bass: 0, mids: 0, treble: 0, volume: 0 };
        return;
    }
    
    analyser.getByteFrequencyData(audioDataArray);
    
    let bassSum = 0;
    let midsSum = 0;
    let trebleSum = 0;
    let totalSum = 0;
    
    const bassLimit = Math.floor(audioBufferLength * 0.12);
    const midsLimit = Math.floor(audioBufferLength * 0.45);
    
    for (let i = 0; i < audioBufferLength; i++) {
        const val = audioDataArray[i];
        totalSum += val;
        
        if (i < bassLimit) bassSum += val;
        else if (i < midsLimit) midsSum += val;
        else trebleSum += val;
    }
    
    const sensitivity = params.audioSensitivity;
    
    audioReactivity.bass = (bassSum / bassLimit / 255) * sensitivity;
    audioReactivity.mids = (midsSum / (midsLimit - bassLimit) / 255) * sensitivity;
    audioReactivity.treble = (trebleSum / (audioBufferLength - midsLimit) / 255) * sensitivity;
    audioReactivity.volume = (totalSum / audioBufferLength / 255) * sensitivity;
    
    drawMiniVisualizer();
}

function drawMiniVisualizer() {
    if (!audioVisualizerCtx || !audioDataArray) return;
    const w = audioVisualizer.width;
    const h = audioVisualizer.height;
    
    audioVisualizerCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    audioVisualizerCtx.fillRect(0, 0, w, h);
    
    const barWidth = (w / audioBufferLength) * 1.5;
    let x = 0;
    
    for (let i = 0; i < audioBufferLength; i++) {
        const barHeight = (audioDataArray[i] / 255) * h * 0.9;
        const ratio = i / audioBufferLength;
        audioVisualizerCtx.fillStyle = `rgb(${Math.floor(ratio * 255)}, ${Math.floor((1 - ratio) * 240)}, 255)`;
        audioVisualizerCtx.fillRect(x, h - barHeight, barWidth - 1, barHeight);
        x += barWidth;
    }
}


// --- 9. Image Synthesis Blending Functions ---

function getNoiseVal(x, y, t) {
    const wave1 = Math.sin(x * 0.005 + t * 2.0) * Math.cos(y * 0.004 + t * 1.5);
    const wave2 = Math.sin(y * 0.015 - t * 3.0) * Math.cos(x * 0.02 - t * 0.8);
    const wave3 = Math.sin((x + y) * 0.008 + t);
    return (wave1 + wave2 * 0.5 + wave3 * 0.3) / 1.8;
}

function sampleColorFromData(imgData, x, y) {
    if (!imgData) return { r: 128, g: 128, b: 128 };
    const px = Math.min(CANVAS_WIDTH - 1, Math.max(0, Math.floor(x)));

    const py = Math.min(CANVAS_HEIGHT - 1, Math.max(0, Math.floor(y)));
    const index = (py * CANVAS_WIDTH + px) * 4;
    return {
        r: imgData.data[index],
        g: imgData.data[index + 1],
        b: imgData.data[index + 2]
    };
}

// Blends structures and textures from Source A and Source B
function getSynthesizedSample(x, y) {
    const imgA = getImageDataByIndex(activeSourceA);
    const imgB = getImageDataByIndex(activeSourceB);
    
    const colA = sampleColorFromData(imgA, x, y);
    const colB = sampleColorFromData(imgB, x, y);
    
    const mix = params.synthesisMix;
    
    // Average blending of color pixels
    return {
        r: Math.floor(colA.r * (1 - mix) + colB.r * mix),
        g: Math.floor(colA.g * (1 - mix) + colB.g * mix),
        b: Math.floor(colA.b * (1 - mix) + colB.b * mix)
    };
}


// --- 10. Vibe Drawing Engines ---

// Draw Grid Blocks (corresponds to grid/block architectural layouts)
function drawGridBlocks(progress, activeGridSize, activeDisplace, effContrast) {
    const size = activeGridSize;
    
    for (let y = 0; y < CANVAS_HEIGHT; y += size) {
        for (let x = 0; x < CANVAS_WIDTH; x += size) {
            const noise = (getNoiseVal(x, y, time) + 1) / 2;
            if (noise < 0.35) continue;
            
            let sampleX = x + size/2;
            let sampleY = y + size/2;
            
            // Warp coordinate if displace is active
            if (activeDisplace > 0) {
                const synthCol = getSynthesizedSample(sampleX, sampleY);
                const lum = (synthCol.r * 299 + synthCol.g * 587 + synthCol.b * 114) / 1000;
                sampleX += Math.sin(y * 0.015 + time * 3) * (lum / 255) * activeDisplace;
                sampleY += Math.cos(x * 0.015 + time * 3.5) * (lum / 255) * activeDisplace;
            }
            
            const synthCol = getSynthesizedSample(sampleX, sampleY);
            const grayVal = Math.floor(noise * 255);
            
            // Blend grayscale block with synthesized color
            let r = Math.floor(grayVal * (1 - progress) + synthCol.r * progress);
            let g = Math.floor(grayVal * (1 - progress) + synthCol.g * progress);
            let b = Math.floor(grayVal * (1 - progress) + synthCol.b * progress);
            
            // Apply schematic binary contrast thresholding if contrast weight is high
            if (effContrast > 0.5) {
                const lum = (r * 299 + g * 587 + b * 114) / 1000;
                const thresh = lum > 128 ? 255 : 0;
                r = Math.floor(r * (1 - effContrast) + thresh * effContrast);
                g = Math.floor(g * (1 - effContrast) + thresh * effContrast);
                b = Math.floor(b * (1 - effContrast) + thresh * effContrast);
            }
            
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${noise * 0.95})`;
            
            const fillScale = 0.5 + (noise * 0.5);
            const w = size * fillScale;
            const h = size * fillScale;
            const offsetX = (size - w) / 2;
            const offsetY = (size - h) / 2;
            
            ctx.fillRect(x + offsetX, y + offsetY, w, h);
        }
    }
}

// Draw Horizontal Scanline Glitches (driven by Horizontal Edge Bias)
function drawHorizontalVibe(progress, activeDisplace, effHorizontal) {
    const bandCount = 15 + Math.floor(25 * effHorizontal);
    const bandHeight = CANVAS_HEIGHT / bandCount;
    
    for (let i = 0; i < bandCount; i++) {
        const y = i * bandHeight;
        const noise = getNoiseVal(0, y, time * 0.8);
        
        let offset = 0;
        // High horizontal bias increases shifts and jitter rates
        if (Math.random() < (0.15 + audioReactivity.bass * 0.3)) {
            offset = (Math.random() - 0.5) * 200 * effHorizontal * (1 + progress);
        }
        
        let sampleX = CANVAS_WIDTH/2 + offset;
        let sampleY = Math.min(CANVAS_HEIGHT - 1, Math.max(0, y + bandHeight/2));
        
        if (activeDisplace > 0) {
            const synthCol = getSynthesizedSample(sampleX, sampleY);
            const lum = (synthCol.r * 299 + synthCol.g * 587 + synthCol.b * 114) / 1000;
            sampleX += Math.sin(y * 0.05 + time) * (lum / 255) * activeDisplace;
        }
        
        const synthCol = getSynthesizedSample(sampleX, sampleY);
        const grayVal = Math.floor(((noise + 1)/2) * 200 + 55);
        
        const r = Math.floor(grayVal * (1 - progress) + synthCol.r * progress);
        const g = Math.floor(grayVal * (1 - progress) + synthCol.g * progress);
        const b = Math.floor(grayVal * (1 - progress) + synthCol.b * progress);
        
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.2 + (noise+1)/2 * 0.7})`;
        ctx.fillRect(offset, y, CANVAS_WIDTH, bandHeight - 2);
    }
}

// Draw Vertical Sorting/Waterfall Stretches (driven by Vertical Edge Bias)
// Recreates the exact vertical waterfall visual lines from the references
function drawVerticalVibe(progress, effVertical) {
    const volumeFactor = 1.0 + (audioReactivity.volume * 2.5);
    const stripCount = Math.floor((10 + Math.random() * 20) * effVertical * volumeFactor);
    
    for (let i = 0; i < stripCount; i++) {
        const w = 4 + Math.floor(Math.random() * 32);
        const x = Math.floor(Math.random() * (CANVAS_WIDTH - w));
        const y = Math.floor(Math.random() * (CANVAS_HEIGHT * 0.4));
        
        // Stretch lines downwards (waterfall style)
        const h = 80 + Math.floor(Math.random() * 600 * effVertical * volumeFactor * (progress + 0.2));
        
        try {
            // Sample canvas pixels and draw them stretched down
            ctx.drawImage(canvas, x, y, w, 2, x, y, w, h);
        } catch(e) {}
    }
}

// Draw Connecting Net/Dots Details (driven by Entropy/Complexity)
function drawDetailVibe(progress, activeGridSize, activeDisplace, effEntropy) {
    const size = activeGridSize * 1.5;
    const columns = Math.ceil(CANVAS_WIDTH / size);
    const rows = Math.ceil(CANVAS_HEIGHT / size);
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            const x = c * size;
            const y = r * size;
            
            const noise = (getNoiseVal(x, y, time * 1.2) + 1) / 2;
            if (noise < 0.45) continue;
            
            let sampleX = x + size/2;
            let sampleY = y + size/2;
            
            const synthCol = getSynthesizedSample(sampleX, sampleY);
            const grayVal = noise > 0.8 ? 255 : 0;
            
            const red = Math.floor(grayVal * (1 - progress) + synthCol.r * progress);
            const green = Math.floor(grayVal * (1 - progress) + synthCol.g * progress);
            const blue = Math.floor(grayVal * (1 - progress) + synthCol.b * progress);
            
            ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.9)`;
            ctx.strokeStyle = `rgba(${red}, ${green}, ${blue}, 0.6)`;
            
            // Halftone circles or crosshairs
            if (noise > 0.75) {
                const radius = (size / 3) * noise * (1.0 + audioReactivity.treble * 0.3);
                ctx.beginPath();
                ctx.arc(x + size/2, y + size/2, Math.max(1, radius), 0, Math.PI * 2);
                ctx.fill();
            } else if (effEntropy > 0.5) {
                // Micro technical crosshair
                const pad = size * 0.35;
                ctx.beginPath();
                ctx.moveTo(x + size/2, y + pad);
                ctx.lineTo(x + size/2, y + size - pad);
                ctx.moveTo(x + pad, y + size/2);
                ctx.lineTo(x + size - pad, y + size/2);
                ctx.stroke();
            }
        }
    }
}


// --- 11. Core Animation Rendering Loop ---

function animate(timestamp) {
    if (!ctx) return;
    
    // Update audio bands
    updateAudioAnalysis();
    
    const bassFactor = audioReactivity.bass;
    const midsFactor = audioReactivity.mids;
    
    // Speed increases on mids/vocals
    const speedMultiplier = 1.0 + (midsFactor * 1.5);
    time += (params.speed * speedMultiplier * 0.012);
    
    // Grid size pulses to the bass beats
    const activeGridSize = Math.max(6, Math.floor(params.gridSize + (bassFactor * 32)));
    
    // Displacement map wiggles dynamically to music, scaled by the slider parameter
    const activeDisplace = params.displaceAmount * bassFactor;
    
    // 1. Compute visual weights from current Source A & Source B image analysis
    const vibeA = getVibeObjectByIndex(activeSourceA);
    const vibeB = getVibeObjectByIndex(activeSourceB);
    const mix = params.synthesisMix;
    
    let effVertical, effHorizontal, effEntropy, effContrast;
    
    if (params.enableOverride) {
        // Read directly from manual override sliders
        effVertical = params.manualVibe.vertical;
        effHorizontal = params.manualVibe.horizontal;
        effEntropy = params.manualVibe.entropy;
        effContrast = params.manualVibe.contrast;
    } else {
        // Interpolate structural characteristics learned from the images!
        effVertical = vibeA.vertical * (1 - mix) + vibeB.vertical * mix;
        effHorizontal = vibeA.horizontal * (1 - mix) + vibeB.horizontal * mix;
        effEntropy = vibeA.entropy * (1 - mix) + vibeB.entropy * mix;
        effContrast = vibeA.contrast * (1 - mix) + vibeB.contrast * mix;
    }
    
    // 2. Auto Morph blend state progression
    if (params.autoMorph) {
        if (!morphStartTime) morphStartTime = timestamp;
        const elapsed = (timestamp - morphStartTime) / 1000;
        const duration = params.morphDuration;
        
        let p = (elapsed % duration) / duration;
        if (Math.floor(elapsed / duration) % 2 === 1) {
            p = 1 - p;
        }
        
        params.colorBlend = p;
        colorBlendInput.value = p;
        colorBlendVal.innerText = p.toFixed(2);
        
        if (isRecording && params.autoStopRec) {
            if (elapsed >= duration * 2) {
                stopRecording();
            }
        }
    }
    
    const progress = params.colorBlend;
    
    ctx.save();
    
    // Screen Shake on beats
    if (bassFactor > 0.5) {
        const shake = (bassFactor - 0.5) * 12;
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }
    
    // Fading trails for digital motion blur
    const trailOpacity = Math.max(0.12, 0.28 - (audioReactivity.volume * 0.12));
    ctx.fillStyle = `rgba(8, 8, 12, ${trailOpacity})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 3. Render visual components based on the analyzed style weights
    // If the image vibe is balanced/grid-like: draw blocks
    drawGridBlocks(progress, activeGridSize, activeDisplace, effContrast);
    
    // If the image has high horizontal edges (scanlines): draw horizontal lines
    if (effHorizontal > 0.3) {
        drawHorizontalVibe(progress, activeDisplace, effHorizontal);
    }
    
    // If the image is highly detailed (high entropy/noise): draw dots & connecting lines
    if (effEntropy > 0.35) {
        drawDetailVibe(progress, activeGridSize, activeDisplace, effEntropy);
    }
    
    // If the image has high vertical edges (waterfall sort): draw vertical sorted strips
    // This is overlayed last to stretch underlying pixels down
    if (effVertical > 0.3) {
        drawVerticalVibe(progress, effVertical);
    }
    
    // Sudden horizontal glitches (increases on bass hits)
    const activeGlitchRate = params.glitchRate + (bassFactor * 0.4) + (effEntropy * 0.2);
    if (Math.random() < activeGlitchRate * 0.05) {
        applyGlitchShift(bassFactor);
    }
    
    ctx.restore();
    
    // Update recording HUD text
    if (isRecording) {
        const durationSec = (Date.now() - recStartTime) / 1000;
        const minutes = Math.floor(durationSec / 60).toString().padStart(2, '0');
        const seconds = Math.floor(durationSec % 60).toString().padStart(2, '0');
        const tenths = Math.floor((durationSec * 10) % 10);
        recTimeText.innerText = `${minutes}:${seconds}.${tenths}`;
    }
    
    animationFrameId = requestAnimationFrame(animate);
}

// Slice offset glitch
function applyGlitchShift(bassFactor) {
    const slices = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < slices; i++) {
        const h = 20 + Math.floor(Math.random() * 120);
        const y = Math.floor(Math.random() * (CANVAS_HEIGHT - h));
        const offset = (Math.random() - 0.5) * 80 * (1.0 + bassFactor * 2.0);
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, y, CANVAS_WIDTH, h);
        ctx.clip();
        ctx.drawImage(canvas, offset, 0);
        ctx.restore();
    }
}


// --- 12. Video Recording Module ---

function startRecording() {
    recordedChunks = [];
    
    const streamOptions = {
        videoBitsPerSecond: 8000000
    };
    if (selectedMimeType) {
        streamOptions.mimeType = selectedMimeType;
    }
    
    try {
        stream = canvas.captureStream(60);
        mediaRecorder = new MediaRecorder(stream, streamOptions);
    } catch (e) {
        console.warn("Falling back to 30 FPS recording stream.");
        stream = canvas.captureStream(30);
        mediaRecorder = new MediaRecorder(stream, streamOptions);
    }
    
    mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };
    
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: selectedMimeType });
        
        recStatusText.innerText = "CONVERTING TO MP4...";
        
        const backendUrl = (window.location.protocol === 'file:' || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '8080')
            ? 'http://localhost:8080/upload-convert'
            : '/upload-convert';
        
        fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': selectedMimeType
            },
            body: blob
        })
        .then(async response => {
            if (!response.ok) {
                let errorMsg = "HTTP error " + response.status + " during conversion.";
                try {
                    const errData = await response.json();
                    if (errData && errData.error) {
                        errorMsg = errData.error;
                    }
                } catch (e) {
                    // Not JSON response, use default HTTP error message
                }
                throw new Error(errorMsg);
            }
            return response.blob();
        })
        .then(mp4Blob => {
            const mp4Url = URL.createObjectURL(mp4Blob);
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style = 'display: none';
            a.href = mp4Url;
            
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
            a.download = `vibe-visualizer-${timestamp}.mp4`;
            a.click();
            
            window.URL.revokeObjectURL(mp4Url);
            document.body.removeChild(a);
            
            recStatusText.innerText = "SAVED SUCCESSFULLY!";
            setTimeout(() => { recStatusHud.style.display = 'none'; }, 2000);
        })
        .catch(err => {
            console.error("Conversion failed:", err);
            recStatusText.innerText = "ERROR IN CONVERSION";
            
            showErrorModal("MP4 Conversion Failed", err.message);
            setTimeout(() => { recStatusHud.style.display = 'none'; }, 5000);
        });
    };
    
    mediaRecorder.start();
    
    isRecording = true;
    recStartTime = Date.now();
    morphStartTime = null;
    params.colorBlend = 0;
    
    recordBtn.classList.add('recording');
    recordBtn.querySelector('.btn-text').innerText = "Stop & Save Video";
    
    recStatusText.innerText = "RECORDING";
    recStatusHud.style.display = 'flex';
}

function stopRecording() {
    if (!isRecording) return;
    
    mediaRecorder.stop();
    isRecording = false;
    
    recordBtn.classList.remove('recording');
    recordBtn.querySelector('.btn-text').innerText = "Start Recording";
    
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
}

recordBtn.addEventListener('click', () => {
    if (!isRecording) startRecording();
    else stopRecording();
});


function showErrorModal(title, message) {
    const existing = document.getElementById('error-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'error-modal-overlay';
    overlay.style = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(8, 8, 12, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        font-family: 'Outfit', sans-serif;
    `;

    const modal = document.createElement('div');
    modal.style = `
        background: rgba(20, 20, 35, 0.95);
        border: 1px solid var(--accent-color, #ff2a5f);
        box-shadow: 0 10px 40px rgba(255, 42, 95, 0.25);
        border-radius: 12px;
        padding: 28px;
        width: 480px;
        max-width: 90%;
        text-align: left;
        color: #f0f2f5;
        position: relative;
    `;

    const titleEl = document.createElement('h3');
    titleEl.innerText = title;
    titleEl.style = `
        color: var(--accent-color, #ff2a5f);
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 14px;
        font-family: 'JetBrains Mono', monospace;
        letter-spacing: 1px;
        text-transform: uppercase;
    `;

    const msgEl = document.createElement('p');
    msgEl.innerHTML = message.replace(/\n/g, '<br>');
    msgEl.style = `
        font-size: 13px;
        line-height: 1.6;
        color: #9aa0a6;
        margin-bottom: 24px;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerText = "CLOSE";
    closeBtn.style = `
        background: var(--accent-color, #ff2a5f);
        color: #fff;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        font-family: 'JetBrains Mono', monospace;
        float: right;
        box-shadow: 0 0 10px rgba(255, 42, 95, 0.3);
        transition: all 0.2s;
    `;
    closeBtn.onmouseover = () => { closeBtn.style.background = '#ff4774'; };
    closeBtn.onmouseout = () => { closeBtn.style.background = 'var(--accent-color, #ff2a5f)'; };
    closeBtn.onclick = () => { overlay.remove(); };

    modal.appendChild(titleEl);
    modal.appendChild(msgEl);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

// --- 13. Initialization ---
function init() {
    selectRecordingFormat();
    generateDefaultGradients();
    populateDropdowns();
    syncUIAndParams();
    updateInspectedVibeDisplay();
    renderGallery();
    
    requestAnimationFrame(animate);
}

init();
