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

// ─── Reflection thread cards ─────────────────────────────────
var THREAD_INFO = {
  BOUND: {
    title: '#1 Bound',
    desc: 'Clamps placements to the room\'s [x<sub>min</sub>, x<sub>max</sub>] &times; [z<sub>min</sub>, z<sub>max</sub>] envelope and re-verifies them under the VLM.'
  },
  COLLISION: {
    title: '#2 Collision',
    desc: 'Runs Axis-Aligned Bounding Box (AABB) pair tests for geometric overlap, plus a VLM recheck on three orthogonal screenshots (xy, xz, yz).'
  },
  PHYSICS: {
    title: '#3 Physics',
    desc: 'Flags floating or unsupported objects whose vertical position is inconsistent with any plausible parent surface beneath them. Runs deterministically.'
  },
  SEMANTIC: {
    title: '#4 Semantic',
    desc: 'Verifies support and containment relationships (e.g., small props rest on parent surfaces with y &ge; 0.7) using both height tests and a VLM coherence judgment over the same screenshots.'
  },
  CHARACTERS: {
    title: '#5 Characters',
    desc: 'Ensures every human role parsed from the experience description is present in the scene, adding any characters that earlier passes dropped. Runs deterministically.'
  }
};

function initThreadCards() {
  var states = document.querySelectorAll('.fsm-state');
  var panel  = document.getElementById('fsm-info-panel');
  if (!states.length || !panel) return;

  states.forEach(function(el) {
    function activate() {
      states.forEach(function(s) { s.classList.remove('active'); });
      el.classList.add('active');
      var info = THREAD_INFO[el.dataset.state];
      panel.className = 'fsm-info-panel thread-panel thread-' + el.dataset.state.toLowerCase();
      panel.innerHTML =
        '<div class="fsm-info-content">' +
          '<h4>' + info.title + '</h4>' +
          '<p>' + info.desc + '</p>' +
        '</div>';
    }
    el.addEventListener('click', activate);
    el.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') activate();
    });
  });
}

// ─── Story-chain demo ────────────────────────────────────────
var BEAT_RESPONSES = [
  'Doctor: &ldquo;We need the supply trolley over here.&rdquo; The trolley is highlighted.',
  'The supply trolley attaches to the user\'s hand. The surgeon turns and waits.',
  'Trolley delivered. Surgeon: &ldquo;Thank you &mdash; we\'re ready to begin.&rdquo; Story complete.'
];

function initBeatChain() {
  var beats = document.querySelectorAll('#beat-chain .beat');
  var log   = document.getElementById('beat-log');
  if (!beats.length || !log) return;

  function reset() {
    beats.forEach(function(b, i) {
      b.classList.remove('done');
      b.disabled = i !== 0;
    });
    beats[0].classList.add('current');
  }

  beats.forEach(function(b, i) {
    b.addEventListener('click', function() {
      if (b.classList.contains('done')) return;
      b.classList.remove('current');
      b.classList.add('done');
      b.disabled = true;
      var html = '<div class="fsm-info-content"><h4>Beat ' + (i + 1) + ' fired</h4><p>' + BEAT_RESPONSES[i] + '</p>';
      if (i + 1 < beats.length) {
        beats[i + 1].disabled = false;
        beats[i + 1].classList.add('current');
      } else {
        html += '<p><a href="#" id="beat-reset">Replay</a></p>';
      }
      log.classList.add('beat-fired');
      log.innerHTML = html + '</div>';
      var r = document.getElementById('beat-reset');
      if (r) r.addEventListener('click', function(e) {
        e.preventDefault();
        reset();
        log.classList.remove('beat-fired');
        log.innerHTML = '<p class="fsm-hint"><i class="fas fa-info-circle"></i> Fire beat 1 to start the story</p>';
      });
    });
  });
  reset();
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
  initThreadCards();
  initBeatChain();
  initJudgeChart();
  initSortableTables();
  initBibTexCopy();
  setupImageModal();
  initFigureAnimations();
});
