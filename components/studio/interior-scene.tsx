'use client';

import { useEffect, useRef, type RefObject } from 'react';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { studioInventory, type Placement } from '@/lib/studio-data';
import { isStaged } from '@/lib/studio-placement';
import { tourFrame, type TourShot } from '@/lib/interior-tour';
import { createSurfaceMaps, finishMaterial } from './scene-finish';
import { batchStatic } from './scene-geometry';
import styles from './interior-tour.module.css';

type Props = { placements: Placement[]; shots: TourShot[]; clock: RefObject<number>; lighting: 'day' | 'evening'; reduced: boolean; paused?: boolean; onReady: () => void; onPause: () => void; onError: () => void; label: string };

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.AgXToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.domElement.setAttribute('aria-label', live.current.label);
    renderer.domElement.style.touchAction = 'none';
    container.appendChild(renderer.domElement);
    const scene = new T.Scene();
    scene.background = new T.Color('#dce4e6');
    const camera = new T.PerspectiveCamera(58, 1, .045, 65);
    const geometry = new Set<T.BufferGeometry>(), materials = new Set<T.Material>(), textures = new Set<T.Texture>();
    function track(root: T.Object3D) { root.traverse(o => { if (o instanceof T.Mesh) { geometry.add(o.geometry); for (const m of Array.isArray(o.material) ? o.material : [o.material]) { materials.add(m); for (const v of Object.values(m)) if (v instanceof T.Texture) textures.add(v); } } }); }
    const surfaces = createSurfaceMaps(Math.min(renderer.capabilities.getMaxAnisotropy(), 8));
    const pmrem = new T.PMREMGenerator(renderer), room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture;
    scene.environmentIntensity = .42;
    room.dispose(); pmrem.dispose();
    const ambient = new T.HemisphereLight('#e9eff8', '#b3a68e', .65);
    scene.add(ambient);
    const sun = new T.DirectionalLight('#fff1d9', 3.2);
    sun.position.set(-3, 4.8, -7); sun.target.position.set(4, 0, 3);
    sun.castShadow = true; sun.shadow.mapSize.set(mobile ? 1536 : 2048, mobile ? 1536 : 2048);
    Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: .1, far: 24 });
    sun.shadow.normalBias = .035; sun.shadow.bias = -.0003; sun.shadow.radius = 4;
    scene.add(sun, sun.target);
    RectAreaLightUniformsLib.init();
    const windows: T.RectAreaLight[] = [];
    for (const [x, z, width, targetZ] of [[1.8, -.05, 3, 3], [6.3, .4, 3.4, 3], [6.9, 6.2, 2.4, 3]]) {
      const light = new T.RectAreaLight('#eef3ff', 4.5, width, 1.55);
      light.position.set(x, 1.65, z); light.lookAt(x, 1.1, targetZ); scene.add(light); windows.push(light);
    }
    const practicals: T.PointLight[] = [];
    const glowMaterials: T.MeshStandardMaterial[] = [];
    const ceiling = new T.Mesh(new T.BoxGeometry(8.4, .06, 6.15), new T.MeshStandardMaterial({ color: '#e9e5dc', roughness: .95 }));
    ceiling.position.set(4.2, 2.59, 3.075); ceiling.receiveShadow = true; ceiling.castShadow = true; scene.add(ceiling); track(ceiling);
    // A pair of restrained prints gives the blank kitchen partition a visual anchor.
    const frameOak = new T.MeshStandardMaterial({ color: '#8e775c', roughness: .6 });
    const artPaper = new T.MeshStandardMaterial({ color: '#f0eadd', roughness: 1 });
    const artSage = new T.MeshStandardMaterial({ color: '#8d9785', roughness: 1 });
    const artSand = new T.MeshStandardMaterial({ color: '#c6ad8c', roughness: 1 });
    for (const x of [1.05, 1.64]) {
      const print = new T.Group(); print.position.set(x, 1.68, 1.48);
      const frame = new T.Mesh(new T.BoxGeometry(.46, .62, .035), frameOak); print.add(frame);
      const paper = new T.Mesh(new T.BoxGeometry(.42, .58, .006), artPaper); paper.position.z = .02; print.add(paper);
      const block = new T.Mesh(new T.PlaneGeometry(.24, .25), artSage); block.position.set(-.035, -.09, .024); print.add(block);
      const circle = new T.Mesh(new T.CircleGeometry(.115, 48), artSand); circle.position.set(.035, .105, .025); print.add(circle);
      scene.add(print); track(print);
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
      scene.add(group); track(group);
      const light = new T.RectAreaLight('#ffe3b4', 1.2, pendant ? .8 : 1.1, pendant ? .8 : 1.1);
      light.position.set(x, group.position.y - .12, z); light.lookAt(x, 0, z); scene.add(light); ceilingLights.push(light);
    }
    addCeilingLight(1.85, 2.75);
    const dining = props.placements.find(p => ['N02', 'F04'].includes(p.id) && !isStaged(p));
    addCeilingLight(dining?.x ?? 2.05, dining?.z ?? 5.05, true);
    addCeilingLight(6.15, 1.8); addCeilingLight(6.95, 4.7);
    // Soft bounced ceiling light belongs inside the shell, not above its roof.
    for (const [x, z] of [[1.7, 2.8], [6.2, 1.8], [6.9, 4.7]]) {
      const bounce = new T.RectAreaLight('#fff4e4', 1.5, 2, 1.8);
      bounce.position.set(x, 2.48, z); bounce.lookAt(x, 0, z); scene.add(bounce);
    }
    // The second render is a lightweight contact-shading pass, with denoising.
    const supportsHDR = renderer.extensions.has('EXT_color_buffer_float');
    const composer = new EffectComposer(renderer, new T.WebGLRenderTarget(1, 1, { type: supportsHDR ? T.HalfFloatType : T.UnsignedByteType }));
    const renderPass = new RenderPass(scene, camera), ao = new GTAOPass(scene, camera), output = new OutputPass(), fxaa = new ShaderPass(FXAAShader);
    ao.blendIntensity = .8;
    ao.updateGtaoMaterial({ radius: .35, thickness: .7, samples: mobile ? 8 : 12, distanceFallOff: 1 });
    ao.updatePdMaterial({ radius: 4, samples: mobile ? 8 : 16 });
    ao.enabled = supportsHDR && !mobile;
    composer.addPass(renderPass); composer.addPass(ao); composer.addPass(output); composer.addPass(fxaa);
    function resize() {
      const width = container!.clientWidth, height = container!.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height; camera.fov = live.current.shots[Math.max(0, previousRoom)]?.fov ?? 58; camera.updateProjectionMatrix();
      dirty = true;
      renderer.setSize(width, height, false); composer.setSize(width, height);
      const ratio = renderer.getPixelRatio(); fxaa.uniforms.resolution.value.set(1 / (width * ratio), 1 / (height * ratio));
    }
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    const loader = new GLTFLoader();
    const plan = props.placements.filter(p => !isStaged(p));
    async function loadScene() {
      const gltf = await loader.loadAsync('/models/v2/new-home-a.glb');
      track(gltf.scene);
      if (disposed) { releaseTracked(); return; }
      const root = gltf.scene;
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
      root.traverse(o => { if (/Door swing clearance|Subtle wood grain|Throw stitched fold|Fine vertical oak fluting/.test(o.name)) o.visible = false; });
      batchStatic(root);
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
          o.castShadow = !list.some(m => /glazing|shower glass|tailored seam/i.test(m.name)) && !/Shade seam|Woven rug border|Fine vertical oak fluting/i.test(o.name); o.receiveShadow = true;
          if (/TV glass/i.test(list[0]?.name)) { list[0].color.set('#162321'); list[0].roughness = .3; }
        }
      });
      // Preserve material identities while reducing thousands of decorative draws.
      scene.add(root); track(root);
      for (const id of ['F18', 'F11', 'F12', 'F15']) {
        const furniture = items.get(id); if (!furniture?.visible) continue;
        const lamp = new T.PointLight('#ffc88e', 0, 4, 2);
        furniture.updateWorldMatrix(true, false);
        lamp.position.copy(furniture.localToWorld(new T.Vector3(id === 'F15' ? .42 : 0, id === 'F18' ? 1.47 : id === 'F15' ? 1.09 : .77, 0)));
        scene.add(lamp); practicals.push(lamp);
      }
      scene.updateMatrixWorld(true); renderer.shadowMap.needsUpdate = true;
      loaded = true; live.current.onReady();
    }
    function releaseTracked() { geometry.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); }
    let pointer: { id: number; x: number; y: number } | null = null, yaw = 0, pitch = 0;
    const down = (event: PointerEvent) => { if (!loaded) return; pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }; renderer.domElement.setPointerCapture(event.pointerId); live.current.onPause(); };
    const move = (event: PointerEvent) => { if (!pointer || pointer.id !== event.pointerId) return; yaw = T.MathUtils.clamp(yaw - (event.clientX - pointer.x) * .003, -.6, .6); pitch = T.MathUtils.clamp(pitch - (event.clientY - pointer.y) * .002, -.2, .2); pointer.x = event.clientX; pointer.y = event.clientY; };
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
      if (now - lastTime < 1000 / 30 - .5) return;
      lastTime = now;
      const current = live.current, { index, progress } = tourFrame(current.clock.current, current.shots.length), shot = current.shots[index];
      if (index !== previousRoom) { previousRoom = index; yaw = 0; pitch = 0; }
      const t = current.reduced ? .5 : progress * progress * (3 - 2 * progress);
      const signature = `${index}|${t.toFixed(5)}|${yaw}|${pitch}|${current.lighting}`;
      if (!dirty && signature === previousFrame) return;
      previousFrame = signature; dirty = false;
      camera.position.lerpVectors(from.fromArray(shot.from), to.fromArray(shot.to), t);
      // Level optical axis preserves architectural verticals. A small film shift
      // includes the furniture without tilting the camera down at the floor.
      camera.fov = shot.fov;
      camera.setViewOffset(container!.clientWidth, container!.clientHeight, 0, container!.clientHeight * shot.shift, container!.clientWidth, container!.clientHeight);
      camera.lookAt(target.fromArray(shot.target)); camera.rotateY(yaw); camera.rotateX(pitch);
      container!.dataset.room = shot.id; container!.dataset.cameraPosition = camera.position.toArray().map(n => n.toFixed(3)).join(',');
      container!.dataset.visibleFurniture = plan.map(p => p.id).join(',');
      if (previousLight !== current.lighting) {
        previousLight = current.lighting; const evening = current.lighting === 'evening';
        sun.color.set(evening ? '#ffd4a0' : '#fff1d9'); sun.intensity = evening ? 1 : 4;
        ambient.intensity = evening ? .3 : .55; scene.environmentIntensity = evening ? .25 : .45;
        windows.forEach(light => { light.color.set(evening ? '#a9bbdc' : '#eef3ff'); light.intensity = evening ? 2 : 6; });
        practicals.forEach(light => { light.intensity = evening ? 3 : .3; });
        ceilingLights.forEach(light => { light.intensity = evening ? 5 : 1.2; });
        diffuser.emissiveIntensity = evening ? 1.6 : .35;
        glowMaterials.forEach(material => { material.emissiveIntensity = evening ? .8 : .06; });
        scene.background = new T.Color(evening ? '#7a899f' : '#dce4e6'); renderer.toneMappingExposure = evening ? 1.05 : .95;
        renderer.shadowMap.needsUpdate = true;
      }
      composer.render();
      container!.dataset.renderCount = String(Number(container!.dataset.renderCount ?? 0) + 1);
    }
    loadScene().catch(error => { if (!disposed) { console.error('Interior tour could not load', error); live.current.onError(); } });
    frame = requestAnimationFrame(animate);
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', down); renderer.domElement.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('pointerup', up); renderer.domElement.removeEventListener('pointercancel', up); renderer.domElement.removeEventListener('webglcontextlost', lost);
      ao.dispose(); output.dispose(); fxaa.dispose(); renderPass.dispose(); composer.dispose();
      releaseTracked(); surfaces.dispose(); environment.dispose(); sun.shadow.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, [props.placements, props.shots]);
  return <div ref={host} className={styles.scene} data-testid="interior-scene" />;
}
