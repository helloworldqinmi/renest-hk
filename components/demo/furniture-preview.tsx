"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RotateCcw } from "lucide-react";
import type { LayoutPlan } from "@/types";
import styles from "./furniture-preview.module.css";

type FurnitureSpec = {
  id: string;
  label: string;
  asset: string;
  size: [number, number, number];
  footprint: [number, number];
  center: [number, number];
  rotation: number;
  anchored?: boolean;
};

type MaterialState = {
  material: THREE.Material;
  baseOpacity: number;
  baseTransparent: boolean;
  baseDepthWrite: boolean;
};

type FurnitureEntry = {
  group: THREE.Group;
  materials: MaterialState[];
  opacity: number;
  spec: FurnitureSpec;
};

type SceneRuntime = {
  transitionTo: (plan: LayoutPlan) => void;
};

const room = { width: 2.85, depth: 3.9 };
const planRoom = { width: 3.9, depth: 3.1 };
const wallHeight = 1.65;
const windowLayout = { center: -0.18, width: 2.3, bottom: 0.045, top: 1.61 };
const modelPath = "/models/";
const finalCameraPosition = new THREE.Vector3(-4.65, 3.1, 5.9);
const introCameraPosition = new THREE.Vector3(-5.25, 3.42, 6.65);
const introDuration = 4500;
const transitionDuration = 1450;

function clamp01(value: number) {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function ease(value: number) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function previewFurniture(plan: LayoutPlan): FurnitureSpec[] {
  const living = (id: string) => plan.placements.find((item) => item.roomId === "living" && item.furnitureId === id);
  const fromPlan = (placement: NonNullable<ReturnType<typeof living>>, width: number, depth: number): [number, number] => {
    const rotated = placement.rotation % 180 !== 0;
    return [
      placement.position.x * room.width / planRoom.width + (rotated ? depth : width) / 2,
      placement.position.y * room.depth / planRoom.depth + (rotated ? width : depth) / 2,
    ];
  };
  const sofa = living("sofa");
  const coffee = living("coffee-table");
  const bookshelf = living("bookshelf");
  const desk = living("desk");
  const dining = living("dining-table");
  const specs: FurnitureSpec[] = [];
  if (sofa) {
    const dimensions = sofa.overrideDimensions ?? { width: 2.04, depth: 0.88, height: 0.82 };
    const sofaCenter = fromPlan(sofa, dimensions.width, dimensions.depth);
    sofaCenter[1] += 0.63;
    specs.push({ id: "sofa", label: "Sofa", asset: "sofa.glb", size: [dimensions.width, dimensions.height, dimensions.depth], footprint: [dimensions.width, dimensions.depth], center: sofaCenter, rotation: sofa.rotation + 180 });
  }
  if (coffee) specs.push({ id: "coffee", label: "Coffee table", asset: "coffee-table.glb", size: [0.86, 0.6, 0.75], footprint: [1, 0.55], center: fromPlan(coffee, 1, 0.55), rotation: coffee.rotation });
  if (bookshelf) specs.push({ id: "bookshelf", label: "Bookshelf", asset: "bookshelf.glb", size: [0.8, 1.8, 0.32], footprint: [0.8, 0.32], center: fromPlan(bookshelf, 0.8, 0.32), rotation: bookshelf.rotation, anchored: true });
  if (desk) specs.push({ id: "desk", label: "Study desk", asset: "chair.glb", size: [0.55, 0.9, 0.55], footprint: [1.2, 0.6], center: fromPlan(desk, 1.2, 0.6), rotation: desk.rotation });
  if (dining) {
    const dimensions = dining.overrideDimensions ?? { width: 1.4, depth: 0.8, height: 0.75 };
    specs.push({ id: "dining", label: "Dining setting", asset: "dining-set.glb", size: [1.2, 0.78, 1.2], footprint: [dimensions.width, dimensions.depth], center: fromPlan(dining, dimensions.width, dimensions.depth), rotation: dining.rotation });
  }
  return specs;
}

function addBox(scene: THREE.Scene, size: [number, number, number], position: [number, number, number], color: number, material?: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material ?? new THREE.MeshStandardMaterial({ color, roughness: 0.88 }));
  mesh.position.set(...position);
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function poseFor(spec: FurnitureSpec) {
  const position = new THREE.Vector3(spec.center[0] - room.width / 2, 0, spec.center[1] - room.depth / 2);
  const quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(spec.rotation));
  return { position, quaternion };
}

