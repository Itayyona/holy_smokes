/* ── Data ── */
const TRIGGERS = [
  { id: 'stress',       label: 'Stress',           emoji: '😤',
    tip: 'Try the 4-7-8 breath: inhale 4 sec, hold 7, exhale 8. It activates your parasympathetic nervous system almost instantly — cravings can\'t compete.' },
  { id: 'boredom',      label: 'Boredom',           emoji: '😴',
    tip: 'Keep hands busy: carry a stress ball, toothpick, or cinnamon gum. Boredom cravings peak at 3–5 min then fade — your only job is to outlast them.' },
  { id: 'after_meals',  label: 'After Meals',       emoji: '🍽️',
    tip: 'Stand up immediately after eating and take a 5-minute walk, or go brush your teeth. The physical break replaces the post-meal cigarette routine.' },
  { id: 'coffee_alcohol', label: 'Coffee / Alcohol', emoji: '☕',
    tip: 'Switch to tea or water during early days if you can — both substances lower quit resistance. Alcohol in particular is a top relapse trigger; a brief pause helps a lot.' },
  { id: 'social',       label: 'Social Situations', emoji: '👥',
    tip: 'Prepare a simple line: "I\'m done smoking." Said flat and confident, most people drop it. Briefly stepping outside smoking groups for the first month is okay — it\'s temporary.' },
  { id: 'driving',      label: 'Driving',           emoji: '🚗',
    tip: 'Stock your car with sunflower seeds or gum right now, and queue up a podcast or playlist you only listen to while driving. New associations dissolve old ones.' },
];

const MOTIVATIONS = [
  { id: 'health',      label: 'Health',                emoji: '❤️' },
  { id: 'money',       label: 'Money',                 emoji: '💰' },
  { id: 'family',      label: 'Family',                emoji: '👨‍👩‍👧' },
  { id: 'smell_taste', label: 'Smell & Taste',         emoji: '👃' },
  { id: 'control',     label: 'Control Over the Habit', emoji: '💪' },
  { id: 'pregnancy',   label: 'Pregnancy / Future Kids', emoji: '🌱' },
];

const METHODS = [
  { id: 'cold_turkey', label: 'Cold Turkey',           emoji: '🦃',
    desc: 'Stop completely on quit day. Harder short-term, but often fastest overall.' },
  { id: 'gradual',     label: 'Gradual Reduction',     emoji: '📉',
    desc: 'Cut down cigarettes over 1–2 weeks before your quit date.' },
  { id: 'nrt',         label: 'Nicotine Replacement',  emoji: '🩹',
    desc: 'Use patches, gum, or lozenges to ease withdrawal symptoms.' },
];

const STEP_SPEECHES = [
  "Let's build your plan. Be honest — I don't judge.",
  "Every year behind you is a year your body wants back.",
  "Knowing your triggers is half the battle.",
  "All methods work. The best one is the one you believe in.",
  "Your 'why' is the halo. Keep it bright.",
  "Almost there — last question!",
  "Here's your plan. The halo's ready to shine. 🔥",
];

const CATCHPHRASES = [
  "sometimes it's ok to quit",
  "your lungs called. they want a divorce.",
  "ash to ash, but you don't have to be",
  "quitting: the only addiction worth having",
  "holy smokes, you're still here",
  "breaking up with your ex (cigarettes)",
  "every cigarette you don't smoke is a tiny act of rebellion",
  "plot twist: the smoke becomes the halo",
  "sponsored by your lungs (finally)",
  "nicotine: great marketer, terrible friend",
  "smell ya later, cigarettes",
  "you're not quitting. you're firing your dealer.",
  "your future self will say thanks. your past self will cope.",
  "turns out you don't need a smoke break. you need a break.",
  "breathe in. for reasons other than spite.",
  "one less cigarette is a whole second of living",
  "the pack you're not buying is already paying for something better",
  "you've been sponsored by Big Tobacco long enough",
];

const TOTAL_WIZARD_STEPS = 7;

