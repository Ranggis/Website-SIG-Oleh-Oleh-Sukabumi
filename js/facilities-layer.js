/* FACILITIES-LAYER.JS — versi FINAL (Icon + Tooltip)
   Layer Fasilitas Pendukung Wisata (OpenStreetMap / Overpass API)
   - Hotel / Penginapan
   - Tempat Ibadah
   - ATM
   - Bank
*/

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// BBOX Kota Sukabumi (perkiraan)
const SUKABUMI_BBOX = {
  south: -6.96,
  west: 106.87,
  north: -6.88,
  east: 106.99
};

// Layer utama
let facilitiesLayer = L.layerGroup();
let facilitiesDataCache = null;

/* ================= ICON SET KHUSUS FASILITAS ================= */

const facilityIcons = {
  hotel: L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/139/139899.png",
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30]
  }),
  worship: L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/3448/3448600.png",
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30]
  }),
  bank: L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/2830/2830284.png",
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30]
  }),
  atm: L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/483/483947.png",
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30]
  }),
  default: L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -30]
  })
};

/* ================= QUERY OVERPASS ================= */

function buildFacilitiesQuery() {
  const { south, west, north, east } = SUKABUMI_BBOX;

  return `
[out:json][timeout:25];
(
  node["tourism"="hotel"](${south},${west},${north},${east});
  node["amenity"="place_of_worship"](${south},${west},${north},${east});
  node["amenity"="atm"](${south},${west},${north},${east});
  node["amenity"="bank"](${south},${west},${north},${east});
);
out body;
`;
}

/* ================= FETCH DATA ================= */

async function fetchFacilities() {
  if (facilitiesDataCache) return facilitiesDataCache;

  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(buildFacilitiesQuery())
    });

    if (!res.ok) throw new Error(res.status);

    const data = await res.json();
    facilitiesDataCache = data;
    return data;
  } catch (err) {
    console.error("Overpass Error:", err);
    Swal.fire("Gagal", "Tidak dapat memuat data fasilitas wisata.", "error");
    return null;
  }
}

/* ================= KATEGORI & ICON ================= */

function detectCategory(tags = {}) {
  if (tags.tourism === "hotel") return "hotel";
  if (tags.amenity === "place_of_worship") return "worship";
  if (tags.amenity === "bank") return "bank";
  if (tags.amenity === "atm") return "atm";
  return "default";
}

function getFacilityIcon(type) {
  return facilityIcons[type] || facilityIcons.default;
}

function getCategoryName(type) {
  if (type === "hotel") return "Hotel / Penginapan";
  if (type === "worship") return "Tempat Ibadah";
  if (type === "bank") return "Bank";
  if (type === "atm") return "ATM";
  return "Fasilitas Umum";
}

/* ================= RENDER LAYER ================= */

function renderFacilitiesLayer(data) {
  if (!data || !data.elements) return;

  facilitiesLayer.clearLayers();

  data.elements.forEach(el => {
    if (!el.lat || !el.lon) return;

    const tags = el.tags || {};

    const type = detectCategory(tags);
    const categoryName = getCategoryName(type);
    const icon = getFacilityIcon(type);

    // Coba ambil nama dari beberapa sumber
    let name =
    tags.name ||
    tags.operator ||
    tags.brand ||
    null;

    if (!name) {
    if (type === "atm") name = "ATM Tanpa Nama";
    else if (type === "bank") name = "Bank Tanpa Nama";
    else if (type === "hotel") name = "Penginapan Tanpa Nama";
    else if (type === "worship") name = "Tempat Ibadah Tanpa Nama";
    else name = "Fasilitas Tanpa Nama";
    }

    const marker = L.marker([el.lat, el.lon], { icon }).addTo(facilitiesLayer);

    // ✅ TOOLTIP (HOVER)
    marker.bindTooltip(
      `<strong>${name}</strong><br>${categoryName}`,
      {
        direction: "top",
        offset: [0, -10],
        opacity: 0.95,
        permanent: false
      }
    );

    // ✅ POPUP DETAIL
    marker.bindPopup(`
      <div class="facility-popup">
        <div class="facility-title">${name}</div>
        <div class="facility-category">${categoryName}</div>
        <p style="margin-top:6px;font-size:12px">
          Sumber data: <b>OpenStreetMap</b>
        </p>
      </div>
    `);
  });

  facilitiesLayer.addTo(map);
}

/* ================= CHECKBOX HANDLER ================= */

async function handleFacilitiesToggle(checked, checkbox) {
  if (checked) {
    const data = await fetchFacilities();
    if (!data) {
      checkbox.checked = false;
      return;
    }
    renderFacilitiesLayer(data);
  } else {
    facilitiesLayer.clearLayers();
    map.removeLayer(facilitiesLayer);
  }
}

/* ================= UI SIDEBAR ================= */

function setupFacilitiesUI() {
  const container = document.getElementById("layer-checkboxes");
  if (!container) return;

  if (document.getElementById("chk-facilities")) return;

  const wrapper = document.createElement("div");
  wrapper.className = "layer-item";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = "chk-facilities";

  const label = document.createElement("label");
  label.htmlFor = "chk-facilities";
  label.innerText = "Fasilitas Pendukung Wisata (Hotel, ATM, Bank, Ibadah)";

  wrapper.appendChild(checkbox);
  wrapper.appendChild(label);
  container.appendChild(wrapper);

  checkbox.addEventListener("change", () => {
    handleFacilitiesToggle(checkbox.checked, checkbox);
  });
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
  setupFacilitiesUI();
});
