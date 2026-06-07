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
const GAP = 90;
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
  uniform float uFocus;
  uniform vec2 uFocusDir;
  uniform float uVelocity;
  uniform vec2 uVelDir;
  uniform float uDim;
  varying vec2 vUv;

  const int SAMPLES = 7;

  void main() {
    vec2 base = (vUv - 0.5) * uCover + 0.5;

    // Distance-from-center drives a radial motion-blur + chromatic smear.
    // Center tiles (uFocus ~ 0) stay sharp; further tiles blur more.
    float blur = uFocus * 0.22 + uVelocity * 0.04;
    float chroma = uFocus * 0.025 + uVelocity * 0.015;
    vec2 dir = uFocusDir;

    vec3 col = vec3(0.0);
    for (int i = 0; i < SAMPLES; i++) {
      float f = float(i) / float(SAMPLES - 1) - 0.5;
      vec2 o = dir * f * blur;
      col.r += texture2D(uTex, base + o + dir * chroma).r;
      col.g += texture2D(uTex, base + o).g;
      col.b += texture2D(uTex, base + o - dir * chroma).b;
    }
    col /= float(SAMPLES);
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
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0.1,
      100,
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
    let zoomT = 0;

    const pointer = { dragging: false, lastX: 0, lastY: 0, moved: 0 };
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    let raf = 0;
    let running = false;

    function wrap(v: number, s: number) {
      return ((((v + s / 2) % s) + s) % s) - s / 2;
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
      // Force odd counts so one tile sits exactly at the center (0,0). On first
      // load (offset 0) that tile is in the sharp zone, making it obvious that
      // not every image is blurred.
      if (cols % 2 === 0) cols += 1;
      if (rows % 2 === 0) rows += 1;
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
              uFocus: { value: 0 },
              uFocusDir: { value: new THREE.Vector2(1, 0) },
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

      const zt = focused ? 1 : 0;
      zoomT += (zt - zoomT) * 0.08;
      if (focused) animTile = focused;
      else if (zoomT < 0.001) animTile = null;

      // "Fly into" the focused tile: pan the camera onto it and zoom in, so the
      // whole view rushes through the grid into that photo.
      let cx = 0;
      let cy = 0;
      if (animTile) {
        const e = zoomT * zoomT * (3 - 2 * zoomT);
        const tx = wrap(animTile.baseX + offset.x, GW);
        const ty = wrap(animTile.baseY + offset.y, GH);
        cx = tx * e;
        cy = ty * e;
        const targetZoom = Math.min(width / CELL_W, height / CELL_H) * 0.8;
        camera.zoom = 1 + (targetZoom - 1) * e;
      } else {
        camera.zoom = 1;
      }
      camera.position.x = cx;
      camera.position.y = cy;
      camera.updateProjectionMatrix();

      // Radial focus falloff measured from the current screen center (camera).
      const sharpR = Math.min(width, height) * 0.2;
      const blurR = Math.min(width, height) * 0.55;
      const denom = Math.max(blurR - sharpR, 1);

      for (const t of tiles) {
        const x = wrap(t.baseX + offset.x, GW);
        const y = wrap(t.baseY + offset.y, GH);
        const mat = t.mesh.material as THREE.ShaderMaterial;
        mat.uniforms.uVelDir.value.set(velDir.x, velDir.y);
        mat.uniforms.uVelocity.value = speed;
        mat.uniforms.uDim.value = 0;
        t.mesh.position.set(x, y, 0);
        t.mesh.scale.set(CELL_W, CELL_H, 1);

        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.hypot(dx, dy);
        let focus = (dist - sharpR) / denom;
        focus = focus < 0 ? 0 : focus > 1 ? 1 : focus;
        mat.uniforms.uFocus.value = focus;
        if (dist > 0.001) {
          mat.uniforms.uFocusDir.value.set(dx / dist, dy / dist);
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

    const resize = () => {
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      renderer.setSize(width, height);
      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.updateProjectionMatrix();
      buildGrid();
    };
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

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-10"
      style={{
        WebkitMaskImage:
          "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)",
        maskImage:
          "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)",
      }}
    />
  );
}
