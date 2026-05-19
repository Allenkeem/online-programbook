'use strict';

// ── State ─────────────────────────────────────────────────────────────────────
let currentGallery = [];
let lightboxIdx = 0;
let currentPerf = null;

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (typeof PROGRAMBOOK_DATA === 'undefined') return;

    const perfs = PROGRAMBOOK_DATA.performances;
    if (!perfs || perfs.length === 0) return;

    const hash = location.hash;
    if (hash.startsWith('#/p/')) {
        const raw = decodeURIComponent(hash.slice(4));
        if (raw.includes('/dept/')) {
            const [perfId, deptName] = raw.split('/dept/');
            const perf = findPerf(perfId) || perfs[0];
            openDetailDirect(perf);
            openStaffDeptDirect(perf, decodeURIComponent(deptName));
        } else {
            const [perfId, teamPart] = raw.split('/team/');
            const perf = findPerf(perfId) || perfs[0];
            openDetailDirect(perf);
            if (teamPart) openTeamDirect(perf, decodeURIComponent(teamPart));
        }
    } else {
        openDetailDirect(perfs[0]);
    }

    window.addEventListener('popstate', () => {
        const hash = location.hash;
        if (hash.startsWith('#/p/')) {
            const raw = decodeURIComponent(hash.slice(4));
            if (raw.includes('/dept/')) {
                const [perfId, deptName] = raw.split('/dept/');
                const perf = findPerf(perfId) || perfs[0];
                openDetailDirect(perf);
                openStaffDeptDirect(perf, decodeURIComponent(deptName));
            } else {
                const [perfId, teamPart] = raw.split('/team/');
                const perf = findPerf(perfId) || perfs[0];
                openDetailDirect(perf);
                if (teamPart) openTeamDirect(perf, decodeURIComponent(teamPart));
            }
        } else {
            openDetailDirect(currentPerf || perfs[0]);
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            if (document.getElementById('lightbox').classList.contains('active')) closeLightbox();
            else closePersonProfile();
        }
        if (e.key === 'ArrowLeft')  lightboxNav(-1);
        if (e.key === 'ArrowRight') lightboxNav(1);
    });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function findPerf(id) {
    return PROGRAMBOOK_DATA.performances.find(p => String(p.id) === String(id));
}

function setActiveView(id) {
    ['view-detail', 'view-team'].forEach(v => {
        const el = document.getElementById(v);
        if (el) el.classList.toggle('active', v === id);
    });
}

