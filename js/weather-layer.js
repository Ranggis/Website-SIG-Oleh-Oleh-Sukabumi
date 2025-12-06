/* WEATHER-LAYER.JS
   Layer Cuaca Realtime dari Titik Lokasi Pengguna (OpenWeatherMap)
   - Mengambil posisi user via Geolocation API
   - Memanggil OpenWeatherMap berdasarkan koordinat GPS
   - Menampilkan marker + buffer di sekitar lokasi user
   - Menampilkan popup berisi suhu, deskripsi cuaca, kelembapan, dan angin
*/

const OPENWEATHER_API_KEY = "a38d422752dd794c58310dc626571b50";

// Layer khusus cuaca
let weatherLayer = L.layerGroup();

// Simpan cache sederhana (opsional)
let lastWeatherData = null;
let lastWeatherTime = null;
let lastWeatherCoord = null;

/* 🔹 Ambil data cuaca dari OpenWeatherMap berdasarkan lat & lng */
async function fetchWeatherByCoord(lat, lng) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=id`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    lastWeatherData = data;
    lastWeatherTime = new Date();
    lastWeatherCoord = { lat, lng };
    return data;
  } catch (err) {
    console.error("Gagal mengambil data cuaca:", err);
    Swal.fire({
      icon: "error",
      title: "Gagal Memuat Cuaca",
      text: "Tidak dapat mengambil data cuaca dari server. Coba lagi beberapa saat lagi.",
      confirmButtonColor: "#8b5e34"
    });
    return null;
  }
}

/* 🔹 Render layer cuaca berdasarkan data & koordinat user */
function renderWeatherLayer(data, coord) {
  if (!data || !coord) return;

  // Kosongkan dulu
  weatherLayer.clearLayers();

  const { lat, lng } = coord;

  const temp = data.main && typeof data.main.temp === "number"
    ? data.main.temp.toFixed(1)
    : "-";

  const humidity = data.main && typeof data.main.humidity === "number"
    ? data.main.humidity
    : "-";

  const wind = data.wind && typeof data.wind.speed === "number"
    ? data.wind.speed.toFixed(1)
    : "-";

  const weatherDesc = (data.weather && data.weather[0] && data.weather[0].description)
    ? data.weather[0].description
    : "Tidak diketahui";

  const iconCode = data.weather && data.weather[0] && data.weather[0].icon
    ? data.weather[0].icon
    : "01d";

  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

  // Marker di titik lokasi user
  const marker = L.marker([lat, lng]).addTo(weatherLayer);

  // Buffer kira-kira 2 km sebagai area cuaca sekitar user
  const circle = L.circle([lat, lng], {
    radius: 2000, // meter
    color: "#3498db",
    weight: 2,
    fillColor: "#3498db",
    fillOpacity: 0.12,
    className: "weather-buffer" // supaya bisa di-style dengan CSS animasi
  }).addTo(weatherLayer);

  let updatedText = "";
  if (lastWeatherTime instanceof Date) {
    updatedText = lastWeatherTime.toLocaleString("id-ID");
  }

  // Pakai class .weather-popup supaya bisa di-style rapi di CSS
  const popupHtml = `
    <div class="weather-popup">
      <div class="weather-popup-header">
        <img src="${iconUrl}" alt="Ikon Cuaca" class="weather-popup-icon" />
        <div>
          <div class="weather-popup-title">Cuaca di Lokasi Anda</div>
          <div class="weather-popup-desc">${weatherDesc}</div>
        </div>
      </div>
      <div class="weather-popup-info">
        Suhu sekarang: <strong>${temp}°C</strong><br/>
        Kelembapan: <strong>${humidity}%</strong><br/>
        Kecepatan angin: <strong>${wind} m/s</strong>
      </div>
      ${
        updatedText
          ? `<div class="weather-popup-updated">
               Terakhir diperbarui: ${updatedText}
             </div>`
          : ""
      }
    </div>
  `;

  marker.bindPopup(popupHtml).openPopup();

  // Simpan di layerStore (opsional, biar konsisten dengan layer lain)
  if (typeof layerStore === "object") {
    layerStore["Cuaca Lokasi Saya"] = weatherLayer;
  }
}

/* 🔹 Minta GPS user → panggil API → tampilkan di peta */
function requestUserLocationAndShowWeather(labelElement, checkboxElement) {
  if (!navigator.geolocation) {
    Swal.fire({
      icon: "error",
      title: "Geolokasi Tidak Didukung",
      text: "Browser kamu tidak mendukung akses lokasi.",
      confirmButtonColor: "#8b5e34"
    });
    if (checkboxElement) checkboxElement.checked = false;
    return;
  }

  Swal.fire({
    title: "Mengambil Lokasi Kamu...",
    text: "Mohon izinkan akses lokasi di browser.",
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      Swal.close();

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      // Fetch cuaca realtime untuk titik ini
      const data = await fetchWeatherByCoord(lat, lng);
      if (!data) {
        if (checkboxElement) checkboxElement.checked = false;
        return;
      }

      renderWeatherLayer(data, { lat, lng });

      // Tambahkan layer ke map & focus
      weatherLayer.addTo(map);
      try {
        map.fitBounds(weatherLayer.getBounds(), { padding: [25, 25] });
      } catch (e) {
        map.setView([lat, lng], 13);
      }
    },
    (err) => {
      Swal.close();
      console.error("Error geolocation:", err);
      let msg = "Tidak dapat mengambil lokasi kamu.";
      if (err.code === 1) {
        msg = "Akses lokasi ditolak. Aktifkan izin lokasi di browser.";
      }
      Swal.fire({
        icon: "error",
        title: "Lokasi Gagal Diambil",
        text: msg,
        confirmButtonColor: "#8b5e34"
      });
      if (checkboxElement) checkboxElement.checked = false;
    }
  );
}

/* 🔹 Handler perubahan checkbox layer cuaca */
function handleWeatherCheckboxChange(checked, labelElement, checkboxElement) {
  if (checked) {
    // Selalu ambil ulang (realtime) saat di-ON-kan
    requestUserLocationAndShowWeather(labelElement, checkboxElement);
  } else {
    // Hapus layer dari map saat di-OFF-kan
    try {
      weatherLayer.clearLayers();
      map.removeLayer(weatherLayer);
    } catch (e) {}
  }
}

/* 🔹 Tambah checkbox "Cuaca Lokasi Saya" di panel Layer Peta */
function setupWeatherLayerUI() {
  const container = document.getElementById("layer-checkboxes");
  if (!container) {
    console.warn("Weather Layer: elemen #layer-checkboxes tidak ditemukan.");
    return;
  }

  // Hindari duplikasi
  if (document.getElementById("chk-weather-location")) {
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "layer-item";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = "chk-weather-location";
  checkbox.checked = false; // default OFF

  const label = document.createElement("label");
  label.htmlFor = "chk-weather-location";
  label.textContent = "Cuaca Lokasi Saya (OpenWeatherMap)";

  wrapper.appendChild(checkbox);
  wrapper.appendChild(label);
  container.appendChild(wrapper);

  checkbox.addEventListener("change", () => {
    handleWeatherCheckboxChange(checkbox.checked, label, checkbox);
  });
}

/* 🔹 Inisialisasi saat DOM siap */
document.addEventListener("DOMContentLoaded", () => {
  try {
    setupWeatherLayerUI();
  } catch (e) {
    console.error("Gagal inisialisasi weather layer:", e);
  }
});
