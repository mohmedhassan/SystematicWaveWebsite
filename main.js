/* ================= Systematic Wave — main.js ================= */
history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const range = (v, a, b) => clamp((v - a) / (b - a));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Smooth scroll (Lenis) ---------- */
let lenis = null;
if (window.Lenis && !reduceMotion) {
  lenis = new Lenis({
    duration: 1.25,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.stop();
}

/* ---------- Loader ---------- */
$$('[data-split]').forEach(el => {
  const text = el.textContent.trim();
  el.textContent = '';
  [...text].forEach((ch, i) => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.textContent = ch;
    s.style.animationDelay = `${0.15 + i * 0.06}s`;
    el.appendChild(s);
  });
});

const loader = $('#loader');
const bar = $('#loaderBar');
const count = $('#loaderCount');
let progress = 0;
let pageReady = false;
let introStart = null;

window.addEventListener('load', () => (pageReady = true));
setTimeout(() => (pageReady = true), 6000); // أمان لو الصفحة اتأخرت

function loadTick() {
  const cap = pageReady ? 100 : 90;
  progress = Math.min(cap, progress + Math.random() * 1.6 + (pageReady ? 1.2 : 0.25));
  bar.style.width = progress + '%';
  count.textContent = String(Math.floor(progress)).padStart(2, '0') + '%';
  if (progress >= 100) return setTimeout(finishLoading, 400);
  requestAnimationFrame(loadTick);
}
requestAnimationFrame(loadTick);

function finishLoading() {
  loader.classList.add('done');
  document.body.classList.remove('is-loading');
  document.body.classList.add('loaded');
  introStart = performance.now();
  lenis?.start();
  setTimeout(() => loader.remove(), 1300);
}

/* ---------- Hero: الكورتين + السكرول ---------- */
const hero = $('#home');
const heroSticky = $('.hero__sticky');
const orbTop = $('#orbTop');
const orbBottom = $('#orbBottom');
const heroContent = $('#heroContent');
const heroMerge = $('#heroMerge');
const scrollHint = $('#scrollHint');
const layers = $$('.layer');
const stack = [heroSticky, ...layers];

let sp = 0;                       // progress ناعم
let mx = 0, my = 0, smx = 0, smy = 0;

window.addEventListener('mousemove', e => {
  mx = e.clientX / innerWidth - 0.5;
  my = e.clientY / innerHeight - 0.5;
});

function heroProgress() {
  const total = hero.offsetHeight - innerHeight * 2; // آخر شاشة محجوزة لدخول اللير الجديد
  return clamp(-hero.getBoundingClientRect().top / total);
}

function renderHero(now) {
  sp += (heroProgress() - sp) * 0.09;
  smx += (mx - smx) * 0.05;
  smy += (my - smy) * 0.05;

  const intro = introStart ? easeOut(clamp((now - introStart) / 1800)) : 0;
  const join = easeInOut(range(sp, 0, 0.55));   // الكورتين بيقربوا
  const grow = easeInOut(range(sp, 0.5, 1));    // بعد الاندماج بيكبروا ويملوا الشاشة

const gap = (42 + 45 * (1 - intro)) * (1 - join);
const scale = (0.85 + 0.15 * intro) * (1 + grow * 0.12); // تكبر شوية بس وتفضل دايرة في النص
const px = smx * 30 * (1 - join);
const py = smy * 20 * (1 - join);

	orbTop.style.transform =
	  `translate(calc(-50% + ${px}px), calc(-50% - ${gap}% + ${py}px)) scale(${scale})`;
	orbBottom.style.transform =
	  `translate(calc(-50% - ${px}px), calc(-50% + ${gap}% - ${py}px)) scale(${scale})`;

  // النص الأساسي يختفي مع أول السكرول
  const out = range(sp, 0, 0.22);
  heroContent.style.opacity = 1 - out;
  heroContent.style.transform = `translateY(${-out * 90}px) scale(${1 - out * 0.06})`;
  heroContent.style.filter = `blur(${out * 12}px)`;
  heroContent.style.pointerEvents = out > 0.5 ? 'none' : 'auto';

  // نص الاندماج
  const mIn = easeOut(range(sp, 0.4, 0.58));
  const mOut = range(sp, 0.82, 0.97);
  heroMerge.style.opacity = mIn * (1 - mOut);
  heroMerge.style.transform =
    `translate(-50%, -50%) translateY(${(1 - mIn) * 50 - mOut * 60}px) scale(${0.92 + mIn * 0.08})`;
  heroMerge.style.filter = `blur(${(1 - mIn) * 10 + mOut * 10}px)`;

  scrollHint.style.opacity = (1 - range(sp, 0, 0.06)) * intro;
}

/* ---------- Layer stacking ---------- */
function renderStack() {
  for (let i = 0; i < stack.length - 1; i++) {
    const nextTop = stack[i + 1].getBoundingClientRect().top;
    const c = clamp(1 - nextTop / innerHeight);
    const target = i === 0 ? stack[i] : stack[i].firstElementChild;
    target.style.transform = c > 0 ? `scale(${1 - c * 0.08}) translateY(${-c * 4}vh)` : '';
    stack[i].style.setProperty('--dim', (c * 0.7).toFixed(3));
  }
}

/* ---------- Nav ---------- */
const nav = $('#nav');
$('#burger').addEventListener('click', () => nav.classList.toggle('open'));

function targetY(el) {
  if (el === hero) return 0;
  const i = layers.indexOf(el);
  if (i > -1 && innerWidth > 960) return hero.offsetHeight - innerHeight + i * innerHeight;
  return el.getBoundingClientRect().top + scrollY;
}

$$('a[href^="#"]').forEach(a =>
  a.addEventListener('click', e => {
    const el = $(a.getAttribute('href'));
    if (!el) return;
    e.preventDefault();
    nav.classList.remove('open');
    const y = targetY(el);
    lenis ? lenis.scrollTo(y, { duration: 1.8 }) : scrollTo({ top: y, behavior: 'smooth' });
  })
);

/* ---------- Reveal + counters ---------- */
const io = new IntersectionObserver(
  entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in');
    io.unobserve(en.target);
  }),
  { threshold: 0.2 }
);
$$('.reveal').forEach(el => {
  const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
  el.style.transitionDelay = sibs.indexOf(el) * 0.09 + 's';
  io.observe(el);
});

const cio = new IntersectionObserver(
  entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    const end = +el.dataset.count;
    const t0 = performance.now();
    const step = t => {
      const k = easeOut(clamp((t - t0) / 1600));
      el.textContent = Math.round(end * k);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    cio.unobserve(el);
  }),
  { threshold: 0.6 }
);
$$('[data-count]').forEach(el => cio.observe(el));

/* ---------- Main loop ---------- */
function loop(now) {
  lenis?.raf(now);
  renderHero(now);
  renderStack();
  nav.classList.toggle('scrolled', scrollY > 40);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);