/* MAIN.JS - SIG Oleh-Oleh Sukabumi
   Versi perbaikan oleh Kurumi:
   - pastikan layer siap sebelum pasang click handler
   - perbaiki isPointInsidePolygon handling
   - unlock audio on first user interaction
   - rapiin loading -> transition -> map-visible flow
   - safer DOM checks
*/

// --- Inisialisasi peta ---
const map = L.map('map', { zoomControl: true }).setView([-6.9205, 106.9289], 13);

// --- Base maps ---
const baseOSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
});
const baseSatelit = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  { maxZoom: 19, attribution: 'Tiles © Esri — Source: Esri, USGS, NOAA, NGA, and others' }
);

// tambahkan OSM sebagai default
baseOSM.addTo(map);

// Base layer control
const baseLayers = {
  "🗺️ Peta Jalan (OSM)": baseOSM,
  "🌍 Peta Satelit (ESRI)": baseSatelit
};

// Layer storage
const layerStore = {};
const rawData = {};

// Files mapping (GeoJSON)
const fileMap = {
  "Kota Sukabumi": "../Data/Kota Sukabumi.geojson",
  "Batas Lokasi": "../Data/batas_lokasi.geojson",
  "Makanan Khas": "../Data/makanan_khas.geojson",
  "Kuliner Siap Saji": "../Data/kuliner_siap_saji.geojson",
  "Dessert & Makanan Ringan": "../Data/dessert_ringan.geojson",
  "Minuman": "../Data/minuman.geojson",
  "Fasilitas Pendukung": "../Data/fasilitas_pendukung.geojson",
  "Rute": "../Data/rute.geojson"
};

// --- Icon Set ---
const icons = {
  makanan_khas: L.icon({
    iconUrl: '../assets/icons/pastel.png',
    iconSize: [40, 40],
    className: 'pulse-icon'
  }),
  kuliner: L.icon({
    iconUrl: '../assets/icons/kulinerr.png',
    iconSize: [38, 38],
    className: 'pulse-icon'
  }),
  dessert: L.icon({
    iconUrl: '../assets/icons/dessert.png',
    iconSize: [38, 38],
    className: 'pulse-icon'
  }),
  minuman: L.icon({
    iconUrl: '../assets/icons/minuman.png',
    iconSize: [36, 36],
    className: 'pulse-icon'
  }),
  fasilitas: L.icon({
    iconUrl: '../assets/icons/fasilitas.png',
    iconSize: [34, 34],
    className: 'pulse-icon'
  }),
  sekolah: L.icon({
    iconUrl: '../assets/icons/sekolah.png',
    iconSize: [34, 34],
    className: 'pulse-icon'
  }),
  default: L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconSize:[25,41]
  })
};


// --- Popup builder ---
function buildPopup(props) {
  // Placeholder gambar (kalau belum ada di data)
  const imgSrc = props.foto_url || "./assets/image/Logo.png";

  // Generate rating random sementara (bisa diganti nanti dengan data asli)
  const rating = (Math.random() * (5 - 4) + 4).toFixed(1);
  const stars = "⭐".repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? "✨" : "");

  return `
    <div class="popup-card">
      <div class="popup-img-wrapper">
        <img src="${imgSrc}" alt="${props.nama}" class="popup-img"/>
      </div>
      <div class="popup-content">
        <h3 class="popup-title">${props.nama}</h3>
        <div class="popup-meta">
          <span class="popup-tag">${props.jenis || "Kategori Tidak Diketahui"}</span>
          <span class="popup-rating">${stars} (${rating})</span>
        </div>
        <p class="popup-desc">
          Produk utama: <strong>${props.produk_utama || "-"}</strong><br/>
          Temukan cita rasa khas Sukabumi di lokasi ini.
        </p>
      </div>
      <div class="popup-footer">
        <button class="btn-detail" onclick="showDetail('${props.nama}', '${props.jenis}', '${props.produk_utama}', '${imgSrc}', '${rating}')">
          Lihat Detail
        </button>
        <button class="btn-review" onclick="showReviewForm('${props.nama}')">
          Beri Ulasan
        </button>
      </div>
      <button class="btn-comment" onclick="viewReviews('${props.nama}')">
        Lihat Komentar & Rating
      </button>
    </div>
  `;
}


