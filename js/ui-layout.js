// --- Sidebar Toggle ---
const sidebarEl = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const closeSidebar = document.getElementById('close-sidebar');
const mainContent = document.getElementById('main-content');

function openSidebar(){
  if(!sidebarEl) return;
  sidebarEl.classList.remove('closed');
  document.body.classList.add('sidebar-open');
  if (mainContent) mainContent.style.marginLeft = window.innerWidth > 900 ? '360px' : '0';
}

function closeSidebarFn(){
  if(!sidebarEl) return;
  sidebarEl.classList.add('closed');
  document.body.classList.remove('sidebar-open');
  if (mainContent) mainContent.style.marginLeft = '0';
}

if(sidebarToggle) sidebarToggle.addEventListener('click', ()=> {
  if(sidebarEl && sidebarEl.classList.contains('closed')) openSidebar();
  else closeSidebarFn();
});
if(closeSidebar) closeSidebar.addEventListener('click', closeSidebarFn);

// --- Search ---
const inputSearch = document.getElementById('search-input');
const resultsBox = document.getElementById('search-results');

if(inputSearch){
  inputSearch.addEventListener('input', function(){
    const q = this.value.trim().toLowerCase();
    if(resultsBox) resultsBox.innerHTML = '';
    if(!q) return;
    const names = Object.keys(rawData);
    const hits = names.filter(n => n.includes(q)).slice(0,8);
    hits.forEach(name => {
      const res = document.createElement('div');
      res.className = 'search-result';
      res.textContent = rawData[name].props.nama || name;
      res.addEventListener('click', () => {
        const item = rawData[name];
        if(item && item.latlng){
          map.setView(item.latlng, 17);
          for(const LName in layerStore){
            try{
              layerStore[LName].eachLayer(l => {
                if(l.getLatLng && l.getLatLng().lat === item.latlng[0] && l.getLatLng().lng === item.latlng[1]){
                  l.openPopup();
                }
              });
            }catch(e){}
          }
        }
        if(resultsBox) resultsBox.innerHTML = '';
        inputSearch.value = '';
      });
      if(resultsBox) resultsBox.appendChild(res);
    });
  });
}

// Responsif
window.addEventListener('resize', () => {
  if(window.innerWidth <= 900){
    if(mainContent) mainContent.style.marginLeft = '0';
  } else {
    if(!sidebarEl || sidebarEl.classList.contains('closed')) {
      if(mainContent) mainContent.style.marginLeft = '0';
    } else {
      if(mainContent) mainContent.style.marginLeft = '360px';
    }
  }
});

// === EVENT: Toggle Sidebar dengan Tombol Spasi ===
document.addEventListener('keydown', function(event) {
  const activeEl = document.activeElement;
  const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

  if (event.code === 'Space' && !isTyping) {
    event.preventDefault();
    if (sidebarEl && sidebarEl.classList.contains('closed')) openSidebar();
    else closeSidebarFn();
  }
});

function highlightMarker(layer) {
  if (window._activeMarker) {
    try { window._activeMarker.setZIndexOffset(0); window._activeMarker.setOpacity(1); } catch(e){}
  }
  window._activeMarker = layer;
  try { layer.setZIndexOffset(1000); layer.setOpacity(0.8); } catch(e){}
}

// =============== 🔊 Efek Klik di Luar Kota Sukabumi ===============

const alertAudio = new Audio('../assets/sound/jarjit.mpeg');
let audioUnlocked = false;
const alertOverlay = document.getElementById('alert-overlay');
const customAlert = document.getElementById('custom-alert');

function unlockAudioSilently() {
  if (audioUnlocked) return;
  try {
    alertAudio.play().then(() => {
      alertAudio.pause();
      alertAudio.currentTime = 0;
      audioUnlocked = true;
    }).catch(() => { /* ignore */ });
  } catch(e) {}
}

// fungsi animasi alert
function showCustomAlert(message = "⚠️ Anda mengklik di luar wilayah Kota Sukabumi!") {
  // overlay merah
  if (alertOverlay) {
    alertOverlay.style.display = 'block';
    setTimeout(() => { if (alertOverlay) alertOverlay.style.display = 'none'; }, 500);
  }

  // set message if customAlert exists
  if (customAlert) {
    customAlert.textContent = message;
    customAlert.classList.add('show');
    setTimeout(() => { if (customAlert) customAlert.classList.remove('show'); }, 3000);
  }

  // mainkan suara (jika sudah di-unlock)
  unlockAudioSilently();
  alertAudio.currentTime = 0;
  alertAudio.play().catch(() => { /* browser may block autoplay */ });
}

// fungsi cek titik di dalam polygon/multipolygon
function isPointInsidePolygon(latlng, polygonLayer) {
  if (!polygonLayer) return false;

  const point = turf.point([latlng.lng, latlng.lat]);
  let inside = false;

  // polygonLayer bisa berupa LayerGroup / GeoJSON layer
  try {
    const layers = polygonLayer.getLayers ? polygonLayer.getLayers() : [polygonLayer];
    layers.forEach(layer => {
      try {
        const polyGeo = layer.toGeoJSON ? layer.toGeoJSON() : null;
        if (!polyGeo) return;
        // jika featureCollection, cek setiap feature
        if (polyGeo.type === 'FeatureCollection') {
          polyGeo.features.forEach(f => {
            if (f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')) {
              if (turf.booleanPointInPolygon(point, f)) inside = true;
            }
          });
        } else if (polyGeo.type === 'Feature') {
          const g = polyGeo.geometry;
          if (g && (g.type === 'Polygon' || g.type === 'MultiPolygon')) {
            if (turf.booleanPointInPolygon(point, polyGeo)) inside = true;
          }
        } else if (polyGeo.type === 'Polygon' || polyGeo.type === 'MultiPolygon') {
          if (turf.booleanPointInPolygon(point, polyGeo)) inside = true;
        }
      } catch(e){}
    });
  } catch(e){
    // fallback false
  }

  return inside;
}

// attach click handler once layer is ready (safe & idempotent)
let outsideHandlerAttached = false;
function attachOutsideAlert() {
  if (outsideHandlerAttached) return;
  const sukabumiLayer = layerStore["Kota Sukabumi"];
  if (!sukabumiLayer) {
    // retry a few times until available
    const tries = 10;
    let attempt = 0;
    const iv = setInterval(() => {
      attempt++;
      if (layerStore["Kota Sukabumi"]) {
        clearInterval(iv);
        attachOutsideAlert(); // re-run, will attach
      } else if (attempt >= tries) {
        clearInterval(iv);
        console.warn('attachOutsideAlert: layer "Kota Sukabumi" not found after retries.');
      }
    }, 700);
    return;
  }
  outsideHandlerAttached = true;
}

const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Cek tema tersimpan sebelumnya
if (localStorage.getItem('theme') === 'dark') {
  body.classList.add('dark-theme');
  themeToggle.textContent = '☀️';
}

themeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-theme');
  const isDark = body.classList.contains('dark-theme');
  themeToggle.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});
