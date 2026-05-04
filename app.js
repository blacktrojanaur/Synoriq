
// ─── UTILITIES ───────────────────────────────────────────────────────────────
const fmt = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const fmtN = (n) => Math.round(n).toLocaleString('en-IN');

function syncSlider(id, val) {
  const slider = document.getElementById(id);
  if (slider) { slider.value = val; }
  if (id.startsWith('emi')) updateEMI();
  else if (id.startsWith('sip')) updateSIP();
}

function updateSliderFill(slider) {
  const min = +slider.min, max = +slider.max, val = +slider.value;
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(to right, var(--teal) 0%, var(--teal) ${pct}%, var(--bg3) ${pct}%)`;
}

// ─── TAB SWITCHING ────────────────────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('tab-' + (tab === 'suggestions' ? 'sug' : tab)).classList.add('active');
  document.getElementById('content-' + tab).classList.add('active');
  if (tab === 'suggestions') generateSuggestions();
}

// ─── EMI CALCULATOR ───────────────────────────────────────────────────────────
let loanType = 'home';
const loanDefaults = {
  home:      { amount: 2500000, rate: 8.5,  tenure: 20 },
  car:       { amount: 800000,  rate: 10.5, tenure: 7  },
  personal:  { amount: 500000,  rate: 14,   tenure: 5  },
  education: { amount: 1000000, rate: 9.5,  tenure: 10 },
};

function setLoanType(type, btn) {
  loanType = type;
  document.querySelectorAll('.loan-type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const d = loanDefaults[type];
  setSlider('emi-principal', d.amount);
  setSlider('emi-rate', d.rate);
  setSlider('emi-tenure', d.tenure);
  updateEMI();
}

function setSlider(id, val) {
  const slider = document.getElementById(id);
  const input  = document.getElementById(id + '-input');
  if (slider) slider.value = val;
  if (input)  input.value  = val;
}

function getVal(id) { return parseFloat(document.getElementById(id).value) || 0; }

function updateEMI() {
  ['emi-principal','emi-rate','emi-tenure'].forEach(id => {
    const s = document.getElementById(id);
    const inp = document.getElementById(id + '-input');
    if (s && inp) inp.value = s.value;
    if (s) updateSliderFill(s);
  });

  const P = getVal('emi-principal');
  const r = getVal('emi-rate') / 12 / 100;
  const n = getVal('emi-tenure') * 12;

  const emi   = r === 0 ? P / n : P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  const total = emi * n;
  const interest = total - P;

  document.getElementById('emi-result').textContent   = fmt(emi);
  document.getElementById('emi-interest').textContent  = fmt(interest);
  document.getElementById('emi-total').textContent     = fmt(total);
  document.getElementById('legend-principal').textContent = fmt(P);
  document.getElementById('legend-interest').textContent  = fmt(interest);

  // Donut chart
  const circum = 2 * Math.PI * 70;
  const principalPct = P / total;
  const interestPct  = interest / total;
  const pArc = principalPct * circum;
  const iArc = interestPct  * circum;
  const pOffset = circum / 4;
  const iOffset = pOffset - pArc;

  const pCircle = document.getElementById('emi-principal-arc');
  const iCircle = document.getElementById('emi-interest-arc');
  if (pCircle) {
    pCircle.setAttribute('stroke-dasharray', `${pArc} ${circum}`);
    pCircle.setAttribute('stroke-dashoffset', pOffset);
  }
  if (iCircle) {
    iCircle.setAttribute('stroke', '#7C3AED');
    iCircle.setAttribute('stroke-dasharray', `${iArc} ${circum}`);
    iCircle.setAttribute('stroke-dashoffset', iOffset);
  }
  document.getElementById('emi-principal-pct').textContent = (principalPct * 100).toFixed(1) + '%';

  drawEMIBarChart(P, r, n, emi);
  buildEMISchedule(P, r, n, emi);
}

function drawEMIBarChart(P, r, n, emi) {
  const container = document.getElementById('emi-bar-chart');
  if (!container) return;
  container.innerHTML = '';
  const years = Math.ceil(n / 12);
  let balance = P;
  let maxTotal = 0;
  const data = [];

  for (let y = 1; y <= Math.min(years, 20); y++) {
    let princ = 0, intPaid = 0;
    for (let m = 0; m < 12 && balance > 0; m++) {
      const intM = balance * r;
      const prinM = Math.min(emi - intM, balance);
      intPaid += intM; princ += prinM; balance -= prinM;
    }
    const tot = princ + intPaid;
    if (tot > maxTotal) maxTotal = tot;
    data.push({ year: y, princ, intPaid });
  }

  const maxH = 120;
  data.forEach(d => {
    const tot = d.princ + d.intPaid;
    const pH = (d.princ / maxTotal) * maxH;
    const iH = (d.intPaid / maxTotal) * maxH;
    const group = document.createElement('div');
    group.className = 'bar-group';
    group.title = `Year ${d.year}: Principal ${fmt(d.princ)}, Interest ${fmt(d.intPaid)}`;
    group.innerHTML = `
      <div style="display:flex;flex-direction:column-reverse;height:${maxH}px;gap:2px;width:100%;">
        <div class="bar-stack" style="height:${pH}px;background:#00D4AA;border-radius:3px 3px 0 0;"></div>
        <div class="bar-stack" style="height:${iH}px;background:#7C3AED;border-radius:3px 3px 0 0;"></div>
      </div>
      <div class="bar-label">Y${d.year}</div>`;
    container.appendChild(group);
  });
}

function buildEMISchedule(P, r, n, emi) {
  const tbody = document.getElementById('emi-schedule-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  let balance = P;
  const years = Math.ceil(n / 12);

  for (let y = 1; y <= years; y++) {
    const opening = balance;
    let princ = 0, intPaid = 0;
    for (let m = 0; m < 12 && balance > 0; m++) {
      const intM = balance * r;
      const prinM = Math.min(emi - intM, balance);
      intPaid += intM; princ += prinM; balance = Math.max(0, balance - prinM);
    }
    tbody.innerHTML += `<tr>
      <td>Year ${y}</td>
      <td>${fmt(opening)}</td>
      <td>${fmt(princ)}</td>
      <td>${fmt(intPaid)}</td>
      <td>${fmt(Math.max(0, balance))}</td>
    </tr>`;
  }
}

function toggleSchedule(type) {
  const wrapper = document.getElementById(`${type}-schedule-wrapper`);
  const btn     = document.getElementById(`toggle-${type}-schedule`);
  const hidden  = wrapper.style.display === 'none';
  wrapper.style.display = hidden ? 'block' : 'none';
  btn.textContent = hidden ? 'Hide Schedule ▲' : 'Show Full Schedule ▼';
}

// ─── SIP CALCULATOR ───────────────────────────────────────────────────────────
let sipMode = 'monthly';

function setSIPMode(mode, btn) {
  sipMode = mode;
  document.querySelectorAll('.sip-mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const label = document.querySelector('#content-sip .input-group label');
  if (label) label.textContent = mode === 'monthly' ? 'Monthly Investment' : 'Lump Sum Amount';
  updateSIP();
}

function updateSIP() {
  ['sip-amount','sip-return','sip-tenure','sip-step'].forEach(id => {
    const s = document.getElementById(id);
    const inp = document.getElementById(id + '-input');
    if (s && inp) inp.value = s.value;
    if (s) updateSliderFill(s);
  });

  const P    = getVal('sip-amount');
  const rate = getVal('sip-return');
  const yrs  = getVal('sip-tenure');
  const step = getVal('sip-step') / 100;

  let maturity = 0, invested = 0;

  if (sipMode === 'lumpsum') {
    invested = P;
    maturity = P * Math.pow(1 + rate / 100, yrs);
  } else {
    // Step-up SIP calculation
    let monthly = P;
    const r = rate / 12 / 100;
    for (let y = 0; y < yrs; y++) {
      for (let m = 0; m < 12; m++) {
        maturity = (maturity + monthly) * (1 + r);
        invested += monthly;
      }
      monthly *= (1 + step);
    }
  }

  const gains = maturity - invested;
  document.getElementById('sip-maturity').textContent  = fmt(maturity);
  document.getElementById('sip-invested').textContent  = fmt(invested);
  document.getElementById('sip-returns').textContent   = fmt(gains);
  document.getElementById('sip-legend-invested').textContent = fmt(invested);
  document.getElementById('sip-legend-returns').textContent  = fmt(gains);

  drawSIPChart(P, rate, yrs, step);
  drawSIPComparison(P, rate, yrs, invested, maturity);
}

function drawSIPChart(P, rate, yrs, step) {
  const canvas = document.getElementById('sip-growth-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const points = [];
  const invPoints = [];
  let maturity = 0, invested = 0;
  let monthly = P;
  const r = rate / 12 / 100;
  const totalMonths = yrs * 12;

  for (let m = 0; m <= totalMonths; m++) {
    if (sipMode === 'lumpsum') {
      invested = P;
      maturity = P * Math.pow(1 + rate / 100, m / 12);
    } else {
      if (m > 0) {
        maturity = (maturity + monthly) * (1 + r);
        invested += monthly;
        if (m % 12 === 0) monthly *= (1 + step);
      }
    }
    points.push(maturity);
    invPoints.push(invested);
  }

  const maxVal = Math.max(...points);
  const pad = { t: 20, r: 20, b: 30, l: 10 };
  const cW = W - pad.l - pad.r, cH = H - pad.t - pad.b;

  const toX = (i) => pad.l + (i / totalMonths) * cW;
  const toY = (v) => pad.t + cH - (v / maxVal) * cH;

  // Draw invested area
  ctx.beginPath();
  ctx.moveTo(toX(0), toY(invPoints[0]));
  for (let i = 1; i < invPoints.length; i++) ctx.lineTo(toX(i), toY(invPoints[i]));
  ctx.lineTo(toX(totalMonths), pad.t + cH);
  ctx.lineTo(toX(0), pad.t + cH);
  ctx.closePath();
  const invGrad = ctx.createLinearGradient(0, 0, 0, H);
  invGrad.addColorStop(0, 'rgba(0,212,170,0.3)');
  invGrad.addColorStop(1, 'rgba(0,212,170,0.02)');
  ctx.fillStyle = invGrad;
  ctx.fill();

  // Draw total area
  ctx.beginPath();
  ctx.moveTo(toX(0), toY(points[0] || 0));
  for (let i = 1; i < points.length; i++) ctx.lineTo(toX(i), toY(points[i]));
  ctx.lineTo(toX(totalMonths), pad.t + cH);
  ctx.lineTo(toX(0), pad.t + cH);
  ctx.closePath();
  const totGrad = ctx.createLinearGradient(0, 0, 0, H);
  totGrad.addColorStop(0, 'rgba(245,158,11,0.2)');
  totGrad.addColorStop(1, 'rgba(245,158,11,0.02)');
  ctx.fillStyle = totGrad;
  ctx.fill();

  // Lines
  const drawLine = (pts, color) => {
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(pts[0] || 0));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(toX(i), toY(pts[i]));
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
  };
  drawLine(invPoints, '#00D4AA');
  drawLine(points, '#F59E0B');

  // Year labels
  ctx.fillStyle = 'rgba(138,146,176,0.8)'; ctx.font = '11px Inter'; ctx.textAlign = 'center';
  const step2 = Math.max(1, Math.floor(yrs / 5));
  for (let y = 0; y <= yrs; y += step2) {
    ctx.fillText(`${y}Y`, toX(y * 12), H - 8);
  }
}

function drawSIPComparison(P, rate, yrs, invested, maturity) {
  const container = document.getElementById('sip-comparison-grid');
  if (!container) return;
  // Compare different rates
  const rates = [6, 8, 10, 12, 15, 18];
  container.innerHTML = '';
  rates.forEach(r => {
    let m = 0, inv = 0, monthly = P;
    const rM = r / 12 / 100;
    for (let y = 0; y < yrs; y++) {
      for (let mo = 0; mo < 12; mo++) {
        m = (m + monthly) * (1 + rM);
        inv += monthly;
      }
    }
    const active = r === Math.round(rate);
    container.innerHTML += `
      <div class="comparison-row" style="${active ? 'border-color:var(--teal);background:var(--teal-dim)' : ''}">
        <span class="comp-label">@ ${r}% p.a.</span>
        <span class="comp-value positive">${fmt(m)}</span>
      </div>`;
  });
}

// ─── SMART SUGGESTIONS ────────────────────────────────────────────────────────
const activeGoals = new Set(['home','retirement']);

function toggleGoal(btn, goal) {
  btn.classList.toggle('active');
  if (activeGoals.has(goal)) activeGoals.delete(goal);
  else activeGoals.add(goal);
  generateSuggestions();
}

function generateSuggestions() {
  const income   = getVal('sg-income')   || 80000;
  const expenses = getVal('sg-expenses') || 45000;
  const emiObl   = getVal('sg-emi')      || 0;
  const savings  = getVal('sg-savings')  || 0;
  const age      = getVal('sg-age')      || 30;
  const risk     = document.getElementById('sg-risk')?.value || 'medium';

  const surplus   = income - expenses - emiObl;
  const savRate   = (surplus / income) * 100;
  const dti       = (emiObl / income) * 100;
  const emMonths  = expenses * 6;
  const healthPct = calcHealthScore(savRate, dti, savings, emMonths, age);

  const container = document.getElementById('suggestions-results');
  if (!container) return;

  // Allocation by risk
  const alloc = {
    low:    { equity:20, debt:60, gold:15, liquid:5  },
    medium: { equity:50, debt:35, gold:10, liquid:5  },
    high:   { equity:75, debt:15, gold:5,  liquid:5  },
  }[risk];

  const sipRec = Math.round(surplus * 0.5 / 500) * 500;
  const retYrs = 60 - age;

  const suggestions = buildSuggestions(surplus, savRate, dti, savings, emMonths, age, risk, alloc, sipRec, retYrs, income);

  container.innerHTML = `
    ${healthCard(healthPct, savRate, dti, surplus)}
    ${suggestions.map(s => suggestionCard(s)).join('')}
  `;

  // Animate ring
  setTimeout(() => {
    const ring = document.querySelector('.health-ring-fg');
    if (ring) {
      const circum = 2 * Math.PI * 35;
      ring.setAttribute('stroke-dasharray', `${(healthPct/100)*circum} ${circum}`);
    }
  }, 100);
}

function calcHealthScore(savRate, dti, savings, emMonths, age) {
  let score = 0;
  if (savRate >= 30) score += 30;
  else if (savRate >= 20) score += 20;
  else if (savRate >= 10) score += 10;
  if (dti < 20) score += 25;
  else if (dti < 35) score += 15;
  else if (dti < 50) score += 5;
  if (savings >= emMonths) score += 25;
  else if (savings >= emMonths * 0.5) score += 12;
  if (age < 30) score += 20;
  else if (age < 45) score += 12;
  else score += 5;
  return Math.min(score, 100);
}

function healthCard(score, savRate, dti, surplus) {
  const color = score >= 70 ? '#00D4AA' : score >= 45 ? '#F59E0B' : '#F87171';
  const label = score >= 70 ? 'Excellent' : score >= 45 ? 'Good' : 'Needs Work';
  const circum = 2 * Math.PI * 35;
  return `
    <div class="finance-health-card">
      <div class="health-score-wrap">
        <div class="health-score-ring">
          <svg viewBox="0 0 80 80" width="80" height="80">
            <circle class="health-ring-bg" cx="40" cy="40" r="35"/>
            <circle class="health-ring-fg" cx="40" cy="40" r="35"
              stroke="${color}"
              stroke-dasharray="0 ${circum}"
              stroke-dashoffset="${circum * 0.25}"/>
          </svg>
          <div class="health-score-num" style="color:${color}">${score}</div>
        </div>
        <div class="health-details">
          <h3>Financial Health: <span style="color:${color}">${label}</span></h3>
          <p>Based on your savings rate, debt ratio, and emergency fund status.</p>
        </div>
      </div>
      <div class="health-metrics">
        <div class="metric-item">
          <div class="metric-label">Monthly Surplus</div>
          <div class="metric-value" style="color:#00D4AA">${fmt(surplus)}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Savings Rate</div>
          <div class="metric-value" style="color:${savRate>=20?'#00D4AA':'#F59E0B'}">${savRate.toFixed(1)}%</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Debt-to-Income</div>
          <div class="metric-value" style="color:${dti<30?'#00D4AA':'#F87171'}">${dti.toFixed(1)}%</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Recommended SIP</div>
          <div class="metric-value">${fmt(Math.max(500, surplus * 0.5))}</div>
        </div>
      </div>
    </div>`;
}

function buildSuggestions(surplus, savRate, dti, savings, emMonths, age, risk, alloc, sipRec, retYrs, income) {
  const list = [];

  if (savings < emMonths) {
    list.push({
      icon: '🛡️',
      title: 'Build Your Emergency Fund First',
      desc: `You need ${fmt(emMonths - savings)} more to have a 6-month emergency cushion. Keep this in a liquid fund or high-yield savings account.`,
      tags: ['Priority 1', 'Liquid Fund', 'Safety Net'],
      tagColors: ['','purple','']
    });
  }

  list.push({
    icon: '📊',
    title: `Recommended Portfolio Allocation (${risk.charAt(0).toUpperCase()+risk.slice(1)})`,
    desc: `Equity: ${alloc.equity}% | Debt: ${alloc.debt}% | Gold: ${alloc.gold}% | Liquid: ${alloc.liquid}%. For a monthly SIP of ${fmt(sipRec)}, invest ${fmt(sipRec * alloc.equity/100)} in equity funds.`,
    tags: ['Asset Allocation', risk === 'high' ? 'Aggressive' : risk === 'low' ? 'Conservative' : 'Balanced'],
    tagColors: ['', risk === 'high' ? 'amber' : 'purple']
  });

  if (activeGoals.has('retirement') && retYrs > 0) {
    const retCorpus = income * 12 * 25;
    const sipNeeded = Math.round(retCorpus / (((Math.pow(1 + 0.01, retYrs*12)-1)/0.01)*(1.01)));
    list.push({
      icon: '🌅',
      title: 'Retirement Planning',
      desc: `To retire comfortably at 60, you need ~${fmt(retCorpus)} corpus. Start a SIP of ${fmt(sipNeeded)}/month at 12% expected returns. NPS + ELSS combo can also save tax.`,
      tags: ['Long Term', 'NPS', 'ELSS', '80C Benefit'],
      tagColors: ['', 'purple', '', 'amber']
    });
  }

  if (activeGoals.has('home')) {
    const homeVal = income * 60;
    const downPayment = homeVal * 0.2;
    list.push({
      icon: '🏠',
      title: 'Home Purchase Planning',
      desc: `For a home worth ${fmt(homeVal)}, save ${fmt(downPayment)} as down payment. Consider a home loan of ${fmt(homeVal*0.8)} — your EMI eligibility at current income is ~${fmt(income*0.4)}/month.`,
      tags: ['Home Loan', 'Down Payment', '20% Rule'],
      tagColors: ['', 'purple', '']
    });
  }

  if (activeGoals.has('education')) {
    list.push({
      icon: '🎓',
      title: "Child's Education Fund",
      desc: `Start a dedicated SIP of ${fmt(Math.round(surplus*0.1/500)*500)}/month in an equity mutual fund. Education costs double every 8 years — starting early is crucial.`,
      tags: ['SIP', 'Equity Fund', 'Long Term'],
      tagColors: ['', '', 'purple']
    });
  }

  if (dti > 35) {
    list.push({
      icon: '⚠️',
      title: 'Reduce Debt Burden',
      desc: `Your EMI-to-income ratio of ${((dti)).toFixed(1)}% is high (ideal is <35%). Consider prepaying high-interest loans or consolidating debt to free up cash flow.`,
      tags: ['Debt Management', 'High Priority'],
      tagColors: ['amber', 'amber']
    });
  }

  list.push({
    icon: '💰',
    title: 'Tax Saving Strategies',
    desc: `Maximize 80C deductions (₹1.5L) via ELSS/PPF. Also consider NPS (80CCD – ₹50K extra). Health insurance (80D) and HRA benefits can further reduce your tax outgo.`,
    tags: ['Tax Saving', '80C', '80CCD', 'ELSS/PPF'],
    tagColors: ['amber', '', 'purple', '']
  });

  return list;
}

function suggestionCard(s) {
  const tags = s.tags.map((t, i) =>
    `<span class="sug-tag ${s.tagColors[i] || ''}">${t}</span>`
  ).join('');
  return `
    <div class="suggestion-card">
      <div class="sug-header">
        <div class="sug-icon">${s.icon}</div>
        <div>
          <div class="sug-title">${s.title}</div>
          <div class="sug-desc">${s.desc}</div>
        </div>
      </div>
      <div class="sug-tags">${tags}</div>
    </div>`;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateEMI();
  updateSIP();
  generateSuggestions();

  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    const nb = document.getElementById('navbar');
    if (nb) nb.style.background = window.scrollY > 40 ? 'rgba(10,13,26,0.97)' : 'rgba(10,13,26,0.85)';
  });

  // Nav link smooth scroll + tab sync
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.dataset.tab;
      switchTab(tab);
      document.getElementById('calculators')?.scrollIntoView({ behavior: 'smooth' });
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // Slider live sync
  document.querySelectorAll('.slider').forEach(slider => {
    slider.addEventListener('input', () => {
      const inp = document.getElementById(slider.id + '-input');
      if (inp) inp.value = slider.value;
    });
  });
});
