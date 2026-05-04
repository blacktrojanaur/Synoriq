
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
  const btnId = tab === 'suggestions' ? 'sug' : tab;
  document.getElementById('tab-' + btnId).classList.add('active');
  document.getElementById('content-' + tab).classList.add('active');
  if (tab === 'suggestions') generateSuggestions();
  if (tab === 'schedule') updateScheduleMaker();
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
<body>
  <!-- Animated background orbs -->
  <div class="bg-orb orb1"></div>
  <div class="bg-orb orb2"></div>
  <div class="bg-orb orb3"></div>

  <!-- NAVBAR -->
  <nav class="navbar" id="navbar" style="background: rgba(10, 13, 26, 0.97);">
    <div class="nav-container">
      <div class="nav-logo">
        <div class="logo-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M4 20L10 12L16 16L22 8" stroke="#00D4AA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
            <circle cx="4" cy="20" r="2.5" fill="#00D4AA"></circle>
            <circle cx="22" cy="8" r="2.5" fill="#7C3AED"></circle>
            <path d="M2 24h24" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"></path>
          </svg>
        </div>
        <span class="logo-text">Synoriq</span>
      </div>
      <div class="nav-links">
        <a href="#emi" class="nav-link active" data-tab="emi">EMI Calculator</a>
        <a href="#sip" class="nav-link" data-tab="sip">SIP Calculator</a>
        <a href="#suggestions" class="nav-link" data-tab="suggestions">Smart Suggestions</a>
        <a href="#schedule" class="nav-link" data-tab="schedule">Schedule Maker</a>
      </div>
      <div class="nav-cta">
        <button class="btn-primary-sm" onclick="document.getElementById('emi').scrollIntoView({behavior:'smooth'})">Get Started</button>
      </div>
    </div>
  </nav>

  <!-- HERO SECTION -->
  <section class="hero">
    <div class="hero-content">
      <div class="hero-badge">
        <span class="badge-dot"></span>
        Smart Financial Planning
      </div>
      <h1 class="hero-title">
        Plan Your Finances<br>
        <span class="gradient-text">Intelligently</span>
      </h1>
      <p class="hero-subtitle">
        Calculate EMIs, project SIP returns, and receive personalized<br> financial suggestions — all in one place.
      </p>
      <div class="hero-stats">
        <div class="stat-item">
          <span class="stat-number">₹500Cr+</span>
          <span class="stat-label">Loans Processed</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-number">2L+</span>
          <span class="stat-label">Happy Customers</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-number">4.9★</span>
          <span class="stat-label">User Rating</span>
        </div>
      </div>
    </div>
    <div class="hero-visual">
      <div class="floating-card card-1">
        <div class="fc-icon">📈</div>
        <div class="fc-text">
          <div class="fc-label">Monthly SIP</div>
          <div class="fc-value">₹10,000</div>
        </div>
      </div>
      <div class="floating-card card-2">
        <div class="fc-icon">🏠</div>
        <div class="fc-text">
          <div class="fc-label">Home Loan EMI</div>
          <div class="fc-value">₹35,642</div>
        </div>
      </div>
      <div class="floating-card card-3">
        <div class="fc-icon">💰</div>
        <div class="fc-text">
          <div class="fc-label">Estimated Returns</div>
          <div class="fc-value green">+24.5%</div>
        </div>
      </div>
      <div class="hero-chart-preview">
        <svg viewBox="0 0 280 120" class="chart-svg">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#00D4AA" stop-opacity="0.4"></stop>
              <stop offset="100%" stop-color="#00D4AA" stop-opacity="0"></stop>
            </linearGradient>
          </defs>
          <path d="M0 100 C30 90, 60 70, 90 60 C120 50, 150 40, 180 25 C210 10, 240 5, 280 2 L280 120 L0 120Z" fill="url(#chartGrad)"></path>
          <path d="M0 100 C30 90, 60 70, 90 60 C120 50, 150 40, 180 25 C210 10, 240 5, 280 2" fill="none" stroke="#00D4AA" stroke-width="2.5"></path>
          <path d="M0 80 C30 75, 60 65, 90 58 C120 51, 150 47, 180 42 C210 37, 240 35, 280 32 L280 120 L0 120Z" fill="rgba(124,58,237,0.15)"></path>
          <path d="M0 80 C30 75, 60 65, 90 58 C120 51, 150 47, 180 42 C210 37, 240 35, 280 32" fill="none" stroke="#7C3AED" stroke-width="1.5" stroke-dasharray="5,3"></path>
        </svg>
        <div class="chart-labels">
          <span>1Y</span><span>3Y</span><span>5Y</span><span>10Y</span><span>20Y</span>
        </div>
      </div>
    </div>
  </section>

  <!-- CALCULATOR TABS -->
  <section class="calculators" id="calculators">
    <div class="tabs-container">
      <div class="tabs-header">
        <button class="tab-btn active" id="tab-emi" onclick="switchTab('emi')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"></path></svg>
          EMI Calculator
        </button>
        <button class="tab-btn" id="tab-sip" onclick="switchTab('sip')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" fill="currentColor"></path></svg>
          SIP Calculator
        </button>
        <button class="tab-btn" id="tab-sug" onclick="switchTab('suggestions')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" fill="currentColor"></path></svg>
          Smart Suggestions
        </button>
        <button class="tab-btn" id="tab-schedule" onclick="switchTab('schedule')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" fill="currentColor"></path></svg>
          Schedule Maker
        </button>
      </div>

      <!-- EMI CALCULATOR -->
      <div class="tab-content active" id="content-emi">
        <div class="calc-layout">
          <div class="calc-inputs">
            <h2 class="calc-title">EMI Calculator</h2>
            <p class="calc-desc">Calculate your Equated Monthly Installment for any loan type</p>
            
            <div class="loan-type-selector">
              <button class="loan-type-btn active" onclick="setLoanType('home', this)">🏠 Home</button>
              <button class="loan-type-btn" onclick="setLoanType('car', this)">🚗 Car</button>
              <button class="loan-type-btn" onclick="setLoanType('personal', this)">💳 Personal</button>
              <button class="loan-type-btn" onclick="setLoanType('education', this)">🎓 Education</button>
            </div>

            <div class="input-group">
              <div class="input-label-row">
                <label for="emi-principal">Loan Amount</label>
                <div class="input-value-display">
                  ₹<input type="number" id="emi-principal-input" value="2500000" min="10000" max="100000000" onchange="syncSlider('emi-principal', this.value)">
                </div>
              </div>
              <input type="range" id="emi-principal" class="slider" min="10000" max="10000000" step="10000" value="2500000" oninput="updateEMI()" style="background: linear-gradient(to right, var(--teal) 0%, var(--teal) 24.924924924924923%, var(--bg3) 24.924924924924923%);">
              <div class="slider-range"><span>₹10K</span><span>₹1Cr</span></div>
            </div>

            <div class="input-group">
              <div class="input-label-row">
                <label for="emi-rate">Interest Rate (p.a.)</label>
                <div class="input-value-display">
                  <input type="number" id="emi-rate-input" value="8.5" min="1" max="30" step="0.1" onchange="syncSlider('emi-rate', this.value)">%
                </div>
              </div>
              <input type="range" id="emi-rate" class="slider" min="1" max="30" step="0.1" value="8.5" oninput="updateEMI()" style="background: linear-gradient(to right, var(--teal) 0%, var(--teal) 25.862068965517242%, var(--bg3) 25.862068965517242%);">
              <div class="slider-range"><span>1%</span><span>30%</span></div>
            </div>

            <div class="input-group">
              <div class="input-label-row">
                <label for="emi-tenure">Loan Tenure</label>
                <div class="input-value-display">
                  <input type="number" id="emi-tenure-input" value="20" min="1" max="30" onchange="syncSlider('emi-tenure', this.value)"> Yrs
                </div>
              </div>
              <input type="range" id="emi-tenure" class="slider" min="1" max="30" step="1" value="20" oninput="updateEMI()" style="background: linear-gradient(to right, var(--teal) 0%, var(--teal) 65.51724137931035%, var(--bg3) 65.51724137931035%);">
              <div class="slider-range"><span>1 Yr</span><span>30 Yrs</span></div>
            </div>

            <div class="result-cards-grid">
              <div class="result-card primary">
                <div class="rc-label">Monthly EMI</div>
                <div class="rc-value" id="emi-result">₹21,696</div>
              </div>
              <div class="result-card">
                <div class="rc-label">Total Interest</div>
                <div class="rc-value accent" id="emi-interest">₹27,06,939</div>
              </div>
              <div class="result-card">
                <div class="rc-label">Total Amount</div>
                <div class="rc-value" id="emi-total">₹52,06,939</div>
              </div>
            </div>
          </div>

          <div class="calc-visual">
            <div class="chart-container">
              <h3 class="chart-title">Loan Breakdown</h3>
              <div class="donut-wrapper">
                <svg id="emi-donut" viewBox="0 0 200 200" class="donut-chart">
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#1a1f35" stroke-width="30"></circle>
                  <circle id="emi-principal-arc" cx="100" cy="100" r="70" fill="none" stroke="#00D4AA" stroke-width="30" stroke-dasharray="211.17154325161306 439.822971502571" stroke-dashoffset="109.95574287564276" stroke-linecap="butt"></circle>
                  <circle id="emi-interest-arc" cx="100" cy="100" r="70" fill="none" stroke="#7C3AED" stroke-width="30" stroke-dasharray="228.65142825095796 439.822971502571" stroke-dashoffset="-101.2158003759703" stroke-linecap="butt"></circle>
                </svg>
                <div class="donut-center">
                  <div class="donut-label">Principal</div>
                  <div class="donut-pct" id="emi-principal-pct">48.0%</div>
                </div>
              </div>
              <div class="chart-legend">
                <div class="legend-item">
                  <span class="legend-dot" style="background:#00D4AA"></span>
                  <span>Principal Amount</span>
                  <span class="legend-val" id="legend-principal">₹25,00,000</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot" style="background:#7C3AED"></span>
                  <span>Total Interest</span>
                  <span class="legend-val" id="legend-interest">₹27,06,939</span>
                </div>
              </div>
            </div>

            <div class="amortization-section">
              <h3 class="chart-title">Year-wise Breakdown</h3>
              <div class="bar-chart-container">
                <div id="emi-bar-chart" class="bar-chart"><div class="bar-group" title="Year 1: Principal ₹49,756, Interest ₹2,10,591">
      <div style="display:flex;flex-direction:column-reverse;height:120px;gap:2px;width:100%;">
        <div class="bar-stack" style="height:22.93357807154598px;background:#00D4AA;border-radius:3px 3px 0 0;"></div>
        <div class="bar-stack" style="height:97.06642192845402px;background:#7C3AED;border-radius:3px 3px 0 0;"></div>
      </div>
      <div class="bar-label">Y1</div></div><div class="bar-group" title="Year 2: Principal ₹54,154, Interest ₹2,06,193">
      <div style="display:flex;flex-direction:column-reverse;height:120px;gap:2px;width:100%;">
        <div class="bar-stack" style="height:24.960697812649407px;background:#00D4AA;border-radius:3px 3px 0 0;"></div>
        <div class="bar-stack" style="height:95.03930218735057px;background:#7C3AED;border-radius:3px 3px 0 0;"></div>
      </div>
      <div class="bar-label">Y2</div></div><div class="bar-group" title="Year 3: Principal ₹58,940, Interest ₹2,01,407">
      <div style="display:flex;flex-direction:column-reverse;height:120px;gap:2px;width:100%;">
        <div class="bar-stack" style="height:27.166996504021807px;background:#00D4AA;border-radius:3px 3px 0 0;"></div>
        <div class="bar-stack" style="height:92.83300349597818px;background:#7C3AED;border-radius:3px 3px 0 0;"></div>
      </div>
      <div class="bar-label">Y3</div></div><div class="bar-group" title="Year 4: Principal ₹64,150, Interest ₹1,96,197">
      <div style="display:flex;flex-direction:column-reverse;height:120px;gap:2px;width:100%;">
        <div class="bar-stack" style="height:29.568311935394377px;background:#00D4AA;border-radius:3px 3px 0 0;"></div>
        <div class="bar-stack" style="height:90.43168806460561px;background:#7C3AED;border-radius:3px 3px 0 0;"></div>
      </div>
      <div class="bar-label">Y4</div></div><div class="bar-group" title="Year 5: Principal ₹69,820, Interest ₹1,90,527">
      <div style="display:flex;flex-direction:column-reverse;height:120px;gap:2px;width:100%;">
        <div class="bar-stack" style="height:32.18188181307989px;background:#00D4AA;border-radius:3px 3px 0 0;"></div>
        <div class="bar-stack" style="height:87.8181181869201px;background:#7C3AED;border-radius:3px 3px 0 0;"></div>
      </div>
      <div class="bar-label">Y5</div></div><div class="bar-group" title="Year 6: Principal ₹75,992, Interest ₹1,84,355">
      <div style="display:flex;flex-direction:column-reverse;height:120px;gap:2px;width:100%;">
        <div class="bar-stack" style="height:35.02646749986772px;background:#00D4AA;border-radius:3px 3px 0 0;"></div>
        <div class="bar-stack" style="height:84.97353250013226px;background:#7C3AED;border-radius:3px 3px 0 0;"></div>
      </div>
      <div class="bar-label">Y6</div></div><div class="bar-group" title="Year 7: Principal ₹82,709, Interest ₹1,77,638">
      <div style="display:flex;flex-direction:column-reverse;height:120px;gap:2px;width:100%;">
        <div class="bar-stack" style="height:38.122488692399955px;background:#00D4AA;border-radius:3px 3px 0 0;"></div>
        <div class="bar-stack" style="height:81.8775113076px;background:#7C3AED;border-radius:3px 3px 0 0;"></div>
      </div>
      <div class="bar-label">Y7</div></div><div class="bar-group" title="Year 8: Principal ₹90,020, Interest ₹1,70,327">
      <div style="display:flex;flex-direction:column-reverse;height:120px;gap:2px;width:100%;">
        <div class="bar-stack" style="height:41.49217000280293px;background:#00D4AA;border-radius:3px 3px 0 0;"></div>
        <div class="bar-stack" style="height:78.50782999719705px;background:#7C3AED;border-radius:3px 3px 0 0;"></div>
      </div>
      <div class="bar-label">Y8</div></div><div class="bar-group" title="Year 9: Principal ₹97,977, Interest ₹1,62,370">
      <div style="display:flex;flex-direction:column-reverse;height:120px;gap:2px;width:100%;">
        <div class="bar-stack" style="height:45.159700496801904px;background:#00D4AA;border-radius:3px 3px 0 0;"></div>
        <div class="bar-stack" style="height:74.84029950319807px;background:#7C3AED;border-radius:3px 3px 0 0;"></div>
      </div>
      <div class="bar-label">Y9</div></div><div class="bar-group" title="Year 10: Principal ₹1,06,637, Interest ₹1,53,710">
      <div style="display:flex;flex-direction:column-reverse;height:120px;gap:2px;width:100%;">
        <div class="bar-stack" style="height:49.151407333554296px;background:#00D4AA;border-radius:3px 3px 0 0;"></div>
        <div class="bar-stack" style="height:70.84859266644568px;background:#7C3AED;border-radius:3px 3px 0 0;"></div>
      </div>
      <div class="bar-label">Y10</div></div><div class="bar-group" title="Year 11: Principal ₹1,16,063, Interest ₹1,44,284">
      <div style="display:flex;flex-direction:column-reverse;height:120px;gap:2px;width:100%;">
        <div class="bar-stack" style="height:53.495944753665086px;background:#00D4AA;border-radius:3px 3px 0 0;"></div>
        <div class="bar-stack" style="height:66.50405524633491px;background:#7C3AED;border-radius:3px 3px 0 0;"></div>
      </div>
      <div class="bar-label">Y11</div></div><div class="bar-group" title="Year 12: Principal ₹1,26,321, Interest ₹1,34,026">
      <div style="display:flex;flex-direction:column-reverse;height:120px;gap:2px;width:100%;">
        <div class="bar-stack" style="height:58.22449977202391px;background:#00D4AA;border-radius:3px 3px 0 0;"></div>
        <div class="bar-stack" style="height:61.77550022797607px;background:#7C3AED;border-radius:3px 3px 0 0;"></div>
      </div>
      <div class="bar-label">Y12</div></div><div class="bar-group" title="Year 13: Principal ₹1,37,487, Interest ₹1,22,860">
      <div style="display:flex;flex-direction:column-reverse;height:120px;gap:2px;width:100%;">
        <div class="bar-stack" style="height:63.371016052018646px;background:#00D4AA;border-radius:3px 3px 0 0;"></div>
        <div class="bar-stack" style="height:56.62898394798134px;background:#7C3AED;border-radius:3px 3px 0 0;"></div>
      </div>
      <div class="bar-label">Y13</div></div><div class="bar-group" title="Year 14: Principal ₹1,49,640, Interest ₹1,10,707">
      <div style="display:flex;flex-direction:column-reverse;height:120px;gap:2px;width:100%;">
        <div class="bar-stack" style="height:68.97243756819329px;background:#00D4AA;border-radius:3px 3px 0 0;"></div>
        <div class="bar-stack" style="height:51.0275624318067px;background:#7C3AED;border-radius:3px 3px 0 0;"></div>
      </div>
      <div class="bar-label">Y14</div></div><div class="bar-group" title="Year 15: Principal ₹1,62,866, Interest ₹97,480">
      <div style="display:flex;flex-direction:column-reverse;height:120px;gap:2px;width:100%;">
        <div class="bar-stack" style="height:75.06897380646912px;background:#00D4AA;border-radius:3px 3px 0 0;"></div>
        <div class="bar-stack" style="height:44.93102619353087px;background:#7C3AED;border-radius:3px 3px 0 0;"></div>
      </div>
      <div class="bar-label">Y15</div></div><div class="bar-group" title="Year 16: Principal ₹1,77,262, Interest ₹83,085">
      <div style="display:flex;flex-direction:column-reverse;height:120px;gap:2px;width:100%;">
        <div class="bar-stack" style="height:81.70438840565343px;background:#00D4AA;border-radius:3px 3px 0 0;"></div>
        <div class="bar-stack" style="height:38.295611594346546px;background:#7C3AED;border-radius:3px 3px 0 0;"></div>
      </div>
      <div class="bar-label">Y16</div></div><div class="bar-group" title="Year 17: Principal ₹1,92,931, Interest ₹67,416">
      <div style="display:flex;flex-direction:column-reverse;height:120px;gap:2px;width:100%;">
        <div class="bar-stack" style="height:88.92631331223288px;background:#00D4AA;border-radius:3px 3px 0 0;"></div>
        <div class="bar-stack" style="height:31.07368668776712px;background:#7C3AED;border-radius:3px 3px 0 0;"></div>
      </div>
      <div class="bar-label">Y17</div></div><div class="bar-group" title="Year 18: Principal ₹2,09,984, Interest ₹50,363">
      <div style="display:flex;flex-direction:column-reverse;height:120px;gap:2px;width:100%;">
        <div class="bar-stack" style="height:96.78659070359342px;background:#00D4AA;border-radius:3px 3px 0 0;"></div>
        <div class="bar-stack" style="height:23.21340929640656px;background:#7C3AED;border-radius:3px 3px 0 0;"></div>
      </div>
      <div class="bar-label">Y18</div></div><div class="bar-group" title="Year 19: Principal ₹2,28,545, Interest ₹31,802">
      <div style="display:flex;flex-direction:column-reverse;height:120px;gap:2px;width:100%;">
        <div class="bar-stack" style="height:105.34164513414376px;background:#00D4AA;border-radius:3px 3px 0 0;"></div>
        <div class="bar-stack" style="height:14.658354865856232px;background:#7C3AED;border-radius:3px 3px 0 0;"></div>
      </div>
      <div class="bar-label">Y19</div></div><div class="bar-group" title="Year 20: Principal ₹2,48,746, Interest ₹11,601">
      <div style="display:flex;flex-direction:column-reverse;height:120px;gap:2px;width:100%;">
        <div class="bar-stack" style="height:114.6528885757687px;background:#00D4AA;border-radius:3px 3px 0 0;"></div>
        <div class="bar-stack" style="height:5.347111424228763px;background:#7C3AED;border-radius:3px 3px 0 0;"></div>
      </div>
      <div class="bar-label">Y20</div></div></div>
              </div>
            </div>
          </div>
        </div>

        <!-- EMI Schedule Table -->
        <div class="schedule-section">
          <div class="schedule-header">
            <h3>Amortization Schedule</h3>
            <button class="toggle-schedule" id="toggle-emi-schedule" onclick="toggleSchedule('emi')">Show Full Schedule ▼</button>
          </div>
          <div class="schedule-table-wrapper" id="emi-schedule-wrapper" style="display:none">
            <table class="schedule-table">
              <thead>
                <tr><th>Year</th><th>Opening Balance</th><th>Principal Paid</th><th>Interest Paid</th><th>Closing Balance</th></tr>
              </thead>
              <tbody id="emi-schedule-body"><tr>
      <td>Year 1</td>
      <td>₹25,00,000</td>
      <td>₹49,756</td>
      <td>₹2,10,591</td>
      <td>₹24,50,244</td>
    </tr><tr>
      <td>Year 2</td>
      <td>₹24,50,244</td>
      <td>₹54,154</td>
      <td>₹2,06,193</td>
      <td>₹23,96,091</td>
    </tr><tr>
      <td>Year 3</td>
      <td>₹23,96,091</td>
      <td>₹58,940</td>
      <td>₹2,01,407</td>
      <td>₹23,37,150</td>
    </tr><tr>
      <td>Year 4</td>
      <td>₹23,37,150</td>
      <td>₹64,150</td>
      <td>₹1,96,197</td>
      <td>₹22,73,000</td>
    </tr><tr>
      <td>Year 5</td>
      <td>₹22,73,000</td>
      <td>₹69,820</td>
      <td>₹1,90,527</td>
      <td>₹22,03,180</td>
    </tr><tr>
      <td>Year 6</td>
      <td>₹22,03,180</td>
      <td>₹75,992</td>
      <td>₹1,84,355</td>
      <td>₹21,27,188</td>
    </tr><tr>
      <td>Year 7</td>
      <td>₹21,27,188</td>
      <td>₹82,709</td>
      <td>₹1,77,638</td>
      <td>₹20,44,479</td>
    </tr><tr>
      <td>Year 8</td>
      <td>₹20,44,479</td>
      <td>₹90,020</td>
      <td>₹1,70,327</td>
      <td>₹19,54,459</td>
    </tr><tr>
      <td>Year 9</td>
      <td>₹19,54,459</td>
      <td>₹97,977</td>
      <td>₹1,62,370</td>
      <td>₹18,56,482</td>
    </tr><tr>
      <td>Year 10</td>
      <td>₹18,56,482</td>
      <td>₹1,06,637</td>
      <td>₹1,53,710</td>
      <td>₹17,49,846</td>
    </tr><tr>
      <td>Year 11</td>
      <td>₹17,49,846</td>
      <td>₹1,16,063</td>
      <td>₹1,44,284</td>
      <td>₹16,33,783</td>
    </tr><tr>
      <td>Year 12</td>
      <td>₹16,33,783</td>
      <td>₹1,26,321</td>
      <td>₹1,34,026</td>
      <td>₹15,07,462</td>
    </tr><tr>
      <td>Year 13</td>
      <td>₹15,07,462</td>
      <td>₹1,37,487</td>
      <td>₹1,22,860</td>
      <td>₹13,69,974</td>
    </tr><tr>
      <td>Year 14</td>
      <td>₹13,69,974</td>
      <td>₹1,49,640</td>
      <td>₹1,10,707</td>
      <td>₹12,20,335</td>
    </tr><tr>
      <td>Year 15</td>
      <td>₹12,20,335</td>
      <td>₹1,62,866</td>
      <td>₹97,480</td>
      <td>₹10,57,468</td>
    </tr><tr>
      <td>Year 16</td>
      <td>₹10,57,468</td>
      <td>₹1,77,262</td>
      <td>₹83,085</td>
      <td>₹8,80,206</td>
    </tr><tr>
      <td>Year 17</td>
      <td>₹8,80,206</td>
      <td>₹1,92,931</td>
      <td>₹67,416</td>
      <td>₹6,87,275</td>
    </tr><tr>
      <td>Year 18</td>
      <td>₹6,87,275</td>
      <td>₹2,09,984</td>
      <td>₹50,363</td>
      <td>₹4,77,291</td>
    </tr><tr>
      <td>Year 19</td>
      <td>₹4,77,291</td>
      <td>₹2,28,545</td>
      <td>₹31,802</td>
      <td>₹2,48,746</td>
    </tr><tr>
      <td>Year 20</td>
      <td>₹2,48,746</td>
      <td>₹2,48,746</td>
      <td>₹11,601</td>
      <td>₹0</td>
    </tr></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- SIP CALCULATOR -->
      <div class="tab-content" id="content-sip">
        <div class="calc-layout">
          <div class="calc-inputs">
            <h2 class="calc-title">SIP Calculator</h2>
            <p class="calc-desc">Estimate your Systematic Investment Plan returns over time</p>

            <div class="sip-mode-selector">
              <button class="sip-mode-btn active" id="sip-mode-monthly" onclick="setSIPMode('monthly', this)">Monthly SIP</button>
              <button class="sip-mode-btn" id="sip-mode-lumpsum" onclick="setSIPMode('lumpsum', this)">Lump Sum</button>
            </div>

            <div class="input-group">
              <div class="input-label-row">
                <label for="sip-amount">Monthly Investment</label>
                <div class="input-value-display">
                  ₹<input type="number" id="sip-amount-input" value="10000" min="500" max="500000" onchange="syncSlider('sip-amount', this.value)">
                </div>
              </div>
              <input type="range" id="sip-amount" class="slider green" min="500" max="100000" step="500" value="10000" oninput="updateSIP()" style="background: linear-gradient(to right, var(--teal) 0%, var(--teal) 9.547738693467336%, var(--bg3) 9.547738693467336%);">
              <div class="slider-range"><span>₹500</span><span>₹1L</span></div>
            </div>

            <div class="input-group">
              <div class="input-label-row">
                <label for="sip-return">Expected Return (p.a.)</label>
                <div class="input-value-display">
                  <input type="number" id="sip-return-input" value="12" min="1" max="40" step="0.5" onchange="syncSlider('sip-return', this.value)">%
                </div>
              </div>
              <input type="range" id="sip-return" class="slider green" min="1" max="40" step="0.5" value="12" oninput="updateSIP()" style="background: linear-gradient(to right, var(--teal) 0%, var(--teal) 28.205128205128204%, var(--bg3) 28.205128205128204%);">
              <div class="slider-range"><span>1%</span><span>40%</span></div>
            </div>

            <div class="input-group">
              <div class="input-label-row">
                <label for="sip-tenure">Investment Period</label>
                <div class="input-value-display">
                  <input type="number" id="sip-tenure-input" value="15" min="1" max="40" onchange="syncSlider('sip-tenure', this.value)"> Yrs
                </div>
              </div>
              <input type="range" id="sip-tenure" class="slider green" min="1" max="40" step="1" value="15" oninput="updateSIP()" style="background: linear-gradient(to right, var(--teal) 0%, var(--teal) 35.8974358974359%, var(--bg3) 35.8974358974359%);">
              <div class="slider-range"><span>1 Yr</span><span>40 Yrs</span></div>
            </div>

            <div class="input-group">
              <div class="input-label-row">
                <label for="sip-step">Step-up Rate (annual)</label>
                <div class="input-value-display">
                  <input type="number" id="sip-step-input" value="0" min="0" max="25" step="1" onchange="syncSlider('sip-step', this.value)">%
                </div>
              </div>
              <input type="range" id="sip-step" class="slider green" min="0" max="25" step="1" value="0" oninput="updateSIP()" style="background: linear-gradient(to right, var(--teal) 0%, var(--teal) 0%, var(--bg3) 0%);">
              <div class="slider-range"><span>0%</span><span>25%</span></div>
            </div>

            <div class="result-cards-grid">
              <div class="result-card primary green-primary">
                <div class="rc-label">Maturity Value</div>
                <div class="rc-value" id="sip-maturity">₹50,45,760</div>
              </div>
              <div class="result-card">
                <div class="rc-label">Total Invested</div>
                <div class="rc-value" id="sip-invested">₹18,00,000</div>
              </div>
              <div class="result-card">
                <div class="rc-label">Est. Returns</div>
                <div class="rc-value green" id="sip-returns">₹32,45,760</div>
              </div>
            </div>
          </div>

          <div class="calc-visual">
            <div class="chart-container">
              <h3 class="chart-title">Growth Projection</h3>
              <div class="sip-chart-area">
                <canvas id="sip-growth-chart" width="400" height="280"></canvas>
              </div>
              <div class="chart-legend">
                <div class="legend-item">
                  <span class="legend-dot" style="background:#00D4AA"></span>
                  <span>Invested Amount</span>
                  <span class="legend-val" id="sip-legend-invested">₹18,00,000</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot" style="background:#F59E0B"></span>
                  <span>Wealth Gained</span>
                  <span class="legend-val" id="sip-legend-returns">₹32,45,760</span>
                </div>
              </div>
            </div>

            <div class="sip-comparison">
              <h3 class="chart-title">Growth Comparison</h3>
              <div class="comparison-grid" id="sip-comparison-grid">
      <div class="comparison-row" style="">
        <span class="comp-label">@ 6% p.a.</span>
        <span class="comp-value positive">₹29,22,728</span>
      </div>
      <div class="comparison-row" style="">
        <span class="comp-label">@ 8% p.a.</span>
        <span class="comp-value positive">₹34,83,451</span>
      </div>
      <div class="comparison-row" style="">
        <span class="comp-label">@ 10% p.a.</span>
        <span class="comp-value positive">₹41,79,243</span>
      </div>
      <div class="comparison-row" style="border-color:var(--teal);background:var(--teal-dim)">
        <span class="comp-label">@ 12% p.a.</span>
        <span class="comp-value positive">₹50,45,760</span>
      </div>
      <div class="comparison-row" style="">
        <span class="comp-label">@ 15% p.a.</span>
        <span class="comp-value positive">₹67,68,631</span>
      </div>
      <div class="comparison-row" style="">
        <span class="comp-label">@ 18% p.a.</span>
        <span class="comp-value positive">₹91,92,089</span>
      </div></div>
            </div>
          </div>
        </div>
      </div>

      <!-- EMI SCHEDULE MAKER (Redesigned) -->
      <div class="tab-content" id="content-schedule">
        <div class="sched-maker-layout">

          <!-- Left: Controls -->
          <div class="sched-controls">
            <h2 class="calc-title">Repayment Schedule Generator</h2>
            <p class="calc-desc">Generate a professional loan repayment schedule with frequency &amp; day convention options</p>

            <!-- Frequency -->
            <div class="sched-field-group">
              <div class="sched-field-label">Frequency</div>
              <div class="sched-radio-grid">
                <label class="sched-radio"><input type="radio" name="sched-freq" value="monthly" checked="" onchange="onSchedChange()"><span>Monthly</span></label>
                <label class="sched-radio"><input type="radio" name="sched-freq" value="quarterly" onchange="onSchedChange()"><span>Quarterly</span></label>
                <label class="sched-radio"><input type="radio" name="sched-freq" value="biannually" onchange="onSchedChange()"><span>Bi-annually</span></label>
                <label class="sched-radio"><input type="radio" name="sched-freq" value="annually" onchange="onSchedChange()"><span>Annually</span></label>
              </div>
            </div>

            <!-- Days Convention -->
            <div class="sched-field-group">
              <div class="sched-field-label">Days Convention</div>
              <div class="sched-radio-grid">
                <label class="sched-radio"><input type="radio" name="sched-days" value="30/360" checked="" onchange="onSchedChange()"><span>30/360</span></label>
                <label class="sched-radio"><input type="radio" name="sched-days" value="actual/365" onchange="onSchedChange()"><span>Actual/365</span></label>
                <label class="sched-radio"><input type="radio" name="sched-days" value="actual/actual" onchange="onSchedChange()"><span>Actual/Actual</span></label>
              </div>
            </div>

            <!-- Core Inputs -->
            <div class="sched-inputs-row">
              <div class="sched-input-col">
                <label class="sched-input-label">Principal Amount (₹)</label>
                <div class="sched-input-wrap prefix">
                  <span class="sched-affix">₹</span>
                  <input type="number" id="sched-principal" class="sched-bare-input" placeholder="e.g. 1000000">
                </div>
              </div>
              <div class="sched-input-col">
                <label class="sched-input-label">Tenure (Months)</label>
                <input type="number" id="sched-tenure" class="sched-bare-input full" placeholder="e.g. 120">
              </div>
              <div class="sched-input-col">
                <label class="sched-input-label">Rate of Interest (%)</label>
                <div class="sched-input-wrap suffix">
                  <input type="number" id="sched-rate" class="sched-bare-input" placeholder="e.g. 10.5" step="0.01">
                  <span class="sched-affix">%</span>
                </div>
              </div>
            </div>

            <!-- Date Inputs -->
            <div class="sched-inputs-row two-col">
              <div class="sched-input-col">
                <label class="sched-input-label">Interest Start Date</label>
                <input type="date" id="sched-int-date" class="sched-bare-input full">
              </div>
              <div class="sched-input-col">
                <label class="sched-input-label">Repayment Start Date</label>
                <input type="date" id="sched-rep-date" class="sched-bare-input full">
              </div>
            </div>

            <!-- Broken Period -->
            <div class="sched-field-group">
              <div class="sched-field-label">Include Broken Period Interest Separately</div>
              <div class="sched-radio-grid">
                <label class="sched-radio"><input type="radio" name="sched-broken" value="yes"><span>Yes</span></label>
                <label class="sched-radio"><input type="radio" name="sched-broken" value="no" checked=""><span>No</span></label>
              </div>
            </div>

            <!-- Buttons -->
            <div class="sched-actions">
              <button class="sched-btn outline" id="sched-download-btn" onclick="downloadScheduleCSV()" disabled="">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 8v2h14v-2H5z" fill="currentColor"></path></svg>
                DOWNLOAD SCHEDULE
              </button>
              <button class="sched-btn solid" onclick="generateSchedule()">
                GENERATE SCHEDULE
              </button>
            </div>
          </div>

          <!-- Right: Output -->
          <div class="sched-table-panel">
            <div class="sched-empty-state" id="sched-empty">
              <div class="sched-empty-icon">📋</div>
              <h3>Schedule Not Generated</h3>
              <p>Fill in the loan details on the left and click <strong>Generate Schedule</strong></p>
            </div>
            <div id="sched-output" style="display:none">
              <div class="sched-table-topbar">
                <div class="sched-summary-pills">
                  <div class="sched-pill">
                    <span class="sched-pill-label">Installment</span>
                    <span class="sched-pill-value" id="sched-emi">—</span>
                  </div>
                  <div class="sched-pill teal">
                    <span class="sched-pill-label">Total Interest</span>
                    <span class="sched-pill-value" id="sched-total-interest">—</span>
                  </div>
                  <div class="sched-pill">
                    <span class="sched-pill-label">Total Payable</span>
                    <span class="sched-pill-value" id="sched-total-amount">—</span>
                  </div>
                  <div class="sched-pill purple">
                    <span class="sched-pill-label">Payments</span>
                    <span class="sched-pill-value" id="sched-row-count">—</span>
                  </div>
                </div>
              </div>
              <div class="sched-scroll-wrap">
                <table class="full-sched-table">
                  <thead>
                    <tr>
                      <th>Inst. No.</th>
                      <th>Due Date</th>
                      <th>Opening Bal.</th>
                      <th>Installment</th>
                      <th class="col-princ">Principal</th>
                      <th class="col-int">Interest</th>
                      <th>Closing Bal.</th>
                    </tr>
                  </thead>
                  <tbody id="sched-tbody"></tbody>
                </table>
              </div>
              <div class="sched-pagination">
                <button class="sched-page-btn" id="sched-prev" onclick="schedPage(-1)">‹ Prev</button>
                <span class="sched-page-info" id="sched-page-info">Page 1 of 1</span>
                <button class="sched-page-btn" id="sched-next" onclick="schedPage(1)">Next ›</button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- SMART SUGGESTIONS -->
      <div class="tab-content" id="content-suggestions">
        <div class="suggestions-layout">
          <div class="suggestions-form">
            <h2 class="calc-title">Smart Financial Advisor</h2>
            <p class="calc-desc">Tell us about your financial profile and get personalized advice</p>

            <div class="form-grid">
              <div class="form-group">
                <label>Monthly Income</label>
                <div class="input-with-prefix">
                  <span>₹</span>
                  <input type="number" id="sg-income" value="80000" placeholder="80000" oninput="generateSuggestions()">
                </div>
              </div>
              <div class="form-group">
                <label>Monthly Expenses</label>
                <div class="input-with-prefix">
                  <span>₹</span>
                  <input type="number" id="sg-expenses" value="45000" placeholder="45000" oninput="generateSuggestions()">
                </div>
              </div>
              <div class="form-group">
                <label>Existing EMI Obligations</label>
                <div class="input-with-prefix">
                  <span>₹</span>
                  <input type="number" id="sg-emi" value="10000" placeholder="0" oninput="generateSuggestions()">
                </div>
              </div>
              <div class="form-group">
                <label>Current Savings</label>
                <div class="input-with-prefix">
                  <span>₹</span>
                  <input type="number" id="sg-savings" value="200000" placeholder="0" oninput="generateSuggestions()">
                </div>
              </div>
              <div class="form-group">
                <label>Age</label>
                <input type="number" id="sg-age" value="30" placeholder="30" min="18" max="65" oninput="generateSuggestions()">
              </div>
              <div class="form-group">
                <label>Risk Appetite</label>
                <select id="sg-risk" onchange="generateSuggestions()">
                  <option value="low">Conservative (Low)</option>
                  <option value="medium" selected="">Balanced (Medium)</option>
                  <option value="high">Aggressive (High)</option>
                </select>
              </div>
              <div class="form-group full-width">
                <label>Financial Goals</label>
                <div class="goals-selector" id="goals-selector">
                  <button class="goal-btn active" onclick="toggleGoal(this, 'home')">🏠 Buy Home</button>
                  <button class="goal-btn active" onclick="toggleGoal(this, 'retirement')">🌅 Retirement</button>
                  <button class="goal-btn" onclick="toggleGoal(this, 'education')">🎓 Child Education</button>
                  <button class="goal-btn" onclick="toggleGoal(this, 'car')">🚗 Buy Car</button>
                  <button class="goal-btn" onclick="toggleGoal(this, 'travel')">✈️ Travel</button>
                  <button class="goal-btn" onclick="toggleGoal(this, 'emergency')">🛡️ Emergency Fund</button>
                </div>
              </div>
            </div>
          </div>

          <div class="suggestions-results" id="suggestions-results">
    
    <div class="finance-health-card">
      <div class="health-score-wrap">
        <div class="health-score-ring">
          <svg viewBox="0 0 80 80" width="80" height="80">
            <circle class="health-ring-bg" cx="40" cy="40" r="35"></circle>
            <circle class="health-ring-fg" cx="40" cy="40" r="35" stroke="#00D4AA" stroke-dasharray="173.73007374351556 219.9114857512855" stroke-dashoffset="54.97787143782138"></circle>
          </svg>
          <div class="health-score-num" style="color:#00D4AA">79</div>
        </div>
        <div class="health-details">
          <h3>Financial Health: <span style="color:#00D4AA">Excellent</span></h3>
          <p>Based on your savings rate, debt ratio, and emergency fund status.</p>
        </div>
      </div>
      <div class="health-metrics">
        <div class="metric-item">
          <div class="metric-label">Monthly Surplus</div>
          <div class="metric-value" style="color:#00D4AA">₹25,000</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Savings Rate</div>
          <div class="metric-value" style="color:#00D4AA">31.3%</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Debt-to-Income</div>
          <div class="metric-value" style="color:#00D4AA">12.5%</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Recommended SIP</div>
          <div class="metric-value">₹12,500</div>
        </div>
      </div>
    </div>
    
    <div class="suggestion-card">
      <div class="sug-header">
        <div class="sug-icon">🛡️</div>
        <div>
          <div class="sug-title">Build Your Emergency Fund First</div>
          <div class="sug-desc">You need ₹70,000 more to have a 6-month emergency cushion. Keep this in a liquid fund or high-yield savings account.</div>
        </div>
      </div>
      <div class="sug-tags"><span class="sug-tag ">Priority 1</span><span class="sug-tag purple">Liquid Fund</span><span class="sug-tag ">Safety Net</span></div>
    </div>
    <div class="suggestion-card">
      <div class="sug-header">
        <div class="sug-icon">📊</div>
        <div>
          <div class="sug-title">Recommended Portfolio Allocation (Medium)</div>
          <div class="sug-desc">Equity: 50% | Debt: 35% | Gold: 10% | Liquid: 5%. For a monthly SIP of ₹12,500, invest ₹6,250 in equity funds.</div>
        </div>
      </div>
      <div class="sug-tags"><span class="sug-tag ">Asset Allocation</span><span class="sug-tag purple">Balanced</span></div>
    </div>
    <div class="suggestion-card">
      <div class="sug-header">
        <div class="sug-icon">🌅</div>
        <div>
          <div class="sug-title">Retirement Planning</div>
          <div class="sug-desc">To retire comfortably at 60, you need ~₹2,40,00,000 corpus. Start a SIP of ₹6,799/month at 12% expected returns. NPS + ELSS combo can also save tax.</div>
        </div>
      </div>
      <div class="sug-tags"><span class="sug-tag ">Long Term</span><span class="sug-tag purple">NPS</span><span class="sug-tag ">ELSS</span><span class="sug-tag amber">80C Benefit</span></div>
    </div>
    <div class="suggestion-card">
      <div class="sug-header">
        <div class="sug-icon">🏠</div>
        <div>
          <div class="sug-title">Home Purchase Planning</div>
          <div class="sug-desc">For a home worth ₹48,00,000, save ₹9,60,000 as down payment. Consider a home loan of ₹38,40,000 — your EMI eligibility at current income is ~₹32,000/month.</div>
        </div>
      </div>
      <div class="sug-tags"><span class="sug-tag ">Home Loan</span><span class="sug-tag purple">Down Payment</span><span class="sug-tag ">20% Rule</span></div>
    </div>
    <div class="suggestion-card">
      <div class="sug-header">
        <div class="sug-icon">💰</div>
        <div>
          <div class="sug-title">Tax Saving Strategies</div>
          <div class="sug-desc">Maximize 80C deductions (₹1.5L) via ELSS/PPF. Also consider NPS (80CCD – ₹50K extra). Health insurance (80D) and HRA benefits can further reduce your tax outgo.</div>
        </div>
      </div>
      <div class="sug-tags"><span class="sug-tag amber">Tax Saving</span><span class="sug-tag ">80C</span><span class="sug-tag purple">80CCD</span><span class="sug-tag ">ELSS/PPF</span></div>
    </div>
  </div>
        </div>
      </div>
    </div>
  </section>

  <!-- FEATURES SECTION -->
  <section class="features-section">
    <div class="section-header">
      <h2>Why Choose Synoriq?</h2>
      <p>Trusted by lakhs of Indians for smart financial planning</p>
    </div>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">⚡</div>
        <h3>Instant Calculations</h3>
        <p>Real-time results as you adjust sliders — no page refreshes needed</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🧠</div>
        <h3>AI-Powered Insights</h3>
        <p>Get personalized financial advice based on your income and goals</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📊</div>
        <h3>Visual Analytics</h3>
        <p>Interactive charts make understanding your finances simple and clear</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🔒</div>
        <h3>100% Secure</h3>
        <p>Your data never leaves your browser — complete privacy guaranteed</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📱</div>
        <h3>Mobile Friendly</h3>
        <p>Fully responsive design works perfectly on all devices</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🎯</div>
        <h3>Goal-Based Planning</h3>
        <p>Set financial goals and track the best path to achieve them</p>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-brand">
        <div class="nav-logo">
          <div class="logo-icon">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <path d="M4 20L10 12L16 16L22 8" stroke="#00D4AA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
              <circle cx="4" cy="20" r="2.5" fill="#00D4AA"></circle>
              <circle cx="22" cy="8" r="2.5" fill="#7C3AED"></circle>
            </svg>
          </div>
          <span class="logo-text">Synoriq</span>
        </div>
        <p>Empowering smarter financial decisions for every Indian.</p>
      </div>
      <div class="footer-links">
        <h4>Calculators</h4>
        <a href="#" onclick="switchTab('emi')">EMI Calculator</a>
        <a href="#" onclick="switchTab('sip')">SIP Calculator</a>
        <a href="#" onclick="switchTab('suggestions')">Smart Advisor</a>
        <a href="#" onclick="switchTab('schedule')">Schedule Maker</a>
      </div>
      <div class="footer-links">
        <h4>Company</h4>
        <a href="#">About Us</a>
        <a href="#">Careers</a>
        <a href="#">Blog</a>
        <a href="#">Contact</a>
      </div>
      <div class="footer-links">
        <h4>Legal</h4>
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="#">Disclaimer</a>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© 2025 Synoriq Financial Services. All rights reserved.</p>
      <p class="disclaimer">*All calculations are indicative. Please consult a financial advisor before making investment decisions.</p>
    </div>
  </footer>

  <script src="app.js"></script>


