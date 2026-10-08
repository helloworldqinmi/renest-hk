'use client';

import { useEffect, useRef, type RefObject } from 'react';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { studioInventory, type Placement } from '@/lib/studio-data';
import { isStaged } from '@/lib/studio-placement';
import { tourFrame, type TourShot } from '@/lib/interior-tour';
import { createSurfaceMaps, finishMaterial } from './scene-finish';
import { batchStatic } from './scene-geometry';
import { createSpatialTopology } from './spatial-effects';
import { ENTRY_DURATION, spatialReveal, smootherstep } from '@/lib/spatial-experience';
import { createRenderBudget, renderPixelRatio } from './render-budget';
import { INTERIOR_JAMB } from '@/lib/interior-joinery';
import styles from './interior-tour.module.css';

type Props = { placements: Placement[]; shots: TourShot[]; clock: RefObject<number>; lighting: 'day' | 'evening'; reduced: boolean; structure?: boolean; paused?: boolean; onReady: () => void; onPause: () => void; onError: () => void; label: string };

export function InteriorScene(props: Props) {
  const host = useRef<HTMLDivElement>(null), live = useRef(props);
  live.current = props;
  useEffect(() => {
    const container = host.current;
    if (!container || !props.shots.length) return;
    let disposed = false, frame = 0, loaded = false, previousRoom = -1, previousLight = '', lastTime = 0, dirty = true, previousFrame = '';
    const mobile = window.matchMedia('(max-width:740px)').matches;
    let renderer: T.WebGLRenderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
    catch { live.current.onError(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.6));
    const budget = createRenderBudget(renderer, mobile);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.AgXToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.domElement.setAttribute('aria-label', live.current.label);
    renderer.domElement.style.touchAction = 'none';
    container.appendChild(renderer.domElement);
    const scene = new T.Scene();
    scene.background = new T.Color('#dce4e6');
    const camera = new T.PerspectiveCamera(58, 1, .1, 55);
    const geometry = new Set<T.BufferGeometry>(), materials = new Set<T.Material>(), textures = new Set<T.Texture>();
    function track(root: T.Object3D) { root.traverse(o => { if (o instanceof T.Mesh) { geometry.add(o.geometry); for (const m of Array.isArray(o.material) ? o.material : [o.material]) { materials.add(m); for (const v of Object.values(m)) if (v instanceof T.Texture) textures.add(v); } } }); }
    const surfaces = createSurfaceMaps(Math.min(renderer.capabilities.getMaxAnisotropy(), 8));
    const pmrem = new T.PMREMGenerator(renderer), room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture;
    scene.environmentIntensity = .48;
    room.dispose(); pmrem.dispose();
    const ambient = new T.HemisphereLight('#e6edf4', '#b7a690', .65);
    scene.add(ambient);
    const sun = new T.DirectionalLight('#fff1d9', 3.2);
    sun.position.set(-3, 4.8, -7); sun.target.position.set(4, 0, 3);
    sun.castShadow = true; sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: .1, far: 24 });
    sun.shadow.normalBias = .02; sun.shadow.bias = -.00015; sun.shadow.radius = 4; sun.shadow.intensity = .6;
    scene.add(sun, sun.target);
    RectAreaLightUniformsLib.init();
    const windows: T.RectAreaLight[] = [];
    for (const [x, z, width, targetZ] of [[1.8, -.05, 3, 3], [6.3, .4, 3.4, 3], [6.9, 6.2, 2.4, 3]]) {
      const light = new T.RectAreaLight('#eef3ff', 4.5, width, 1.55);
      light.position.set(x, 1.65, z); light.lookAt(x, 1.1, targetZ); scene.add(light); windows.push(light);
    }
    const practicals: T.PointLight[] = [];
    // Distant layered hills give every window depth without nearby buildings.
    const exterior = new T.Group(); exterior.name = 'Hong Kong garden outlook';
    const landscapeMaterials: T.MeshBasicMaterial[] = [];
    for (let layer = 0; layer < 3; layer++) {
      const material = new T.MeshBasicMaterial({ color: ['#bdced0', '#a3bab7', '#809e90'][layer], side: T.DoubleSide });
      landscapeMaterials.push(material);
      for (const side of [-1, 1]) {
        const shape = new T.Shape(); shape.moveTo(-38, -8);
        for (let i = 0; i <= 28; i++) { const x = -38 + i * 2.8; shape.lineTo(x, 1.5 + layer * .4 + Math.sin(i * .63 + layer * 1.9) * 1.35 + Math.sin(i * 1.31) * .45); }
        shape.lineTo(41, -8); shape.closePath();
        const hill = new T.Mesh(new T.ShapeGeometry(shape), material);
        hill.position.set(4, 0, side < 0 ? -23 + layer * 4 : 30 - layer * 4); exterior.add(hill);
      }
    }
    exterior.visible = false;
    scene.add(exterior); track(exterior);
    batchStatic(exterior); track(exterior);
    const glowMaterials: T.MeshStandardMaterial[] = [];
    const decor = new T.Group(); decor.name = 'Finished interior details'; decor.visible = false; scene.add(decor);
    const ceiling = new T.Mesh(new T.BoxGeometry(8.4, .06, 6.15), new T.MeshStandardMaterial({ color: '#e9e5dc', roughness: .95 }));
    ceiling.position.set(4.2, 2.59, 3.075); ceiling.receiveShadow = true; ceiling.castShadow = true; ceiling.visible = false; scene.add(ceiling); track(ceiling);
    // A pair of restrained prints gives the blank kitchen partition a visual anchor.
    const frameOak = new T.MeshStandardMaterial({ color: '#8e775c', roughness: .6 });
    const artPaper = new T.MeshStandardMaterial({ color: '#f0eadd', roughness: 1 });
    const artSage = new T.MeshStandardMaterial({ color: '#8d9785', roughness: 1 });
    const artSand = new T.MeshStandardMaterial({ color: '#c6ad8c', roughness: 1 });
    for (const x of [1.38]) {
      const print = new T.Group(); print.position.set(x, 1.68, 1.48);
      const frame = new T.Mesh(new T.BoxGeometry(.46, .62, .035), frameOak); print.add(frame);
      const paper = new T.Mesh(new T.BoxGeometry(.42, .58, .006), artPaper); paper.position.z = .02; print.add(paper);
      const block = new T.Mesh(new T.PlaneGeometry(.28, .035), artSage); block.position.set(0, -.1, .024); print.add(block);
      const horizon = new T.Mesh(new T.PlaneGeometry(.28, .09), artSand); horizon.position.set(0, -.038, .025); print.add(horizon);
      decor.add(print); track(print);
    }
    const ceilingLights: T.RectAreaLight[] = [];
    const diffuser = new T.MeshStandardMaterial({ color: '#fff5df', roughness: .65, emissive: '#ffe7bc', emissiveIntensity: .35 });
    const hardware = new T.MeshStandardMaterial({ color: '#a68c67', metalness: .75, roughness: .35 });
    const fixture = new T.MeshStandardMaterial({ color: '#eee8da', roughness: .85 });
    function addCeilingLight(x: number, z: number, pendant = false) {
      const group = new T.Group();
      group.position.set(x, pendant ? 2.19 : 2.49, z);
      const body = new T.Mesh(new T.CylinderGeometry(pendant ? .32 : .24, pendant ? .43 : .24, pendant ? .2 : .075, 48, 1, true), pendant ? fixture : hardware);
      body.castShadow = true; body.receiveShadow = true; group.add(body);
      const disk = new T.Mesh(new T.CircleGeometry(pendant ? .415 : .225, 48), diffuser);
      disk.rotation.x = Math.PI / 2; disk.position.y = pendant ? -.102 : -.04; group.add(disk);
      if (pendant) {
        const cord = new T.Mesh(new T.CylinderGeometry(.006, .006, .3, 8), hardware);
        cord.position.y = .25; group.add(cord);
      }
      decor.add(group); track(group);
      const light = new T.RectAreaLight('#ffe3b4', 1.2, pendant ? .8 : 1.1, pendant ? .8 : 1.1);
      light.position.set(x, group.position.y - .12, z); light.lookAt(x, 0, z); scene.add(light); ceilingLights.push(light);
    }
    addCeilingLight(1.85, 2.75);
    const dining = props.placements.find(p => ['N02', 'F04'].includes(p.id) && !isStaged(p));
    addCeilingLight(dining?.x ?? 2.05, dining?.z ?? 5.05, true);
    addCeilingLight(6.15, 1.8); addCeilingLight(6.95, 4.7);
    // Soft bounced ceiling light belongs inside the shell, not above its roof.
    const bounce = new T.HemisphereLight('#fff4e4', '#ad9d86', .35); scene.add(bounce);
    // Native multisample antialiasing + baked AO stay stable while the lens moves.
    // Avoid stochastic screen-space shading and a second full-resolution render.
    function resize() {
      const width = container!.clientWidth, height = container!.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height; camera.fov = live.current.shots[Math.max(0, previousRoom)]?.fov ?? 58; camera.updateProjectionMatrix();
      dirty = true;
      renderer.setPixelRatio(renderPixelRatio(width, height, window.devicePixelRatio, mobile));
      renderer.setSize(width, height, false);
    }
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    const loader = new GLTFLoader();
    let topology: ReturnType<typeof createSpatialTopology> | undefined;
    const revealPlane = new T.Plane(new T.Vector3(0, -1, 0), 100);
    renderer.localClippingEnabled = true;
    const grid = new T.GridHelper(12, 24, '#88c8d3', '#3b697b');
    grid.position.set(4.2, .025, 3); scene.add(grid);
    const gridMaterial = grid.material as T.LineBasicMaterial; gridMaterial.transparent = true; gridMaterial.depthWrite = false;
    const entryStart = new T.Vector3(11.5, 8.2, 12), entryMiddle = new T.Vector3();
    let lightBlend = -1, structureBlend = 0, previousNow = 0, previousCeiling = true;
    const coolSun = new T.Color('#b2c5e0'), coolWindow = new T.Color('#9fb8dc'), eveningSky = new T.Color('#536881'), digitalSky = new T.Color('#0a1826');
    const plan = props.placements.filter(p => !isStaged(p));
    async function loadScene() {
      const gltf = await loader.loadAsync('/models/v2/new-home-a.glb');
      track(gltf.scene);
      if (disposed) { releaseTracked(); return; }
      const root = gltf.scene;
      // Replace the imported entrance joinery rather than overlaying a second frame.
      // The original lintel starts at 2.13m and its front plane is z=6.09m.
      root.updateMatrixWorld(true);
      const joineryPosition = new T.Vector3();
      root.traverse(object => {
        if (!/Door jamb|Door threshold|Door swing clearance/.test(object.name.replaceAll('_', ' '))) return;
        object.getWorldPosition(joineryPosition);
        if (Math.abs(joineryPosition.z - 6.15) < .16 && joineryPosition.x < 1.25) object.visible = false;
      });
      const entrance = new T.Group(); entrance.name = 'Closed entrance door';
      const oak = new T.MeshStandardMaterial({ name: 'Entrance smoked oak', color: '#82664c', roughness: .66 });
      const trim = new T.MeshStandardMaterial({ color: '#544638', roughness: .55 });
      const brass = new T.MeshStandardMaterial({ color: '#b69b6b', metalness: .78, roughness: .3 });
      function doorPart(w: number, h: number, d: number, x: number, y: number, z: number, material: T.Material) {
        const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material); mesh.position.set(x, y, z); entrance.add(mesh);
      }
      doorPart(.86, 2.11, .07, .73, 1.075, 6.15, oak);
      for (const x of [.285, 1.175]) doorPart(.06, 2.16, .05, x, 1.08, 6.055, trim);
      doorPart(.95, .06, .05, .73, 2.14, 6.055, trim);
      doorPart(.04, .2, .018, 1.03, 1.02, 6.105, brass);
      doorPart(.13, .025, .06, .985, 1.055, 6.073, brass);
      doorPart(.86, .025, .12, .73, .0275, 6.15, brass);
      root.add(entrance);
      // Imported jambs end exactly on the lintel plane and their skirting runs
      // through the opening. Rebuild the intersections with measurable clearance.
      const stableJoinery: { mesh: T.Mesh; parent: T.Object3D }[] = [];
      const joineryMaterials = new Map<T.Material, T.MeshStandardMaterial>();
      const doorParents = new Set<T.Object3D>();
      root.traverse(object => {
        if (!(object instanceof T.Mesh) || !object.visible) return;
        const name = object.name.replaceAll('_', ' ');
        if (!/Door jamb|Door threshold|Window mullion|Window rail|Stone window sill/.test(name)) return;
        object.userData.stableJoinery = true;
        if (/Door jamb/.test(name)) {
          object.geometry = new T.BoxGeometry(INTERIOR_JAMB.width, INTERIOR_JAMB.height, INTERIOR_JAMB.depth);
          object.position.y = 1.065;
          if (object.parent) doorParents.add(object.parent);
        }
        const original = object.material as T.MeshStandardMaterial;
        const material = joineryMaterials.get(original) ?? original.clone();
        joineryMaterials.set(original, material);
        material.roughness = .86; material.metalness = 0; material.bumpMap = null;
        object.material = material;
        stableJoinery.push({ mesh: object, parent: object.parent! });
      });
      for (const wall of doorParents) {
        const jambs = wall.children.filter(object => /Door jamb/.test(object.name.replaceAll('_', ' ')) && object.visible).sort((a, b) => a.position.x - b.position.x);
        if (jambs.length !== 2) continue;
        for (const board of [...wall.children]) {
          if (!(board instanceof T.Mesh) || !/Skirting board/.test(board.name.replaceAll('_', ' '))) continue;
          board.geometry.computeBoundingBox();
          const bounds = board.geometry.boundingBox!;
          const left = board.position.x + bounds.min.x, right = board.position.x + bounds.max.x;
          board.visible = false;
          for (const [a, b] of [[left, jambs[0].position.x - .025], [jambs[1].position.x + .025, right]]) {
            if (b <= a) continue;
            const section = new T.Mesh(new T.BoxGeometry(b - a, .1, .145), board.material);
            section.name = 'Door skirting return'; section.position.set((a + b) / 2, .08, 0); section.userData.stableJoinery = true;
            wall.add(section); stableJoinery.push({ mesh: section, parent: wall });
          }
        }
      }
      container!.dataset.stableJoineryCount = String(stableJoinery.length);
      const items = new Map<string, T.Object3D>();
      root.traverse(o => { if (o.userData.selectable) items.set(o.userData.id, o); });
      const missing = plan.filter(p => !items.has(p.id));
      await Promise.all(missing.map(async p => {
        const item = studioInventory.find(item => item.id === p.id)!;
        const asset = await loader.loadAsync(`/models/v2/furniture/${item.modelSourceId ?? p.id}.glb`);
        track(asset.scene);
        if (disposed) { releaseTracked(); return; }
        let furniture: T.Object3D | undefined;
        asset.scene.traverse(o => { if (o.userData.selectable) furniture = o; });
        if (!furniture) throw new Error(`Missing furniture ${p.id}`);
        furniture.removeFromParent(); furniture.userData = { ...furniture.userData, ...item, selectable: true };
        root.add(furniture); items.set(p.id, furniture);
      }));
      if (disposed) { releaseTracked(); return; }
      for (const [id, object] of items) {
        const placement = plan.find(p => p.id === id);
        object.visible = !!placement;
        if (placement) { object.position.set(placement.x, 0, placement.z); object.rotation.set(0, T.MathUtils.degToRad(placement.rotation), 0); object.scale.setScalar(1); }
      }
      root.traverse(o => { if (/Door swing clearance|Subtle wood grain|Throw stitched fold|Fine vertical oak fluting|Woven rug border/.test(o.name.replaceAll('_',' '))) o.visible = false; });
      // Preserve trim identity through the sibling pass; final frozen batching
      // will merge it separately using the explicit shadow flags below.
      stableJoinery.forEach(({ mesh }) => mesh.removeFromParent());
      batchStatic(root);
      stableJoinery.forEach(({ mesh, parent }) => parent.add(mesh));
      root.traverse(o => {
        if (o instanceof T.Mesh) {
          const list = (Array.isArray(o.material) ? o.material : [o.material]) as T.MeshStandardMaterial[];
          for (const material of list) {
            finishMaterial(material, surfaces, o.name);
            // A room-sized view needs quieter bump maps than a close product study.
            material.bumpScale *= .6;
            material.envMapIntensity = /metal|champagne|glass|steel/i.test(material.name) ? 1 : .65;
            if (material.userData.lampGlow) glowMaterials.push(material);
            if (/glazing|shower glass/i.test(material.name)) { material.transparent = true; material.opacity = .12; material.depthWrite = false; }
          }
          o.castShadow = !list.some(m => /glazing|shower glass|tailored seam/i.test(m.name)) && !/Shade seam|Woven rug border|Fine vertical oak fluting|Twig|Leaf/i.test(o.name.replaceAll('_',' ')); o.receiveShadow = true;
          if (o.userData.stableJoinery) { o.castShadow = false; o.receiveShadow = false; for (const material of list) { material.bumpMap = null; material.roughness = .86; material.metalness = 0; } }
          if (/TV glass/i.test(list[0]?.name)) { list[0].color.set('#162321'); list[0].roughness = .3; }
        }
      });
      // The door's broad planar surface needs neither bump sampling nor its own
      // shadow projection. This also eliminates moving self-shadow edge acne.
      entrance.traverse(object => { if (object instanceof T.Mesh) { object.castShadow = false; object.receiveShadow = false; } });
      oak.bumpMap = null; oak.bumpScale = 0;
      const prepared = new Set<T.MeshStandardMaterial>();
      root.traverse(o => { if (o instanceof T.Mesh) for (const material of (Array.isArray(o.material) ? o.material : [o.material]) as T.MeshStandardMaterial[]) {
        if (prepared.has(material)) continue; prepared.add(material);
        // Continuous solid surfaces replace the framework without screen-door noise.
        material.clippingPlanes = [revealPlane];

      } });
      topology = createSpatialTopology(root, mobile); scene.add(topology.group);
      // Placements are immutable for this player instance. Merge across nested
      // furniture groups after semantic material finishing and topology capture.
      root.updateMatrixWorld(true);
      const inverseRoot = root.matrixWorld.clone().invert();
      const frozen = new Map<string, T.Mesh[]>();
      root.traverse(object => {
        if (!(object instanceof T.Mesh) || object instanceof T.SkinnedMesh || Array.isArray(object.material) || object.material.transparent || Object.keys(object.geometry.morphAttributes).length) return;
        for (let parent: T.Object3D | null = object; parent; parent = parent.parent) if (!parent.visible) return;
        const attributes = Object.keys(object.geometry.attributes).sort().map(name => `${name}:${object.geometry.attributes[name].itemSize}`).join(',');
        const key = `${object.material.uuid}|${object.castShadow}|${object.receiveShadow}|${attributes}`;
        const bucket = frozen.get(key) ?? []; bucket.push(object); frozen.set(key, bucket);
      });
      let mergedSourceMeshes = 0, mergedDraws = 0;
      for (const objects of frozen.values()) {
        if (objects.length < 2) continue;
        const parts = objects.map(object => {
          const part = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
          part.applyMatrix4(new T.Matrix4().multiplyMatrices(inverseRoot, object.matrixWorld)); return part;
        });
        const merged = mergeGeometries(parts); parts.forEach(part => part.dispose());
        if (!merged) continue;
        const mesh = new T.Mesh(merged, objects[0].material); mesh.name = 'Frozen interior surfaces';
        mesh.castShadow = objects[0].castShadow; mesh.receiveShadow = objects[0].receiveShadow;
        objects.forEach(object => object.removeFromParent()); root.add(mesh);
        mergedSourceMeshes += objects.length; mergedDraws++;
      }
      container!.dataset.mergedSourceMeshes = String(mergedSourceMeshes);
      container!.dataset.mergedDraws = String(mergedDraws);
      scene.add(root); track(root);
      for (const id of ['F18', 'F11', 'F12', 'F15']) {
        const furniture = items.get(id); if (!furniture?.visible) continue;
        const lamp = new T.PointLight('#ffc88e', 0, 4, 2);
        furniture.updateWorldMatrix(true, false);
        lamp.position.copy(furniture.localToWorld(new T.Vector3(id === 'F15' ? .42 : 0, id === 'F18' ? 1.47 : id === 'F15' ? 1.09 : .77, 0)));
        scene.add(lamp); practicals.push(lamp);
      }
      scene.updateMatrixWorld(true); renderer.shadowMap.needsUpdate = true;
      // Compile before playback so the reveal never waits on its first material frame.
      camera.position.copy(entryStart); camera.lookAt(4.2, 0, 3);
      if (renderer.extensions.has('KHR_parallel_shader_compile')) await renderer.compileAsync(scene, camera);
      if (disposed) return;
      loaded = true; live.current.onReady();
    }
    function releaseTracked() { geometry.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); }
    let pointer: { id: number; x: number; y: number } | null = null, yaw = 0, pitch = 0;
    const down = (event: PointerEvent) => { if (!loaded) return; pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }; renderer.domElement.setPointerCapture(event.pointerId); live.current.onPause(); };
    const move = (event: PointerEvent) => { if (!pointer || pointer.id !== event.pointerId) return; yaw = T.MathUtils.clamp(yaw - (event.clientX - pointer.x) * .003, -1.1, 1.1); pitch = T.MathUtils.clamp(pitch - (event.clientY - pointer.y) * .002, -.3, .3); pointer.x = event.clientX; pointer.y = event.clientY; };
    const up = () => { pointer = null; };
    const lost = (event: Event) => { event.preventDefault(); live.current.onError(); };
    renderer.domElement.addEventListener('pointerdown', down); renderer.domElement.addEventListener('pointermove', move);
    renderer.domElement.addEventListener('pointerup', up); renderer.domElement.addEventListener('pointercancel', up); renderer.domElement.addEventListener('webglcontextlost', lost);
    const from = new T.Vector3(), to = new T.Vector3(), target = new T.Vector3();
    function animate(now: number) {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      if (document.hidden || !loaded || live.current.paused) { lastTime = now; return; }
      // Avoid doing two full-screen passes at 120 Hz on high-refresh phones.
      if (now - lastTime < 1000 / (mobile ? 30 : 60) - .5) return;
      lastTime = now;
      const current = live.current, seconds = current.clock.current, entering = !current.reduced && seconds < ENTRY_DURATION;
      const { index, progress } = tourFrame(Math.max(0, seconds - ENTRY_DURATION), current.shots.length), shot = current.shots[index];
      if (index !== previousRoom) { previousRoom = index; yaw = 0; pitch = 0; }
      const dt = Math.min(.05, (now - previousNow) / 1000 || .016); previousNow = now;
      const t = current.reduced ? .5 : smootherstep(progress);
      const reveal = spatialReveal(seconds, current.reduced);
      structureBlend = current.reduced ? Number(!!current.structure) : T.MathUtils.damp(structureBlend, Number(!!current.structure), 7, dt);
      const eveningTarget = current.lighting === 'evening' ? 1 : 0;
      lightBlend = lightBlend < 0 || current.reduced ? eveningTarget : T.MathUtils.damp(lightBlend, eveningTarget, 4, dt);
      const signature = `${index}|${entering ? seconds.toFixed(5) : t.toFixed(5)}|${yaw}|${pitch}|${lightBlend.toFixed(4)}|${structureBlend.toFixed(4)}`;
      if (!dirty && signature === previousFrame) return;
      previousFrame = signature; dirty = false;
      from.fromArray(shot.from); to.fromArray(shot.to);
      if (entering) {
        const p = reveal.travel, inverse = 1 - p;
        entryMiddle.set(from.x + .7, 3.6, from.z + 2);
        camera.position.copy(entryStart).multiplyScalar(inverse * inverse).addScaledVector(entryMiddle, 2 * inverse * p).addScaledVector(from, p * p);
        target.set(4.2, .4, 3).lerp(to.fromArray(shot.target), p);
      } else { camera.position.lerpVectors(from, to, t); target.fromArray(shot.target); }
      // Level optical axis preserves architectural verticals. A small film shift
      // includes the furniture without tilting the camera down at the floor.
      const lens = entering ? T.MathUtils.lerp(48, shot.fov, reveal.travel) : shot.fov;
      camera.fov = mobile ? Math.min(91, 2 * Math.atan(Math.tan(T.MathUtils.degToRad(lens / 2)) / Math.max(.72, camera.aspect)) * 180 / Math.PI) : lens;
      camera.setViewOffset(container!.clientWidth, container!.clientHeight, 0, container!.clientHeight * shot.shift * (entering ? reveal.travel : 1), container!.clientWidth, container!.clientHeight);
      camera.lookAt(target); camera.rotateY(yaw); camera.rotateX(pitch);
      revealPlane.constant = entering ? -.1 + reveal.surface * 3.4 : 100;
      ceiling.visible = !entering || reveal.travel > .985;
      decor.visible = !entering || reveal.surface >= .999;
      exterior.visible = !entering || reveal.surface > .85;
      grid.visible = entering; gridMaterial.opacity = reveal.wire * .35;
      if (topology) { topology.group.visible = reveal.wire > .002 || structureBlend > .002; topology.material.opacity = Math.max(reveal.wire * .62, structureBlend * .32); topology.group.position.y = entering ? (1 - reveal.surface) * .55 : 0; }
      container!.dataset.room = shot.id; container!.dataset.cameraPosition = camera.position.toArray().map(n => n.toFixed(3)).join(',');
      container!.dataset.visibleFurniture = plan.map(p => p.id).join(',');
      const evening = lightBlend;
      landscapeMaterials.forEach((material, i) => material.color.set(['#bdced0', '#a3bab7', '#809e90'][i]).lerp(eveningSky, evening * .72));
      sun.color.set('#fff0d9').lerp(coolSun, evening); sun.intensity = T.MathUtils.lerp(2.8, .24, evening);
      ambient.intensity = T.MathUtils.lerp(.55, .26, evening); scene.environmentIntensity = T.MathUtils.lerp(.48, .27, evening);
      windows.forEach((light, i) => { light.visible = i === (index < 2 ? 0 : index - 1); light.color.set('#eef3ff').lerp(coolWindow, evening); light.intensity = T.MathUtils.lerp(4.8, 1.2, evening); });
      practicals.forEach(light => { light.intensity = T.MathUtils.lerp(.16, 2.2, evening); });
      ceilingLights.forEach((light, i) => { light.visible = i === index; light.intensity = T.MathUtils.lerp(.8, 3.5, evening); });
      diffuser.emissiveIntensity = T.MathUtils.lerp(.15, 1.1, evening);
      glowMaterials.forEach(material => { material.emissiveIntensity = T.MathUtils.lerp(.03, .65, evening); });
      (scene.background as T.Color).set('#dce4e6').lerp(eveningSky, evening).lerp(digitalSky, entering ? 1 - reveal.surface : structureBlend * .35);
      renderer.toneMappingExposure = T.MathUtils.lerp(1.05, 1.13, evening);
      if (previousLight !== current.lighting || previousCeiling !== ceiling.visible) { previousLight = current.lighting; previousCeiling = ceiling.visible; renderer.shadowMap.needsUpdate = true; }
      budget(now, previousFrame !== signature || entering || progress > 0 && progress < 1);
      renderer.render(scene, camera);
      container!.dataset.renderCount = String(Number(container!.dataset.renderCount ?? 0) + 1);
      container!.dataset.drawCalls = String(renderer.info.render.calls);
      container!.dataset.pixelRatio = renderer.getPixelRatio().toFixed(2);
      container!.dataset.closedEntrance = 'true';
      container!.dataset.phase = entering ? 'reveal' : 'interior';
    }
    loadScene().catch(error => { if (!disposed) { console.error('Interior tour could not load', error); live.current.onError(); } });
    frame = requestAnimationFrame(animate);
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', down); renderer.domElement.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('pointerup', up); renderer.domElement.removeEventListener('pointercancel', up); renderer.domElement.removeEventListener('webglcontextlost', lost);
      topology?.dispose(); grid.geometry.dispose(); gridMaterial.dispose(); releaseTracked(); surfaces.dispose(); environment.dispose(); sun.shadow.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, [props.placements, props.shots]);
  return <div ref={host} className={styles.scene} data-testid="interior-scene" />;
}
