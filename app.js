// ============================================================
// STATE
// ============================================================

const state = {
    chartMode: 'advanced',  // 'simplified' | 'advanced'
    gameType: 'cash',       // 'cash' | 'tournament' | 'hu_mtt' | 'hu_cash'
    format: '8Max',         // '8Max' | '6Max'
    stackSize: 100,
    heroSeat: null,
    action: null,
    opponentSeat: null,
    selectedChartId: null,
};

// ============================================================
// CONSTANTS
// ============================================================

const GAME_TYPES = [
    { id: 'tournament', label: 'Tournament' },
    { id: 'cash', label: 'Cash Games' },
    { id: 'hu_mtt', label: 'HU MTT' },
    { id: 'hu_cash', label: 'HU Cash' },
];

const FORMATS = [
    { id: '8Max', label: '8Max' },
    { id: '6Max', label: '6Max' },
];

const POSITIONS_8MAX = ['UTG', 'UTG+1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const POSITIONS_6MAX = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const POSITIONS_HU = ['SB', 'BB'];

const COLORS = {
    raise: 'rgb(240, 60, 60)',
    call: 'rgb(90, 185, 102)',
    fold: 'rgb(61, 124, 184)',
};

// Action mapping: display label -> data action values (advanced)
const ACTION_MAP = {
    'RFI': ['Folded To'],
    'vs. RFI': ['3bet'],
    'vs. 3-Bet': ['4bet', 'All-In 4bet'],
    'vs. 4-Bet': ['All-In 5bet'],
    'Squeeze': ['Squeeze'],
    'Limp': ['Limp'],
    'Open Raise': ['Open Raise'],
};

// Action mapping for simplified charts (section -> display label)
const SIMPLIFIED_ACTION_MAP = {
    'RFI': 'rfi',
    'vs. RFI': 'facing_rfi',
    'vs. 3-Bet': 'vs_3bet',
};

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    buildGrid();
    renderControls();
    applyDefaults();
});

function applyDefaults() {
    updateState('chartMode', 'advanced');
}

// ============================================================
// CONTROL RENDERING
// ============================================================

function renderControls() {
    renderChartModeButtons();
    renderGameTypeButtons();
    renderFormatButtons();
    renderStackSizeButtons();
    renderHeroSeatButtons();
    renderActionButtons();
    renderOpponentSeatButtons();
}

function renderChartModeButtons() {
    const container = document.getElementById('chartModeButtons');
    container.innerHTML = '';
    [
        { id: 'simplified', label: 'Simplified' },
        { id: 'advanced', label: 'Advanced' },
    ].forEach(m => {
        const btn = createButton(m.label, m.id === state.chartMode, () => {
            updateState('chartMode', m.id);
        });
        container.appendChild(btn);
    });
}

function renderGameTypeButtons() {
    const container = document.getElementById('gameTypeButtons');
    container.innerHTML = '';
    GAME_TYPES.forEach(gt => {
        const btn = createButton(gt.label, gt.id === state.gameType, () => {
            updateState('gameType', gt.id);
        });
        container.appendChild(btn);
    });
}

function renderFormatButtons() {
    const container = document.getElementById('formatButtons');
    container.innerHTML = '';

    if (state.gameType === 'hu_cash' || state.gameType === 'hu_mtt') {
        const btn = createButton('HU', true, () => {});
        btn.disabled = true;
        btn.classList.add('active');
        container.appendChild(btn);
        return;
    }

    FORMATS.forEach(f => {
        const available = getAvailableTableTypes().includes(f.id);
        const btn = createButton(f.label, f.id === state.format, () => {
            updateState('format', f.id);
        });
        if (!available) btn.disabled = true;
        container.appendChild(btn);
    });
}

function renderStackSizeButtons() {
    const container = document.getElementById('stackSizeButtons');
    container.innerHTML = '';

    const available = getAvailableStackSizes();
    available.forEach(bb => {
        const btn = createButton(`${bb}bb`, bb === state.stackSize, () => {
            updateState('stackSize', bb);
        });
        container.appendChild(btn);
    });
}

function renderHeroSeatButtons() {
    const container = document.getElementById('heroSeatButtons');
    container.innerHTML = '';

    const positions = getPositionsForFormat();
    const available = getAvailableHeroSeats();

    positions.forEach(pos => {
        const isAvailable = available.includes(pos);
        const btn = createButton(pos, pos === state.heroSeat, () => {
            updateState('heroSeat', pos);
        });
        if (!isAvailable) btn.disabled = true;
        container.appendChild(btn);
    });
}

