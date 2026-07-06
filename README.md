# Operating System Algorithms Simulator

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A **resume-worthy**, interactive, production-grade Operating System Simulator built for a CS Engineering portfolio. Visualize, compare, and analyze **CPU Scheduling**, **Process Synchronization**, **Memory Management**, **Page Replacement**, **Deadlock Handling**, and **Disk Scheduling** algorithms with beautiful animated UI elements, real-time metrics, and professional export features.
> 
> Fully refactored to be **100% Client-Side** using pure JavaScript. Zero backend, zero Docker, zero WebAssembly dependencies!

---

## 🤖 AI Assistant Setup

The AI assistant uses Ollama to run a local LLM completely offline.

**Step 1 — Install Ollama:**
Visit https://ollama.com and download for your OS (Windows/Mac/Linux).

**Step 2 — Pull the model (run once in terminal):**
```bash
ollama pull llama3.2:1b
```

**Step 3 — Start Ollama (runs in background):**
```bash
ollama serve
```

**Step 4 — Start the app normally:**
```bash
npm run dev
```

Ollama runs at http://localhost:11434 by default.
The assistant auto-detects if Ollama is running and shows a warning if not.

The app is exclusively configured to use the ultra-lightweight `llama3.2:1b` model to ensure blazing fast, hardware-friendly performance.

---

## 🚀 Features

### AI Assistant Module
- 💬 **Local LLM Integration** — Powered completely offline by Ollama running `llama3.2:1b`.
- 🪟 **Floating & Full-page Interface** — Use the assistant docked in the sidebar, popped out as a draggable floating window, or in a dedicated full-page view.
- 📎 **File Attachments & OCR** — Upload PDFs, text files, or images. Automatically extracts text (via `pdfjs-dist` and `tesseract.js`) to provide as context for your prompts.
- 🧠 **Simulation Context Awareness** — OSBot automatically reads the live state of your active simulator (e.g., CPU processes, memory blocks, disk requests) to provide accurate answers without you having to copy-paste data.

### CPU Scheduling Module
- ⚡ **6 Scheduling Algorithms** — FCFS, SJF, SRTF, Priority, Priority Preemptive, Round Robin
- 📊 **Animated Gantt Chart** — Color-coded, proportional blocks with staggered entry animations
- 🔢 **Step-by-Step Mode** — Advance simulation one time unit at a time with ready queue display
- 📈 **Comparison Dashboard** — Run all algorithms in parallel and compare metrics side-by-side
- 📉 **Analytics Page** — Process timeline, WT/RT distribution charts, context switch visualization

### Process Synchronization Module
- 🚦 **5 IPC Problems** — Mutex, Counting Semaphore, Producer-Consumer, Reader-Writer, Dining Philosophers.
- 🎨 **Framer Motion Interactivity** — Beautiful dynamic visualizations (token passing, sliding arrays, SVG vectors).
- ♾️ **Deadlock-Free Paradigms** — Hard-coded Chandy/Misra ordered locking for Dining Philosophers.
- 📊 **Comparison Dashboard** — Recharts grouping to compare throughput vs wait times and starvation.

### Memory Management Module
- 🧠 **4 Allocation Algorithms** — First Fit, Best Fit, Worst Fit, Next Fit
- 🧱 **Animated Memory Map** — Visually see blocks filling up proportionally with Framer Motion
- 📏 **Real-time Fragmentation Tracking** — Accurately computes Internal and External Fragmentation.
- 📊 **Memory Comparison Dashboard** — Race all memory algorithms and visualize Success Rate, Utilization, and Fragmentation.

### Page Replacement Module
- 📄 **4 Replacement Algorithms** — FIFO, LRU, Optimal (Belady), Second Chance (Clock)
- 🔲 **Animated Frame Map** — Watch physical frames populate, hit (green pulse), fault (red pulse), and seamlessly evict via Framer Motion.
- 🚨 **Belady's Anomaly Detector** — Automatically sweeps FIFO from 1 to 8 frames, charting Faults vs. Frames and highlighting anomaly triggers in red.
- 🗺️ **Reference String Heatmap** — Visualize exactly where faults and hits occur across the entire reference string.

