# Graph Report - C:/Users/Adria/Desktop/til_forwarder  (2026-07-15)

## Corpus Check
- 1 files · ~21,958 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 165 nodes · 205 edges · 19 communities (13 shown, 6 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Package Manifest & Dependencies
- Dashboard, Services & API Layer
- App Shell & Rutas/Transportistas Pages
- Layout & Chrome Components
- Project Docs & Deploy Config
- Rutas Seguimiento Page
- Caveman Skill Docs
- Dev Dependencies
- Icon Sprite Assets
- Maniobras Page & Utils
- Oxlint Config
- Clientes Page
- Favicon Asset
- Truck Icon Asset
- Hero Image Asset
- React Logo Asset
- Truck Favicon Asset
- Vite Logo Asset

## God Nodes (most connected - your core abstractions)
1. `api` - 6 edges
2. `Caveman Skill (LLM Instructions)` - 6 edges
3. `SVG Icon Sprite Sheet (icons.svg)` - 6 edges
4. `Dashboard()` - 5 edges
5. `React + Vite Template` - 5 edges
6. `Backend API Configuration` - 5 edges
7. `Clientes()` - 5 edges
8. `scripts` - 5 edges
9. `SteeringWheelOutlined()` - 4 edges
10. `TILLogo()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Static Build Command` --conceptually_related_to--> `React + Vite Template`  [INFERRED]
  render.yaml → README.md
- `til-forwarder Render Service` --shares_data_with--> `TIL App Entry HTML`  [INFERRED]
  render.yaml → index.html
- `Caveman Intensity Levels` --semantically_similar_to--> `Caveman Intensity Levels (Detailed)`  [INFERRED] [semantically similar]
  .agents/skills/caveman/README.md → .agents/skills/caveman/SKILL.md
- `Caveman Auto-Clarity Rule` --semantically_similar_to--> `Caveman Auto-Clarity Exceptions`  [INFERRED] [semantically similar]
  .agents/skills/caveman/README.md → .agents/skills/caveman/SKILL.md
- `Backend API Configuration` --references--> `til-forwarder Render Service`  [EXTRACTED]
  README.md → render.yaml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Frontend Build & Deploy Pipeline** — index_html_til_app, render_yaml_til_forwarder_service, readme_react_vite_template [INFERRED 0.75]
- **Caveman Mode Behavior Contract** — agents_skills_caveman_readme_caveman_skill, agents_skills_caveman_skill_caveman_skill, agents_skills_caveman_skill_intensity_levels [INFERRED 0.85]

## Communities (19 total, 6 thin omitted)

### Community 0 - "Package Manifest & Dependencies"
Cohesion: 0.08
Nodes (24): dependencies, @ant-design/icons, antd, axios, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, leaflet (+16 more)

### Community 1 - "Dashboard, Services & API Layer"
Cohesion: 0.17
Nodes (14): buildColumns(), ManeuversTable(), statusColor(), StatCard(), Dashboard(), isCancelled(), MEXICO_CENTER, parseCoords() (+6 more)

### Community 2 - "App Shell & Rutas/Transportistas Pages"
Cohesion: 0.12
Nodes (7): App(), queryClient, WaveBackground(), WAVES, isCancelado(), RutasPersonalizadas(), Transportistas()

### Community 3 - "Layout & Chrome Components"
Cohesion: 0.14
Nodes (9): GlobalLoader(), PAGE_TITLES, AppLayout(), GLASS, menuItems, menuItems, ServerStatus(), SteeringWheelOutlined() (+1 more)

### Community 4 - "Project Docs & Deploy Config"
Cohesion: 0.13
Nodes (16): src/main.jsx Entry Script, TIL App Entry HTML, truck_favicon.png, Backend API Configuration, maylob_backend Service, Local MongoDB, Oxc, React Compiler (+8 more)

### Community 5 - "Rutas Seguimiento Page"
Cohesion: 0.24
Nodes (7): buildPointMap(), ExpandedRow(), parseEvents(), RutasSeguimiento(), STATUS_OPTIONS, statusColor(), toOptions()

### Community 6 - "Caveman Skill Docs"
Cohesion: 0.24
Nodes (10): Caveman Auto-Clarity Rule, Caveman Skill, Caveman Intensity Levels, Caveman Invocation Commands, Caveman Auto-Clarity Exceptions, Caveman Boundaries Rule, Caveman Skill (LLM Instructions), Caveman Compression Rules (+2 more)

### Community 7 - "Dev Dependencies"
Cohesion: 0.29
Nodes (7): devDependencies, oxlint, playwright, @types/react, @types/react-dom, vite, @vitejs/plugin-react

### Community 8 - "Icon Sprite Assets"
Cohesion: 0.29
Nodes (7): Bluesky social icon (butterfly logo), Discord social icon (game controller/mask logo), Documentation icon (document with chat/arrow bubbles, purple outline), GitHub icon (Octocat/cat silhouette logo), Generic social/community icon (person with star badge, purple outline), SVG Icon Sprite Sheet (icons.svg), X (Twitter) icon

### Community 9 - "Maniobras Page & Utils"
Cohesion: 0.38
Nodes (3): glassGroupStyle, Maniobras(), backendMessage()

### Community 10 - "Oxlint Config"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 11 - "Clientes Page"
Cohesion: 0.53
Nodes (5): Clientes(), computeDirty(), DIRTY_CELL, getClientId(), toEdits()

## Knowledge Gaps
- **64 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `queryClient` (+59 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Dev Dependencies` to `Package Manifest & Dependencies`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `SteeringWheelOutlined()` connect `Layout & Chrome Components` to `Dashboard, Services & API Layer`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _66 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Package Manifest & Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `App Shell & Rutas/Transportistas Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.11904761904761904 - nodes in this community are weakly interconnected._
- **Should `Layout & Chrome Components` be split into smaller, more focused modules?**
  _Cohesion score 0.14035087719298245 - nodes in this community are weakly interconnected._
- **Should `Project Docs & Deploy Config` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._