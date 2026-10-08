"""Local procedural finishes and cloth geometry for the offline interior film."""
import math
import bpy


def noise(nodes, scale, detail=2):
    node = nodes.new('ShaderNodeTexNoise')
    node.inputs['Scale'].default_value = scale
    node.inputs['Detail'].default_value = detail
    node.inputs['Roughness'].default_value = .65
    return node


def ramp(nodes, low, high):
    node = nodes.new('ShaderNodeValToRGB')
    node.color_ramp.elements[0].position = .18
    node.color_ramp.elements[0].color = (*low, 1)
    node.color_ramp.elements[1].position = .82
    node.color_ramp.elements[1].color = (*high, 1)
    return node


def finish(material):
    if not material.use_nodes: return
    nodes, links = material.node_tree.nodes, material.node_tree.links
    p = nodes.get('Principled BSDF')
    if not p: return
    name = material.name.lower()
    coords = nodes.new('ShaderNodeTexCoord')
    if 'oak' in name:
        mapping = nodes.new('ShaderNodeVectorMath'); mapping.operation = 'MULTIPLY'
        axis = int(material.get('film_grain_axis',0))
        mapping.inputs[1].default_value = tuple(1.2 if i == axis else 20 for i in range(3))
        links.new(coords.outputs['Generated'], mapping.inputs[0])
        grain = noise(nodes, 3.2, 3); grain.noise_dimensions = '4D'
        info=nodes.new('ShaderNodeObjectInfo'); seed=nodes.new('ShaderNodeMath'); seed.operation='MULTIPLY'; seed.inputs[1].default_value=11
        links.new(info.outputs['Random'],seed.inputs[0]); links.new(seed.outputs[0],grain.inputs['W'])
        links.new(mapping.outputs[0], grain.inputs['Vector'])
        if 'board' in name:
            colors = ramp(nodes, (.44,.34,.23), (.58,.47,.33))
        else:
            colors = ramp(nodes, (.34,.235,.14), (.46,.34,.22))
        links.new(grain.outputs['Fac'], colors.inputs[0]); links.new(colors.outputs[0], p.inputs['Base Color'])
        rough = ramp(nodes, (.45,.45,.45), (.59,.59,.59))
        links.new(grain.outputs['Fac'], rough.inputs[0]); links.new(rough.outputs[0], p.inputs['Roughness'])
        bump = nodes.new('ShaderNodeBump'); bump.inputs['Distance'].default_value = .0004; bump.inputs['Strength'].default_value = .2
        links.new(grain.outputs['Fac'], bump.inputs['Height']); links.new(bump.outputs[0], p.inputs['Normal'])
        p.inputs['Coat Weight'].default_value = .12; p.inputs['Coat Roughness'].default_value = .34
    elif any(s in name for s in ['linen','cotton','wool','woven']):
        base = tuple(p.inputs['Base Color'].default_value[:3])
        if 'ivory linen' in name: base = (.63,.59,.51)
        if 'cotton' in name: base = (.78,.76,.69)
        variation = noise(nodes, 4.5, 2)
        links.new(coords.outputs['Object'], variation.inputs['Vector'])
        colors = ramp(nodes, tuple(c*.92 for c in base), tuple(min(1,c*1.035) for c in base))
        links.new(variation.outputs['Fac'],colors.inputs[0]); links.new(colors.outputs[0],p.inputs['Base Color'])
        weave = noise(nodes, 420, 2)
        links.new(coords.outputs['Object'],weave.inputs['Vector'])
        bump = nodes.new('ShaderNodeBump'); bump.inputs['Distance'].default_value = .0006; bump.inputs['Strength'].default_value = .35
        links.new(weave.outputs['Fac'],bump.inputs['Height']); links.new(bump.outputs[0],p.inputs['Normal'])
        p.inputs['Roughness'].default_value = .88; p.inputs['Sheen Weight'].default_value = .32
        p.inputs['Sheen Roughness'].default_value = .65
    elif 'plaster' in name:
        p.inputs['Base Color'].default_value = (.76,.75,.71,1)
        texture = noise(nodes, 100, 2); links.new(coords.outputs['Object'],texture.inputs['Vector'])
        bump = nodes.new('ShaderNodeBump'); bump.inputs['Distance'].default_value = .00035; bump.inputs['Strength'].default_value = .16
        links.new(texture.outputs['Fac'],bump.inputs['Height']); links.new(bump.outputs[0],p.inputs['Normal'])
        p.inputs['Roughness'].default_value = .92
    elif 'glazing' in name:
        # Thin glazing reflects the room but does not block the sampled window light.
        for link in list(p.inputs['Base Color'].links): links.remove(link)
        p.inputs['Base Color'].default_value = (.97,.99,1,1)
        p.inputs['Roughness'].default_value = .035; p.inputs['Metallic'].default_value = 0
        p.inputs['Transmission Weight'].default_value = 1; p.inputs['IOR'].default_value = 1.45
        transparent = nodes.new('ShaderNodeBsdfTransparent'); path = nodes.new('ShaderNodeLightPath'); mix = nodes.new('ShaderNodeMixShader')
        links.new(path.outputs['Is Shadow Ray'],mix.inputs[0]); links.new(p.outputs[0],mix.inputs[1]); links.new(transparent.outputs[0],mix.inputs[2])
        links.new(mix.outputs[0],nodes.get('Material Output').inputs[0])