</body>
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

// ─── SCHEDULE MAKER (Redesigned) ─────────────────────────────────────────────
let scheduleData = [];
let schedCurrentPage = 1;
const SCHED_PAGE_SIZE = 15;

function onSchedChange() { /* inputs changed — user must click Generate */ }

function getRadio(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : null;
}

function addMonthsByFreq(date, freq, count) {
  const d = new Date(date);
  const months = { monthly: 1, quarterly: 3, biannually: 6, annually: 12 }[freq] || 1;
  d.setMonth(d.getMonth() + months * count);
  return d;
}

function periodsPerYear(freq) {
  return { monthly: 12, quarterly: 4, biannually: 2, annually: 1 }[freq] || 12;
}

function daysBetween(d1, d2, convention) {
  if (convention === '30/360') {
    const y1 = d1.getFullYear(), m1 = d1.getMonth() + 1, day1 = Math.min(d1.getDate(), 30);
    const y2 = d2.getFullYear(), m2 = d2.getMonth() + 1, day2 = Math.min(d2.getDate(), 30);
    return (y2 - y1) * 360 + (m2 - m1) * 30 + (day2 - day1);
  }
  const ms = d2 - d1;
  return ms / (1000 * 60 * 60 * 24);
}

function generateSchedule() {
  const P      = parseFloat(document.getElementById('sched-principal').value);
  const tenure = parseInt(document.getElementById('sched-tenure').value);
  const rate   = parseFloat(document.getElementById('sched-rate').value);
  const intDateVal = document.getElementById('sched-int-date').value;
  const repDateVal = document.getElementById('sched-rep-date').value;
  const freq   = getRadio('sched-freq') || 'monthly';
  const conv   = getRadio('sched-days') || '30/360';
  const broken = getRadio('sched-broken') || 'no';

  if (!P || !tenure || !rate || !intDateVal || !repDateVal) {
    alert('Please fill in all required fields before generating the schedule.');
    return;
  }

  const intStartDate = new Date(intDateVal);
  const repStartDate = new Date(repDateVal);
  const ppy = periodsPerYear(freq);
  const r = rate / 100 / ppy;
  const n = tenure; // tenure already in months; convert to periods
  const numPeriods = Math.round(tenure * ppy / 12);
  const emi = r === 0 ? P / numPeriods : P * r * Math.pow(1 + r, numPeriods) / (Math.pow(1 + r, numPeriods) - 1);

  // Broken period interest (interest from intStartDate to repStartDate)
  let brokenRows = [];
  if (broken === 'yes' && repStartDate > intStartDate) {
    const bDays = daysBetween(intStartDate, repStartDate, conv);
    const yearDays = conv === '30/360' ? 360 : 365;
    const bInt = P * (rate / 100) * (bDays / yearDays);
    brokenRows.push({ isBroken: true, no: 'B', date: repStartDate.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }), opening: P, emi: bInt, principal: 0, interest: bInt, closing: P });
  }

  scheduleData = [...brokenRows];
  let balance = P;

  for (let i = 1; i <= numPeriods && balance > 0.005; i++) {
    const intP = balance * r;
    const princP = Math.min(emi - intP, balance);
    const actualEMI = intP + princP;
    const closing = Math.max(0, balance - princP);
    const dueDate = addMonthsByFreq(repStartDate, freq, i - 1);
    const dateStr = dueDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    scheduleData.push({ isBroken: false, no: i, date: dateStr, opening: balance, emi: actualEMI, principal: princP, interest: intP, closing });
    balance = closing;
  }

  const totalInt = scheduleData.reduce((s, d) => s + d.interest, 0);
  const totalAmt = scheduleData.reduce((s, d) => s + d.emi, 0);

  document.getElementById('sched-emi').textContent = fmt(emi);
  document.getElementById('sched-total-interest').textContent = fmt(totalInt);
  document.getElementById('sched-total-amount').textContent = fmt(totalAmt);
  document.getElementById('sched-row-count').textContent = `${numPeriods} payments`;

  document.getElementById('sched-empty').style.display = 'none';
  document.getElementById('sched-output').style.display = 'block';
  const dlBtn = document.getElementById('sched-download-btn');
  if (dlBtn) dlBtn.disabled = false;

  schedCurrentPage = 1;
  renderSchedPage();
}

