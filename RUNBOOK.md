# EML Calculator -- Runbook

A browser-based scientific calculator that computes every operation using a single binary operator: `eml(x, y) = exp(x) - ln(y)`. Results are displayed alongside standard math library output for comparison.

Based on "All elementary functions from a single operator" by Odrzywolek (2026).

## Prerequisites

- **Node.js** 20+ and npm
- **Docker** (optional, for containerised deployment)

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Available commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Type-check and produce production build in `dist/` |
| `npm run preview` | Serve the production build locally for inspection |
| `npm test` | Run the full test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |

## Running with Docker

Build and run the self-contained image:

```bash
docker build -t eml-calculator .
docker run -p 8080:80 eml-calculator
```

Open http://localhost:8080. The image is a multi-stage build: Node 20 compiles the app, then only the static `dist/` output is copied into an nginx-alpine container.

To stop:

```bash
docker stop $(docker ps -q --filter ancestor=eml-calculator)
```

## Using the calculator

### Displays

The calculator has two display rows:

- **EML** (teal) -- the result computed entirely via `eml(x,y) = exp(x) - ln(y)` calls
- **Standard** (gold) -- the result from the browser's built-in `Math` library

Both should agree within floating-point tolerance. The standard display is output-only and clears when you begin entering a new number.

### Input modes

This is an immediate-execution calculator (like a Casio). There is no operator precedence: `2 + 3 * 4 =` produces `20`, not `14`.

**Number entry:** Digit buttons or keyboard keys `0`-`9` and `.`

**Binary operations:** `+`, `-`, `*` (multiply), `/` (divide), `x^n` (power). Keyboard shortcuts: `+`, `-`, `*`, `/`, `^`.

**Unary functions:** `sin`, `cos`, `tan`, `sqrt`. These apply immediately to the currently displayed value. All trigonometric functions use **radians**.

**Other controls:**
- `C` or `Escape` -- clear the calculator
- `+/-` -- negate the current value
- `=` or `Enter` -- evaluate the pending operation

**Operator chaining:** Pressing an operator after entering the second operand evaluates the pending operation before storing the new operator. For example: `2 + 3 +` first computes `5`, then waits for the next operand.

### Edge cases

If a computation produces `NaN`, `Infinity`, or `-Infinity`, both displays show **undefined**.

### EML tree visualisation

Click **Show EML Tree** below the keypad to open the tree panel. This shows how the most recent calculation decomposes into nested `eml()` calls.

- **Click** any purple (named function) or teal (eml) node to expand it and reveal its internal structure
- **Drag** to pan the view
- **Scroll** to zoom in/out
- The **arrow button** (`→` / `↓`) toggles between left-to-right and top-to-bottom tree orientation
- **Reset** snaps the view back to the default position and zoom

On wide screens the tree panel appears to the right of the calculator. On screens narrower than 800px it stacks below.

## Project structure

```
src/
  core/
    complex.ts            Immutable complex number class (IEEE754 edge cases)
    eml.ts                Core eml() primitive + 18 bootstrapped functions
    eml-traced.ts         Traced variants that build tree structures alongside values
    tree-layout.ts        Reingold-Tilford-style layout (TB and LR orientations)
    index.ts              Barrel exports
  calculator/
    calculator-engine.ts  Immediate-execution state machine with dual evaluation
  components/
    Calculator.tsx         Main container, keyboard handling, tree panel toggle
    Display.tsx            Dual-display component (EML + Standard)
    Keypad.tsx             Button grid
    Button.tsx             Individual button with variant styling
    TreeView.tsx           SVG tree panel with pan/zoom
    TreeNodeView.tsx       Recursive SVG node renderer
  App.tsx                  App shell (header, footer)
  main.tsx                 React entry point
  index.css                All styling
Dockerfile                 Multi-stage build (node + nginx)
nginx.conf                 Static file serving, SPA fallback, gzip
```

## How EML works

The single primitive `eml(x, y) = exp(x) - ln(y)` is the only function that calls `Math.exp` and `Math.log` directly. Everything else is built by composing `eml` calls:

| Level | Functions | How |
|-------|-----------|-----|
| 0 | `eml`, constant `1` | Primitive |
| 1 | `e`, `exp` | `e = eml(1,1)`, `exp(x) = eml(x,1)` |
| 2 | `ln` | `ln(x) = eml(1, eml(eml(1,x), 1))` |
| 3 | `0`, subtraction | `0 = eml(1, eml(e,1))`, `x-y = eml(ln(x), exp(y))` |
| 4 | negation, addition | `-x = 0-x`, `x+y = x-(-y)` |
| 5 | multiplication, division | `x*y = exp(ln(x)+ln(y))` |
| 6 | constants: `2`, `1/2`, `-1`, `i`, `pi` | Built from levels 1-5 |
| 7 | `pow`, `sqrt` | `x^y = exp(y*ln(x))` |
| 8 | `sin`, `cos`, `tan` | Via Euler's formula: `sin(x) = (exp(ix)-exp(-ix))/(2i)` |

All intermediate arithmetic uses complex numbers internally (required for trigonometric functions via Euler's formula). Only the real part of the final result is displayed.

## Tests

The test suite (144 tests) covers:

- **Complex class** (33 tests) -- arithmetic, exp/ln, IEEE754 edge cases (infinities, branch cuts)
- **EML engine** (49 tests) -- every bootstrapped function compared against `Math` equivalents
- **EML traced** (20 tests) -- traced values match untreated engine; tree structure correctness
- **Tree layout** (14 tests) -- dimensions, positions, expand/collapse stability, both orientations
- **Calculator engine** (28 tests) -- digit entry, arithmetic, chaining, unary ops, clear, negate, edge cases

Run with `npm test`. For watch mode during development: `npm run test:watch`.
