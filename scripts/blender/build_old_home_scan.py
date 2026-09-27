"""Build the deterministic old-home LiDAR demo scene and export it as GLB."""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
MODEL_DIR = ROOT / "public" / "models"
OUTPUT = MODEL_DIR / "old-home-scan.glb"


def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def material(name: str, color: tuple[float, float, float, float], roughness: float = 0.82, metallic: float = 0.0):
    item = bpy.data.materials.new(name)
    item.diffuse_color = color
    item.use_nodes = True
    principled = item.node_tree.nodes.get("Principled BSDF")
    if principled:
        principled.inputs["Base Color"].default_value = color
        principled.inputs["Roughness"].default_value = roughness
        principled.inputs["Metallic"].default_value = metallic
    return item


def cube(name: str, size: tuple[float, float, float], location: tuple[float, float, float], mat, parent=None, bevel: float = 0.0):
    bpy.ops.mesh.primitive_cube_add(location=location)
    item = bpy.context.object
    item.name = name
    item.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = item.modifiers.new("Soft edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
    item.data.materials.append(mat)
    item.parent = parent
    return item


def empty(name: str, parent=None):
    item = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(item)
    item.parent = parent
    return item


def world_bounds(objects) -> tuple[Vector, Vector]:
    points = [obj.matrix_world @ Vector(corner) for obj in objects if obj.type == "MESH" for corner in obj.bound_box]
    minimum = Vector((min(point.x for point in points), min(point.y for point in points), min(point.z for point in points)))
    maximum = Vector((max(point.x for point in points), max(point.y for point in points), max(point.z for point in points)))
    return minimum, maximum


def import_furniture(name: str, asset: str, target_size: tuple[float, float, float], center: tuple[float, float], rotation: float, parent):
    before = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(MODEL_DIR / asset))
    imported = [obj for obj in bpy.context.scene.objects if obj not in before]
    meshes = [obj for obj in imported if obj.type == "MESH"]
    root = empty(name, parent)
    top_level = [obj for obj in imported if obj.parent not in imported]
    for obj in top_level:
        obj.parent = root

    minimum, maximum = world_bounds(meshes)
    extent = maximum - minimum
    root.scale = tuple(target_size[index] / max(extent[index], 0.001) for index in range(3))
    root.rotation_euler[2] = math.radians(rotation)
    bpy.context.view_layer.update()
    minimum, maximum = world_bounds(meshes)
    root.location = (center[0] - (minimum.x + maximum.x) / 2, center[1] - (minimum.y + maximum.y) / 2, -minimum.z)
    return root


def build_desk(parent, oak, charcoal):
    root = empty("furniture-desk", parent)
    root.location = (2.9, 1.25, 0)
    root.rotation_euler[2] = math.radians(2)
    cube("desk-top", (1.75, 0.68, 0.08), (0, 0, 0.78), oak, root, 0.025)
    for x in (-0.78, 0.78):
        for y in (-0.27, 0.27):
            cube("desk-leg", (0.055, 0.055, 0.74), (x, y, 0.37), charcoal, root, 0.012)
    cube("desk-screen", (0.62, 0.055, 0.39), (0.16, -0.2, 1.13), charcoal, root, 0.018)
    cube("desk-screen-base", (0.27, 0.18, 0.025), (0.16, -0.12, 0.86), charcoal, root, 0.01)
    return root


def proxy_box(name: str, size: tuple[float, float, float], center: tuple[float, float], rotation: float, parent, mat, z: float | None = None):
    item = cube(name, size, (center[0], center[1], z if z is not None else size[2] / 2), mat, parent)
    item.rotation_euler[2] = math.radians(rotation)
    bevel = item.modifiers.new("Scan bevel", "BEVEL")
    bevel.width = min(size) * 0.035
    bevel.segments = 1
    triangulate = item.modifiers.new("Scan triangles", "TRIANGULATE")
    return item


