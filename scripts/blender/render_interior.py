"""Render exact studio arrangements and level architectural camera shots with Cycles.
Run: node scripts/render-interior.cjs [--layout a] [--room living] [--samples 64]
No downloads: furniture, room geometry and generated surface materials are local.
"""
import argparse
import json
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
sys.dont_write_bytecode = True
sys.path.insert(0,str(Path(__file__).resolve().parent))
from interior_surfaces import prepare as prepare_surfaces
args = argparse.ArgumentParser()
args.add_argument('--jobs', required=True)
args.add_argument('--layout')
args.add_argument('--room')
args.add_argument('--samples', type=int, default=96)
args.add_argument('--width', type=int, default=1600)
args.add_argument('--day-only', action='store_true')
args.add_argument('--cpu', action='store_true')
args.add_argument('--skip-existing', action='store_true')
options = args.parse_args(sys.argv[sys.argv.index('--') + 1:])
output = Path(options.jobs).parent
jobs = json.loads(Path(options.jobs).read_text())

def render_version(shot, lighting):
    return 32 if lighting == 'evening' else 33 if shot['id'] == 'bedroom' else 31

def coordinate(p): return Vector((p[0], -p[2], p[1]))
def aim(obj, point): obj.rotation_euler = (Vector(point) - obj.location).to_track_quat('-Z', 'Y').to_euler()
def cube(name, loc, scale, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object; obj.name = name; obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel = obj.modifiers.new('Edge highlights', 'BEVEL'); bevel.width = .008; bevel.segments = 3
    obj.data.materials.append(material)
    return obj

def mat(name, color, metal=0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = .55; p.inputs['Metallic'].default_value = metal
    return m

def area(name, loc, target, energy, size, color):
    light = bpy.data.lights.new(name, 'AREA'); light.energy = energy; light.shape = 'DISK'; light.size = size; light.color = color
    obj = bpy.data.objects.new(name, light); bpy.context.collection.objects.link(obj); obj.location = loc; aim(obj, target)
    obj.visible_camera = False; obj.visible_glossy = False; obj.visible_transmission = False
    return light

def descendants(obj):
    yield obj
    for child in obj.children:
        yield from descendants(child)

def build(job):
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    for collection in [bpy.data.meshes, bpy.data.curves, bpy.data.materials]:
        for item in list(collection):
            if item.users == 0: collection.remove(item)
    bpy.ops.import_scene.gltf(filepath=str(ROOT / 'public/models/v2/new-home-a.glb'), loglevel=2)
    furniture = {o.get('id'):o for o in bpy.context.scene.objects if o.get('selectable')}
    wanted = {p['id']:p for p in job['placements']}
    for id, p in wanted.items():
        if id not in furniture:
            before = set(bpy.context.scene.objects)
            bpy.ops.import_scene.gltf(filepath=str(ROOT / f'public/models/v2/furniture/{id}.glb'), loglevel=2)
            furniture[id] = next(o for o in bpy.context.scene.objects if o not in before and o.get('selectable'))
    for id, obj in furniture.items():
        for child in descendants(obj): child.hide_render = id not in wanted
        if id in wanted:
            p = wanted[id]; obj.location = (p['x'], -p['z'], 0); obj.rotation_mode = 'XYZ'; obj.rotation_euler = (0,0,math.radians(p['rotation']))
    for obj in bpy.context.scene.objects:
        if any(word in obj.name for word in ['Door swing clearance','Subtle wood grain','Throw stitched fold','Fine vertical oak fluting']): obj.hide_render = True
        if 'Pale glazing' in obj.name: obj.hide_render = False
    prepare_surfaces()
    frame_oak=mat('Print oak frame',(.27,.2,.13)); paper=mat('Print paper',(.86,.81,.71)); sage=mat('Print sage',(.26,.31,.24)); sand=mat('Print sand',(.55,.42,.28))
    for x in [1.05,1.64]:
        cube('Framed print',(x,-1.48,1.68),(.46,.035,.62),frame_oak)
        cube('Print paper',(x,-1.50,1.68),(.42,.006,.58),paper)
        cube('Abstract sage',(x-.035,-1.505,1.59),(.24,.003,.25),sage)
        bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=.115,depth=.003,location=(x+.035,-1.506,1.785),rotation=(math.pi/2,0,0)); bpy.context.object.data.materials.append(sand)
    plaster = mat('Film ceiling plaster', (.78,.76,.7)); cube('Continuous ceiling',(4.2,-3.075,2.59),(8.4,6.15,.06),plaster)
    brass = mat('Fixture brushed brass',(.42,.32,.18),.7); shade = mat('Pendant warm ivory',(.78,.73,.62))
    diffuser = mat('Opal diffuser',(.95,.9,.78)); dp = diffuser.node_tree.nodes.get('Principled BSDF'); dp.inputs['Emission Color'].default_value = (1,.77,.48,1)
    lights=[]
    dining = next((p for p in job['placements'] if p['id'] in ['N02','F04']),{'x':2.05,'z':5.05})
    for x,z,pendant in [(1.85,2.75,False),(dining['x'],dining['z'],True),(6.15,1.8,False),(6.95,4.7,False)]:
        h = 2.19 if pendant else 2.48; radius = .39 if pendant else .24
        bpy.ops.mesh.primitive_cone_add(vertices=64,radius1=radius,radius2=.28 if pendant else radius,depth=.2 if pendant else .065,location=(x,-z,h))
        body=bpy.context.object; body.name='Ceiling fixture'; body.data.materials.append(shade if pendant else brass)
        bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=radius*.97,depth=.012,location=(x,-z,h-(.102 if pendant else .04)))
        bpy.context.object.data.materials.append(diffuser)
        if pendant: cube('Pendant cord',(x,-z,2.4),(.012,.012,.31),brass)
        lights.append(area('Warm ceiling pool',(x,-z,h-.12),(x,-z,0),30,.7,(1,.79,.54)))
    windows=[]
    for x,z,target,energy,size in [(1.8,.08,(2,-3,1),420,2.7),(6.3,-.56,(6,-2,1),500,3),(6.9,-6.05,(7,-4,1),240,2.3)]:
        windows.append(area('Window daylight',(x,z,1.65),target,energy,size,(.83,.9,1)))
    world=bpy.data.worlds.new('Soft daylight'); world.use_nodes=True; bpy.context.scene.world=world
    world.node_tree.nodes['Background'].inputs[0].default_value=(.72,.8,1,1); world.node_tree.nodes['Background'].inputs[1].default_value=.18
    # A visible sky keeps the window view bright without washing out the room's bounce lighting.
    sky=world.node_tree.nodes.new('ShaderNodeBackground'); sky.inputs[0].default_value=(.72,.8,1,1); sky.inputs[1].default_value=.9
    path=world.node_tree.nodes.new('ShaderNodeLightPath'); mix=world.node_tree.nodes.new('ShaderNodeMixShader')
    world.node_tree.links.new(path.outputs['Is Camera Ray'],mix.inputs[0]); world.node_tree.links.new(world.node_tree.nodes['Background'].outputs[0],mix.inputs[1]); world.node_tree.links.new(sky.outputs[0],mix.inputs[2]); world.node_tree.links.new(mix.outputs[0],world.node_tree.nodes['World Output'].inputs[0])
    bpy.ops.object.light_add(type='SUN',location=(0,1,4)); sun=bpy.context.object; sun.data.energy=1.4; sun.data.angle=.07; aim(sun,(3,-4,0))
    scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.samples=options.samples; scene.cycles.use_denoising=True
    scene.cycles.use_adaptive_sampling=True; scene.cycles.adaptive_threshold=.015
    scene.cycles.max_bounces=12; scene.cycles.diffuse_bounces=8; scene.cycles.glossy_bounces=4; scene.cycles.transparent_max_bounces=8
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences
        prefs.compute_device_type = 'METAL'; prefs.get_devices()
        for device in prefs.devices: device.use = device.type == 'METAL'
        if not options.cpu and any(d.type == 'METAL' for d in prefs.devices): scene.cycles.device = 'GPU'
    except (TypeError, RuntimeError): pass
    scene.render.resolution_x=options.width; scene.render.resolution_y=options.width//2; scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='JPEG'; scene.render.image_settings.quality=92
    scene.view_settings.view_transform='AgX'; scene.view_settings.look='AgX - Medium High Contrast'; scene.view_settings.exposure=0
    bpy.ops.object.camera_add(); camera=bpy.context.object; scene.camera=camera
    camera.data.type='PERSP'; camera.data.sensor_fit='VERTICAL'; camera.data.sensor_height=24; camera.data.clip_start=.05
    return scene,camera,world,sun,windows,lights,dp

