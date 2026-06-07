# Work Gallery (Infinite Draggable WebGL Photo Grid) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the text-list "Featured" work section with a full-bleed Three.js gallery: an infinite, draggable grid of the `public/work` photos, with momentum, subtle velocity-driven distortion, and click-to-center zoom.

**Architecture:** One self-contained client component (`components/work-gallery.tsx`) owns the entire raw-`three.js` lifecycle (renderer, orthographic pixel-space camera, a buffered grid of textured `ShaderMaterial` planes wrapped toroidally for infinity, pointer-drag + inertia, a focus/zoom mode, visibility gating, and full disposal). `components/sections/work-section.tsx` becomes a thin full-bleed wrapper.

**Tech Stack:** Next.js 15 / React 19 / TypeScript, `three` (raw, no react-three-fiber), Tailwind v4.

---

## Conventions for this plan

- **No test framework exists** in this project (see CLAUDE.md) and the deliverable is an interactive WebGL canvas, so verification per task is: **(a)** `npx tsc --noEmit` passes, **(b)** `npm run lint` passes, **(c)** a stated manual visual check in the browser via `npm run dev` (gallery is section #2 — scroll/drag right one section, or click "Work" in the nav).
- **The project is not a git repository.** Where a normal plan would `git commit`, instead pause at a **Checkpoint** for review. (If you want commits, run `git init` first; otherwise skip.)
- Reminder from CLAUDE.md: `next.config.mjs` ignores TS/lint errors during `next build`, so rely on `tsc --noEmit` and `npm run lint`, not the build, to catch them.

---

## File Structure

- **Create** `components/work-gallery.tsx` — the entire gallery (the bulk of the work).
- **Rewrite** `components/sections/work-section.tsx` — thin wrapper rendering `<WorkGallery />`.
- **Modify** `package.json` — add `three` + `@types/three` (via npm).

---

### Task 1: Install three.js

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install runtime + types**

Run:
```bash
npm install three && npm install -D @types/three
```

- [ ] **Step 2: Verify install**

Run:
```bash
node -e "console.log(require('three/package.json').version)"
```
Expected: a version string prints (e.g. `0.18x.0`), no error.

- [ ] **Step 3: Checkpoint** — confirm `three` and `@types/three` now appear in `package.json` dependencies/devDependencies.

---

### Task 2: Thin section wrapper

**Files:**
- Modify (full rewrite): `components/sections/work-section.tsx`

- [ ] **Step 1: Replace the file contents entirely**

```tsx
"use client";

import { WorkGallery } from "@/components/work-gallery";

export function WorkSection() {
  return (
    <section className="relative flex h-screen w-screen shrink-0 snap-start items-center justify-center overflow-hidden">
      <WorkGallery />
    </section>
  );
}
```

- [ ] **Step 2: Expect a temporary type error**

Run: `npx tsc --noEmit`
Expected: FAIL — `Cannot find module '@/components/work-gallery'`. This is resolved in Task 3. Do not fix it here.

- [ ] **Step 3: Checkpoint** — `work-section.tsx` no longer contains the old `ProjectCard`/array code.

---

### Task 3: The gallery component (core)

**Files:**
- Create: `components/work-gallery.tsx`

This task creates the complete component. Build it in the sub-steps below; the final file content is given in full at Step 9.

- [ ] **Step 1: Image list + constants + shaders**

The 15 filenames are real (verified in `public/work`). Cover-fit avoids distorting mixed portrait/landscape photos.

```tsx
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const IMAGES = [
  "02A27A37-218E-41F9-90E9-3091D0BA03BD_1_105_c.jpeg",
  "10C3464F-3AEA-4E61-8BDA-F236F04AF2CB_4_5005_c.jpeg",
  "3CEA9171-0F95-4ACE-9495-B17F379AF623_1_105_c.jpeg",
  "4BA72202-BC4A-4175-8C9B-008661B685C3_4_5005_c.jpeg",
  "4C4FCC9E-DF56-445D-8E03-8FC866D1F5A0_1_105_c.jpeg",
  "4FAB8005-F384-4509-A992-4E6909F9C94A_1_105_c.jpeg",
  "5424F796-8668-4A82-B957-96B0B8DF0F0F_1_105_c.jpeg",
  "545EAAFD-4153-4F90-896F-45CA1B0B7D82_4_5005_c.jpeg",
  "60285EEB-9BE7-4056-9BF6-BCD5E50DC22D_1_105_c.jpeg",
  "9090FC00-0066-471F-BBA1-84D7E682FF77_1_105_c.jpeg",
  "979FA9F7-D998-4879-8D6B-719FF47790CE_4_5005_c.jpeg",
  "A8A460B5-06D5-4295-8285-B7C09C602AD0_4_5005_c.jpeg",
  "BEB6C52E-14FE-4F7A-BFCD-C7093F815A85_1_102_o.jpeg",
  "DF4A2B4F-D70C-4816-8D87-6796EE0667E5_4_5005_c.jpeg",
  "F1CBD72E-3FDF-425C-B3FF-15D80E2F9C63_1_105_c.jpeg",
].map((f) => `/work/${f}`);

const CELL_W = 320;
const CELL_H = 220;
const GAP = 28;
const FRICTION = 0.92;
```

- [ ] **Step 2: Shader strings (subtle distortion: cover-fit + speed zoom + chromatic shift + dim)** — included in the full file (Step 9).

- [ ] **Step 3: Grid build with toroidal layout** — `buildGrid()` creates `cols×rows` meshes (viewport + 2-cell buffer), cycling the 15 textures; included in full file.

- [ ] **Step 4: Animation loop** — momentum when idle, smoothed speed → `uVelocity`, toroidal `wrap()` per tile, focus lerp; included in full file.

- [ ] **Step 5: Pointer drag + click/drag discrimination + focus mode** — included in full file.

- [ ] **Step 6: Resize (ResizeObserver) + visibility gating (IntersectionObserver)** — included in full file.

- [ ] **Step 7: Texture loading + fade-in** — included in full file.

- [ ] **Step 8: Full cleanup on unmount** — included in full file.

- [ ] **Step 9: Write the complete file**

```tsx
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const IMAGES = [
  "02A27A37-218E-41F9-90E9-3091D0BA03BD_1_105_c.jpeg",
  "10C3464F-3AEA-4E61-8BDA-F236F04AF2CB_4_5005_c.jpeg",
  "3CEA9171-0F95-4ACE-9495-B17F379AF623_1_105_c.jpeg",
  "4BA72202-BC4A-4175-8C9B-008661B685C3_4_5005_c.jpeg",
  "4C4FCC9E-DF56-445D-8E03-8FC866D1F5A0_1_105_c.jpeg",
  "4FAB8005-F384-4509-A992-4E6909F9C94A_1_105_c.jpeg",
  "5424F796-8668-4A82-B957-96B0B8DF0F0F_1_105_c.jpeg",
  "545EAAFD-4153-4F90-896F-45CA1B0B7D82_4_5005_c.jpeg",
  "60285EEB-9BE7-4056-9BF6-BCD5E50DC22D_1_105_c.jpeg",
  "9090FC00-0066-471F-BBA1-84D7E682FF77_1_105_c.jpeg",
  "979FA9F7-D998-4879-8D6B-719FF47790CE_4_5005_c.jpeg",
  "A8A460B5-06D5-4295-8285-B7C09C602AD0_4_5005_c.jpeg",
  "BEB6C52E-14FE-4F7A-BFCD-C7093F815A85_1_102_o.jpeg",
  "DF4A2B4F-D70C-4816-8D87-6796EE0667E5_4_5005_c.jpeg",
  "F1CBD72E-3FDF-425C-B3FF-15D80E2F9C63_1_105_c.jpeg",
].map((f) => `/work/${f}`);

const CELL_W = 320;
const CELL_H = 220;
const GAP = 28;
const FRICTION = 0.92;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  uniform sampler2D uTex;
  uniform vec2 uCover;
  uniform float uVelocity;
  uniform vec2 uVelDir;
  uniform float uDim;
  varying vec2 vUv;

  void main() {
    vec2 uv = (vUv - 0.5) * uCover + 0.5;
    uv = (uv - 0.5) * (1.0 - uVelocity * 0.06) + 0.5;
    float amt = uVelocity * 0.018;
    float r = texture2D(uTex, uv + uVelDir * amt).r;
    float g = texture2D(uTex, uv).g;
    float b = texture2D(uTex, uv - uVelDir * amt).b;
    vec3 col = vec3(r, g, b);
    col *= (1.0 - uDim * 0.7);
    gl_FragColor = vec4(col, 1.0);
  }
`;

type Tile = { mesh: THREE.Mesh; baseX: number; baseY: number };

export function WorkGallery() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;
    let disposed = false;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    const el = renderer.domElement;
    el.style.display = "block";
    el.style.cursor = "grab";
    el.style.opacity = "0";
    container.appendChild(el);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      -width / 2, width / 2, height / 2, -height / 2, 0.1, 100,
    );
    camera.position.z = 10;

    const geometry = new THREE.PlaneGeometry(1, 1);
    const loader = new THREE.TextureLoader();
    const textures: THREE.Texture[] = [];

    let tiles: Tile[] = [];
    let cols = 0;
    let rows = 0;
    let pitchX = CELL_W + GAP;
    let pitchY = CELL_H + GAP;
    let GW = 0;
    let GH = 0;

    const offset = { x: 0, y: 0 };
    const velocity = { x: 0, y: 0 };
    let speed = 0;
    const velDir = { x: 1, y: 0 };

    let focused: Tile | null = null;
    let animTile: Tile | null = null;
    let focusT = 0;
    let focusScale = 1;

    const pointer = { dragging: false, lastX: 0, lastY: 0, moved: 0 };
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    let raf = 0;
    let running = false;

    function wrap(v: number, s: number) {
      return (((v + s / 2) % s) + s) % s - s / 2;
    }

    function coverFor(tex: THREE.Texture): THREE.Vector2 {
      const img = tex.image as { width: number; height: number } | undefined;
      if (!img || !img.width || !img.height) return new THREE.Vector2(1, 1);
      const texAspect = img.width / img.height;
      const planeAspect = CELL_W / CELL_H;
      return texAspect > planeAspect
        ? new THREE.Vector2(planeAspect / texAspect, 1)
        : new THREE.Vector2(1, texAspect / planeAspect);
    }

    function buildGrid() {
      for (const t of tiles) {
        scene.remove(t.mesh);
        (t.mesh.material as THREE.Material).dispose();
      }
      tiles = [];
      if (textures.length === 0) return;

      pitchX = CELL_W + GAP;
      pitchY = CELL_H + GAP;
      cols = Math.ceil(width / pitchX) + 2;
      rows = Math.ceil(height / pitchY) + 2;
      GW = cols * pitchX;
      GH = rows * pitchY;

      let i = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const tex = textures[i % textures.length];
          const material = new THREE.ShaderMaterial({
            uniforms: {
              uTex: { value: tex },
              uCover: { value: coverFor(tex) },
              uVelocity: { value: 0 },
              uVelDir: { value: new THREE.Vector2(1, 0) },
              uDim: { value: 0 },
            },
            vertexShader,
            fragmentShader,
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.scale.set(CELL_W, CELL_H, 1);
          const baseX = (c - (cols - 1) / 2) * pitchX;
          const baseY = (r - (rows - 1) / 2) * pitchY;
          mesh.position.set(baseX, baseY, 0);
          scene.add(mesh);
          tiles.push({ mesh, baseX, baseY });
          i++;
        }
      }
    }

    function animate() {
      if (!running) return;
      raf = requestAnimationFrame(animate);

      if (!pointer.dragging && !focused) {
        offset.x += velocity.x;
        offset.y += velocity.y;
        velocity.x *= FRICTION;
        velocity.y *= FRICTION;
        if (Math.abs(velocity.x) < 0.01) velocity.x = 0;
        if (Math.abs(velocity.y) < 0.01) velocity.y = 0;
      }

      const v = Math.hypot(velocity.x, velocity.y);
      const targetSpeed = Math.min(v / 60, 1);
      speed += (targetSpeed - speed) * 0.15;
      if (v > 0.001) {
        velDir.x = velocity.x / v;
        velDir.y = velocity.y / v;
      }

      const ft = focused ? 1 : 0;
      focusT += (ft - focusT) * 0.12;
      if (focused) animTile = focused;
      else if (focusT < 0.01) animTile = null;

      if (animTile) {
        const targetH = height * 0.8;
        focusScale = targetH / CELL_H;
      }

      for (const t of tiles) {
        const x = wrap(t.baseX + offset.x, GW);
        const y = wrap(t.baseY + offset.y, GH);
        const mat = t.mesh.material as THREE.ShaderMaterial;
        mat.uniforms.uVelDir.value.set(velDir.x, velDir.y);

        if (animTile === t) {
          t.mesh.position.x = x * (1 - focusT);
          t.mesh.position.y = y * (1 - focusT);
          t.mesh.position.z = focusT;
          const s = 1 + (focusScale - 1) * focusT;
          t.mesh.scale.set(CELL_W * s, CELL_H * s, 1);
          mat.uniforms.uVelocity.value = 0;
          mat.uniforms.uDim.value = 0;
        } else {
          t.mesh.position.set(x, y, 0);
          t.mesh.scale.set(CELL_W, CELL_H, 1);
          mat.uniforms.uVelocity.value = speed;
          mat.uniforms.uDim.value = focusT;
        }
      }

      renderer.render(scene, camera);
    }

    function start() {
      if (running || disposed) return;
      running = true;
      raf = requestAnimationFrame(animate);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    function onPointerDown(e: PointerEvent) {
      el.setPointerCapture(e.pointerId);
      pointer.dragging = !focused;
      pointer.lastX = e.clientX;
      pointer.lastY = e.clientY;
      pointer.moved = 0;
      velocity.x = 0;
      velocity.y = 0;
      el.style.cursor = "grabbing";
    }

    function onPointerMove(e: PointerEvent) {
      if (!pointer.dragging) return;
      const dx = e.clientX - pointer.lastX;
      const dy = e.clientY - pointer.lastY;
      pointer.lastX = e.clientX;
      pointer.lastY = e.clientY;
      pointer.moved += Math.hypot(dx, dy);
      offset.x += dx;
      offset.y -= dy;
      velocity.x = dx;
      velocity.y = -dy;
    }

    function onPointerUp(e: PointerEvent) {
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      el.style.cursor = "grab";
      pointer.dragging = false;

      if (pointer.moved < 6) {
        if (focused) {
          focused = null;
        } else {
          const rect = el.getBoundingClientRect();
          ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(ndc, camera);
          const hits = raycaster.intersectObjects(tiles.map((t) => t.mesh));
          if (hits.length > 0) {
            focused = tiles.find((t) => t.mesh === hits[0].object) || null;
            velocity.x = 0;
            velocity.y = 0;
          }
        }
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && focused) focused = null;
    }

    function stopTouchStart(e: TouchEvent) {
      e.stopPropagation();
    }
    function stopTouchMove(e: TouchEvent) {
      e.stopPropagation();
      if (pointer.dragging) e.preventDefault();
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("touchstart", stopTouchStart, { passive: true });
    el.addEventListener("touchmove", stopTouchMove, { passive: false });
    window.addEventListener("keydown", onKeyDown);

    function resize() {
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      renderer.setSize(width, height);
      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.updateProjectionMatrix();
      buildGrid();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
        else stop();
      },
      { threshold: 0.05 },
    );
    io.observe(container);

    Promise.all(
      IMAGES.map(
        (src) =>
          new Promise<THREE.Texture>((resolve) => {
            loader.load(
              src,
              (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
                tex.minFilter = THREE.LinearMipmapLinearFilter;
                tex.generateMipmaps = true;
                resolve(tex);
              },
              undefined,
              () => resolve(new THREE.Texture()),
            );
          }),
      ),
    ).then((loaded) => {
      if (disposed) {
        loaded.forEach((t) => t.dispose());
        return;
      }
      textures.push(...loaded);
      buildGrid();
      el.style.transition = "opacity 0.7s ease";
      el.style.opacity = "1";
      start();
    });

    return () => {
      disposed = true;
      stop();
      io.disconnect();
      ro.disconnect();
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("touchstart", stopTouchStart);
      el.removeEventListener("touchmove", stopTouchMove);
      window.removeEventListener("keydown", onKeyDown);
      for (const t of tiles) {
        scene.remove(t.mesh);
        (t.mesh.material as THREE.Material).dispose();
      }
      geometry.dispose();
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 z-10" />;
}
```

- [ ] **Step 10: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS (no errors). The Task 2 module-not-found error is now gone.

- [ ] **Step 11: Lint**

Run: `npm run lint`
Expected: PASS (no errors).

- [ ] **Step 12: Checkpoint** — both commands clean.

---

### Task 4: Manual verification in the browser

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Open: http://localhost:3000

- [ ] **Step 2: Navigate to the Work section**

Click "Work" in the top nav (or scroll right one section).
Expected: a grid of the `public/work` photos fades in, cover-cropped (no stretching), filling the section.

- [ ] **Step 3: Drag**

Press and drag in any direction.
Expected: the grid pans freely in all directions; releasing keeps gliding (momentum) and slows to a stop; the grid is infinite (tiles wrap, never an empty edge); a faint chromatic/zoom shimmer shows while moving fast and disappears at rest.

- [ ] **Step 4: Click to focus**

Click (without dragging) on one photo.
Expected: it animates to the center and scales up; the rest dim. Click anywhere (or press ESC) → it animates back into the grid and the rest un-dim.

- [ ] **Step 5: Section coexistence**

Use the mouse wheel over the gallery.
Expected: the page still scrolls horizontally to adjacent sections (wheel is not hijacked). On a touch device / trackpad emulation, dragging pans the gallery without jumping to another section.

- [ ] **Step 6: Resize**

Resize the browser window.
Expected: the grid re-fills the new size with no permanent empty gaps.

- [ ] **Step 7: Checkpoint** — note any visual tuning desired (cell size `CELL_W`/`CELL_H`, `GAP`, distortion strength constants `0.06`/`0.018`, focus size `height * 0.8`, `FRICTION`) and adjust before final sign-off.

---

## Self-Review (completed during planning)

**Spec coverage:**
- Infinite draggable grid + toroidal wrap → Task 3 `wrap()` + `buildGrid()` buffer. ✓
- Momentum/inertia → Task 3 `FRICTION` block. ✓
- Subtle distortion (chromatic + zoom, fades at rest) → Task 3 `fragmentShader` + smoothed `speed`. ✓
- Cover-fit for mixed aspects → `coverFor()` + `uCover`. ✓
- Click-to-center focus, ESC/click exit, dim others → `focused`/`animTile`/`focusT` + `onPointerUp`/`onKeyDown`. ✓
- Click vs drag (`<6px`) → `pointer.moved`. ✓
- No heading, full-bleed → Task 2 wrapper + `absolute inset-0`. ✓
- Scroll coexistence (pointer drag; touch stopPropagation; wheel untouched) → Task 3 touch listeners. ✓
- Visibility gating, resize, full disposal → IntersectionObserver / ResizeObserver / cleanup. ✓
- Raw three.js, hardcoded image list, `three`+`@types/three` → Task 1 + Task 3. ✓

**Placeholder scan:** none — all code is concrete.

**Type/name consistency:** `Tile`, `buildGrid`, `wrap`, `coverFor`, `focused`/`animTile`/`focusT`, `pointer.moved`, uniform names (`uTex`/`uCover`/`uVelocity`/`uVelDir`/`uDim`) are used consistently across the file and shaders.

**Known minor approximations (acceptable):** drag uses direct offset + decaying velocity rather than a separate lerp-to-target (responsive and simpler); clicking a different tile while focused exits focus rather than switching directly.
