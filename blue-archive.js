/**
 * =============================================
 * Galeri Blue Archive - Aplikasi JavaScript
 * =============================================
 * 
 * Aplikasi ini mengambil gambar acak dari API Blue Archive 
 * dan menampilkannya dalam galeri yang interaktif.
 * 
 * Fitur:
 * - Pengambilan gambar acak dari API
 * - Penyimpanan sementara (cache) gambar
 * - Statistik penggunaan
 * - Notifikasi real-time
 * - Mode debug untuk pengembangan
 */

// =============================================
// Konfigurasi dan State Aplikasi
// =============================================
const app = {
    // Elemen DOM
    elements: {
        imageContainer: document.getElementById('imageContainer'),
        loadingSpinner: document.getElementById('loadingSpinner'),
        errorMessage: document.getElementById('errorMessage'),
        errorText: document.getElementById('errorText'),
        totalImages: document.getElementById('totalImages'),
        fetchCount: document.getElementById('fetchCount'),
        lastFetch: document.getElementById('lastFetch'),
        cacheSize: document.getElementById('cacheSize'),
        fetchSingleBtn: document.getElementById('fetchSingleBtn'),
        fetchMultipleBtn: document.getElementById('fetchMultipleBtn'),
        clearGalleryBtn: document.getElementById('clearGalleryBtn'),
        toastContainer: document.getElementById('toastContainer'),
        apiStatusIndicator: document.getElementById('apiStatusIndicator'),
        apiStatusDot: document.getElementById('apiStatusDot'),
        apiStatusText: document.getElementById('apiStatusText'),
        debugContent: document.getElementById('debugContent'),
        refreshIndicator: document.getElementById('refreshIndicator'),
        cacheInfo: document.getElementById('cacheInfo'),
        previewImage: document.getElementById('previewImage'),
        heroParticles: document.getElementById('heroParticles'),
        mainNav: document.getElementById('mainNav')
    },
    
    // Statistik aplikasi
    stats: {
        totalImages: 0,
        fetchCount: 0,
        lastFetchTime: null
    },
    
    // Pengaturan default
    settings: {
        batchSize: 6,
        autoRefresh: 0,
        showNotifications: true,
        debugMode: false,
        enableCache: true,
        maxCacheSize: 10 // dalam MB
    },
    
    // Cache untuk menyimpan gambar
    imageCache: new Map(),
    
    // Interval untuk auto refresh
    autoRefreshInterval: null,
    
    // Konfigurasi API
    api: {
        endpoint: 'https://api.siputzx.my.id/api/r/blue-archive',
        headers: {
            'Accept': '*/*'
        }
    }
};

// =============================================
// Fungsi Inisialisasi
// =============================================
/**
 * Inisialisasi aplikasi saat DOM dimuat
 */
function init() {
    console.log('🚀 Memulai Galeri Blue Archive...');
    
    // Muat pengaturan dari localStorage
    loadSettings();
    
    // Update tampilan awal
    updateLastFetchTime();
    updateCacheInfo();
    
    // Periksa status API
    checkApiStatus();
    
    // Setup event listeners
    setupEventListeners();
    
    // Buat efek partikel di hero
    createHeroParticles();
    
    // Setup efek scroll navbar
    setupNavbarScroll();
    
    console.log('✅ Aplikasi berhasil diinisialisasi');
}

// =============================================
// Fungsi UI dan Efek Visual
// =============================================
/**
 * Membuat partikel melayang di bagian hero
 */
function createHeroParticles() {
    const particlesContainer = app.elements.heroParticles;
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Ukuran acak
        const size = Math.random() * 5 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Posisi acak
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        
        // Delay animasi acak
        const delay = Math.random() * 5;
        particle.style.animationDelay = `${delay}s`;
        
        // Opacity acak
        const opacity = Math.random() * 0.5 + 0.2;
        particle.style.opacity = opacity;
        
        particlesContainer.appendChild(particle);
    }
}

/**
 * Setup efek scroll pada navbar
 */
function setupNavbarScroll() {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            app.elements.mainNav.classList.add('scrolled');
        } else {
            app.elements.mainNav.classList.remove('scrolled');
        }
    });
}

