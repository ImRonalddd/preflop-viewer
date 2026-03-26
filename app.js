const state = {
    currentChartId: null,
    chartData: PRESET_DATA,
};

document.addEventListener('DOMContentLoaded', () => {
    buildSidebar();
    buildGrid();
    setupEventListeners();

    if (CHART_DEFINITIONS.length > 0) {
        selectChart(CHART_DEFINITIONS[0].id);
    }
});

// ============================================================
// SIDEBAR
// ============================================================

function buildSidebar() {
    const sections = {
        rfi: document.getElementById('rfi-list'),
        facing_rfi: document.getElementById('facing-rfi-list'),
        vs_3bet: document.getElementById('vs-3bet-list'),
    };

    CHART_DEFINITIONS.forEach(chart => {
        const li = document.createElement('li');
        li.dataset.chartId = chart.id;

        const data = state.chartData[chart.id] || {};
        const filledCount = Object.values(data).filter(a => a && a !== 'fold').length;

        li.innerHTML = `
            <span class="chart-name">${chart.name}</span>
            <span class="chart-status ${filledCount > 0 ? 'filled' : ''}">${filledCount > 0 ? filledCount : ''}</span>
        `;
        li.addEventListener('click', () => selectChart(chart.id));
        sections[chart.section].appendChild(li);
    });

    document.querySelectorAll('.section-title').forEach(title => {
        title.addEventListener('click', () => {
            title.classList.toggle('collapsed');
            title.nextElementSibling.classList.toggle('hidden');
        });
    });
}

// ============================================================
// GRID
// ============================================================

function buildGrid() {
    const table = document.getElementById('handGrid');
    table.innerHTML = '';

    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th'));
    RANKS.forEach(r => {
        const th = document.createElement('th');
        th.textContent = r;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    HAND_GRID.forEach((row, r) => {
        const tr = document.createElement('tr');
        const rowHeader = document.createElement('th');
        rowHeader.textContent = RANKS[r];
        tr.appendChild(rowHeader);

        row.forEach((hand, c) => {
            const td = document.createElement('td');
            td.dataset.hand = hand;
            td.textContent = hand;
            if (r === c) td.classList.add('pair');

            // Tooltip on hover
            td.addEventListener('mouseenter', () => showTooltip(td, hand));
            td.addEventListener('mouseleave', hideTooltip);

            tr.appendChild(td);
        });
        table.appendChild(tr);
    });
}

function renderGrid() {
    const chart = getChart(state.currentChartId);
    if (!chart) return;

    const data = state.chartData[state.currentChartId] || {};

    document.querySelectorAll('.hand-grid td[data-hand]').forEach(td => {
        const hand = td.dataset.hand;
        const action = data[hand] || 'fold';
        const actionDef = ACTIONS[action] || ACTIONS.fold;

        td.style.backgroundColor = actionDef.color;
        td.style.color = actionDef.textColor;
        td.title = `${hand}: ${actionDef.label}`;
    });

    updateLegend(chart);
    updateStats();
    updateSidebarActive();
}

// ============================================================
// LEGEND
// ============================================================

function updateLegend(chart) {
    const container = document.getElementById('legend');
    const actions = SCENARIO_ACTIONS[chart.scenario] || [];

    container.innerHTML = actions.map(actionKey => {
        const a = ACTIONS[actionKey];
        return `<div class="legend-item">
            <div class="legend-swatch" style="background:${a.color};color:${a.textColor}">${a.label}</div>
        </div>`;
    }).join('');
}

// ============================================================
// TOOLTIP
// ============================================================

let tooltipEl = null;

function showTooltip(td, hand) {
    const data = state.chartData[state.currentChartId] || {};
    const action = data[hand] || 'fold';
    const actionDef = ACTIONS[action] || ACTIONS.fold;
    const combos = getHandCombos(hand);
    const type = hand.length === 2 ? 'Pair' : hand.endsWith('s') ? 'Suited' : 'Offsuit';

    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.className = 'tooltip';
        document.body.appendChild(tooltipEl);
    }

    tooltipEl.innerHTML = `<strong>${hand}</strong> (${type}, ${combos} combos)<br>${actionDef.label}`;
    tooltipEl.style.display = 'block';

    const rect = td.getBoundingClientRect();
    tooltipEl.style.left = rect.left + rect.width / 2 + 'px';
    tooltipEl.style.top = rect.bottom + 8 + 'px';
}

function hideTooltip() {
    if (tooltipEl) tooltipEl.style.display = 'none';
}

// ============================================================
// CHART SELECTION
// ============================================================

function selectChart(chartId) {
    state.currentChartId = chartId;
    const chart = getChart(chartId);
    if (!chart) return;

    document.getElementById('chartTitle').textContent = chart.name;
    document.getElementById('chartDescription').textContent = chart.description;

    renderGrid();
}

function getChart(chartId) {
    return CHART_DEFINITIONS.find(c => c.id === chartId);
}

function updateSidebarActive() {
    document.querySelectorAll('.chart-list li').forEach(li => {
        li.classList.toggle('active', li.dataset.chartId === state.currentChartId);
    });
}

// ============================================================
// STATS
// ============================================================

function updateStats() {
    const container = document.getElementById('chartStats');
    const data = state.chartData[state.currentChartId] || {};
    const chart = getChart(state.currentChartId);
    if (!chart) return;

    const scenarioActions = SCENARIO_ACTIONS[chart.scenario] || [];
    const counts = {};
    const comboCounts = {};
    scenarioActions.forEach(a => { counts[a] = 0; comboCounts[a] = 0; });

    HAND_GRID.flat().forEach(hand => {
        const action = data[hand] || 'fold';
        const combos = getHandCombos(hand);
        if (counts[action] !== undefined) {
            counts[action]++;
            comboCounts[action] += combos;
        } else {
            counts.fold = (counts.fold || 0) + 1;
            comboCounts.fold = (comboCounts.fold || 0) + combos;
        }
    });

    const totalCombos = 1326;
    container.innerHTML = scenarioActions.map(actionKey => {
        const actionDef = ACTIONS[actionKey];
        const pct = ((comboCounts[actionKey] / totalCombos) * 100).toFixed(1);
        return `<div class="stat-item">
            <div class="stat-swatch" style="background:${actionDef.color}"></div>
            ${actionDef.label}: ${counts[actionKey]} hands (${comboCounts[actionKey]} combos, ${pct}%)
        </div>`;
    }).join('');
}

function getHandCombos(hand) {
    if (hand.length === 2) return 6;
    if (hand.endsWith('s')) return 4;
    if (hand.endsWith('o')) return 12;
    return 0;
}

// ============================================================
// KEYBOARD NAV
// ============================================================

function setupEventListeners() {
    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const idx = CHART_DEFINITIONS.findIndex(c => c.id === state.currentChartId);
            if (idx === -1) return;
            const next = e.key === 'ArrowDown'
                ? Math.min(idx + 1, CHART_DEFINITIONS.length - 1)
                : Math.max(idx - 1, 0);
            selectChart(CHART_DEFINITIONS[next].id);

            // Scroll sidebar item into view
            const li = document.querySelector(`li[data-chart-id="${CHART_DEFINITIONS[next].id}"]`);
            if (li) li.scrollIntoView({ block: 'nearest' });
        }
    });
}