/* ── State ── */
let currentStep = 0;
let answers = {};
let direction = 'forward';

/* ── Step helpers ── */
const steps = [
  { id: 'cigs_per_day',    type: 'number',       mascot: 'neutral',     min: 1,  max: 100 },
  { id: 'years_smoking',   type: 'number',       mascot: 'neutral',     min: 0,  max: 70  },
  { id: 'triggers',        type: 'multiselect',  mascot: 'thinking',    options: TRIGGERS    },
  { id: 'method',          type: 'singleselect', mascot: 'encouraging', options: METHODS     },
  { id: 'motivations',     type: 'multiselect',  mascot: 'encouraging', options: MOTIVATIONS },
  { id: 'support_person',  type: 'yesno',        mascot: 'curious'                          },
  { id: 'plan',            type: 'plan',         mascot: 'celebratory'                      },
];

/* ── Mascot ── */
function setMascot(mood, speech) {
  const wrap = document.getElementById('mascot');
  wrap.className = 'mascot-wrap ' + mood;
  const bubble = document.getElementById('mascotSpeech');
  bubble.textContent = speech || STEP_SPEECHES[currentStep] || '';

  const svg = document.getElementById('mascotSvg');

  // Mouth swap
  svg.querySelectorAll('.mascot-mouth').forEach(m => m.setAttribute('display', 'none'));
  if (mood === 'celebratory' || mood === 'encouraging') {
    svg.querySelector('.mouth-big').setAttribute('display', 'block');
  } else if (mood === 'comforting') {
    svg.querySelector('.mouth-soft').setAttribute('display', 'block');
  } else {
    svg.querySelector('.mouth-smile').setAttribute('display', 'block');
  }

  // Eyebrows — express mood
  const browL = svg.querySelector('.brow-l');
  const browR = svg.querySelector('.brow-r');
  if (mood === 'thinking') {
    browL.setAttribute('d', 'M38 99 Q43 96.5 48 99');
    browR.setAttribute('d', 'M52 100 Q57 98.5 62 101'); // slight asymmetry
  } else if (mood === 'curious') {
    browL.setAttribute('d', 'M38 100 Q43 97 48 100');
    browR.setAttribute('d', 'M52 99 Q57 97 62 100');
  } else if (mood === 'celebratory' || mood === 'encouraging') {
    browL.setAttribute('d', 'M38 101 Q43 99 48 101');
    browR.setAttribute('d', 'M52 101 Q57 99 62 101');
  } else if (mood === 'comforting') {
    browL.setAttribute('d', 'M38 101 Q43 100 48 102');
    browR.setAttribute('d', 'M52 102 Q57 100 62 101');
  } else {
    browL.setAttribute('d', 'M38 100 Q43 97.5 48 100');
    browR.setAttribute('d', 'M52 100 Q57 97.5 62 100');
  }

  // Halo brightness (control the whole smoke-ring group as one unit)
  const haloGroup = svg.querySelector('.halo-group');
  const smokeGrp  = svg.querySelector('.smoke-group');
  const sparkles  = svg.querySelector('.sparkles');

  if (mood === 'celebratory') {
    haloGroup.setAttribute('opacity', '1');
    smokeGrp.setAttribute('opacity', '0.12');
    sparkles.setAttribute('opacity', '0'); // CSS class drives sparkle animation
  } else if (mood === 'encouraging') {
    haloGroup.setAttribute('opacity', '0.9');
    smokeGrp.setAttribute('opacity', '0.32');
    sparkles.setAttribute('opacity', '0');
  } else if (mood === 'comforting') {
    haloGroup.setAttribute('opacity', '0.42');
    smokeGrp.setAttribute('opacity', '0.88');
    sparkles.setAttribute('opacity', '0');
  } else {
    haloGroup.setAttribute('opacity', '0.72');
    smokeGrp.setAttribute('opacity', '0.65');
    sparkles.setAttribute('opacity', '0');
  }
}

