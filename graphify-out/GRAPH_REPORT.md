# Graph Report - .  (2026-07-13)

## Corpus Check
- 1 files · ~21,736 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 159 nodes · 198 edges · 20 communities (13 shown, 7 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Package Manifest & Dependencies
- Layout & Chrome Components
- Dashboard & API Services
- App Entry & Clientes Page
- Project Docs & Deploy Config
- Rutas Seguimiento Page
- Caveman Skill Docs
- Dev Dependencies
- Icon Sprite Assets
- Maniobras Page & Utils
- Transportistas Page
- Oxlint Config
- Maneuvers Table Component
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
4. `scripts` - 5 edges
5. `Dashboard()` - 5 edges
6. `React + Vite Template` - 5 edges
7. `Backend API Configuration` - 5 edges
8. `Clientes()` - 5 edges
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

## Communities (20 total, 7 thin omitted)

### Community 0 - "Package Manifest & Dependencies"
Cohesion: 0.09
Nodes (21): dependencies, @ant-design/icons, antd, axios, leaflet, react, react-dom, react-leaflet (+13 more)

### Community 1 - "Layout & Chrome Components"
Cohesion: 0.14
Nodes (9): GlobalLoader(), PAGE_TITLES, AppLayout(), GLASS, menuItems, menuItems, ServerStatus(), SteeringWheelOutlined() (+1 more)

### Community 2 - "Dashboard & API Services"
Cohesion: 0.21
Nodes (11): StatCard(), Dashboard(), isCancelled(), MEXICO_CENTER, parseCoords(), parseProgress(), api, clientesService (+3 more)

### Community 3 - "App Entry & Clientes Page"
Cohesion: 0.17
Nodes (10): App(), queryClient, WaveBackground(), WAVES, Clientes(), computeDirty(), DIRTY_CELL, getClientId() (+2 more)

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

### Community 11 - "Oxlint Config"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 12 - "Maneuvers Table Component"
Cohesion: 0.83
Nodes (3): buildColumns(), ManeuversTable(), statusColor()

## Knowledge Gaps
- **61 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `name` (+56 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SteeringWheelOutlined()` connect `Layout & Chrome Components` to `Dashboard & API Services`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dev Dependencies` to `Package Manifest & Dependencies`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _63 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Package Manifest & Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `Layout & Chrome Components` be split into smaller, more focused modules?**
  _Cohesion score 0.14035087719298245 - nodes in this community are weakly interconnected._
- **Should `Project Docs & Deploy Config` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._