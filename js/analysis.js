/* =========================
   🔍 ANALISIS SPASIAL
   (Distance, Buffer, Radius, Compare)
   ========================= */

// Layer khusus untuk hasil analisis
let analysisLayerGroup = L.layerGroup().addTo(map);

// Bersihkan layer analisis
function clearAnalysisLayers() {
  if (analysisLayerGroup) {
    analysisLayerGroup.clearLayers();
  }
}

// Ambil semua titik yang punya koordinat
function getAllPointData() {
  const points = [];
  for (const key in rawData) {
    const item = rawData[key];
    if (item && item.latlng) points.push(item);
  }
  return points;
}

// 🔹 Analisis: jarak ke toko terdekat dari lokasi user
function analyzeNearestFromUser() {
  if (!navigator.geolocation) {
    alert("Browser tidak mendukung geolokasi.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      clearAnalysisLayers();

      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;
      const userLatLng = [userLat, userLng];
      const userPoint = turf.point([userLng, userLat]);

      const dataPoints = getAllPointData();
      if (dataPoints.length === 0) {
        alert("Data toko belum tersedia di rawData.");
        return;
      }

      let nearest = null;
      let minDistKm = Infinity;

      dataPoints.forEach(item => {
        const [lat, lng] = item.latlng;
        const p = turf.point([lng, lat]);
        const d = turf.distance(userPoint, p, { units: "kilometers" });
        if (d < minDistKm) {
          minDistKm = d;
          nearest = item;
        }
      });

      if (!nearest) {
        alert("Tidak ditemukan toko terdekat.");
        return;
      }

      // marker lokasi user
      L.marker(userLatLng)
        .addTo(analysisLayerGroup)
        .bindPopup("Lokasi Anda")
        .openPopup();

      // garis ke toko terdekat
      const line = L.polyline(
        [userLatLng, nearest.latlng],
        { color: "#e74c3c", weight: 3, dashArray: "6,4" }
      ).addTo(analysisLayerGroup);

      map.fitBounds(line.getBounds(), { padding: [30, 30] });

      // buka popup marker aslinya
      for (const layerName in layerStore) {
        const layer = layerStore[layerName];
        if (!layer || !layer.eachLayer) continue;
        layer.eachLayer(l => {
          if (l.getLatLng) {
            const ll = l.getLatLng();
            if (
              Math.abs(ll.lat - nearest.latlng[0]) < 1e-8 &&
              Math.abs(ll.lng - nearest.latlng[1]) < 1e-8
            ) {
              l.openPopup();
              highlightMarker(l);
            }
          }
        });
      }

      Swal.fire({
        icon: "info",
        title: "Analisis Jarak",
        html: `
          <p>Toko terdekat dari lokasi Anda:</p>
          <p><strong>${nearest.props.nama}</strong></p>
          <p>Jarak sekitar <strong>${minDistKm.toFixed(2)} km</strong>.</p>
        `,
        confirmButtonColor: "#8b5e34"
      });
    },
    err => {
      alert("Tidak dapat mengambil lokasi Anda: " + err.message);
    }
  );
}

// 🔹 Analisis: buffer radiusKm + daftar toko di dalamnya
function analyzeBufferAroundUser(radiusKm = 1) {
  if (!navigator.geolocation) {
    alert("Browser tidak mendukung geolokasi.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      clearAnalysisLayers();

      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;
      const userLatLng = [userLat, userLng];

      // bentuk circle/buffer di sekitar user
      const circle = turf.circle([userLng, userLat], radiusKm, {
        steps: 80,
        units: "kilometers"
      });

      const bufferLayer = L.geoJSON(circle, {
        style: {
          color: "#3498db",
          weight: 2,
          fillColor: "#3498db",
          fillOpacity: 0.15
        }
      }).addTo(analysisLayerGroup);

      // marker lokasi user
      L.marker(userLatLng)
        .addTo(analysisLayerGroup)
        .bindPopup("Lokasi Anda")
        .openPopup();

      const dataPoints = getAllPointData();
      const insideList = [];

      dataPoints.forEach(item => {
        const [lat, lng] = item.latlng;
        const p = turf.point([lng, lat]);
        if (turf.booleanPointInPolygon(p, circle)) {
          insideList.push(item);
          L.circleMarker(item.latlng, {
            radius: 6,
            color: "#d9534f",
            weight: 2,
            fillOpacity: 0.9
          }).addTo(analysisLayerGroup);
        }
      });

      map.fitBounds(bufferLayer.getBounds(), { padding: [30, 30] });

      const titleText = `Analisis Buffer ${radiusKm} km`;

      if (insideList.length === 0) {
        Swal.fire({
          icon: "info",
          title: titleText,
          text: `Tidak ada toko oleh-oleh dalam radius ${radiusKm} km dari lokasi Anda.`,
          confirmButtonColor: "#8b5e34"
        });
      } else {
        const listHtml = insideList
          .map((item, idx) => `<li>${idx + 1}. ${item.props.nama}</li>`)
          .join("");
        Swal.fire({
          icon: "info",
          title: titleText,
          html: `
            <p>Ditemukan <strong>${insideList.length}</strong> toko oleh-oleh di dalam radius ${radiusKm} km dari lokasi Anda:</p>
            <ol style="text-align:left;max-height:200px;overflow-y:auto">
              ${listHtml}
            </ol>
          `,
          confirmButtonColor: "#8b5e34"
        });
      }
    },
    err => {
      alert("Tidak dapat mengambil lokasi Anda: " + err.message);
    }
  );
}