/* ── Step dots (cigarette stubs) ── */
function renderDots() {
  const container = document.getElementById('stepDots');
  const count = TOTAL_WIZARD_STEPS - 1; // exclude plan screen from dots
  let html = '';
  for (let i = 0; i < count; i++) {
    if (i < currentStep)      html += `<div class="cig-dot done"   title="Step ${i+1} complete"></div>`;
    else if (i === currentStep) html += `<div class="cig-dot active" title="Current step"></div>`;
    else                       html += `<div class="cig-dot"         title="Step ${i+1}"></div>`;
  }
  container.innerHTML = html;
}

/* ── Renderers ── */
function renderNumber(step) {
  const val = answers[step.id] ?? '';
  const hints = {
    cigs_per_day:  v => v < 5 ? 'Light smoker — great starting point 👍' : v < 15 ? 'Moderate smoker — very manageable' : v < 25 ? 'Heavy smoker — withdrawal may be stronger, we\'ll prepare you' : 'Very heavy smoker — we\'ll flag this in your plan',
    years_smoking: v => v <= 1 ? 'Not long — your body will bounce back fast! ⚡' : v <= 5 ? 'A few years — lungs start recovering within weeks' : v <= 15 ? 'A good stretch — your reasons to quit are real and powerful' : 'Long road — and you\'re still here deciding to change. Respect. 🙏',
  };
  const hint = val !== '' ? (hints[step.id]?.(Number(val)) ?? '') : '';
  const labels = { cigs_per_day: 'cigarettes / day', years_smoking: 'years' };
  const questions = { cigs_per_day: 'How many cigarettes do you smoke per day?', years_smoking: 'How many years have you been smoking?' };
  const subs = { cigs_per_day: 'Be honest — this helps us tailor withdrawal prep.', years_smoking: 'Even a short history matters. Every quit counts.' };

  return `
    <h2 class="step-q">${questions[step.id]}</h2>
    <p class="step-sub">${subs[step.id]}</p>
    <div class="num-wrap">
      <div class="num-stepper">
        <button type="button" onclick="adjustNum('${step.id}', -1, ${step.min}, ${step.max})">−</button>
        <input class="num-input" id="ni_${step.id}" type="number" min="${step.min}" max="${step.max}"
          value="${val}" placeholder="0"
          oninput="onNumInput('${step.id}', ${step.min}, ${step.max})">
        <button type="button" onclick="adjustNum('${step.id}', 1, ${step.min}, ${step.max})">+</button>
      </div>
      <span class="num-unit">${labels[step.id]}</span>
    </div>
    <div class="num-context" id="numContext">${hint}</div>
    <div class="validation-hint" id="vHint"></div>
  `;
}

function renderMultiSelect(step) {
  const selected = answers[step.id] || [];
  const isMotiv = step.id === 'motivations';
  const questions = { triggers: 'What are your main smoking triggers?', motivations: 'What\'s driving you to quit?' };
  const subs = { triggers: 'Select all that apply — we\'ll give you a coping strategy for each.', motivations: 'Your "why" is your armor when cravings hit. Pick all that resonate.' };

  const chips = step.options.map(opt => `
    <button class="chip${selected.includes(opt.id) ? ' selected' : ''}"
      type="button" onclick="toggleChip('${step.id}', '${opt.id}', ${isMotiv})">
      <span class="chip-emoji">${opt.emoji}</span>
      <span>${opt.label}</span>
      <span class="chip-check"></span>
    </button>
  `).join('');

  return `
    <h2 class="step-q">${questions[step.id]}</h2>
    <p class="step-sub">${subs[step.id]}</p>
    <div class="chip-grid">${chips}</div>
    <div class="validation-hint" id="vHint"></div>
  `;
}

