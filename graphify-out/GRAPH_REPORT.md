# Graph Report - .  (2026-07-27)

## Corpus Check
- 2 files · ~21,849 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 174 nodes · 231 edges · 21 communities (13 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Dashboard, Services & API Layer
- Dev Dependencies
- App Shell & Chrome Components
- Project Docs & Deploy Config
- Rutas Seguimiento & Location Timeline
- Maniobras, Rutas Personalizadas & Route Events
- Clientes, Transportistas & Toast
- Package Dependencies
- Caveman Skill Docs
- Icon Sprite Assets
- Oxlint Config
- Layout Sidebar & Steering Icon
- App Header
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
7. `scripts` - 5 edges
8. `isCancelado()` - 5 edges
9. `buildEvents()` - 5 edges
10. `Clientes()` - 5 edges

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

## Communities (21 total, 8 thin omitted)

### Community 0 - "Dashboard, Services & API Layer"
Cohesion: 0.17
Nodes (14): buildColumns(), ManeuversTable(), statusColor(), StatCard(), Dashboard(), isCancelled(), MEXICO_CENTER, parseCoords() (+6 more)

### Community 1 - "Dev Dependencies"
Cohesion: 0.11
Nodes (18): devDependencies, oxlint, playwright, @types/react, @types/react-dom, vite, @vitejs/plugin-react, engines (+10 more)

### Community 2 - "App Shell & Chrome Components"
Cohesion: 0.16
Nodes (10): App(), queryClient, GlobalLoader(), AppLayout(), GLASS, menuItems, ServerStatus(), TILLogo() (+2 more)

### Community 3 - "Project Docs & Deploy Config"
Cohesion: 0.13
Nodes (16): src/main.jsx Entry Script, TIL App Entry HTML, truck_favicon.png, Backend API Configuration, maylob_backend Service, Local MongoDB, Oxc, React Compiler (+8 more)

### Community 4 - "Rutas Seguimiento & Location Timeline"
Cohesion: 0.22
Nodes (10): LocationStatusTimeline(), useIsDesktop(), buildPointMap(), ExpandedRow(), normalizeEvents(), parseEvents(), parseManStatus(), RutasSeguimiento() (+2 more)

### Community 5 - "Maniobras, Rutas Personalizadas & Route Events"
Cohesion: 0.24
Nodes (8): buildEvents(), EventsFieldList(), isCancelado(), normalizeSubEvents(), processRouteEvents(), glassGroupStyle, Maniobras(), RutasPersonalizadas()

### Community 6 - "Clientes, Transportistas & Toast"
Cohesion: 0.18
Nodes (7): Clientes(), computeDirty(), DIRTY_CELL, getClientId(), toEdits(), Transportistas(), toast

### Community 7 - "Package Dependencies"
Cohesion: 0.15
Nodes (13): dependencies, @ant-design/icons, antd, axios, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, leaflet (+5 more)

### Community 8 - "Caveman Skill Docs"
Cohesion: 0.24
Nodes (10): Caveman Auto-Clarity Rule, Caveman Skill, Caveman Intensity Levels, Caveman Invocation Commands, Caveman Auto-Clarity Exceptions, Caveman Boundaries Rule, Caveman Skill (LLM Instructions), Caveman Compression Rules (+2 more)

### Community 9 - "Icon Sprite Assets"
Cohesion: 0.29
Nodes (7): Bluesky social icon (butterfly logo), Discord social icon (game controller/mask logo), Documentation icon (document with chat/arrow bubbles, purple outline), GitHub icon (Octocat/cat silhouette logo), Generic social/community icon (person with star badge, purple outline), SVG Icon Sprite Sheet (icons.svg), X (Twitter) icon

### Community 10 - "Oxlint Config"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

## Knowledge Gaps
- **63 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `queryClient` (+58 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Package Dependencies` to `Dev Dependencies`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `SteeringWheelOutlined()` connect `Layout Sidebar & Steering Icon` to `Dashboard, Services & API Layer`, `App Shell & Chrome Components`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _65 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dev Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `Project Docs & Deploy Config` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._