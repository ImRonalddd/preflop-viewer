const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

function generateHandGrid() {
    const grid = [];
    for (let r = 0; r < 13; r++) {
        const row = [];
        for (let c = 0; c < 13; c++) {
            if (r === c) {
                row.push(RANKS[r] + RANKS[c]);
            } else if (c > r) {
                row.push(RANKS[r] + RANKS[c] + 's');
            } else {
                row.push(RANKS[c] + RANKS[r] + 'o');
            }
        }
        grid.push(row);
    }
    return grid;
}

const HAND_GRID = generateHandGrid();

const ACTIONS = {
    raise: { label: 'Raise', color: '#e74c3c', textColor: '#fff' },
    raise_value: { label: 'Raise (Value)', color: '#e74c3c', textColor: '#fff' },
    raise_bluff: { label: 'Raise (Bluff)', color: '#ff8a80', textColor: '#000' },
    threebet_value: { label: '3-Bet (Value)', color: '#e74c3c', textColor: '#fff' },
    threebet_bluff: { label: '3-Bet (Bluff)', color: '#ff8a80', textColor: '#000' },
    fourbet_value: { label: '4-Bet (Value)', color: '#e74c3c', textColor: '#fff' },
    fourbet_bluff: { label: '4-Bet (Bluff)', color: '#ff8a80', textColor: '#000' },
    call: { label: 'Call', color: '#2ecc71', textColor: '#fff' },
    limp: { label: 'Limp', color: '#3498db', textColor: '#fff' },
    fold: { label: 'Fold', color: '#2c2c2c', textColor: '#666' },
};

const SCENARIO_ACTIONS = {
    rfi: ['raise', 'fold'],
    rfi_sb: ['raise_value', 'raise_bluff', 'limp', 'fold'],
    facing_rfi: ['threebet_value', 'threebet_bluff', 'call', 'fold'],
    vs_3bet: ['fourbet_value', 'fourbet_bluff', 'call', 'fold'],
};

const CHART_DEFINITIONS = [];

const RFI_POSITIONS = ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB'];

RFI_POSITIONS.forEach(pos => {
    CHART_DEFINITIONS.push({
        id: `rfi_${pos.toLowerCase().replace('+', 'p')}`,
        name: `${pos} Open (RFI)`,
        section: 'rfi',
        heroPosition: pos,
        scenario: pos === 'SB' ? 'rfi_sb' : 'rfi',
        description: `Which hands to open-raise from ${pos} when folded to you.`,
    });
});

const FACING_RFI_GROUPED = [
    { hero: 'UTG+1', villain: 'UTG' },
    { hero: 'UTG+2', villain: 'UTG/UTG+1' },
    { hero: 'LJ', villain: 'UTG/UTG+1' },
    { hero: 'LJ', villain: 'UTG+2' },
    { hero: 'HJ', villain: 'UTG' },
    { hero: 'HJ', villain: 'UTG+1' },
    { hero: 'HJ', villain: 'UTG+2' },
    { hero: 'HJ', villain: 'LJ' },
    { hero: 'CO', villain: 'UTG/UTG+1' },
    { hero: 'CO', villain: 'UTG+2' },
    { hero: 'CO', villain: 'LJ' },
    { hero: 'CO', villain: 'HJ' },
    { hero: 'BTN', villain: 'UTG' },
    { hero: 'BTN', villain: 'UTG+1' },
    { hero: 'BTN', villain: 'UTG+2' },
    { hero: 'BTN', villain: 'LJ' },
    { hero: 'BTN', villain: 'HJ' },
    { hero: 'BTN', villain: 'CO' },
    { hero: 'SB', villain: 'UTG/UTG+1' },
    { hero: 'SB', villain: 'UTG+2' },
    { hero: 'SB', villain: 'LJ' },
    { hero: 'SB', villain: 'HJ' },
    { hero: 'SB', villain: 'CO' },
    { hero: 'SB', villain: 'BTN' },
    { hero: 'BB', villain: 'UTG/UTG+1' },
    { hero: 'BB', villain: 'UTG+2' },
    { hero: 'BB', villain: 'LJ' },
    { hero: 'BB', villain: 'HJ' },
    { hero: 'BB', villain: 'CO' },
    { hero: 'BB', villain: 'BTN' },
    { hero: 'BB', villain: 'SB' },
];

FACING_RFI_GROUPED.forEach(({ hero, villain }) => {
    const villainKey = villain.replace(/[+/]/g, match => match === '+' ? 'p' : '_');
    const heroKey = hero.replace('+', 'p');

    CHART_DEFINITIONS.push({
        id: `facing_rfi_${heroKey}_vs_${villainKey}`.toLowerCase(),
        name: `${hero} vs ${villain} Open`,
        section: 'facing_rfi',
        heroPosition: hero,
        villainPosition: villain,
        scenario: 'facing_rfi',
        description: `${hero} facing an open raise from ${villain}. Choose: 3-bet, call, or fold.`,
    });
});

const VS_3BET_GROUPED = [
    { hero: 'UTG', villain: 'UTG+1' },
    { hero: 'UTG', villain: 'UTG+2' },
    { hero: 'UTG', villain: 'LJ' },
    { hero: 'UTG', villain: 'HJ' },
    { hero: 'UTG', villain: 'CO/BTN' },
    { hero: 'UTG', villain: 'SB/BB' },
    { hero: 'UTG+1', villain: 'UTG+2' },
    { hero: 'UTG+1', villain: 'LJ' },
    { hero: 'UTG+1', villain: 'HJ/CO' },
    { hero: 'UTG+1', villain: 'BTN' },
    { hero: 'UTG+1', villain: 'SB/BB' },
    { hero: 'UTG+2', villain: 'LJ' },
    { hero: 'UTG+2', villain: 'HJ' },
    { hero: 'UTG+2', villain: 'CO/BTN' },
    { hero: 'UTG+2', villain: 'SB/BB' },
    { hero: 'LJ', villain: 'HJ' },
    { hero: 'LJ', villain: 'CO' },
    { hero: 'LJ', villain: 'BTN' },
    { hero: 'LJ', villain: 'SB' },
    { hero: 'LJ', villain: 'BB' },
    { hero: 'HJ', villain: 'CO' },
    { hero: 'HJ', villain: 'BTN' },
    { hero: 'HJ', villain: 'SB' },
    { hero: 'HJ', villain: 'BB' },
    { hero: 'CO', villain: 'BTN/SB' },
    { hero: 'CO', villain: 'BB' },
    { hero: 'BTN', villain: 'SB/BB' },
    { hero: 'SB', villain: 'BB' },
];

VS_3BET_GROUPED.forEach(({ hero, villain }) => {
    const villainKey = villain.replace(/[+/]/g, match => match === '+' ? 'p' : '_');
    const heroKey = hero.replace('+', 'p');

    CHART_DEFINITIONS.push({
        id: `vs_3bet_${heroKey}_vs_${villainKey}`.toLowerCase(),
        name: `${hero} Open vs ${villain} 3-Bet`,
        section: 'vs_3bet',
        heroPosition: hero,
        villainPosition: villain,
        scenario: 'vs_3bet',
        description: `You opened from ${hero}, ${villain} 3-bet. Choose: 4-bet, call, or fold.`,
    });
});

CHART_DEFINITIONS.push({
    id: 'sb_limp_vs_bb_raise',
    name: 'SB Limp vs BB Raise',
    section: 'vs_3bet',
    heroPosition: 'SB',
    villainPosition: 'BB',
    scenario: 'vs_3bet',
    description: 'You limped from SB, BB raised. Choose: 3-bet (limp-reraise), call, or fold.',
});
