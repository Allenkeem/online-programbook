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
    <path id="cbt1" d="M 440,140 A 210,210 0 1 0 20,140 A 210,210 0 1 0 440,140"/>
    <path id="cbt2" d="M 780,140 A 210,210 0 1 0 360,140 A 210,210 0 1 0 780,140"/>
    <path id="cbt3" d="M 610,350 A 210,210 0 1 0 190,350 A 210,210 0 1 0 610,350"/>
  </defs>

  <!-- Circle strokes -->
  <circle cx="230" cy="140" r="210" fill="none" stroke="#1c1a17" stroke-width="1.1" opacity="0.26"/>
  <circle cx="570" cy="140" r="210" fill="none" stroke="#1c1a17" stroke-width="1.1" opacity="0.26"/>
  <circle cx="400" cy="350" r="210" fill="none" stroke="#1c1a17" stroke-width="1.1" opacity="0.26"/>
  <!-- Inner rings -->
  <circle cx="230" cy="140" r="201" fill="none" stroke="#1c1a17" stroke-width="0.5" opacity="0.08"/>
  <circle cx="570" cy="140" r="201" fill="none" stroke="#1c1a17" stroke-width="0.5" opacity="0.08"/>
  <circle cx="400" cy="350" r="201" fill="none" stroke="#1c1a17" stroke-width="0.5" opacity="0.08"/>

  <!-- Curved text -->
  <text font-family="Georgia,serif" font-size="9" fill="#1c1a17" opacity="0.28" letter-spacing="6">
    <textPath href="#cbt1">Eight by Eight by Eight  ·  Eight by Eight by Eight  ·  Eight by Eight by Eight  · </textPath>
  </text>
  <text font-family="Georgia,serif" font-size="9" fill="#1c1a17" opacity="0.28" letter-spacing="6">
    <textPath href="#cbt2" startOffset="33%">Eight by Eight by Eight  ·  Eight by Eight by Eight  ·  Eight by Eight by Eight  · </textPath>
  </text>
  <text font-family="Georgia,serif" font-size="9" fill="#1c1a17" opacity="0.28" letter-spacing="6">
    <textPath href="#cbt3" startOffset="66%">Eight by Eight by Eight  ·  Eight by Eight by Eight  ·  Eight by Eight by Eight  · </textPath>
  </text>
