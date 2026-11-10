# Prueba de 9 s (réplica del render de Mr omi, tutorial 4:45–4:54)
# Antebrazo derecho de Nathan (RenderPeople) caminando en su lugar sobre fondo azul.
# Herida = copia de las caras de la piel (mismos triángulos que ve el render) + 0.25 mm, con su esqueleto.
# Uso: Blender -b -P escena.py -- [--foto N] [--guardar]
import bpy, bmesh, sys, os, math
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from comun import *
from mathutils import Vector, Matrix

args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
AQUI = os.path.dirname(os.path.abspath(__file__))
TOTAL = 270                      # 9 s a 30 fps: lo que dura su archivo (medido a 30 fps, ver medida_30fps/)
CICLO = (5, 69)                  # cuadros de la caminata que se repiten (el 1 es la pose en T)

limpiar()
arm, geo = importar_nathan()
material_piel(geo, sss=0.2)
RAPIDO = '--rapido' in args      # solo para revisar el encuadre: 25 % y 8 muestras
sc = render_vertical(0.25, 8) if RAPIDO else render_vertical(0.5, 64)
sc.frame_start, sc.frame_end = 1, TOTAL
fondo_azul((0.19, 0.48, 0.75), 1.0, 0.55)

# ---------- 1. Caminata en su lugar, repetida ----------
act = arm.animation_data.action
for L in act.layers:
    for st in L.strips:
        for cb in st.channelbags:
            for fc in cb.fcurves:
                if fc.data_path.endswith('walking_root"].location'):
                    for k in fc.keyframe_points:
                        k.co[1] = 0; k.handle_left[1] = 0; k.handle_right[1] = 0
arm.animation_data.action = None
tr = arm.animation_data.nla_tracks.new()
strip = tr.strips.new('caminar', 1, act)
strip.action_frame_start, strip.action_frame_end = CICLO
strip.repeat = 6
# Tiempo animado: casi quieto mientras cose (como su toma cerrada) y paso normal al alejarse.
strip.use_animated_time = True
def tiempo(f):  # cuadro de escena -> cuadros de acción recorridos desde el inicio del strip
    return 20 + f * 0.02
for f in range(1, TOTAL + 1, 2):
    strip.strip_time = CICLO[0] + (tiempo(f) % (CICLO[1] - CICLO[0]))
    strip.keyframe_insert('strip_time', frame=f)

# ---------- 2. Malla en triángulos (la herida usa exactamente los mismos) ----------
bm = bmesh.new(); bm.from_mesh(geo.data)
bmesh.ops.triangulate(bm, faces=bm.faces[:], quad_method='BEAUTY', ngon_method='BEAUTY')
bm.to_mesh(geo.data); bm.free()

# Antebrazo derecho en pose de reposo (en T): eje codo→muñeca
rest = arm.data.bones[P + 'lowerarm_r']
M = arm.matrix_world
codo = M @ rest.head_local; muneca = M @ arm.data.bones[P + 'hand_r'].head_local   # la cola del FBX no sirve
eje = (muneca - codo).normalized()
largo = (muneca - codo).length
# La cámara mira siempre en esta dirección (desde el lado derecho de Nathan, un poco de frente)
VISTA = Vector((1.0, 0.42, -0.05)).normalized()
# Lado del antebrazo que ve la cámara a media toma cerrada, llevado de vuelta a la pose de reposo
sc.frame_set(100)
pb = arm.pose.bones[P + 'lowerarm_r']
Mdef = arm.matrix_world @ pb.matrix @ pb.bone.matrix_local.inverted() @ arm.matrix_world.inverted()
LADO = Mdef.to_3x3().inverted() @ (-VISTA)
LADO = (LADO - eje * LADO.dot(eje)).normalized()
print('LADO reposo', [round(x,3) for x in LADO])
U0, U1 = 0.30, 0.78            # tramo del antebrazo donde va la herida
centro_u = (U0 + U1) / 2

gm = geo.matrix_world
sel = set()
for v in geo.data.vertices:
    p = gm @ v.co
    d = p - codo; u = d.dot(eje) / largo
    radial = d - eje * d.dot(eje)
    if U0 - 0.05 < u < U1 + 0.05 and radial.length > 0.01 and radial.normalized().dot(LADO) > 0.55:
        sel.add(v.index)

# ---------- 3. Parche de la herida: copia de esas caras, 0.25 mm arriba, con sus pesos ----------
herida = geo.copy(); herida.data = geo.data.copy(); herida.name = 'Herida'
sc.collection.objects.link(herida)
bm = bmesh.new(); bm.from_mesh(herida.data)
bm.verts.ensure_lookup_table()
fuera = [f for f in bm.faces if not all(v.index in sel for v in f.verts)]
bmesh.ops.delete(bm, geom=fuera, context='FACES')
for v in bm.verts: v.co += v.normal * 0.00025
# UV propia de la herida: u a lo largo del antebrazo, v alrededor (en metros)
uvl = bm.loops.layers.uv.new('herida')
hm = herida.matrix_world
for f in bm.faces:
    for lp in f.loops:
        p = hm @ lp.vert.co; d = p - codo
        u = d.dot(eje) / largo
        radial = d - eje * d.dot(eje)
        lado2 = eje.cross(LADO).normalized()
        ang = math.atan2(radial.dot(lado2), radial.dot(LADO))
        lp[uvl].uv = ((u - centro_u) * largo, ang * radial.length)
bm.to_mesh(herida.data); bm.free()
herida.data.uv_layers.active_index = 0
print('HERIDA caras', len(herida.data.polygons), 'vertices', len(herida.data.vertices))