function esc(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function fmtDate(start, end) {
    if (!start && !end) return '';
    if (!end || start === end) return esc(start || '');
    return `${esc(start)} — ${esc(end)}`;
}

function safeAttr(str) {
    return String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// ── View transitions ──────────────────────────────────────────────────────────
function fade(callback) {
    const overlay = document.getElementById('page-overlay');
    overlay.classList.add('fading');
    setTimeout(() => {
        callback();
        window.scrollTo(0, 0);
        requestAnimationFrame(() => overlay.classList.remove('fading'));
    }, 220);
}

function openDetailDirect(perf) {
    currentPerf = perf;
    setActiveView('view-detail');
    renderDetail(perf);
    window.scrollTo(0, 0);
}

function openTeamDirect(perf, teamName) {
    currentPerf = perf;
    setActiveView('view-team');
    document.getElementById('team-header-title').textContent = teamName;
    renderTeam(perf, teamName);
    window.scrollTo(0, 0);
}

function openStaffDeptDirect(perf, deptName) {
    currentPerf = perf;
    setActiveView('view-team');
    document.getElementById('team-header-title').textContent = deptName;
    renderStaffDept(perf, deptName);
    window.scrollTo(0, 0);
}

// called by play card click
function showTeam(teamName) {
    if (!currentPerf) return;
    fade(() => openTeamDirect(currentPerf, teamName));
    history.pushState(null, '', `#/p/${encodeURIComponent(currentPerf.id)}/team/${encodeURIComponent(teamName)}`);
}

// called by staff dept card click
function showStaffDept(deptName) {
    if (!currentPerf) return;
    fade(() => openStaffDeptDirect(currentPerf, deptName));
    history.pushState(null, '', `#/p/${encodeURIComponent(currentPerf.id)}/dept/${encodeURIComponent(deptName)}`);
}

// called by back button on team/dept page
function showDetailFromTeam() {
    if (!currentPerf) return;
    const perf = currentPerf;
    fade(() => openDetailDirect(perf));
    history.pushState(null, '', `#/p/${encodeURIComponent(perf.id)}`);
}

// ── Poster circles SVG background ────────────────────────────────────────────
function circlesBgSVG() {
    // Three overlapping circles forming a Venn-3 pattern, mirroring the 8×8×8 poster.
    // Circle centers: C1(230,140) top-left, C2(570,140) top-right, C3(400,350) bottom.
    // r=210 for all three. Pairwise intersection sparkle positions (calculated):
    //   C1∩C2 lower → (400, 263)  C1∩C3 upper → (440, 144)  C2∩C3 upper → (360, 144)
    return `<svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice"
         xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;">
  <defs>
    <!-- Full-circle paths: M cx+r,cy A r,r 0 1 0 cx-r,cy A r,r 0 1 0 cx+r,cy -->
    <path id="cbt1" d="M 440,140 A 210,210 0 1 0 20,140 A 210,210 0 1 0 440,140"/>
    <path id="cbt2" d="M 780,140 A 210,210 0 1 0 360,140 A 210,210 0 1 0 780,140"/>
    <path id="cbt3" d="M 610,350 A 210,210 0 1 0 190,350 A 210,210 0 1 0 610,350"/>
    <filter id="cbglow" x="-200%" y="-200%" width="500%" height="500%">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
    <filter id="cbglow-sm" x="-150%" y="-150%" width="400%" height="400%">
      <feGaussianBlur stdDeviation="3.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Circle strokes -->
  <circle cx="230" cy="140" r="210" fill="none" stroke="#1c1a17" stroke-width="1.1" opacity="0.26"/>
  <circle cx="570" cy="140" r="210" fill="none" stroke="#1c1a17" stroke-width="1.1" opacity="0.26"/>
  <circle cx="400" cy="350" r="210" fill="none" stroke="#1c1a17" stroke-width="1.1" opacity="0.26"/>
  <!-- Inner rings for depth -->
  <circle cx="230" cy="140" r="201" fill="none" stroke="#1c1a17" stroke-width="0.5" opacity="0.08"/>
  <circle cx="570" cy="140" r="201" fill="none" stroke="#1c1a17" stroke-width="0.5" opacity="0.08"/>
  <circle cx="400" cy="350" r="201" fill="none" stroke="#1c1a17" stroke-width="0.5" opacity="0.08"/>

  <!-- Curved text on each circle -->
  <text font-family="Georgia,serif" font-size="9" fill="#1c1a17" opacity="0.28" letter-spacing="6">
    <textPath href="#cbt1">Eight by Eight by Eight  ·  Eight by Eight by Eight  ·  Eight by Eight by Eight  · </textPath>
  </text>
  <text font-family="Georgia,serif" font-size="9" fill="#1c1a17" opacity="0.28" letter-spacing="6">
    <textPath href="#cbt2" startOffset="33%">Eight by Eight by Eight  ·  Eight by Eight by Eight  ·  Eight by Eight by Eight  · </textPath>
  </text>
  <text font-family="Georgia,serif" font-size="9" fill="#1c1a17" opacity="0.28" letter-spacing="6">
    <textPath href="#cbt3" startOffset="66%">Eight by Eight by Eight  ·  Eight by Eight by Eight  ·  Eight by Eight by Eight  · </textPath>
  </text>

  <!-- Lens-flare sparkles at pairwise intersection points (gold to match paper theme) -->
  <!-- C1∩C2 lower — main central sparkle -->
  <g transform="translate(400,263)">
    <circle r="62" fill="#b8860b" opacity="0.10" filter="url(#cbglow)"/>
    <rect x="-1.2" y="-42" width="2.4" height="84" fill="#b8860b" opacity="0.68" filter="url(#cbglow-sm)"/>
    <rect x="-42" y="-1.2" width="84" height="2.4" fill="#b8860b" opacity="0.68" filter="url(#cbglow-sm)"/>
    <rect x="-0.65" y="-27" width="1.3" height="54" fill="#b8860b" opacity="1" rx="0.5"/>
    <rect x="-27" y="-0.65" width="54" height="1.3" fill="#b8860b" opacity="1" rx="0.5"/>
  </g>
  <!-- C1∩C3 upper -->
  <g transform="translate(440,144)">
    <circle r="42" fill="#b8860b" opacity="0.08" filter="url(#cbglow)"/>
    <rect x="-0.95" y="-30" width="1.9" height="60" fill="#b8860b" opacity="0.55" filter="url(#cbglow-sm)"/>
    <rect x="-30" y="-0.95" width="60" height="1.9" fill="#b8860b" opacity="0.55" filter="url(#cbglow-sm)"/>
    <rect x="-0.55" y="-19" width="1.1" height="38" fill="#b8860b" opacity="0.96" rx="0.4"/>
    <rect x="-19" y="-0.55" width="38" height="1.1" fill="#b8860b" opacity="0.96" rx="0.4"/>
  </g>
  <!-- C2∩C3 upper -->
  <g transform="translate(360,144)">
    <circle r="34" fill="#b8860b" opacity="0.07" filter="url(#cbglow)"/>
    <rect x="-0.85" y="-24" width="1.7" height="48" fill="#b8860b" opacity="0.48" filter="url(#cbglow-sm)"/>
    <rect x="-24" y="-0.85" width="48" height="1.7" fill="#b8860b" opacity="0.48" filter="url(#cbglow-sm)"/>
    <rect x="-0.5" y="-15" width="1" height="30" fill="#b8860b" opacity="0.90" rx="0.3"/>
    <rect x="-15" y="-0.5" width="30" height="1" fill="#b8860b" opacity="0.90" rx="0.3"/>
  </g>
</svg>`;
}

// ── Performance Detail ────────────────────────────────────────────────────────
function renderDetail(perf) {
    const el = document.getElementById('detail-content');
    let html = '';
    let secIdx = 0;

    function section(label, content) {
        const alt = secIdx++ % 2 === 1 ? ' section-alt' : '';
        return `<section class="detail-section${alt}">
            <div class="section-inner">
                <h3 class="section-label">${label}</h3>
                ${content}
            </div>
        </section>`;
    }

    // ── Hero
    const dateStr = fmtDate(perf.date_start, perf.date_end);
    html += `<div class="detail-hero">
        <div class="poster-circles" aria-hidden="true">${circlesBgSVG()}</div>
        <div class="detail-hero-inner">
            ${perf.poster ? `<div class="detail-hero-poster"><img src="${esc(perf.poster)}" alt="${esc(perf.title)}" loading="lazy"></div>` : ''}
            <div class="detail-hero-info">
                ${perf.subtitle ? `<span class="detail-eyebrow">${esc(perf.subtitle)}</span>` : ''}
                <h2 class="detail-title">${esc(perf.title)}</h2>
                <div class="detail-info-grid">
                    ${dateStr ? `<div class="detail-info-item"><span class="detail-info-label">일자</span><span class="detail-info-value">${dateStr}</span></div>` : ''}
                    ${perf.venue ? `<div class="detail-info-item"><span class="detail-info-label">장소</span><span class="detail-info-value">${esc(perf.venue)}</span></div>` : ''}
                </div>
            </div>
        </div>
    </div>`;

    // ── Play cards
    const plays = perf.plays || [];
    if (plays.length > 0) {
        const cards = plays.map(play => {
            return `<div class="team-nav-card" onclick="showTeam('${safeAttr(play.name)}')">
                <div class="team-nav-card-inner">
                    <span class="team-nav-title">${esc(play.name)}</span>
                    ${play.description ? `<p class="team-nav-desc">${esc(play.description)}</p>` : ''}
                </div>
                <span class="team-nav-arrow">→</span>
            </div>`;
        }).join('');
        html += section('공연', cards);
    }

    // ── Staff dept cards
    const generalStaff = (perf.staff || []).filter(s => !s.play_name);
    if (generalStaff.length > 0) {
        const depts = [...new Set(generalStaff.map(s => s.department).filter(Boolean))];
        const cards = depts.map(dept => {
            const members = generalStaff.filter(s => s.department === dept);
            const names = members.map(s => esc(s.name)).join(' · ');
            return `<div class="team-nav-card" onclick="showStaffDept('${safeAttr(dept)}')">
                <div class="team-nav-card-inner">
                    <span class="team-nav-title">${esc(dept)}</span>
                    <p class="team-nav-desc">${names}</p>
                </div>
                <span class="team-nav-arrow">→</span>
            </div>`;
        }).join('');
        html += section('스태프', cards);
    }

    // ── Gallery
    if (perf.photos && perf.photos.length > 0) {
        currentGallery = perf.photos.map(p => p.src);
        const items = perf.photos.map((p, i) =>
            `<div class="gallery-item" onclick="openLightbox(${i})"><img src="${esc(p.src)}" alt="${esc(p.caption || '')}" loading="lazy"></div>`
        ).join('');
        html += section('갤러리', `<div class="gallery-grid">${items}</div>`);
    } else {
        currentGallery = [];
    }

    el.innerHTML = html;
}

// ── Play Team Detail ──────────────────────────────────────────────────────────
function renderTeam(perf, teamName) {
    const el = document.getElementById('team-content');
    let html = '';
    let secIdx = 0;

    function section(label, content) {
        const alt = secIdx++ % 2 === 1 ? ' section-alt' : '';
        return `<section class="detail-section${alt}">
            <div class="section-inner">
                <h3 class="section-label">${label}</h3>
                ${content}
            </div>
        </section>`;
    }

    const play = (perf.plays || []).find(p => p.name === teamName);
    const cast  = (perf.cast  || []).filter(c => c.character === teamName);
    const staff = (perf.staff || []).filter(s => s.play_name  === teamName);

    if (play && play.description) {
        html += `<div class="detail-section"><div class="section-inner">
            <p class="synopsis-text" style="font-style:italic;">${esc(play.description)}</p>
        </div></div>`;
        secIdx++;
    }

    if (cast.length > 0) {
        const cards = cast.map(c => personCard({
            photos: c.photos, role: c.bio, name: c.actor,
            message: c.message, q1: c.q1, q2: c.q2
        })).join('');
        html += section('출연진', `<div class="cast-grid">${cards}</div>`);
    }

    if (staff.length > 0) {
        const cards = staff.map(s => personCard({
            photos: s.photos, role: s.role || s.department, name: s.name,
            message: s.message, q1: s.q1, q2: s.q2
        })).join('');
        html += section('스태프', `<div class="cast-grid">${cards}</div>`);
    }

    el.innerHTML = html || '<div class="section-inner" style="padding:4rem 1.5rem;color:var(--text-muted);text-align:center;">정보가 없습니다.</div>';
    initCarousels(el);
}

// ── Staff Dept Detail ─────────────────────────────────────────────────────────
function renderStaffDept(perf, deptName) {
    const el = document.getElementById('team-content');
    const staff = (perf.staff || []).filter(s => s.department === deptName && !s.play_name);
    const dept = (perf.departments || []).find(d => d.name === deptName);

    if (staff.length === 0 && !dept) {
        el.innerHTML = '<div class="section-inner" style="padding:4rem 1.5rem;color:var(--text-muted);text-align:center;">정보가 없습니다.</div>';
        return;
    }

    let html = '';
    if (dept && dept.description) {
        html += `<div class="detail-section"><div class="section-inner">
            <p class="synopsis-text" style="font-style:italic;">${esc(dept.description)}</p>
        </div></div>`;
    }

    if (staff.length > 0) {
        const cards = staff.map(s => personCard({
            photos: s.photos, role: s.role || null, name: s.name,
            message: s.message, q1: s.q1, q2: s.q2
        })).join('');
        html += `<section class="detail-section">
            <div class="section-inner">
                <div class="cast-grid">${cards}</div>
            </div>
        </section>`;
    }

    el.innerHTML = html;
    initCarousels(el);
}

// ── Person card ───────────────────────────────────────────────────────────────
function personCard(member) {
    const { photos, role, name, message, q1, q2 } = member;
    const imgs = (Array.isArray(photos) ? photos : [photos]).filter(Boolean);
    // Single-quoted HTML attr: only &#39; needs escaping (&#39; decodes to ' via dataset API)
    const mj = JSON.stringify(member).replace(/'/g, '&#39;');
    let photoBlock;
    if (imgs.length === 0) {
        photoBlock = `<div class="cast-photo cast-photo-zoom profile-trigger" data-member='${mj}'>
            <div class="cast-photo-placeholder">☺</div>
        </div>`;
    } else if (imgs.length === 1) {
        photoBlock = `<div class="cast-photo cast-photo-zoom profile-trigger" data-member='${mj}'>
            <img src="${esc(imgs[0])}" alt="${esc(name)}" loading="lazy">
        </div>`;
    } else {
        const slides = imgs.map((src, i) =>
            `<div class="cast-slide${i === 0 ? ' active' : ''}"><img src="${esc(src)}" alt="${esc(name)}" loading="lazy"></div>`
        ).join('');
        const dots = imgs.map((_, i) =>
            `<span class="carousel-dot${i === 0 ? ' active' : ''}"></span>`
        ).join('');
        photoBlock = `<div class="cast-photo carousel cast-photo-zoom" data-member='${mj}'>
            ${slides}
            <button class="carousel-btn carousel-prev" type="button">&#8249;</button>
            <button class="carousel-btn carousel-next" type="button">&#8250;</button>
        </div><div class="carousel-dots">${dots}</div>`;
    }
    return `<div class="cast-card">
        ${photoBlock}
        ${role ? `<span class="cast-character">${esc(role)}</span>` : ''}
        <span class="cast-actor">${esc(name)}</span>
        ${message ? `<span class="cast-message">${esc(message)}</span>` : ''}
    </div>`;
}

// ── Single-photo / placeholder profile trigger ────────────────────────────────
function initProfileTriggers(root) {
    (root || document).querySelectorAll('.profile-trigger').forEach(el => {
        el.addEventListener('click', () => {
            try {
                const member = JSON.parse(el.dataset.member || 'null');
                if (member) openPersonProfile(member);
            } catch (e) {}
        });
    });
}

// ── Carousel init ─────────────────────────────────────────────────────────────
function initCarousels(root) {
    initProfileTriggers(root);
    (root || document).querySelectorAll('.cast-photo.carousel').forEach(el => {
        const slides = el.querySelectorAll('.cast-slide');
        const dotsEl = el.nextElementSibling;
        const dots   = dotsEl ? dotsEl.querySelectorAll('.carousel-dot') : [];
        let idx = 0;

        function goTo(n) {
            const newIdx = ((n % slides.length) + slides.length) % slides.length;
            if (newIdx === idx) return;
            const dir = n >= idx ? 1 : -1;
            const cur = slides[idx];
            const inc = slides[newIdx];

            // snap incoming off-screen (no transition)
            inc.style.transition = 'none';
            inc.style.transform = `translateX(${dir > 0 ? 100 : -100}%)`;
            inc.offsetWidth; // force reflow

            // animate both
            inc.style.transition = '';
            inc.style.transform = 'translateX(0%)';
            cur.style.transform = `translateX(${dir > 0 ? -100 : 100}%)`;

            if (dots[idx]) dots[idx].classList.remove('active');
            idx = newIdx;
            if (dots[idx]) dots[idx].classList.add('active');
        }

        // Arrow buttons
        const prev = el.querySelector('.carousel-prev');
        const next = el.querySelector('.carousel-next');
        if (prev) prev.addEventListener('click', e => { e.stopPropagation(); goTo(idx - 1); });
        if (next) next.addEventListener('click', e => { e.stopPropagation(); goTo(idx + 1); });

        // Dot clicks
        dots.forEach((d, i) => d.addEventListener('click', e => { e.stopPropagation(); goTo(i); }));

        // Touch swipe
        let tx = 0;
        el.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
        el.addEventListener('touchend',   e => {
            const dx = e.changedTouches[0].clientX - tx;
            if (Math.abs(dx) > 40) goTo(dx < 0 ? idx + 1 : idx - 1);
        }, { passive: true });

        // Mouse drag + zoom click
        let mx = 0, dragging = false;
        el.addEventListener('mousedown', e => { mx = e.clientX; dragging = true; });
        el.addEventListener('mouseup',   e => {
            if (!dragging) return;
            dragging = false;
            const dx = e.clientX - mx;
            if (Math.abs(dx) > 40) { goTo(dx < 0 ? idx + 1 : idx - 1); return; }
            // short click → open profile modal
            if (!e.target.closest('.carousel-btn')) {
                const member = JSON.parse(el.dataset.member || 'null');
                if (member) openPersonProfile(member);
            }
        });
        el.addEventListener('mouseleave', () => { dragging = false; });
    });
}

// ── Person profile modal ──────────────────────────────────────────────────────
function openPersonProfile(member) {
    const overlay = document.getElementById('profile-overlay');
    const q1_text = (currentPerf && currentPerf.q1_text) || '';
    const q2_text = (currentPerf && currentPerf.q2_text) || '';

    // Photo area
    const photoArea = document.getElementById('profile-photo-area');
    const imgs = (Array.isArray(member.photos) ? member.photos : [member.photos]).filter(Boolean);
    if (imgs.length === 0) {
        photoArea.innerHTML = `<div class="profile-photo-placeholder">☺</div>`;
    } else if (imgs.length === 1) {
        photoArea.innerHTML = `<img src="${esc(imgs[0])}" alt="${esc(member.name || '')}" class="profile-photo-img profile-zoom-btn">`;
        photoArea.querySelector('img').addEventListener('click', () => {
            currentGallery = imgs;
            openLightbox(0);
        });
    } else {
        let modalSlideIdx = 0;
        const slides = imgs.map((src, i) =>
            `<div class="cast-slide${i === 0 ? ' active' : ''}"><img src="${esc(src)}" alt="${esc(member.name || '')}" style="width:100%;height:100%;object-fit:cover;cursor:zoom-in;"></div>`
        ).join('');
        const dots = imgs.map((_, i) =>
            `<span class="carousel-dot${i === 0 ? ' active' : ''}"></span>`
        ).join('');
        photoArea.innerHTML = `
            <div class="cast-photo carousel profile-photo-carousel profile-zoom-btn" data-photos='${JSON.stringify(imgs).replace(/'/g,"&#39;")}'>
                ${slides}
                <button class="carousel-btn carousel-prev" type="button">&#8249;</button>
                <button class="carousel-btn carousel-next" type="button">&#8250;</button>
            </div>
            <div class="carousel-dots" style="margin-top:0.6rem;">${dots}</div>`;
        const carouselEl = photoArea.querySelector('.cast-photo.carousel');
        initCarousels(photoArea);
        // Open lightbox on click — read active dot to know current slide
        carouselEl.addEventListener('click', e => {
            if (e.target.closest('.carousel-btn')) return;
            const dotsEl = carouselEl.nextElementSibling;
            const dots = dotsEl ? Array.from(dotsEl.querySelectorAll('.carousel-dot')) : [];
            const activeIdx = dots.findIndex(d => d.classList.contains('active'));
            currentGallery = imgs;
            openLightbox(activeIdx >= 0 ? activeIdx : 0);
        });
    }

    // Text info
    document.getElementById('profile-role').textContent = member.role || '';
    document.getElementById('profile-name').textContent = member.name || '';
    const msgEl = document.getElementById('profile-message');
    if (member.message) { msgEl.textContent = member.message; msgEl.style.display = ''; }
    else { msgEl.style.display = 'none'; }

    // Q&A
    const qaEl = document.getElementById('profile-qa');
    let qaHtml = '';
    if (member.q1) {
        qaHtml += `<div class="profile-qa-item">
            ${q1_text ? `<span class="profile-qa-q">${esc(q1_text)}</span>` : ''}
            <span class="profile-qa-a">${esc(member.q1)}</span>
        </div>`;
    }
    if (member.q2) {
        qaHtml += `<div class="profile-qa-item">
            ${q2_text ? `<span class="profile-qa-q">${esc(q2_text)}</span>` : ''}
            <span class="profile-qa-a">${esc(member.q2)}</span>
        </div>`;
    }
    qaEl.innerHTML = qaHtml;
    qaEl.style.display = qaHtml ? '' : 'none';

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePersonProfile() {
    const overlay = document.getElementById('profile-overlay');
    if (!overlay.classList.contains('active')) return;
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function openLightbox(idx) {
    if (!currentGallery.length) return;
    lightboxIdx = ((idx % currentGallery.length) + currentGallery.length) % currentGallery.length;
    document.getElementById('lightbox-img').src = currentGallery[lightboxIdx];
    document.getElementById('lightbox').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lb = document.getElementById('lightbox');
    if (!lb.classList.contains('active')) return;
    lb.classList.remove('active');
    document.getElementById('lightbox-img').src = '';
    document.body.style.overflow = '';
}

function lightboxNav(dir, e) {
    if (e) e.stopPropagation();
    if (!currentGallery.length) return;
    openLightbox(lightboxIdx + dir);
}