function renderActionButtons() {
    const container = document.getElementById('actionButtons');
    container.innerHTML = '';

    const available = getAvailableActions();

    Object.keys(ACTION_MAP).forEach(label => {
        const isAvailable = available.includes(label);
        if (!isAvailable) return;
        const btn = createButton(label, label === state.action, () => {
            updateState('action', label);
        });
        container.appendChild(btn);
    });
}

function renderOpponentSeatButtons() {
    const container = document.getElementById('opponentSeatButtons');
    container.innerHTML = '';

    const available = getAvailableOpponentSeats();
    const positions = getPositionsForFormat();

    if (available.length === 0 && isNoOpponentAction()) {
        const btn = createButton('N/A', true, () => {});
        btn.disabled = true;
        btn.classList.add('active');
        container.appendChild(btn);
        return;
    }

    positions.forEach(pos => {
        const isAvailable = available.includes(pos);
        const btn = createButton(pos, pos === state.opponentSeat, () => {
            updateState('opponentSeat', pos);
        });
        if (!isAvailable) btn.disabled = true;
        container.appendChild(btn);
    });
}

function createButton(label, isActive, onClick) {
    const btn = document.createElement('button');
    btn.className = 'btn' + (isActive ? ' active' : '');
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
}

// ============================================================
// STATE MANAGEMENT
// ============================================================

function updateState(field, value) {
    state[field] = value;

    if (field === 'chartMode') {
        resetBelow('chartMode');
        if (value === 'simplified') {
            state.gameType = 'cash';
            state.format = '8Max';
            state.stackSize = 0; // simplified has no stack size
        } else {
            state.gameType = 'cash';
        }
    }

    if (field === 'gameType') {
        if (value === 'hu_cash' || value === 'hu_mtt') {
            state.format = 'HU';
        } else {
            const available = getAvailableTableTypes();
            if (!available.includes(state.format)) {
                state.format = available[0] || '8Max';
            }
        }
        resetBelow('gameType');
    }

    if (field === 'format') {
        resetBelow('format');
    }

    if (field === 'stackSize') {
        resetBelow('stackSize');
    }

    if (field === 'heroSeat') {
        resetBelow('heroSeat');
    }

    if (field === 'action') {
        resetBelow('action');
    }

    autoSelectDownstream(field);
    resolveChart();
    renderAllControls();
    renderGrid();
    updateInfoBar();
    updateStats();
}

function resetBelow(field) {
    const order = ['chartMode', 'gameType', 'format', 'stackSize', 'heroSeat', 'action', 'opponentSeat'];
    const idx = order.indexOf(field);
    for (let i = idx + 1; i < order.length; i++) {
        state[order[i]] = null;
    }
}

function autoSelectDownstream(changedField) {
    // Auto-select format
    if (state.format === null && state.gameType !== 'hu_cash' && state.gameType !== 'hu_mtt') {
        const types = getAvailableTableTypes();
        if (types.includes('8Max')) {
            state.format = '8Max';
        } else if (types.length > 0) {
            state.format = types[0];
        }
    }

    // Auto-select stack size if only one available
    if (state.stackSize === null) {
        const stacks = getAvailableStackSizes();
        if (stacks.length === 1) {
            state.stackSize = stacks[0];
        } else if (stacks.includes(100)) {
            state.stackSize = 100;
        } else if (stacks.length > 0) {
            state.stackSize = stacks[0];
        }
    }

    // Auto-select hero seat — pick first available
    if (state.heroSeat === null) {
        const seats = getAvailableHeroSeats();
        if (seats.length > 0) {
            state.heroSeat = seats[0];
        }
    }

    // Auto-select action if only one available
    if (state.action === null && state.heroSeat !== null) {
        const actions = getAvailableActions();
        if (actions.length === 1) {
            state.action = actions[0];
        } else if (actions.length > 0) {
            // Default to RFI if available, otherwise first
            if (actions.includes('RFI')) {
                state.action = 'RFI';
            } else if (actions.includes('vs. RFI')) {
                state.action = 'vs. RFI';
            }
        }
    }

    // Auto-select opponent seat if only one or not needed
    if (state.opponentSeat === null && state.action !== null) {
        if (isNoOpponentAction()) {
            state.opponentSeat = '';
        } else {
            const opponents = getAvailableOpponentSeats();
            if (opponents.length > 0) {
                state.opponentSeat = opponents[0];
            }
        }
    }
}

