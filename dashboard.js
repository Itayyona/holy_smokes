/* ── Constants ── */
const CIGS_PER_PACK = 20;

const CURRENCIES = {
  USD: {
    symbol: '$', defaultPrice: 13,
    rewards: [
      { label: 'a coffee',       emoji: '☕',  price: 5    },
      { label: 'a movie ticket', emoji: '🎬',  price: 15   },
      { label: 'a nice dinner',  emoji: '🍽️', price: 50   },
      { label: 'new sneakers',   emoji: '👟',  price: 100  },
      { label: 'a weekend trip', emoji: '✈️', price: 500  },
      { label: 'a laptop',       emoji: '💻',  price: 1000 },
      { label: 'a new phone',    emoji: '📱',  price: 2000 },
    ],
  },
  EUR: {
    symbol: '€', defaultPrice: 8,
    rewards: [
      { label: 'a coffee',       emoji: '☕',  price: 4    },
      { label: 'a movie ticket', emoji: '🎬',  price: 12   },
      { label: 'a nice dinner',  emoji: '🍽️', price: 45   },
      { label: 'new sneakers',   emoji: '👟',  price: 90   },
      { label: 'a weekend trip', emoji: '✈️', price: 450  },
      { label: 'a laptop',       emoji: '💻',  price: 900  },
      { label: 'a new phone',    emoji: '📱',  price: 1800 },
    ],
  },
  ILS: {
    symbol: '₪', defaultPrice: 40,
    rewards: [
      { label: 'a coffee',       emoji: '☕',  price: 20   },
      { label: 'a movie ticket', emoji: '🎬',  price: 55   },
      { label: 'a nice dinner',  emoji: '🍽️', price: 200  },
      { label: 'new sneakers',   emoji: '👟',  price: 400  },
      { label: 'a weekend trip', emoji: '✈️', price: 2000 },
      { label: 'a laptop',       emoji: '💻',  price: 4000 },
      { label: 'a new phone',    emoji: '📱',  price: 8000 },
    ],
  },
};

/* ── Currency helpers ── */
function getCurrCode()   { return localStorage.getItem('qs_currency') || 'USD'; }
function getCurrData()   { return CURRENCIES[getCurrCode()] || CURRENCIES.USD; }
function getCurrSymbol() { return getCurrData().symbol; }
function getPackPrice() {
  const stored = parseFloat(localStorage.getItem('qs_pack_price'));
  return isNaN(stored) ? getCurrData().defaultPrice : stored;
}

const MILESTONES = [
  { id: 'm20m',  label: '20 minutes', ms: 20 * 60 * 1000,        icon: '❤️',  body: 'Blood pressure and heart rate drop to normal.' },
  { id: 'm12h',  label: '12 hours',   ms: 12 * 3600 * 1000,      icon: '🫁',  body: 'Carbon monoxide clears from your bloodstream.' },
  { id: 'm3d',   label: '3 days',     ms: 3 * 86400 * 1000,      icon: '👃',  body: 'Nicotine leaves your system. Smell and taste return.' },
  { id: 'm2w',   label: '2 weeks',    ms: 14 * 86400 * 1000,     icon: '🏃',  body: 'Circulation improves. Walking and exercise get easier.' },
  { id: 'm3mo',  label: '3 months',   ms: 90 * 86400 * 1000,     icon: '💪',  body: 'Lung function up by up to 30%. You can breathe again.' },
  { id: 'm1y',   label: '1 year',     ms: 365.25 * 86400 * 1000, icon: '🌟',  body: 'Heart disease risk is cut in half vs. a smoker.' },
];


const MOTIVATION_LINES = {
  health:      'Your body is repairing itself right now, every minute you wait this out.',
  money:       'Every craving you outlast is money staying in your pocket.',
  family:      'You started this for them. They need you around for longer.',
  smell_taste: 'Food already tastes better. This craving is just noise — wait it out.',
  control:     'You choose what happens next. Not nicotine. You.',
  pregnancy:   'There is someone who needs you healthy. This craving will pass.',
};

const HERO_LINES = [
  [0,         "Day 1 — the hardest one. You showed up."],
  [1,         "Still here. That already means something."],
  [3,         "Past the hardest days. The body is recovering for real."],
  [7,         "One week. The halo is brighter than yesterday."],
  [14,        "Two weeks. Nicotine has no claim on you anymore."],
  [30,        "A month. You changed your relationship with cigarettes."],
  [90,        "Three months. Lung function is up. You can breathe."],
  [365,       "One year. Holy smokes — you actually did it."],
];

