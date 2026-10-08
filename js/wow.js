// Landén Media, "Norrsken" edition: aurora backgrounds and interactive details.
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const header = document.querySelector('[data-header]');

  // ---------- Header sits transparently on top of the dark hero ----------
  const hero = document.querySelector('.hero, .page-hero');
  if (hero && header && 'IntersectionObserver' in window) {
    const update = () => header.classList.toggle('is-over-hero', hero.getBoundingClientRect().bottom > header.offsetHeight);
    const steps = Array.from({ length: 51 }, (_, i) => i / 50);
    new IntersectionObserver(update, { threshold: steps }).observe(hero);
    update();
  }

  // ---------- Aurora (WebGL) behind every hero ----------
  const FRAG = `
    precision mediump float;
    uniform vec2 r; uniform float t; uniform vec2 m;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
      return mix(mix(h(i), h(i+vec2(1.0,0.0)), f.x), mix(h(i+vec2(0.0,1.0)), h(i+vec2(1.0,1.0)), f.x), f.y); }
    float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a*n(p); p *= 2.0; a *= 0.5; } return v; }
    void main(){
      vec2 uv = gl_FragCoord.xy / r;
      float ar = r.x / r.y;
      vec2 p = vec2(uv.x * ar, uv.y);
      float tt = t * 0.06;
      vec3 col = mix(vec3(0.027, 0.043, 0.078), vec3(0.05, 0.07, 0.14), uv.y);
      for (int i = 0; i < 3; i++){
        float fi = float(i);
        float y = 0.62 - fi*0.09 + 0.14*sin(p.x*1.1 + tt*2.6 + fi*2.3) + 0.10*(fbm(vec2(p.x*1.3 + tt + fi*3.0, tt*0.4)) - 0.5) + (m.y - 0.5)*0.06;
        float d = uv.y - y;
        float curtain = smoothstep(-0.02, 0.0, d) * exp(-d * (3.2 + fi));
        float glow = exp(-pow(d * (9.0 + fi*3.0), 2.0));
        float rays = fbm(vec2(p.x*7.0 + fi*11.0 + (m.x-0.5)*0.6, uv.y*0.5 - tt*1.8));
        float a = (curtain*0.55 + glow*0.9) * (0.35 + 0.9*rays);
        vec3 c;
        if (i == 0) c = vec3(0.17, 0.89, 0.65);
        else if (i == 1) c = vec3(0.13, 0.76, 0.90);
        else c = vec3(0.55, 0.42, 1.0);
        col += c * a * 0.42;
      }
      float stars = step(0.9992, h(floor(gl_FragCoord.xy))) * smoothstep(0.55, 1.0, uv.y) * (0.5 + 0.5 * sin(t * 1.5 + h(floor(gl_FragCoord.xy)) * 40.0));
      col += vec3(stars) * 0.35;
      col *= 1.0 - 0.45 * length((uv - vec2(0.5, 0.55)) * vec2(0.9, 1.2));
      gl_FragColor = vec4(col, 1.0);
    }`;
  const VERT = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';

  const startAurora = (host) => {
    const canvas = document.createElement('canvas');
    canvas.className = 'aurora-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    host.prepend(canvas);
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) { canvas.remove(); return; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(prog, 'r'), uT = gl.getUniformLocation(prog, 't'), uM = gl.getUniformLocation(prog, 'm');
    const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.5; // render at half resolution, the blur hides it
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const resize = () => {
      canvas.width = Math.max(1, Math.round(host.clientWidth * scale));
      canvas.height = Math.max(1, Math.round(host.clientHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    new ResizeObserver(resize).observe(host);
    resize();
    if (finePointer) {
      host.addEventListener('pointermove', (e) => {
        const b = host.getBoundingClientRect();
        mouse.tx = (e.clientX - b.left) / b.width; mouse.ty = 1 - (e.clientY - b.top) / b.height;
      });
    }
    let visible = true; let raf = 0; const t0 = performance.now();
    const frame = (now) => {
      mouse.x += (mouse.tx - mouse.x) * 0.04; mouse.y += (mouse.ty - mouse.y) * 0.04;
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform1f(uT, reduce ? 12.0 : (now - t0) / 1000 + 12.0);
      gl.uniform2f(uM, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      canvas.classList.add('is-ready');
      if (!reduce && visible) raf = requestAnimationFrame(frame);
    };
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(frame);
    }).observe(host);
    document.addEventListener('visibilitychange', () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && visible) raf = requestAnimationFrame(frame);
    });
  };
  document.querySelectorAll('.hero, .page-hero, .cta-band').forEach(startAurora);

  // ---------- Headline: words rise in one by one ----------
  const h1 = document.querySelector('.hero .display, .page-hero .display');
  if (h1 && !reduce) {
    let w = 0;
    const wrap = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement('span');
            s.className = 'split-word'; s.style.setProperty('--w', w++); s.textContent = part;
            frag.appendChild(s);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          wrap(child);
        }
      });
    };
    wrap(h1);
    h1.classList.add('is-split');
    // Gradient text must live on each word inside <strong>
    h1.querySelectorAll('strong .split-word').forEach((s) => { s.style.background = 'inherit'; s.style.webkitBackgroundClip = 'text'; s.style.backgroundClip = 'text'; });
    requestAnimationFrame(() => requestAnimationFrame(() => h1.classList.add('split-ready')));
  }

  if (!reduce && finePointer) {
    // ---------- Magnetic buttons ----------
    document.querySelectorAll('.btn-primary:not(.btn-block), .btn-ghost:not(.btn-block), .header-cta').forEach((btn) => {
      btn.setAttribute('data-magnetic', '');
      btn.addEventListener('pointermove', (e) => {
        const b = btn.getBoundingClientRect();
        const x = (e.clientX - b.left - b.width / 2) * 0.22;
        const y = (e.clientY - b.top - b.height / 2) * 0.32;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });

    // ---------- Spotlight + 3D tilt on cards ----------
    document.querySelectorAll('.area, .plan:not(.plan-featured), .cell, .features li, .panel-after, .report, .live-note').forEach((card) => {
      card.setAttribute('data-spot', '');
      const tilt = card.matches('.area, .plan, .features li');
      if (tilt) card.setAttribute('data-tilt', '');
      card.addEventListener('pointermove', (e) => {
        const b = card.getBoundingClientRect();
        const px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
        card.style.setProperty('--mx', `${px * 100}%`);
        card.style.setProperty('--my', `${py * 100}%`);
        if (tilt) card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 5}deg) rotateY(${(px - 0.5) * 6}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => { if (tilt) card.style.transform = ''; });
    });

    // ---------- Hero floating cards follow the pointer in depth ----------
    const scene = document.querySelector('[data-scene]');
    if (scene) {
      const cards = scene.querySelectorAll('[data-depth]');
      const media = scene.querySelector('.hero-media');
      document.querySelector('.hero').addEventListener('pointermove', (e) => {
        const x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
        cards.forEach((c) => {
          const d = +c.dataset.depth;
          c.style.setProperty('--px', `${-x * d}px`); c.style.setProperty('--py', `${-y * d}px`);
        });
        if (media) media.style.transform = `perspective(1200px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`;
      });
    }
  }

  // ---------- Merge toggle: six suppliers become one ----------
  const merge = document.querySelector('[data-merge]');
  if (merge) {
    const btns = merge.querySelectorAll('[data-merge-btn]');
    const thumb = merge.querySelector('.merge-thumb');
    const counts = merge.querySelectorAll('[data-merge-count]');
    const vendors = merge.querySelectorAll('.vendor');
    const target = merge.querySelector('.panel-after');
    merge.querySelectorAll('.check-list li').forEach((li, i) => li.style.setProperty('--i', i));
    let countRaf = 0;

    const placeThumb = () => {
      const on = merge.querySelector('[aria-pressed="true"]');
      thumb.style.setProperty('--tw', `${on.offsetWidth}px`);
      thumb.style.setProperty('--tx', `${on.offsetLeft - 5}px`);
    };
    const measure = () => {
      const tb = target.getBoundingClientRect();
      const cx = tb.left + tb.width / 2, cy = tb.top + tb.height / 2;
      vendors.forEach((v, i) => {
        const b = v.getBoundingClientRect();
        v.style.setProperty('--dx', `${cx - (b.left + b.width / 2)}px`);
        v.style.setProperty('--dy', `${cy - (b.top + b.height / 2)}px`);
        v.style.setProperty('--i', i);
      });
    };
    const animateCount = (to) => {
      cancelAnimationFrame(countRaf);
      const from = +counts[0].textContent; const t0 = performance.now();
      const step = (now) => {
        const p = reduce ? 1 : Math.min((now - t0) / 700, 1);
        const v = Math.round(from + (to - from) * p);
        counts.forEach((c) => { c.textContent = v; });
        merge.querySelectorAll('[data-plural]').forEach((w) => { const [one, many] = w.dataset.plural.split('|'); w.textContent = v === 1 ? one : many; });
        if (p < 1) countRaf = requestAnimationFrame(step);
      };
      countRaf = requestAnimationFrame(step);
    };
    const set = (state) => {
      if (merge.dataset.state === state) return;
      if (state === 'after') measure();
      merge.dataset.state = state;
      btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mergeBtn === state)));
      placeThumb();
      animateCount(state === 'after' ? 1 : 6);
    };
    btns.forEach((b) => b.addEventListener('click', () => { autoplay = false; set(b.dataset.mergeBtn); }));
    window.addEventListener('resize', placeThumb);
    document.fonts && document.fonts.ready.then(placeThumb);
    placeThumb();

    // Demonstrate once when it scrolls into view
    let autoplay = true;
    new IntersectionObserver(([e], obs) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      setTimeout(() => { if (autoplay) set('after'); }, 1400);
    }, { threshold: 0.6 }).observe(merge);
  }
})();