function renderAllControls() {
    renderChartModeButtons();
    renderGameTypeButtons();
    renderFormatButtons();
    renderStackSizeButtons();
    renderHeroSeatButtons();
    renderActionButtons();
    renderOpponentSeatButtons();

    // Hide game type/format/stack size in simplified mode
    const isSimplified = state.chartMode === 'simplified';
    document.querySelectorAll('.control-row').forEach(r => { r.style.display = isSimplified ? 'none' : ''; });
    document.getElementById('stackSizeGroup').style.display = isSimplified ? 'none' : '';
}

// ============================================================
// DATA QUERIES
// ============================================================

function getCharts() {
    if (typeof GTO_MIXED_DATA === 'undefined') return [];
    return GTO_MIXED_DATA.charts;
}

function getChartData(chartId) {
    if (typeof GTO_MIXED_DATA === 'undefined') return {};
    return GTO_MIXED_DATA.data[chartId] || {};
}

function getGameFormatForState() {
    if (state.gameType === 'cash' || state.gameType === 'hu_cash') return 'Cash';
    return 'MTT';
}

function getTableTypeForState() {
    if (state.gameType === 'hu_cash' || state.gameType === 'hu_mtt') return 'HU';
    return state.format;
}

function getChartsForGameFormat() {
    const gf = getGameFormatForState();
    return getCharts().filter(c => c.gameFormat === gf);
}

function getAvailableTableTypes() {
    const charts = getChartsForGameFormat();
    const types = new Set();
    charts.forEach(c => {
        if (c.tableType !== 'HU') types.add(c.tableType);
    });
    return [...types];
}

function getFilteredCharts() {
    const tableType = getTableTypeForState();
    return getChartsForGameFormat().filter(c =>
        c.tableType === tableType &&
        (state.stackSize === null || c.bbs === state.stackSize)
    );
}

function getAvailableStackSizes() {
    const tableType = getTableTypeForState();
    const charts = getChartsForGameFormat().filter(c => c.tableType === tableType);
    const bbs = new Set(charts.map(c => c.bbs));
    return [...bbs].sort((a, b) => a - b);
}

function getAvailableHeroSeats() {
    if (state.chartMode === 'simplified') {
        const seats = new Set(CHART_DEFINITIONS.map(c => c.heroPosition));
        return POSITIONS_8MAX.filter(p => seats.has(p));
    }
    const charts = getFilteredCharts();
    const seats = new Set(charts.map(c => c.heroPosition));
    const positions = getPositionsForFormat();
    return positions.filter(p => seats.has(p));
}

function getAvailableActions() {
    if (state.heroSeat === null) return [];

    if (state.chartMode === 'simplified') {
        const charts = CHART_DEFINITIONS.filter(c => c.heroPosition === state.heroSeat);
        const sections = new Set(charts.map(c => c.section));
        const available = [];
        Object.entries(SIMPLIFIED_ACTION_MAP).forEach(([label, section]) => {
            if (sections.has(section)) available.push(label);
        });
        return available;
    }

    const charts = getFilteredCharts().filter(c => c.heroPosition === state.heroSeat);
    const dataActions = new Set(charts.map(c => c.action));

    const available = [];
    Object.entries(ACTION_MAP).forEach(([label, dataVals]) => {
        if (dataVals.some(v => dataActions.has(v))) {
            available.push(label);
        }
    });
    return available;
}

function getAvailableOpponentSeats() {
    if (state.action === null || state.heroSeat === null) return [];
    if (isNoOpponentAction()) return [];

    if (state.chartMode === 'simplified') {
        const section = SIMPLIFIED_ACTION_MAP[state.action];
        const charts = CHART_DEFINITIONS.filter(c =>
            c.heroPosition === state.heroSeat &&
            c.section === section &&
            c.villainPosition
        );
        const seats = new Set();
        charts.forEach(c => {
            // villainPosition can be "UTG/UTG+1" — split into individual positions
            c.villainPosition.split('/').forEach(v => seats.add(v.trim()));
        });
        return POSITIONS_8MAX.filter(p => seats.has(p));
    }

    const dataActions = ACTION_MAP[state.action] || [];
    const charts = getFilteredCharts().filter(c =>
        c.heroPosition === state.heroSeat &&
        dataActions.includes(c.action) &&
        c.villainPosition && c.villainPosition !== ''
    );
    const seats = new Set(charts.map(c => c.villainPosition));
    const positions = getPositionsForFormat();
    return positions.filter(p => seats.has(p));
}

