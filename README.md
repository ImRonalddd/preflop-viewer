# Preflop Charts Viewer

Interactive preflop range viewer with two chart modes:

- **Simplified** - 68 hand-painted charts for 9-Max NLH covering RFI, Facing RFI, and vs 3-Bet scenarios
- **Advanced** - 2,231 GTO mixed strategy charts scraped from PokerCoaching.com, with per-hand raise/call/fold frequencies for Cash Games (8-Max, 6-Max, HU) and Tournament (8-Max, HU)

**Live site:** [preflop-viewer.vercel.app](https://preflop-viewer.vercel.app)

## How to Use

Open the live site or run locally:

```bash
python3 -m http.server 8888   # then visit localhost:8888
```

No build step needed.

### Chart Mode Toggle

Switch between **Simplified** and **Advanced** at the top of the control panel.

### Controls

Both modes use cascading button controls that filter down to a specific chart:

| Control | Description |
|---------|-------------|
| **Game Type** | Cash Games, Tournament, HU MTT, HU Cash (Advanced only) |
| **Format** | 8Max, 6Max (Advanced only) |
| **Stack Size** | 100bb, 200bb for Cash; 2bb-100bb for Tournament (Advanced only) |
| **Hero Seat** | UTG, UTG+1, LJ, HJ, CO, BTN, SB, BB |
| **Preflop Action** | RFI, vs. RFI, vs. 3-Bet, Squeeze, etc. |
| **Opponent Seat** | Position of the villain (when applicable) |

### Grid Colors

| Color | Action |
|-------|--------|
| Red `rgb(240, 60, 60)` | Raise / 3-Bet / 4-Bet |
| Green `rgb(90, 185, 102)` | Call |
| Blue `rgb(61, 124, 184)` | Fold |
| Gradient | Mixed strategy (proportional raise/call/fold) |

### Keyboard Navigation

- **Arrow Up/Down** - Cycle through hero seats
- **Arrow Left/Right** - Cycle through opponent seats

### Tooltips

Hover over any cell to see:
- Hand name and type (Pair/Suited/Offsuit)
- Number of combos
- Raise/Call/Fold percentages (Advanced mode)

## Data Sources

### Simplified Charts (`preset-data.js`)

68 hand-painted charts from PokerCoaching.com PDF materials. Each hand maps to a single action (raise, call, fold, etc.). No mixed strategies.

### Advanced Charts (`gto-mixed-data.js`)

2,231 charts scraped from PokerCoaching.com's GTO Charts tool via their `/api/get-training-weights` endpoint:

| Game Format | Charts | Table Types | Stack Sizes |
|-------------|--------|-------------|-------------|
| Cash | 397 | 8Max, 6Max, HU | 100bb, 200bb |
| MTT | 1,834 | 8Max, HU | 2bb - 100bb (21 sizes) |

Each chart contains 169 hands with mixed frequency data:

```json
{
  "AA": {
    "action": "raise",
    "frequencies": { "fold": 0, "call": 0, "raise_3": 1 }
  },
  "AJs": {
    "action": "mixed",
    "frequencies": { "fold": 0.15, "call": 0.45, "raise_3": 0.40 }
  }
}
```

## Files

| File | Purpose |
|------|---------|
| `index.html` | Entry point |
| `charts.js` | Hand grid generation and simplified chart definitions |
| `preset-data.js` | 68 hand-painted simplified charts |
| `gto-mixed-data.js` | 2,231 GTO mixed strategy charts |
| `app.js` | UI logic - cascading controls, grid rendering, tooltips, stats |
| `styles.css` | Dark theme matching PokerCoaching.com |

## Stats Bar

Below the grid, three colored boxes show the aggregate raise/call/fold distribution with a horizontal progress bar.
