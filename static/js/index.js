// ─── Data (Tables 1 & 2) ─────────────────────────────────────
// Phase 1: Coll, Plan, LLM, Time, Coh, Spat
var PHASE1 = [
  ['S01 ED Triage',       5.8, 100.0, 4.7, 159, 5.00, 3.00],
  ['S02 Hospital Ward',   2.2,  92.0, 5.0, 102, 3.00, 2.33],
  ['S03 Therapy Gym',     2.9, 100.0, 7.7, 146, 4.33, 3.67],
  ['S04 Surgery Prep',    0.9,  26.7, 7.0, 115, 4.67, 3.00],
  ['S05 Dental',          1.4,  77.8, 6.0, 107, 4.00, 2.67],
  ['S06 ICU',             2.6,  53.3, 5.7, 112, 4.00, 2.00],
  ['S07 Supply Closet',   0.8,  28.3, 4.3,  97, 4.67, 2.33],
  ['S08 Rehab Corridor',  1.8,  75.0, 4.3,  74, 4.00, 3.00],
  ["S09 Doctor's Office", 2.9,  80.0, 5.7,  94, 3.33, 2.33],
  ['S10 Nurse Station',   2.8,  80.0, 5.3, 111, 4.33, 3.00],
  ['S11 Radiology',       9.3,  86.7, 4.0,  91, 4.00, 2.00],
  ['S12 Maternity',       7.6,  90.5, 3.7, 119, 4.67, 3.33],
  ['S13 Ophthalmology',   1.8,  58.3, 5.3, 160, 4.33, 2.67],
  ['S14 Clinical Lab',    3.9,  80.0, 4.3, 107, 4.00, 3.00],
  ['S15 Cosmetic',        2.2,  80.0, 4.3,  99, 4.00, 2.33]
];

// Phase 2: AmbCov, Beats, Acts/B, ObjInf, Narr
var PHASE2 = [
  ['S01 ED Triage',       1.00, 4.0, 5.33, 3.33, 3.67],
  ['S02 Hospital Ward',   0.19, 4.3, 4.72, 3.67, 3.33],
  ['S03 Therapy Gym',     1.00, 5.0, 4.13, 4.00, 3.33],
  ['S04 Surgery Prep',    0.43, 5.0, 3.48, 4.00, 3.67],
  ['S05 Dental',          0.65, 5.0, 2.83, 4.00, 3.33],
  ['S06 ICU',             0.46, 4.0, 3.50, 4.00, 4.00],
  ['S07 Supply Closet',   0.67, 6.7, 4.33, 4.00, 2.67],
  ['S08 Rehab Corridor',  0.47, 5.3, 3.06, 3.33, 4.00],
  ["S09 Doctor's Office", 0.62, 5.3, 2.64, 4.00, 4.00],
  ['S10 Nurse Station',   0.44, 5.3, 3.56, 4.00, 4.00],
  ['S11 Radiology',       0.75, 5.0, 3.27, 4.33, 4.00],
  ['S12 Maternity',       0.56, 5.0, 3.12, 4.33, 4.00],
  ['S13 Ophthalmology',   0.73, 4.7, 3.47, 3.33, 3.33],
  ['S14 Clinical Lab',    0.74, 5.0, 2.00, 4.00, 3.67],
  ['S15 Cosmetic',        0.94, 5.7, 3.13, 3.67, 4.00]
];

// Decimal places per column, so values render exactly as in the paper
var PHASE1_DP = [null, 1, 1, 1, 0, 2, 2];
var PHASE2_DP = [null, 2, 1, 2, 2, 2];

function fillTable(id, rows, dp) {
  var tbody = document.getElementById(id);
  if (!tbody) return;
  tbody.innerHTML = rows.map(function(r) {
    return '<tr>' + r.map(function(v, i) {
      return i === 0 ? '<td>' + v + '</td>'
                     : '<td data-val="' + v + '">' + v.toFixed(dp[i]) + '</td>';
    }).join('') + '</tr>';
  }).join('');
}

