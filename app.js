// ══════════════════════════════════════════════════════════
//  HMSI PILAR AKSI — App Logic
// ══════════════════════════════════════════════════════════

// ── HELPERS ─────────────────────────────────────────────────
function getBandClass(band) {
    const map = {
        'Outstanding': 'badge-outstanding',
        'Excellent': 'badge-excellent',
        'Very Good': 'badge-verygood',
        'Good': 'badge-good',
        'Fair': 'badge-fair',
        'Needs Improvement': 'badge-needs',
    };
    return map[band] || 'badge-good';
}

function getInitials(name) {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function getAvatarColor(idx) {
    return AVATARCOLORS[idx % AVATARCOLORS.length];
}

// ── NAVIGATION ───────────────────────────────────────────────
function showPage(pageId, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('page-' + pageId).classList.add('active');
    if (el) el.classList.add('active');

    const titles = {
        dashboard: 'Dashboard',
        members: 'Functional Members',
        departments: 'Departments',
        assessment: 'Assessment Input',
        'report-preview': 'Report Cards',
        analytics: 'Analytics',
        settings: 'Settings',
    };
    document.getElementById('topbar-title').textContent = titles[pageId] || pageId;
    if (pageId === 'analytics') initAnalyticsCharts();
}

function showReportPage(idx, btn) {
    for (let i = 0; i < 6; i++) {
        const page = document.getElementById('rp-' + i);
        if (i === idx) {
            if (page.classList.contains('cover-page') || page.classList.contains('perf-page')) {
                page.style.display = 'flex';
                if (page.classList.contains('perf-page')) setTimeout(initRadarChart, 100);
            } else {
                page.style.display = 'block';
            }
        } else {
            page.style.display = 'none';
        }
    }
    document.querySelectorAll('.page-nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// ── RENDER: TOP PERFORMERS TABLE ─────────────────────────────
function renderTopPerformers() {
    const tbody = document.getElementById('top-performers-table');
    const withScore = MEMBERS_DATA.filter(m => m.score !== null);
    const sorted = withScore.sort((a, b) => b.score - a.score).slice(0, 10);

    if (sorted.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:24px;">Belum ada data assessment</td></tr>`;
        return;
    }

    tbody.innerHTML = sorted.map((m, i) => `
        <tr>
            <td><span class="rank-tag ${i < 3 ? 'rank-' + (i + 1) : 'rank-n'}">${i + 1}</span></td>
            <td>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div class="member-avatar" style="background:${getAvatarColor(i)};color:white;">${getInitials(m.name)}</div>
                    <span style="font-weight:500;color:var(--text-primary);font-size:13px;">${m.name}</span>
                </div>
            </td>
            <td>${m.dept}</td>
            <td><b style="color:var(--text-primary)">${m.score}</b></td>
            <td><span class="badge ${getBandClass(m.band)}">${m.band}</span></td>
        </tr>
    `).join('');
}

// ── RENDER: DEPARTMENT RANKINGS ──────────────────────────────
function renderDeptRankings() {
    const el = document.getElementById('dept-ranking-list');
    const deptAvgs = {};
    DEPTS_DATA.forEach(d => { deptAvgs[d.name] = { sum: 0, count: 0 }; });
    MEMBERS_DATA.forEach(m => {
        if (m.score !== null && deptAvgs[m.dept_name]) {
            deptAvgs[m.dept_name].sum += parseFloat(m.score);
            deptAvgs[m.dept_name].count += 1;
        }
    });

    const depts = DEPTS_DATA.map(d => ({
        ...d,
        computedAvg: deptAvgs[d.name].count > 0
            ? +(deptAvgs[d.name].sum / deptAvgs[d.name].count).toFixed(1)
            : null,
    }));

    const sorted = [...depts].sort((a, b) => (b.computedAvg || 0) - (a.computedAvg || 0));

    el.innerHTML = sorted.map((d, i) => `
        <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #F0F5FA;">
            <span class="rank-tag ${i < 3 ? 'rank-' + (i + 1) : 'rank-n'}" style="flex-shrink:0;">${i + 1}</span>
            <div style="flex:1;">
                <div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:4px;">${d.name}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width:${d.computedAvg || 0}%;background:linear-gradient(90deg,${d.color},${d.color}88);"></div>
                </div>
            </div>
            <div style="font-size:14px;font-weight:800;color:var(--text-primary);min-width:40px;text-align:right;">${d.computedAvg ?? '—'}</div>
            <div style="font-size:11px;color:var(--text-muted);min-width:44px;text-align:right;">mbr</div>
        </div>
    `).join('');
}

function renderMembersTable(filteredData = MEMBERS_DATA) {
    const tbody = document.getElementById('members-table-body');
    const countEl = document.getElementById('members-count');

    if (countEl) countEl.textContent = `${filteredData.length} anggota`;

    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px;">Data tidak ditemukan</td></tr>`;
        return;
    }

    tbody.innerHTML = filteredData.map((m, i) => `
        <tr>
            <td>
                <div class="member-cell">
                    <div class="member-avatar" style="background:${getAvatarColor(i)};color:white;">${getInitials(m.name)}</div>
                    <span class="member-name">${m.name}</span>
                </div>
            </td>
            <td style="font-family:monospace;font-size:12px;">${m.nrp}</td>
            <td>${m.dept_name}</td>
            <td>${m.pos}</td>
            <td>${m.batch}</td>
            <td><b style="color:var(--text-primary)">${m.score ?? '—'}</b></td>
            <td>
                ${m.score
            ? `<span class="badge ${getBandClass(m.band)}">${m.band}</span>`
            : '<span style="font-size:12px;color:var(--text-muted);">Pending</span>'}
            </td>
            <td>
                <div style="display:flex;gap:6px;justify-content:center;">
                    <button class="topbar-action btn-outline" style="padding:4px 10px;font-size:11px;"><i class="fas fa-edit"></i></button>
                    <button class="topbar-action btn-outline" style="padding:4px 10px;font-size:11px;"
                        onclick="showPage('report-preview', document.querySelectorAll('.nav-item')[4])">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function handleFilters() {
    const dept = document.getElementById('filter-dept').value;
    const batch = document.getElementById('filter-batch').value;
    const band = document.getElementById('filter-band').value;

    const filtered = MEMBERS_DATA.filter(m => {
        const matchDept = !dept || m.dept_name === dept;
        const matchBatch = !batch || m.batch === batch;
        const matchBand = !band || m.band === band;
        return matchDept && matchBatch && matchBand;
    });

    renderMembersTable(filtered);
}

function updateMemberCount() {
    const badge = document.querySelector('.nav-badge');
    if (badge) badge.textContent = MEMBERS_DATA.length;
    const statVal = document.querySelector('.stat-card.blue .stat-value');
    if (statVal) statVal.textContent = MEMBERS_DATA.length;
}

function renderDeptCards() {
    const grid = document.getElementById('dept-cards-grid');
    grid.innerHTML = DEPTS_DATA.map(d => `
        <div class="dept-card">
            <div class="dept-icon-wrap">
                <img src="Logo Departemen/${d.name}.png" alt="${d.name}" style="width:26px;height:26px;object-fit:contain;">
            </div>
            <div style="flex:1;">
                <div style="font-size:13px;font-weight:700;color:var(--text-primary);">${d.name}</div>
                <div style="font-size:11px;color:var(--text-muted);">${d.fullname}</div>
                <div style="display:flex;gap:12px;margin-top:8px;">
                    <span style="font-size:11px;color:var(--text-secondary);"><b style="color:var(--text-primary)">—</b> anggota</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function submitAssessment() {
    const memberId = document.getElementById('assessment-member-select').value;
    const scoreText = document.getElementById('total-score-live').textContent;
    const score = parseFloat(scoreText);

    const selectedBtns = document.querySelectorAll('.rating-btn.selected');
    if (!memberId || isNaN(score) || selectedBtns.length < 16) {
        alert('Harap pilih anggota dan isi semua 16 penilaian!');
        return;
    }

    const ratings = Array.from(selectedBtns).map(b => parseInt(b.textContent));

    const notes = {
        appreciation: document.getElementById('assessment-appreciation').value,
        suggestions: document.getElementById('assessment-suggestions').value,
        message: document.getElementById('assessment-message').value
    };

    let band = 'Good';
    if (score >= 95) band = 'Outstanding';
    else if (score >= 85) band = 'Excellent';
    else if (score >= 75) band = 'Very Good';
    else if (score >= 65) band = 'Good';
    else if (score >= 50) band = 'Fair';
    else band = 'Needs Improvement';

    try {
        const res = await fetch(`${API_URL}/assessments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId, score, band, ratings, notes })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        alert(data.message);

        // Reset form
        document.querySelectorAll('.rating-btn.selected').forEach(b => b.classList.remove('selected'));
        document.getElementById('total-score-live').textContent = '0';
        document.getElementById('assessment-appreciation').value = '';
        document.getElementById('assessment-suggestions').value = '';
        document.getElementById('assessment-message').value = '';

        await refreshData();
        showPage('dashboard', document.querySelectorAll('.nav-item')[0]);
    } catch (err) {
        alert('Gagal menyimpan raport: ' + err.message);
    }
}

// ── ASSESSMENT ───────────────────────────────────────────────
function selectRating(btn, val) {
    const group = btn.closest('.rating-btns');
    group.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

function calcTotalScore() {
    const selected = document.querySelectorAll('.rating-btn.selected');
    const liveEl = document.getElementById('total-score-live');
    if (selected.length < 16) {
        liveEl.textContent = `${selected.length}/16 diisi`;
        return;
    }

    const ratings = Array.from(selected).map(b => parseInt(b.textContent));

    // Pilar 1: 4 indikator (bobot 22%)
    const p1Sum = ratings.slice(0, 4).reduce((a, b) => a + b, 0);
    const p1Score = (p1Sum / 16) * 22;

    // Pilar 2: 4 indikator (bobot 25%)
    const p2Sum = ratings.slice(4, 8).reduce((a, b) => a + b, 0);
    const p2Score = (p2Sum / 16) * 25;

    // Pilar 3: 4 indikator (bobot 23%)
    const p3Sum = ratings.slice(8, 12).reduce((a, b) => a + b, 0);
    const p3Score = (p3Sum / 16) * 23;

    // Pilar 4: 4 indikator (bobot 30%)
    const p4Sum = ratings.slice(12, 16).reduce((a, b) => a + b, 0);
    const p4Score = (p4Sum / 16) * 30;

    const totalScore = (p1Score + p2Score + p3Score + p4Score).toFixed(1);
    liveEl.textContent = totalScore;
}

// ══════════════════════════════════════════════════════════
//  CHARTS
// ══════════════════════════════════════════════════════════
let chartsInit = false;
let radarInit = false;
let analyticsInit = false;

function initDashboardCharts() {
    if (chartsInit) return;
    chartsInit = true;

    // Score Distribution
    new Chart(document.getElementById('scoreDistChart'), {
        type: 'bar',
        data: {
            labels: ['Outstanding\n95–100', 'Excellent\n85–94', 'Very Good\n75–84', 'Good\n65–74', 'Fair\n50–64', 'Needs Imp.'],
            datasets: [{
                label: 'Jumlah Anggota',
                data: [0, 0, 0, 0, 0, 0], // akan berisi 0 karena belum ada assessment
                backgroundColor: ['#FDF3C8', '#DBE9F8', '#F0FDF4', '#F5F3FF', '#FFF7ED', '#FEF2F2'],
                borderColor: ['#D4A017', '#1E56A0', '#22C55E', '#8B5CF6', '#C2410C', '#B91C1C'],
                borderWidth: 1.5, borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#F0F5FA' }, ticks: { font: { size: 11 } } },
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
            },
        },
    });

    // Monthly Trend
    new Chart(document.getElementById('trendChart'), {
        type: 'line',
        data: {
            labels: ['Agt', 'Sep', 'Okt', 'Nov', 'Des', 'Jan'],
            datasets: [{
                label: 'Avg Score',
                data: [null, null, null, null, null, null],
                borderColor: '#1E56A0', borderWidth: 2.5,
                pointBackgroundColor: '#1E56A0', pointRadius: 4,
                tension: 0.4, fill: true,
                backgroundColor: ctx => {
                    const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
                    g.addColorStop(0, 'rgba(30,86,160,.15)');
                    g.addColorStop(1, 'rgba(30,86,160,0)');
                    return g;
                },
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { min: 0, max: 100, grid: { color: '#F0F5FA' }, ticks: { font: { size: 11 } } },
                x: { grid: { display: false }, ticks: { font: { size: 11 } } },
            },
        },
    });
}

function initRadarChart() {
    if (radarInit) return;
    radarInit = true;
    const canvas = document.getElementById('radarChart');
    if (!canvas) return;
    new Chart(canvas, {
        type: 'radar',
        data: {
            labels: ['Responsiveness', 'Initiative', 'Openness', 'Collaboration', 'Contribution', 'Task Completion', 'Innovation', 'Impact', 'Communication', 'Teamwork', 'Harmony', 'Aspirations', 'Timeliness', 'Quality', 'Discipline', 'Comm. Effect.'],
            datasets: [{
                label: 'Ahmad Rizky',
                data: [4, 3, 4, 3, 4, 4, 3, 4, 4, 4, 3, 3, 3, 4, 3, 4],
                borderColor: '#1E56A0', borderWidth: 2,
                backgroundColor: 'rgba(30,86,160,.12)',
                pointBackgroundColor: '#1E56A0', pointRadius: 3,
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                r: {
                    min: 0, max: 4, ticks: { stepSize: 1, font: { size: 9 } },
                    grid: { color: '#E4ECF5' },
                    pointLabels: { font: { size: 9 }, color: '#4A5C7A' },
                },
            },
        },
    });
}

function initAnalyticsCharts() {
    if (analyticsInit) return;
    analyticsInit = true;

    // Avg per Pilar — Radar
    new Chart(document.getElementById('avgRadarChart'), {
        type: 'radar',
        data: {
            labels: ['Adaptif & Proaktif', 'Berdampak & Bernilai', 'Humanis & Kekeluargaan', 'Optimalisasi & Prof.'],
            datasets: [
                { label: 'HMSI Avg', data: [0, 0, 0, 0], borderColor: '#1E56A0', backgroundColor: 'rgba(30,86,160,.1)', borderWidth: 2, pointRadius: 4 },
            ]
        },
        options: {
            responsive: true,
            scales: { r: { min: 0, grid: { color: '#F0F5FA' }, pointLabels: { font: { size: 11 } } } },
            plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
        },
    });

    // Dept Compare — Bar
    const sorted = [...MOCK_DEPTS].sort((a, b) => (b.avg || 0) - (a.avg || 0));
    new Chart(document.getElementById('deptCompareChart'), {
        type: 'bar',
        data: {
            labels: sorted.map(d => d.name),
            datasets: [{
                label: 'Dept Average',
                data: sorted.map(d => d.avg || 0),
                backgroundColor: sorted.map(d => d.color + '40'),
                borderColor: sorted.map(d => d.color),
                borderWidth: 1.5, borderRadius: 6,
            }]
        },
        options: {
            responsive: true, indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: {
                x: { min: 0, max: 100, grid: { color: '#F0F5FA' }, ticks: { font: { size: 11 } } },
                y: { grid: { display: false }, ticks: { font: { size: 11 } } },
            },
        },
    });

    // Band Distribution
    new Chart(document.getElementById('bandChart'), {
        type: 'bar',
        data: {
            labels: ['Outstanding', 'Excellent', 'Very Good', 'Good', 'Fair', 'Needs Improv.'],
            datasets: [{
                label: 'Members',
                data: [0, 0, 0, 0, 0, 0],
                backgroundColor: ['#FDF3C8', '#DBE9F8', '#F0FDF4', '#F5F3FF', '#FFF7ED', '#FEF2F2'],
                borderColor: ['#D4A017', '#1E56A0', '#22C55E', '#8B5CF6', '#C2410C', '#B91C1C'],
                borderWidth: 1.5, borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#F0F5FA' }, ticks: { font: { size: 11 } } },
                x: { grid: { display: false }, ticks: { font: { size: 11 } } },
            },
        },
    });
}

// ── CONFIG ──────────────────────────────────────────────────
const API_URL = 'http://localhost:5000/api';
let MEMBERS_DATA = [];
let DEPTS_DATA = [];

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await refreshData();
    renderDeptCards();
    setTimeout(initDashboardCharts, 100);

    // Event listeners for filters
    const filterDept = document.getElementById('filter-dept');
    const filterBatch = document.getElementById('filter-batch');
    const filterBand = document.getElementById('filter-band');

    if (filterDept) filterDept.addEventListener('change', handleFilters);
    if (filterBatch) filterBatch.addEventListener('change', handleFilters);
    if (filterBand) filterBand.addEventListener('change', handleFilters);
});

async function refreshData() {
    try {
        const [mRes, dRes] = await Promise.all([
            fetch(`${API_URL}/members`),
            fetch(`${API_URL}/departments`)
        ]);
        MEMBERS_DATA = await mRes.json();
        DEPTS_DATA = await dRes.json();

        updateMemberCount();
        renderTopPerformers();
        renderDeptRankings();
        renderMembersTable();
        populateMemberDropdown();
    } catch (err) {
        console.error('Gagal mengambil data:', err);
    }
}

function populateMemberDropdown() {
    const select = document.getElementById('assessment-member-select');
    if (!select) return;

    select.innerHTML = '<option value="">Pilih Anggota...</option>' +
        MEMBERS_DATA.map(m => `<option value="${m.id}">${m.name} (${m.dept_name})</option>`).join('');

    // Also populate report preview dropdown
    populateReportDropdown();
}

function populateReportDropdown() {
    const select = document.getElementById('report-member-select');
    if (!select) return;

    select.innerHTML = '<option value="">— Pilih Anggota —</option>' +
        MEMBERS_DATA.map(m => `<option value="${m.id}">${m.name} (${m.dept_name})</option>`).join('');

    // Initialize cover with empty placeholders
    updateReportCover("");
}

function updateReportCover(memberId) {
    const nameEl = document.getElementById('cover-member-name');
    const infoEl = document.getElementById('cover-member-info');
    const deptEl = document.getElementById('cover-member-dept');

    if (!memberId) {
        if (nameEl) nameEl.textContent = '[ Nama Anggota ]';
        if (infoEl) infoEl.textContent = '[ NRP ] - [ Posisi ]';
        if (deptEl) deptEl.textContent = 'Departemen ...';
        return;
    }

    const member = MEMBERS_DATA.find(m => String(m.id) === String(memberId));
    if (!member) return;

    // Find department full name
    const dept = DEPTS_DATA.find(d => d.name === member.dept_name) ||
        DEPTS_DATA.find(d => d.name === member.dept);
    const deptFullname = dept ? dept.fullname : (member.dept_name || member.dept);

    const initialsEl = document.getElementById('cover-initials');

    let posText = member.pos.toUpperCase();
    posText = posText.replace("DEPARTEMEN", (member.dept_name || member.dept).toUpperCase());

    if (initialsEl) initialsEl.textContent = getInitials(member.name);
    if (nameEl) nameEl.textContent = member.name;
    if (infoEl) infoEl.textContent = `${member.nrp} - ${posText}`;
    if (deptEl) deptEl.textContent = `Departemen ${deptFullname}`;

    // Update performance page
    updateReportPerformance(memberId, member, posText, deptFullname);
}

async function updateReportPerformance(memberId, member, posText, deptFullname) {
    const perfInfo = document.getElementById('perf-info-section');
    if (!perfInfo) return;

    if (!memberId) {
        perfInfo.innerHTML = '';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/assessments/${memberId}`);
        const assessment = await res.json();

        let p1Score = 0, p2Score = 0, p3Score = 0, p4Score = 0;
        let totalScore = 0;
        let band = 'Pending';
        if (assessment) {
            p1Score = [assessment.p1_1, assessment.p1_2, assessment.p1_3, assessment.p1_4].reduce((a, b) => a + b, 0) / 16 * 22;
            p2Score = [assessment.p2_1, assessment.p2_2, assessment.p2_3, assessment.p2_4].reduce((a, b) => a + b, 0) / 16 * 25;
            p3Score = [assessment.p3_1, assessment.p3_2, assessment.p3_3, assessment.p3_4].reduce((a, b) => a + b, 0) / 16 * 23;
            p4Score = [assessment.p4_1, assessment.p4_2, assessment.p4_3, assessment.p4_4].reduce((a, b) => a + b, 0) / 16 * 30;
            totalScore = (p1Score + p2Score + p3Score + p4Score).toFixed(1);
            band = assessment.band || member.band;
        }

        // Calculate Rankings
        const scoredMembers = MEMBERS_DATA.filter(m => m.score !== null).sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
        let cabinetRank = '-';
        if (assessment) {
            cabinetRank = scoredMembers.findIndex(m => String(m.id) === String(member.id)) + 1;
        }

        const deptMembers = MEMBERS_DATA.filter(m => m.dept === member.dept);
        const scoredDeptMembers = deptMembers.filter(m => m.score !== null).sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
        let deptRank = '-';
        if (assessment) {
            deptRank = scoredDeptMembers.findIndex(m => String(m.id) === String(member.id)) + 1;
        }

        let deptAvg = '-';
        if (scoredDeptMembers.length > 0) {
            const sum = scoredDeptMembers.reduce((acc, m) => acc + parseFloat(m.score), 0);
            deptAvg = (sum / scoredDeptMembers.length).toFixed(1);
        }

        perfInfo.innerHTML = `
            <div style="display:flex; flex-direction:column; width:100%; height:100%; box-sizing:border-box; transform: scale(0.9); transform-origin: top center;">
                
                <!-- Top Banner -->
                <div style="background: linear-gradient(135deg, #3b60e4, #92d9ec); border-radius:16px; padding:30px 40px; display:flex; align-items:center; margin-bottom:30px;">
                    <div style="width:90px; height:90px; border-radius:50%; background:#d1d5db; display:flex; align-items:center; justify-content:center; overflow:hidden; box-shadow: 0 0 0 3px rgba(255,255,255,0.3); margin-right:24px; flex-shrink:0;">
                        ${member.id == 1 ? '<img src="Logo PILAR AKSI.png" style="width:100%; height:100%; object-fit:cover;">' : `<div style="font-size:32px; font-weight:800; color:#3b60e4;">${getInitials(member.name)}</div>`}
                    </div>
                    <div style="flex:1; display:flex; flex-direction:column;">
                        <div style="font-family:'Plus Jakarta Sans',sans-serif; font-size:24px; font-weight:800; color:white; margin-bottom: 2px;">
                            ${member.name}
                        </div>
                        <div style="font-size:14px; color:rgba(255,255,255,0.9); letter-spacing:0.5px; margin-bottom: 4px;">
                            NRP. ${member.nrp}
                        </div>
                        <div style="font-size:14px; color:white; font-weight:600;">
                            Departemen ${member.dept} &bull; ${posText}
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:12px; text-transform:uppercase; letter-spacing:1px; color:rgba(255,255,255,0.8); margin-bottom:4px;">
                            Assessment Period
                        </div>
                        <div style="font-size:16px; font-weight:700; color:white;">
                            November 2026
                        </div>
                    </div>
                </div>

                <!-- Below Banner -->
                <div style="display:flex; flex-direction:row; gap:40px;">
                    <!-- Left Side: Pilar -->
                    <div style="flex:1; display:flex; flex-direction:column;">
                        <div style="font-size:14px; font-weight:800; color:#8ba0b8; letter-spacing:0.5px; margin-bottom:24px;">
                            SKOR PER PILAR
                        </div>
                        <div style="display:flex; flex-direction:column; gap:20px;">
                            <!-- Pilar 1 -->
                            <div>
                                <div style="font-size:12px; font-weight:700; color:#4A5C7A; margin-bottom:8px;">P1 &bull; Adaptif &amp; Proaktif</div>
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <div style="flex:1; height:8px; background:#e0e7ee; border-radius:4px; overflow:hidden;">
                                        <div style="height:100%; width:${(Math.min(p1Score / 22 * 100, 100))}%; background:#3b60e4; border-radius:4px;"></div>
                                    </div>
                                    <div style="font-size:13px; font-weight:800; color:#1a3a5c; min-width:46px; text-align:right;">${p1Score > 0 ? p1Score.toFixed(1) : '-'}<span style="font-size:10px; color:#8ba0b8; font-weight:600;">/22</span></div>
                                </div>
                            </div>
                            <!-- Pilar 2 -->
                            <div>
                                <div style="font-size:12px; font-weight:700; color:#4A5C7A; margin-bottom:8px;">P2 &bull; Berdampak &amp; Bernilai</div>
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <div style="flex:1; height:8px; background:#e0e7ee; border-radius:4px; overflow:hidden;">
                                        <div style="height:100%; width:${(Math.min(p2Score / 25 * 100, 100))}%; background:#eab308; border-radius:4px;"></div>
                                    </div>
                                    <div style="font-size:13px; font-weight:800; color:#1a3a5c; min-width:46px; text-align:right;">${p2Score > 0 ? p2Score.toFixed(1) : '-'}<span style="font-size:10px; color:#8ba0b8; font-weight:600;">/25</span></div>
                                </div>
                            </div>
                            <!-- Pilar 3 -->
                            <div>
                                <div style="font-size:12px; font-weight:700; color:#4A5C7A; margin-bottom:8px;">P3 &bull; Humanis &amp; Kekeluargaan</div>
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <div style="flex:1; height:8px; background:#e0e7ee; border-radius:4px; overflow:hidden;">
                                        <div style="height:100%; width:${(Math.min(p3Score / 23 * 100, 100))}%; background:#22c55e; border-radius:4px;"></div>
                                    </div>
                                    <div style="font-size:13px; font-weight:800; color:#1a3a5c; min-width:46px; text-align:right;">${p3Score > 0 ? p3Score.toFixed(1) : '-'}<span style="font-size:10px; color:#8ba0b8; font-weight:600;">/23</span></div>
                                </div>
                            </div>
                            <!-- Pilar 4 -->
                            <div>
                                <div style="font-size:12px; font-weight:700; color:#4A5C7A; margin-bottom:8px;">P4 &bull; Optimalisasi &amp; Profesionalisme</div>
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <div style="flex:1; height:8px; background:#e0e7ee; border-radius:4px; overflow:hidden;">
                                        <div style="height:100%; width:${(Math.min(p4Score / 30 * 100, 100))}%; background:#a855f7; border-radius:4px;"></div>
                                    </div>
                                    <div style="font-size:13px; font-weight:800; color:#1a3a5c; min-width:46px; text-align:right;">${p4Score > 0 ? p4Score.toFixed(1) : '-'}<span style="font-size:10px; color:#8ba0b8; font-weight:600;">/30</span></div>
                                </div>
                            </div>
                        </div>
                        <div style="font-size:14px; font-weight:800; color:#8ba0b8; letter-spacing:0.5px; margin-top:40px; margin-bottom:12px;">
                            BREAKDOWN INDIKATOR
                        </div>
                    </div>

                    <!-- Right Side: Score & Ranking -->
                    <div style="width:280px; display:flex; flex-direction:column; gap:24px;">
                        <!-- Final Score Box -->
                        <div style="background: linear-gradient(135deg, #3b60e4, #5E9EE8); box-shadow: 0 6px 18px rgba(59,96,228,0.25); padding: 24px; border-radius: 16px; display:flex; flex-direction:column; align-items:center;">
                            <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.9);margin-bottom:12px;font-weight:600;">
                                Final Score</div>
                            <div style="color:#FFF8D6; font-size:64px; font-weight:800; line-height:1; font-family:'Plus Jakarta Sans',sans-serif; margin-bottom: 8px;">${totalScore > 0 ? totalScore : '-'}</div>
                            <div style="color:rgba(255,255,255,.9); font-size:12px; margin-bottom: 12px; font-weight:500;">DARI 100</div>
                            <div style="color:white; font-size:15px; font-weight:700; display:flex; align-items:center; gap:6px;">✦ ${band}</div>
                        </div>

                        <!-- Ranking Box -->
                        <div style="padding:22px; border-radius:16px; border:1px solid #e0e7ee; box-shadow:0 6px 18px rgba(0,0,0,0.04); background:white;">
                            <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#1a3a5c;font-weight:800;margin-bottom:16px;">
                                Ranking</div>
                            <div style="padding:10px 0; border-bottom:1px solid #e0e7ee; display:flex; justify-content:space-between; align-items:center;">
                                <div style="font-size:12px; color:var(--text-muted); font-weight:500;">Dept. Ranking</div>
                                <div style="color:#3b60e4; font-weight:800; font-size:15px;">#${deptRank} <span style="font-size:11px;color:var(--text-muted);font-weight:600;">/${deptMembers.length}</span></div>
                            </div>
                            <div style="padding:10px 0; border-bottom:1px solid #e0e7ee; display:flex; justify-content:space-between; align-items:center;">
                                <div style="font-size:12px; color:var(--text-muted); font-weight:500;">Cabinet Ranking</div>
                                <div style="color:#1a3a5c; font-weight:800; font-size:15px;">#${cabinetRank} <span style="font-size:11px;color:var(--text-muted);font-weight:600;">/${MEMBERS_DATA.length}</span></div>
                            </div>
                            <div style="padding-top:12px; display:flex; justify-content:space-between; align-items:center;">
                                <div style="font-size:12px; color:var(--text-muted); font-weight:500;">Dept. Avg</div>
                                <div style="font-size:14px; color:#1a3a5c; font-weight:700;">${deptAvg}</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        `;
    } catch (err) {
        console.error("Error fetching assessment", err);
    }
}