function isNoOpponentAction() {
    return state.action === 'RFI' || state.action === 'Open Raise';
}

function getPositionsForFormat() {
    if (state.chartMode === 'simplified') return POSITIONS_8MAX;
    const tableType = getTableTypeForState();
    if (tableType === 'HU') return POSITIONS_HU;
    if (tableType === '6Max') return POSITIONS_6MAX;
    return POSITIONS_8MAX;
}

function resolveChart() {
    state.selectedChartId = null;

    if (state.heroSeat === null || state.action === null) return;

    if (state.chartMode === 'simplified') {
        resolveSimplifiedChart();
        return;
    }

    const dataActions = ACTION_MAP[state.action] || [];
    const charts = getFilteredCharts().filter(c =>
        c.heroPosition === state.heroSeat &&
        dataActions.includes(c.action)
    );

    if (isNoOpponentAction()) {
        if (charts.length > 0) {
            state.selectedChartId = charts[0].id;
        }
        return;
    }

    if (state.opponentSeat === null || state.opponentSeat === '') return;

    const match = charts.find(c => c.villainPosition === state.opponentSeat);
    if (match) {
        state.selectedChartId = match.id;
    }
}

function resolveSimplifiedChart() {
    const section = SIMPLIFIED_ACTION_MAP[state.action];
    if (!section) return;

    if (isNoOpponentAction()) {
        // RFI: match by hero position
        const posKey = state.heroSeat.toLowerCase().replace('+', 'p');
        const match = CHART_DEFINITIONS.find(c =>
            c.section === section &&
            c.id === `rfi_${posKey}`
        );
        if (match) state.selectedChartId = match.id;
        return;
    }

    if (!state.opponentSeat) return;

    // Find chart matching hero + villain in the right section
    // Simplified charts may group opponents (e.g., "UTG/UTG+1")
    const match = CHART_DEFINITIONS.find(c =>
        c.section === section &&
        c.heroPosition === state.heroSeat &&
        c.villainPosition && c.villainPosition.split('/').some(v => v.trim() === state.opponentSeat)
    );
    if (match) state.selectedChartId = match.id;
}

// ============================================================
// GRID
// ============================================================

function buildGrid() {
    const container = document.getElementById('handGrid');
    container.innerHTML = '';

    HAND_GRID.forEach((row, r) => {
        row.forEach((hand, c) => {
            const cell = document.createElement('div');
            cell.className = 'grid-cell empty';
            cell.dataset.hand = hand;
            cell.dataset.row = r;
            cell.dataset.col = c;

            const textSpan = document.createElement('span');
            textSpan.className = 'cell-text';
            textSpan.textContent = hand;
            cell.appendChild(textSpan);

            cell.addEventListener('mouseenter', () => showTooltip(cell, hand));
            cell.addEventListener('mouseleave', hideTooltip);

            container.appendChild(cell);
        });
    });
}

function renderGrid() {
    if (state.chartMode === 'simplified') return renderSimplifiedGrid();

    const chartId = state.selectedChartId;
    const data = chartId ? getChartData(chartId) : {};
    const hasData = chartId && Object.keys(data).length > 0;

    document.querySelectorAll('.grid-cell').forEach(cell => {
        const hand = cell.dataset.hand;

        // Remove old bg div if any
        const oldBg = cell.querySelector('.cell-bg');
        if (oldBg) oldBg.remove();

        // Reset classes
        cell.className = 'grid-cell';

        if (!hasData) {
            cell.classList.add('empty');
            cell.style.background = '';
            return;
        }

        const entry = data[hand];
        if (!entry) {
            cell.classList.add('fold');
            cell.style.background = '';
            return;
        }

        const freqs = entry.frequencies || {};
        const foldPct = freqs.fold || 0;
        const callPct = freqs.call || 0;
        const raisePct = getRaisePct(freqs);

        if (entry.action === 'mixed') {
            renderMixedCell(cell, raisePct, callPct, foldPct);
        } else if (entry.action === 'raise' || raisePct > 0.95) {
            cell.classList.add('raise');
        } else if (entry.action === 'call' || callPct > 0.95) {
            cell.classList.add('call');
        } else {
            cell.classList.add('fold');
        }
    });
}

