"""Refine the original V2 soft furnishings, bake local AO, export reusable GLBs.

Blender 4.5 LTS, CPU Cycles; no external assets or addons. Inputs stay untouched.
Run through `npm run build:refined-models` to install and validate the outputs.
"""
from __future__ import annotations
import argparse
import json
import math
import sys
from pathlib import Path
import bpy
import bmesh
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]


def mesh_bounds(obj):
    return [min(v.co[i] for v in obj.data.vertices) for i in range(3)], [max(v.co[i] for v in obj.data.vertices) for i in range(3)]


def soften(obj):
    """Weld exported triangle splits before subdividing; preserve the footprint."""
    obj.data = obj.data.copy()
    low, high = mesh_bounds(obj)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=0.00001)
    bmesh.ops.join_triangles(bm, faces=list(bm.faces), angle_face_threshold=.1, angle_shape_threshold=.8)
    bm.to_mesh(obj.data)
    bm.free()
    bpy.context.view_layer.objects.active = obj
    smooth = obj.modifiers.new('Relax upholstery', 'SMOOTH')
    smooth.factor = .28
    smooth.iterations = 2
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    subdivision = obj.modifiers.new('Soft cushion silhouette', 'SUBSURF')
    subdivision.levels = 1
    bpy.ops.object.modifier_apply(modifier=subdivision.name)
    after_low, after_high = mesh_bounds(obj)
    for vertex in obj.data.vertices:
        for axis in range(3):
            vertex.co[axis] = low[axis] + (vertex.co[axis] - after_low[axis]) / max(after_high[axis] - after_low[axis], 1e-6) * (high[axis] - low[axis])
    for face in obj.data.polygons:
        face.use_smooth = True
    return low, high


def piping(obj, low, high):
    """A restrained 1 mm welt around the cushion's edge, inside its footprint."""
    sizes = [high[i] - low[i] for i in range(3)]
    thin = min(range(3), key=lambda i: sizes[i])
    axes = [i for i in range(3) if i != thin]
    a, b = axes
    center = Vector([(low[i] + high[i]) / 2 for i in range(3)])
    # Follow the actual subdivided surface, rather than intersecting it with an
    # approximate rounded rectangle (which produces a broken, flickering welt).
    intersections = {}
    for edge in obj.data.edges:
        p, q = (obj.data.vertices[index].co for index in edge.vertices)
        d1, d2 = p[thin] - center[thin], q[thin] - center[thin]
        if abs(d1 - d2) < 1e-8 or d1 * d2 > 0:
            continue
        point = p.lerp(q, d1 / (d1 - d2))
        intersections[tuple(round(v, 6) for v in point)] = point
    contour = sorted(intersections.values(), key=lambda p: math.atan2(p[b] - center[b], p[a] - center[a]))
    points = []
    for point in contour:
        radial = point - center
        radial[thin] = 0
        points.append(point + radial.normalized() * .0005)
    curve = bpy.data.curves.new('Tailored cushion welt', 'CURVE')
    curve.dimensions = '3D'
    curve.resolution_u = 1
    curve.bevel_depth = .001
    curve.bevel_resolution = 1
    spline = curve.splines.new('POLY')
    spline.points.add(len(points) - 1)
    for target, point in zip(spline.points, points):
        target.co = (*point, 1)
    spline.use_cyclic_u = True
    seam = bpy.data.objects.new('Tailored welt', curve)
    bpy.context.collection.objects.link(seam)
    seam.parent = obj.parent
    seam.matrix_local = obj.matrix_local.copy()
    mat = obj.data.materials[0].copy()
    mat.name += ' tailored seam'
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    color = list(bsdf.inputs['Base Color'].default_value)
    color[:3] = [value * .78 for value in color[:3]]
    bsdf.inputs['Base Color'].default_value = color
    seam.data.materials.append(mat)
    bpy.ops.object.select_all(action='DESELECT')
    seam.select_set(True)
    bpy.context.view_layer.objects.active = seam
    bpy.ops.object.convert(target='MESH')
    return bpy.context.object