</svg>`;
}

// ── Performance Detail ────────────────────────────────────────────────────────
function renderDetail(perf) {
    const el = document.getElementById('detail-content');
    let html = '';
    let secIdx = 0;

    function section(label, content) {
        const idx = secIdx++;
        const cls = idx % 2 === 1 ? ' section-dark' : '';
        const num = String(idx + 1).padStart(2, '0');
        const id = 'sec-' + label.replace(/\s+/g, '');
        return `<section class="detail-section${cls}" id="${id}">
            <div class="section-inner">
                <h3 class="section-label"><span class="section-label-num">${num}</span>${label}</h3>
                ${content}
            </div>
        </section>`;
    }

    // ── Hero + TOC
    const dateStr = fmtDate(perf.date_start, perf.date_end);
    const plays = perf.plays || [];
    const generalStaff = (perf.staff || []).filter(s => !s.play_name);
    const hasGallery = perf.photos && perf.photos.length > 0;

    const tocItems = [
        { label: '기획의 말', id: 'sec-기획의말' },
        { label: '시놉시스', id: 'sec-시놉시스' },
        ...(plays.length > 0 ? [{ label: '공연', id: 'sec-공연' }] : []),
        ...(generalStaff.length > 0 ? [{ label: '스태프', id: 'sec-스태프' }] : []),
        ...(hasGallery ? [{ label: '갤러리', id: 'sec-갤러리' }] : []),
    ];
    const tocLinks = tocItems.map(t => `<a href="#${t.id}" class="toc-link">${esc(t.label)}</a>`).join('');

    html += `<div class="detail-hero">
        <div class="detail-hero-inner">
            <div class="detail-hero-info">
                ${perf.subtitle ? `<span class="detail-eyebrow">${esc(perf.subtitle)}</span>` : ''}
                <h2 class="detail-title">${esc(perf.title)}</h2>
                <div class="detail-info-grid">
                    ${dateStr ? `<div class="detail-info-item"><span class="detail-info-label">일자</span><span class="detail-info-value">${dateStr}</span></div>` : ''}
                    ${perf.venue ? `<div class="detail-info-item"><span class="detail-info-label">장소</span><span class="detail-info-value">${esc(perf.venue)}</span></div>` : ''}
                </div>
            </div>
        </div>
    </div>
    <nav class="detail-toc"><div class="detail-toc-inner">${tocLinks}</div></nav>`;

    // ── 프로그램북 인사 문구
    html += `<div class="detail-intro">
        <p>서강연극회는 공연에 대한 다양한 정보를 많은 관객분들과 나누고자 프로그램북을 온라인으로 제공하고 있습니다.</p>
        <p>본 프로그램북이 연극과 더욱 가까워지는 계기가 될 수 있었으면 합니다.<br>서강연극회는 앞으로도 더욱 좋은 공연으로 찾아오겠습니다. 감사합니다.</p>
    </div>`;

    // ── 포스터
    if (perf.poster) {
        html += `<div class="detail-poster-section">
            <img src="${esc(perf.poster)}" alt="${esc(perf.title)} 포스터" class="detail-poster-full">
        </div>`;
    }

    // ── 기획의 말
    const greetingText = perf.greeting ||
        '기획의 말이 아직 작성되지 않았습니다.\n어드민 페이지에서 입력해주세요.';
    html += section('기획의 말', `<p class="greeting-text">${esc(greetingText)}</p>`);

    // ── 시놉시스 (극별)
    if (plays.length > 0) {
        const synopsisBlocks = plays.map(play => {
            const text = play.description ||
                '시놉시스가 아직 작성되지 않았습니다.\n어드민 페이지에서 입력해주세요.';
            return `<div class="synopsis-block">
                <div class="synopsis-block-header">
                    <span class="play-group-title">${esc(play.name)}</span>
                </div>
                <p class="synopsis-text">${esc(text)}</p>
            </div>`;
        }).join('');
        html += section('시놉시스', synopsisBlocks);
    }

    // ── 공연 (극별 얼굴 → 팀 페이지)
    if (plays.length > 0) {
        const groups = plays.map(play => {
            const cast = (perf.cast || []).filter(c => c.character === play.name);
            const faceCards = cast.map(c => {
                const imgs = (Array.isArray(c.photos) ? c.photos : [c.photos]).filter(Boolean);
                const photo = imgs.length > 0
                    ? `<img src="${esc(imgs[0])}" alt="${esc(c.actor)}" loading="lazy">`
                    : `<div class="cast-photo-placeholder">☺</div>`;
                return `<div class="cast-card cast-card-nav" onclick="showTeam('${safeAttr(play.name)}')">
                    <div class="cast-photo">${photo}</div>
                    ${c.character_role ? `<span class="cast-character">${esc(c.character_role)}</span>` : (c.bio ? `<span class="cast-character">${esc(c.bio)}</span>` : '')}
                    <span class="cast-actor">${esc(c.actor)}</span>
                </div>`;
            }).join('');
            return `<div class="play-group">
                <div class="play-group-header" onclick="showTeam('${safeAttr(play.name)}')">
                    <span class="play-group-title">${esc(play.name)}</span>
                    <span class="play-group-arrow">→</span>
                </div>
                ${cast.length > 0 ? `<div class="cast-grid">${faceCards}</div>` : ''}
            </div>`;
        }).join('');
        html += section('공연', groups);
    }

    // ── 스태프 (부서별 얼굴 → 부서 페이지)
    if (generalStaff.length > 0) {
        const DEPT_ORDER = ['기획', '기획팀', '디자인', '디자인팀', '연출', '연출팀', '무대', '무대팀', '조명', '조명팀', '음향', '음향팀', '의상', '의상팀', '분장', '분장팀', '소품', '소품팀', '의상소품분장'];
        const rawDepts = [...new Set(generalStaff.map(s => s.department).filter(Boolean))];
        const depts = rawDepts.sort((a, b) => {
            const ai = DEPT_ORDER.indexOf(a), bi = DEPT_ORDER.indexOf(b);
            if (ai === -1 && bi === -1) return 0;
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
        });
        const groups = depts.map(dept => {
            const members = generalStaff.filter(s => s.department === dept);
            const faceCards = members.map(s => {
                const imgs = (Array.isArray(s.photos) ? s.photos : [s.photos]).filter(Boolean);
                const photo = imgs.length > 0
                    ? `<img src="${esc(imgs[0])}" alt="${esc(s.name)}" loading="lazy">`
                    : `<div class="cast-photo-placeholder">☺</div>`;
                return `<div class="cast-card cast-card-nav" onclick="showStaffDept('${safeAttr(dept)}')">
                    <div class="cast-photo">${photo}</div>
                    <span class="cast-character">${esc(s.role || '')}</span>
                    <span class="cast-actor">${esc(s.name)}</span>
                </div>`;
            }).join('');
            return `<div class="play-group">
                <div class="play-group-header" onclick="showStaffDept('${safeAttr(dept)}')">
                    <span class="play-group-title">${esc(dept)}</span>
                    <span class="play-group-arrow">→</span>
                </div>
                ${members.length > 0 ? `<div class="cast-grid">${faceCards}</div>` : ''}
            </div>`;
        }).join('');
        html += section('스태프', groups);
    }

    // ── 갤러리
    if (hasGallery) {
        currentGallery = perf.photos.map(p => p.src);
        const items = perf.photos.map((p, i) =>
            `<div class="gallery-item" onclick="openLightbox(${i})"><img src="${esc(p.src)}" alt="${esc(p.caption || '')}" loading="lazy"></div>`
        ).join('');
        html += section('갤러리', `<div class="gallery-grid">${items}</div>`);
    } else {
        currentGallery = [];
    }

    html += renderHistory();

    el.innerHTML = html;
    initCarousels(el);
}

function renderHistory() {
    const TYPE_LABEL = { 정기:'정기', 워크샵:'워크샵', 임시:'임시', 신입:'신입', 소공연:'소공연', 스터디:'스터디', 축제:'축제', 지방:'지방', 비정기:'비정기' };
    const TYPE_CLASS = { 정기:'hist-badge-regular', 워크샵:'hist-badge-workshop', 임시:'hist-badge-etc', 신입:'hist-badge-etc', 소공연:'hist-badge-etc', 스터디:'hist-badge-etc', 축제:'hist-badge-etc', 지방:'hist-badge-etc', 비정기:'hist-badge-etc' };

    const tabs = SG_HISTORY.map((d, i) =>
        `<button class="hist-tab${i === SG_HISTORY.length - 1 ? ' active' : ''}" data-decade="${d.decade}">${d.decade}</button>`
    ).join('');

    const panels = SG_HISTORY.map((d, i) => {
        const rows = d.entries.map(e => {
            const badge = `<span class="hist-badge ${TYPE_CLASS[e.type] || 'hist-badge-etc'}">${e.num || TYPE_LABEL[e.type] || e.type}</span>`;
            const meta = [e.year, e.season].filter(Boolean).join(' · ');
            const producer = e.producer ? `<span class="hist-producer">${esc(e.producer)} 기획</span>` : '';
            const subtitle = e.subtitle ? `<span class="hist-subtitle">〈${esc(e.subtitle)}〉</span>` : '';
            const note = e.note ? `<span class="hist-note">${esc(e.note)}</span>` : '';
            const plays = e.plays.map(p =>
                `<div class="hist-play"><span class="hist-play-title">${esc(p.title)}</span>${p.credits ? `<span class="hist-play-credits">${esc(p.credits)}</span>` : ''}</div>`
            ).join('');
            return `<div class="hist-entry">
                <div class="hist-entry-head">${badge}${meta ? `<span class="hist-meta">${esc(meta)}</span>` : ''}${note}</div>
                <div class="hist-entry-body">${producer}${subtitle}${plays}</div>
            </div>`;
        }).join('');
        return `<div class="hist-panel${i === SG_HISTORY.length - 1 ? ' active' : ''}" data-decade="${d.decade}">${rows}</div>`;
    }).join('');

    return `<section class="detail-section section-dark hist-section" id="sec-연보">
        <div class="section-inner">
            <span class="section-label">공연 연보</span>
            <div class="hist-tabs">${tabs}</div>
            <div class="hist-panels">${panels}</div>
            <p class="hist-closing">1960년부터, 지금 여기 — 서강연극회는 무대 위에 있습니다.</p>
        </div>
    </section>`;
}

// ── Play Team Detail ──────────────────────────────────────────────────────────
function renderTeam(perf, teamName) {
    const el = document.getElementById('team-content');
    let html = '';
    let secIdx = 0;

    function section(label, content) {
        const idx = secIdx++;
        const cls = idx % 2 === 1 ? ' section-dark' : '';
        const num = String(idx + 1).padStart(2, '0');
        return `<section class="detail-section${cls}">
            <div class="section-inner">
                <h3 class="section-label"><span class="section-label-num">${num}</span>${label}</h3>
                ${content}
            </div>
        </section>`;
    }

    const play = (perf.plays || []).find(p => p.name === teamName);
    const cast  = (perf.cast  || []).filter(c => c.character === teamName);
    const staff = (perf.staff || []).filter(s => s.play_name  === teamName);

    if (play && play.director_note) {
        html += `<div class="detail-section"><div class="section-inner">
            <p class="section-label">연출의 말</p>
            <p style="font-size:0.9rem;color:var(--text-muted);line-height:1.9;margin:0;">${esc(play.director_note)}</p>
        </div></div>`;
        secIdx++;
    }

    if (cast.length > 0) {
        const cards = cast.map(c => personCard({
            photos: c.photos, character_role: c.character_role, role: c.bio, name: c.actor,
            message: c.message, q1: c.q1, q2: c.q2,
            major: c.major, student_id: c.student_id, history: c.history,
            character_intro: c.character_intro, actor_intro: c.actor_intro
        }, true)).join('');
        html += section('출연진', `<div class="cast-grid">${cards}</div>`);
    }

    if (staff.length > 0) {
        const cards = staff.map(s => personCard({
            photos: s.photos, role: s.role || s.department, name: s.name,
            message: s.message, q1: s.q1, q2: s.q2,
            major: s.major, student_id: s.student_id, history: s.history
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
            message: s.message, q1: s.q1, q2: s.q2,
            major: s.major, student_id: s.student_id, history: s.history
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
function personCard(member, showIntro = false) {
    const { photos, character_role, role, name, message, q1, q2, character_intro, actor_intro } = member;
    const introText = actor_intro || message || '';
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
        ${character_role ? `<span class="cast-character">${esc(character_role)}</span>` : (role ? `<span class="cast-character">${esc(role)}</span>` : '')}
        <span class="cast-actor">${esc(name)}</span>
        ${message ? `<span class="cast-message">${esc(message)}</span>` : ''}
        ${actor_intro ? `<p class="cast-intro-text">${esc(actor_intro)}</p>` : ''}
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

// ── History tab switching ─────────────────────────────────────────────────────
document.addEventListener('click', e => {
    const tab = e.target.closest('.hist-tab');
    if (!tab) return;
    const decade = tab.dataset.decade;
    const section = tab.closest('.hist-section');
    section.querySelectorAll('.hist-tab').forEach(t => t.classList.toggle('active', t.dataset.decade === decade));
    section.querySelectorAll('.hist-panel').forEach(p => p.classList.toggle('active', p.dataset.decade === decade));
});

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
    document.getElementById('profile-role').textContent = member.character_role || member.role || '';
    document.getElementById('profile-name').textContent = member.name || '';
    const metaParts = [member.major, member.student_id].filter(Boolean);
    const metaEl = document.getElementById('profile-meta');
    if (metaParts.length > 0) { metaEl.textContent = metaParts.join(' · '); metaEl.style.display = ''; }
    else { metaEl.style.display = 'none'; }
    const histEl = document.getElementById('profile-history');
    if (member.history) { histEl.textContent = member.history; histEl.style.display = ''; }
    else { histEl.style.display = 'none'; }
    // 대사 (actor_intro 있을 때만 표시)
    const msgEl = document.getElementById('profile-message');
    if (member.actor_intro && member.message) { msgEl.textContent = member.message; msgEl.style.display = ''; }
    else { msgEl.style.display = 'none'; }

    // 소개 (actor_intro 우선, 없으면 message)
    const introEl = document.getElementById('profile-intro');
    const introText = member.actor_intro || member.message || '';
    if (introText) { introEl.textContent = introText; introEl.style.display = ''; }
    else { introEl.style.display = 'none'; }

    // 배역 소개
    const charIntroBlock = document.getElementById('profile-character-intro-block');
    const charIntroText = document.getElementById('profile-character-intro-text');
    if (member.character_intro) {
        charIntroText.textContent = member.character_intro;
        charIntroBlock.style.display = '';
    } else {
        charIntroBlock.style.display = 'none';
    }

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