// ─── Pipeline animation ──────────────────────────────────────
function initPipelineAnimation() {
  var items = document.querySelectorAll('#pipeline-anim .pipe-step, #pipeline-anim .pipe-arrow');
  if (!items.length) return;
  items.forEach(function(el, i) {
    setTimeout(function() { el.classList.add('visible'); }, i * 180 + 300);
  });
}

// ─── Runtime demo: interaction map + story line ──────────────
var PRIMITIVES = [
  { id: 'gaze',    label: 'Gaze',    icon: 'fa-eye' },
  { id: 'grab',    label: 'Grab',    icon: 'fa-hand-rock' },
  { id: 'release', label: 'Release', icon: 'fa-hand-paper' },
  { id: 'touch',   label: 'Touch',   icon: 'fa-hand-pointer' }
];

var RESPONSE_ICON = { dialogue: 'fa-comment-dots', highlight: 'fa-star', move: 'fa-arrows-alt', info: 'fa-info-circle' };

// Per-object affordances (environment-inherent); fire regardless of story progress
var ENTITIES = [
  { id: 'doctor', label: 'Doctor', icon: 'fa-user-md', cells: {
    gaze:  { type: 'dialogue', text: 'Doctor: "I\'m the attending today."' },
    touch: { type: 'dialogue', text: 'Doctor: "Let me know if you need anything."' } } },
  { id: 'surgeon', label: 'Surgeon', icon: 'fa-user-nurse', cells: {
    gaze:    { type: 'dialogue', text: 'Surgeon: "We\'re prepping for surgery."' },
    release: { type: 'move',     text: 'Drop the held object beside the surgeon' },
    touch:   { type: 'dialogue', text: 'Surgeon: "Careful, I\'m scrubbed in."' } } },
  { id: 'patient', label: 'Patient', icon: 'fa-procedures', cells: {
    gaze:  { type: 'dialogue', text: 'Patient: "I\'m a little nervous."' },
    touch: { type: 'dialogue', text: 'Patient: "Hello."' } } },
  { id: 'trolley', label: 'Supply trolley', icon: 'fa-dolly-flatbed', cells: {
    gaze:    { type: 'highlight', text: 'Supply trolley outline highlighted' },
    grab:    { type: 'move',      text: 'Supply trolley attached to hand' },
    release: { type: 'move',      text: 'Supply trolley dropped in place' } } },
  { id: 'monitor', label: 'Patient monitor', icon: 'fa-heartbeat', cells: {
    grab:    { type: 'move', text: 'Patient monitor attached to hand' },
    release: { type: 'move', text: 'Patient monitor dropped in place' },
    touch:   { type: 'info', text: 'Info panel: "Displays heart rate, SpO2, and blood pressure."' } } },
  { id: 'table', label: 'Instrument table', icon: 'fa-toolbox', cells: {
    gaze:  { type: 'highlight', text: 'Instrument table highlighted' },
    touch: { type: 'info',      text: 'Info panel: "Sterile instruments for the procedure."' } } }
];

// Story line (task-conditioned); strictly sequential beats
var BEATS = [
  { entity: 'doctor', action: 'gaze', actions: [
    ['Dialogue',  'Doctor: "The surgeon needs the supply trolley."'],
    ['Animation', 'Doctor points toward the trolley'],
    ['Highlight', 'Supply trolley'] ] },
  { entity: 'trolley', action: 'grab', actions: [
    ['Attach',    'Trolley follows the user\'s hand'],
    ['Highlight', 'Surgeon'],
    ['Animation', 'Surgeon turns and waves'],
    ['Dialogue',  'Surgeon: "Over here, please."'] ] },
  { entity: 'surgeon', action: 'release', needsHeld: 'trolley', actions: [
    ['Place',     'Trolley set beside the operating table'],
    ['Dialogue',  'Surgeon: "Thanks. Check the patient\'s vitals first."'],
    ['Highlight', 'Patient monitor'] ] },
  { entity: 'monitor', action: 'touch', actions: [
    ['Info',      'Monitor shows HR 72 bpm, SpO2 98%'],
    ['Dialogue',  'Surgeon: "Vitals are stable."'],
    ['Highlight', 'Patient'],
    ['Lighting',  'Overhead surgical light on'] ] },
  { entity: 'patient', action: 'gaze', actions: [
    ['Dialogue',  'Patient: "Will it hurt?"'],
    ['Animation', 'Surgeon walks up to the patient'],
    ['Dialogue',  'Surgeon: "You\'re in good hands."'],
    ['State',     'Story complete'] ] }
];