function renderSingleSelect(step) {
  const selected = answers[step.id] || '';
  const cards = step.options.map(opt => `
    <button class="method-card${selected === opt.id ? ' selected' : ''}"
      type="button" onclick="selectMethod('${opt.id}')">
      <span class="method-emoji">${opt.emoji}</span>
      <span class="method-text">
        <div class="method-label">${opt.label}</div>
        <div class="method-desc">${opt.desc}</div>
      </span>
      <span class="method-radio"></span>
    </button>
  `).join('');

  return `
    <h2 class="step-q">How do you want to quit?</h2>
    <p class="step-sub">All three methods work — the best one is the one you'll commit to.</p>
    <div class="method-grid">${cards}</div>
    <div class="validation-hint" id="vHint"></div>
  `;
}

function renderYesNo() {
  const sel = answers.support_person;
  return `
    <h2 class="step-q">Have you told someone you're quitting?</h2>
    <p class="step-sub">Social accountability measurably improves quit success — even telling one person helps.</p>
    <div class="yesno-wrap">
      <button class="yesno-btn yes${sel === true ? ' selected' : ''}" type="button" onclick="setYesNo(true)">
        <span class="yn-emoji">🙋</span>Yes, I have
      </button>
      <button class="yesno-btn no${sel === false ? ' selected' : ''}" type="button" onclick="setYesNo(false)">
        <span class="yn-emoji">🤐</span>Not yet
      </button>
    </div>
    <div class="validation-hint" id="vHint"></div>
  `;
}

function renderPlan() {
  const plan = generatePlan();
  const today = new Date();

  const dateOptions = [
    { label: 'Today', sub: fmt(today, 0),   offset: 0  },
    { label: 'Tomorrow', sub: fmt(today, 1), offset: 1  },
    { label: '+3 Days', sub: fmt(today, 3),  offset: 3  },
    { label: '+1 Week', sub: fmt(today, 7),  offset: 7  },
    { label: '+2 Weeks', sub: fmt(today, 14), offset: 14 },
  ];

  const selOffset = answers.quit_offset ?? 0;

  const dateBtns = dateOptions.map(d => `
    <button class="date-btn${selOffset === d.offset ? ' selected' : ''}"
      type="button" onclick="selectDateOffset(${d.offset})">
      ${d.label}<small>${d.sub}</small>
    </button>
  `).join('');

  let warningHtml = '';
  if (plan.warning) {
    warningHtml = `
      <div class="plan-section">
        <div class="plan-label">⚠️ Heads Up</div>
        <div class="plan-warning">${plan.warning}</div>
      </div>
      <div class="plan-divider"></div>
    `;
  }

  let triggerHtml = '';
  if (plan.triggerTips.length) {
    const cards = plan.triggerTips.map(t => `
      <div class="plan-tip-card">
        <div class="plan-tip-trigger">${t.emoji} ${t.label}</div>
        <div class="plan-tip-body">${t.tip}</div>
      </div>
    `).join('');
    triggerHtml = `
      <div class="plan-section">
        <div class="plan-label">💡 Your Trigger Strategies</div>
        ${cards}
      </div>
      <div class="plan-divider"></div>
    `;
  }

  let supportHtml = '';
  if (plan.supportSuggestion) {
    supportHtml = `
      <div class="plan-section">
        <div class="plan-label">👥 One Small Ask</div>
        <div class="plan-support">${plan.supportSuggestion}</div>
      </div>
      <div class="plan-divider"></div>
    `;
  }

  let motivHtml = '';
  if (plan.motivations.length) {
    const pills = plan.motivations.map(m => `<span class="plan-motiv-pill">${m.emoji} ${m.label}</span>`).join('');
    motivHtml = `
      <div class="plan-section">
        <div class="plan-label">⭐ Your Why</div>
        <div class="plan-motiv">${pills}</div>
      </div>
      <div class="plan-divider"></div>
    `;
  }

  return `
    <h2 class="step-q">Your Personalized Plan</h2>
    <p class="step-sub">Built from everything you just shared. Scroll to read, then pick your quit date.</p>
    <div class="plan-scroll">
      ${warningHtml}${triggerHtml}${supportHtml}${motivHtml}
      <div class="plan-section">
        <div class="plan-label">📅 Set Your Quit Date</div>
        <div class="date-grid">${dateBtns}</div>
        <div class="date-custom-wrap">
          <div class="date-custom-label">Or pick a specific date (max 2 weeks out):</div>
          <input class="date-custom-input" type="date" id="customDate"
            min="${isoDate(0)}" max="${isoDate(14)}"
            onchange="selectCustomDate(this.value)">
        </div>
      </div>
    </div>
    <div class="validation-hint" id="vHint"></div>
  `;
}

