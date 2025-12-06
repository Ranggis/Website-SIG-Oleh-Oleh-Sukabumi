// --- 🌸 FITUR TAMBAH TITIK OLEH-OLEH (validasi + upload gambar) ---
let tempMarker = null;

/** Fungsi cek apakah titik berada dalam batas kota */
function isPointInsideKota(latlng) {
  const sukabumiLayer = layerStore["Kota Sukabumi"];
  if (!sukabumiLayer) return false;

  const pt = turf.point([latlng.lng, latlng.lat]);
  let inside = false;

  const layers = typeof sukabumiLayer.getLayers === "function"
    ? sukabumiLayer.getLayers()
    : [sukabumiLayer];

  layers.forEach(l => {
    const geo = l.toGeoJSON ? l.toGeoJSON() : null;
    if (!geo) return;

    if (geo.type === "FeatureCollection") {
      geo.features.forEach(f => {
        if (f.geometry && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon")) {
          if (turf.booleanPointInPolygon(pt, f)) inside = true;
        }
      });
    } else if (geo.type === "Feature") {
      const g = geo.geometry;
      if (g && (g.type === "Polygon" || g.type === "MultiPolygon")) {
        if (turf.booleanPointInPolygon(pt, geo)) inside = true;
      }
    }
  });

  return inside;
}

// 📍 Tombol "Lokasi Saya"
document.getElementById('locate-me').addEventListener('click', function() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        // 🗺️ Lokasi pengguna
        const userLocation = L.latLng(userLat, userLng);

        // 🔹 Tambahkan marker dengan popup + tooltip
        L.marker(userLocation)
          .addTo(map)
          .bindPopup("Lokasi Anda")
          .bindTooltip("Ini posisi Anda sekarang", {
            permanent: false,
            direction: "top",
            offset: [0, -8],
          })
          .openPopup();

        // 🔹 Pindahkan tampilan map ke lokasi pengguna
        map.setView(userLocation, 15);
      },
      function() {
        alert("Tidak dapat mengakses lokasi. Pastikan GPS aktif.");
      }
    );
  } else {
    alert("Browser Anda tidak mendukung geolokasi.");
  }
});


/** Form tambah lokasi */
function showAddLocationForm(lat, lng) {
  const overlay = document.createElement("div");
  overlay.className = "form-overlay";

  overlay.innerHTML = `
    <div class="form-popup">
      <h3>Tambah Titik Oleh-Oleh</h3>
      <label>Nama Tempat:</label>
      <input type="text" id="place-name" placeholder="Contoh: Toko Mochi Kaswari" />

      <label>Deskripsi Singkat:</label>
      <textarea id="place-desc" rows="3" placeholder="Ceritakan sedikit tentang tempat ini..."></textarea>

      <label>Unggah Gambar:</label>
      <input type="file" id="place-image" accept="image/*" />
      <img id="image-preview" class="preview-img" style="display:none" />

      <div class="form-buttons">
        <button id="save-point" class="btn-primary">Simpan</button>
        <button id="cancel-point" class="btn-secondary">Batal</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Preview gambar
  const imgInput = overlay.querySelector("#place-image");
  const preview = overlay.querySelector("#image-preview");
  imgInput.addEventListener("change", () => {
    const file = imgInput.files[0];
    if (file) {
      preview.src = URL.createObjectURL(file);
      preview.style.display = "block";
    }
  });

  // Tombol simpan
  overlay.querySelector("#save-point").addEventListener("click", () => {
    const name = overlay.querySelector("#place-name").value.trim();
    const desc = overlay.querySelector("#place-desc").value.trim();
    const file = imgInput.files[0];

    if (!name) {
      alert("Nama tempat tidak boleh kosong!");
      return;
    }

    // Buat marker baru
    const newMarker = L.marker([lat, lng]).addTo(map);

    let popupContent = `<b>${name}</b><br>${desc}`;
    if (file) {
      const imgURL = URL.createObjectURL(file);
      popupContent += `<br><img src="${imgURL}" class="popup-img"/>`;
    }

    newMarker.bindPopup(popupContent);

    map.closePopup();
    document.body.removeChild(overlay);

    if (tempMarker) {
      map.removeLayer(tempMarker);
      tempMarker = null;
    }
  });

  // Tombol batal
  overlay.querySelector("#cancel-point").addEventListener("click", () => {
    document.body.removeChild(overlay);
    if (tempMarker) {
      map.removeLayer(tempMarker);
      tempMarker = null;
    }
  });
}

// Event klik di peta
map.on("click", function(e) {
  unlockAudioSilently();

  const inside = isPointInsidePolygon(e.latlng, layerStore["Kota Sukabumi"]);
  if (!inside) {
    showCustomAlert();
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    return; // hentikan proses di sini
  }

  if (tempMarker) map.removeLayer(tempMarker);
  tempMarker = L.marker([e.latlng.lat, e.latlng.lng], { opacity: 0.7 }).addTo(map);
  showAddLocationForm(e.latlng.lat, e.latlng.lng);
});