for job in jobs:
    if options.layout and options.layout != job['id']: continue
    scene,camera,world,sun,windows,lights,dp = build(job)
    for shot in job['shots']:
        if options.room and options.room != shot['id']: continue
        camera.location=coordinate(shot['from']); aim(camera,coordinate(shot['target']))
        camera.data.lens=12/math.tan(math.radians(shot['fov'])/2); camera.data.shift_y=-shot['shift']
        for lighting in ['day'] if options.day_only else ['day','evening']:
            evening=lighting=='evening'; sun.data.energy=.035 if evening else .85
            scene.view_settings.exposure = -.4 if shot['id'] == 'bedroom' and not evening else -.1
            sky=world.node_tree.nodes.get('Background.001')
            sky.inputs[0].default_value = (.12,.19,.33,1) if evening else (.72,.8,1,1)
            sky.inputs[1].default_value = .12 if evening else .9
            world.node_tree.nodes['Background'].inputs[1].default_value=.025 if evening else .18
            for light,energy in zip(windows,[420,500,240]): light.energy=energy*(.14 if evening else 1)
            for light in lights: light.energy=45 if evening else 12
            dp.inputs['Emission Strength'].default_value=3 if evening else .6
            frame_path=output/f"{job['id']}-{shot['id']}-{lighting}.jpg"
            stamp_path=frame_path.with_suffix('.json')
            signature={'version':render_version(shot,lighting),'key':job['key'],'shot':shot,'lighting':lighting,'samples':options.samples,'width':options.width}
            if options.skip_existing and frame_path.exists() and stamp_path.exists() and json.loads(stamp_path.read_text()) == signature: continue
            scene.render.filepath=str(frame_path)
            bpy.ops.render.render(write_still=True)
            stamp_path.write_text(json.dumps(signature))
    # Publish only complete sets; an interrupted render never advertises missing assets.
    manifest=[]
    for item in jobs:
        frames={s['id']:{light:f"/films/interior/{item['id']}-{s['id']}-{light}.jpg?v={render_version(s,light)}" for light in ['day','evening']} for s in item['shots']}
        complete=True
        for shot in item['shots']:
            for lighting in ['day','evening']:
                file=output/f"{item['id']}-{shot['id']}-{lighting}.jpg"
                stamp=file.with_suffix('.json')
                expected={'version':render_version(shot,lighting),'key':item['key'],'shot':shot,'lighting':lighting,'samples':options.samples,'width':options.width}
                if not file.exists() or not stamp.exists() or json.loads(stamp.read_text()) != expected: complete=False
        if complete: manifest.append({'key':item['key'],'frames':frames})
    (output/'manifest.json').write_text(json.dumps(manifest,indent=2))