function quadraticPoint(start: THREE.Vector3, control: THREE.Vector3, end: THREE.Vector3, amount: number) {
  const inverse = 1 - amount;
  return new THREE.Vector3(
    inverse * inverse * start.x + 2 * inverse * amount * control.x + amount * amount * end.x,
    0,
    inverse * inverse * start.z + 2 * inverse * amount * control.z + amount * amount * end.z,
  );
}

function setEntryOpacity(entry: FurnitureEntry, opacity: number) {
  entry.opacity = clamp01(opacity);
  entry.materials.forEach(({ material, baseOpacity, baseTransparent, baseDepthWrite }) => {
    material.opacity = baseOpacity * entry.opacity;
    material.transparent = baseTransparent || entry.opacity < 0.999;
    material.depthWrite = baseDepthWrite && entry.opacity > 0.12;
    material.needsUpdate = true;
  });
}

export function FurniturePreview({ plan }: { plan: LayoutPlan }) {
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<SceneRuntime | null>(null);
  const planRef = useRef(plan);
  const [replay, setReplay] = useState(0);
  const [status, setStatus] = useState("Reading measured positions…");
  const [complete, setComplete] = useState(false);

  planRef.current = plan;

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let disposed = false;
    let frame = 0;
    let animationToken = 0;
    let animationStep: ((now: number) => void) | null = null;
    let activePlan = planRef.current;
    let introStatusPhase = -1;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe9edf0);
    scene.fog = new THREE.Fog(0xe9edf0, 9, 18);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 35);
    camera.position.copy(finalCameraPosition);
    camera.lookAt(0, 0.65, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.52;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);

    const hemisphere = new THREE.HemisphereLight(0xfaf4e9, 0xadb9bc, 2.2);
    scene.add(hemisphere);
    const sun = new THREE.DirectionalLight(0xfff5e6, 3.1);
    sun.position.set(-1.8, 5.5, 3.7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -5;
    sun.shadow.camera.right = 5;
    sun.shadow.camera.top = 5;
    sun.shadow.camera.bottom = -5;
    sun.shadow.normalBias = 0.035;
    scene.add(sun);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(room.width, room.depth), new THREE.MeshStandardMaterial({ color: 0xd8cec0, roughness: 0.93 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.025;
    floor.receiveShadow = true;
    scene.add(floor);
    const wall = new THREE.MeshStandardMaterial({ color: 0xf6f3ec, roughness: 0.94, side: THREE.DoubleSide });
    const leftWallWidth = windowLayout.center - windowLayout.width / 2 + room.width / 2;
    const rightWallWidth = room.width / 2 - (windowLayout.center + windowLayout.width / 2);
    const windowHeight = windowLayout.top - windowLayout.bottom;
    const windowCenterY = windowLayout.bottom + windowHeight / 2;
    const topWallHeight = wallHeight - windowLayout.top;
    addBox(scene, [leftWallWidth, wallHeight, 0.09], [-room.width / 2 + leftWallWidth / 2, wallHeight / 2, -room.depth / 2], 0, wall);
    addBox(scene, [rightWallWidth, wallHeight, 0.09], [room.width / 2 - rightWallWidth / 2, wallHeight / 2, -room.depth / 2], 0, wall);
    addBox(scene, [windowLayout.width, windowLayout.bottom, 0.09], [windowLayout.center, windowLayout.bottom / 2, -room.depth / 2], 0, wall);
    addBox(scene, [windowLayout.width, topWallHeight, 0.09], [windowLayout.center, windowLayout.top + topWallHeight / 2, -room.depth / 2], 0, wall);
    addBox(scene, [0.09, wallHeight, room.depth + 0.1], [room.width / 2, wallHeight / 2, 0], 0, wall);

    const viewCanvas = document.createElement("canvas");
    viewCanvas.width = 512;
    viewCanvas.height = 320;
    const viewContext = viewCanvas.getContext("2d");
    if (viewContext) {
      const sky = viewContext.createLinearGradient(0, 0, 0, 320);
      sky.addColorStop(0, "#b9d4e7");
      sky.addColorStop(0.65, "#e2e8e5");
      sky.addColorStop(1, "#b1c2bc");
      viewContext.fillStyle = sky;
      viewContext.fillRect(0, 0, 512, 320);
      viewContext.fillStyle = "rgba(106,126,133,.34)";
      for (let index = 0; index < 18; index++) {
        const x = index * 31 - 8;
        const height = 65 + (index * 43) % 78;
        viewContext.fillRect(x, 320 - height, 24 + index % 3 * 5, height);
      }
    }
    const viewTexture = new THREE.CanvasTexture(viewCanvas);
    viewTexture.colorSpace = THREE.SRGBColorSpace;
    const outdoor = new THREE.Mesh(new THREE.PlaneGeometry(windowLayout.width - 0.06, windowHeight - 0.06), new THREE.MeshBasicMaterial({ map: viewTexture, side: THREE.DoubleSide }));
    outdoor.position.set(windowLayout.center, windowCenterY, -room.depth / 2 - 0.015);
    scene.add(outdoor);
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x333f40, metalness: 0.38, roughness: 0.52 });
    addBox(scene, [windowLayout.width + 0.06, 0.045, 0.07], [windowLayout.center, windowLayout.top, -room.depth / 2 + 0.035], 0, frameMaterial);
    addBox(scene, [windowLayout.width + 0.06, 0.045, 0.07], [windowLayout.center, windowLayout.bottom, -room.depth / 2 + 0.035], 0, frameMaterial);
    for (const offset of [-windowLayout.width / 2, -windowLayout.width / 6, windowLayout.width / 6, windowLayout.width / 2]) {
      addBox(scene, [0.045, windowHeight, 0.07], [windowLayout.center + offset, windowCenterY, -room.depth / 2 + 0.035], 0, frameMaterial);
    }
    const trim = new THREE.MeshStandardMaterial({ color: 0xb5a997, roughness: 0.77 });
    addBox(scene, [room.width, 0.045, 0.055], [0, 0.07, -room.depth / 2 + 0.07], 0, trim);
    addBox(scene, [0.055, 0.045, room.depth], [room.width / 2 - 0.07, 0.07, 0], 0, trim);
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 1.35), new THREE.MeshStandardMaterial({ color: 0xeae5da, roughness: 1 }));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(-0.55, 0.002, 0.12);
    rug.receiveShadow = true;
    scene.add(rug);

    const sweepMaterial = new THREE.MeshBasicMaterial({ color: 0xffedc9, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const lightSweep = new THREE.Mesh(new THREE.PlaneGeometry(room.width * 1.05, 0.72), sweepMaterial);
    lightSweep.rotation.x = -Math.PI / 2;
    lightSweep.position.set(0, 0.012, -room.depth / 2);
    lightSweep.visible = false;
    scene.add(lightSweep);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.45, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = 0.45;
    controls.maxPolarAngle = 1.48;
    controls.minAzimuthAngle = -1.2;
    controls.maxAzimuthAngle = -0.05;

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    const loader = new GLTFLoader();
    const registry = new Map<string, FurnitureEntry>();
    const loading = new Map<string, Promise<FurnitureEntry>>();
    const guides: THREE.Line[] = [];

    const clearGuides = () => {
      guides.splice(0).forEach((guide) => {
        scene.remove(guide);
        guide.geometry.dispose();
        (guide.material as THREE.Material).dispose();
      });
    };

    const createEntry = async (spec: FurnitureSpec) => {
      const existing = registry.get(spec.id);
      if (existing) {
        existing.spec = spec;
        return existing;
      }
      const pending = loading.get(spec.id);
      if (pending) return pending;
      const promise = loader.loadAsync(modelPath + spec.asset).then((gltf) => {
        if (disposed) throw new Error("Preview disposed");
        const model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const extent = bounds.getSize(new THREE.Vector3());
        const modelScale = Math.min(spec.size[0] / Math.max(extent.x, 0.00001), spec.size[1] / Math.max(extent.y, 0.00001), spec.size[2] / Math.max(extent.z, 0.00001));
        model.scale.setScalar(modelScale);
        bounds.setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -bounds.min.y, -center.z + (spec.id === "desk" ? -0.47 : 0));
        const group = new THREE.Group();
        group.add(model);
        if (spec.id === "desk") {
          const oak = new THREE.MeshStandardMaterial({ color: 0xb99469, roughness: 0.82 });
          const metal = new THREE.MeshStandardMaterial({ color: 0x59605b, metalness: 0.3, roughness: 0.62 });
          const top = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.6), oak);
          top.position.y = 0.75;
          top.castShadow = true;
          group.add(top);
          for (const x of [-0.54, 0.54]) for (const z of [-0.24, 0.24]) {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.72, 0.04), metal);
            leg.position.set(x, 0.36, z);
            leg.castShadow = true;
            group.add(leg);
          }
        }
        const materials: MaterialState[] = [];
        group.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          child.castShadow = true;
          child.receiveShadow = true;
          const original = Array.isArray(child.material) ? child.material : [child.material];
          const cloned = original.map((material) => material.clone());
          child.material = Array.isArray(child.material) ? cloned : cloned[0];
          cloned.forEach((material) => materials.push({ material, baseOpacity: material.opacity, baseTransparent: material.transparent, baseDepthWrite: material.depthWrite }));
        });
        const entry: FurnitureEntry = { group, materials, opacity: 0, spec };
        group.visible = false;
        scene.add(group);
        registry.set(spec.id, entry);
        loading.delete(spec.id);
        return entry;
      });
      loading.set(spec.id, promise);
      return promise;
    };

    const placeImmediately = (specs: FurnitureSpec[]) => {
      const active = new Set(specs.map((spec) => spec.id));
      registry.forEach((entry, id) => {
        const spec = specs.find((item) => item.id === id);
        if (!spec || !active.has(id)) {
          entry.group.visible = false;
          setEntryOpacity(entry, 0);
          return;
        }
        const pose = poseFor(spec);
        entry.spec = spec;
        entry.group.visible = true;
        entry.group.position.copy(pose.position);
        entry.group.quaternion.copy(pose.quaternion);
        entry.group.scale.setScalar(1);
        setEntryOpacity(entry, 1);
      });
      renderer.toneMappingExposure = 1.52;
      sun.intensity = 3.1;
      lightSweep.visible = false;
      controls.enabled = true;
      setComplete(true);
      setStatus("Layout arranged");
    };

    const buildOutline = (spec: FurnitureSpec, final: THREE.Vector3, rotation: THREE.Quaternion) => {
      const halfWidth = spec.footprint[0] / 2;
      const halfDepth = spec.footprint[1] / 2;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-halfWidth, 0, -halfDepth),
        new THREE.Vector3(halfWidth, 0, -halfDepth),
        new THREE.Vector3(halfWidth, 0, halfDepth),
        new THREE.Vector3(-halfWidth, 0, halfDepth),
        new THREE.Vector3(-halfWidth, 0, -halfDepth),
      ]);
      const material = new THREE.LineBasicMaterial({ color: 0x5d9e82, transparent: true, opacity: 0, depthWrite: false });
      const outline = new THREE.Line(geometry, material);
      outline.position.copy(final).setY(0.018);
      outline.quaternion.copy(rotation);
      scene.add(outline);
      guides.push(outline);
      return { outline, material };
    };

    const buildPath = (start: THREE.Vector3, control: THREE.Vector3, final: THREE.Vector3) => {
      const points = Array.from({ length: 42 }, (_, index) => quadraticPoint(start, control, final, index / 41).setY(0.02));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      geometry.setDrawRange(0, 0);
      const material = new THREE.LineDashedMaterial({ color: 0x72b596, dashSize: 0.12, gapSize: 0.07, transparent: true, opacity: 0, depthWrite: false });
      const path = new THREE.Line(geometry, material);
      path.computeLineDistances();
      scene.add(path);
      guides.push(path);
      return { path, material, pointCount: points.length };
    };

    const startIntro = async (nextPlan: LayoutPlan) => {
      const token = ++animationToken;
      activePlan = nextPlan;
      animationStep = null;
      clearGuides();
      setComplete(false);
      setStatus("Loading spatial models…");
      const specs = previewFurniture(nextPlan).sort((a, b) => poseFor(a).position.z - poseFor(b).position.z);
      try {
        await Promise.all(specs.map(createEntry));
      } catch {
        if (!disposed && token === animationToken) setStatus("3D models could not load. The measured plan is still available.");
        return;
      }
      if (disposed || token !== animationToken) return;
      registry.forEach((entry) => {
        entry.group.visible = false;
        setEntryOpacity(entry, 0);
      });
      if (reducedMotion) {
        placeImmediately(specs);
        return;
      }

      introStatusPhase = -1;
      camera.position.copy(introCameraPosition);
      camera.lookAt(controls.target);
      controls.enabled = false;
      renderer.toneMappingExposure = 1.02;
      sun.intensity = 1.35;
      lightSweep.visible = true;
      const items = specs.map((spec, index) => {
        const entry = registry.get(spec.id)!;
        const final = poseFor(spec);
        const startX = THREE.MathUtils.clamp(final.position.x + (index % 2 ? 0.32 : -0.32), -room.width / 2 + 0.35, room.width / 2 - 0.35);
        const start = spec.anchored ? final.position.clone() : new THREE.Vector3(startX, 0, room.depth / 2 + 0.68 + (index % 2) * 0.12);
        const control = new THREE.Vector3(final.position.x, 0, room.depth / 2 + 0.28);
        const startQuaternion = final.quaternion.clone();
        if (!spec.anchored) startQuaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), index % 2 ? 0.34 : -0.34));
        entry.spec = spec;
        entry.group.visible = true;
        entry.group.position.copy(start);
        entry.group.quaternion.copy(startQuaternion);
        entry.group.scale.setScalar(0.96);
        setEntryOpacity(entry, 0);
        const outline = buildOutline(spec, final.position, final.quaternion);
        const path = spec.anchored ? null : buildPath(start, control, final.position);
        return { entry, spec, index, final, start, control, startQuaternion, outline, path };
      });
      const introStarted = performance.now() + 80;
      animationStep = (now) => {
        const elapsed = now - introStarted;
        const roomReveal = ease(elapsed / 500);
        renderer.toneMappingExposure = THREE.MathUtils.lerp(1.02, 1.52, roomReveal);
        sun.intensity = THREE.MathUtils.lerp(1.35, 3.1, roomReveal);
        const cameraProgress = ease(elapsed / 4200);
        camera.position.lerpVectors(introCameraPosition, finalCameraPosition, cameraProgress);
        camera.lookAt(controls.target);
        const sweepProgress = clamp01((elapsed - 350) / 750);
        lightSweep.position.z = THREE.MathUtils.lerp(-room.depth / 2 - 0.25, room.depth / 2 + 0.25, sweepProgress);
        sweepMaterial.opacity = Math.sin(sweepProgress * Math.PI) * 0.38;
        const guideIn = ease((elapsed - 550) / 520);
        const guideOut = 1 - ease((elapsed - 3700) / 650);
        const guideOpacity = Math.min(guideIn, guideOut);
        items.forEach((item) => {
          item.outline.material.opacity = 0.5 * guideOpacity;
          if (item.path) {
            const pathProgress = ease((elapsed - 650 - item.index * 70) / 560);
            item.path.path.geometry.setDrawRange(0, Math.round(item.path.pointCount * pathProgress));
            item.path.material.opacity = 0.52 * guideOpacity;
          }
          const local = clamp01((elapsed - 1000 - item.index * 480) / 1400);
          if (item.spec.anchored) {
            const reveal = ease(local);
            item.entry.group.position.copy(item.final.position);
            item.entry.group.quaternion.copy(item.final.quaternion);
            item.entry.group.scale.setScalar(0.96 + reveal * 0.04);
            setEntryOpacity(item.entry, reveal);
            return;
          }
          const turn = ease(local / 0.28);
          const move = ease((local - 0.18) / 0.82);
          item.entry.group.position.copy(quadraticPoint(item.start, item.control, item.final.position, move));
          item.entry.group.quaternion.copy(item.startQuaternion).slerp(item.final.quaternion, turn);
          item.entry.group.scale.setScalar(0.985 + ease(local) * 0.015);
          setEntryOpacity(item.entry, ease(local / 0.2));
        });
        const nextPhase = elapsed < 550 ? 0 : elapsed < 1000 ? 1 : elapsed < 3700 ? 2 : 3;
        if (nextPhase !== introStatusPhase) {
          introStatusPhase = nextPhase;
          setStatus(["Reading measured positions…", "Drawing verified routes…", "Bringing furniture into place…", "Finishing the arrangement…"][nextPhase]);
        }
        if (elapsed < introDuration) return;
        items.forEach(({ entry, final }) => {
          entry.group.position.copy(final.position);
          entry.group.quaternion.copy(final.quaternion);
          entry.group.scale.setScalar(1);
          setEntryOpacity(entry, 1);
        });
        camera.position.copy(finalCameraPosition);
        camera.lookAt(controls.target);
        renderer.toneMappingExposure = 1.52;
        sun.intensity = 3.1;
        lightSweep.visible = false;
        clearGuides();
        controls.enabled = true;
        animationStep = null;
        setComplete(true);
        setStatus("Layout arranged");
      };
    };

    const startTransition = async (nextPlan: LayoutPlan) => {
      const token = ++animationToken;
      activePlan = nextPlan;
      animationStep = null;
      clearGuides();
      lightSweep.visible = false;
      renderer.toneMappingExposure = 1.52;
      sun.intensity = 3.1;
      controls.enabled = true;
      setComplete(false);
      setStatus("Rearranging layout…");
      const specs = previewFurniture(nextPlan);
      try {
        await Promise.all(specs.map(createEntry));
      } catch {
        if (!disposed && token === animationToken) setStatus("3D models could not load. The measured plan is still available.");
        return;
      }
      if (disposed || token !== animationToken) return;
      if (reducedMotion) {
        placeImmediately(specs);
        return;
      }
      const targets = new Map(specs.map((spec) => [spec.id, spec]));
      const items = Array.from(registry.entries()).map(([id, entry]) => {
        const targetSpec = targets.get(id);
        const target = targetSpec ? poseFor(targetSpec) : null;
        const wasVisible = entry.group.visible && entry.opacity > 0.01;
        if (targetSpec && !wasVisible) {
          entry.group.visible = true;
          entry.group.position.copy(target!.position);
          entry.group.quaternion.copy(target!.quaternion);
          entry.group.scale.setScalar(0.96);
          setEntryOpacity(entry, 0);
        }
        const startPosition = entry.group.position.clone();
        const startQuaternion = entry.group.quaternion.clone();
        const startScale = entry.group.scale.x;
        const startOpacity = entry.opacity;
        const control = target ? new THREE.Vector3(
          (startPosition.x + target.position.x) / 2,
          0,
          Math.min(room.depth / 2 + 0.24, Math.max(startPosition.z, target.position.z) + 0.35),
        ) : null;
        return { entry, targetSpec, target, wasVisible, startPosition, startQuaternion, startScale, startOpacity, control };
      });
      const transitionStarted = performance.now();
      animationStep = (now) => {
        const progress = clamp01((now - transitionStarted) / transitionDuration);
        items.forEach((item) => {
          if (!item.targetSpec || !item.target) {
            setEntryOpacity(item.entry, item.startOpacity * (1 - ease(progress / 0.22)));
            return;
          }
          item.entry.spec = item.targetSpec;
          if (!item.wasVisible) {
            const reveal = ease((progress - 0.58) / 0.32);
            item.entry.group.position.copy(item.target.position);
            item.entry.group.quaternion.copy(item.target.quaternion);
            item.entry.group.scale.setScalar(0.96 + reveal * 0.04);
            setEntryOpacity(item.entry, reveal);
            return;
          }
          const move = ease((progress - 0.12) / 0.68);
          item.entry.group.position.copy(quadraticPoint(item.startPosition, item.control!, item.target.position, move));
          item.entry.group.quaternion.copy(item.startQuaternion).slerp(item.target.quaternion, move);
          item.entry.group.scale.setScalar(THREE.MathUtils.lerp(item.startScale, 1, move));
          setEntryOpacity(item.entry, THREE.MathUtils.lerp(item.startOpacity, 1, move));
        });
        if (progress < 1) return;
        const active = new Set(specs.map((spec) => spec.id));
        registry.forEach((entry, id) => {
          const targetSpec = targets.get(id);
          if (!active.has(id) || !targetSpec) {
            entry.group.visible = false;
            setEntryOpacity(entry, 0);
            return;
          }
          const target = poseFor(targetSpec);
          entry.group.visible = true;
          entry.group.position.copy(target.position);
          entry.group.quaternion.copy(target.quaternion);
          entry.group.scale.setScalar(1);
          setEntryOpacity(entry, 1);
        });
        animationStep = null;
        setComplete(true);
        setStatus("Layout arranged");
      };
    };

    const sceneRuntime: SceneRuntime = {
      transitionTo(nextPlan) {
        if (nextPlan === activePlan) return;
        void startTransition(nextPlan);
      },
    };
    runtime.current = sceneRuntime;
    void startIntro(activePlan);

    const animate = (now: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      animationStep?.(now);
      if (controls.enabled) controls.update();
      if (!document.hidden) renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      animationToken += 1;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      clearGuides();
      if (runtime.current === sceneRuntime) runtime.current = null;
      const disposedGeometries = new Set<THREE.BufferGeometry>();
      const disposedMaterials = new Set<THREE.Material>();
      const disposedTextures = new Set<THREE.Texture>();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Line)) return;
        if (!disposedGeometries.has(object.geometry)) {
          disposedGeometries.add(object.geometry);
          object.geometry.dispose();
        }
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (disposedMaterials.has(material)) return;
          disposedMaterials.add(material);
          const textured = material as THREE.MeshStandardMaterial;
          [textured.map, textured.normalMap, textured.metalnessMap, textured.roughnessMap].forEach((texture) => {
            if (texture && !disposedTextures.has(texture)) {
              disposedTextures.add(texture);
              texture.dispose();
            }
          });
          material.dispose();
        });
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [replay]);

  useEffect(() => {
    runtime.current?.transitionTo(plan);
  }, [plan]);

  return (
    <div className={styles.preview}>
      <div className={styles.canvas} ref={host} role="img" aria-label="Interactive 3D furniture layout with furniture following measured paths into the new living room" />
      <div className={styles.topline}><span>RE:NEST / SPATIAL PREVIEW</span><span>GEOMETRY-LED 3D</span></div>
      <div className={styles.bottomline}>
        <div><strong>{status}</strong><span>{complete ? "Drag to explore the arrangement" : "Measured paths are shaping the room"}</span></div>
        <button type="button" onClick={() => { setComplete(false); setStatus("Reading measured positions…"); setReplay((value) => value + 1); }}><RotateCcw size={14} /> Replay</button>
      </div>
    </div>
  );
}