# ---------- 4. Material de la herida ----------
ESPONJA = RAIZ + '/recursos/ambientcg/Sponge001'
def material_herida():
    mat = bpy.data.materials.new('Herida'); mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear(); L = nt.links.new
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    uvh = nt.nodes.new('ShaderNodeUVMap'); uvh.uv_map = 'herida'
    uvc = nt.nodes.new('ShaderNodeUVMap'); uvc.uv_map = geo.data.uv_layers[0].name
    sep = nt.nodes.new('ShaderNodeSeparateXYZ'); L(uvh.outputs['UV'], sep.inputs[0])
    # abertura animable: 1 = abierta, ~0.12 = cerrada con puntadas, 0 = cicatriz
    ab = nt.nodes.new('ShaderNodeValue'); ab.name = 'abertura'; ab.outputs[0].default_value = 1.0
    MEDIO = (U1 - U0) / 2 * largo           # medio largo de la herida (m)
    ANCHO = 0.0050                          # media abertura máxima (m)
    # w(u) = ANCHO * abertura * (1 - (u/MEDIO)^2)^0.7  → forma de ojal
    e = nt.nodes.new('ShaderNodeMath'); e.operation = 'DIVIDE'; L(sep.outputs['X'], e.inputs[0]); e.inputs[1].default_value = MEDIO
    e2 = nt.nodes.new('ShaderNodeMath'); e2.operation = 'POWER'; L(e.outputs[0], e2.inputs[0]); e2.inputs[1].default_value = 2
    e3 = nt.nodes.new('ShaderNodeMath'); e3.operation = 'SUBTRACT'; e3.inputs[0].default_value = 1; L(e2.outputs[0], e3.inputs[1])
    e3.use_clamp = True
    e4 = nt.nodes.new('ShaderNodeMath'); e4.operation = 'POWER'; L(e3.outputs[0], e4.inputs[0]); e4.inputs[1].default_value = 0.7
    w = nt.nodes.new('ShaderNodeMath'); w.operation = 'MULTIPLY'; L(e4.outputs[0], w.inputs[0]); w.inputs[1].default_value = ANCHO
    w2 = nt.nodes.new('ShaderNodeMath'); w2.operation = 'MULTIPLY'; L(w.outputs[0], w2.inputs[0]); L(ab.outputs[0], w2.inputs[1])
    # ondulado leve del borde (los bordes de un corte no son perfectos)
    ruido = nt.nodes.new('ShaderNodeTexNoise'); ruido.inputs['Scale'].default_value = 140; L(uvh.outputs['UV'], ruido.inputs['Vector'])
    rr = nt.nodes.new('ShaderNodeMapRange'); L(ruido.outputs['Fac'], rr.inputs['Value']); rr.inputs['To Min'].default_value = -0.0006; rr.inputs['To Max'].default_value = 0.0006
    av = nt.nodes.new('ShaderNodeMath'); av.operation = 'ABSOLUTE'; L(sep.outputs['Y'], av.inputs[0])
    av2 = nt.nodes.new('ShaderNodeMath'); av2.operation = 'ADD'; L(av.outputs[0], av2.inputs[0]); L(rr.outputs['Result'], av2.inputs[1])
    # BORDES IRREGULARES (como la suya, nota de Luis 6-nov): el ancho cambia a lo largo y la orilla tiene dientes
    anc = nt.nodes.new('ShaderNodeTexNoise'); anc.inputs['Scale'].default_value = 22; anc.inputs['Detail'].default_value = 2; L(uvh.outputs['UV'], anc.inputs['Vector'])
    ancr = nt.nodes.new('ShaderNodeMapRange'); L(anc.outputs['Fac'], ancr.inputs['Value']); ancr.inputs['From Min'].default_value = 0.3; ancr.inputs['From Max'].default_value = 0.7; ancr.inputs['To Min'].default_value = 0.55; ancr.inputs['To Max'].default_value = 1.35
    w3 = nt.nodes.new('ShaderNodeMath'); w3.operation = 'MULTIPLY'; L(w2.outputs[0], w3.inputs[0]); L(ancr.outputs['Result'], w3.inputs[1]); w2 = w3
    die = nt.nodes.new('ShaderNodeTexNoise'); die.inputs['Scale'].default_value = 600; die.inputs['Detail'].default_value = 6; L(uvh.outputs['UV'], die.inputs['Vector'])
    dier = nt.nodes.new('ShaderNodeMapRange'); L(die.outputs['Fac'], dier.inputs['Value']); dier.inputs['To Min'].default_value = -0.00045; dier.inputs['To Max'].default_value = 0.00045
    av3 = nt.nodes.new('ShaderNodeMath'); av3.operation = 'ADD'; L(av2.outputs[0], av3.inputs[0]); L(dier.outputs['Result'], av3.inputs[1]); av2 = av3
    # dentro = |v| < w ; anillo rojo inflamado hasta w + 2.5 mm
    dentro = nt.nodes.new('ShaderNodeMath'); dentro.operation = 'LESS_THAN'; L(av2.outputs[0], dentro.inputs[0]); L(w2.outputs[0], dentro.inputs[1])
    dist = nt.nodes.new('ShaderNodeMath'); dist.operation = 'SUBTRACT'; L(av2.outputs[0], dist.inputs[0]); L(w2.outputs[0], dist.inputs[1])
    anillo = nt.nodes.new('ShaderNodeMapRange'); L(dist.outputs[0], anillo.inputs['Value'])
    anillo.inputs['From Min'].default_value = 0.0; anillo.inputs['From Max'].default_value = 0.0018
    anillo.inputs['To Min'].default_value = 0.55; anillo.inputs['To Max'].default_value = 0.0
    # el anillo solo existe a lo largo de la herida
    a_largo = nt.nodes.new('ShaderNodeMath'); a_largo.operation = 'MULTIPLY'; L(anillo.outputs['Result'], a_largo.inputs[0]); L(e4.outputs[0], a_largo.inputs[1])
    ab_an = nt.nodes.new('ShaderNodeMath'); ab_an.operation = 'MULTIPLY'; L(a_largo.outputs[0], ab_an.inputs[0]); L(ab.outputs[0], ab_an.inputs[1])
    # piel = misma textura del cuerpo
    piel = nt.nodes.new('ShaderNodeTexImage'); piel.image = bpy.data.images.load(NATHAN + '/tex/rp_nathan_animated_003_dif.jpg', check_existing=True); L(uvc.outputs['UV'], piel.inputs['Vector'])
    rojo_piel = nt.nodes.new('ShaderNodeMix'); rojo_piel.data_type = 'RGBA'; rojo_piel.blend_type = 'MULTIPLY'
    L(ab_an.outputs[0], rojo_piel.inputs['Factor']); L(piel.outputs['Color'], rojo_piel.inputs['A']); rojo_piel.inputs['B'].default_value = (0.80, 0.30, 0.26, 1)
    # interior = esponja escaneada teñida de carne
    esp = nt.nodes.new('ShaderNodeTexImage'); esp.image = bpy.data.images.load(ESPONJA + '/Sponge001_2K-JPG_Color.jpg', check_existing=True)
    map_e = nt.nodes.new('ShaderNodeMapping'); map_e.inputs['Scale'].default_value = (18, 18, 1); L(uvh.outputs['UV'], map_e.inputs['Vector']); L(map_e.outputs[0], esp.inputs['Vector'])
    bw = nt.nodes.new('ShaderNodeRGBToBW'); L(esp.outputs['Color'], bw.inputs[0])
    carne = nt.nodes.new('ShaderNodeValToRGB'); L(bw.outputs[0], carne.inputs[0])
    carne.color_ramp.elements[0].color = (0.07, 0.003, 0.002, 1); carne.color_ramp.elements[1].color = (0.50, 0.022, 0.014, 1)
    # más oscuro al fondo del corte (centro), más claro en las paredes
    prof = nt.nodes.new('ShaderNodeMath'); prof.operation = 'DIVIDE'; L(av.outputs[0], prof.inputs[0]); L(w2.outputs[0], prof.inputs[1])
    prof_c = nt.nodes.new('ShaderNodeMapRange'); L(prof.outputs[0], prof_c.inputs['Value']); prof_c.inputs['To Min'].default_value = 0.22; prof_c.inputs['To Max'].default_value = 1.0
    carne2 = nt.nodes.new('ShaderNodeMix'); carne2.data_type = 'RGBA'; carne2.blend_type = 'MULTIPLY'; carne2.inputs['Factor'].default_value = 1
    L(carne.outputs['Color'], carne2.inputs['A'])
    gris = nt.nodes.new('ShaderNodeCombineColor'); L(prof_c.outputs['Result'], gris.inputs[0]); L(prof_c.outputs['Result'], gris.inputs[1]); L(prof_c.outputs['Result'], gris.inputs[2])
    L(gris.outputs[0], carne2.inputs['B'])
    col = nt.nodes.new('ShaderNodeMix'); col.data_type = 'RGBA'; L(dentro.outputs[0], col.inputs['Factor'])
    L(rojo_piel.outputs['Result'], col.inputs['A']); L(carne2.outputs['Result'], col.inputs['B'])
    # MANCHAS OSCURAS y orilla de sangre seca adentro (la suya no es de un solo rojo)
    man = nt.nodes.new('ShaderNodeTexNoise'); man.inputs['Scale'].default_value = 70; man.inputs['Detail'].default_value = 3; L(uvh.outputs['UV'], man.inputs['Vector'])
    manr = nt.nodes.new('ShaderNodeMapRange'); L(man.outputs['Fac'], manr.inputs['Value']); manr.inputs['From Min'].default_value = 0.56; manr.inputs['From Max'].default_value = 0.7
    ori = nt.nodes.new('ShaderNodeMapRange'); L(dist.outputs[0], ori.inputs['Value']); ori.inputs['From Min'].default_value = -0.0008; ori.inputs['From Max'].default_value = 0.0; ori.inputs['To Min'].default_value = 0.0; ori.inputs['To Max'].default_value = 0.5
    osc = nt.nodes.new('ShaderNodeMath'); osc.operation = 'MAXIMUM'; L(manr.outputs['Result'], osc.inputs[0]); L(ori.outputs['Result'], osc.inputs[1])
    osc2 = nt.nodes.new('ShaderNodeMath'); osc2.operation = 'MULTIPLY'; L(osc.outputs[0], osc2.inputs[0]); L(dentro.outputs[0], osc2.inputs[1])
    col2 = nt.nodes.new('ShaderNodeMix'); col2.data_type = 'RGBA'; L(osc2.outputs[0], col2.inputs['Factor']); L(col.outputs['Result'], col2.inputs['A']); col2.inputs['B'].default_value = (0.17, 0.02, 0.014, 1)
    col = col2
    bs = nt.nodes.new('ShaderNodeBsdfPrincipled')
    L(col.outputs['Result'], bs.inputs['Base Color'])
    rug = nt.nodes.new('ShaderNodeMix'); rug.data_type = 'FLOAT'; L(dentro.outputs[0], rug.inputs['Factor']); rug.inputs['A'].default_value = 0.55; rug.inputs['B'].default_value = 0.12
    L(rug.outputs['Result'], bs.inputs['Roughness'])
    L(dentro.outputs[0], bs.inputs['Coat Weight']); bs.inputs['Coat Roughness'].default_value = 0.12; bs.inputs['Subsurface Weight'].default_value = 0.0; bs.inputs['Subsurface Radius'].default_value = (1, 0.35, 0.2); bs.inputs['Subsurface Scale'].default_value = 0.004
    # relieve: esponja dentro + bordes hundidos hacia el corte
    prof_cl = nt.nodes.new('ShaderNodeMath'); prof_cl.operation = 'MINIMUM'; L(prof.outputs[0], prof_cl.inputs[0]); prof_cl.inputs[1].default_value = 1.0
    surco = nt.nodes.new('ShaderNodeMath'); surco.operation = 'POWER'; L(prof_cl.outputs[0], surco.inputs[0]); surco.inputs[1].default_value = 0.6
    esp_h = nt.nodes.new('ShaderNodeMath'); esp_h.operation = 'MULTIPLY_ADD'; L(bw.outputs[0], esp_h.inputs[0]); esp_h.inputs[1].default_value = 0.25; L(surco.outputs[0], esp_h.inputs[2])
    bump_h = nt.nodes.new('ShaderNodeMath'); bump_h.operation = 'MULTIPLY'; L(esp_h.outputs[0], bump_h.inputs[0]); L(dentro.outputs[0], bump_h.inputs[1])
    labio = nt.nodes.new('ShaderNodeMath'); labio.operation = 'MULTIPLY'; L(ab_an.outputs[0], labio.inputs[0]); labio.inputs[1].default_value = 0.9
    fuera = nt.nodes.new('ShaderNodeMath'); fuera.operation = 'SUBTRACT'; fuera.inputs[0].default_value = 1.0; L(dentro.outputs[0], fuera.inputs[1])
    labio2 = nt.nodes.new('ShaderNodeMath'); labio2.operation = 'MULTIPLY_ADD'; L(labio.outputs[0], labio2.inputs[0]); L(fuera.outputs[0], labio2.inputs[1]); L(bump_h.outputs[0], labio2.inputs[2])
    bump_h = labio2
    bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 1.0; bump.inputs['Distance'].default_value = 0.0025
    nmt = nt.nodes.new('ShaderNodeTexImage'); nmt.image = bpy.data.images.load(NATHAN + '/tex/rp_nathan_animated_003_norm.jpg', check_existing=True)
    nmt.image.colorspace_settings.name = 'Non-Color'; L(uvc.outputs['UV'], nmt.inputs['Vector'])
    nmn = nt.nodes.new('ShaderNodeNormalMap'); L(nmt.outputs['Color'], nmn.inputs['Color']); L(nmn.outputs['Normal'], bump.inputs['Normal'])
    L(bump_h.outputs[0], bump.inputs['Height']); L(bump.outputs['Normal'], bs.inputs['Normal'])
    # visible solo cerca de la herida (fuera = transparente: se ve la piel de abajo)
    vis = nt.nodes.new('ShaderNodeMath'); vis.operation = 'MAXIMUM'; L(dentro.outputs[0], vis.inputs[0]); L(ab_an.outputs[0], vis.inputs[1])
    vis2 = nt.nodes.new('ShaderNodeMath'); vis2.operation = 'MULTIPLY'; vis2.use_clamp = True; L(vis.outputs[0], vis2.inputs[0]); vis2.inputs[1].default_value = 2.2
    tr_ = nt.nodes.new('ShaderNodeBsdfTransparent')
    mix = nt.nodes.new('ShaderNodeMixShader'); L(vis2.outputs[0], mix.inputs[0]); L(tr_.outputs[0], mix.inputs[1]); L(bs.outputs[0], mix.inputs[2])
    L(mix.outputs[0], out.inputs['Surface'])
    return mat