def bake_occlusion(meshes, asset_id, size):
    # Keep UV0 for the existing runtime weave/wood maps. AO has an independent atlas.
    bpy.ops.object.select_all(action='DESELECT')
    for obj in meshes:
        obj.data = obj.data.copy()
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=.00001)
        bm.to_mesh(obj.data)
        bm.free()
        obj.select_set(True)
        if not obj.data.uv_layers:
            obj.data.uv_layers.new(name='SurfaceUV')
        obj.data.uv_layers.new(name='BakedAO')
        obj.data.uv_layers.active_index = 1
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(70), island_margin=.02)
    bpy.ops.object.mode_set(mode='OBJECT')
    image = bpy.data.images.new(f'{asset_id} local occlusion', width=size, height=size, alpha=False)
    image.colorspace_settings.name = 'Non-Color'
    image.generated_color = (1, 1, 1, 1)
    materials = set(mat for obj in meshes for mat in obj.data.materials)
    settings = bpy.data.node_groups.new('glTF Material Output', 'ShaderNodeTree')
    settings.interface.new_socket(name='Occlusion', in_out='INPUT', socket_type='NodeSocketFloat')
    settings.nodes.new('NodeGroupInput')
    settings.nodes.new('NodeGroupOutput')
    originals = []
    for mat in materials:
        tree = mat.node_tree
        output = next(node for node in tree.nodes if node.type == 'OUTPUT_MATERIAL')
        originals.append((mat, output, output.inputs['Surface'].links[0].from_socket))
        ao = tree.nodes.new('ShaderNodeAmbientOcclusion')
        ao.inputs['Distance'].default_value = .22
        ao.samples = 32
        emit = tree.nodes.new('ShaderNodeEmission')
        tree.links.new(ao.outputs['Color'], emit.inputs['Color'])
        tree.links.new(emit.outputs[0], output.inputs['Surface'])
        texture = tree.nodes.new('ShaderNodeTexImage')
        texture.image = image
        texture.label = 'Baked local contact shading'
        uv = tree.nodes.new('ShaderNodeUVMap')
        uv.uv_map = 'BakedAO'
        tree.links.new(uv.outputs['UV'], texture.inputs['Vector'])
        gltf = tree.nodes.new('ShaderNodeGroup')
        gltf.node_tree = settings
        tree.links.new(texture.outputs['Color'], gltf.inputs['Occlusion'])
        tree.nodes.active = texture
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 32
    scene.cycles.seed = 41
    scene.render.bake.margin = 6
    scene.render.bake.use_clear = True
    bpy.ops.object.bake(type='EMIT')
    for mat, output, surface in originals:
        mat.node_tree.links.new(surface, output.inputs['Surface'])
        # Unsupported Blender nodes must not leak into the final glTF material.
        for node in list(mat.node_tree.nodes):
            if node.type in {'AMBIENT_OCCLUSION', 'EMISSION'}:
                mat.node_tree.nodes.remove(node)
    image.pack()
    for obj in meshes:
        obj.data.uv_layers.active_index = 0
        obj.data.uv_layers[0].active_render = True


def build(asset_id, output, size):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(ROOT / 'v2-home-models/models/furniture' / f'{asset_id}.glb'))
    root = next(obj for obj in bpy.context.scene.objects if obj.get('id') == asset_id)
    meshes = [obj for obj in root.children_recursive if obj.type == 'MESH']
    seams = []
    for obj in meshes:
        if any(word in obj.name.lower() for word in ('cushion', 'pillow', 'duvet', 'mattress', 'rounded arm', 'soft back')):
            low, high = soften(obj)
            if 'cushion' in obj.name.lower() or 'pillow' in obj.name.lower():
                seams.append(piping(obj, low, high))
    meshes += seams
    bake_occlusion(meshes, asset_id, size)
    root['refinement'] = 'Blender 4.5 LTS: tailored upholstery and baked local AO'
    bpy.ops.export_scene.gltf(filepath=str(output / f'{asset_id}.glb'), export_format='GLB', export_extras=True, export_yup=True, export_animations=False, export_cameras=False, export_lights=False, export_image_format='AUTO')
    triangles = sum(len(obj.data.polygons) for obj in meshes)
    print('REFINED', json.dumps({'id': asset_id, 'faces': triangles, 'meshes': len(meshes), 'bytes': (output / f'{asset_id}.glb').stat().st_size}), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--assets', nargs='+', choices=['F09', 'F13'], default=['F09', 'F13'])
    parser.add_argument('--size', type=int, default=1024)
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    args.output.mkdir(parents=True, exist_ok=True)
    for asset in args.assets:
        build(asset, args.output, args.size)
