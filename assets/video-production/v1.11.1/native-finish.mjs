import * as T from 'three';
/** Small shared surface maps: deterministic, subtle, and generated once per canvas. */
export function createSurfaceMaps(anisotropy) {
    const size = 256;
    function texture(kind) {
        const data = new Uint8Array(size * size * 4);
        let seed = 41;
        for (let y = 0; y < size; y++)
            for (let x = 0; x < size; x++) {
                seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
                const noise = seed / 4294967296 - .5;
                const signal = kind === 'grain'
                    ? Math.sin(y * .38 + Math.sin(x * Math.PI * 2 / size) * 1.2) * .15 + Math.sin(y * .91 + x * .012) * .035 + noise * .05
                    : kind === 'weave' ? (Math.cos(x * Math.PI / 2) + Math.cos(y * Math.PI / 2)) * .08 + noise * .08 : noise * .15;
                const value = Math.round(210 + signal * 65), i = (y * size + x) * 4;
                data[i] = data[i + 1] = data[i + 2] = value;
                data[i + 3] = 255;
            }
        const map = new T.DataTexture(data, size, size);
        map.wrapS = map.wrapT = T.RepeatWrapping;
        map.minFilter = T.LinearMipmapLinearFilter;
        map.magFilter = T.LinearFilter;
        map.generateMipmaps = true;
        map.anisotropy = anisotropy;
        map.repeat.set(kind === 'grain' ? 1.5 : 2, kind === 'grain' ? 1.5 : 2);
        map.needsUpdate = true;
        return map;
    }
    const grain = texture('grain'), weave = texture('weave'), plaster = texture('plaster');
    const contactData = new Uint8Array(64 * 64 * 4);
    for (let y = 0; y < 64; y++)
        for (let x = 0; x < 64; x++) {
            const dx = Math.abs((x + .5) / 32 - 1), dy = Math.abs((y + .5) / 32 - 1);
            const falloff = Math.exp(-3.5 * (Math.pow(dx, 4) + Math.pow(dy, 4)));
            const edge = (1 - T.MathUtils.smoothstep(dx, .65, 1)) * (1 - T.MathUtils.smoothstep(dy, .65, 1));
            const i = (y * 64 + x) * 4;
            contactData[i] = contactData[i + 1] = contactData[i + 2] = 255;
            contactData[i + 3] = Math.round(falloff * edge * 255);
        }
    const contact = new T.DataTexture(contactData, 64, 64);
    contact.magFilter = T.LinearFilter;
    contact.minFilter = T.LinearFilter;
    contact.needsUpdate = true;
    return { grain, weave, plaster, contact, dispose() { grain.dispose(); weave.dispose(); plaster.dispose(); contact.dispose(); } };
}
export function finishMaterial(material, maps, meshName) {
    meshName = meshName.replaceAll('_', ' ');
    const name = material.name;
    if (/Warm natural oak/.test(name)) {
        material.color.set('#b59470');
        material.roughness = .46;
    }
    else if (/Oak end grain/.test(name)) {
        material.color.set('#8a6a4c');
        material.roughness = .64;
    }
    else if (/Oak board/.test(name)) {
        const index = Number(name.match(/\d+/)?.[0] ?? 0);
        material.color.set('#c8b294').multiplyScalar(.97 + index * .008);
        material.roughness = .61;
    }
    else if (/Ivory linen/.test(name)) {
        material.color.set('#e0d8ca');
        material.roughness = .92;
    }
    else if (/Washed cotton/.test(name)) {
        material.color.set('#e4ded3');
        material.roughness = 1;
    }
    else if (/Sage woven/.test(name)) {
        material.color.set('#75847c');
        material.roughness = .92;
    }
    else if (/Oatmeal wool/.test(name)) {
        material.color.set('#c7bdad');
        material.roughness = 1;
    }
    else if (/Chalk plaster/.test(name)) {
        material.color.set('#ece8df');
        material.roughness = .92;
    }
    else if (/Unfinished concrete/.test(name)) {
        material.color.set('#c4c5bc');
        material.roughness = 1;
    }
    else if (/Honed limestone/.test(name)) {
        material.color.set('#ccc8bb');
        material.roughness = .79;
    }
    else if (/Brushed champagne/.test(name)) {
        material.color.set('#ae9e83');
        material.roughness = .34;
        material.metalness = .78;
    }
    else if (/Charcoal metal/.test(name)) {
        material.color.set('#282e30');
        material.roughness = .32;
        material.metalness = .7;
    }
    else if (/Warm white ceramic/.test(name)) {
        material.color.set('#eeebe2');
        material.roughness = .3;
    }
    else if (/Window frame/.test(name)) {
        material.color.set('#d9d9cf');
        material.roughness = .46;
    }
    else if (/Pale blue glazing/.test(name)) {
        material.color.set('#b6c8c6');
        material.roughness = .22;
        material.metalness = .12;
    }
    if (/oak/i.test(name)) {
        material.bumpMap = maps.grain;
        material.bumpScale = .00035;
        material.roughnessMap = null;
    }
    else if (/linen|cotton|woven|wool/i.test(name)) {
        material.bumpMap = maps.weave;
        material.bumpScale = .0005;
    }
    else if (/plaster|concrete|limestone/i.test(name)) {
        material.bumpMap = maps.plaster;
        material.bumpScale = .00025;
    }
    if (/Duvet|Cotton pillow/i.test(meshName)) {
        material.roughness = .98;
        material.bumpMap = maps.weave;
        material.bumpScale = .0005;
    }
    if (/Olive leaves/.test(name)) {
        material.color.set('#496251');
        material.roughness = .8;
    }
    if (/Light leaves/.test(name)) {
        material.color.set('#7e9373');
        material.roughness = .83;
    }
    if (material.aoMap)
        material.aoMapIntensity = .55;
    if (/lampshade|Pleated shade|Warm diffuser/i.test(meshName)) {
        material.emissive.set('#ffd7a1');
        material.emissiveIntensity = 0;
        material.userData.lampGlow = true;
    }
    // Keep the slightly darker Blender welt visible after applying the site palette.
    if (/tailored seam/.test(name))
        material.color.multiplyScalar(.9);
    material.envMapIntensity = /metal|champagne|glass|steel/i.test(name) ? .8 : .42;
}