herida.data.materials.clear(); herida.data.materials.append(material_herida())
herida.visible_shadow = False

# ---------- 5. Objetivo de cámara pegado al antebrazo ----------
def vacio(nombre):
    e = bpy.data.objects.new(nombre, None); sc.collection.objects.link(e); return e
centro_rest = codo + eje * (centro_u * largo)
# Punto sobre la piel en la herida (reposo): el vértice del parche más cercano al centro, en la línea dorsal
mejor = min(herida.data.vertices, key=lambda v: ((hm @ v.co) - (centro_rest + LADO * 0.03)).length)
sup_rest = hm @ mejor.co
obj_brazo = vacio('ObjetivoBrazo')
obj_brazo.parent = arm; obj_brazo.parent_type = 'BONE'; obj_brazo.parent_bone = P + 'lowerarm_r'
# Hijo de hueso: el mundo = arm · pose · traslación a la cola · inversa · local. Se fija la inversa con la pose de reposo.
bL = arm.data.bones[P + 'lowerarm_r']
obj_brazo.matrix_parent_inverse = (arm.matrix_world @ bL.matrix_local @ Matrix.Translation((0, bL.length, 0))).inverted()
obj_brazo.location = sup_rest

# ---------- 6. Cámara: un solo eje de dolly, siempre de frente a la herida ----------
seguir = vacio('Seguir')                               # punto que la cámara sigue
c1 = seguir.constraints.new('COPY_LOCATION'); c1.target = obj_brazo
cuerpo = vacio('Cuerpo'); cuerpo.location = (-0.12, -0.05, 1.17)   # lado derecho del torso
c2 = seguir.constraints.new('COPY_LOCATION'); c2.target = cuerpo
cam = bpy.data.cameras.new('Cam'); camo = bpy.data.objects.new('Cam', cam); sc.collection.objects.link(camo); sc.camera = camo
cam.lens = 85; cam.sensor_width = 36
cam.dof.use_dof = True; cam.dof.focus_object = obj_brazo; cam.dof.aperture_fstop = 4.0
camo.parent = seguir
camo.rotation_euler = VISTA.to_track_quat('-Z', 'Y').to_euler()
def suave(t): t = max(0.0, min(1.0, t)); return t*t*t*(t*(6*t-15)+10)
# Cámara MEDIDA de su render a 30 fps (medida_30fps/4_curva_camara.py → camara_omi.json):
#  - zoom cuadro a cuadro: se acerca lento, acelera, sigue acercándose poquito mientras cose (nunca para),
#    se aleja de golpe y frena; al final sube hacia el hombro cada vez más rápido y ahí corta.
#  - paneo cuadro a cuadro (dx, dy en px de 1080x1920): se copia moviendo la cámara de lado y de alto.
# El tamaño en pantalla va como (0.75/d)^0.959 (calibrado con nuestro render anterior) y el cierre
# queda 1.13 veces más cerca que el anterior (separación de sus puntadas: 46 px contra 40 px).
import json
CAMO = json.load(open(os.path.join(AQUI, 'medida_30fps', 'camara_omi.json')))
assert CAMO['TOTAL'] == TOTAL
Zp = CAMO['zoom'][CAMO['pico']]
def distancia(f):
    zu = 2.905 * CAMO['zoom'][f] / Zp
    return 0.75 * zu ** (-1 / 0.959)