def drape_throw(obj):
    """Replace the rigid throw slab with a thin, softly folded surface in its original footprint."""
    low = [min(v.co[a] for v in obj.data.vertices) for a in range(3)]
    high = [max(v.co[a] for v in obj.data.vertices) for a in range(3)]
    thin = min(range(3), key=lambda a: high[a]-low[a])
    axes = [a for a in range(3) if a != thin]
    wide, depth = sorted(axes,key=lambda a: high[a]-low[a],reverse=True)
    verts, faces = [], []
    nx, ny = 64, 28
    for j in range(ny+1):
        v = j/ny
        for i in range(nx+1):
            u = i/nx; position = [0.,0.,0.]
            position[wide] = low[wide]+u*(high[wide]-low[wide])
            position[depth] = low[depth]+v*(high[depth]-low[depth])
            folds = .006*math.sin(u*35+v*4)+.003*math.sin(u*71-v*7)
            drop = .095*max(0,(abs(u-.5)-.39)/.11)**2
            position[thin] = high[thin]+folds-drop
            verts.append(position)
    for j in range(ny):
        for i in range(nx):
            a=j*(nx+1)+i; faces.append((a,a+1,a+nx+2,a+nx+1))
    mesh=bpy.data.meshes.new('Draped woven throw'); mesh.from_pydata(verts,[],faces); mesh.update()
    for m in obj.data.materials: mesh.materials.append(m)
    obj.data=mesh
    for face in mesh.polygons: face.use_smooth=True
    smooth=obj.modifiers.new('Soft fold edges','SUBSURF'); smooth.levels=1; smooth.render_levels=1
    thickness=obj.modifiers.new('Textile thickness','SOLIDIFY'); thickness.thickness=.003


def cloth_detail(obj):
    name=obj.name.lower()
    if 'sage bed throw' in name:
        drape_throw(obj); return
    if not any(s in name for s in ['duvet','cotton pillow','seat cushion','back cushion']): return
    obj.data=obj.data.copy()
    bpy.context.view_layer.objects.active=obj
    subdiv=obj.modifiers.new('Fabric detail mesh','SUBSURF'); subdiv.subdivision_type='SIMPLE'; subdiv.levels=2
    bpy.ops.object.modifier_apply(modifier=subdiv.name)
    low=[min(v.co[a] for v in obj.data.vertices) for a in range(3)]
    high=[max(v.co[a] for v in obj.data.vertices) for a in range(3)]
    thin=min(range(3),key=lambda a: high[a]-low[a]); axes=[a for a in range(3) if a!=thin]
    amplitude=.007 if 'duvet' in name else .002
    for vertex in obj.data.vertices:
        u=(vertex.co[axes[0]]-low[axes[0]])/max(.001,high[axes[0]]-low[axes[0]])
        v=(vertex.co[axes[1]]-low[axes[1]])/max(.001,high[axes[1]]-low[axes[1]])
        surface=max(0,(vertex.co[thin]-low[thin])/max(.001,high[thin]-low[thin]))
        edge=math.sin(math.pi*u)*math.sin(math.pi*v)
        vertex.co[thin]+=amplitude*surface*edge*(math.sin(26*u+8*v)+.35*math.sin(51*v-5*u))
    for face in obj.data.polygons: face.use_smooth=True


def prepare():
    # A duvet is cotton, even though the source model shared its ceramic-white material.
    cotton=bpy.data.materials.new('Film washed cotton duvet'); cotton.use_nodes=True
    cotton.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.78,.76,.69,1)
    wood_variants={}
    for obj in list(bpy.context.scene.objects):
        if obj.type!='MESH' or obj.hide_render: continue
        if 'duvet' in obj.name.lower(): obj.data=obj.data.copy(); obj.data.materials.clear(); obj.data.materials.append(cotton)
        cloth_detail(obj)
        if 'Individual oak plank' in obj.name:
            obj.dimensions.x+=.006; obj.dimensions.y+=.004
        if any('oak' in slot.material.name.lower() for slot in obj.material_slots if slot.material):
            extent=[max(v.co[a] for v in obj.data.vertices)-min(v.co[a] for v in obj.data.vertices) for a in range(3)]
            axis=max(range(3),key=lambda a: extent[a])
            for slot in obj.material_slots:
                original=slot.material
                if not original or 'oak' not in original.name.lower(): continue
                if original.get('film_grain_axis') == axis: continue
                key=(original.name,axis)
                if key not in wood_variants:
                    variant=original.copy(); variant.name=original.name+' Grain axis '+str(axis); variant['film_grain_axis']=axis; wood_variants[key]=variant
                slot.material=wood_variants[key]
    for material in bpy.data.materials: finish(material)
