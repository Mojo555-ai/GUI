




var transit = [
  { id: "ceb_sgn", name: "CEB→SGN (May 19th Flight)", min: 80, max: 250, defaultVal: 100 },
  { id: "sgn_dad", name: "SGN→DAD (May 23rd Flight)", min: 30, max: 150, defaultVal: 50 },
  { id: "dad_tag", name: "DAD→PPS via MNL (June 3rd Flight)", min: 180, max: 350, defaultVal: 220 },
  // { id: "tag_eni", name: "Bohol→El Nido (June 8th Flight)", min: 90, max: 220, defaultVal: 120 },
  { id: "eni_coron", name: "El Nido→Coron (June 11th Flight)", min: 60, max: 150, defaultVal: 110 },
  { id: "usu_ceb", name: "Coron→CEB (June 15th Flight)", min: 40, max: 150, defaultVal: 75 }
];

var hotels = [
  { id: "ceb_arrival", name: "Cebu City / Mactan (5/17-5/19 | 2 nts)", min: 60, max: 250, defaultVal: 100 },
  { id: "hcmc", name: "HCMC District 1 / 3 (5/19-5/23 | 4 nts)", min: 180, max: 500, defaultVal: 260 },
  { id: "hoian", name: "Hoi An Ancient Town (5/23-5/26 | 3 nts)", min: 90, max: 300, defaultVal: 165 },
  { id: "phongnha", name: "Phong Nha Jungle Eco-Lodge (5/26-5/29 | 3 nts)", min: 90, max: 300, defaultVal: 165 },
  { id: "danang", name: "Da Nang Beach & Monkey Mtn (5/29-6/2 | 4 nts)", min: 110, max: 380, defaultVal: 220 },
  { id: "pps_arrival", name: "PPS Arrival (6/3-6/4 | 1 nts)", min: 30, max: 80, defaultVal: 50 },
  { id: "port_barton", name: "Port Barton (6/4-6/7 | 3 nts)", min: 150, max: 400, defaultVal: 200 },
  { id: "elnido", name: "Rockennest (6/7-6/10 | 1 nt)", min: 150, max: 350, defaultVal: 220 },
  { id: "elnido_beach", name: "Maremegmeg Beach (6/10-6/11 | 1 nt)", min: 50, max: 350, defaultVal: 120 },
  { id: "coron", name: "Coron Town Proper (6/11-6/15 | 4 nts)", min: 150, max: 400, defaultVal: 260 },
  { id: "mactan_final", name: "Mactan Final Layover (6/15-6/16 | 1 nt)", min: 40, max: 180, defaultVal: 75 }
];

let currentFileHandle = null;