/* ── Plan generation ── */
function generatePlan() {
  const cigs  = Number(answers.cigs_per_day  || 0);
  const years = Number(answers.years_smoking || 0);
  const triggers   = answers.triggers    || [];
  const motivIds   = answers.motivations || [];
  const method     = answers.method || 'cold_turkey';
  const hasSupport = answers.support_person;

  const plan = { warning: '', triggerTips: [], supportSuggestion: '', motivations: [] };

  if (cigs > 20 || (cigs > 15 && years > 10)) {
    const nrtNote = method === 'cold_turkey'
      ? ' Even if you chose cold turkey, having NRT (patches or gum) as a <em>backup</em> in the drawer isn\'t a failure — it\'s being smart.'
      : '';
    plan.warning = `With <strong>${cigs} cigs/day${years > 5 ? ` over ${years} years` : ''}</strong>, nicotine dependence is significant. Days 2–4 after quitting are typically the most intense — prepare by clearing your schedule if possible, drinking extra water, and having healthy snacks ready.${nrtNote}`;
  }

  plan.triggerTips = triggers.map(id => TRIGGERS.find(t => t.id === id)).filter(Boolean);

  if (!hasSupport) {
    plan.supportSuggestion = `<strong>Research consistently shows that telling even one person you\'re quitting increases your success rate.</strong> You don\'t need a cheerleader — just someone who knows. Consider sending a quick text today. It takes 30 seconds and it works.`;
  }

  plan.motivations = motivIds.map(id => MOTIVATIONS.find(m => m.id === id)).filter(Boolean);

  return plan;
}

/* ── Input handlers ── */
function adjustNum(id, delta, min, max) {
  const input = document.getElementById('ni_' + id);
  const cur = Number(input.value) || 0;
  const next = Math.min(max, Math.max(min, cur + delta));
  input.value = next;
  answers[id] = next;
  updateNumContext(id, next);
}

function onNumInput(id, min, max) {
  const input = document.getElementById('ni_' + id);
  let v = Number(input.value);
  if (isNaN(v)) return;
  v = Math.min(max, Math.max(min, v));
  answers[id] = v;
  updateNumContext(id, v);
}

function updateNumContext(id, v) {
  const ctx = document.getElementById('numContext');
  if (!ctx) return;
  const hints = {
    cigs_per_day:  n => n < 5 ? 'Light smoker — great starting point 👍' : n < 15 ? 'Moderate smoker — very manageable' : n < 25 ? 'Heavy smoker — withdrawal may be stronger, we\'ll prepare you' : 'Very heavy smoker — we\'ll flag this in your plan ⚠️',
    years_smoking: n => n <= 1 ? 'Not long — your body bounces back fast! ⚡' : n <= 5 ? 'A few years — lungs recover noticeably within weeks' : n <= 15 ? 'A good stretch — your reasons to quit are real and powerful' : 'A long road — and you\'re here. That takes guts. 🙏',
  };
  ctx.textContent = hints[id]?.(v) ?? '';
}

function toggleChip(stepId, optId, isMotiv) {
  const arr = answers[stepId] || [];
  const idx = arr.indexOf(optId);
  if (idx === -1) arr.push(optId); else arr.splice(idx, 1);
  answers[stepId] = arr;
  const btn = document.querySelector(`.chip[onclick*="'${optId}'"]`);
  if (btn) btn.classList.toggle('selected', arr.includes(optId));
  clearHint();
}