const SLIP_MESSAGES = [
  "A slip is not a fall. You're still in this.",
  "One cigarette doesn't undo your progress. The halo is still there.",
  "Every person who has ever quit has stumbled. What matters is you keep going.",
  "You smoked one. You didn't give up. There's a difference.",
  "Reset the counter, keep the momentum.",
];

const TRIGGER_META = {
  stress:         { label: 'Stress',          emoji: '😤' },
  boredom:        { label: 'Boredom',         emoji: '😴' },
  after_meals:    { label: 'After Meals',      emoji: '🍽️' },
  coffee_alcohol: { label: 'Coffee/Alcohol',   emoji: '☕' },
  social:         { label: 'Social',           emoji: '👥' },
  driving:        { label: 'Driving',          emoji: '🚗' },
};

/* ── State ── */
let dbPlan         = null;
let statsTimer     = null;
let breathInterval = null;
let breathPhase    = 0;
let breathCount    = 4;
let dbResisted     = null;
let dbTrigger      = null;

/* ── Entry point ── */
function initDashboard() {
  const raw = localStorage.getItem('qs_plan');
  if (!raw) return;
  dbPlan = JSON.parse(raw);

  // If quitStarted wasn't set (user returning on quit date), set it now
  if (!dbPlan.quitStarted) {
    const qd    = new Date(dbPlan.quit_date + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (qd <= today) {
      dbPlan.quitStarted = qd.toISOString();
      localStorage.setItem('qs_plan', JSON.stringify(dbPlan));
    }
  }

  renderHero();
  renderTimeline();
  renderRewards();
  populateSOS();
  renderCravingChips();
  applyCurrencyUI();
  startStats();
}

/* ── Routing helper (used by app.js too) ── */
function showView(id) {
  document.querySelectorAll('.view').forEach(v => { v.hidden = true; });
  const el = document.getElementById(id);
  if (el) el.hidden = false;
}

function showDashboard() {
  showView('dashboard-view');
  initDashboard();
}

/* ── Streak helpers ── */
function getStreakStart() {
  const slips = JSON.parse(localStorage.getItem('qs_slips') || '[]');
  if (slips.length) return new Date(slips[slips.length - 1].timestamp);
  if (dbPlan.quitStarted) return new Date(dbPlan.quitStarted);
  return new Date(dbPlan.quit_date + 'T00:00:00');
}

function getOriginalQuit() {
  if (dbPlan.quitStarted) return new Date(dbPlan.quitStarted);
  return new Date(dbPlan.quit_date + 'T00:00:00');
}

function isPreQuit() {
  if (!dbPlan || !dbPlan.quit_date) return false;
  const qd    = new Date(dbPlan.quit_date + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return qd > today;
}

/* ── Live stats ── */
function startStats() {
  updateStats();
  if (statsTimer) clearInterval(statsTimer);
  statsTimer = setInterval(updateStats, 1000);
}

function updateStats() {
  const el = id => document.getElementById(id);

  if (isPreQuit()) {
    // Countdown to quit day
    const qd        = new Date(dbPlan.quit_date + 'T00:00:00');
    const remaining = qd.getTime() - Date.now();
    const cigsDay   = dbPlan.cigs_per_day || 10;

    if (el('statTime'))         el('statTime').textContent         = fmtElapsed(Math.max(0, remaining));
    if (el('statTimeLbl'))      el('statTimeLbl').textContent      = 'until quit day';
    if (el('statCigs'))         el('statCigs').textContent         = cigsDay;
    if (el('statCigsLbl'))      el('statCigsLbl').textContent      = 'cigs / day';
    if (el('statMoneyLblText')) el('statMoneyLblText').textContent = 'daily cost';
    const dailyCost = (cigsDay / CIGS_PER_PACK) * getPackPrice();
    if (el('statMoney')) el('statMoney').textContent = getCurrSymbol() + dailyCost.toFixed(2);

    // Automatically flip to smoke-free mode when quit date arrives
    if (remaining <= 0) {
      dbPlan.quitStarted = qd.toISOString();
      localStorage.setItem('qs_plan', JSON.stringify(dbPlan));
      renderHero();
    }
    return;
  }

  // Smoke-free mode
  const elapsedMs  = Date.now() - getStreakStart().getTime();
  const elapsedDay = elapsedMs / 86400000;
  const cigsDay    = dbPlan.cigs_per_day || 10;

  if (el('statTime'))         el('statTime').textContent         = fmtElapsed(elapsedMs);
  if (el('statTimeLbl'))      el('statTimeLbl').textContent      = 'smoke-free';
  if (el('statCigs'))         el('statCigs').textContent         = Math.floor(elapsedDay * cigsDay);
  if (el('statCigsLbl'))      el('statCigsLbl').textContent      = 'not smoked';
  if (el('statMoneyLblText')) el('statMoneyLblText').textContent = 'saved';
  if (el('statMoney'))        el('statMoney').textContent        = getCurrSymbol() + fmtMoney(elapsedDay, cigsDay);

  checkNewMilestones();
}

function fmtElapsed(ms) {
  const s   = Math.floor(ms / 1000);
  const min = Math.floor(s / 60) % 60;
  const hr  = Math.floor(s / 3600) % 24;
  const day = Math.floor(s / 86400);
  if (day > 0) return `${day}d ${hr}h ${min}m`;
  if (hr  > 0) return `${hr}h ${min}m ${s % 60}s`;
  return `${min}m ${s % 60}s`;
}

function fmtMoney(days, cigsDay) {
  const saved = (days * cigsDay / CIGS_PER_PACK) * getPackPrice();
  return saved >= 1000 ? (saved / 1000).toFixed(1) + 'k' : saved.toFixed(2);
}

/* ── Hero ── */
function renderHero() {
  const el = id => document.getElementById(id);

  if (isPreQuit()) {
    const qd       = new Date(dbPlan.quit_date + 'T00:00:00');
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((qd - today) / 86400000);
    if (el('dbHeroTitle')) el('dbHeroTitle').textContent = 'Day 0';
    if (el('dbHeroSub'))   el('dbHeroSub').textContent   =
      daysLeft === 1
        ? 'Tomorrow is the day. Remove cigarettes tonight.'
        : `Get ready — your journey begins in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`;
    setDbMascot('encouraging');
    return;
  }

  const ms   = Date.now() - getStreakStart().getTime();
  const days = ms / 86400000;

  let line = HERO_LINES[0][1];
  for (const [threshold, text] of HERO_LINES) {
    if (days >= threshold) line = text;
  }

  if (el('dbHeroTitle')) el('dbHeroTitle').textContent = fmtDayLabel(days);
  if (el('dbHeroSub'))   el('dbHeroSub').textContent   = line;

  const mood = days >= 14 ? 'celebratory' : days >= 3 ? 'encouraging' : 'neutral';
  setDbMascot(mood);
}

function fmtDayLabel(days) {
  if (days >= 365) return `Year ${Math.floor(days / 365)} 🌟`;
  if (days >= 90)  return `Month ${Math.floor(days / 30)}`;
  if (days >= 14)  return `Week ${Math.floor(days / 7)}`;
  if (days >= 2)   return `Day ${Math.floor(days)}`;
  return 'Day 1';
}

/* ── Dashboard mascot ── */
function setDbMascot(mood) {
  const wrap = document.getElementById('dbMascotWrap');
  if (!wrap) return;
  wrap.className = `mascot-wrap db-mascot-wrap ${mood}`;

  const svg = document.getElementById('dbMascotSvg');
  if (!svg) return;

  svg.querySelectorAll('.mascot-mouth').forEach(m => m.setAttribute('display', 'none'));
  const mouth = mood === 'celebratory' || mood === 'encouraging' ? '.mouth-big'
              : mood === 'comforting' ? '.mouth-soft'
              : '.mouth-smile';
  svg.querySelector(mouth)?.setAttribute('display', 'block');

  const halogp  = svg.querySelector('.halo-group');
  const smokegp = svg.querySelector('.smoke-group');
  const sparks  = svg.querySelector('.sparkles');
  if (halogp)  halogp.setAttribute('opacity',  mood === 'celebratory' ? '1' : mood === 'encouraging' ? '0.9' : mood === 'comforting' ? '0.42' : '0.72');
  if (smokegp) smokegp.setAttribute('opacity', mood === 'celebratory' ? '0.12' : mood === 'encouraging' ? '0.3' : mood === 'comforting' ? '0.85' : '0.65');
  if (sparks)  sparks.setAttribute('opacity',  mood === 'celebratory' ? '1' : '0');
}

/* ── Recovery Timeline ── */
function renderTimeline() {
  const container = document.getElementById('timeline');
  if (!container) return;

  const elapsed   = Date.now() - getOriginalQuit().getTime();
  const celebrated = JSON.parse(localStorage.getItem('qs_celebrated') || '[]');

  container.innerHTML = MILESTONES.map((m, i) => {
    const done = elapsed >= m.ms;
    const eta  = done ? '' : fmtRemaining(m.ms - elapsed);
    return `
      <div class="ms-row ${done ? 'ms-done' : 'ms-pending'}">
        <div class="ms-check">${done ? '✓' : ''}</div>
        <div class="ms-body">
          <div class="ms-label-row">
            <span class="ms-icon">${m.icon}</span>
            <span class="ms-label">${m.label}</span>
            ${eta ? `<span class="ms-eta">${eta}</span>` : ''}
          </div>
          <div class="ms-desc">${m.body}</div>
        </div>
      </div>`;
  }).join('');
}

function fmtRemaining(ms) {
  const min = Math.ceil(ms / 60000);
  const hr  = Math.ceil(ms / 3600000);
  const day = Math.ceil(ms / 86400000);
  const mo  = Math.ceil(ms / (30 * 86400000));
  const yr  = Math.ceil(ms / (365 * 86400000));
  if (yr  > 1) return `${yr}y away`;
  if (mo  > 1) return `${mo}mo away`;
  if (day > 1) return `${day}d away`;
  if (hr  > 1) return `${hr}h away`;
  return `${min}m away`;
}

function checkNewMilestones() {
  const elapsed    = Date.now() - getOriginalQuit().getTime();
  const celebrated = JSON.parse(localStorage.getItem('qs_celebrated') || '[]');
  let changed = false;

  MILESTONES.forEach((m, i) => {
    if (elapsed >= m.ms && !celebrated.includes(i)) {
      celebrated.push(i);
      changed = true;
      celebrateMilestone(m);
    }
  });

  if (changed) {
    localStorage.setItem('qs_celebrated', JSON.stringify(celebrated));
    renderTimeline();
  }
}

function celebrateMilestone(m) {
  setDbMascot('celebratory');
  showToast(`${m.icon} ${m.label} reached — ${m.body}`);
  setTimeout(() => renderHero(), 4000);
}

/* ── Currency menu ── */
function applyCurrencyUI() {
  const code = getCurrCode();
  const el   = id => document.getElementById(id);
  if (el('currCode'))     el('currCode').textContent     = code;
  if (el('currPriceSym')) el('currPriceSym').textContent = getCurrSymbol();
  if (el('packPriceInput')) el('packPriceInput').value   = getPackPrice();
  ['USD','EUR','ILS'].forEach(c => el('co' + c)?.classList.toggle('active', c === code));
}

function toggleCurrMenu(e) {
  e && e.stopPropagation();
  const menu = document.getElementById('currMenu');
  if (!menu) return;
  if (menu.hidden) {
    menu.hidden = false;
    applyCurrencyUI();
    setTimeout(() => document.addEventListener('click', dismissCurrMenu, { once: true }), 0);
  } else {
    menu.hidden = true;
  }
}

function dismissCurrMenu(e) {
  const menu = document.getElementById('currMenu');
  if (!menu || menu.hidden) return;
  if (menu.contains(e.target)) {
    setTimeout(() => document.addEventListener('click', dismissCurrMenu, { once: true }), 0);
  } else {
    menu.hidden = true;
  }
}

function selectCurrency(code) {
  localStorage.setItem('qs_currency', code);
  applyCurrencyUI();
  updateStats();
  renderRewards();
}

function savePackPrice(val) {
  const num = parseFloat(val);
  if (!isNaN(num) && num > 0) {
    localStorage.setItem('qs_pack_price', String(num));
    updateStats();
    renderRewards();
  }
}

/* ── Rewards ── */
function renderRewards() {
  const container = document.getElementById('rewardsArea');
  if (!container) return;

  const elapsed    = Date.now() - getStreakStart().getTime();
  const days       = elapsed / 86400000;
  const moneySaved = (days * (dbPlan.cigs_per_day || 10) / CIGS_PER_PACK) * getPackPrice();
  const rewards    = getCurrData().rewards;
  const sym        = getCurrSymbol();

  let currentIdx = -1;
  for (let i = rewards.length - 1; i >= 0; i--) {
    if (moneySaved >= rewards[i].price) { currentIdx = i; break; }
  }
  const nextIdx = currentIdx < rewards.length - 1 ? currentIdx + 1 : null;

  let html = '';

  if (currentIdx >= 0) {
    const r = rewards[currentIdx];
    html += `
      <div class="reward-current">
        <div class="reward-emoji">${r.emoji}</div>
        <div class="reward-info">
          <div class="reward-earned-lbl">you've earned</div>
          <div class="reward-name">${r.label}</div>
        </div>
        <div class="reward-amount">${sym}${moneySaved.toFixed(2)}</div>
      </div>`;
  } else {
    html += `
      <div class="reward-zero">
        <span class="reward-zero-lbl">${sym}${moneySaved.toFixed(2)} saved so far — keep going.</span>
      </div>`;
  }

  if (nextIdx !== null) {
    const r   = rewards[nextIdx];
    const pct = Math.min(100, (moneySaved / r.price) * 100);
    html += `
      <div class="reward-next">
        <div class="reward-next-row">
          <span class="reward-next-emoji">${r.emoji}</span>
          <span class="reward-next-name">Next: ${r.label}</span>
          <span class="reward-next-goal">${sym}${r.price}</span>
          <span class="reward-next-pct">${Math.round(pct)}%</span>
        </div>
        <div class="reward-bar"><div class="reward-fill" style="width:${pct}%"></div></div>
      </div>`;
  }

  container.innerHTML = html;
}

/* ── SOS Panel ── */
function populateSOS() {
  if (!dbPlan) return;
  const motivIds = dbPlan.motivations || [];
  const motivId  = motivIds[0] || 'health';
  const el = document.getElementById('sosMotiv');
  if (el) el.textContent = MOTIVATION_LINES[motivId] || MOTIVATION_LINES.health;
}

function renderCravingChips() {
  const container = document.getElementById('cravingChips');
  if (!container || !dbPlan) return;
  const triggers = dbPlan.triggers || [];
  container.innerHTML = triggers.map(id => {
    const t = TRIGGER_META[id] || { label: id, emoji: '•' };
    return `<button class="craving-chip" id="cc_${id}" onclick="selectTrigger('${id}')">${t.emoji} ${t.label}</button>`;
  }).join('');
}

function selectTrigger(id) {
  dbTrigger = id;
  document.querySelectorAll('.craving-chip').forEach(c => c.classList.remove('selected'));
  document.getElementById('cc_' + id)?.classList.add('selected');
  // Update motivational tip to this trigger
  const tips = (dbPlan.plan?.triggerTips || []);
  const tip  = tips.find(t => t.id === id);
  const el   = document.getElementById('sosMotiv');
  if (el && tip) el.textContent = tip.tip;
}

function setResisted(val) {
  dbResisted = val;
  document.getElementById('resistYes')?.classList.toggle('selected', val === true);
  document.getElementById('resistNo')?.classList.toggle('selected',  val === false);
}

function saveCraving() {
  const intensity = parseInt(document.getElementById('cravingIntensity')?.value || '3');
  const entry = {
    timestamp: new Date().toISOString(),
    trigger:   dbTrigger || 'unknown',
    intensity,
    resisted:  dbResisted ?? true,
  };
  const cravings = JSON.parse(localStorage.getItem('qs_cravings') || '[]');
  cravings.push(entry);
  localStorage.setItem('qs_cravings', JSON.stringify(cravings));

  // Reset form state
  dbResisted = null;
  dbTrigger  = null;
  document.querySelectorAll('.craving-chip').forEach(c => c.classList.remove('selected'));
  document.getElementById('resistYes')?.classList.remove('selected');
  document.getElementById('resistNo')?.classList.remove('selected');
  const slider = document.getElementById('cravingIntensity');
  if (slider) { slider.value = '3'; document.getElementById('intensityVal').textContent = '3'; }

  closeSOS();
  showToast(entry.resisted ? '✓ Craving logged — you resisted!' : 'Logged. Keep going. You got this.');
}

function openSOS() {
  const el = document.getElementById('sosOverlay');
  if (!el) return;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('open'));
  startBreathing();
}

function closeSOS() {
  const el = document.getElementById('sosOverlay');
  if (!el) return;
  el.classList.remove('open');
  setTimeout(() => { el.hidden = true; }, 320);
  stopBreathing();
}

/* ── Box Breathing ── */
const BREATH_PHASES = [
  { label: 'breathe in...',  scale: 1.0,  color: '#FF9050' },
  { label: 'hold...',        scale: 1.0,  color: '#FFD080' },
  { label: 'breathe out...', scale: 0.42, color: '#8B9CAD' },
  { label: 'hold...',        scale: 0.42, color: '#6A8090' },
];

function startBreathing() {
  breathPhase = 0;
  breathCount = 4;
  applyBreathPhase();
  clearInterval(breathInterval);
  breathInterval = setInterval(tickBreath, 1000);
}

function applyBreathPhase() {
  const p      = BREATH_PHASES[breathPhase];
  const circle = document.getElementById('breathCircle');
  const textEl = document.getElementById('breathText');
  const countEl= document.getElementById('breathCount');
  if (circle) {
    circle.style.transform  = `scale(${p.scale})`;
    circle.style.borderColor= p.color;
    circle.style.boxShadow  = `0 0 ${p.scale > 0.8 ? 44 : 14}px ${p.color}55, inset 0 0 20px ${p.color}22`;
  }
  if (textEl)  textEl.textContent  = p.label;
  if (countEl) countEl.textContent = breathCount;
  for (let i = 0; i < 4; i++) {
    document.getElementById('bpd' + i)?.classList.toggle('active', i === breathPhase);
  }
}

function tickBreath() {
  breathCount--;
  const countEl = document.getElementById('breathCount');
  if (breathCount > 0) {
    if (countEl) countEl.textContent = breathCount;
  } else {
    breathPhase = (breathPhase + 1) % 4;
    breathCount = 4;
    applyBreathPhase();
  }
}

function stopBreathing() {
  clearInterval(breathInterval);
  breathInterval = null;
}

/* ── Slip ── */
function openSlip() {
  const el = document.getElementById('slipOverlay');
  if (!el) return;
  const slips = JSON.parse(localStorage.getItem('qs_slips') || '[]');
  const msgEl = document.getElementById('slipMsg');
  if (msgEl) msgEl.textContent = SLIP_MESSAGES[slips.length % SLIP_MESSAGES.length];

  // Show their coping tips
  const tips   = dbPlan?.plan?.triggerTips || [];
  const tipsEl = document.getElementById('slipTips');
  if (tipsEl) {
    tipsEl.innerHTML = tips.slice(0, 2).map(t =>
      `<div class="slip-tip"><strong>${t.emoji} ${t.label}:</strong> ${t.tip}</div>`
    ).join('');
  }

  setDbMascot('comforting');
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('open'));
}

