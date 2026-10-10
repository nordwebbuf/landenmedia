// NordenMedia v3: interactive features (6 -> 1, calculator, FAQ search,
// package finder, booking demo, name preview, report months, live destinations).
(() => {
  const en = document.documentElement.lang === 'en';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const locale = en ? 'en-GB' : 'sv-SE';
  const fmt = (n) => Math.round(n).toLocaleString(locale);
  const L = en ? {
    plans: { start: 'Start', foretag: 'Business', helhet: 'Complete' },
    log: (s, t) => [
      `Booking received: ${s}, tomorrow ${t}`,
      'Confirmation emailed to the customer',
      `Reminder scheduled for today at ${t}`,
      'Customer saved in the customer register',
      'Added to the list for follow-up mailings',
    ],
    months: { jul: 'July 2026', aug: 'August 2026', sep: 'September 2026' },
    pct: (v) => `${v}%`, count: (v) => `+${v}`,
    defaultName: 'Your Business', tld: '.com',
  } : {
    plans: { start: 'Start', foretag: 'Företag', helhet: 'Helhet' },
    log: (s, t) => [
      `Bokning mottagen: ${s}, i morgon ${t}`,
      'Bekräftelse mejlad till kunden',
      `Påminnelse schemalagd i dag kl. ${t}`,
      'Kunden sparad i kundregistret',
      'Tillagd i listan för uppföljande utskick',
    ],
    months: { jul: 'Juli 2026', aug: 'Augusti 2026', sep: 'September 2026' },
    pct: (v) => `${v} %`, count: (v) => `${v} st`,
    defaultName: 'Ert Företag', tld: '.se',
  };

  // Animate a number from its current value to a target
  const tween = (el, to, ms = 600) => {
    const from = parseFloat((el.textContent || '0').replace(/[^\d.-]/g, '')) || 0;
    if (reduce || from === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / ms, 1);
      el.textContent = fmt(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const plural = (scope, n) => scope.querySelectorAll('[data-plural]').forEach((w) => {
    const [one, many] = w.dataset.plural.split('|');
    w.textContent = n === 1 ? one : many;
  });
  const press = (group, btn) => group.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));

  // ---------- Header floats over the dark hero until the hero has scrolled past ----------
  const darkHero = document.querySelector('[data-hero-dark]');
  const siteHeader = document.querySelector('[data-header]');
  if (darkHero && siteHeader && 'IntersectionObserver' in window) {
    const update = () => siteHeader.classList.toggle('is-over-hero', darkHero.getBoundingClientRect().bottom > siteHeader.offsetHeight);
    new IntersectionObserver(update, { threshold: Array.from({ length: 41 }, (_, i) => i / 40) }).observe(darkHero);
    update();
  }

  // ---------- 1. Six suppliers become one ----------
  const merge = document.querySelector('[data-merge]');
  if (merge) {
    const btns = merge.querySelectorAll('[data-merge-btn]');
    const thumb = merge.querySelector('.merge-thumb');
    const counts = merge.querySelectorAll('[data-merge-count]');
    const vendors = merge.querySelectorAll('.vendor');
    const target = merge.querySelector('.panel-after');
    merge.querySelectorAll('.check-list li').forEach((li, i) => li.style.setProperty('--i', i));
    const placeThumb = () => {
      const on = merge.querySelector('[data-merge-btn][aria-pressed="true"]');
      thumb.style.width = `${on.offsetWidth}px`;
      thumb.style.transform = `translateX(${on.offsetLeft}px)`;
    };
    const set = (state) => {
      if (merge.dataset.state === state) return;
      if (state === 'after') {
        const tb = target.getBoundingClientRect();
        vendors.forEach((v, i) => {
          const b = v.getBoundingClientRect();
          v.style.setProperty('--dx', `${tb.left + tb.width / 2 - (b.left + b.width / 2)}px`);
          v.style.setProperty('--dy', `${tb.top + tb.height / 2 - (b.top + b.height / 2)}px`);
          v.style.setProperty('--i', i);
        });
      }
      merge.dataset.state = state;
      btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mergeBtn === state)));
      placeThumb();
      const n = state === 'after' ? 1 : 6;
      counts.forEach((c) => tween(c, n, 700));
      plural(merge, n);
    };
    let auto = true;
    btns.forEach((b) => b.addEventListener('click', () => { auto = false; set(b.dataset.mergeBtn); }));
    window.addEventListener('resize', placeThumb);
    if (document.fonts) document.fonts.ready.then(placeThumb);
    placeThumb();
    new IntersectionObserver(([e], obs) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      setTimeout(() => { if (auto) set('after'); }, 1400);
    }, { threshold: 0.6 }).observe(merge);
  }

  // ---------- Who does what: tasks move from the client's desk to us ----------
  const shift = document.querySelector('[data-shift]');
  if (shift) {
    const btns = shift.querySelectorAll('[data-shift-btn]');
    const thumb = shift.querySelector('.merge-thumb');
    const you = shift.querySelector('[data-list="you"]');
    const us = shift.querySelector('[data-list="us"]');
    const tasks = [...shift.querySelectorAll('[data-task]')];
    const swaps = shift.querySelectorAll('[data-before][data-after]');
    const empty = shift.querySelector('[data-shift-empty]');
    const placeThumb = () => {
      const on = shift.querySelector('[data-shift-btn][aria-pressed="true"]');
      thumb.style.width = `${on.offsetWidth}px`;
      thumb.style.transform = `translateX(${on.offsetLeft}px)`;
    };
    const set = (state) => {
      if (shift.dataset.state === state) return;
      const first = tasks.map((t) => t.getBoundingClientRect());
      const target = state === 'after' ? us : you;
      tasks.forEach((t) => target.appendChild(t));
      shift.dataset.state = state;
      empty.hidden = state === 'after';
      btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.shiftBtn === state)));
      swaps.forEach((el) => { el.textContent = el.dataset[state]; });
      placeThumb();
      if (reduce) return;
      tasks.forEach((t, i) => {
        const last = t.getBoundingClientRect();
        t.style.transition = 'none';
        t.style.transform = `translate(${first[i].left - last.left}px, ${first[i].top - last.top}px)`;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          t.style.transition = `transform .8s cubic-bezier(.16, 1, .3, 1) ${i * 60}ms, background-color .4s, border-color .4s, color .4s`;
          t.style.transform = '';
        }));
      });
    };
    let auto = true;
    btns.forEach((b) => b.addEventListener('click', () => { auto = false; set(b.dataset.shiftBtn); }));
    window.addEventListener('resize', placeThumb);
    if (document.fonts) document.fonts.ready.then(placeThumb);
    placeThumb();
    new IntersectionObserver(([e], obs) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      setTimeout(() => { if (auto) set('after'); }, 1600);
    }, { threshold: 0.5 }).observe(shift);
  }

  // ---------- Hero slideshow ----------
  const heroPhoto = document.querySelector('.hero-photo[data-slideshow]');
  if (heroPhoto) {
    const img = heroPhoto.querySelector('.hero-bg img');
    // Slideshow of Nordic landscapes. Photos from Wikimedia Commons, credited as their licences require.
    const ownSrc = document.querySelector('script[src*="js/v3.js"]');
    const nordenDir = new URL('../assets/hero/norden/', ownSrc ? ownSrc.src : location.href).href;
    const SLIDES = [
      { file: 'geiranger', sv: 'Geirangerfjorden, Norge', en: 'Geirangerfjord, Norway', pos: '50% 60%', by: 'Ximonic (Simo Räsänen)', lic: 'CC BY-SA 3.0', src: 'Geirangerfjord_from_%C3%98rnesvingen,_2013_June.jpg' },
      { file: 'lapporten', sv: 'Lapporten vid Torneträsk, Sverige', en: 'Lapporten by Torneträsk, Sweden', pos: '50% 45%', by: 'Ximonic (Simo Räsänen)', lic: 'CC BY-SA 4.0', src: 'Lapporten_over_Tornetr%C3%A4sk,_Norrbotten,_Sweden,_2015_April.jpg' },
      { file: 'kirkjufell', sv: 'Kirkjufell, Island', en: 'Kirkjufell, Iceland', pos: '50% 40%', by: 'Jakub Hałun', lic: 'CC BY 4.0', src: 'Kirkjufell,_Iceland,_20240714_1631_0713.jpg' },
      { file: 'reine', sv: 'Reine, Lofoten, Norge', en: 'Reine, Lofoten, Norway', pos: '50% 60%', by: 'Jörg Hempel', lic: 'CC BY-SA 2.0 DE', src: 'Reine_i_Lofoten_LC0148.jpg' },
      { file: 'sarek', sv: 'Sareks nationalpark, Sverige', en: 'Sarek National Park, Sweden', pos: '50% 45%', by: 'Trougnouf (Benoit Brummer)', lic: 'CC BY 4.0', src: 'Suobbattj%C3%A5hk%C3%A5_stream_and_the_Tjakkeli_mountain_during_golden_hour,_Sarek_National_Park_(DSCF2833).jpg' },
      { file: 'pallas', sv: 'Pallastunturi, Lappland, Finland', en: 'Pallastunturi, Lapland, Finland', pos: '50% 50%', by: 'Ximonic (Simo Räsänen)', lic: 'CC BY-SA 4.0', src: 'Pallastunturi_and_Hanhij%C3%A4rvi_in_Muonio,_Lapland,_Finland,_2023_September.jpg' },
      { file: 'senja', sv: 'Segla, Senja, Norge', en: 'Segla, Senja, Norway', pos: '50% 50%', by: 'Ximonic (Simo Räsänen)', lic: 'CC BY-SA 4.0', src: 'View_from_a_ridge_between_Segla_and_Hesten,_Senja,_Norway,_2014_August.jpg' },
      { file: 'skogafoss', sv: 'Skógafoss, Island', en: 'Skógafoss, Iceland', pos: '65% 50%', by: 'Martin Falbisoner', lic: 'CC BY-SA 4.0', src: 'Sk%C3%B3gafoss_July_2014.JPG' },
      { file: 'abisko', sv: 'Norrsken i Abisko, Sverige', en: 'Northern lights in Abisko, Sweden', pos: '50% 40%', by: 'Pavel.shyshkouski', lic: 'CC BY-SA 4.0', src: 'Aurora_in_Abisko_near_Tornetr%C3%A4sk.jpg' },
    ];
    // ---- Slideshow: crossfading layers, a caption with photo credit and a pause button ----
    const show = (() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const DELAY = 7000;
      let layers = null, credit = null, idx = 0, timer = null, running = false, paused = reduce, visible = true;
      const setCredit = (s) => {
        const place = credit.querySelector('.hero-credit-place');
        const by = credit.querySelector('.hero-credit-by');
        place.textContent = en ? s.en : s.sv;
        by.innerHTML = '';
        const a = document.createElement('a');
        a.href = `https://commons.wikimedia.org/wiki/File:${s.src}`;
        a.target = '_blank'; a.rel = 'noopener';
        a.textContent = s.by;
        by.append(en ? 'Photo: ' : 'Foto: ', a, `, ${s.lic}`);
      };
      const load = (i) => {
        const el = layers.children[i];
        if (!el.getAttribute('src')) el.src = `${nordenDir}${SLIDES[i].file}.jpg`;
        return el.decode ? el.decode().catch(() => {}) : Promise.resolve();
      };
      const go = (i) => {
        idx = (i + SLIDES.length) % SLIDES.length;
        load(idx).then(() => {
          [...layers.children].forEach((el, k) => el.classList.toggle('is-active', k === idx));
          setCredit(SLIDES[idx]);
          load((idx + 1) % SLIDES.length); // fetch the next photo in good time
        });
      };
      const tick = () => {
        clearTimeout(timer);
        if (running && !paused && visible && !document.hidden) timer = setTimeout(() => { go(idx + 1); tick(); }, DELAY);
      };
      const build = () => {
        layers = document.createElement('div');
        layers.className = 'hero-slides';
        SLIDES.forEach((s) => {
          const el = document.createElement('img');
          el.alt = ''; el.decoding = 'async';
          el.style.objectPosition = s.pos;
          layers.appendChild(el);
        });
        img.after(layers);
        credit = document.createElement('div');
        credit.className = 'hero-credit';
        credit.innerHTML = '<button type="button" class="hero-credit-toggle"><i class="ph-light" aria-hidden="true"></i></button><p><span class="hero-credit-place"></span><span class="hero-credit-by"></span></p>';
        heroPhoto.appendChild(credit);
        const btn = credit.querySelector('button');
        const syncBtn = () => {
          btn.querySelector('i').className = `ph-light ${paused ? 'ph-play' : 'ph-pause'}`;
          btn.setAttribute('aria-label', paused ? (en ? 'Play slideshow' : 'Spela bildspelet') : (en ? 'Pause slideshow' : 'Pausa bildspelet'));
        };
        btn.addEventListener('click', () => { paused = !paused; syncBtn(); tick(); });
        syncBtn();
        new IntersectionObserver(([e]) => { visible = e.isIntersecting; tick(); }).observe(heroPhoto);
        document.addEventListener('visibilitychange', tick);
      };
      return {
        start() {
          if (!layers) build();
          running = true;
          go(idx); tick();
        },
      };
    })();

    show.start();
  }

  // ---------- 2. Calculator ----------
  const calc = document.querySelector('[data-calc]');
  if (calc) {
    const val = (k) => +calc.querySelector(`[data-in="${k}"]`).value;
    const update = () => {
      calc.querySelectorAll('[data-in]').forEach((input) => {
        calc.querySelector(`[data-out="${input.dataset.in}"]`).textContent = input.value;
        const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
        input.style.setProperty('--fill', `${pct}%`);
      });
      const hours = val('manual') * 46 + val('admin') * 12; // 46 working weeks a year
      tween(calc.querySelector('[data-res="hours"]'), hours, 400);
      tween(calc.querySelector('[data-res="days"]'), Math.round(hours / 8), 400);
      tween(calc.querySelector('[data-res="invoices"]'), val('vendors') * 12, 400);
    };
    calc.addEventListener('input', update);
    update();
  }

  // ---------- 3. FAQ search ----------
  const search = document.querySelector('[data-faq-search]');
  if (search) {
    const items = [...document.querySelectorAll('.faq details')];
    const empty = document.querySelector('[data-faq-empty]');
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      let hits = 0;
      items.forEach((d) => {
        const match = !q || d.textContent.toLowerCase().includes(q);
        d.hidden = !match;
        if (match) hits++;
        if (q && match && q.length > 2) d.open = true;
        if (!q) d.open = false;
      });
      empty.hidden = hits > 0;
    });
  }

  // ---------- 4. Package finder ----------
  const finder = document.querySelector('[data-finder]');
  if (finder) {
    const answers = {};
    const result = finder.querySelector('[data-finder-result]');
    const planName = finder.querySelector('[data-finder-plan]');
    finder.querySelectorAll('[data-q]').forEach((group) => {
      group.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        press(group, btn);
        answers[group.dataset.q] = btn.dataset.v === '1';
        const key = answers.book || answers.auto ? 'helhet' : answers.reach ? 'foretag' : 'start';
        document.querySelectorAll('[data-plan-key]').forEach((p) => p.classList.toggle('is-match', p.dataset.planKey === key));
        planName.textContent = L.plans[key];
        result.hidden = false;
      });
    });
  }

  // ---------- 5. Booking demo ----------
  const demo = document.querySelector('[data-demo]');
  if (demo) {
    const log = demo.querySelector('[data-demo-log]');
    const empty = demo.querySelector('[data-demo-empty]');
    const book = demo.querySelector('[data-demo-book]');
    const reset = demo.querySelector('[data-demo-reset]');
    const steps = [...document.querySelectorAll('.flow-step')];
    const icons = ['ph-calendar-check', 'ph-envelope-simple', 'ph-bell-simple', 'ph-address-book', 'ph-paper-plane-tilt'];
    let timers = [];
    demo.querySelectorAll('.demo-opts').forEach((g) => g.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b && !book.disabled) press(g, b);
    }));
    const clear = () => {
      timers.forEach(clearTimeout); timers = [];
      log.innerHTML = '';
      steps.forEach((s) => s.classList.remove('is-active', 'is-done'));
    };
    book.addEventListener('click', () => {
      clear();
      const [svc, time] = [...demo.querySelectorAll('.demo-opts')].map((g) => g.querySelector('[aria-pressed="true"]').textContent);
      empty.hidden = true;
      book.disabled = true;
      demo.classList.add('is-running');
      L.log(svc, time).forEach((text, i) => {
        timers.push(setTimeout(() => {
          const li = document.createElement('li');
          li.innerHTML = `<i class="ph-light ${icons[i]}" aria-hidden="true"></i><span></span>`;
          li.querySelector('span').textContent = text;
          log.appendChild(li);
          steps.forEach((s, j) => { s.classList.toggle('is-active', j === i); s.classList.toggle('is-done', j < i); });
          if (i === 4) {
            timers.push(setTimeout(() => {
              steps.forEach((s) => { s.classList.remove('is-active'); s.classList.add('is-done'); });
              book.hidden = true; reset.hidden = false; demo.classList.remove('is-running');
            }, 700));
          }
        }, reduce ? 0 : i * 750 + 200));
      });
    });
    reset.addEventListener('click', () => {
      clear();
      empty.hidden = false; book.hidden = false; book.disabled = false; reset.hidden = true;
      book.focus();
    });
  }

  // ---------- 6. Name preview ----------
  const pvInputs = document.querySelectorAll('[data-pv-in]');
  if (pvInputs.length) {
    const slug = (s) => s.toLowerCase()
      .replace(/\b(ab|hb|kb|ltd|inc)\b\.?/g, '')
      .replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/[éè]/g, 'e').replace(/ü/g, 'u')
      .replace(/&/g, 'och').replace(/[^a-z0-9]/g, '') || slug(L.defaultName);
    const update = () => {
      const v = {};
      pvInputs.forEach((i) => { v[i.dataset.pvIn] = i.value.trim(); });
      const name = v.name || L.defaultName;
      const out = {
        name,
        domain: slug(name) + L.tld,
        initial: name.charAt(0).toUpperCase(),
        type: v.type || (en ? 'Business' : 'Företag'),
        city: v.city || 'Boden',
      };
      document.querySelectorAll('[data-pv]').forEach((el) => { el.textContent = out[el.dataset.pv]; });
    };
    pvInputs.forEach((i) => i.addEventListener('input', update));
    update();
  }

  // ---------- 7. Report months ----------
  const tabs = document.querySelector('.report-tabs');
  if (tabs) {
    const data = {
      jul: { visits: 1040, inq: 27, book: 38, dv: 19, di: 3, db: 6 },
      aug: { visits: 1146, inq: 31, book: 43, dv: 10, di: 4, db: 5 },
      sep: { visits: 1284, inq: 37, book: 52, dv: 12, di: 6, db: 9 },
    };
    const bars = [...document.querySelectorAll('.bars li')];
    const barMonth = { jul: 3, aug: 4, sep: 5 };
    tabs.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-month]');
      if (!btn) return;
      press(tabs, btn);
      const m = btn.dataset.month, d = data[m];
      document.querySelector('[data-report-month]').textContent = L.months[m];
      ['visits', 'inq', 'book'].forEach((k) => tween(document.querySelector(`[data-kpi="${k}"]`), d[k], 500));
      document.querySelector('[data-kpi-delta="visits"]').textContent = L.pct(d.dv);
      document.querySelector('[data-kpi-delta="inq"]').textContent = L.count(d.di);
      document.querySelector('[data-kpi-delta="book"]').textContent = L.count(d.db);
      bars.forEach((b, i) => b.classList.toggle('is-current', i === barMonth[m]));
      const note = document.querySelector('.report-note');
      if (note) note.hidden = m !== 'sep';
    });
  }

  // ---------- 8. Live destinations ----------
  const dest = document.querySelector('[data-dest]');
  if (dest) {
    const svg = dest.querySelector('.dest-svg');
    const node = dest.querySelector('.dest-node');
    const targets = [...dest.querySelectorAll('.dest-target')];
    const count = document.querySelector('[data-dest-count]');
    const NS = 'http://www.w3.org/2000/svg';
    const draw = () => {
      const box = dest.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
      svg.innerHTML = '';
      const n = node.getBoundingClientRect();
      const stacked = window.matchMedia('(max-width: 760px)').matches;
      const sx = stacked ? n.left + n.width / 2 - box.left : n.right - box.left;
      const sy = stacked ? n.bottom - box.top : n.top + n.height / 2 - box.top;
      targets.forEach((t) => {
        const r = t.getBoundingClientRect();
        const tx = stacked ? r.left + 24 - box.left : r.left - box.left;
        const ty = stacked ? r.top - box.top + r.height / 2 : r.top + r.height / 2 - box.top;
        const path = document.createElementNS(NS, 'path');
        const d = stacked
          ? `M${sx},${sy} C${sx},${ty} ${tx - 40},${ty} ${tx},${ty}`
          : `M${sx},${sy} C${sx + (tx - sx) * 0.5},${sy} ${sx + (tx - sx) * 0.5},${ty} ${tx},${ty}`;
        path.setAttribute('d', d);
        path.setAttribute('class', t.getAttribute('aria-pressed') === 'true' ? 'dest-path is-on' : 'dest-path');
        svg.appendChild(path);
      });
    };
    const update = () => {
      const n = targets.filter((t) => t.getAttribute('aria-pressed') === 'true').length;
      tween(count, n, 300);
      plural(count.parentElement, n);
      draw();
    };
    targets.forEach((t) => t.addEventListener('click', () => {
      const on = t.getAttribute('aria-pressed') === 'true';
      const active = targets.filter((x) => x.getAttribute('aria-pressed') === 'true').length;
      if (on && active === 1) return; // keep at least one destination
      t.setAttribute('aria-pressed', String(!on));
      update();
    }));
    new ResizeObserver(draw).observe(dest);
    update();
  }
})();