function selectMethod(id) {
  answers.method = id;
  document.querySelectorAll('.method-card').forEach(c => c.classList.remove('selected'));
  document.querySelector(`.method-card[onclick*="'${id}'"]`)?.classList.add('selected');
  clearHint();
}

function setYesNo(val) {
  answers.support_person = val;
  document.querySelectorAll('.yesno-btn').forEach(b => b.classList.remove('selected'));
  const btn = document.querySelector('.yesno-btn.' + (val ? 'yes' : 'no'));
  if (btn) btn.classList.add('selected');
  clearHint();
}

function selectDateOffset(offset) {
  answers.quit_offset = offset;
  answers.quit_date   = isoDate(offset);
  document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('selected'));
  const btn = document.querySelector(`.date-btn[onclick*="${offset})"]`);
  if (btn) btn.classList.add('selected');
  const custom = document.getElementById('customDate');
  if (custom) custom.value = '';
  clearHint();
}

function selectCustomDate(val) {
  if (!val) return;
  const chosen  = new Date(val + 'T00:00:00');
  const today   = new Date(); today.setHours(0,0,0,0);
  const maxDate = new Date(today); maxDate.setDate(today.getDate() + 14);
  if (chosen < today || chosen > maxDate) {
    showHint('Please choose a date within the next 2 weeks.');
    return;
  }
  answers.quit_date   = val;
  answers.quit_offset = null;
  document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('selected'));
  clearHint();
}

/* ── Validation ── */
function validate() {
  const step = steps[currentStep];
  if (step.type === 'number') {
    const v = answers[step.id];
    if (v === undefined || v === null || v === '') { showHint('Please enter a value.'); return false; }
    if (Number(v) < step.min) { showHint(`Minimum is ${step.min}.`); return false; }
    return true;
  }
  if (step.type === 'multiselect') {
    const arr = answers[step.id] || [];
    if (arr.length === 0) { showHint('Please select at least one option.'); return false; }
    return true;
  }
  if (step.type === 'singleselect') {
    if (!answers[step.id]) { showHint('Please choose one option.'); return false; }
    return true;
  }
  if (step.type === 'yesno') {
    if (answers.support_person === undefined) { showHint('Please choose yes or no.'); return false; }
    return true;
  }
  if (step.type === 'plan') {
    if (!answers.quit_date) { showHint('Please choose your quit date to continue.'); return false; }
    return true;
  }
  return true;
}

function showHint(msg) {
  const el = document.getElementById('vHint');
  if (el) el.textContent = msg;
}
function clearHint() {
  const el = document.getElementById('vHint');
  if (el) el.textContent = '';
}

/* ── Navigation ── */
function nextStep() {
  if (!validate()) return;
  if (currentStep >= steps.length - 1) {
    completeWizard();
    return;
  }
  direction = 'forward';
  currentStep++;
  render();
}

function prevStep() {
  if (currentStep <= 0) return;
  direction = 'back';
  currentStep--;
  render();
}

/* ── Main render ── */
function render() {
  renderDots();
  const step = steps[currentStep];
  setMascot(step.mascot);

  // Buttons
  const back = document.getElementById('btnBack');
  const next = document.getElementById('btnNext');
  back.disabled = currentStep === 0;
  if (step.type === 'plan') {
    next.textContent = 'Start My Journey 🔥';
    next.className = 'btn-next start';
  } else {
    next.textContent = currentStep === steps.length - 2 ? 'See My Plan →' : 'Continue →';
    next.className = 'btn-next';
  }

  // Build card HTML
  let content = '';
  switch (step.type) {
    case 'number':       content = renderNumber(step);    break;
    case 'multiselect':  content = renderMultiSelect(step); break;
    case 'singleselect': content = renderSingleSelect(step); break;
    case 'yesno':        content = renderYesNo();         break;
    case 'plan':         content = renderPlan();          break;
  }

  // Animate
  const stage = document.getElementById('stepStage');
  const existing = stage.querySelector('.step-card');

  if (!existing) {
    stage.innerHTML = `<div class="step-card slide-in-right">${content}</div>`;
  } else {
    const outClass   = direction === 'forward' ? 'slide-out-left'  : 'slide-out-right';
    const inClass    = direction === 'forward' ? 'slide-in-right'  : 'slide-in-left';
    existing.classList.add(outClass);
    existing.addEventListener('animationend', () => {
      stage.innerHTML = `<div class="step-card ${inClass}">${content}</div>`;
    }, { once: true });
  }
}

