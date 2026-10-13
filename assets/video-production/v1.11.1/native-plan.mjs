import * as T from 'three';import {demoBlueprint,constructionFrame} from './blueprint.mjs';
export function createNativePlan(){const container={clientWidth:1920,clientHeight:1080,dataset:{}};const host={current:container};const live={current:{progress:0,reduced:false,onReady(){}}};const renderPixelRatio=()=>1;const setFailed=()=>{};let renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
let disposed = false, frameId = 0, last = 0, lastDraw = 0, displayed = 0, previousSignature = '';
const mobile = matchMedia('(max-width:740px)').matches;
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.65));
renderer.setClearColor('#fafaf7');
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
renderer.toneMapping = T.AgXToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.domElement.setAttribute('aria-label', 'Floor plan reconstruction: flat wall lines rise into a three-dimensional home');
const scene = new T.Scene(), camera = new T.OrthographicCamera(-7, 7, 6, -6, .1, 80);
const root = new T.Group();
root.position.set(-4.3, 0, -2.9);
scene.add(root);
scene.add(new T.HemisphereLight('#fffefb', '#c8cccd', 1.8));
const sun = new T.DirectionalLight('#fff7e9', 3);
sun.position.set(-4, 12, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: .1, far: 40 });
sun.shadow.normalBias = .015;
sun.shadow.intensity = .35;
scene.add(sun);
const ground = new T.Mesh(new T.PlaneGeometry(26, 26), new T.MeshBasicMaterial({ color: '#fafaf7', toneMapped: false }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -.07;
scene.add(ground);
const contact = new T.Mesh(new T.PlaneGeometry(26, 26), new T.ShadowMaterial({ opacity: .09 }));
contact.rotation.x = -Math.PI / 2;
contact.position.y = -.06;
contact.receiveShadow = true;
scene.add(contact);
const grid = new T.GridHelper(22, 44, '#cdd4c8', '#dce0d5');
grid.position.y = -.045;
grid.material.transparent = true;
grid.material.opacity = .55;
scene.add(grid);
const texture = new T.TextureLoader().load('/public/plans/northern-demo-a-2d.svg', () => { if (disposed) {
    texture.dispose();
    return;
} live.current.onReady(); }, undefined, () => { if (!disposed) {
    setFailed(true);
    live.current.onReady();
} });
texture.colorSpace = T.SRGBColorSpace;
texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
const paperMaterial = new T.MeshBasicMaterial({ map: texture, transparent: true, side: T.DoubleSide, toneMapped: false });
const paper = new T.Mesh(new T.PlaneGeometry(demoBlueprint.width + 1.3, demoBlueprint.depth + 1.7), paperMaterial);
paper.rotation.x = -Math.PI / 2;
paper.position.set(demoBlueprint.width / 2, -.018, demoBlueprint.depth / 2);
paper.receiveShadow = true;
root.add(paper);
const wallMaterial = new T.MeshStandardMaterial({ color: '#e6eadd', roughness: .86 });
const edgeMaterial = new T.LineBasicMaterial({ color: '#439aa9', transparent: true, opacity: .75 });
const glassMaterial = new T.MeshStandardMaterial({ color: '#a6c7c4', transparent: true, opacity: .28, roughness: .18, side: T.DoubleSide });
const frameMaterial = new T.MeshStandardMaterial({ color: '#b5c5b6', roughness: .7 });
const walls = [];
for (const w of demoBlueprint.walls) {
    const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], length = Math.hypot(dx, dz), rear = !!w.exterior && w.a[1] === w.b[1] && w.a[1] <= .48;
    const group = new T.Group();
    group.position.set((w.a[0] + w.b[0]) / 2, 0, (w.a[1] + w.b[1]) / 2);
    group.rotation.y = -Math.atan2(dz, dx);
    group.visible = false;
    root.add(group);
    const parts = [], windows = [];
    function part(width, height, x, bottom) { if (width <= 0)
        return; const mesh = new T.Mesh(new T.BoxGeometry(width, height, .12), wallMaterial); mesh.position.set(x, bottom + height / 2, 0); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); mesh.add(new T.LineSegments(new T.EdgesGeometry(mesh.geometry), edgeMaterial)); parts.push({ mesh, bottom, height, cut: rear ? 2.55 : .7 }); }
    if (w.door) {
        const [at, width] = w.door, left = at - width / 2, right = at + width / 2;
        part(left, 2.55, -length / 2 + left / 2, 0);
        part(length - right, 2.55, -length / 2 + (right + length) / 2, 0);
        part(width, .42, -length / 2 + at, 2.13);
    }
    else if (w.window && length > 1.2) {
        const width = length - .38;
        part(.19, 2.55, -length / 2 + .095, 0);
        part(.19, 2.55, length / 2 - .095, 0);
        part(width, .84, 0, 0);
        part(width, .32, 0, 2.23);
        const window = new T.Group();
        group.add(window);
        windows.push(window);
        const pane = new T.Mesh(new T.BoxGeometry(width, 1.36, .02), glassMaterial);
        pane.position.y = 1.52;
        window.add(pane);
        for (let i = 0; i <= Math.ceil(width / .8); i++) {
            const bar = new T.Mesh(new T.BoxGeometry(.026, 1.4, .05), frameMaterial);
            bar.position.set(-width / 2 + i * width / Math.ceil(width / .8), 1.52, 0);
            window.add(bar);
        }
        for (const y of [.82, 2.22]) {
            const bar = new T.Mesh(new T.BoxGeometry(width, .03, .06), frameMaterial);
            bar.position.y = y;
            window.add(bar);
        }
    }
    else
        part(length, 2.55, 0, 0);
    walls.push({ group, parts, windows, rear });
}
const vertices = new Float32Array(demoBlueprint.walls.flatMap(w => [w.a[0], .008, w.a[1], w.b[0], .008, w.b[1]]));
const finalPlaster = new T.Color('#eeeae0'), targetPoint = new T.Vector3(), finish = new T.Spherical().setFromVector3(new T.Vector3(9.2, 10.95, 13.5));
const traceGeometry = new T.BufferGeometry();
traceGeometry.setAttribute('position', new T.BufferAttribute(vertices, 3));
const traceMaterial = new T.LineBasicMaterial({ color: '#4b9674', transparent: true, opacity: 1 });
const trace = new T.LineSegments(traceGeometry, traceMaterial);
root.add(trace);
const sweepMaterial = new T.MeshBasicMaterial({ color: '#6cad8c', transparent: true, opacity: .16, depthWrite: false, side: T.DoubleSide });
const sweep = new T.Mesh(new T.PlaneGeometry(.075, 7.1), sweepMaterial);
sweep.rotation.x = -Math.PI / 2;
sweep.position.y = .012;
root.add(sweep);
let ratio = 1, width = 1, height = 1;
function resize() { width = container.clientWidth; height = container.clientHeight; if (!width || !height)
    return; ratio = width / height; renderer.setPixelRatio(renderPixelRatio(width, height, devicePixelRatio, mobile)); renderer.setSize(width, height, false); previousSignature = ''; }
