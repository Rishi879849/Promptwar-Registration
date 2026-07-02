// PromptWars @ UIT RGPV â€” Spider-Man Theme Interactive Logic

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   THREE.JS 3D SPIDER-WEB BACKGROUND
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
(function initSpiderWebBackground() {
  // Defer until Three.js is available
  if (typeof THREE === 'undefined') {
    window.addEventListener('load', initSpiderWebBackground);
    return;
  }

  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;

  /* â”€â”€ Scene Setup â”€â”€ */
  const W = window.innerWidth;
  const H = window.innerHeight;

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
  camera.position.set(0, 0, 32);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);

  /* â”€â”€ Particle System â”€â”€ */
  const COUNT  = 130;
  const SPREAD = 28;
  const DEPTH  = 20;

  // Actual 3D positions & velocities
  const pts = [];
  const vel = [];

  // GPU buffer (flat Float32Array)
  const pPos = new Float32Array(COUNT * 3);

  // Colors: 60% red, 25% white, 15% blue
  const pColors = new Float32Array(COUNT * 3);

  for (let i = 0; i < COUNT; i++) {
    const x = (Math.random() - 0.5) * SPREAD * 2;
    const y = (Math.random() - 0.5) * SPREAD * 2;
    const z = (Math.random() - 0.5) * DEPTH  * 2;

    pPos[i*3]   = x;
    pPos[i*3+1] = y;
    pPos[i*3+2] = z;

    pts.push(new THREE.Vector3(x, y, z));
    vel.push(new THREE.Vector3(
      (Math.random() - 0.5) * 0.018,
      (Math.random() - 0.5) * 0.018,
      (Math.random() - 0.5) * 0.006
    ));

    // Colour
    const r = Math.random();
    if (r < 0.60) {
      // Red particle
      pColors[i*3] = 0.886; pColors[i*3+1] = 0.212; pColors[i*3+2] = 0.212;
    } else if (r < 0.85) {
      // White / silver
      pColors[i*3] = 0.9;   pColors[i*3+1] = 0.9;   pColors[i*3+2] = 0.95;
    } else {
      // Blue
      pColors[i*3] = 0.145; pColors[i*3+1] = 0.388; pColors[i*3+2] = 0.922;
    }
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color',    new THREE.BufferAttribute(pColors, 3));

  const pMat = new THREE.PointsMaterial({
    size: 0.25,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
  });

  const pointCloud = new THREE.Points(pGeo, pMat);
  scene.add(pointCloud);

  /* â”€â”€ Web Lines (LineSegments) â”€â”€ */
  const MAX_PAIRS  = COUNT * 12;
  const lPos       = new Float32Array(MAX_PAIRS * 2 * 3);
  const lGeo       = new THREE.BufferGeometry();
  lGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3));
  lGeo.setDrawRange(0, 0);

  const lMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.07,
  });

  const webLines = new THREE.LineSegments(lGeo, lMat);
  scene.add(webLines);

  /* â”€â”€ Central Energy Sphere (Spider-Man red glow core) â”€â”€ */
  const coreGeo = new THREE.SphereGeometry(0.55, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xE23636,
    transparent: true,
    opacity: 0.55,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  scene.add(core);

  // Outer glow ring (larger transparent sphere)
  const glowGeo = new THREE.SphereGeometry(1.6, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xE23636,
    transparent: true,
    opacity: 0.06,
    side: THREE.BackSide,
  });
  scene.add(new THREE.Mesh(glowGeo, glowMat));

  /* â”€â”€ Input State â”€â”€ */
  let mouseX    = 0;
  let mouseY    = 0;
  let scrollY   = 0;
  let targetCX  = 0;
  let targetCY  = 0;

  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  }, { passive: true });

  /* â”€â”€ Animation Loop â”€â”€ */
  let frame = 0;
  const DIST_THRESHOLD = 10;
  const DIST_SQ        = DIST_THRESHOLD * DIST_THRESHOLD;
  const clock          = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    frame++;
    const t = clock.getElapsedTime();

    /* Move particles */
    for (let i = 0; i < COUNT; i++) {
      pts[i].addScaledVector(vel[i], 1);

      // Soft boundary wrap
      if (pts[i].x >  SPREAD) pts[i].x = -SPREAD;
      if (pts[i].x < -SPREAD) pts[i].x =  SPREAD;
      if (pts[i].y >  SPREAD) pts[i].y = -SPREAD;
      if (pts[i].y < -SPREAD) pts[i].y =  SPREAD;
      if (pts[i].z >  DEPTH)  pts[i].z = -DEPTH;
      if (pts[i].z < -DEPTH)  pts[i].z =  DEPTH;

      pPos[i*3]   = pts[i].x;
      pPos[i*3+1] = pts[i].y;
      pPos[i*3+2] = pts[i].z;
    }
    pGeo.attributes.position.needsUpdate = true;

    /* Update web lines every 2 frames (perf) */
    if (frame % 2 === 0) {
      let li = 0;
      for (let i = 0; i < COUNT && li < MAX_PAIRS; i++) {
        for (let j = i + 1; j < COUNT && li < MAX_PAIRS; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dz = pts[i].z - pts[j].z;
          const sq = dx*dx + dy*dy + dz*dz;
          if (sq < DIST_SQ) {
            const base = li * 6;
            lPos[base]   = pts[i].x;  lPos[base+1] = pts[i].y;  lPos[base+2] = pts[i].z;
            lPos[base+3] = pts[j].x;  lPos[base+4] = pts[j].y;  lPos[base+5] = pts[j].z;
            li++;
          }
        }
      }
      lGeo.setDrawRange(0, li * 2);
      lGeo.attributes.position.needsUpdate = true;

      // Opacity fades in/out with a sine wave
      lMat.opacity = 0.05 + Math.abs(Math.sin(t * 0.4)) * 0.07;
    }

    /* Pulse core sphere */
    const pulse = 0.45 + Math.sin(t * 2.2) * 0.15;
    coreMat.opacity = pulse;
    const s = 1 + Math.sin(t * 1.8) * 0.12;
    core.scale.setScalar(s);

    /* Camera: smooth mouse parallax */
    targetCX += (mouseX * 6  - targetCX) * 0.04;
    targetCY += (-mouseY * 5 - targetCY) * 0.04;
    camera.position.x = targetCX;
    camera.position.y = targetCY;

    /* Scroll: rotate scene + slight zoom */
    const scrollFactor = scrollY * 0.001;
    scene.rotation.y = scrollFactor * 0.6;
    scene.rotation.x = scrollFactor * 0.25;
    camera.position.z = 32 + Math.sin(scrollFactor) * 4;

    /* Slow auto-rotation always present */
    scene.rotation.z = Math.sin(t * 0.08) * 0.04;

    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }

  animate();

  /* â”€â”€ Resize Handler â”€â”€ */
  window.addEventListener('resize', () => {
    const W2 = window.innerWidth;
    const H2 = window.innerHeight;
    camera.aspect = W2 / H2;
    camera.updateProjectionMatrix();
    renderer.setSize(W2, H2);
  });
})();