/**
 * Setup semua event listeners
 */
function setupEventListeners() {
    // Tombol aksi
    app.elements.fetchSingleBtn.addEventListener('click', fetchSingleImage);
    app.elements.fetchMultipleBtn.addEventListener('click', fetchMultipleImages);
    app.elements.clearGalleryBtn.addEventListener('click', clearGallery);
    
    // Tombol simpan pengaturan
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    
    console.log('🎯 Event listeners berhasil di-setup');
}

// =============================================
// Fungsi API
// =============================================
/**
 * Memeriksa status API
 */
async function checkApiStatus() {
    updateApiStatus('checking', 'Memeriksa status API...');
    
    try {
        const response = await fetch(app.api.endpoint, {
            method: 'GET',
            headers: app.api.headers
        });
        
        if (response.ok) {
            updateApiStatus('online', 'API online dan merespon');
            console.log('🌐 API Status: Online');
        } else {
            throw new Error(`API merespon dengan status: ${response.status}`);
        }
    } catch (error) {
        updateApiStatus('offline', 'API offline atau tidak merespon');
        console.error('❌ Pemeriksaan status API gagal:', error);
    }
}

/**
 * Mengambil satu gambar acak dari API
 */
async function fetchSingleImage() {
    showLoading(true);
    hideError();
    
    try {
        console.log('📥 Mengambil gambar acak...');
        
        const response = await fetch(app.api.endpoint, {
            method: 'GET',
            headers: app.api.headers
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP! Status: ${response.status}`);
        }
        
        // Periksa tipe konten respons
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            // Tangani respons JSON
            const data = await response.json();
            processJsonResponse(data);
        } else {
            // Tangani respons biner
            const blob = await response.blob();
            processBinaryResponse(blob);
        }
        
        updateStats();
        
        if (app.settings.showNotifications) {
            showToast('Gambar berhasil diambil!', 'success');
        }
        
        console.log('✅ Gambar berhasil diambil');
    } catch (error) {
        console.error('❌ Error mengambil gambar:', error);
        showError(`Gagal mengambil gambar: ${error.message}`);
        
        if (app.settings.showNotifications) {
            showToast('Gagal mengambil gambar. Silakan coba lagi.', 'error');
        }
    } finally {
        showLoading(false);
    }
}

/**
 * Mengambil beberapa gambar acak dari API
 */
async function fetchMultipleImages() {
    showLoading(true);
    hideError();
    
    try {
        console.log(`📥 Mengambil ${app.settings.batchSize} gambar...`);
        
        const batchSize = app.settings.batchSize;
        const fetchPromises = [];
        
        // Buat promise untuk setiap pengambilan
        for (let i = 0; i < batchSize; i++) {
            fetchPromises.push(
                fetch(app.api.endpoint, {
                    method: 'GET',
                    headers: app.api.headers
                })
            );
        }
        
        const responses = await Promise.all(fetchPromises);
        let successCount = 0;
        
        // Proses setiap respons
        for (const response of responses) {
            try {
                if (!response.ok) {
                    throw new Error(`Error HTTP! Status: ${response.status}`);
                }
                
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    processJsonResponse(data);
                    successCount++;
                } else {
                    const blob = await response.blob();
                    processBinaryResponse(blob);
                    successCount++;
                }
            } catch (error) {
                console.error('Error memproses respons:', error);
            }
        }
        
        updateStats();
        
        if (app.settings.showNotifications) {
            if (successCount > 0) {
                showToast(`${successCount} gambar berhasil diambil!`, 'success');
            } else {
                showToast('Tidak ada gambar valid ditemukan dalam respons API', 'warning');
            }
        }
        
        console.log(`✅ ${successCount} gambar berhasil diambil`);
    } catch (error) {
        console.error('❌ Error mengambil gambar:', error);
        showError(`Gagal mengambil gambar: ${error.message}`);
        
        if (app.settings.showNotifications) {
            showToast('Gagal mengambil gambar. Silakan coba lagi.', 'error');
        }
    } finally {
        showLoading(false);
    }
}

// =============================================
// Fungsi Pemrosesan Respons
// =============================================
/**
 * Memproses respons JSON dari API
 */
function processJsonResponse(data) {
    // Mode debug - tampilkan respons API
    if (app.settings.debugMode) {
        console.log('🔍 Respons API:', data);
        app.elements.debugContent.textContent = JSON.stringify(data, null, 2);
        const debugModal = new bootstrap.Modal(document.getElementById('debugModal'));
        debugModal.show();
    }
    
    // Cari URL gambar dalam respons
    let imageUrl = '';
    
    if (data && typeof data === 'object') {
        // Coba berbagai struktur respons yang mungkin
        const possibleFields = ['url', 'image', 'data.url', 'data.image', 'result.url', 'result.image'];
        
        for (const field of possibleFields) {
            const value = getNestedValue(data, field);
            if (value && typeof value === 'string' && value.includes('http')) {
                imageUrl = value;
                break;
            }
        }
        
        // Jika tidak ditemukan, cari URL apa saja dalam objek
        if (!imageUrl) {
            const possibleUrls = Object.values(data).filter(val => 
                typeof val === 'string' && (val.includes('http') || val.includes('img'))
            );
            if (possibleUrls.length > 0) {
                imageUrl = possibleUrls[0];
            }
        }
    } else if (typeof data === 'string' && data.includes('http')) {
        imageUrl = data;
    }
    
    if (imageUrl) {
        addImageToGallery(imageUrl);
    } else {
        throw new Error('Tidak dapat mengekstrak URL gambar dari respons API');
    }
}

/**
 * Memproses respons biner dari API
 */
function processBinaryResponse(blob) {
    // Buat URL untuk blob
    const imageUrl = URL.createObjectURL(blob);
    
    // Tambahkan ke cache jika diaktifkan
    if (app.settings.enableCache) {
        const cacheKey = `binary_${Date.now()}`;
        app.imageCache.set(cacheKey, {
            url: imageUrl,
            blob: blob,
            timestamp: Date.now()
        });
        updateCacheInfo();
    }
    
    // Tambahkan ke galeri
    addImageToGallery(imageUrl);
}

/**
 * Helper function untuk mendapatkan nilai nested object
 */
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
}

// =============================================
// Fungsi Galeri
// =============================================
/**
 * Menambahkan gambar ke galeri
 */
function addImageToGallery(imageUrl) {
    const imageCard = document.createElement('div');
    imageCard.className = 'image-card';
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'Gambar Blue Archive';
    img.loading = 'lazy';
    
    // Handle error loading gambar
    img.onerror = function() {
        this.src = 'https://picsum.photos/seed/bluearchive/400/300.jpg';
        if (app.settings.showNotifications) {
            showToast('Gambar gagal dimuat, menampilkan placeholder', 'warning');
        }
    };
    
    // Buat overlay dengan tombol aksi
    const overlay = document.createElement('div');
    overlay.className = 'image-overlay';
    
    const overlayActions = document.createElement('div');
    overlayActions.className = 'overlay-actions';
    
    // Tombol download
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'overlay-btn';
    downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
    downloadBtn.addEventListener('click', () => downloadImage(imageUrl));
    
    // Tombol view
    const viewBtn = document.createElement('button');
    viewBtn.className = 'overlay-btn';
    viewBtn.innerHTML = '<i class="fas fa-expand"></i>';
    viewBtn.addEventListener('click', () => viewImage(imageUrl));
    
    overlayActions.appendChild(downloadBtn);
    overlayActions.appendChild(viewBtn);
    overlay.appendChild(overlayActions);
    
    imageCard.appendChild(img);
    imageCard.appendChild(overlay);
    
    app.elements.imageContainer.appendChild(imageCard);
    app.stats.totalImages++;
    app.elements.totalImages.textContent = app.stats.totalImages;
}

/**
 * Membersihkan galeri
 */
function clearGallery() {
    app.elements.imageContainer.innerHTML = '';
    app.stats.totalImages = 0;
    app.elements.totalImages.textContent = app.stats.totalImages;
    
    if (app.settings.showNotifications) {
        showToast('Galeri dibersihkan', 'info');
    }
    
    console.log('🧹 Galeri dibersihkan');
}

/**
 * Mengunduh gambar
 */
function downloadImage(url) {
    const link = document.createElement('a');
    link.href = url;
    link.download = `blue-archive-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (app.settings.showNotifications) {
        showToast('Pengunduhan gambar dimulai', 'success');
    }
    
    console.log('💾 Gambar diunduh');
}

/**
 * Melihat gambar dalam ukuran penuh
 */
function viewImage(url) {
    app.elements.previewImage.src = url;
    const previewModal = new bootstrap.Modal(document.getElementById('imagePreviewModal'));
    previewModal.show();
}

// =============================================
// Fungsi Cache
// =============================================
/**
 * Menghitung ukuran cache dalam MB
 */
function calculateCacheSize() {
    let totalSize = 0;
    
    app.imageCache.forEach(item => {
        if (item.blob) {
            totalSize += item.blob.size;
        }
    });
    
    return totalSize / (1024 * 1024); // Konversi ke MB
}

/**
 * Membersihkan cache jika melebihi ukuran maksimum
 */
function cleanupCache() {
    if (!app.settings.enableCache) return;
    
    const cacheSizeInMB = calculateCacheSize();
    
    if (cacheSizeInMB > app.settings.maxCacheSize) {
        // Urutkan item cache berdasarkan timestamp (terlama dulu)
        const sortedItems = Array.from(app.imageCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        // Hapus item terlama hingga cache di bawah batas
        let removedCount = 0;
        for (const [key, item] of sortedItems) {
            app.imageCache.delete(key);
            removedCount++;
            
            // Revoke object URL untuk membebaskan memori
            if (item.url.startsWith('blob:')) {
                URL.revokeObjectURL(item.url);
            }
            
            // Periksa apakah sudah di bawah batas
            if (calculateCacheSize() <= app.settings.maxCacheSize * 0.8) {
                break;
            }
        }
        
        if (app.settings.showNotifications) {
            showToast(`Cache dibersihkan: ${removedCount} gambar lama dihapus`, 'info');
        }
        
        updateCacheInfo();
        console.log(`🗑️ Cache dibersihkan: ${removedCount} item dihapus`);
    }
}

/**
 * Memperbarui informasi cache
 */
function updateCacheInfo() {
    app.elements.cacheSize.textContent = app.imageCache.size;
    
    if (app.settings.enableCache) {
        const cacheSizeInMB = calculateCacheSize();
        app.elements.cacheInfo.textContent = `Cache: ${app.imageCache.size} gambar (${cacheSizeInMB.toFixed(2)} MB)`;
    } else {
        app.elements.cacheInfo.textContent = 'Cache dinonaktifkan';
    }
}

// =============================================
// Fungsi Utilitas
// =============================================
/**
 * Memperbarui statistik
 */
function updateStats() {
    app.stats.fetchCount++;
    app.elements.fetchCount.textContent = app.stats.fetchCount;
    updateLastFetchTime();
}

/**
 * Memperbarui waktu pengambilan terakhir
 */
function updateLastFetchTime() {
    const now = new Date();
    app.stats.lastFetchTime = now;
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    app.elements.lastFetch.textContent = timeString;
}

/**
 * Memperbarui tampilan status API
 */
function updateApiStatus(status, text) {
    app.elements.apiStatusIndicator.className = `api-status-indicator ${status}`;
    app.elements.apiStatusDot.className = `status-dot ${status}`;
    app.elements.apiStatusText.textContent = text;
}

/**
 * Menampilkan atau menyembunyikan loading spinner
 */
function showLoading(show) {
    if (show) {
        app.elements.loadingSpinner.classList.add('active');
        app.elements.refreshIndicator.classList.add('active');
    } else {
        app.elements.loadingSpinner.classList.remove('active');
        app.elements.refreshIndicator.classList.remove('active');
    }
}

/**
 * Menampilkan atau menyembunyikan pesan error
 */
function showError(message) {
    app.elements.errorText.textContent = message;
    app.elements.errorMessage.classList.add('active');
}

function hideError() {
    app.elements.errorMessage.classList.remove('active');
}

/**
 * Menampilkan notifikasi toast
 */
function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    
    let icon = '';
    if (type === 'success') {
        icon = '<i class="fas fa-check-circle text-success"></i>';
    } else if (type === 'error') {
        icon = '<i class="fas fa-exclamation-circle text-danger"></i>';
    } else if (type === 'warning') {
        icon = '<i class="fas fa-exclamation-triangle text-warning"></i>';
    } else {
        icon = '<i class="fas fa-info-circle text-info"></i>';
    }
    
    toast.innerHTML = `${icon} <span>${message}</span>`;
    
    app.elements.toastContainer.appendChild(toast);
    
    // Hapus toast setelah 3 detik
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (app.elements.toastContainer.contains(toast)) {
                app.elements.toastContainer.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// =============================================
// Fungsi Pengaturan
// =============================================
/**
 * Menyimpan pengaturan ke localStorage
 */
function saveSettings() {
    app.settings.batchSize = parseInt(document.getElementById('batchSize').value);
    app.settings.autoRefresh = parseInt(document.getElementById('autoRefresh').value);
    app.settings.showNotifications = document.getElementById('showNotifications').checked;
    app.settings.debugMode = document.getElementById('debugMode').checked;
    app.settings.enableCache = document.getElementById('enableCache').checked;
    app.settings.maxCacheSize = parseInt(document.getElementById('maxCacheSize').value);
    
    // Simpan ke localStorage
    localStorage.setItem('blueArchiveSettings', JSON.stringify(app.settings));
    
    // Perbarui auto refresh
    if (app.autoRefreshInterval) {
        clearInterval(app.autoRefreshInterval);
        app.autoRefreshInterval = null;
    }
    
    if (app.settings.autoRefresh > 0) {
        app.autoRefreshInterval = setInterval(fetchSingleImage, app.settings.autoRefresh * 1000);
        console.log(`⏰ Auto refresh diaktifkan: ${app.settings.autoRefresh} detik`);
    }
    
    // Bersihkan cache jika perlu
    cleanupCache();
    
    // Tutup modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
    modal.hide();
    
    showToast('Pengaturan berhasil disimpan', 'success');
    console.log('💾 Pengaturan disimpan:', app.settings);
}

/**
 * Memuat pengaturan dari localStorage
 */
function loadSettings() {
    const savedSettings = localStorage.getItem('blueArchiveSettings');
    
    if (savedSettings) {
        app.settings = JSON.parse(savedSettings);
        
        // Update form inputs
        document.getElementById('batchSize').value = app.settings.batchSize;
        document.getElementById('autoRefresh').value = app.settings.autoRefresh;
        document.getElementById('showNotifications').checked = app.settings.showNotifications;
        document.getElementById('debugMode').checked = app.settings.debugMode;
        document.getElementById('enableCache').checked = app.settings.enableCache;
        document.getElementById('maxCacheSize').value = app.settings.maxCacheSize;
        
        // Aktifkan auto refresh jika diatur
        if (app.settings.autoRefresh > 0) {
            app.autoRefreshInterval = setInterval(fetchSingleImage, app.settings.autoRefresh * 1000);
            console.log(`⏰ Auto restore: ${app.settings.autoRefresh} detik`);
        }
        
        console.log('📂 Pengaturan dimuat:', app.settings);
    }
}

// =============================================
// Event Listener untuk DOM
// =============================================
document.addEventListener('DOMContentLoaded', init);

// Cleanup saat halaman ditutup
window.addEventListener('beforeunload', () => {
    // Hentikan auto refresh
    if (app.autoRefreshInterval) {
        clearInterval(app.autoRefreshInterval);
    }
    
    // Revoke blob URLs untuk membebaskan memori
    app.imageCache.forEach(item => {
        if (item.url && item.url.startsWith('blob:')) {
            URL.revokeObjectURL(item.url);
        }
    });
    
    console.log('👋 Aplikasi ditutup, cleanup selesai');
});