# Work section → Infinite draggable WebGL photo gallery

**Date:** 2026-06-07
**Status:** Approved (pending spec review)

## Goal

Replace the current text-list "Featured" work section with a Three.js photo
gallery in the spirit of https://photodump-xi.vercel.app/ — an infinite,
draggable grid of the images in `public/work`, with momentum and a subtle
velocity-driven distortion. Clicking an image zooms it to the center.

## Decisions (locked)

- **Layout/interaction:** Infinite draggable grid (photodump-style), drag in any
  direction, toroidal wrap, inertia/momentum.
- **Distortion:** Subtle — slight velocity-based chromatic shift + tiny zoom in
  the shader, fading to none at rest.
- **Click:** Zoom the clicked image to center (lightbox-like); click again / ESC
  / click outside returns.
- **Heading:** None. Full-bleed gallery fills the whole section.
- **Library:** Raw `three.js` (no react-three-fiber), encapsulated in one
  component.

## Architecture

### Files

- **`components/work-gallery.tsx`** (new, `"use client"`): owns the entire
  three.js lifecycle — renderer, scene, orthographic camera, textured planes,
  pointer interaction, animation loop, cleanup.
- **`components/sections/work-section.tsx`** (rewrite): thin wrapper. Keeps the
  `section` shell (`h-screen w-screen shrink-0 snap-start`) and renders
  `<WorkGallery />` full-bleed. No heading, no `useReveal` text animation.