function renderSimplifiedGrid() {
    const chartId = state.selectedChartId;
    const data = chartId ? (PRESET_DATA[chartId] || {}) : {};
    const hasData = Object.keys(data).length > 0;

    document.querySelectorAll('.grid-cell').forEach(cell => {
        const hand = cell.dataset.hand;
        const oldBg = cell.querySelector('.cell-bg');
        if (oldBg) oldBg.remove();

        cell.className = 'grid-cell';

        if (!hasData) {
            cell.classList.add('empty');
            cell.style.background = '';
            return;
        }

        const action = data[hand] || 'fold';

        // Map simplified actions to colors
        if (action.includes('raise') || action.includes('threebet') || action.includes('fourbet')) {
            cell.classList.add('raise');
        } else if (action === 'call') {
            cell.classList.add('call');
        } else if (action === 'limp') {
            cell.classList.add('call'); // limp shows as green
        } else {
            cell.classList.add('fold');
        }
    });
}

function renderMixedCell(cell, raisePct, callPct, foldPct) {
    const total = raisePct + callPct + foldPct;
    if (total === 0) {
        cell.classList.add('fold');
        return;
    }

    // Normalize
    const r = (raisePct / total) * 100;
    const c = (callPct / total) * 100;

    const bgDiv = document.createElement('div');
    bgDiv.className = 'cell-bg';
    bgDiv.style.background = `linear-gradient(to right, ${COLORS.raise} 0% ${r}%, ${COLORS.call} ${r}% ${r + c}%, ${COLORS.fold} ${r + c}% 100%)`;
    cell.insertBefore(bgDiv, cell.firstChild);
}

function getRaisePct(freqs) {
    return Object.entries(freqs)
        .filter(([k]) => k.startsWith('raise'))
        .reduce((sum, [, v]) => sum + v, 0);
}

// ============================================================
// INFO BAR
// ============================================================

function updateInfoBar() {
    const bar = document.getElementById('infoBar');

    if (state.chartMode === 'simplified') {
        const chart = CHART_DEFINITIONS.find(c => c.id === state.selectedChartId);
        const parts = ['<span class="info-label">Simplified</span>'];
        if (state.heroSeat) parts.push(state.heroSeat);
        if (state.action) parts.push(state.action);
        if (state.opponentSeat) parts.push('vs ' + state.opponentSeat);
        bar.innerHTML = parts.join('<span class="info-sep">&middot;</span>');
        return;
    }

    if (!state.selectedChartId) {
        const parts = [];
        if (state.gameType === 'cash') parts.push('Cash Games');
        else if (state.gameType === 'tournament') parts.push('Tournament');
        else if (state.gameType === 'hu_mtt') parts.push('HU MTT');
        else if (state.gameType === 'hu_cash') parts.push('HU Cash');

        if (state.format && state.gameType !== 'hu_cash') {
            parts.push(state.format === '8Max' ? '8-Max' : '6-Max');
        }
        if (state.stackSize) parts.push(`${state.stackSize}bb`);

        bar.innerHTML = parts.length > 0
            ? `<span class="info-label">${parts.join(' ')}</span><span class="info-sep">-</span>Select options to view a chart`
            : 'Select options to view a chart';
        return;
    }

    const chart = getCharts().find(c => c.id === state.selectedChartId);
    if (!chart) {
        bar.textContent = '';
        return;
    }

    const gameLabels = { cash: 'Cash Games', tournament: 'Tournament', hu_mtt: 'HU MTT', hu_cash: 'HU Cash' };
    const gameLabel = gameLabels[state.gameType] || 'Cash Games';
    const formatLabel = chart.tableType === '8Max' ? '8-Max' : chart.tableType === '6Max' ? '6-Max' : 'HU';
    const stackLabel = `${chart.bbs}bb`;
    const heroLabel = chart.heroPosition;
    const actionLabel = state.action || chart.action;
    const villainPart = chart.villainPosition ? ` vs ${chart.villainPosition}` : '';

    bar.innerHTML = `<span class="info-label">${gameLabel} ${formatLabel}</span>` +
        `<span class="info-sep">&middot;</span>` +
        `<span class="info-label">${stackLabel}</span>` +
        `<span class="info-sep">&middot;</span>` +
        `${heroLabel}${villainPart}` +
        `<span class="info-sep">&middot;</span>` +
        `${actionLabel}`;
}