function closeSlip() {
  const el = document.getElementById('slipOverlay');
  if (!el) return;
  el.classList.remove('open');
  setTimeout(() => { el.hidden = true; }, 320);
  renderHero();
}

function confirmSlip() {
  const slips = JSON.parse(localStorage.getItem('qs_slips') || '[]');
  slips.push({ timestamp: new Date().toISOString() });
  localStorage.setItem('qs_slips', JSON.stringify(slips));
  closeSlip();
  renderTimeline();
  renderRewards();
  showToast('Streak reset. The journey continues. 💙');
}

/* ── Toast ── */
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('dbToast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 4000);
}

/* ── Reset ── */
function resetApp() {
  if (!confirm('This will clear your quit plan and all tracked progress. Start over?')) return;
  ['qs_plan', 'qs_slips', 'qs_cravings', 'qs_celebrated'].forEach(k => localStorage.removeItem(k));
  window.location.reload();
}

/* ── Boot: route to dashboard whenever a saved plan exists ── */
(function checkAndRoute() {
  const raw = localStorage.getItem('qs_plan');
  if (!raw) return;
  try {
    const plan = JSON.parse(raw);
    if (plan.quit_date) {
      showView('dashboard-view');
      setTimeout(initDashboard, 0);
    }
  } catch (_) {}
})();
