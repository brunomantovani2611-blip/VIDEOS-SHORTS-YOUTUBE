# Piezas comunes para las escenas de la réplica (Blender 5.2)
import bpy, os, math, sys
from mathutils import Vector
RAIZ = os.environ.get('REALISTA_RAIZ', os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # carpeta realista/
NATHAN = RAIZ + '/recursos/renderpeople/nathan'
P = 'rp_nathan_animated_003_walking_'

def limpiar():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def importar_nathan():
    bpy.ops.import_scene.fbx(filepath=NATHAN + '/rp_nathan_animated_003_walking.fbx')
    arm = bpy.data.objects['Armature']
    geo = bpy.data.objects['rp_nathan_animated_003_walking_geo']
    return arm, geo

def hueso(arm, nombre):
    return arm.pose.bones[P + nombre]

def pos_hueso(arm, nombre, cola=False):
    b = hueso(arm, nombre)
    return arm.matrix_world @ (b.tail if cola else b.head)

def material_piel(geo, sss=0.25):
    """Material PBR de RenderPeople: difuso, normal y gloss (→ rugosidad), con SSS moderado."""
    mat = geo.data.materials[0]
    mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()
    o = nt.nodes.new('ShaderNodeOutputMaterial'); o.location = (900, 0)
    b = nt.nodes.new('ShaderNodeBsdfPrincipled'); b.location = (500, 0)
    def tex(nombre, color=True, x=-400, y=0):
        n = nt.nodes.new('ShaderNodeTexImage'); n.location = (x, y)
        n.image = bpy.data.images.load(NATHAN + '/tex/rp_nathan_animated_003_' + nombre + '.jpg', check_existing=True)
        if not color: n.image.colorspace_settings.name = 'Non-Color'
        return n
    dif = tex('dif'); gl = tex('gloss', False, y=-300); nm = tex('norm', False, y=-600)
    inv = nt.nodes.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.0; inv.location = (-100, -300)
    rmap = nt.nodes.new('ShaderNodeMapRange'); rmap.location = (100, -300)
    rmap.inputs['To Min'].default_value = 0.35; rmap.inputs['To Max'].default_value = 0.75
    nmap = nt.nodes.new('ShaderNodeNormalMap'); nmap.location = (100, -600)
    nt.links.new(dif.outputs['Color'], b.inputs['Base Color'])
    nt.links.new(gl.outputs['Color'], inv.inputs[1]); nt.links.new(inv.outputs[0], rmap.inputs['Value'])
    nt.links.new(rmap.outputs['Result'], b.inputs['Roughness'])
    nt.links.new(nm.outputs['Color'], nmap.inputs['Color']); nt.links.new(nmap.outputs['Normal'], b.inputs['Normal'])
    b.inputs['Subsurface Weight'].default_value = sss
    b.inputs['Subsurface Radius'].default_value = (1.0, 0.35, 0.2)
    b.inputs['Subsurface Scale'].default_value = 0.004
    nt.links.new(b.outputs['BSDF'], o.inputs['Surface'])
    return mat

def configurar_dispositivo_cycles(sc):
    """Selecciona una GPU compatible y comunica la selección; usa CPU si falla."""
    prefs = bpy.context.preferences.addons['cycles'].preferences
    opciones = ('METAL',) if sys.platform == 'darwin' else ('OPTIX', 'CUDA', 'HIP', 'ONEAPI')
    for backend in opciones:
        try:
            prefs.compute_device_type = backend
            prefs.get_devices()
            gpus = [d for d in prefs.devices if d.type == backend]
            if not gpus:
                continue
            for dispositivo in prefs.devices:
                dispositivo.use = dispositivo in gpus
            sc.cycles.device = 'GPU'
            print('Cycles: GPU seleccionada:', backend, ', '.join(d.name for d in gpus))
            return backend
        except (TypeError, ValueError, RuntimeError, AttributeError) as error:
            print('Cycles:', backend, 'no disponible:', error)
    sc.cycles.device = 'CPU'
    print('Cycles: ninguna GPU compatible detectada; se usará CPU.')
    return 'CPU'


def render_vertical(res=0.5, muestras=64):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    configurar_dispositivo_cycles(sc)
    sc.cycles.samples = muestras; sc.cycles.use_denoising = True
    sc.render.resolution_x = 1080; sc.render.resolution_y = 1920; sc.render.resolution_percentage = int(res*100)
    sc.render.fps = 30
    sc.view_settings.view_transform = 'Khronos PBR Neutral'
    return sc

def fondo_azul(color=(0.20, 0.50, 0.78), fuerza=1.0, luz=0.6):
    """Mundo: la cámara ve el azul plano; la escena recibe una luz azul suave."""
    w = bpy.data.worlds.new('Mundo'); bpy.context.scene.world = w
    w.use_nodes = True; nt = w.node_tree; nt.nodes.clear()
    o = nt.nodes.new('ShaderNodeOutputWorld')
    lp = nt.nodes.new('ShaderNodeLightPath')
    cam = nt.nodes.new('ShaderNodeBackground'); cam.inputs['Color'].default_value = (*color, 1); cam.inputs['Strength'].default_value = fuerza
    amb = nt.nodes.new('ShaderNodeBackground'); amb.inputs['Color'].default_value = (*color, 1); amb.inputs['Strength'].default_value = luz
    mix = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(lp.outputs['Is Camera Ray'], mix.inputs[0])
    nt.links.new(amb.outputs[0], mix.inputs[1]); nt.links.new(cam.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], o.inputs['Surface'])
    return w

def luz_area(nombre, pos, mira, energia, tam=2.0, color=(1,1,1)):
    l = bpy.data.lights.new(nombre, 'AREA'); l.energy = energia; l.size = tam; l.color = color
    ob = bpy.data.objects.new(nombre, l); bpy.context.collection.objects.link(ob)
    ob.location = pos
    d = Vector(mira) - Vector(pos); ob.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    return ob
