const $ = s => document.querySelector(s),
  css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim(),
  root = document.documentElement;
$('#yr').textContent = new Date().getFullYear();

/* photo, progress, glow */
const PHOTO = 'orin.jpg'; // optional: permanent photo, e.g. 'photo.jpg' or a hosted image URL
function showPhoto(src) { $('#photoImg').src = src; $('#photoImg').hidden = false }
let saved = ''; try { saved = localStorage.getItem('rso_photo') || '' } catch (e) { }
if (PHOTO) showPhoto(PHOTO); else if (saved) showPhoto(saved);
$('#avatarBtn').onclick = () => $('#photoIn').click();
$('#avatarBtn').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#photoIn').click() } };
$('#photoIn').onchange = e => {
  const f = e.target.files[0]; if (!f) return; const rd = new FileReader();
  rd.onload = () => {
    const im = new Image(); im.onload = () => {
      const s = 400, c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d'), m = Math.min(im.width, im.height);
      x.drawImage(im, (im.width - m) / 2, (im.height - m) / 2, m, m, 0, 0, s, s); const url = c.toDataURL('image/jpeg', .85); showPhoto(url); try { localStorage.setItem('rso_photo', url) } catch (err) { }
    }; im.src = rd.result
  }; rd.readAsDataURL(f)
};
addEventListener('scroll', () => { $('#prog').style.width = scrollY / (document.body.scrollHeight - innerHeight) * 100 + '%' });
if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
  addEventListener('pointermove', e => { $('#glow').style.left = e.clientX + 'px'; $('#glow').style.top = e.clientY + 'px' });
}

/* typing + counters */
const words = ['patterns.', 'insights.', 'forecasts.', 'answers.']; let wi = 0, ci = 0, del = false;
(function type() { const w = words[wi]; $('#typed').textContent = w.slice(0, ci); if (!del && ci === w.length) { del = true; return setTimeout(type, 1400) } if (del && ci === 0) { del = false; wi = (wi + 1) % words.length } ci += del ? -1 : 1; setTimeout(type, del ? 40 : 80) })();
document.querySelectorAll('[data-count]').forEach(el => { const n = +el.dataset.count; let i = 0; const id = setInterval(() => { i = Math.min(n, i + Math.max(1, Math.ceil(n / 30))); el.textContent = i + '+'; if (i >= n) clearInterval(id) }, 40) });

/* neural-network background */
const nc = $('#net'), nx = nc.getContext('2d'); let nodes = [], mouse = { x: -999, y: -999 };
function nsize() { const r = nc.getBoundingClientRect(), d = devicePixelRatio || 1; nc.width = r.width * d; nc.height = r.height * d; nx.setTransform(d, 0, 0, d, 0, 0); nodes = Array.from({ length: Math.round(r.width / 16) }, () => ({ x: Math.random() * r.width, y: Math.random() * r.height, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4 })) }
nc.parentElement.addEventListener('pointermove', e => { const r = nc.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top } });
const still = matchMedia('(prefers-reduced-motion:reduce)').matches;
(function loop() {
  const r = nc.getBoundingClientRect(); nx.clearRect(0, 0, r.width, r.height);
  nodes.forEach((p, i) => {
    if (!still) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > r.width) p.vx *= -1; if (p.y < 0 || p.y > r.height) p.vy *= -1 }
    nx.fillStyle = css('--b'); nx.beginPath(); nx.arc(p.x, p.y, 1.8, 0, 7); nx.fill();
    for (let j = i + 1; j < nodes.length; j++) { const q = nodes[j], d = Math.hypot(p.x - q.x, p.y - q.y); if (d < 90) { nx.strokeStyle = css('--a'); nx.globalAlpha = 1 - d / 90; nx.beginPath(); nx.moveTo(p.x, p.y); nx.lineTo(q.x, q.y); nx.stroke(); nx.globalAlpha = 1 } }
    const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y); if (dm < 130) { nx.strokeStyle = css('--c'); nx.globalAlpha = 1 - dm / 130; nx.beginPath(); nx.moveTo(p.x, p.y); nx.lineTo(mouse.x, mouse.y); nx.stroke(); nx.globalAlpha = 1 }
  });
  requestAnimationFrame(loop)
})();