function renderSchedPage() {
  const tbody = document.getElementById('sched-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const total = scheduleData.length;
  const totalPages = Math.ceil(total / SCHED_PAGE_SIZE);
  const start = (schedCurrentPage - 1) * SCHED_PAGE_SIZE;
  const slice = scheduleData.slice(start, start + SCHED_PAGE_SIZE);

  slice.forEach(d => {
    const tr = document.createElement('tr');
    tr.className = d.isBroken ? 'sched-broken-row' : (d.closing < 0.01 ? 'sched-last-row' : '');
    tr.innerHTML = `
      <td class="sched-num">${d.isBroken ? 'BPI' : d.no}</td>
      <td class="sched-date">${d.date}</td>
      <td class="sched-money">${fmt(d.opening)}</td>
      <td class="sched-money">${fmt(d.emi)}</td>
      <td class="sched-money col-princ">${fmt(d.principal)}</td>
      <td class="sched-money col-int">${fmt(d.interest)}</td>
      <td class="sched-money">${fmt(d.closing)}</td>`;
    tbody.appendChild(tr);
  });

  document.getElementById('sched-page-info').textContent = `Page ${schedCurrentPage} of ${totalPages}`;
  document.getElementById('sched-prev').disabled = schedCurrentPage <= 1;
  document.getElementById('sched-next').disabled = schedCurrentPage >= totalPages;
}

function schedPage(dir) {
  const total = scheduleData.length;
  const totalPages = Math.ceil(total / SCHED_PAGE_SIZE);
  schedCurrentPage = Math.max(1, Math.min(totalPages, schedCurrentPage + dir));
  renderSchedPage();
}

function downloadScheduleCSV() {
  if (!scheduleData.length) return;
  const headers = ['Inst. No.','Due Date','Opening Balance','Installment','Principal','Interest','Closing Balance'];
  const rows = scheduleData.map(d => [
    d.isBroken ? 'BPI' : d.no, d.date,
    Math.round(d.opening), Math.round(d.emi),
    Math.round(d.principal), Math.round(d.interest), Math.round(d.closing)
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'repayment-schedule-synoriq.csv'; a.click();
  URL.revokeObjectURL(url);
}

function printSchedule() { window.print(); }

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