// ============================================================
// STATS
// ============================================================

function updateStats() {
    const statsBar = document.getElementById('statsBar');
    const progressBar = document.getElementById('statsProgress');

    if (state.chartMode === 'simplified') {
        updateSimplifiedStats(statsBar, progressBar);
        return;
    }

    if (!state.selectedChartId) {
        statsBar.innerHTML = '';
        progressBar.innerHTML = '';
        return;
    }

    const data = getChartData(state.selectedChartId);
    const totalCombos = 1326;

    let raiseWt = 0;
    let callWt = 0;
    let foldWt = 0;

    HAND_GRID.flat().forEach(hand => {
        const entry = data[hand];
        const combos = getHandCombos(hand);

        if (entry && typeof entry === 'object') {
            const freqs = entry.frequencies || {};
            const rPct = getRaisePct(freqs);
            raiseWt += rPct * combos;
            callWt += (freqs.call || 0) * combos;
            foldWt += (freqs.fold || 0) * combos;
        } else {
            foldWt += combos;
        }
    });

    const rPct = (raiseWt / totalCombos * 100).toFixed(1);
    const cPct = (callWt / totalCombos * 100).toFixed(1);
    const fPct = (foldWt / totalCombos * 100).toFixed(1);

    statsBar.innerHTML = `
        <div class="stat-box raise-box">
            <div class="stat-info">
                <span class="stat-label">Raise</span>
                <span class="stat-value">${rPct}%</span>
            </div>
            <span class="stat-combos">${raiseWt.toFixed(1)} combos</span>
        </div>
        <div class="stat-box call-box">
            <div class="stat-info">
                <span class="stat-label">Call</span>
                <span class="stat-value">${cPct}%</span>
            </div>
            <span class="stat-combos">${callWt.toFixed(1)} combos</span>
        </div>
        <div class="stat-box fold-box">
            <div class="stat-info">
                <span class="stat-label">Fold</span>
                <span class="stat-value">${fPct}%</span>
            </div>
            <span class="stat-combos">${foldWt.toFixed(1)} combos</span>
        </div>
    `;

    progressBar.innerHTML = `
        <div class="progress-raise" style="width: ${rPct}%"></div>
        <div class="progress-call" style="width: ${cPct}%"></div>
        <div class="progress-fold" style="width: ${fPct}%"></div>
    `;
}

function getHandCombos(hand) {
    if (hand.length === 2) return 6;
    if (hand.endsWith('s')) return 4;
    if (hand.endsWith('o')) return 12;
    return 0;
}

function updateSimplifiedStats(statsBar, progressBar) {
    const chartId = state.selectedChartId;
    const data = chartId ? (PRESET_DATA[chartId] || {}) : {};

    if (Object.keys(data).length === 0) {
        statsBar.innerHTML = '';
        progressBar.innerHTML = '';
        return;
    }

    const totalCombos = 1326;
    let raiseCombos = 0, callCombos = 0, foldCombos = 0;

    HAND_GRID.flat().forEach(hand => {
        const action = data[hand] || 'fold';
        const combos = getHandCombos(hand);
        if (action.includes('raise') || action.includes('threebet') || action.includes('fourbet')) {
            raiseCombos += combos;
        } else if (action === 'call' || action === 'limp') {
            callCombos += combos;
        } else {
            foldCombos += combos;
        }
    });

    const rPct = (raiseCombos / totalCombos * 100).toFixed(1);
    const cPct = (callCombos / totalCombos * 100).toFixed(1);
    const fPct = (foldCombos / totalCombos * 100).toFixed(1);

    statsBar.innerHTML = `
        <div class="stat-box raise-box">
            <div class="stat-info">
                <span class="stat-label">Raise</span>
                <span class="stat-value">${rPct}%</span>
            </div>
            <span class="stat-combos">${raiseCombos} combos</span>
        </div>
        <div class="stat-box call-box">
            <div class="stat-info">
                <span class="stat-label">Call</span>
                <span class="stat-value">${cPct}%</span>
            </div>
            <span class="stat-combos">${callCombos} combos</span>
        </div>
        <div class="stat-box fold-box">
            <div class="stat-info">
                <span class="stat-label">Fold</span>
                <span class="stat-value">${fPct}%</span>
            </div>
            <span class="stat-combos">${foldCombos} combos</span>
        </div>
    `;

    progressBar.innerHTML = `
        <div class="progress-raise" style="width: ${rPct}%"></div>
        <div class="progress-call" style="width: ${cPct}%"></div>
        <div class="progress-fold" style="width: ${fPct}%"></div>
    `;
}

