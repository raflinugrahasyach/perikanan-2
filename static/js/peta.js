// Import fungsi Firebase v9 (Modular SDK)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-database.js";

// Konfigurasi Firebase Anda (dari file Anda sebelumnya)
const firebaseConfig = {
  apiKey: "AIzaSyB9sN0IBFkurXiyx8HKgrMcHEEbTVvfAWo",
  authDomain: "perikanan-f7d16.firebaseapp.com",
  databaseURL: "https://perikanan-f7d16-default-rtdb.firebaseio.com",
  projectId: "perikanan-f7d16",
  storageBucket: "perikanan-f7d16.firebasestorage.app",
  messagingSenderId: "415490378376",
  appId: "1:415490378376:web:d0e62d105e7a505d9b2d3d",
  measurementId: "G-YNQVBZQ5CT"
};

// Inisialisasi Firebase v9
const app = initializeApp(firebaseConfig);
const database = getDatabase(app); // Gunakan getDatabase()

// --- LOGIKA UNTUK HALAMAN PETA VIEWER ---
// Cek jika path adalah /peta TAPI BUKAN /peta/share
if (window.location.pathname.includes("/peta") && !window.location.pathname.includes("/peta/share")) {
    
    document.addEventListener('DOMContentLoaded', () => {
        const mapElement = document.getElementById('peta-map');
        if (mapElement) {
            console.log("Memuat Peta Viewer (SDK v9)...");
            const map = L.map('peta-map').setView([-6.1215, 106.7741], 12);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(map);

            const markers = {};
            let vesselCount = 0;
            const vesselCountEl = document.getElementById('vessel-count');
            let hasFitted = false;

            // Elemen untuk warning sistem pelanggar
            const warningBatas = document.getElementById("warning-batas");
            const totalPelanggarBox = document.getElementById("total-pelanggar-box");
            const listPelanggarBox = document.getElementById("list-pelanggar");
            const totalPelanggarEl = document.getElementById("total-pelanggar");
            const pelanggarItems = document.getElementById("pelanggar-items");

            const shipIcon = L.icon({
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135687.png',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            // SINTAKS v9: Gunakan ref() dan onValue()
            const locationsRef = ref(database, 'locations');
            onValue(locationsRef, (snapshot) => {
                const data = snapshot.val();
                
                if (!data) {
                    // Jika data kosong, reset semua
                    vesselCount = 0;
                    if (vesselCountEl) vesselCountEl.textContent = vesselCount;

                    Object.keys(markers).forEach(id => {
                        map.removeLayer(markers[id]);
                        delete markers[id];
                    });

                    // Sembunyikan notifikasi
                    if (warningBatas) warningBatas.style.display = "none";
                    if (totalPelanggarBox) totalPelanggarBox.style.display = "none";
                    if (listPelanggarBox) listPelanggarBox.style.display = "none";

                    return;
                }

                console.log("Menerima data lokasi (v9):", data);
                vesselCount = 0;
                const activeIds = Object.keys(data);

                // Hapus marker yang sudah tidak ada
                Object.keys(markers).forEach(id => {
                    if (!activeIds.includes(id)) {
                        map.removeLayer(markers[id]);
                        delete markers[id];
                    }
                });

                // LIST UNTUK MENAMPUNG KAPAL PELANGGAR
                const pelanggar = [];

                // Update atau buat marker baru
                activeIds.forEach(id => {
                    const vessel = data[id];
                    if (vessel.lat && vessel.lng) {
                        vesselCount++;

                        const popupContent = `
                            <div class="font-sans">
                                <strong class="text-base text-primary">${vessel.nama_kapal || 'Tanpa Nama'}</strong><br>
                                <strong>Jenis:</strong> ${vessel.jenis_kapal || 'N/A'}<br>
                                <strong>Muatan:</strong> ${vessel.muatan || 'N/A'}<br>
                                <hr class="my-1">
                                <span class="text-xs text-muted-foreground">ID: ${id}</span><br>
                                <span class="text-xs text-muted-foreground">Lat: ${vessel.lat.toFixed(4)}, Lng: ${vessel.lng.toFixed(4)}</span>
                            </div>
                        `;

                        // DETEKSI PELANGGAR BATAS
                        // contoh batas: jika lat < -6.2 (silakan ganti sendiri)
                        if (vessel.lat < -6.2) {
                            pelanggar.push({
                                id: id,
                                nama: vessel.nama_kapal || "Tanpa Nama"
                            });
                        }

                        if (!markers[id]) {
                            markers[id] = L.marker([vessel.lat, vessel.lng], { icon: shipIcon })
                                .addTo(map)
                                .bindPopup(popupContent);
                        } else {
                            markers[id]
                                .setLatLng([vessel.lat, vessel.lng])
                                .getPopup().setContent(popupContent);
                        }
                    }
                });
                
                if (vesselCountEl) {
                    vesselCountEl.textContent = vesselCount;
                }

                if (!hasFitted && vesselCount > 0) {
                    const group = new L.featureGroup(Object.values(markers));
                    map.fitBounds(group.getBounds().pad(0.1));
                    hasFitted = true;
                }

                // -------------------------
                //   TAMPILKAN NOTIFIKASI
                // -------------------------
                if (pelanggar.length > 0) {

                    if (warningBatas) warningBatas.style.display = "block";
                    if (totalPelanggarBox) totalPelanggarBox.style.display = "block";
                    if (listPelanggarBox) listPelanggarBox.style.display = "block";

                    if (totalPelanggarEl) totalPelanggarEl.textContent = pelanggar.length;

                    // isi daftar
                    if (pelanggarItems) {
                        pelanggarItems.innerHTML = "";
                        pelanggar.forEach(p => {
                            const li = document.createElement("li");
                            li.textContent = `• ${p.nama} (ID: ${p.id})`;
                            pelanggarItems.appendChild(li);
                        });
                    }

                } 
            });
        }
    });
}

// --- LOGIKA UNTUK HALAMAN SHARE LOCATION ---
if (window.location.pathname.includes("/peta/share")) {
    document.addEventListener('DOMContentLoaded', () => {
        console.log("Memuat Halaman Share Lokasi (SDK v9)...");
        
        const form = document.getElementById('share-form');
        const shareBtn = document.getElementById('share-btn');
        const statusEl = document.getElementById('status-message');
        const coordinatesEl = document.getElementById('coordinates');

        let isSharing = false;
        let watchId = null;
        let userKey = "vessel_" + Math.random().toString(36).substr(2, 9);

        const showStatus = (message, type = 'info') => {
            if (statusEl) {
                statusEl.textContent = message;
                statusEl.classList.remove('text-green-600', 'text-red-600', 'text-gray-600');
                if (type === 'success') {
                    statusEl.classList.add('text-green-600');
                } else if (type === 'error') {
                    statusEl.classList.add('text-red-600');
                } else {
                    statusEl.classList.add('text-gray-600');
                }
            }
        };

        const updateLocationToFirebase = (position) => {
            const data = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                nama_kapal: document.getElementById('namaKapal').value.trim(),
                jenis_kapal: document.getElementById('jenisKapal').value.trim(),
                muatan: document.getElementById('muatan').value.trim(),
                timestamp: serverTimestamp() // SINTAKS v9
            };

            // SINTAKS v9: Gunakan set() dan ref()
            set(ref(database, `locations/${userKey}`), data)
                .then(() => {
                    showStatus('Lokasi berhasil dikirim!', 'success');
                    if (coordinatesEl) {
                        coordinatesEl.textContent = `Lat: ${data.lat.toFixed(5)}, Lng: ${data.lng.toFixed(5)}`;
                    }
                })
                .catch(err => {
                    showStatus(`Gagal mengirim lokasi: ${err.message}`, 'error');
                });
        };

        const startLocationSharing = () => {
            if (!("geolocation" in navigator)) {
                showStatus("Geolocation tidak didukung di browser ini.", "error");
                return;
            }

            showStatus("Memulai pelacakan...", "info");
            watchId = navigator.geolocation.watchPosition(
                updateLocationToFirebase,
                (err) => {
                    showStatus(`Error GPS: ${err.message}`, 'error');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );

            isSharing = true;
            shareBtn.textContent = 'Hentikan Berbagi Lokasi';
            shareBtn.classList.remove('bg-primary', 'hover:bg-primary/90');
            shareBtn.classList.add('bg-destructive', 'hover:bg-destructive/90');
            ['namaKapal', 'jenisKapal', 'muatan'].forEach(id => document.getElementById(id).disabled = true);
        };

        const stopLocationSharing = () => {
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
            }
            
            // SINTAKS v9: Gunakan remove() dan ref()
            remove(ref(database, `locations/${userKey}`))
                .then(() => showStatus('Berbagi lokasi dihentikan. Data dihapus.', 'info'))
                .catch(err => showStatus(`Error menghapus data: ${err.message}`, 'error'));

            isSharing = false;
            shareBtn.textContent = 'Mulai Berbagi Lokasi';
            shareBtn.classList.add('bg-primary', 'hover:bg-primary/90');
            shareBtn.classList.remove('bg-destructive', 'hover:bg-destructive/90');
            ['namaKapal', 'jenisKapal', 'muatan'].forEach(id => document.getElementById(id).disabled = false);
            if (coordinatesEl) coordinatesEl.textContent = '';
        };

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();

                if (isSharing) {
                    stopLocationSharing();
                } else {
                    const namaKapal = document.getElementById('namaKapal').value.trim();
                    const jenisKapal = document.getElementById('jenisKapal').value.trim();
                    const muatan = document.getElementById('muatan').value.trim();

                    if (!namaKapal || !jenisKapal || !muatan) {
                        showStatus('Semua data kapal harus diisi!', 'error');
                        return;
                    }
                    startLocationSharing();
                }
            });
        }
        
        window.addEventListener('beforeunload', () => {
            if (isSharing) {
                // SINTAKS v9: Gunakan remove()
                remove(ref(database, `locations/${userKey}`));
            }
        });
    });
}