def peso_brazo(f):  # la cámara sigue la herida todo el tiempo (como él); el paneo medido hace lo demás
    return 1.0
qc = VISTA.to_track_quat('-Z', 'Y')
DER = qc @ Vector((1, 0, 0)); ARR = qc @ Vector((0, 1, 0))
off = Vector((0, 0, 0))
COR = json.load(open(os.path.join(AQUI, 'medida_30fps', 'correccion_herida.json')))
GIRO_FINAL = 10.0   # grados al último cuadro (medido a ojo de su render: el brazo queda ~10° inclinado)
from mathutils import Quaternion
for f in range(1, TOTAL + 1):
    d = distancia(f)
    px = d * (36 / 85) / 1920                     # metros por pixel a esa distancia (alto del cuadro = 36 mm)
    off += (-CAMO['dx_px'][f] * DER + CAMO['dy_px'][f] * ARR) * px
    # encuadre: la herida queda donde está la suya (medida_30fps/8_correccion_herida.py, px de 540x960)
    mpp = d * (36 / 85) / 960
    camo.location = -VISTA * d + off + (COR['dx'][f] * DER - COR['dy'][f] * ARR) * mpp
    camo.keyframe_insert('location', frame=f)
    # final: el hombre se va hacia atrás → el brazo se inclina (la mano se queda, el hombro se va a la derecha)
    t_ = max(0.0, (f - 232) / 38); giro = math.radians(GIRO_FINAL) * t_ ** 2.2
    camo.rotation_euler = (qc @ Quaternion((0, 0, 1), giro)).to_euler(); camo.keyframe_insert('rotation_euler', frame=f)
    c2.influence = 1 - peso_brazo(f); c2.keyframe_insert('influence', frame=f)