function entityLabel(id) {
  for (var i = 0; i < ENTITIES.length; i++) if (ENTITIES[i].id === id) return ENTITIES[i].label;
  return id;
}

function initStoryDemo() {
  var table = document.getElementById('imap');
  var beatsEl = document.getElementById('story-beats');
  var logEl = document.getElementById('event-log');
  var holdingEl = document.getElementById('holding');
  var progressEl = document.getElementById('story-progress');
  if (!table || !beatsEl) return;

  var state = { beat: 0, held: null, t: 0 };

  // Build the interaction map
  var head = '<thead><tr><th></th>' + PRIMITIVES.map(function(p) {
    return '<th><i class="fas ' + p.icon + '"></i><span>' + p.label + '</span></th>';
  }).join('') + '</tr></thead>';
  var body = '<tbody>' + ENTITIES.map(function(e) {
    return '<tr><th><i class="fas ' + e.icon + '"></i> ' + e.label + '</th>' + PRIMITIVES.map(function(p) {
      var c = e.cells[p.id];
      return c
        ? '<td><button class="imap-cell" data-entity="' + e.id + '" data-action="' + p.id + '" title="' + p.label + ' ' + e.label + '"><i class="fas ' + RESPONSE_ICON[c.type] + '"></i></button></td>'
        : '<td class="imap-empty">&ndash;</td>';
    }).join('') + '</tr>';
  }).join('') + '</tbody>';
  table.innerHTML = head + body;

  // Build the beats
  beatsEl.innerHTML = BEATS.map(function(b, i) {
    var p = PRIMITIVES.filter(function(x) { return x.id === b.action; })[0];
    return '<li class="story-beat" data-beat="' + i + '">' +
      '<div class="story-beat-head"><span class="story-beat-num">' + (i + 1) + '</span>' +
      '<span class="story-trigger"><i class="fas ' + p.icon + '"></i> ' + p.label + ' &rarr; ' + entityLabel(b.entity) + '</span>' +
      '<span class="story-status"></span></div>' +
      '<ul class="story-actions">' + b.actions.map(function(a) {
        return '<li><span class="act-type">' + a[0] + '</span><span class="act-text">' + a[1] + '</span></li>';
      }).join('') + '</ul></li>';
  }).join('');

  function stamp() {
    state.t += 1;
    return '00:' + (state.t < 10 ? '0' : '') + state.t;
  }

  function log(html, cls) {
    var row = document.createElement('div');
    row.className = 'log-row ' + (cls || '');
    row.innerHTML = html;
    logEl.appendChild(row);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function render() {
    beatsEl.querySelectorAll('.story-beat').forEach(function(li, i) {
      li.classList.toggle('done', i < state.beat);
      li.classList.toggle('active', i === state.beat);
      li.classList.toggle('locked', i > state.beat);
      li.querySelector('.story-status').textContent = i < state.beat ? 'fired' : i === state.beat ? 'active' : 'locked';
    });
    table.querySelectorAll('.imap-cell').forEach(function(btn) {
      var b = BEATS[state.beat];
      btn.classList.toggle('is-target', !!b && btn.dataset.entity === b.entity && btn.dataset.action === b.action);
    });
    holdingEl.innerHTML = '<i class="fas fa-hand-paper"></i> Holding: <strong>' + (state.held ? entityLabel(state.held) : 'nothing') + '</strong>';
    progressEl.textContent = state.beat + ' / ' + BEATS.length;
  }

  function playActions(i) {
    var items = beatsEl.querySelectorAll('.story-beat')[i].querySelectorAll('.story-actions li');
    items.forEach(function(li, k) {
      li.classList.remove('played');
      setTimeout(function() { li.classList.add('played'); }, 250 * (k + 1));
    });
  }

  function perform(entity, action) {
    var cell = ENTITIES.filter(function(e) { return e.id === entity; })[0].cells[action];
    var t = stamp();
    var text = cell.text;

    // Held-object bookkeeping for grab / release
    if (action === 'grab') state.held = entity;
    var releasedHeld = null;
    if (action === 'release') {
      if (!state.held) text = 'Nothing in hand to release';
      else { releasedHeld = state.held; if (entity !== state.held) text = entityLabel(state.held) + ' dropped beside the ' + entityLabel(entity).toLowerCase(); state.held = null; }
    }

    log('<span class="log-t">' + t + '</span><span class="log-tag tag-map">map</span>' +
        '<span class="pipe-mono">{"action": "' + action + '", "entity": "' + entity + '"}</span> &rarr; ' + text);

    // Second, parallel match against the active beat
    var b = BEATS[state.beat];
    if (b && b.entity === entity && b.action === action && (!b.needsHeld || releasedHeld === b.needsHeld)) {
      log('<span class="log-t">' + t + '</span><span class="log-tag tag-story">story</span>Beat ' + (state.beat + 1) + ' fired, dispatching ' + b.actions.length + ' Unity actions', 'log-fired');
      playActions(state.beat);
      state.beat += 1;
      if (state.beat === BEATS.length) log('<span class="log-t">' + t + '</span><span class="log-tag tag-done">done</span>Story line complete', 'log-fired');
    } else if (b) {
      var why = (b.entity === entity && b.action === action && b.needsHeld)
        ? 'needs ' + entityLabel(b.needsHeld).toLowerCase() + ' in hand'
        : 'active beat waits for ' + b.action + ' &rarr; ' + entityLabel(b.entity).toLowerCase();
      log('<span class="log-t">' + t + '</span><span class="log-tag tag-miss">story</span>No match, ' + why, 'log-miss');
    }
    render();
  }

  table.addEventListener('click', function(e) {
    var btn = e.target.closest('.imap-cell');
    if (btn) perform(btn.dataset.entity, btn.dataset.action);
  });

  document.getElementById('story-reset').addEventListener('click', function() {
    state = { beat: 0, held: null, t: 0 };
    logEl.innerHTML = '';
    beatsEl.querySelectorAll('.story-actions li').forEach(function(li) { li.classList.remove('played'); });
    log('<span class="log-hint">Waiting for input&hellip; try the pulsing cell, or any other one.</span>');
    render();
  });

  log('<span class="log-hint">Waiting for input&hellip; try the pulsing cell, or any other one.</span>');
  render();
}

// ─── Coherence vs spatial chart ──────────────────────────────
function initJudgeChart() {
  var el = document.getElementById('judge-chart');
  if (!el || typeof Chart === 'undefined') return;

  new Chart(el, {
    type: 'bar',
    data: {
      labels: PHASE1.map(function(r) { return r[0].split(' ')[0]; }),
      datasets: [
        { label: 'Coherence', data: PHASE1.map(function(r) { return r[5]; }), backgroundColor: '#16a34a', borderRadius: 3 },
        { label: 'Spatial',   data: PHASE1.map(function(r) { return r[6]; }), backgroundColor: '#0ea5e9', borderRadius: 3 }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 14 } },
        tooltip: {
          callbacks: {
            title: function(items) { return PHASE1[items[0].dataIndex][0]; },
            label: function(ctx) { return ctx.dataset.label + ': ' + ctx.parsed.y.toFixed(2); }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: { min: 0, max: 5, ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: '#f0f0f0' } }
      }
    }
  });
}