const observer = new ResizeObserver(() => { });
resize();
function animate(now) {
    if (disposed)
        return;
    const dt = Math.min(.05, (now - last) / 1000 || .016);
    last = now;
    lastDraw = now;
    const target = live.current.progress ?? 0;
    displayed = target;
    if (target === 0)
        displayed = 0;
    const signature = displayed.toFixed(4) + ':' + width + ':' + height;
    if (signature === previousSignature)
        return;
    previousSignature = signature;
    const state = constructionFrame(displayed);
    let maxHeight = 0;
    walls.forEach((w, index) => {
        const rise = state.rise(index, walls.length);
        w.group.visible = rise > .001;
        w.group.scale.y = Math.max(.001, rise);
        for (const p of w.parts) {
            const cut = Math.max(0, Math.min(p.height, p.cut - p.bottom));
            const h = T.MathUtils.lerp(p.height, cut, state.settle);
            p.mesh.visible = h > .002;
            p.mesh.scale.y = Math.max(.001, h / p.height);
            p.mesh.position.y = p.bottom + h / 2;
            maxHeight = Math.max(maxHeight, (p.bottom + h) * rise);
        }
        for (const window of w.windows)
            window.visible = rise > .3 && (w.rear || state.settle < .75);
    });
    edgeMaterial.opacity = .78 * (1 - state.settle);
    wallMaterial.color.set('#dce8e7').lerp(finalPlaster, state.settle);
    paperMaterial.opacity = 1 - state.settle * .12;
    grid.material.opacity = .2 * (1 - state.settle * .65);
    traceGeometry.setDrawRange(0, Math.floor(state.trace * vertices.length / 6) * 2);
    traceMaterial.opacity = (live.current.progress === undefined ? 0 : 1) * (1 - state.tilt * .65);
    sweep.visible = target > 0 && displayed < .24;
    sweep.position.set(-.3 + state.trace * 9, .012, 3.05);
    const span = T.MathUtils.lerp(Math.max(13.7, 11 / ratio), Math.max(10.9, 13.4 / ratio), state.tilt);
    camera.left = -span * ratio / 2;
    camera.right = span * ratio / 2;
    camera.top = span / 2;
    camera.bottom = -span / 2;
    camera.updateProjectionMatrix();
    targetPoint.set(0, state.tilt * .35, T.MathUtils.lerp(-.65, 0, state.tilt));
    camera.position.setFromSphericalCoords(T.MathUtils.lerp(20, finish.radius, state.tilt), T.MathUtils.lerp(.00005, finish.phi, state.tilt), finish.theta * state.tilt).add(targetPoint);
    camera.lookAt(targetPoint);
    renderer.shadowMap.needsUpdate = true;
    container.dataset.progress = displayed.toFixed(3);
    container.dataset.maxWallHeight = maxHeight.toFixed(3);
    container.dataset.view = state.tilt === 0 ? '2d' : 'rising';
    renderer.render(scene, camera);
}

return {canvas:renderer.domElement,render(p){live.current.progress=p;animate(p*10000+100000);}};}