print('CAMARA d1 %.3f  d pico %.3f  d final %.3f  paneo final %s' % (distancia(1), distancia(CAMO['pico']), distancia(TOTAL), [round(x, 3) for x in off]))

# ---------- 6b. Puntadas: un solo hilo continuo que se dibuja solo ----------
from mathutils.bvhtree import BVHTree
# Piel en reposo (coordenadas de mundo) para poner cada punto exactamente sobre la superficie
bm = bmesh.new(); bm.from_mesh(geo.data); bm.transform(geo.matrix_world); bm.normal_update()
arbol = BVHTree.FromBMesh(bm); bm.free()
lado2 = eje.cross(LADO).normalized()
def sobre_piel(s, t, alto=0.0):
    """s = metros a lo largo de la herida (0 = centro), t = metros de lado (+ derecha de la cámara), alto = sobre la piel."""
    base = codo + eje * (centro_u * largo + s)
    ang = t / 0.035
    dirr = (LADO * math.cos(ang) + lado2 * math.sin(ang)).normalized()
    hit = arbol.ray_cast(base + dirr * 0.2, -dirr, 0.4)
    p, n = hit[0], hit[1]
    if p is None: p, n = base + dirr * 0.035, dirr
    if n.dot(dirr) < 0: n = -n          # normal siempre hacia afuera
    return p + n * (0.00025 + alto), n
MEDIO = (U1 - U0) / 2 * largo
N = 11                                  # puntadas
G = -0.0050                             # cada puntada entra/sale a 5 mm del corte (signo: arriba-izquierda → abajo-derecha, como él)
ds = (2 * MEDIO * 0.84) / N
s0 = -MEDIO * 0.84
ctrl = []
pts_entrada = []
for i in range(N):
    sa = s0 + i * ds
    a, _ = sobre_piel(sa, -G); b, _ = sobre_piel(sa + ds * 0.55, G)
    cima, _ = sobre_piel(sa + ds * 0.27, 0, 0.0016)
    # rulito junto a la salida derecha, como en su render
    sb = sa + ds * 0.55
    r1, _ = sobre_piel(sb + 0.0004, G - 0.0008, 0.0007)
    r2, _ = sobre_piel(sb - 0.0005, G - 0.0007, 0.0007)
    ctrl += [a, cima, b, r1, r2]
    pts_entrada += [a, b]
    if i < N - 1:   # por debajo de la piel hasta la siguiente entrada
        b2, _ = sobre_piel(sa + ds * 0.60, G * 0.9, -0.0045)
        bajo, _ = sobre_piel(sa + ds * 0.8, 0, -0.0070)
        a2, _ = sobre_piel(sa + ds * 1.0, -G * 0.9, -0.0045)
        ctrl += [b2, bajo, a2]