### Deadlock Handling Module
- 🛡️ **5 Handling Strategies** — Banker's Avoidance, RAG Detection, Terminate Recovery, Preempt Recovery, Hold & Wait Prevention, Circular Wait Prevention.
- 🕸️ **Animated RAG Visualizer** — Resource Allocation Graph rendered dynamically with SVG and Framer Motion. Deadlocked cycles pulse red.
- 🔢 **Banker's State Matrix** — Validates Max, Allocation, Need, and Available matrices. Renders safe sequence as an animated pill chain.
- 📋 **Coffman Conditions Panel** — Live dashboard showing which of the 4 Coffman conditions are violated or satisfied.

### Disk Scheduling Module
- 💽 **6 Algorithms** — FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK.
- 📉 **Seek Trajectory Chart** — Recharts line chart mapping head movement across cylinders over time.
- 🚥 **Animated Disk Map** — A sliding read/write head indicator sweeping across the disk surface, illuminating request nodes.
- 📈 **Comparison Dashboard** — Total seek distance comparisons to find the most efficient scheduling strategy.

### General Features
- ⚙️ **Global Settings** — Customizable themes, accent colors, simulation defaults, notification thresholds, and history data limits that persist locally via Zustand.
- 💡 **Hover Formulas** — Hover over any metric card across all modules to instantly view the mathematical formula used for its calculation.
- 📄 **Advanced PDF Exports** — Full reports with Gantt charts, Data Tables, **Embedded Performance Charts (via html2canvas)**, and **Formula Legends**.
- 📁 **CSV Export** — All metrics + averages row via PapaParse
- ⌨️ **Keyboard Shortcuts** — Global hotkeys for running simulations, clearing data, saving runs, and toggling themes.
- 🌙 **Dark/Light Modes** — Full theming support with dynamic glassmorphic elements and custom accent colors.

---

## 📐 Algorithms Implemented

### CPU Scheduling
| Algorithm | Type | Time Complexity | Starvation | Notes |
|-----------|------|----------------|------------|-------|
| **FCFS** | Non-Preemptive | O(n log n) | ❌ None | Simplest; poor for varied burst times |
| **SJF** | Non-Preemptive | O(n²) | ⚠️ Possible | Optimal avg WT; needs burst time prediction |
| **SRTF** | Preemptive | O(n²) | ⚠️ Possible | Optimal avg TAT; high context switch overhead |
| **Priority** | Non-Preemptive | O(n²) | ⚠️ Possible | Supports aging simulation |
| **Priority Pre.** | Preemptive | O(n²) | ⚠️ Possible | Immediate preemption on high-priority arrival |
| **Round Robin** | Preemptive | O(n·T/q) | ❌ None | Fairness guaranteed; configurable quantum |

### Process Synchronization
| Problem | Mechanism | Notes |
|---------|-----------|-------|
| **Mutex** | Binary Lock | Simple exclusive ownership of a shared resource. |
| **Semaphore** | Counting Pool | Bounded concurrent access to multiple identical resources. |
| **Prod/Cons** | Bounded Buffer | Synchronized via capacity limits and waiting states. |
| **Read/Write** | Shared Database | Supports toggling between Reader preference vs Writer preference. |
| **Dining Phils**| Multiple Locks | Chandy/Misra implementation avoids circular wait deadlocks entirely. |

### Memory Allocation
| Algorithm | Speed | Fragmentation Impact | Notes |
|-----------|-------|----------------------|-------|
| **First Fit** | Fast | Moderate External | Allocates the first hole that is big enough. |
| **Best Fit** | Slow | High External (tiny holes) | Searches entire list to find the tightest fit. |
| **Worst Fit**| Slow | High Internal | Allocates the largest available hole. |
| **Next Fit** | Fast | Moderate External | Starts searching from the last allocated block. |

### Page Replacement
| Algorithm | Implementation Logic | Belady's Anomaly | Notes |
|-----------|----------------------|------------------|-------|
| **FIFO** | Queue array | ⚠️ Susceptible | Simplest implementation, poor performance. |
| **LRU** | Sliding Usage Queue | ❌ Immune | Replaces least recently accessed page. |
| **Optimal**| Future Look-ahead | ❌ Immune | Impossible in reality; serves as theoretical benchmark. |
| **Second Chance**| Clock Pointer + Ref Bits | ❌ Immune | FIFO with a hardware reference bit optimization. |