document.addEventListener('DOMContentLoaded', () => {

  // â”€â”€ Mobile Nav Drawer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const menuToggle  = document.querySelector('.menu-toggle');
  const navDrawer   = document.querySelector('.nav-drawer');
  const drawerClose = document.querySelector('.drawer-close');
  const drawerLinks = document.querySelectorAll('.drawer-links a');

  if (menuToggle && navDrawer && drawerClose) {
    menuToggle.addEventListener('click', () => navDrawer.classList.add('active'));
    drawerClose.addEventListener('click', () => navDrawer.classList.remove('active'));
    drawerLinks.forEach(link => link.addEventListener('click', () => navDrawer.classList.remove('active')));
  }

  // â”€â”€ Registration Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const registerBtns = document.querySelectorAll('.btn-register');
  const modalOverlay = document.getElementById('registerModal');
  const modalCloses  = document.querySelectorAll('.modal-close, .modal-close-success');
  const cancelBtn    = document.querySelector('.btn-cancel');

  if (modalOverlay) {
    const openModal = () => {
      modalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
      modalOverlay.classList.remove('active');
      document.body.style.overflow = '';
      setTimeout(resetForm, 350);
    };

    registerBtns.forEach(btn => btn.addEventListener('click', openModal));
    modalCloses.forEach(btn  => btn.addEventListener('click', closeModal));
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Close when clicking the dark backdrop
    modalOverlay.addEventListener('click', e => {
      if (e.target === modalOverlay) closeModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modalOverlay.classList.contains('active')) closeModal();
    });
  }

  // â”€â”€ FAQ Accordion â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const item     = question.parentElement;
      const answer   = item.querySelector('.faq-answer');
      const isActive = item.classList.contains('active');

      // Collapse all
      document.querySelectorAll('.faq-item').forEach(other => {
        other.classList.remove('active');
        other.querySelector('.faq-answer').style.maxHeight = null;
        other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      // Expand clicked item if it wasn't already open
      if (!isActive) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // â”€â”€ Spider-Man Terminal Typing Animation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const terminalText = document.getElementById('terminal-typing');
  if (terminalText) {
    const promptString = "Build a Spider-Man themed hackathon portal for PromptWars 2026 @ UIT RGPV using Gemini 2.5 API...";
    let index = 0;

    function typePrompt() {
      if (index < promptString.length) {
        terminalText.textContent += promptString.charAt(index);
        index++;
        setTimeout(typePrompt, 38);
      } else {
        setTimeout(showResponse, 700);
      }
    }

    function showResponse() {
      const responseEl = document.querySelector('.code-response');
      if (responseEl) {
        responseEl.style.opacity = '1';
        responseEl.style.transition = 'opacity 0.6s ease';
      }
    }

    setTimeout(typePrompt, 800);
  }

  // â”€â”€ Registration Form Submission â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const regForm     = document.getElementById('registrationForm');
  const formBody    = document.getElementById('formBody');
  const successView = document.getElementById('successView');
  const modalFooter = document.getElementById('modalFooter');
  const successName = document.getElementById('successName');

  if (regForm && formBody && successView && modalFooter) {
    regForm.addEventListener('submit', e => {
      e.preventDefault();

      const name       = document.getElementById('regName').value.trim();
      const email      = document.getElementById('regEmail').value.trim();
      const phone      = document.getElementById('regPhone').value.trim();
      const rollNumber = document.getElementById('regRoll').value.trim();
      const branch     = document.getElementById('regBranch').value;
      const sem        = document.getElementById('regSem').value;
      const github     = document.getElementById('regGithub').value.trim() || 'N/A';
      const experience = document.getElementById('regExp').value;
      const terms      = document.getElementById('regTerms').checked;

      if (!name || !email || !phone || !rollNumber || !branch || !sem || !terms) {
        alert('ðŸ•¸ï¸ Please fill in all required fields and accept the terms.');
        return;
      }

      // Check for duplicate email or roll number
      try {
        const existing = JSON.parse(localStorage.getItem('promptwars_registrations')) || [];
        const duplicate = existing.find(r =>
          r.email.toLowerCase() === email.toLowerCase() ||
          r.roll.toLowerCase()  === rollNumber.toLowerCase()
        );
        if (duplicate) {
          alert('âš ï¸ A registration with this email or roll number already exists. Each Spider-Dev can only register once!');
          return;
        }

        const registrationData = {
          name, email, phone,
          roll: rollNumber,
          branch, sem, github, experience,
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        };

        existing.push(registrationData);
        localStorage.setItem('promptwars_registrations', JSON.stringify(existing));
      } catch (err) {
        console.error('Failed to save registration:', err);
        alert('âš ï¸ Something went wrong saving your registration. Please try again.');
        return;
      }

      // Show success view
      formBody.style.display    = 'none';
      modalFooter.style.display = 'none';
      if (successName) successName.textContent = name;
      successView.style.display = 'block';
    });
  }

  // â”€â”€ Reset Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function resetForm() {
    if (regForm && formBody && successView && modalFooter) {
      regForm.reset();
      formBody.style.display    = 'block';
      modalFooter.style.display = 'flex';
      successView.style.display = 'none';
    }
  }

  // â”€â”€ SectionWithMockup: Scroll-Reveal (Intersection Observer) â”€â”€â”€â”€â”€
  const animEls = document.querySelectorAll('[data-anim="fade-up"]');

  if ('IntersectionObserver' in window && animEls.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.delay || '0', 10);
          setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, delay);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    animEls.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback: show immediately if IntersectionObserver not supported
    animEls.forEach(el => el.classList.add('is-visible'));
  }

  // â”€â”€ Live Registration Count + Dynamic Bar in Stats Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const animStat1  = document.getElementById('animStat1');
  const regBarFill = document.getElementById('regBarFill');
  const regBarPct  = document.getElementById('regBarPct');

  const REG_CAP = 200; // total seat cap

  if (animStat1) {
    try {
      const stored = JSON.parse(localStorage.getItem('promptwars_registrations')) || [];
      const total  = stored.length;
      const pct    = Math.min(Math.round((total / REG_CAP) * 100), 100);

      const statObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          // Animate count
          let count = 0;
          const step = Math.max(1, Math.ceil(total / 25));
          const timer = setInterval(() => {
            count = Math.min(count + step, total);
            animStat1.textContent = count;
            if (count >= total) clearInterval(timer);
          }, 50);

          // Animate progress bar
          if (regBarFill && regBarPct) {
            setTimeout(() => {
              regBarFill.style.transition = 'width 1.2s ease';
              regBarFill.style.width = pct + '%';
              regBarPct.textContent = pct + '%';
            }, 100);
          }

          statObserver.disconnect();
        }
      }, { threshold: 0.5 });
      statObserver.observe(animStat1);
    } catch (e) { /* ignore */ }
  }

});


