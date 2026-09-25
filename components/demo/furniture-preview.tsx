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
  center: [number, number];
  rotation: number;
};

const room = { width: 3.9, depth: 3.1 };
const modelPath = "/models/";

function previewFurniture(plan: LayoutPlan): FurnitureSpec[] {
  const living = (id: string) => plan.placements.find((item) => item.roomId === "living" && item.furnitureId === id);
  const fromPlan = (placement: NonNullable<ReturnType<typeof living>>, width: number, depth: number): [number, number] => {
    const rotated = placement.rotation % 180 !== 0;
    return [placement.position.x + (rotated ? depth : width) / 2, placement.position.y + (rotated ? width : depth) / 2];
  };
  const sofa = living("sofa");
  const coffee = living("coffee-table");
  const bookshelf = living("bookshelf");
  const desk = living("desk");
  const dining = living("dining-table");
  const specs: FurnitureSpec[] = [];
  if (sofa) {
    const dimensions = sofa.overrideDimensions ?? { width: 2.04, depth: 0.88, height: 0.82 };
    specs.push({ id: "sofa", label: "Sofa", asset: "sofa.glb", size: [dimensions.width, dimensions.height, dimensions.depth], center: fromPlan(sofa, dimensions.width, dimensions.depth), rotation: sofa.rotation });
  }
  if (coffee) specs.push({ id: "coffee", label: "Coffee table", asset: "coffee-table.glb", size: [0.86, 0.6, 0.75], center: fromPlan(coffee, 1, 0.55), rotation: coffee.rotation });
  // Styling accent next to the measured sofa position. The 2D result marks the same spot.
  specs.push({ id: "lamp", label: "Floor lamp", asset: "floor-lamp.glb", size: [0.55, 1.7, 0.42], center: [2.55, 0.46], rotation: 0 });
  if (bookshelf) specs.push({ id: "bookshelf", label: "Bookshelf", asset: "bookshelf.glb", size: [0.8, 1.8, 0.32], center: fromPlan(bookshelf, 0.8, 0.32), rotation: bookshelf.rotation });
  if (desk) specs.push({ id: "desk", label: "Study desk", asset: "chair.glb", size: [0.55, 0.9, 0.55], center: fromPlan(desk, 1.2, 0.6), rotation: desk.rotation });
  if (dining) {
    const dimensions = dining.overrideDimensions ?? { width: 1.4, depth: 0.8, height: 0.75 };
    // The GLB includes chairs. Size the whole setting, while anchoring its tabletop
    // to the exact table center in the verified 2D plan.
    specs.push({ id: "dining", label: "Dining setting", asset: "dining-set.glb", size: [1.35, 0.78, 1.35], center: fromPlan(dining, dimensions.width, dimensions.depth), rotation: dining.rotation });
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

export function FurniturePreview({ plan }: { plan: LayoutPlan }) {
  const host = useRef<HTMLDivElement>(null);
  const [replay, setReplay] = useState(0);
  const [status, setStatus] = useState("Creating your optimized layout…");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let disposed = false;
    let frame = 0;
    let started = 0;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe9edf0);
    scene.fog = new THREE.Fog(0xe9edf0, 9, 18);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 35);
    camera.position.set(-4.65, 3.1, 5.9);
    camera.lookAt(0, 0.65, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.52;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xfaf4e9, 0xadb9bc, 2.2));
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

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(4.25, 3.45), new THREE.MeshStandardMaterial({ color: 0xd8cec0, roughness: 0.93 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.025;
    floor.receiveShadow = true;
    scene.add(floor);
    const wall = new THREE.MeshStandardMaterial({ color: 0xf6f3ec, roughness: 0.94, side: THREE.DoubleSide });
    // A restrained window backdrop gives the furniture the daylight of the reference room.
    addBox(scene, [1.77, 1.65, 0.09], [-1.09, 0.825, -room.depth / 2], 0, wall);
    addBox(scene, [0.47, 1.65, 0.09], [1.72, 0.825, -room.depth / 2], 0, wall);
    addBox(scene, [1.7, 0.42, 0.09], [0.65, 0.21, -room.depth / 2], 0, wall);
    addBox(scene, [1.7, 0.17, 0.09], [0.65, 1.565, -room.depth / 2], 0, wall);
    addBox(scene, [0.09, 1.65, room.depth + 0.1], [room.width / 2, 0.825, 0], 0, wall);
    const viewCanvas = document.createElement("canvas");
    viewCanvas.width = 512; viewCanvas.height = 320;
    const viewContext = viewCanvas.getContext("2d");
    if (viewContext) {
      const sky = viewContext.createLinearGradient(0, 0, 0, 320);
      sky.addColorStop(0, "#b9d4e7"); sky.addColorStop(0.65, "#e2e8e5"); sky.addColorStop(1, "#b1c2bc");
      viewContext.fillStyle = sky; viewContext.fillRect(0, 0, 512, 320);
      viewContext.fillStyle = "rgba(106,126,133,.34)";
      for (let index = 0; index < 18; index++) {
        const x = index * 31 - 8;
        const height = 65 + (index * 43) % 78;
        viewContext.fillRect(x, 320 - height, 24 + index % 3 * 5, height);
      }
    }
    const viewTexture = new THREE.CanvasTexture(viewCanvas);
    viewTexture.colorSpace = THREE.SRGBColorSpace;
    const outdoor = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.02), new THREE.MeshBasicMaterial({ map: viewTexture, side: THREE.DoubleSide }));
    outdoor.position.set(0.65, 1.03, -room.depth / 2 - 0.015);
    scene.add(outdoor);
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x333f40, metalness: 0.38, roughness: 0.52 });
    addBox(scene, [1.76, 0.045, 0.07], [0.65, 1.54, -room.depth / 2 + 0.035], 0, frameMaterial);
    addBox(scene, [1.76, 0.045, 0.07], [0.65, 0.51, -room.depth / 2 + 0.035], 0, frameMaterial);
    for (const x of [-0.23, 0.35, 0.93, 1.53]) addBox(scene, [0.045, 1.06, 0.07], [x, 1.025, -room.depth / 2 + 0.035], 0, frameMaterial);
    const trim = new THREE.MeshStandardMaterial({ color: 0xb5a997, roughness: 0.77 });
    addBox(scene, [room.width, 0.045, 0.055], [0, 0.07, -room.depth / 2 + 0.07], 0, trim);
    addBox(scene, [0.055, 0.045, room.depth], [room.width / 2 - 0.07, 0.07, 0], 0, trim);
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 1.35), new THREE.MeshStandardMaterial({ color: 0xeae5da, roughness: 1 }));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(-0.55, 0.002, 0.12);
    rug.receiveShadow = true;
    scene.add(rug);

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

    const specs = previewFurniture(plan);
    const staged: Array<{ group: THREE.Group; final: THREE.Vector3; rotation: number; index: number }> = [];
    const loader = new GLTFLoader();
    Promise.all(specs.map(async (spec, index) => {
      const gltf = await loader.loadAsync(modelPath + spec.asset);
      if (disposed) return;
      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const extent = bounds.getSize(new THREE.Vector3());
      const scale = Math.min(spec.size[0] / Math.max(extent.x, 0.00001), spec.size[1] / Math.max(extent.y, 0.00001), spec.size[2] / Math.max(extent.z, 0.00001));
      model.scale.setScalar(scale);
      bounds.setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      model.position.set(-center.x, -bounds.min.y, -center.z + (spec.id === "desk" ? 0.47 : 0));
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) { child.castShadow = true; child.receiveShadow = true; }
      });
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
      const final = new THREE.Vector3(spec.center[0] - room.width / 2, 0, spec.center[1] - room.depth / 2);
      group.position.set(final.x + (index % 2 ? 0.8 : -0.8), 0.9 + index * 0.08, final.z + (index % 2 ? 0.55 : -0.55));
      group.rotation.y = THREE.MathUtils.degToRad(spec.rotation) + (index % 2 ? 0.45 : -0.45);
      scene.add(group);
      staged.push({ group, final, rotation: THREE.MathUtils.degToRad(spec.rotation), index });
    })).then(() => {
      if (disposed) return;
      started = performance.now() + 300;
      setStatus("Creating your optimized layout…");
    }).catch(() => { if (!disposed) setStatus("3D models could not load. The measured plan is still available."); });

    function animate(now: number) {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      if (started) {
        let settled = true;
        staged.forEach(({ group, final, rotation, index }) => {
          const t = THREE.MathUtils.clamp((now - started - index * 420) / 1150, 0, 1);
          const ease = t * t * (3 - 2 * t);
          group.position.lerpVectors(new THREE.Vector3(final.x + (index % 2 ? 0.8 : -0.8), 0.9 + index * 0.08, final.z + (index % 2 ? 0.55 : -0.55)), final, ease);
          group.rotation.y = rotation + (1 - ease) * (index % 2 ? 0.45 : -0.45);
          if (t < 1) settled = false;
        });
        if (settled && staged.length === specs.length) {
          started = 0;
          setComplete(true);
          setStatus("Layout arranged");
        }
      }
      controls.update();
      if (!document.hidden) renderer.render(scene, camera);
    }
    frame = requestAnimationFrame(animate);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            const textured = material as THREE.MeshStandardMaterial;
            textured.map?.dispose();
            textured.normalMap?.dispose();
            textured.metalnessMap?.dispose();
            material.dispose();
          });
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [plan, replay]);

  return (
    <div className={styles.preview}>
      <div className={styles.canvas} ref={host} role="img" aria-label="Interactive 3D furniture layout with furniture moving into the new living room" />
      <div className={styles.topline}><span>RE:NEST / SPATIAL PREVIEW</span><span>ILLUSTRATIVE 3D</span></div>
      <div className={styles.bottomline}>
        <div><strong>{status}</strong><span>{complete ? "Drag to explore the arrangement" : "Furniture is moving into place"}</span></div>
        <button type="button" onClick={() => { setComplete(false); setStatus("Creating your optimized layout…"); setReplay((value) => value + 1); }}><RotateCcw size={14} /> Replay</button>
      </div>
    </div>
  );
}