def build_photo_scene() -> None:
    reset_scene()
    plaster = material("Ivory plaster", (0.77, 0.73, 0.65, 1))
    oak = material("Oak", (0.55, 0.34, 0.16, 1))
    black = material("Graphite", (0.035, 0.042, 0.035, 1))
    linen = material("Curtain linen", (0.52, 0.47, 0.37, 1))
    white = material("Cabinet white", (0.81, 0.79, 0.71, 1))
    silver = material("Refrigerator steel", (0.48, 0.49, 0.46, 1), .35, .6)
    sky = material("Daylight", (0.57, 0.72, 0.78, 1))
    solid = empty("SOLID_ROOM")
    # A compact living room with a recessed kitchen on the rear right.
    cube("floor", (6.7, 9, .10), (.45, -.4, -.05), oak, solid)
    cube("ceiling", (6.7, 9, .10), (.45, -.4, 2.85), plaster, solid)
    cube("left-wall", (.12, 9, 2.85), (-2.9, -.4, 1.425), plaster, solid)
    cube("right-wall", (.12, 9, 2.85), (3.8, -.4, 1.425), plaster, solid)
    cube("window-left-pier", (.36, .12, 2.85), (-2.72, 2.3, 1.425), plaster, solid)
    cube("window-sill", (2.65, .22, .38), (-1.27, 2.3, .19), plaster, solid)
    cube("window-header", (2.65, .15, .22), (-1.27, 2.3, 2.74), plaster, solid)
    cube("window-view", (2.65, .025, 2.23), (-1.27, 2.4, 1.50), sky, solid)
    for x in [-2.59, -1.72, -.85, .06]:
        cube("window-mullion", (.045, .08, 2.24), (x, 2.22, 1.5), black, solid)
    for z in [.4, 2.61, .92]:
        cube("window-crossbar", (2.69, .08, .035), (-1.27, 2.22, z), black, solid)
    for x in [-2.63, .13]:
        for i in range(7):
            cube("curtain-fold", (.052, .075, 2.48), (x + i*.032, 2.11, 1.48), linen, solid, .018)
    cube("bookcase-work-wall", (2.22, .15, 2.85), (1.215, 2.3, 1.425), plaster, solid)
    cube("kitchen-opening-header", (1.95, .22, .35), (2.82, 2.3, 2.675), plaster, solid)
    cube("kitchen-back-wall", (1.95, .12, 2.85), (2.82, 3.9, 1.425), plaster, solid)
    cube("kitchen-counter", (1.28, .57, .88), (3.13, 3.58, .44), white, solid)
    cube("kitchen-worktop", (1.3, .6, .045), (3.13, 3.58, .9), black, solid)
    cube("kitchen-upper-cabinet", (1.28, .34, .68), (3.13, 3.68, 2.07), oak, solid)
    cube("fridge", (.55, .66, 1.77), (2.74, 2.95, .885), silver, solid, .02)
    cube("fridge-handle", (.025, .025, .42), (2.96, 2.60, 1.23), black, solid)
    cube("kitchen-threshold", (1.95, .09, .015), (2.82, 2.29, .01), black, solid)
    cube("entry-door", (.06, 1.0, 2.48), (3.25, .60, 1.24), oak, solid)
    cube("entry-console", (.38, 1.35, .87), (3.07, -.1, .435), white, solid)

    import_furniture("furniture-sofa", "sofa.glb", (2.32, .94, .9), (-1.54, -.18), 56, solid)
    import_furniture("furniture-coffee-table", "coffee-table.glb", (1.15, 1.05, .56), (-.08, -.67), 0, solid)
    import_furniture("furniture-dining-table", "dining-set.glb", (1.70, 1.40, 1.0), (-.05, 1.04), 12, solid)
    shelf = empty("furniture-bookshelf", solid)
    shelf.location = (.86, 2.00, 0)
    for x in [-.49, .49]:
        cube("shelf-upright", (.045, .34, 2.4), (x, 0, 1.2), black, shelf)
    for level in range(7):
        z = .1 + level*.37
        cube("shelf-board", (1.02, .34, .035), (0, 0, z), black, shelf)
        if level < 6:
            for i in range(13):
                h = .19 + ((i*7+level*3)%9)*.01
                book = cube("book", (.032, .20, h), (-.42+i*.067, -.035, z+.025+h/2), [linen, white, oak][(i+level)%3], shelf)
                book.rotation_euler.y = math.radians((i%3-1)*5)
    import_furniture("furniture-work-chair", "chair.glb", (.60, .62, 1.0), (1.60, .85), 165, solid)
    desk = empty("furniture-desk", solid)
    desk.location = (1.69, 1.56, 0)
    desk.rotation_euler.z = math.radians(-30)
    cube("desk-top", (1.17, .58, .055), (0, 0, .755), oak, desk, .012)
    cube("desk-pedestal", (.27, .54, .70), (.44, 0, .37), white, desk)
    for y in [-.23, .23]:
        cube("desk-leg", (.045, .045, .73), (-.52, y, .365), white, desk)
    cube("monitor", (.51, .045, .32), (.02, .16, 1.04), black, desk, .01)
    cube("monitor-stand", (.10, .1, .10), (.02, .16, .83), silver, desk)
    for x, z, width, height in [(1.58, 2.0, .48, .6), (-2.61, 2.12, .35, .52)]:
        cube("picture-frame", (width, .035, height), (x, 2.19, z), oak, solid)
        cube("picture-mat", (width-.045, .018, height-.045), (x, 2.16, z), white, solid)
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=.49, depth=.035, location=(-.08, -.67, .18))
    bpy.context.object.name = "coffee-lower-shelf"
    bpy.context.object.data.materials.append(oak)
    bpy.context.object.parent = solid
    cube("rug", (2.9, 2.1, .012), (-.5, -1.18, .008), linen, solid)
    cube("tv-console", (.37, 1.3, .57), (-2.65, -.38, .285), oak, solid)
    cube("television", (.055, .9, .72), (-2.68, .04, 1.01), black, solid)
    cube("window-console", (.9, .35, .54), (-2.33, 1.56, .27), oak, solid)
    cube("pendant-cord", (.013, .013, .85), (-.12, .91, 2.43), black, solid)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, location=(-.12, .91, 1.98))
    shade = bpy.context.object
    shade.name = "dining-pendant"
    shade.scale = (.23, .23, .11)
    shade.data.materials.append(white)
    shade.parent = solid
    import_furniture("standing-lamp", "floor-lamp.glb", (.39, .39, 1.52), (-2.39, 1.13), 0, solid)

    # The window return and the bookcase/work wall are distinct planes.
    corner = Vector((.20, 2.30, 0))
    angle = math.radians(20)
    for item in list(solid.children):
        if item.name.startswith(("window-", "curtain-")):
            delta = item.location - corner
            item.location.x = corner.x + math.cos(angle)*delta.x - math.sin(angle)*delta.y
            item.location.y = corner.y + math.sin(angle)*delta.x + math.cos(angle)*delta.y
            item.rotation_euler.z += angle

    # Export a scan representation derived from the same geometry, never boxes
    # with independently maintained transforms.
    proxy = empty("SCAN_PROXY")
    bpy.context.view_layer.update()
    for source in list(solid.children_recursive):
        if source.type != "MESH":
            continue
        copy = source.copy()
        copy.data = source.data
        bpy.context.collection.objects.link(copy)
        copy.parent = proxy
        copy.matrix_world = source.matrix_world.copy()
        copy.name = "scan-" + source.name
    bpy.ops.object.camera_add(location=(-.72, -4.15, 1.72))
    camera = bpy.context.object
    camera.name = "SCAN_CAMERA"
    camera.data.lens = 25
    camera.data.sensor_width = 36
    target = Vector((.0, 1.7, 1.02))
    camera.rotation_euler = (target-camera.location).to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = camera
    bpy.context.scene.render.engine = "BLENDER_EEVEE"
    bpy.context.scene.render.resolution_x = 1460
    bpy.context.scene.render.resolution_y = 708
    bpy.context.scene.render.resolution_percentage = 100
    bpy.context.scene.world.color = (.3, .3, .3)
    for location, energy, size in [((-1.4, 1.8, 2.45), 350, 3), ((0, -2.0, 2.6), 180, 4), ((2.4, 3, 2.65), 160, 1)]:
        bpy.ops.object.light_add(type="AREA", location=location)
        bpy.context.object.data.energy = energy
        bpy.context.object.data.size = size
    bpy.context.view_layer.update()


def export_scene() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(OUTPUT),
        export_format="GLB",
        export_cameras=True,
        export_lights=False,
        export_apply=True,
        export_yup=True,
    )
    size_mb = OUTPUT.stat().st_size / (1024 * 1024)
    print(f"Exported {OUTPUT} ({size_mb:.2f} MB)")


def render_preview() -> None:
    preview = Path("/private/tmp/old-home-scan-preview.png")
    scan_proxy = bpy.data.objects.get("SCAN_PROXY")
    if scan_proxy:
        for item in [scan_proxy, *scan_proxy.children_recursive]:
            item.hide_render = True
    bpy.context.scene.render.filepath = str(preview)
    bpy.context.scene.render.image_settings.file_format = "PNG"
    bpy.context.scene.render.film_transparent = False
    bpy.context.scene.view_settings.look = "AgX - Medium High Contrast"
    bpy.ops.render.render(write_still=True)
    print(f"Rendered {preview}")


if __name__ == "__main__":
    build_photo_scene()
    export_scene()
    if "--preview" in sys.argv:
        render_preview()