/* ═══════════════════════════════════════════════════════════════════════
   RADIAL ORBITAL TIMELINE — Split Layout
   Left orbital animates; right panel shows selected phase details.
   ═══════════════════════════════════════════════════════════════════════ */
(function initOrbitalTimeline() {

  const DATA = [
    { id:1, title:'Registrations',     date:'Open Now',        icon:'🕸️', relatedIds:[2],   status:'in-progress', energy:90,
      content:'Web-swing in and secure your seat! Register before all 200 spots are taken. Your journey as a Spider-Dev begins right here — no ticket price, just ambition and a working laptop.' },
    { id:2, title:'Team Formation',    date:'Jul – Sep 2026',  icon:'🕷️', relatedIds:[1,3], status:'pending',     energy:65,
      content:'Assemble your Spider Squad. Go solo or team up with up to 3 others. Find your allies, strategise your stack, and sharpen those Gemini 2.5 prompting skills before battle day arrives.' },
    { id:3, title:'Reg. Closes',       date:'Sep 30, 2026',    icon:'⏰', relatedIds:[2,4], status:'pending',     energy:45,
      content:'Final call! The registration portal snaps shut on September 30th. Lock in your team, confirm all members, double-check your college ID, and prepare to swing into action.' },
    { id:4, title:'Opening Ceremony',  date:'Oct 15 · 9 AM',   icon:'⚡', relatedIds:[3,5], status:'pending',     energy:80,
      content:'Problem statements are revealed and Gemini 2.5 Flash API keys are distributed. Welcome address by UIT RGPV Director + Google guest speakers. With great prompts comes great code — the clock starts NOW.' },
    { id:5, title:'Build Sprint',      date:'Oct 15 – 16',     icon:'💻', relatedIds:[4,6], status:'pending',     energy:100,
      content:'24 hours of pure vibe-coding. Use Gemini AI to build something that shakes the Spider-Verse. GDE mentors are on standby. Every keystroke, every prompt, every design decision — make it count.' },
    { id:6, title:'Demo & Awards',     date:'Oct 16 · Evening', icon:'🏆', relatedIds:[5],   status:'pending',     energy:75,
      content:'Present your masterpiece to the Spider Council! Teams demo working prototypes. Winners take home Google Nest Hub Max, Nest Audio, $400 in cloud credits, swag kits, exclusive mentorship, and eternal glory.' }
  ];

  const stage       = document.getElementById('orbitalStage');
  const placeholder = document.getElementById('orbitalPlaceholder');
  const detail      = document.getElementById('orbitalDetail');
  if (!stage || !placeholder || !detail) return;

  const RADIUS = 160;
  let rotAngle  = 0;
  let autoRotate = true;
  let activeId   = null;
  const nodes    = {};

  /* ── Build orbital nodes ──────────────────────────────────── */
  DATA.forEach((item, idx) => {
    const el  = document.createElement('div');
    el.className = 'orbit-node';
    el.id = `onode-${item.id}`;

    const glow = document.createElement('div');
    glow.className = 'orbit-node-glow';
    const gs = item.energy * 0.4 + 50;
    glow.style.cssText = `width:${gs}px;height:${gs}px;`;

    const btn = document.createElement('div');
    btn.className = 'orbit-node-btn';
    btn.textContent = item.icon;

    const lbl = document.createElement('div');
    lbl.className = 'orbit-node-label';
    lbl.textContent = item.title;

    el.appendChild(glow);
    el.appendChild(btn);
    el.appendChild(lbl);
    stage.appendChild(el);

    el.addEventListener('click', e => { e.stopPropagation(); toggleNode(item.id); });
    nodes[item.id] = { el, item, index: idx };
  });

  /* ── Placeholder phase list click handlers ────────────────── */
  document.querySelectorAll('#ophPhases li').forEach(li => {
    li.addEventListener('click', () => {
      const id = parseInt(li.dataset.id);
      if (id) toggleNode(id);
    });
  });

  /* ── Show right-panel detail ──────────────────────────────── */
  function showPanel(item) {
    // Highlight active in placeholder list
    document.querySelectorAll('#ophPhases li').forEach(li => {
      li.classList.toggle('ph-active', parseInt(li.dataset.id) === item.id);
    });

    let sCls = 'od-pending', sTxt = 'Upcoming';
    if (item.status === 'in-progress') { sCls = 'od-live';    sTxt = '🔴 Live Now'; }
    if (item.status === 'completed')   { sCls = 'od-done';    sTxt = '✓ Completed'; }

    const relHTML = item.relatedIds.length
      ? `<div class="od-related-label">🕸 Connected Phases</div>
         <div class="od-related-btns">
           ${item.relatedIds.map(rid => {
             const r = DATA.find(d => d.id === rid);
             return r ? `<button class="od-rel-btn" data-tid="${rid}">${r.icon} ${r.title} →</button>` : '';
           }).join('')}
         </div>` : '';

    detail.innerHTML = `
      <button class="od-back-btn" id="odBackBtn">← All Phases</button>
      <div class="od-meta-row">
        <span class="od-status ${sCls}">${sTxt}</span>
        <span class="od-date">${item.date}</span>
      </div>
      <div class="od-title">${item.icon} ${item.title}</div>
      <div class="od-rule"></div>
      <p class="od-body">${item.content}</p>
      <div class="od-energy">
        <div class="od-energy-top"><span>⚡ Energy Level</span><span>${item.energy}%</span></div>
        <div class="od-bar-track"><div class="od-bar-fill" style="width:0%"></div></div>
      </div>
      ${relHTML}`;

    detail.classList.add('od-show');

    // Animate energy bar
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const fill = detail.querySelector('.od-bar-fill');
        if (fill) fill.style.width = item.energy + '%';
      });
    });

    // Back button
    document.getElementById('odBackBtn').addEventListener('click', e => {
      e.stopPropagation();
      closeAll();
    });

    // Related buttons
    detail.querySelectorAll('.od-rel-btn').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); toggleNode(parseInt(btn.dataset.tid)); });
    });
  }

  function hidePanel() {
    detail.classList.remove('od-show');
    placeholder.classList.remove('ph-hide');
    document.querySelectorAll('#ophPhases li').forEach(li => li.classList.remove('ph-active'));
  }

  /* ── Toggle node active ───────────────────────────────────── */
  function toggleNode(id) {
    if (activeId === id) { closeAll(); return; }
    closeAll();
    activeId   = id;
    autoRotate = false;

    const n = nodes[id];
    if (!n) return;
    n.el.classList.add('node-active');
    n.item.relatedIds.forEach(rid => {
      if (nodes[rid]) nodes[rid].el.classList.add('node-related');
    });

    // Slide placeholder out, show detail
    placeholder.classList.add('ph-hide');
    showPanel(n.item);
  }

  function closeAll() {
    Object.values(nodes).forEach(({ el }) => {
      el.classList.remove('node-active', 'node-related');
    });
    activeId   = null;
    autoRotate = true;
    hidePanel();
  }

  // Click orbital stage background to deselect
  stage.addEventListener('click', closeAll);

  /* ── Animation loop ───────────────────────────────────────── */
  function tick() {
    if (autoRotate) rotAngle = (rotAngle + 0.22) % 360;

    const total = DATA.length;
    Object.values(nodes).forEach(({ el, index }) => {
      const angle = ((index / total) * 360 + rotAngle) % 360;
      const rad   = angle * Math.PI / 180;
      const x     = RADIUS * Math.cos(rad);
      const y     = RADIUS * Math.sin(rad);
      const z     = Math.round(100 + 50 * Math.cos(rad));
      const op    = Math.max(0.35, Math.min(1, 0.35 + 0.65 * ((1 + Math.sin(rad)) / 2)));

      el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
      el.style.zIndex    = el.classList.contains('node-active') ? 300 : z;
      el.style.opacity   = el.classList.contains('node-active') ? 1 : op;
    });

    requestAnimationFrame(tick);
  }

  tick();

})();