// ─── Sortable tables ──────────────────────────────────────────
function initSortableTables() {
  document.querySelectorAll('.sortable-table').forEach(function(table) {
    var headers = table.querySelectorAll('th.sortable');
    var sortState = { col: null, asc: true };

    headers.forEach(function(th) {
      th.addEventListener('click', function() {
        var colIdx = parseInt(this.dataset.col, 10);
        if (sortState.col === colIdx) { sortState.asc = !sortState.asc; }
        else { sortState.col = colIdx; sortState.asc = true; }

        var tbody = table.querySelector('tbody');
        var rows  = Array.from(tbody.querySelectorAll('tr'));

        rows.sort(function(a, b) {
          var aEl = a.querySelectorAll('td')[colIdx];
          var bEl = b.querySelectorAll('td')[colIdx];
          if (!aEl || !bEl) return 0;
          var aV = aEl.dataset.val !== undefined ? parseFloat(aEl.dataset.val) : aEl.textContent.trim().toLowerCase();
          var bV = bEl.dataset.val !== undefined ? parseFloat(bEl.dataset.val) : bEl.textContent.trim().toLowerCase();
          if (typeof aV === 'number' && typeof bV === 'number') {
            return sortState.asc ? aV - bV : bV - aV;
          }
          return sortState.asc ? String(aV).localeCompare(String(bV)) : String(bV).localeCompare(String(aV));
        });

        rows.forEach(function(r) { tbody.appendChild(r); });

        headers.forEach(function(h) {
          h.querySelector('.sort-icon').className = 'fas fa-sort sort-icon';
        });
        this.querySelector('.sort-icon').className =
          'fas fa-sort-' + (sortState.asc ? 'up' : 'down') + ' sort-icon';
      });
    });
  });
}