function safeGetStorage() {
  try {
    var raw = localStorage.getItem("master_seasia_budget_v6");
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function safeSetStorage(data) {
  try {
    localStorage.setItem("master_seasia_budget_v6", JSON.stringify(data));
  } catch (e) {}
}

function getCurrentState() {
  var state = {
    target: parseFloat(document.getElementById("slider-target").value),
    items: {},
    locked: {}
  };
  transit.concat(hotels).forEach(function(item) {
    var el = document.getElementById(item.id);
    var cb = document.getElementById("check-" + item.id);
    if (el) state.items[item.id] = parseFloat(el.value);
    if (cb) state.locked[item.id] = cb.checked;
  });
  return state;
}

function applyState(state) {
  if (!state) return;
  if (state.target) {
    document.getElementById("slider-target").value = state.target;
  }
  if (state.items) {
    for (var key in state.items) {
      var el = document.getElementById(key);
      if (el && state.items[key] !== undefined) el.value = state.items[key];
    }
  }
  if (state.locked) {
    for (var key in state.locked) {
      var cb = document.getElementById("check-" + key);
      if (cb && state.locked[key] !== undefined) {
        cb.checked = state.locked[key];
        toggleLock(key, cb.checked);
      }
    }
  }
  recalculate();
}

function showButtonSuccess(btnId, text) {
  var btn = document.getElementById(btnId);
  var originalText = btn.innerHTML;
  var originalBg = btn.style.backgroundColor;
  var originalBorder = btn.style.borderColor;

  btn.innerHTML = text;
  btn.style.backgroundColor = "#16a34a";
  btn.style.borderColor = "#15803d";
  
  setTimeout(function() {
    btn.innerHTML = originalText;
    btn.style.backgroundColor = originalBg;
    btn.style.borderColor = originalBorder;
  }, 2000);
}

function toggleLock(id, isLocked) {
  var row = document.getElementById("row-" + id);
  var slider = document.getElementById(id);
  if (isLocked) {
    row.classList.add("locked");
    slider.disabled = true;
  } else {
    row.classList.remove("locked");
    slider.disabled = false;
  }
}

function createSliders(items, containerId) {
  var container = document.getElementById(containerId);
  container.innerHTML = '';
  
  items.forEach(function(item) {
    var row = document.createElement("div");
    row.className = "row";
    row.id = "row-" + item.id;
    
    row.innerHTML = 
      '<input type="checkbox" id="check-' + item.id + '" title="Mark as Purchased/Locked">' +
      '<label for="check-' + item.id + '">' + item.name + '</label>' +
      '<input type="range" id="' + item.id + '" min="' + item.min + '" max="' + item.max + '" step="1" value="' + item.defaultVal + '">' +
      '<div class="val-display" id="val-' + item.id + '">$' + item.defaultVal + '</div>';
    
    container.appendChild(row);

    var slider = document.getElementById(item.id);
    var checkbox = document.getElementById("check-" + item.id);

    slider.addEventListener("input", function() {
      recalculate();
      safeSetStorage(getCurrentState());
    });

    checkbox.addEventListener("change", function() {
      toggleLock(item.id, checkbox.checked);
      safeSetStorage(getCurrentState());
    });
  });
}

function recalculate() {
  var target = parseFloat(document.getElementById("slider-target").value);
  document.getElementById("val-target").innerText = "$" + target.toLocaleString();
  document.getElementById("disp-total-budget").innerText = "$" + target.toLocaleString();

  var transitSum = 0;
  transit.forEach(function(item) {
    var el = document.getElementById(item.id);
    var v = el ? parseFloat(el.value) : item.defaultVal;
    document.getElementById("val-" + item.id).innerText = "$" + v.toLocaleString();
    transitSum += v;
  });
  document.getElementById("flights-total").innerText = "$" + transitSum.toLocaleString();

  var hotelsSum = 0;
  hotels.forEach(function(item) {
    var el = document.getElementById(item.id);
    var v = el ? parseFloat(el.value) : item.defaultVal;
    document.getElementById("val-" + item.id).innerText = "$" + v.toLocaleString();
    hotelsSum += v;
  });
  document.getElementById("hotels-total").innerText = "$" + hotelsSum.toLocaleString();

  var totalExpenses = transitSum + hotelsSum;
  var remaining = target - totalExpenses;

  document.getElementById("disp-total-expenses").innerText = "$" + totalExpenses.toLocaleString();
  var remEl = document.getElementById("disp-remaining");
  remEl.innerText = "$" + remaining.toLocaleString();
  remEl.className = "stat-val " + (remaining >= 0 ? "surplus" : "deficit");

  var pct = Math.min(100, Math.max(0, (totalExpenses / target) * 100));
  var fill = document.getElementById("progress-fill");
  fill.style.width = pct + "%";
  fill.style.background = remaining >= 0 ? "#38bdf8" : "#f87171";
}

async function saveToLocalDrive() {
  try {
    if (!currentFileHandle) {
      currentFileHandle = await window.showSaveFilePicker({
        suggestedName: 'master_trip_budget.json',
        types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }],
      });
    }
    const writable = await currentFileHandle.createWritable();
    await writable.write(JSON.stringify(getCurrentState(), null, 2));
    await writable.close();
    
    showButtonSuccess("btn-save", "✅ SAVED!"); 
  } catch (err) {
    if (err.name !== 'AbortError') {
      alert("Browser security blocked the save. Please ensure you are using Chrome or Edge.");
    }
  }
}

async function loadFromLocalDrive() {
  try {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }],
    });
    currentFileHandle = fileHandle; 
    const file = await fileHandle.getFile();
    const contents = await file.text();
    const state = JSON.parse(contents);
    applyState(state);
    safeSetStorage(state);
    
    showButtonSuccess("btn-load", "✅ LOADED!"); 
  } catch (err) {
    if (err.name !== 'AbortError') {
      alert("Could not load the file. Make sure it is your saved JSON file.");
    }
  }
}

function resetDefaults() {
  try { localStorage.removeItem("master_seasia_budget_v6"); } catch(e) {}
  document.getElementById("slider-target").value = 4000;
  
  transit.concat(hotels).forEach(function(item) { 
    var slider = document.getElementById(item.id);
    var checkbox = document.getElementById("check-" + item.id);
    if (slider) slider.value = item.defaultVal;
    if (checkbox) {
      checkbox.checked = false;
      toggleLock(item.id, false);
    }
  });
  
  currentFileHandle = null; 
  recalculate();
}

createSliders(transit, "flight-sliders");
createSliders(hotels, "hotel-sliders");
document.getElementById("slider-target").addEventListener("input", function() {
  recalculate();
  safeSetStorage(getCurrentState());
});

var saved = safeGetStorage();
if (saved) applyState(saved);
else recalculate();