### Deadlock Handling
| Algorithm | Type | Complexity | Starvation | Notes |
|-----------|------|------------|------------|-------|
| **Detection (RAG)** | Passive | O(n²·r) | ⚠️ Possible | Run periodically; best when deadlock is rare |
| **Recovery — Terminate**| Reactive | O(n·r) | ⚠️ Possible | Least-cost process terminated first |
| **Recovery — Preempt** | Reactive | O(n·r) | ⚠️ Possible | Resources stripped and process rolled back |
| **Prevention — H&W** | Proactive | O(n·r) | ❌ Yes | All resources requested atomically upfront |
| **Prevention — Circ.** | Proactive | O(r) | ❌ No | Global resource ordering enforced |
| **Banker's Avoidance** | Proactive | O(n²·r) | ❌ No | Never enter unsafe state; needs max claims |

### Disk Scheduling
| Algorithm | Fairness | Reversals | Notes |
|-----------|----------|-----------|-------|
| **FCFS** | 100% | Frequent | High average response time; entirely fair. |
| **SSTF** | Low | Moderate | Starvation risk for distant requests; highly efficient. |
| **SCAN** | Moderate | 1 per pass | "Elevator algorithm" goes all the way to disk boundary. |
| **C-SCAN**| Moderate | 0 | Provides more uniform wait times than SCAN. |
| **LOOK** | Moderate | 1 per pass | Smarter SCAN: stops at furthest request instead of boundary. |
| **C-LOOK**| Moderate | 0 | Smarter C-SCAN: jumps back to lowest request, not 0. |

---

## 📁 File Structure

```text
📦 os-simulator
 ┣ 📂 src
 ┃ ┣ 📂 components            # Reusable React components (Modularized by OS concept)
 ┃ ┃ ┣ 📂 deadlock            # Deadlock simulator UI components
 ┃ ┃ ┣ 📂 disk                # Disk scheduling UI components
 ┃ ┃ ┣ 📂 memory              # Memory management UI components
 ┃ ┃ ┣ 📂 pageReplacement     # Page replacement UI components
 ┃ ┃ ┗ 📂 sync                # Process synchronization UI components
 ┃ ┣ 📂 pages                 # Main route pages (Dashboard, Simulators)
 ┃ ┣ 📂 store                 # Zustand global state (useSyncStore.js, useDiskStore.js, etc.)
 ┃ ┣ 📂 utils                 # Pure JS algorithms (deadlockAlgorithms.js, diskAlgorithms.js, etc.)
 ┃ ┣ 📜 App.jsx               # Routes and lazy loading
 ┃ ┗ 📜 main.jsx              # React entry point
 ┣ 📜 package.json            # Node dependencies
 ┗ 📜 vite.config.js          # Vite bundler configuration
```

---

## 🛠️ Tech Stack

### Frontend & Core Logic
| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework with concurrent features |
| **Vite** | Ultra-fast build tool and dev server |
| **Tailwind CSS v3** | Utility-first styling with dark mode |
| **Zustand** | Lightweight global state management |
| **Vanilla JavaScript** | High-performance, fully native client-side algorithms |
| **Recharts** | Responsive chart library for comparison/analytics |
| **Framer Motion** | Declarative animations and transitions |
| **jsPDF + html2canvas**| PDF report generation with embedded DOM charts |
| **PapaParse** | CSV export |
| **Lucide React** | Consistent icon library |
| **React Router v6** | Client-side routing |

*Note: The project was completely refactored to remove all legacy C++/WebAssembly/Docker requirements. All algorithms now run natively and instantly in the browser via JavaScript.*

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+ and npm 9+
*(No Docker or C++ compiler required!)*

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/os-simulator.git
cd os-simulator

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
# Output is in the dist/ directory
```

---

## ⌨️ Keyboard Shortcuts

Global customizable keyboard shortcuts are supported across all simulator modules. Defaults:

| Key | Action |
|-----|--------|
| `R` | Run simulation |
| `C` | Clear all processes / data |
| `S` | Save simulation |
| `→` | Next step (step mode) |
| `←` | Previous step (step mode) |
| `D` | Toggle dark/light mode |
| `?` | Show shortcuts help bar |
| `Esc` | Close dialogs |

---

## 🚀 Deployment

The app is entirely client-side and can be easily deployed to GitHub Pages, Vercel, Netlify, or any static hosting provider.

```bash
npm run build
# Deploy the /dist folder!
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">Built with ❤️ for a CS Engineering portfolio</p>