# Catmull-Rom denso → polilínea (así sabemos dónde va la punta en cada cuadro)
def catmull(pts, n=14):
    out = []
    P_ = [pts[0]] + pts + [pts[-1]]
    for i in range(1, len(P_) - 2):
        p0, p1, p2, p3 = P_[i-1], P_[i], P_[i+1], P_[i+2]
        for k in range(n):
            t = k / n; t2 = t*t; t3 = t2*t
            out.append(0.5*((2*p1) + (-p0+p2)*t + (2*p0-5*p1+4*p2-p3)*t2 + (-p0+3*p1-3*p2+p3)*t3))
    out.append(pts[-1]); return out
poli = catmull(ctrl)
acum = [0.0]
for i in range(1, len(poli)): acum.append(acum[-1] + (poli[i] - poli[i-1]).length)
TOT = acum[-1]
if os.environ.get('DBG_HILO'):
    alt=[]
    for q in poli:
        loc, nrm, _, _ = arbol.find_nearest(q)
        d=(q-loc); sgn = 1 if d.dot(q-(codo+eje*((q-codo).dot(eje)))) > 0 else -1
        alt.append(sgn*d.length*1000)
    print('ALTURAS_MM', ' '.join(f'{a:.1f}' for a in alt[:200]))
    for s_, t_, al in [(0,-G,0),(0,0,-0.007),(0,G,-0.0045),(0,0,0.001)]:
        base = codo + eje * (centro_u * largo + s_); ang = t_/0.035
        dirr = (LADO * math.cos(ang) + lado2 * math.sin(ang)).normalized()
        hit = arbol.ray_cast(base + dirr * 0.2, -dirr, 0.4)
        q,_ = sobre_piel(s_, t_, al); loc,_,_,dn = arbol.find_nearest(q)
        print('RAY', t_, al, 'hit' if hit[0] else 'NONE', 'dist', round(hit[3],4) if hit[0] else None, 'n.dirr', round(hit[1].dot(dirr),3) if hit[0] else None, 'nearest_mm', round(dn*1000,2), 'radio_mm', round(((hit[0] if hit[0] else base)-base).length*1000,1))
    print('ARRIBA', sum(a>0 for a in alt), 'de', len(alt))
def en(fr):  # punto a fracción fr del largo
    L_ = fr * TOT
    for i in range(1, len(acum)):
        if acum[i] >= L_:
            k = (L_ - acum[i-1]) / max(1e-9, acum[i] - acum[i-1]); return poli[i-1].lerp(poli[i], k)
    return poli[-1]

def curva(nombre, puntos, radio):
    cu = bpy.data.curves.new(nombre, 'CURVE'); cu.dimensions = '3D'
    cu.bevel_depth = radio; cu.bevel_resolution = 3; cu.use_fill_caps = True
    sp = cu.splines.new('POLY'); sp.points.add(len(puntos) - 1)
    for p_, q in zip(sp.points, puntos): p_.co = (*q, 1)
    ob = bpy.data.objects.new(nombre, cu); sc.collection.objects.link(ob)
    return ob, cu
def pegar_a_hueso(ob, hueso_nombre):
    ob.parent = arm; ob.parent_type = 'BONE'; ob.parent_bone = P + hueso_nombre
    bb = arm.data.bones[P + hueso_nombre]
    ob.matrix_parent_inverse = (arm.matrix_world @ bb.matrix_local @ Matrix.Translation((0, bb.length, 0))).inverted()

# hueso que más mueve la piel de la herida
pesos = {}
for v in herida.data.vertices:
    for g in v.groups:
        nm_ = herida.vertex_groups[g.group].name; pesos[nm_] = pesos.get(nm_, 0) + g.weight
HUESO = max(pesos, key=pesos.get).replace(P, '')
print('HUESO de la herida', HUESO, {k.replace(P,''): round(v,1) for k, v in sorted(pesos.items(), key=lambda x: -x[1])[:3]})
pegar_a_hueso(obj_brazo, HUESO)

