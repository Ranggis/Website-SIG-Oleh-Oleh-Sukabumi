/* GPS-REALTIME.JS
   Tracking GPS Realtime di Peta Leaflet
   - Menggunakan navigator.geolocation (lokasi asli user)
   - Marker bergerak mengikuti posisi user
   - Panel info: latitude, longitude, speed (m/s), timestamp
   - Polyline jejak pergerakan
*/

let gpsMarker = null;
let gpsPolyline = null;
let gpsHistory = [];          // array [lat, lng]
let gpsWatchId = null;        // id watchPosition
let lastGpsPoint = null;      // { lat, lng, timeMs }

/* 🔹 Hitung kecepatan (m/s) dari dua titik + timestamp */
function computeRealSpeed(prev, curr) {
  if (!prev) return 0;

  const from = turf.point([prev.lng, prev.lat]);
  const to   = turf.point([curr.lng, curr.lat]);

  const distKm = turf.distance(from, to, { units: "kilometers" }); // km
  const distMeter = distKm * 1000;

  const dtSec = (curr.timeMs - prev.timeMs) / 1000;
  if (dtSec <= 0) return 0;

  const speedMs = distMeter / dtSec;
  return speedMs;
}

/* 🔹 Update panel informasi */
function updateGpsPanel(info) {
  const latEl   = document.getElementById("gps-lat");
  const lngEl   = document.getElementById("gps-lng");
  const speedEl = document.getElementById("gps-speed");
  const timeEl  = document.getElementById("gps-time");

  if (!latEl || !lngEl || !speedEl || !timeEl) return;

  latEl.textContent   = info.lat.toFixed(5);
  lngEl.textContent   = info.lng.toFixed(5);
  speedEl.textContent = info.speed.toFixed(2) + " m/s";
  timeEl.textContent  = info.time.toLocaleString("id-ID");
}

/* 🔹 Render marker + polyline ke peta */
function renderGpsOnMap(info) {
  const { lat, lng } = info;

  gpsHistory.push([lat, lng]);

  // Marker utama GPS
  if (!gpsMarker) {
    const gpsIcon = L.icon({
      // kalau belum punya icon khusus, sementara bisa pakai marker default:
      // iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconUrl: "../assets/icons/gps-marker.png", // ganti sesuai file-mu
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -28],
      className: "gps-marker-icon"
    });

    gpsMarker = L.marker([lat, lng], { icon: gpsIcon })
      .addTo(map)
      .bindPopup("Posisi GPS Kamu");
  } else {
    gpsMarker.setLatLng([lat, lng]);
  }

  // Polyline jejak
  if (!gpsPolyline) {
    gpsPolyline = L.polyline(gpsHistory, {
      color: "#ff9800",
      weight: 3,
      opacity: 0.9
    }).addTo(map);
  } else {
    gpsPolyline.setLatLngs(gpsHistory);
  }

  // Kamera mengikuti
  map.panTo([lat, lng], { animate: true });

  // Update panel
  updateGpsPanel(info);
}

/* 🔹 Callback saat posisi berubah (watchPosition) */
function handleGpsPosition(position) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  const timeMs = position.timestamp;
  const time = new Date(timeMs);

  const currPoint = { lat, lng, timeMs };

  const speed = computeRealSpeed(lastGpsPoint, currPoint);

  const info = {
    lat,
    lng,
    time,
    speed
  };

  lastGpsPoint = currPoint;
  renderGpsOnMap(info);
}

/* 🔹 Error handler geolocation */
function handleGpsError(err) {
  console.error("GPS error:", err);
  let msg = "Tidak dapat mengambil lokasi kamu.";
  if (err.code === 1) {
    msg = "Akses lokasi ditolak. Aktifkan izin lokasi di browser.";
  } else if (err.code === 2) {
    msg = "Posisi tidak tersedia. Coba aktifkan GPS / jaringan.";
  } else if (err.code === 3) {
    msg = "Permintaan lokasi timeout. Coba lagi.";
  }

  Swal.fire({
    icon: "error",
    title: "Lokasi Gagal Diambil",
    text: msg,
    confirmButtonColor: "#8b5e34"
  });
}

/* 🔹 Mulai tracking GPS realtime */
function startGpsTracking() {
  if (!navigator.geolocation) {
    Swal.fire({
      icon: "error",
      title: "Geolokasi Tidak Didukung",
      text: "Browser kamu tidak mendukung akses GPS.",
      confirmButtonColor: "#8b5e34"
    });
    return;
  }

  if (gpsWatchId !== null) {
    Swal.fire({
      icon: "info",
      title: "Tracking Sudah Aktif",
      text: "Posisi kamu sudah sedang dipantau.",
      confirmButtonColor: "#8b5e34"
    });
    return;
  }

  // Reset jejak tiap mulai baru
  gpsHistory = [];
  lastGpsPoint = null;

  // Bersihkan polyline lama jika ada
  if (gpsPolyline) {
    try { map.removeLayer(gpsPolyline); } catch (e) {}
    gpsPolyline = null;
  }

  Swal.fire({
    title: "Mengaktifkan GPS...",
    text: "Mohon izinkan akses lokasi di browser.",
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  gpsWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      Swal.close();
      handleGpsPosition(pos);
    },
    (err) => {
      Swal.close();
      handleGpsError(err);
      // kalau error, hentikan watch
      if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
      }
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    }
  );

  Swal.fire({
    icon: "success",
    title: "Tracking Dimulai",
    text: "Posisi GPS kamu sekarang dipantau secara realtime.",
    timer: 1800,
    showConfirmButton: false
  });
}

/* 🔹 Stop tracking GPS (marker & jejak tetap di peta) */
function stopGpsTracking() {
  if (gpsWatchId !== null) {
    navigator.geolocation.clearWatch(gpsWatchId);
    gpsWatchId = null;

    Swal.fire({
      icon: "info",
      title: "Tracking Dihentikan",
      text: "GPS berhenti dipantau. Jejak tetap terlihat di peta.",
      timer: 1800,
      showConfirmButton: false
    });
  } else {
    Swal.fire({
      icon: "info",
      title: "Belum Ada Tracking",
      text: "Tracking GPS belum diaktifkan.",
      confirmButtonColor: "#8b5e34"
    });
  }
}

/* 🔹 Hubungkan tombol ke fungsi start/stop */
document.addEventListener("DOMContentLoaded", () => {
  const btnStart = document.getElementById("gps-start");
  const btnStop  = document.getElementById("gps-stop");

  if (btnStart) btnStart.addEventListener("click", startGpsTracking);
  if (btnStop)  btnStop.addEventListener("click", stopGpsTracking);
});
