"use client";

import Image from "next/image";
import { RotateCcw, ScanLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import styles from "./room-scan-sequence.module.css";

export type RoomScanPhase = "idle" | "phone" | "points" | "wireframe" | "solid" | "inventory" | "complete";

const furnitureIds = ["sofa", "dining-table", "desk", "work-chair", "coffee-table", "bookshelf"] as const;

type RoomScanSequenceProps = {
  active: boolean;
  replayKey: number;
  selectedObjectId?: string;
  onPhaseChange?: (phase: RoomScanPhase) => void;
  onObjectDetected?: (id: string, count: number) => void;
  onComplete?: () => void;
  onReplay?: () => void;
};

const phaseStatus: Record<RoomScanPhase, string> = {
  idle: "Ready for spatial capture",
  phone: "Calibrating depth sensor",
  points: "Capturing depth points",
  wireframe: "Building triangular mesh",
  solid: "Resolving room surfaces",
  inventory: "Separating furniture volumes",
  complete: "Spatial inventory ready",
};

export function RoomScanSequence({
  active,
  replayKey,
  selectedObjectId,
  onPhaseChange,
  onObjectDetected,
  onComplete,
  onReplay,
}: RoomScanSequenceProps) {
  const host = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<RoomScanPhase>("idle");
  const selectedRef = useRef(selectedObjectId);
  const callbacks = useRef({ onPhaseChange, onObjectDetected, onComplete });
  const [phase, setPhaseState] = useState<RoomScanPhase>("idle");
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [detectedCount, setDetectedCount] = useState(0);
  const resetCamera = useRef<(() => void) | null>(null);

  useEffect(() => {
    callbacks.current = { onPhaseChange, onObjectDetected, onComplete };
  }, [onComplete, onObjectDetected, onPhaseChange]);

  useEffect(() => {
    selectedRef.current = selectedObjectId;
  }, [selectedObjectId]);

  useEffect(() => {
    const timers: number[] = [];
    const setPhase = (next: RoomScanPhase) => {
      phaseRef.current = next;
      setPhaseState(next);
      callbacks.current.onPhaseChange?.(next);
    };

    setDetectedCount(0);
    if (!active) {
      setPhase("idle");
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setPhase("solid");
      furnitureIds.forEach((id, index) => {
        timers.push(window.setTimeout(() => {
          const count = index + 1;
          setDetectedCount(count);
          callbacks.current.onObjectDetected?.(id, count);
        }, 80 + index * 55));
      });
      timers.push(window.setTimeout(() => {
        setPhase("complete");
        callbacks.current.onComplete?.();
      }, 480));
      return () => timers.forEach(window.clearTimeout);
    }

    const phaseSchedule: Array<[RoomScanPhase, number]> = [
      ["phone", 0],
      ["points", 1000],
      ["wireframe", 2800],
      ["solid", 4600],
      ["inventory", 6300],
    ];
    phaseSchedule.forEach(([next, delay]) => timers.push(window.setTimeout(() => setPhase(next), delay)));
    furnitureIds.forEach((id, index) => {
      timers.push(window.setTimeout(() => {
        const count = index + 1;
        setDetectedCount(count);
        callbacks.current.onObjectDetected?.(id, count);
      }, 6380 + index * 235));
    });
    timers.push(window.setTimeout(() => {
      setPhase("complete");
      callbacks.current.onComplete?.();
    }, 8000));

    return () => timers.forEach(window.clearTimeout);
  }, [active, replayKey]);

  useEffect(() => {
    const container = host.current;
    if (!container) return;

    let disposed = false;
    let frame = 0;
    let lastSelected = "";
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe7ebe7);
    scene.fog = new THREE.Fog(0xe7ebe7, 15, 28);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xfffaf0, 0x91a59a, 2.25));
    const sun = new THREE.DirectionalLight(0xffedcf, 3.2);
    sun.position.set(-5, 9, 7);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xb9e3d1, 1.2);
    fill.position.set(7, 4, -4);
    scene.add(fill);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.enabled = false;

    const pointMaterial = new THREE.PointsMaterial({
      color: 0x72c99d,
      size: 0.038,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0x78aa92,
      wireframe: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const pointGroup = new THREE.Group();
    const wireGroup = new THREE.Group();
    scene.add(pointGroup, wireGroup);
    const solidMaterials: THREE.Material[] = [];
    let modelScene: THREE.Group | null = null;
    let solidRoot: THREE.Object3D | null = null;
    const selectionBox = new THREE.Box3();
    const selectionHelper = new THREE.Box3Helper(selectionBox, 0x477660);
    selectionHelper.visible = false;
    scene.add(selectionHelper);

    const loader = new GLTFLoader();
    loader.loadAsync("/models/old-home-scan.glb").then((gltf) => {
      if (disposed) return;
      modelScene = gltf.scene;
      scene.add(modelScene);
      modelScene.updateMatrixWorld(true);
      solidRoot = modelScene.getObjectByName("SOLID_ROOM") ?? modelScene;
      const scanRoot = modelScene.getObjectByName("SCAN_PROXY");

      solidRoot.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const source = Array.isArray(object.material) ? object.material : [object.material];
        const materials = source.map((item) => {
          const clone = item.clone();
          clone.transparent = true;
          clone.opacity = 0;
          clone.depthWrite = true;
          solidMaterials.push(clone);
          return clone;
        });
        object.material = Array.isArray(object.material) ? materials : materials[0];
      });

      solidRoot.updateMatrixWorld(true);
      solidRoot.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const vertexCount = object.geometry.getAttribute("position")?.count ?? 0;
        const sampleCount = THREE.MathUtils.clamp(Math.round(vertexCount * 0.18), 36, 1200);
        const sampledPositions = new Float32Array(sampleCount * 3);
        const sampler = new MeshSurfaceSampler(object).build();
        const sampledPoint = new THREE.Vector3();
        for (let index = 0; index < sampleCount; index += 1) {
          sampler.sample(sampledPoint);
          sampledPoint.toArray(sampledPositions, index * 3);
        }
        const pointGeometry = new THREE.BufferGeometry();
        pointGeometry.setAttribute("position", new THREE.BufferAttribute(sampledPositions, 3));
        const points = new THREE.Points(pointGeometry, pointMaterial);
        const wire = new THREE.Mesh(object.geometry, wireMaterial);
        points.matrixAutoUpdate = false;
        wire.matrixAutoUpdate = false;
        points.matrix.copy(object.matrixWorld);
        wire.matrix.copy(object.matrixWorld);
        pointGroup.add(points);
        wireGroup.add(wire);
      });
      if (scanRoot) scanRoot.visible = false;

      const bounds = new THREE.Box3().setFromObject(solidRoot);
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      const importedCamera = modelScene.getObjectByName("SCAN_CAMERA");
      const basePosition = new THREE.Vector3();
      const baseTarget = new THREE.Vector3();
      if (importedCamera instanceof THREE.PerspectiveCamera) {
        importedCamera.getWorldPosition(basePosition);
        importedCamera.getWorldQuaternion(camera.quaternion);
        camera.fov = importedCamera.fov;
        camera.near = Math.max(0.05, importedCamera.near);
        camera.far = Math.max(60, importedCamera.far);
        camera.updateProjectionMatrix();
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        baseTarget.copy(basePosition).addScaledVector(direction, 7);
      } else {
        basePosition.set(center.x + size.x * 0.72, center.y + size.y * 0.56, center.z + size.z * 1.08);
        baseTarget.set(center.x - size.x * 0.04, center.y + size.y * 0.04, center.z);
        camera.lookAt(baseTarget);
      }
      camera.position.copy(basePosition);
      controls.target.copy(baseTarget);
      const cameraOffset = basePosition.clone().sub(baseTarget);
      const initialAzimuth = Math.atan2(cameraOffset.x, cameraOffset.z);
      const initialPolar = Math.acos(THREE.MathUtils.clamp(cameraOffset.y / cameraOffset.length(), -1, 1));
      controls.minAzimuthAngle = initialAzimuth - 0.58;
      controls.maxAzimuthAngle = initialAzimuth + 0.58;
      controls.minPolarAngle = Math.max(0.5, initialPolar - 0.24);
      controls.maxPolarAngle = Math.min(1.5, initialPolar + 0.24);
      controls.minDistance = basePosition.distanceTo(baseTarget) * 0.78;
      controls.maxDistance = basePosition.distanceTo(baseTarget) * 1.2;
      controls.update();
      resetCamera.current = () => {
        camera.position.copy(basePosition);
        controls.target.copy(baseTarget);
        camera.lookAt(baseTarget);
        controls.update();
      };
      setLoaded(true);
      setFailed(false);
    }).catch(() => {
      if (!disposed) {
        setFailed(true);
        setLoaded(false);
      }
    });

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

    const opacityForPhase = (current: RoomScanPhase) => {
      if (current === "points") return { points: 0.94, wire: 0, solid: 0 };
      if (current === "wireframe") return { points: 0.2, wire: 0.88, solid: 0 };
      if (current === "solid") return { points: 0.04, wire: 0.3, solid: 0.92 };
      if (current === "inventory" || current === "complete") return { points: 0, wire: 0, solid: 1 };
      return { points: 0, wire: 0, solid: 0 };
    };

    function animate(now: number) {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      const target = opacityForPhase(phaseRef.current);
      pointMaterial.opacity = THREE.MathUtils.lerp(pointMaterial.opacity, target.points, 0.075);
      wireMaterial.opacity = THREE.MathUtils.lerp(wireMaterial.opacity, target.wire, 0.07);
      solidMaterials.forEach((item) => {
        item.opacity = THREE.MathUtils.lerp(item.opacity, target.solid, 0.055);
        item.depthWrite = item.opacity > 0.55;
      });
      pointGroup.rotation.y = phaseRef.current === "wireframe" ? Math.sin(now / 1450) * 0.012 : 0;
      wireGroup.rotation.y = pointGroup.rotation.y;
      controls.enabled = phaseRef.current === "complete";

      const selected = selectedRef.current ?? "";
      if (selected !== lastSelected || phaseRef.current !== "complete") {
        lastSelected = selected;
        const object = solidRoot?.getObjectByName(`furniture-${selected}`);
        selectionHelper.visible = Boolean(object && phaseRef.current === "complete");
        if (object) selectionBox.setFromObject(object).expandByScalar(0.035);
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
      resetCamera.current = null;
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((item) => item.dispose());
        }
      });
      pointMaterial.dispose();
      wireMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className={styles.sequence} data-phase={phase} data-failed={failed || undefined}>
      <div ref={host} className={styles.canvas} role="img" aria-label="Simulated LiDAR reconstruction of the current home from photograph to interactive 3D mesh" />
      <div className={styles.photo}>
        <Image src="/photos/old-home-scan-reference.png" alt="Your lived-in Kowloon apartment before spatial capture" fill loading="eager" sizes="(max-width: 900px) 100vw, 70vw" />
      </div>
      <div className={styles.photoShade} aria-hidden="true" />

      {active && phase !== "complete" ? <div key={`sweep-${replayKey}`} className={styles.scanPlane} aria-hidden="true" /> : null}

      <div className={styles.captureLabel}>
        <span><ScanLine size={13} /> Simulated LiDAR capture</span>
        <strong>{phaseStatus[phase]}</strong>
      </div>

      <div className={styles.phone} aria-hidden="true">
        <div className={styles.phoneSpeaker} />
        <div className={styles.phoneScreen}>
          <Image src="/photos/old-home-scan-reference.png" alt="" fill loading="eager" sizes="220px" />
          <span className={styles.phoneSweep} />
          <span className={styles.phoneCorners}><i /><i /><i /><i /></span>
          <b>DEPTH</b>
        </div>
      </div>

      <div className={styles.modelStatus}>
        <span>{failed ? "PHOTO FALLBACK" : loaded ? "ROOM MESH / 01" : "LOADING SPATIAL MODEL"}</span>
        <b>{phase === "inventory" || phase === "complete" ? `${detectedCount} / ${furnitureIds.length} OBJECTS` : phaseStatus[phase].toUpperCase()}</b>
      </div>

      {phase === "complete" ? (
        <div className={styles.controls}>
          <span>Drag to inspect the captured room</span>
          <button type="button" onClick={() => resetCamera.current?.()} aria-label="Reset 3D view"><RotateCcw size={14} /></button>
          {onReplay ? <button type="button" onClick={onReplay}>Replay</button> : null}
        </div>
      ) : null}
    </div>
  );
}