// ============================================================
// TOOLTIP
// ============================================================

let tooltipEl = null;

function showTooltip(cell, hand) {
    if (state.chartMode === 'simplified') {
        if (!state.selectedChartId) return;
        showSimplifiedTooltip(cell, hand);
        return;
    }

    if (!state.selectedChartId) return;

    const data = getChartData(state.selectedChartId);
    const entry = data[hand];

    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.className = 'tooltip';
        document.body.appendChild(tooltipEl);
    }

    const combos = getHandCombos(hand);
    const type = hand.length === 2 ? 'Pair' : hand.endsWith('s') ? 'Suited' : 'Offsuit';

    if (entry && typeof entry === 'object') {
        const freqs = entry.frequencies || {};
        const foldPct = ((freqs.fold || 0) * 100).toFixed(1);
        const callPct = ((freqs.call || 0) * 100).toFixed(1);
        const raisePct = (getRaisePct(freqs) * 100).toFixed(1);

        tooltipEl.innerHTML = `
            <div class="tt-hand">${hand}</div>
            <div class="tt-type">${type} &middot; ${combos} combos</div>
            <div><span class="tt-raise">Raise ${raisePct}%</span></div>
            <div><span class="tt-call">Call ${callPct}%</span></div>
            <div><span class="tt-fold">Fold ${foldPct}%</span></div>
        `;
    } else {
        tooltipEl.innerHTML = `
            <div class="tt-hand">${hand}</div>
            <div class="tt-type">${type} &middot; ${combos} combos</div>
            <div class="tt-fold">Fold 100%</div>
        `;
    }

    tooltipEl.style.display = 'block';
    const rect = cell.getBoundingClientRect();
    tooltipEl.style.left = rect.left + rect.width / 2 + 'px';
    tooltipEl.style.top = rect.bottom + 8 + 'px';
}

function showSimplifiedTooltip(cell, hand) {
    const data = PRESET_DATA[state.selectedChartId] || {};
    const action = data[hand] || 'fold';
    const actionLabel = ACTIONS[action]?.label || 'Fold';
    const combos = getHandCombos(hand);
    const type = hand.length === 2 ? 'Pair' : hand.endsWith('s') ? 'Suited' : 'Offsuit';

    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.className = 'tooltip';
        document.body.appendChild(tooltipEl);
    }

    tooltipEl.innerHTML = `
        <div class="tt-hand">${hand}</div>
        <div class="tt-type">${type} &middot; ${combos} combos</div>
        <div>${actionLabel}</div>
    `;

    tooltipEl.style.display = 'block';
    const rect = cell.getBoundingClientRect();
    tooltipEl.style.left = rect.left + rect.width / 2 + 'px';
    tooltipEl.style.top = rect.bottom + 8 + 'px';
}

function hideTooltip() {
    if (tooltipEl) tooltipEl.style.display = 'none';
}

// ============================================================
// KEYBOARD NAVIGATION
// ============================================================

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        navigateOpponent(e.key === 'ArrowRight' ? 1 : -1);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        navigateHero(e.key === 'ArrowDown' ? 1 : -1);
    }
});

function navigateOpponent(direction) {
    const available = getAvailableOpponentSeats();
    if (available.length === 0) return;

    const idx = available.indexOf(state.opponentSeat);
    const next = idx === -1
        ? 0
        : Math.max(0, Math.min(available.length - 1, idx + direction));
    updateState('opponentSeat', available[next]);
}

function navigateHero(direction) {
    const available = getAvailableHeroSeats();
    if (available.length === 0) return;

    const idx = available.indexOf(state.heroSeat);
    const next = idx === -1
        ? 0
        : Math.max(0, Math.min(available.length - 1, idx + direction));
    updateState('heroSeat', available[next]);
}
