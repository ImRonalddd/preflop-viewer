# Preflop Charts - 9-Max NLH

Interactive preflop range viewer with 68 hand-painted charts covering every common spot in a 9-handed No Limit Hold'em game.

**Live site:** [preflop-viewer.vercel.app](https://preflop-viewer.vercel.app)

## How to Use

Open the live site or run locally (just open `index.html` in a browser - no build step needed).

### Navigation

- **Sidebar** lists every chart grouped into three categories (see below)
- Click any chart to display the 13x13 hand grid
- **Arrow keys** (Up/Down) cycle through charts
- Hover over any cell for combo details (hand type, number of combos, assigned action)

### Color Legend

| Color | Action | When You See It |
|-------|--------|-----------------|
| Red | Raise / 3-Bet value / 4-Bet value | Strong hands to raise for value |
| Light red | Raise bluff / 3-Bet bluff / 4-Bet bluff | Hands to raise as bluffs |
| Green | Call | Hands to flat call |
| Blue | Limp | Hands to limp (SB only) |
| Dark gray | Fold | Hands to fold |

### Stats Bar

Below the grid, a stats bar shows how many hands and combos fall into each action bucket, plus the percentage of the 1,326 total combos.

## Chart Categories

### 1. Raise First In (RFI)

What to open-raise from each position when it folds to you.

**8 charts:** UTG, UTG+1, UTG+2, LJ, HJ, CO, BTN, SB

The SB chart includes separate value-raise, bluff-raise, and limp categories. All other positions are simple raise-or-fold.

### 2. Facing RFI

What to do when someone has already opened and it's your turn.

**30 charts** covering every hero position vs every possible opener. For example:
- `HJ vs UTG Open` - you're in the HJ facing a UTG open
- `BB vs BTN Open` - you're in the BB facing a BTN open

Actions: 3-bet (value), 3-bet (bluff), call, or fold.

### 3. RFI vs 3-Bet

What to do when you opened and someone 3-bet you.

**28 charts** covering every opener vs every 3-bettor. For example:
- `UTG Open vs CO/BTN 3-Bet` - you opened UTG, CO or BTN 3-bet
- `CO Open vs BB 3-Bet` - you opened CO, BB 3-bet

Actions: 4-bet (value), 4-bet (bluff), call, or fold.

Plus a special chart for **SB Limp vs BB Raise** (limp-reraise spot).

## Data Format

All range data lives in `preset-data.js` as a single `PRESET_DATA` object. Each key is a chart ID, and each value is an object mapping hands to actions:

```js
const PRESET_DATA = {
  "rfi_utg": {
    "AA": "raise",
    "AKs": "raise",
    "AKo": "raise",
    "77": "raise",
    // hands not listed default to "fold"
  },
  "facing_rfi_bb_vs_btn": {
    "AA": "threebet_value",
    "AKs": "threebet_value",
    "AQs": "call",
    "T9s": "call",
    "72o": "fold",
    // ...
  },
  // ... 68 charts total
};
```

### Chart ID format

| Pattern | Example | Meaning |
|---------|---------|---------|
| `rfi_{position}` | `rfi_co` | CO open-raise range |
| `facing_rfi_{hero}_vs_{villain}` | `facing_rfi_bb_vs_btn` | BB facing BTN open |
| `vs_3bet_{hero}_vs_{villain}` | `vs_3bet_utg_vs_hj` | UTG opened, HJ 3-bet |

Position abbreviations: `utg`, `utgp1`, `utgp2`, `lj`, `hj`, `co`, `btn`, `sb`, `bb`. Combined positions use underscores: `utg_utgp1`, `co_btn`, `sb_bb`.

### Action values

| Value | Used In |
|-------|---------|
| `raise` | RFI charts |
| `raise_value` / `raise_bluff` | SB RFI chart |
| `limp` | SB RFI chart |
| `threebet_value` / `threebet_bluff` | Facing RFI charts |
| `call` | Facing RFI and vs 3-Bet charts |
| `fourbet_value` / `fourbet_bluff` | vs 3-Bet charts |
| `fold` | All charts (default when hand is omitted) |

### Hand notation

Standard 169-hand notation:
- **Pairs:** `AA`, `KK`, ..., `22`
- **Suited:** `AKs`, `AQs`, ..., `32s` (higher rank first)
- **Offsuit:** `AKo`, `AQo`, ..., `32o` (higher rank first)

## Files

| File | Purpose |
|------|---------|
| `index.html` | Entry point - loads everything |
| `charts.js` | Chart definitions, position configs, action colors, hand grid generation |
| `preset-data.js` | All 68 hand-painted range charts (the data) |
| `app.js` | UI logic - sidebar, grid rendering, tooltips, keyboard nav, stats |
| `styles.css` | Dark theme styling |

## Run Locally

No dependencies. Just open the HTML file:

```bash
open index.html
# or
python3 -m http.server 8000   # then visit localhost:8000
```