/* ── Complete wizard ── */
function completeWizard() {
  const quitDate = new Date(answers.quit_date + 'T00:00:00');
  const today    = new Date(); today.setHours(0,0,0,0);
  const isToday  = quitDate.getTime() === today.getTime();

  const plan = generatePlan();

  localStorage.setItem('qs_plan', JSON.stringify({
    ...answers,
    plan,
    createdAt: new Date().toISOString(),
    quitStarted: isToday ? new Date().toISOString() : null,
  }));

  // Route to dashboard immediately if quit starts today
  if (isToday) {
    setMascot('celebratory', 'Halo at full brightness. Let\'s go. ✨');
    setTimeout(() => {
      if (typeof showDashboard === 'function') showDashboard();
    }, 600);
    return;
  }

  // Update mascot
  setMascot('celebratory', 'Halo at full brightness. Let\'s go. ✨');

  const stage    = document.getElementById('stepStage');
  const existing = stage.querySelector('.step-card');
  const outClass = 'slide-out-left';

  const quitLabel = isToday
    ? 'Today — right now! 🚀'
    : quitDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const daysNote = isToday
    ? 'Your streak starts <strong>now</strong>. The dashboard is coming soon — you\'re all set!'
    : `Your quit day is in <strong>${Math.round((quitDate - today) / 86400000)} day(s)</strong>. Use that time to prepare — remove cigarettes from your home on the night before.`;

  const completeHtml = `
    <div class="complete-wrap">
      <div class="complete-emoji">🎯</div>
      <h2 class="complete-title">Plan Saved!</h2>
      <p class="complete-body">Your personalized quit plan is ready.<br>${daysNote}</p>
      <div class="complete-date-badge">📅 ${quitLabel}</div>
      <div class="complete-date-label">Your quit date</div>
      <p class="complete-body" style="font-size:0.85rem">
        Your triggers, coping strategies, and motivation are all saved.<br>
        The full Holy Smokes dashboard (streak timer, SOS button, craving log) is coming next.
      </p>
    </div>
  `;

  if (existing) {
    existing.classList.add(outClass);
    existing.addEventListener('animationend', () => {
      stage.innerHTML = `<div class="step-card slide-in-right">${completeHtml}</div>`;
    }, { once: true });
  } else {
    stage.innerHTML = `<div class="step-card slide-in-right">${completeHtml}</div>`;
  }

  document.getElementById('wizardFooter').style.display = 'none';
  document.getElementById('stepDots').innerHTML = '';
}

/* ── Date utilities ── */
function isoDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

function fmt(base, offsetDays) {
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── Service worker ── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

/* ── Catchphrases ── */
function rotateCatchphrases() {
  const el = document.getElementById('catchphrase');
  if (!el) return;
  let idx = Math.floor(Math.random() * CATCHPHRASES.length);
  el.textContent = `"${CATCHPHRASES[idx]}"`;
  setInterval(() => {
    el.classList.add('fading');
    setTimeout(() => {
      idx = (idx + 1) % CATCHPHRASES.length;
      el.textContent = `"${CATCHPHRASES[idx]}"`;
      el.classList.remove('fading');
    }, 900);
  }, 9000);
}

/* ── Boot ── */
(function () {
  const raw = localStorage.getItem('qs_plan');
  if (raw) {
    try {
      const plan = JSON.parse(raw);
      const qd   = new Date((plan.quit_date || '') + 'T00:00:00');
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (qd <= today) return; // dashboard.js handles routing
    } catch (_) {}
  }
  rotateCatchphrases();
  render();
})();