# El hilo es un tubo que se deforma con la piel: cada vértice toma los pesos de la piel más cercana
from mathutils.kdtree import KDTree
kd = KDTree(len(geo.data.vertices))
for v in geo.data.vertices: kd.insert(geo.matrix_world @ v.co, v.index)
kd.balance()
nombres_g = {g.index: g.name for g in geo.vertex_groups}
def tubo(nombre, pts, radio, lados=8):
    me = bpy.data.meshes.new(nombre); verts = []; caras = []; uatr = []
    t_prev = None; n_prev = None
    for i, p_ in enumerate(pts):
        t = (pts[min(i+1, len(pts)-1)] - pts[max(i-1, 0)]).normalized()
        if n_prev is None:
            n_ = t.cross(Vector((0, 0, 1)) if abs(t.z) < 0.9 else Vector((1, 0, 0))).normalized()
        else:
            n_ = (n_prev - t * n_prev.dot(t)).normalized()
        b_ = t.cross(n_)
        for k in range(lados):
            a = 2 * math.pi * k / lados
            verts.append(p_ + (n_ * math.cos(a) + b_ * math.sin(a)) * radio); uatr.append(acum[i] / TOT if len(pts) == len(acum) else i / (len(pts)-1))
        n_prev = n_
    for i in range(len(pts) - 1):
        for k in range(lados):
            a = i*lados + k; b = i*lados + (k+1) % lados
            caras.append((a, b, b + lados, a + lados))
    me.from_pydata([tuple(v) for v in verts], [], caras); me.shade_smooth()
    at = me.attributes.new('u', 'FLOAT', 'POINT'); at.data.foreach_set('value', uatr)
    ob = bpy.data.objects.new(nombre, me); sc.collection.objects.link(ob)
    # pesos de la piel cercana (3 vértices más cercanos, por distancia)
    grupos = {}
    for vi, v in enumerate(me.vertices):
        cerca = kd.find_n(v.co, 3); tot = 0; acc = {}
        for (co, idx, d) in cerca:
            w_ = 1.0 / max(d, 1e-5); tot += w_
            for g in geo.data.vertices[idx].groups:
                acc[g.group] = acc.get(g.group, 0) + g.weight * w_
        for gi, wsum in acc.items():
            nm_ = nombres_g[gi]
            if nm_ not in grupos: grupos[nm_] = ob.vertex_groups.new(name=nm_)
            grupos[nm_].add([vi], wsum / tot, 'REPLACE')
    ob.parent = arm; ob.matrix_parent_inverse = arm.matrix_world.inverted()
    mo = ob.modifiers.new('Esqueleto', 'ARMATURE'); mo.object = arm
    return ob
hilo = tubo('Hilo', poli, 0.00042)
mh = bpy.data.materials.new('Nylon'); mh.use_nodes = True; ntm = mh.node_tree
bh = ntm.nodes['Principled BSDF']
bh.inputs['Base Color'].default_value = (0.80, 0.80, 0.82, 1); bh.inputs['Roughness'].default_value = 0.30
bh.inputs['Coat Weight'].default_value = 0.3
# se dibuja solo: visible hasta la fracción 'progreso' del largo
atr = ntm.nodes.new('ShaderNodeAttribute'); atr.attribute_name = 'u'
prog = ntm.nodes.new('ShaderNodeValue'); prog.name = 'progreso'
lt = ntm.nodes.new('ShaderNodeMath'); lt.operation = 'LESS_THAN'
ntm.links.new(atr.outputs['Fac'], lt.inputs[0]); ntm.links.new(prog.outputs[0], lt.inputs[1])
trn = ntm.nodes.new('ShaderNodeBsdfTransparent'); mx = ntm.nodes.new('ShaderNodeMixShader')
ntm.links.new(lt.outputs[0], mx.inputs[0]); ntm.links.new(trn.outputs[0], mx.inputs[1]); ntm.links.new(bh.outputs[0], mx.inputs[2])
ntm.links.new(mx.outputs[0], ntm.nodes['Material Output'].inputs['Surface'])
hilo.data.materials.append(mh)

# Tiempos (30 fps): cose de 1.5 s a 4.6 s; cada puntada ~8 cuadros como en la referencia
C0, C1 = 93, 177      # su hilo entra en h=79 y la última puntada cae en h≈163 (f = h + 14)
def cosido(f): return max(0.0, min(1.0, (f - C0) / (C1 - C0)))
def avance(f):
    x = cosido(f) * N
    i = int(x); fr = x - i
    fr = suave(min(1, fr / 0.8))
    return min(1.0, (i + fr) / N)
for f in range(1, TOTAL + 1):
    prog.outputs[0].default_value = avance(f) + (0.0 if avance(f) < 1 else 0.01)
    prog.outputs[0].keyframe_insert('default_value', frame=f)

# Cola: de la punta hacia la aguja, fuera de cuadro a la izquierda (como en su toma)
izq = -(eje.cross(-VISTA)).normalized()
cola, ccu = curva('Cola', [en(0)] * 3, 0.00036)
ccu.materials.append(mh)
pegar_a_hueso(cola, HUESO)
for f in range(1, TOTAL + 1):
    a = avance(f); punta = en(a)
    izq_img = eje.cross(LADO).normalized()   # todo en reposo: LADO mira a la cámara
    if izq_img.dot(lado2) < 0: izq_img = -izq_img
    lejos = punta + izq_img * 0.13 + LADO * 0.012 + eje * (0.02 + 0.025 * math.sin(f * 0.07))
    medio = punta.lerp(lejos, 0.5) + LADO * 0.006
    vis_ = 1.0 if C0 - 3 <= f <= C1 + 4 else 0.0
    for p_, q in zip(ccu.splines[0].points, [punta, medio, lejos]):
        p_.co = (*q, 1); p_.keyframe_insert('co', frame=f)
    cola.hide_render = vis_ == 0; cola.keyframe_insert('hide_render', frame=f)

# La herida se cierra conforme avanzan las puntadas y luego queda como línea
nodo_ab = herida.data.materials[0].node_tree.nodes['abertura']
for f in range(1, TOTAL + 1):
    v_ = 1.0 - 0.80 * suave(cosido(f - 6))
    if f > C1 + 18: v_ -= 0.18 * suave((f - C1 - 18) / 50)
    nodo_ab.outputs[0].default_value = v_; nodo_ab.outputs[0].keyframe_insert('default_value', frame=f)