// ─── BibTeX copy button ───────────────────────────────────────
function initBibTexCopy() {
  var btn   = document.getElementById('bibtex-copy-btn');
  var label = document.getElementById('bibtex-copy-label');
  var icon  = document.getElementById('bibtex-copy-icon');
  var code  = document.getElementById('bibtex-code');
  if (!btn || !code) return;

  btn.addEventListener('click', function() {
    navigator.clipboard.writeText(code.textContent).then(function() {
      btn.classList.add('copied');
      icon.className = 'fas fa-check';
      label.textContent = 'Copied!';
      setTimeout(function() {
        btn.classList.remove('copied');
        icon.className = 'fas fa-copy';
        label.textContent = 'Copy';
      }, 2000);
    });
  });
}

// ─── Image modal ──────────────────────────────────────────────
function setupImageModal() {
  var modal = document.getElementById('image-modal');
  if (!modal) return;
  var modalImage = document.getElementById('modal-image');
  var closeBtns  = modal.querySelectorAll('.modal-background, .modal-close');

  $(document).on('click', '.figure-block img', function() {
    modalImage.src = this.src;
    modalImage.alt = this.alt || '';
    modal.classList.add('is-active');
  });

  closeBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      modal.classList.remove('is-active');
      modalImage.src = '';
    });
  });

  document.addEventListener('keyup', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('is-active')) {
      modal.classList.remove('is-active');
      modalImage.src = '';
    }
  });
}

// ─── Figure scroll-fade ───────────────────────────────────────
function initFigureAnimations() {
  var figs = document.querySelectorAll('.figure-block');
  if (!figs.length) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  figs.forEach(function(f) { observer.observe(f); });
}

// ─── Boot ─────────────────────────────────────────────────────
$(document).ready(function() {
  fillTable('phase1-body', PHASE1, PHASE1_DP);
  fillTable('phase2-body', PHASE2, PHASE2_DP);
  initPipelineAnimation();
  initStoryDemo();
  initJudgeChart();
  initSortableTables();
  initBibTexCopy();
  setupImageModal();
  initFigureAnimations();
});