/* regression playground */
const cv = $('#reg'), cx = cv.getContext('2d'); let pts = [], W, H, line = null, raf;
function size() { const r = cv.getBoundingClientRect(), d = devicePixelRatio || 1; cv.width = r.width * d; cv.height = r.height * d; cx.setTransform(d, 0, 0, d, 0, 0); W = r.width; H = r.height; draw(); nsize() }
function seed() { pts = []; const m = .4 + Math.random() * .5, b = .1 + Math.random() * .2; for (let i = 0; i < 22; i++) { const x = .05 + Math.random() * .9; pts.push([x, Math.min(.97, Math.max(.03, m * x + b + (Math.random() - .5) * .22))]) } line = null }
function fit() {
  const n = pts.length; if (n < 2) { ['m', 'b', 'r2', 'mse'].forEach(k => $('#' + k).textContent = '–'); return null }
  const mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n; let sxy = 0, sxx = 0; pts.forEach(p => { sxy += (p[0] - mx) * (p[1] - my); sxx += (p[0] - mx) ** 2 });
  const m = sxx ? sxy / sxx : 0, b = my - m * mx; stats(m, b); return { m, b }
}
function stats(m, b) {
  const n = pts.length, my = pts.reduce((a, p) => a + p[1], 0) / n, sse = pts.reduce((a, p) => a + (p[1] - (m * p[0] + b)) ** 2, 0), sst = pts.reduce((a, p) => a + (p[1] - my) ** 2, 0);
  $('#m').textContent = m.toFixed(3); $('#b').textContent = b.toFixed(3); $('#r2').textContent = sst ? (1 - sse / sst).toFixed(3) : '–'; $('#mse').textContent = (sse / n).toFixed(4)
}
function draw() {
  if (!W) return; cx.clearRect(0, 0, W, H); cx.strokeStyle = css('--line'); for (let i = 1; i < 5; i++) { cx.beginPath(); cx.moveTo(0, H * i / 5); cx.lineTo(W, H * i / 5); cx.stroke() }
  const L = line || fit(); if (L) { cx.strokeStyle = css('--a'); cx.lineWidth = 2.5; cx.beginPath(); cx.moveTo(0, H - L.b * H); cx.lineTo(W, H - (L.m + L.b) * H); cx.stroke() }
  cx.fillStyle = css('--c'); pts.forEach(p => { cx.beginPath(); cx.arc(p[0] * W, H - p[1] * H, 5, 0, 7); cx.fill() })
}
cv.addEventListener('pointerdown', e => { cancelAnimationFrame(raf); const r = cv.getBoundingClientRect(); pts.push([(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height]); line = null; $('#epoch').textContent = ''; draw() });
$('#reset').onclick = () => { cancelAnimationFrame(raf); seed(); $('#epoch').textContent = ''; draw() };
$('#clear').onclick = () => { cancelAnimationFrame(raf); pts = []; line = null; $('#epoch').textContent = ''; draw() };
$('#train').onclick = () => {
  if (pts.length < 2) { $('#epoch').textContent = 'Add at least 2 points first.'; return } cancelAnimationFrame(raf);
  let m = Math.random() * 2 - 1, b = Math.random(), ep = 0; const lr = .3, n = pts.length, t = (line = null, fit());
  (function step() {
    for (let k = 0; k < 4; k++) { let gm = 0, gb = 0; pts.forEach(p => { const e = m * p[0] + b - p[1]; gm += e * p[0]; gb += e }); m -= lr * 2 * gm / n; b -= lr * 2 * gb / n; ep++ }
    line = { m, b }; stats(m, b); draw(); $('#epoch').textContent = `Epoch ${ep}: the line is descending toward the least-squares fit.`;
    if (ep < 400 && (Math.abs(m - t.m) > .002 || Math.abs(b - t.b) > .002)) raf = requestAnimationFrame(step); else $('#epoch').textContent = `Converged after ${ep} epochs.`
  })()
};
addEventListener('resize', size); seed(); size();

/* skills */
const S = {
  'Programming': [['Python', 92], ['C', 72], ['C++', 74], ['Java', 70], ['JavaScript', 76]],
  'Data & Analytics': [['Data Analysis', 92], ['Data Cleaning', 94], ['Data Visualization', 90], ['Excel', 88], ['Pandas', 93], ['NumPy', 88], ['Matplotlib', 86]],
  'Database': [['SQL', 90], ['MySQL', 88]],
  'Machine Learning': [['Machine Learning', 85]],
  'Business Intelligence': [['Power BI', 90], ['DAX', 82], ['Power Query', 86]],
  'Tools & Platforms': [['Git', 85], ['GitHub', 88], ['Jupyter Notebook', 94]],
  'Soft Skills': ['Problem Solving', 'Analytical Thinking', 'Research', 'Communication', 'Teamwork', 'Time Management', 'Presentation', 'Self-Learning']
};
const keys = Object.keys(S); let cat = keys[0];
function skills() {
  $('#skTabs').innerHTML = keys.map(k => `<button role="tab" class="chip ${k === cat ? 'on' : ''}" data-k="${k}">${k}</button>`).join('');
  const v = S[cat]; $('#skBody').innerHTML = Array.isArray(v[0]) ? v.map(s => `<div><div class="flex justify-between text-sm mb-1"><span>${s[0]}</span><span class="muted">${s[1]}%</span></div><div class="bar"><i data-w="${s[1]}"></i></div></div>`).join('') : `<div class="sm:col-span-2 flex flex-wrap gap-2">${v.map(s => `<span class="tag" style="font-size:.9rem;padding:.3rem .8rem">${s}</span>`).join('')}</div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => document.querySelectorAll('#skBody i').forEach(i => i.style.width = i.dataset.w + '%')));
  document.querySelectorAll('#skTabs .chip').forEach(b => b.onclick = () => { cat = b.dataset.k; skills() })
}
skills();
let radar; function buildRadar() {
  if (radar) radar.destroy(); const avg = k => Array.isArray(S[k][0]) ? Math.round(S[k].reduce((a, s) => a + s[1], 0) / S[k].length) : 85;
  radar = new Chart($('#radar'), {
    type: 'radar', data: { labels: keys.map(k => k.replace(' & ', ' &\n')), datasets: [{ data: keys.map(avg), borderColor: css('--a'), backgroundColor: css('--a') + '33', pointBackgroundColor: css('--b') }] },
    options: { plugins: { legend: { display: false } }, scales: { r: { min: 50, max: 100, ticks: { display: false }, grid: { color: css('--line') }, angleLines: { color: css('--line') }, pointLabels: { color: css('--ink'), font: { size: 11 } } } } }
  })
}
buildRadar();

/* projects */
const P = [
  { t: 'Customer churn predictor', c: 'Machine Learning', d: 'Classification model in scikit-learn that flags customers likely to leave, with feature importance.', s: ['Python', 'Pandas', 'Jupyter'] },
  { t: 'Sales forecasting', c: 'Machine Learning', d: 'Time-series model on monthly sales, compared against a naive baseline.', s: ['Python', 'NumPy', 'Matplotlib'] },
  { t: 'Executive KPI dashboard', c: 'Business Intelligence', d: 'Power BI report with DAX measures and Power Query transforms over 1M+ rows.', s: ['Power BI', 'DAX', 'Power Query'] },
  { t: 'Fraud-Detection SQL analysis', c: 'Database', d: 'MySQL queries with joins, window functions and views answering revenue questions.', s: ['SQL', 'MySQL', 'Excel'] },
  { t: 'Data cleaning toolkit', c: 'Data Analysis', d: 'Reusable pandas functions that fix types, duplicates, outliers and missing values.', s: ['Pandas', 'NumPy', 'GitHub'] },
  { t: 'Exploratory data analysis', c: 'Data Analysis', d: 'End-to-end EDA notebook with charts and a written summary of findings.', s: ['Matplotlib', 'Jupyter', 'Excel'] }];
const cats = ['All', ...new Set(P.map(p => p.c))]; let cur = 'All';
function render() {
  $('#filters').innerHTML = cats.map(c => `<button class="chip ${c === cur ? 'on' : ''}" data-c="${c}">${c}</button>`).join('');
  $('#grid').innerHTML = P.filter(p => cur === 'All' || p.c === cur).map(p => `<article class="card lift p-5 flex flex-col"><p class="muted text-xs">${p.c}</p><h3 class="font-bold text-lg mt-1">${p.t}</h3><p class="muted text-sm mt-2 flex-1">${p.d}</p><div class="flex flex-wrap gap-1 mt-4">${p.s.map(x => `<span class="tag">${x}</span>`).join('')}</div></article>`).join('');
  document.querySelectorAll('#filters .chip').forEach(b => b.onclick = () => { cur = b.dataset.c; render() })
}
render();

/* certificates */
const C = [
  { t: 'Data Analytics Professional', i: 'Ostad · 2026', d: 'Covers data cleaning, analysis, SQL, spreadsheets and visualisation.', id: 'GDA-000001', ic: '📊' },
  { t: 'Power BI Data Analyst', i: 'Ostad · 2025', d: 'Data modelling, DAX measures and report design in Power BI.', id: 'PL300-000002', ic: '📈' },
  { t: 'Python for Data Science', i: 'FreeCode Camp · 2026', d: 'Python, pandas, NumPy and Matplotlib for data work.', id: 'IBM-PY-000003', ic: '🐍' },
  { t: 'Machine Learning Specialization', i: 'Coursera · 2025', d: 'Supervised and unsupervised learning, model evaluation and tuning.', id: 'ML-000004', ic: '🤖' },
  { t: 'SQL and Relational Databases', i: 'FreeCode Camp · 2024', d: 'Querying, joins, subqueries and database design with MySQL.', id: 'SQL-000005', ic: '🗄️' }];
$('#certGrid').innerHTML = C.map((c, n) => `<button class="card lift p-5 text-left" data-n="${n}"><div class="text-3xl">${c.ic}</div><h3 class="font-bold mt-3">${c.t}</h3><p class="muted text-sm">${c.i}</p><p class="acc text-sm mt-3" style="color:var(--a)">View details</p></button>`).join('');
const dlg = $('#dlg'); document.querySelectorAll('#certGrid button').forEach(b => b.onclick = () => { const c = C[b.dataset.n]; $('#dT').textContent = c.t; $('#dI').textContent = c.i; $('#dD').textContent = c.d; $('#dC').textContent = 'Credential ID: ' + c.id; dlg.showModal() });
$('#dX').onclick = () => dlg.close(); $('#dV').onclick = () => { $('#dC').textContent = 'Add your credential link here to enable verification.' };

/* effects */
document.addEventListener('pointermove', e => { const c = e.target.closest && e.target.closest('.card'); if (c) { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px') } });
if (!still && matchMedia('(hover:hover)').matches) {
  document.addEventListener('pointermove', e => {
    const c = e.target.closest && e.target.closest('.lift'); document.querySelectorAll('.lift').forEach(l => { if (l !== c) l.style.transform = '' });
    if (c) { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = `perspective(700px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateY(-4px)` }
  })
}
const rev = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('show'); rev.unobserve(e.target) } }), { threshold: .12 });
document.querySelectorAll('section>h2,section>p,.tl,.step,#skills .card,#contact .card').forEach(el => { el.classList.add('reveal'); rev.observe(el) });
const navL = [...document.querySelectorAll('header nav div a')];
const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) navL.forEach(a => a.classList.toggle('act', a.getAttribute('href') === '#' + e.target.id)) }), { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main>section[id]').forEach(x => spy.observe(x));
addEventListener('scroll', () => $('#top2').classList.toggle('on', scrollY > 600));

/* contact */
$('#send').onclick = () => {
  const n = $('#fn').value.trim(), e = $('#fe').value, m = $('#fm').value.trim();
  if (!(n && /\S+@\S+\.\S+/.test(e) && m)) { $('#msg').textContent = 'Enter your name, a valid email and a message.'; return }
  location.href = 'mailto:rsarin166@gmail.com?subject=' + encodeURIComponent('Message from ' + n) + '&body=' + encodeURIComponent(m + '\n\nReply to: ' + e); $('#msg').textContent = 'Opening your email app to send the message.'
};