- **Image list:** the 15 filenames hardcoded as an array in `work-gallery.tsx`
  (client can't read the filesystem), each prefixed with `/work/`:
  ```
  02A27A37-218E-41F9-90E9-3091D0BA03BD_1_105_c.jpeg
  10C3464F-3AEA-4E61-8BDA-F236F04AF2CB_4_5005_c.jpeg
  3CEA9171-0F95-4ACE-9495-B17F379AF623_1_105_c.jpeg
  4BA72202-BC4A-4175-8C9B-008661B685C3_4_5005_c.jpeg
  4C4FCC9E-DF56-445D-8E03-8FC866D1F5A0_1_105_c.jpeg
  4FAB8005-F384-4509-A992-4E6909F9C94A_1_105_c.jpeg
  5424F796-8668-4A82-B957-96B0B8DF0F0F_1_105_c.jpeg
  545EAAFD-4153-4F90-896F-45CA1B0B7D82_4_5005_c.jpeg
  60285EEB-9BE7-4056-9BF6-BCD5E50DC22D_1_105_c.jpeg
  9090FC00-0066-471F-BBA1-84D7E682FF77_1_105_c.jpeg
  979FA9F7-D998-4879-8D6B-719FF47790CE_4_5005_c.jpeg
  A8A460B5-06D5-4295-8285-B7C09C602AD0_4_5005_c.jpeg
  BEB6C52E-14FE-4F7A-BFCD-C7093F815A85_1_102_o.jpeg
  DF4A2B4F-D70C-4816-8D87-6796EE0667E5_4_5005_c.jpeg
  F1CBD72E-3FDF-425C-B3FF-15D80E2F9C63_1_105_c.jpeg
  ```

### Scene

- **Renderer:** `WebGLRenderer({ antialias: true, alpha: true })`, sized to the
  section element, `setPixelRatio(Math.min(devicePixelRatio, 2))`. Transparent
  clear so the page background/shader shows through gaps (or use a solid dark
  clear — final call during impl, default transparent).
- **Camera:** `OrthographicCamera` mapped to pixel space (units = CSS pixels)
  for simple layout math, recomputed on resize.
- **Tiles:** a base grid of cells. Cell size = fixed `CELL_W × CELL_H` (with a
  gap). Grid dimensions chosen so cells cover the viewport + a one-cell buffer
  ring on every side. Each cell is a `Mesh(PlaneGeometry, ShaderMaterial)`.
  Textures cycle through the 15 images by index (`images[i % images.length]`),
  offset per row so neighbours differ.

### Infinite wrap (toroidal)

- Track a 2D `offset` (current) and `target`/`velocity`.
- Total grid span `GW = cols*cellPitchX`, `GH = rows*cellPitchY`.
- Each frame, each tile's screen position = wrap(`baseX + offset.x`, GW),
  wrap(`baseY + offset.y`, GH), where `wrap(v, S)` maps into `[-S/2, S/2)` via
  modulo. A tile leaving one edge reappears on the opposite edge.

### Interaction

- **Drag:** `pointerdown` records start; `pointermove` (while down) adds delta to
  `target` and records instantaneous velocity; `pointerup` releases. Use
  `setPointerCapture`.
- **Momentum:** on release, `offset` continues via decaying `velocity`
  (`velocity *= FRICTION` per frame, ~0.92). While dragging, `offset` eases to
  `target` (lerp ~0.12).
- **Distortion:** shared `ShaderMaterial` uniform `uVelocity` (smoothed drag
  speed). Fragment applies a small per-channel UV offset (chromatic aberration)
  and a tiny center zoom proportional to `uVelocity`; → 0 when idle. Cover-fit
  UV (`uCoverScale`/`uCoverOffset` per texture aspect) so mixed
  portrait/landscape images crop instead of stretch.
- **Click vs drag:** if total pointer travel between down/up `< 6px`, treat as a
  click. Raycast (or compute from pointer pixel → tile) to find the tile; enter
  **focus mode**.
- **Focus mode (zoom-to-center):** animate the chosen tile to screen center and
  scale up to a target size (contain-fit within viewport with margin); fade the
  rest to a dim opacity; drag disabled. Exit on click anywhere / ESC → reverse
  animation, restore drag. Implemented by lerping a `focus` factor (0→1) that
  blends the tile's position/scale and the global dim.

### Coexistence with the page's section scrolling

- The parent (`app/page.tsx`) drives section navigation from **wheel** and
  **touch** events on the scroll container; it does **not** use pointer events.
  - **Desktop:** pointer-drag pans the gallery; wheel keeps bubbling so the user
    can still scroll to the next section. No conflict.
  - **Touch:** add `touchstart`/`touchmove` listeners on the gallery canvas that
    call `stopPropagation()` (and `preventDefault` on move) so a drag inside the
    gallery doesn't trigger the parent's swipe-to-section. Trade-off: vertical
    swipe inside this section won't change sections — nav links / wheel do.

### Lifecycle & performance

- Load all 15 textures via `TextureLoader` (or `Promise`-wrapped). Set
  `colorSpace = SRGBColorSpace`, reasonable `anisotropy`. Build the grid once
  loaded; fade the canvas in (`opacity` transition) when ready.
- **Visibility gating:** `IntersectionObserver` on the section. Run the rAF loop
  only while the section is visible; pause when off-screen to spare the GPU
  (the background shader already runs continuously).
- **Resize:** `ResizeObserver` (or window resize) → update renderer size,
  camera, and recompute grid dimensions/positions.
- **Cleanup on unmount:** cancel rAF, disconnect observers, remove listeners,
  `dispose()` geometries / materials / textures, `renderer.dispose()`, remove
  the canvas.

## Out of scope (YAGNI)

- No captions, titles, metadata, or per-image links.
- No filtering/sorting, no dynamic image loading from a manifest.
- No mobile-specific alternative layout beyond the touch handling above.
- No keyboard navigation beyond ESC to exit focus mode.

## Risks / notes

- `next.config.mjs` has `images.unoptimized: true`; raw `/work/*.jpeg` paths are
  served as static assets, so no `next/image` involvement — fine.
- Build ignores TS/lint errors; we still run `npm run lint` and type-check
  manually (per CLAUDE.md).
- Many large textures (one ~463 KB) → consider total VRAM; 15 is fine. If needed,
  cap texture max dimension.
- `.superpowers/` brainstorm artifacts are local-only (project is not a git repo,
  so nothing to gitignore/commit yet).