// 🔹 Analisis radius custom (input meter → konversi km)
function analyzeCustomRadiusFromUser() {
  Swal.fire({
    title: "Cari Toko dalam Radius Tertentu",
    html: `
      <p>Masukkan radius dari lokasi Anda (dalam meter):</p>
      <input id="radius-input" type="number" min="50" step="50" class="swal2-input" placeholder="contoh: 500" />
    `,
    preConfirm: () => {
      const val = document.getElementById("radius-input").value;
      const rMeter = parseFloat(val);
      if (isNaN(rMeter) || rMeter <= 0) {
        Swal.showValidationMessage("Radius harus berupa angka lebih dari 0.");
        return false;
      }
      return rMeter;
    },
    showCancelButton: true,
    confirmButtonText: "Analisis",
    cancelButtonText: "Batal",
    confirmButtonColor: "#8b5e34"
  }).then((res) => {
    if (!res.isConfirmed || !res.value) return;
    const radiusKm = res.value / 1000; // meter -> km
    analyzeBufferAroundUser(radiusKm);
  });
}

// 🔹 Bandingkan 2 titik (A → B)
function compareTwoPlaces() {
  const entries = Object.entries(rawData).filter(([k, v]) => v && Array.isArray(v.latlng));
  if (!entries.length) {
    Swal.fire({
      icon: "info",
      title: "Data belum siap",
      text: "Belum ada titik toko yang tercatat di rawData.",
      confirmButtonColor: "#8b5e34"
    });
    return;
  }

  const optionsHtml = entries
    .map(([key, item]) => `<option value="${key}">${item.props.nama}</option>`)
    .join("");

  Swal.fire({
    title: "Bandingkan 2 Toko (A → B)",
    html: `
      <div class="review-form">
        <label for="pointA">Pilih Titik A:</label>
        <select id="pointA" class="swal2-select">
          ${optionsHtml}
        </select>

        <label for="pointB">Pilih Titik B:</label>
        <select id="pointB" class="swal2-select">
          ${optionsHtml}
        </select>
      </div>
    `,
    focusConfirm: false,
    preConfirm: () => {
      const aKey = document.getElementById("pointA").value;
      const bKey = document.getElementById("pointB").value;
      if (!aKey || !bKey) {
        Swal.showValidationMessage("Titik A dan B harus dipilih.");
        return false;
      }
      if (aKey === bKey) {
        Swal.showValidationMessage("Titik A dan B tidak boleh sama.");
        return false;
      }
      return { aKey, bKey };
    },
    showCancelButton: true,
    confirmButtonText: "Hitung Jarak",
    cancelButtonText: "Batal",
    confirmButtonColor: "#8b5e34"
  }).then((res) => {
    if (!res.isConfirmed || !res.value) return;

    const { aKey, bKey } = res.value;
    const aItem = rawData[aKey];
    const bItem = rawData[bKey];
    if (!aItem || !bItem || !aItem.latlng || !bItem.latlng) {
      Swal.fire("Gagal", "Koordinat titik tidak lengkap.", "error");
      return;
    }

    clearAnalysisLayers();

    const aLatLng = aItem.latlng;
    const bLatLng = bItem.latlng;

    const from = turf.point([aLatLng[1], aLatLng[0]]);
    const to   = turf.point([bLatLng[1], bLatLng[0]]);
    const dKm  = turf.distance(from, to, { units: "kilometers" });
    const dMeter = dKm * 1000;

    const markerA = L.marker(aLatLng)
      .addTo(analysisLayerGroup)
      .bindPopup("Titik A: " + aItem.props.nama);

    const markerB = L.marker(bLatLng)
      .addTo(analysisLayerGroup)
      .bindPopup("Titik B: " + bItem.props.nama);

    const line = L.polyline([aLatLng, bLatLng], {
      color: "#9b59b6",
      weight: 3,
      dashArray: "8,4"
    }).addTo(analysisLayerGroup);

    map.fitBounds(line.getBounds(), { padding: [30, 30] });

    Swal.fire({
      icon: "info",
      title: "Hasil Perbandingan Jarak",
      html: `
        <p><strong>A:</strong> ${aItem.props.nama}</p>
        <p><strong>B:</strong> ${bItem.props.nama}</p>
        <p>Jarak garis lurus sekitar: <br>
        <strong>${dKm.toFixed(3)} km</strong> (~${dMeter.toFixed(0)} meter)</p>
      `,
      confirmButtonColor: "#8b5e34"
    });
  });
}

// 🔹 Reset hasil analisis
function resetAnalysis() {
  clearAnalysisLayers();
  Swal.fire({
    icon: "success",
    title: "Reset Analisis",
    text: "Layer hasil analisis sudah dibersihkan dari peta.",
    timer: 1800,
    showConfirmButton: false
  });
}

// Listener khusus untuk tombol analisis
document.addEventListener('DOMContentLoaded', () => {
  const btnNearest       = document.getElementById('btn-nearest');
  const btnBuffer1km     = document.getElementById('btn-buffer-1km') || document.getElementById('btn-buffer'); // fallback ke btn-buffer
  const btnBufferCustom  = document.getElementById('btn-buffer-custom');
  const btnCompare       = document.getElementById('btn-compare');
  const btnReset         = document.getElementById('btn-reset-analysis');

  if (btnNearest)      btnNearest.addEventListener('click', analyzeNearestFromUser);
  if (btnBuffer1km)    btnBuffer1km.addEventListener('click', () => analyzeBufferAroundUser(1));
  if (btnBufferCustom) btnBufferCustom.addEventListener('click', analyzeCustomRadiusFromUser);
  if (btnCompare)      btnCompare.addEventListener('click', compareTwoPlaces);
  if (btnReset)        btnReset.addEventListener('click', resetAnalysis);
});