# ---------- 6c. Vello del antebrazo (él: ~2,600 pelos 3D) ----------
# Pelos propios (tubos finos con punta), en metros reales, pegados a la piel con sus pesos.
import random
random.seed(7)
bmv = bmesh.new(); bmv.from_mesh(geo.data); bmv.transform(geo.matrix_world); bmv.normal_update()
cand = []
for fa in bmv.faces:
    c_ = fa.calc_center_median(); d_ = c_ - codo; u_ = d_.dot(eje) / largo
    if -0.12 < u_ < 0.97 and (d_ - eje * d_.dot(eje)).length < 0.07:
        cand.append((fa, fa.calc_area()))
area_tot = sum(a_ for _, a_ in cand)
NPELOS = 2600
verts_v = []; caras_v = []; pesos_v = []
def raiz_en(fa):
    r1, r2 = random.random(), random.random()
    if r1 + r2 > 1: r1, r2 = 1 - r1, 1 - r2
    v0, v1_, v2_ = [l.vert.co for l in fa.loops]
    return v0 + (v1_ - v0) * r1 + (v2_ - v0) * r2
acum_a = []; t_ = 0
for fa, a_ in cand: t_ += a_; acum_a.append(t_)
import bisect
hechos = 0
while hechos < NPELOS:
    fa = cand[bisect.bisect_left(acum_a, random.random() * area_tot)][0]
    p0 = raiz_en(fa); n0 = fa.normal.copy()
    # fuera del corte (3 mm a cada lado de la línea de la herida)
    d_ = p0 - codo; s_ = d_.dot(eje) / largo
    rad = (d_ - eje * d_.dot(eje)).normalized()
    if U0 - 0.01 < s_ < U1 + 0.01 and rad.dot(LADO) > 0.96: continue
    t_dir = (eje - n0 * eje.dot(n0)).normalized()
    giro = random.uniform(-0.45, 0.45); lat = n0.cross(t_dir)
    dirp = (t_dir * math.cos(giro) + lat * math.sin(giro)).normalized()
    Lp = random.uniform(0.003, 0.0075)
    pts_ = [p0, p0 + dirp * 0.30 * Lp + n0 * 0.22 * Lp, p0 + dirp * 0.65 * Lp + n0 * 0.30 * Lp, p0 + dirp * Lp + n0 * 0.26 * Lp]
    base_i = len(verts_v)
    for k, q in enumerate(pts_):
        tg = (pts_[min(k+1, 3)] - pts_[max(k-1, 0)]).normalized(); nb = tg.cross(n0).normalized(); nc = tg.cross(nb)
        r_ = 0.000055 * (1 - 0.75 * k / 3)
        for j in range(3):
            an = 2 * math.pi * j / 3
            verts_v.append(q + (nb * math.cos(an) + nc * math.sin(an)) * r_)
    for k in range(3):
        for j in range(3):
            a_ = base_i + k*3 + j; b_ = base_i + k*3 + (j+1) % 3
            caras_v.append((a_, b_, b_ + 3, a_ + 3))
    pesos_v.append((base_i, p0))
    hechos += 1
bmv.free()
mev = bpy.data.meshes.new('Vello'); mev.from_pydata([tuple(v) for v in verts_v], [], caras_v)
vello = bpy.data.objects.new('Vello', mev); sc.collection.objects.link(vello)
grupos_v = {}
for base_i, p0 in pesos_v:
    acc = {}; tot = 0
    for (co, idx, d) in kd.find_n(p0, 3):
        w_ = 1.0 / max(d, 1e-5); tot += w_
        for g in geo.data.vertices[idx].groups: acc[g.group] = acc.get(g.group, 0) + g.weight * w_
    for gi, wsum in acc.items():
        nm_ = nombres_g[gi]
        if nm_ not in grupos_v: grupos_v[nm_] = vello.vertex_groups.new(name=nm_)
        grupos_v[nm_].add(list(range(base_i, base_i + 12)), wsum / tot, 'REPLACE')
vello.parent = arm; vello.matrix_parent_inverse = arm.matrix_world.inverted()
mo = vello.modifiers.new('Esqueleto', 'ARMATURE'); mo.object = arm
mv = bpy.data.materials.new('Vello'); mv.use_nodes = True
bv = mv.node_tree.nodes['Principled BSDF']
bv.inputs['Base Color'].default_value = (0.035, 0.022, 0.015, 1); bv.inputs['Roughness'].default_value = 0.42
vello.data.materials.append(mv)
vello.visible_shadow = True
print('VELLO', NPELOS, 'pelos', len(verts_v), 'vertices')

# ---------- 7. Luz: suave arriba-izquierda, relleno azul del mundo, contra a la derecha ----------
luz_area('Key', (-1.2, -2.2, 2.4), (-0.25, 0, 1.1), 420, 2.5, (1.0, 0.96, 0.9))
luz_area('Contra', (0.6, 1.6, 1.6), (-0.25, 0, 1.1), 160, 2.0, (0.85, 0.92, 1.0))
sc.render.use_motion_blur = True; sc.render.motion_blur_shutter = 0.5

if '--guardar' in args:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(AQUI, 'puntadas_brazo.blend'))
if '--foto' in args:
    for fr in args[args.index('--foto')+1].split(','):
        sc.frame_set(int(fr))
        sc.render.filepath = os.path.join(AQUI, 'fotos', f'f{int(fr):03d}.png')
        bpy.ops.render.render(write_still=True)

if '--anim' in args:
    os.makedirs(os.path.join(AQUI, 'cuadros'), exist_ok=True)
    sc.render.filepath = os.path.join(AQUI, 'cuadros', 'c_')
    sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 92
    bpy.ops.render.render(animation=True)