// Detail popup (pakai SweetAlert2)
function showDetail(nama, jenis, produk, gambar, rating) {
  Swal.fire({
    title: nama,
    html: `
      <div class="detail-popup">
        <img src="${gambar}" alt="${nama}" />
        <p><strong>Jenis:</strong> ${jenis}</p>
        <p><strong>Produk Utama:</strong> ${produk}</p>
        <p><strong>Rating:</strong> ${"⭐".repeat(Math.floor(rating))} (${rating})</p>
        <p><em>Rasakan kelezatan khas Sukabumi hanya di sini!</em></p>
      </div>
    `,
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#4a3728',
    confirmButtonColor: '#8b5e34',
  });
}

// === 🌟 Rating & Ulasan Dinamis — Cream Glow Theme (Clean Version) ===
function showReviewForm(namaTempat) {
  Swal.fire({
    title: `Tulis Ulasan untuk ${namaTempat}`,
    html: `
      <div class="review-form">
        <label for="user-rating">Rating:</label>
        <select id="user-rating" class="swal2-select">
          <option value="5">⭐⭐⭐⭐⭐ (5)</option>
          <option value="4">⭐⭐⭐⭐ (4)</option>
          <option value="3">⭐⭐⭐ (3)</option>
          <option value="2">⭐⭐ (2)</option>
          <option value="1">⭐ (1)</option>
        </select>

        <label for="user-comment">Ulasan:</label>
        <textarea 
          id="user-comment" 
          class="review-text" 
          placeholder="Tulis ulasan kamu di sini..."
        ></textarea>
      </div>
    `,
    confirmButtonText: "Kirim Ulasan",
    showCancelButton: true,
    cancelButtonText: "Batal",
    focusConfirm: false,
    confirmButtonColor: "#4a2e18",
    cancelButtonColor: "#6f5849",
    preConfirm: () => {
      const rating = document.getElementById("user-rating").value;
      const comment = document.getElementById("user-comment").value.trim();

      if (!comment) {
        Swal.showValidationMessage("Ulasan tidak boleh kosong!");
        return false;
      }

      return { rating, comment };
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      const { rating, comment } = result.value;

      // 💾 Simpan ke localStorage
      const saved = JSON.parse(localStorage.getItem("reviews")) || {};
      if (!saved[namaTempat]) saved[namaTempat] = [];
      saved[namaTempat].push({
        rating,
        comment,
        date: new Date().toLocaleString("id-ID")
      });
      localStorage.setItem("reviews", JSON.stringify(saved));

      Swal.fire({
        icon: "success",
        title: "Terima Kasih!",
        text: "Ulasan kamu sudah disimpan.",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  });
}


// === 💬 Lihat Ulasan dengan Tampilan Cream Glow ===
function viewReviews(namaTempat) {
  const saved = JSON.parse(localStorage.getItem("reviews")) || {};
  const reviews = saved[namaTempat] || [];

  if (reviews.length === 0) {
    Swal.fire({
      title: `Belum Ada Ulasan`,
      text: `Belum ada komentar untuk ${namaTempat}. Jadilah yang pertama!`,
      icon: "info",
      background: "#d9c6ad",
      color: "#4a2e18",
      confirmButtonColor: "#4a2e18"
    });
    return;
  }

  const avg = (
    reviews.reduce((sum, r) => sum + parseInt(r.rating), 0) / reviews.length
  ).toFixed(1);

  const reviewHTML = reviews.map(r => `
    <div style="
      margin-bottom:10px;
      border-bottom:1px solid #bca890;
      padding-bottom:8px;
      background:#f6efe7;
      border-radius:8px;
      padding:10px;
      box-shadow:0 0 8px #4a2e1830;">
      <p style="margin:0;color:#4a2e18;">⭐ ${r.rating}/5</p>
      <p style="margin:4px 0;color:#3b2615;">${r.comment}</p>
      <small style="color:#6f5849;">${r.date}</small>
    </div>
  `).join("");

  Swal.fire({
    title: `Ulasan untuk ${namaTempat}`,
    html: `
      <p style="color:#4a2e18;"><strong>Rata-Rata Rating:</strong> ⭐ ${avg}</p>
      <div style="max-height:300px;overflow-y:auto;text-align:left;background:#f6efe7;padding:10px;border-radius:10px;">
        ${reviewHTML}
      </div>
    `,
    width: 500,
    background: "#d9c6ad",
    color: "#4a2e18",
    confirmButtonColor: "#4a2e18",
    showCloseButton: true,
    confirmButtonText: "Tutup"
  });
}


// --- Icon chooser ---
function chooseIcon(feature){
  const props = feature && feature.properties ? feature.properties : {};
  const role = (props.role || '').toString().toLowerCase();
  const jenis = (props.jenis || '').toString().toLowerCase();
  const nama = (props.nama || '').toString().toLowerCase();

  if(role.includes('makanan khas') || /mochi|bolu|bika|sale|Oleh Oleh/i.test(nama)) return icons.makanan_khas;
  if(role.includes('minuman') || jenis.includes('minuman')) return icons.minuman;
  if(jenis.includes('dessert') || /puding|dessert|dimsum|roti/i.test(nama)) return icons.dessert;
  if(jenis.includes('makanan') || role.includes('makanan')) return icons.kuliner;
  if(jenis.includes('sekolah') || /sd |smp |sma |sekolah/i.test(nama)) return icons.sekolah;
  return icons.default;
}

// --- Create Layer ---
function createLayerFromGeoJson(label, geojson){
  const layerGroup = L.geoJSON(geojson, {
    pointToLayer: function(feature, latlng){
      const ic = chooseIcon(feature);
      return L.marker(latlng, { icon: ic });
    },
    style: function(feature){
      if(!feature || !feature.geometry) return {};
      if(feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon'){
        return { color: '#f0ad4e', fillOpacity: 0.25, weight: 1.6 };
      }
      if(feature.geometry.type === 'LineString'){
        return { color: '#c44', weight: 3, dashArray: '6,4' };
      }
      return {};
    },
    onEachFeature: function(feature, layer) {
      const props = feature.properties || {};

      if (props && props.nama) {
        layer.bindTooltip(props.nama, { permanent: false, direction: 'top', offset: [0, -10], className: 'custom-tooltip' });
      }

      layer.bindPopup(buildPopup(props), { maxWidth: 320 });

      layer.on({
        mouseover: () => layer.openTooltip(),
        click: () => {
          if (layer.getLatLng) {
            map.setView(layer.getLatLng(), 17, { animate: true });
          }
          layer.openPopup();
          highlightMarker(layer);
        }
      });

      if (props && props.nama) {
        rawData[props.nama.toLowerCase()] = {
          props: props,
          latlng: (feature.geometry && feature.geometry.type === 'Point') 
            ? [feature.geometry.coordinates[1], feature.geometry.coordinates[0]] 
            : null
        };
      }
    }
  });
  return layerGroup;
}

// --- Load All Layers ---
async function loadAllLayers(){
  const sidebarList = document.getElementById('layer-checkboxes');
  const overlayLayers = {}; 

  for(const [label, path] of Object.entries(fileMap)){
    try{
      const res = await fetch(path);
      if(!res.ok){
        console.warn(`Tidak bisa memuat ${label} dari path: ${path}`);
        continue;
      }
      const geojson = await res.json();
      const layer = createLayerFromGeoJson(label, geojson);

      // simpan di store
      layerStore[label] = layer;

      // jika layer poligon "Kota Sukabumi", tambahkan & fitBounds
      if(label === "Kota Sukabumi"){
        try {
          layer.addTo(map);
          if (layer.getBounds && !layer.getBounds().isValid?.()) {
            // no-op; just safety
          } else {
            map.fitBounds(layer.getBounds(), { padding: [20,20] });
          }
        } catch(e) {
          // ignore fitBounds errors
        }
      } else {
        // untuk layer lain: tambahkan ke peta juga (default)
        layer.addTo(map);
      }

      // === Checkbox Sidebar (hanya jika elemen ada) ===
      if (sidebarList) {
        const id = 'chk-' + label.replace(/\s+/g,'_');
        const wrapper = document.createElement('div');
        wrapper.className = 'layer-item';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = id;
        checkbox.checked = true;
        const lab = document.createElement('label');
        lab.htmlFor = id;
        lab.innerText = label;
        wrapper.appendChild(checkbox);
        wrapper.appendChild(lab);
        sidebarList.appendChild(wrapper);

        checkbox.addEventListener('change', function(){
          if(this.checked){
            layer.addTo(map);
          } else {
            map.removeLayer(layer);
          }
        });
      }

      overlayLayers[label] = layer;

    }catch(err){ 
      console.error('Error loading', label, err); 
    }
  }

  // Tambahkan control layer base + overlay
  L.control.layers(baseLayers, overlayLayers, { collapsed: true }).addTo(map);
}

// --- LOADING SCREEN & TRANSITION HANDLER ---
async function loadAllLayersWithLoading() {
  const loadingScreen = document.getElementById('loading-screen');
  const petalContainer = document.querySelector('.petal-container');
  const transitionLight = document.getElementById('transition-light');
  const mapEl = document.getElementById('map');
  const mainEl = document.getElementById('main-content');

  // safety: ensure map/main hidden initially (CSS should handle opacity, but double-check)
  if (mapEl) { mapEl.classList.remove('map-visible'); }
  if (mainEl) { mainEl.classList.remove('main-visible'); }

  // create petals if container exists
  if (petalContainer) {
    for (let i = 0; i < 20; i++) {
      const petal = document.createElement('div');
      petal.className = 'petal';
      petal.style.left = Math.random() * 100 + '%';
      petal.style.animationDuration = (5 + Math.random() * 6) + 's';
      petal.style.animationDelay = Math.random() * 4 + 's';
      petalContainer.appendChild(petal);
    }
  }

  try {
    await loadAllLayers();
  } catch (e) {
    console.error('Error saat loadAllLayers()', e);
  }

  // small delay so user sees loading effect
  setTimeout(() => {
    if (loadingScreen) loadingScreen.classList.add('fade-out');

    // after fade-out, play transition light then reveal map
    setTimeout(() => {
      if (transitionLight) {
        transitionLight.classList.add('transition-active');
      }

      // transition duration (matching CSS animation)
      setTimeout(() => {
        // remove transition and loading elements
        if (transitionLight && transitionLight.parentNode) transitionLight.parentNode.removeChild(transitionLight);
        if (loadingScreen && loadingScreen.parentNode) loadingScreen.parentNode.removeChild(loadingScreen);

        // reveal map & main content
        if (mapEl) mapEl.classList.add('map-visible');
        if (mainEl) mainEl.classList.add('main-visible');

        // ensure map invalidation so tiles render properly after CSS transforms
        setTimeout(() => { try { map.invalidateSize(); } catch(e){} }, 500);

        // attach outside-click alert after layers are loaded and DOM cleaned
        attachOutsideAlert();
      }, 2500);
    }, 800);
  }, 1200);
}



// jalankan loader saat DOM siap (UNTUK LOAD LAYER & ANIMASI)
document.addEventListener('DOMContentLoaded', () => {
  loadAllLayersWithLoading();
});
