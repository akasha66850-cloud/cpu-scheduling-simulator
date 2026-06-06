# CPU Scheduling Simulator

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Pages](https://img.shields.io/badge/Deployed-GitHub_Pages-181717?style=flat&logo=github)](https://pages.github.com/)

> An interactive, production-grade CPU Scheduling Simulator built for a CS Engineering portfolio. Visualize, compare, and analyze scheduling algorithms with animated Gantt charts, real-time metrics, and professional export features.

---

## 🚀 Features

- ⚡ **6 Scheduling Algorithms** — FCFS, SJF, SRTF, Priority, Priority Preemptive, Round Robin
- 📊 **Animated Gantt Chart** — Color-coded, proportional blocks with staggered entry animations
- 🔢 **Step-by-Step Mode** — Advance simulation one time unit at a time with ready queue display
- 📈 **Comparison Dashboard** — Run all 6 algorithms in parallel and compare metrics side-by-side
- 📉 **Analytics Page** — Process timeline, WT/RT distribution charts, context switch visualization
- 🏆 **Best-Value Highlighting** — Automatically highlights winning algorithm per metric
- ⚠️ **Starvation Detection** — Flags processes waiting > 3× average burst time
- 🧓 **Priority Aging** — Simulates aging to prevent indefinite starvation in priority algorithms
- 🔄 **State Transition Diagram** — New → Ready → Running → Terminated per process in step mode
- 💾 **Simulation History** — Save/load up to 10 simulations via localStorage
- 📄 **PDF Export** — Full report with Gantt chart rendered as colored rectangles
- 📁 **CSV Export** — All metrics + averages row via PapaParse
- ⌨️ **Keyboard Shortcuts** — R (run), C (clear), S (save), ?, Arrow keys (step mode)
- 🌙 **Dark Mode** — Default dark theme with toggle
- 📱 **Responsive** — Works on mobile, tablet, and desktop

---

## 📐 Algorithms Implemented

| Algorithm | Type | Time Complexity | Starvation | Notes |
|-----------|------|----------------|------------|-------|
| **FCFS** | Non-Preemptive | O(n log n) | ❌ None | Simplest; poor for varied burst times |
| **SJF** | Non-Preemptive | O(n²) | ⚠️ Possible | Optimal avg WT; needs burst time prediction |
| **SRTF** | Preemptive | O(n²) | ⚠️ Possible | Optimal avg TAT; high context switch overhead |
| **Priority** | Non-Preemptive | O(n²) | ⚠️ Possible | Supports aging simulation |
| **Priority Pre.** | Preemptive | O(n²) | ⚠️ Possible | Immediate preemption on high-priority arrival |
| **Round Robin** | Preemptive | O(n·T/q) | ❌ None | Fairness guaranteed; configurable quantum |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework with concurrent features |
| **Vite** | Ultra-fast build tool and dev server |
| **Tailwind CSS v3** | Utility-first styling with dark mode |
| **Zustand** | Lightweight global state management |
| **Recharts** | Responsive chart library for comparison/analytics |
| **Framer Motion** | Declarative animations and transitions |
| **jsPDF + autotable** | PDF report generation |
| **PapaParse** | CSV export |
| **Lucide React** | Consistent icon library |
| **React Router v6** | Client-side routing |

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+ and npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/cpu-scheduling-simulator.git
cd cpu-scheduling-simulator

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173/cpu-scheduling-simulator/](http://localhost:5173/cpu-scheduling-simulator/) in your browser.

### Build for Production

```bash
npm run build
# Output is in the dist/ directory
```

---

## 📁 Project Structure

```
cpu-scheduling-simulator/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD
├── public/
├── src/
│   ├── algorithms/             # Pure JS scheduling implementations
│   │   ├── fcfs.js             # First Come First Served
│   │   ├── sjf.js              # Shortest Job First (Non-Preemptive)
│   │   ├── srtf.js             # Shortest Remaining Time First
│   │   ├── priority.js         # Priority (Non-Preemptive)
│   │   ├── priorityPreemptive.js
│   │   └── roundRobin.js       # Round Robin with configurable quantum
│   ├── components/             # Reusable React components
│   │   ├── GanttChart.jsx      # Animated div-based Gantt timeline
│   │   ├── MetricsTable.jsx    # Per-process results table
│   │   ├── MetricCards.jsx     # Summary metric cards
│   │   ├── ComparisonChart.jsx # Recharts bar chart
│   │   ├── ProcessForm.jsx     # Process input with validation
│   │   ├── ProcessTable.jsx    # Editable process list
│   │   ├── Navbar.jsx          # Sticky navbar with mobile menu
│   │   ├── AlgorithmInfoPanel.jsx
│   │   ├── StepModeControls.jsx
│   │   ├── StateTransitionDiagram.jsx
│   │   ├── HistoryDrawer.jsx
│   │   ├── KeyboardShortcuts.jsx
│   │   └── EmptyState.jsx
│   ├── pages/                  # Route-level page components
│   │   ├── Home.jsx            # Landing page with hero + algorithm overview
│   │   ├── Simulator.jsx       # Main simulation interface
│   │   ├── Comparison.jsx      # Side-by-side algorithm comparison
│   │   └── Analytics.jsx       # Detailed analytics dashboard
│   ├── store/
│   │   └── useSchedulerStore.js # Zustand global state + localStorage
│   ├── utils/
│   │   ├── metrics.js          # Aggregate metrics computation
│   │   └── exportHelpers.js    # PDF and CSV export functions
│   ├── App.jsx                 # Router + lazy loading
│   ├── main.jsx                # React 18 entry point
│   └── index.css               # Tailwind + custom CSS
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `R` | Run simulation |
| `C` | Clear all processes |
| `S` | Save simulation to history |
| `→` | Step forward (step mode) |
| `←` | Step backward (step mode) |
| `?` | Show shortcuts cheatsheet |
| `Esc` | Close dialogs |

---

## 🧪 Algorithm Correctness

Each algorithm is tested against known examples:

- **FCFS** `[P1(0,5), P2(1,3), P3(2,1)]` → P1:CT=5, P2:CT=8, P3:CT=9
- **RR q=2** `[P1(0,5), P2(0,3)]` → P1:[0-2,4-6,7-8], P2:[2-4,6-7]
- **SJF** selects shortest available burst at each decision point
- **SRTF** preempts running process when shorter burst arrives

---

## 🚀 Deployment

The app is configured for GitHub Pages deployment via GitHub Actions.

1. Push code to `main` branch
2. GitHub Actions builds the project (`npm ci && npm run build`)
3. Deploys `dist/` to GitHub Pages automatically

**Enable GitHub Pages:**
- Go to repo Settings → Pages → Source: GitHub Actions

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/new-algorithm`
3. Commit your changes: `git commit -m 'Add MLFQ algorithm'`
4. Push to the branch: `git push origin feature/new-algorithm`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">Built with ❤️ for a CS Engineering portfolio</p>
