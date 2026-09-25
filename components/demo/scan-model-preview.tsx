"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import styles from "./scan-model-preview.module.css";

const assets: Record<string, string> = {
  sofa: "sofa.glb",
  "coffee-table": "coffee-table.glb",
  "dining-table": "dining-set.glb",
  bookshelf: "bookshelf.glb",
  "work-chair": "chair.glb",
};

export function ScanModelPreview({ itemId, label }: { itemId: string; label: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const asset = itemId === "desk" ? "procedural-desk" : assets[itemId];

  useEffect(() => {
    const container = host.current;
    if (!container || !asset) return;
    let disposed = false;
    let frame = 0;
    let start = 0;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
    camera.position.set(2.4, 1.6, 3.7);
    camera.lookAt(0, 0.25, 0);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;
    container.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xa6b0a9, 2.4));
    const key = new THREE.DirectionalLight(0xfff5e8, 3);
    key.position.set(-2, 4, 4);
    scene.add(key);
    const group = new THREE.Group();
    scene.add(group);
    if (itemId === "desk") {
      const oak = new THREE.MeshStandardMaterial({ color: 0xbd9b70, roughness: 0.82 });
      const frame = new THREE.MeshStandardMaterial({ color: 0x545e5b, metalness: 0.3, roughness: 0.6 });
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.08, 0.68), oak);
      top.position.y = 0.14;
      group.add(top);
      for (const x of [-0.7, 0.7]) for (const z of [-0.28, 0.28]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.75, 0.05), frame);
        leg.position.set(x, -0.27, z);
        group.add(leg);
      }
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.025), frame);
      screen.position.set(0, 0.35, -0.18);
      group.add(screen);
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.016, 0.19), frame);
      base.position.set(0, 0.2, -0.06);
      group.add(base);
      start = performance.now();
      setLoaded(true);
    } else {
      const loader = new GLTFLoader();
      loader.loadAsync(`/models/${asset}`).then((gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const scale = 1.65 / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(scale);
        bounds.setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -bounds.min.y - bounds.getSize(new THREE.Vector3()).y * 0.5, -center.z);
        group.add(model);
        start = performance.now();
        setLoaded(true);
      }).catch(() => { if (!disposed) setLoaded(false); });
    }
    const resize = () => {
      const width = container.clientWidth, height = container.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    function animate(now: number) {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      if (start) {
        const reveal = Math.min(1, (now - start) / 800);
        const ease = 1 - Math.pow(1 - reveal, 3);
        group.scale.setScalar(0.28 + 0.72 * ease);
        group.rotation.y = -0.85 * (1 - ease) + Math.sin(now / 2500) * 0.08;
        group.position.y = -0.12 * (1 - ease);
      }
      if (!document.hidden) renderer.render(scene, camera);
    }
    frame = requestAnimationFrame(animate);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [asset]);

  return (
    <div className={styles.card}>
      <div className={styles.header}><span>3D object extracted</span><strong>{label}</strong></div>
      <div className={styles.model} ref={host} role="img" aria-label={`${label} 3D model extracted from the furniture scan`}>
        {!loaded ? <span className={styles.scanning}>Matching furniture asset…</span> : null}
      </div>
      <div className={styles.scanline} aria-hidden="true" />
      <div className={styles.footer}><span>01 / DETECT</span><span>02 / MEASURE</span><span>03 / MODEL</span></div>
    </div>
  );
}
