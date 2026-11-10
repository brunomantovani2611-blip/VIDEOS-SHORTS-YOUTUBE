# Short final de puntadas (réplica de «How Stitches Work» de Mr omi, 31 s)
# Él copió el de Zack D. Films: pantorrilla derecha por detrás caminando, un hilo cose la herida,
# tijeras cortan, acercamiento con la curación (hinchazón, capa amarilla, tejido rojo nuevo, cicatriz)
# y se aleja hasta ver las piernas caminando. Persona hecha con MPFB (como él), short gris, tenis blancos.
# Uso: Blender -b -P escena.py -- [--foto N,N] [--anim] [--guardar]
import bpy, bmesh, sys, os, math
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from comun import *
from mathutils import Vector, Matrix
from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.targetservice import TargetService
from bl_ext.user_default.mpfb.services.locationservice import LocationService

args = [a for a in (sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []) if not a.endswith('.py')]
AQUI = os.path.dirname(os.path.abspath(__file__))
TOTAL = 930                      # 31 s a 30 fps, como el suyo
P = ''                           # el esqueleto de MPFB no lleva prefijo
RADIO = 0.052                    # radio aproximado de la pantorrilla (m)

limpiar()
# ---------- 0. Persona MPFB: hombre joven, short gris, tenis blancos ----------
md = TargetService.get_default_macro_info_dict()
md['gender'] = 1.0; md['age'] = 0.5; md['muscle'] = 0.62; md['weight'] = 0.5
geo = HumanService.create_human(macro_detail_dict=md)
HumanService.add_builtin_rig(geo, 'default')
DATOS = LocationService.get_user_data()
HumanService.set_character_skin(os.path.join(DATOS, 'skins/young_caucasian_male/young_caucasian_male.mhmat'), geo, skin_type='ENHANCED_SSS')
for c in ['clothes/male_casualsuit04/male_casualsuit04.mhclo', 'clothes/shoes05/shoes05.mhclo']:
    HumanService.add_mhclo_asset(os.path.join(DATOS, c), geo, asset_type='Clothes', subdiv_levels=1)
arm = bpy.data.objects['Human.rig']
PIEL_DIF = os.path.join(DATOS, 'skins/young_caucasian_male/young_lightskinned_male_diffuse.png')
# jeans → short gris
HEM = 0.56
pant = bpy.data.objects['Human.male_casualsuit04']
bmp = bmesh.new(); bmp.from_mesh(pant.data)
bmesh.ops.delete(bmp, geom=[f for f in bmp.faces if (pant.matrix_world @ f.calc_center_median()).z < HEM], context='FACES')
bmp.to_mesh(pant.data); bmp.free()
for m in pant.data.materials:
    if m and m.node_tree:
        for n in m.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED':
                for l in list(n.inputs['Base Color'].links): m.node_tree.links.remove(l)
                n.inputs['Base Color'].default_value = (0.16, 0.165, 0.175, 1); n.inputs['Roughness'].default_value = 0.85
# la pierna bajo el short sí se ve
grp = geo.vertex_groups['Delete.male_casualsuit04']
grp.remove([v.index for v in geo.data.vertices if (geo.matrix_world @ v.co).z < HEM + 0.04])
# Malla final de la piel: formas aplicadas, sin ayudantes (las «mallas guía» de MPFB rodean las piernas), subdividida 2 veces
bpy.context.view_layer.objects.active = geo; geo.select_set(True)
bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
gi = geo.vertex_groups['body'].index
bmb = bmesh.new(); bmb.from_mesh(geo.data)
dl = bmb.verts.layers.deform.active
bmesh.ops.delete(bmb, geom=[v for v in bmb.verts if v[dl].get(gi, 0.0) < 0.5], context='VERTS')
bmb.to_mesh(geo.data); bmb.free()
geo.modifiers.remove(geo.modifiers['Hide helpers'])
sub = geo.modifiers.new('Sub', 'SUBSURF'); sub.levels = 2
bpy.ops.object.modifier_move_to_index(modifier='Sub', index=0)
bpy.ops.object.modifier_apply(modifier='Sub')
print('PIEL', len(geo.data.vertices), 'vertices')

# Piel propia: textura de MPFB + poros + SSS (la de MPFB se ve de videojuego, como le dijo Claude a él)
def poros(nt, escala=1.0):
    tc = nt.nodes.new('ShaderNodeTexCoord')
    n1 = nt.nodes.new('ShaderNodeTexVoronoi'); n1.feature = 'F1'; n1.inputs['Scale'].default_value = 1400 * escala; nt.links.new(tc.outputs['Object'], n1.inputs['Vector'])
    n2 = nt.nodes.new('ShaderNodeTexNoise'); n2.inputs['Scale'].default_value = 300 * escala; n2.inputs['Detail'].default_value = 6; nt.links.new(tc.outputs['Object'], n2.inputs['Vector'])
    mx = nt.nodes.new('ShaderNodeMath'); mx.operation = 'MULTIPLY_ADD'; nt.links.new(n1.outputs['Distance'], mx.inputs[0]); mx.inputs[1].default_value = 0.6; nt.links.new(n2.outputs['Fac'], mx.inputs[2])
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.35; bp.inputs['Distance'].default_value = 0.0004
    nt.links.new(mx.outputs[0], bp.inputs['Height'])
    return bp.outputs['Normal']
def piel_mpfb(obj):
    mat = bpy.data.materials.new('PielLuis'); mat.use_nodes = True; nt = mat.node_tree; nt.nodes.clear()
    o = nt.nodes.new('ShaderNodeOutputMaterial'); b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = obj.data.uv_layers[0].name
    d = nt.nodes.new('ShaderNodeTexImage'); d.image = bpy.data.images.load(PIEL_DIF, check_existing=True); nt.links.new(uv.outputs['UV'], d.inputs['Vector'])
    # un poco más bronceada y con manchitas (variación de color)
    hsv = nt.nodes.new('ShaderNodeHueSaturation'); hsv.inputs['Saturation'].default_value = 1.05; hsv.inputs['Value'].default_value = 0.46; hsv.inputs['Hue'].default_value = 0.5
    nt.links.new(d.outputs['Color'], hsv.inputs['Color'])
    tc = nt.nodes.new('ShaderNodeTexCoord'); mn = nt.nodes.new('ShaderNodeTexNoise'); mn.inputs['Scale'].default_value = 40; nt.links.new(tc.outputs['Object'], mn.inputs['Vector'])
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['To Min'].default_value = 0.88; mr.inputs['To Max'].default_value = 1.06; nt.links.new(mn.outputs['Fac'], mr.inputs['Value'])
    mul = nt.nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs['Factor'].default_value = 1
    tinte = nt.nodes.new('ShaderNodeMix'); tinte.data_type = 'RGBA'; tinte.blend_type = 'MULTIPLY'; tinte.inputs['Factor'].default_value = 1; tinte.inputs['B'].default_value = (0.92, 0.66, 0.48, 1)
    nt.links.new(hsv.outputs['Color'], mul.inputs['A']); cc = nt.nodes.new('ShaderNodeCombineColor')
    for k in range(3): nt.links.new(mr.outputs['Result'], cc.inputs[k])
    nt.links.new(cc.outputs[0], mul.inputs['B'])
    nt.links.new(mul.outputs['Result'], tinte.inputs['A']); nt.links.new(tinte.outputs['Result'], b.inputs['Base Color'])
    rg = nt.nodes.new('ShaderNodeMapRange'); rg.inputs['To Min'].default_value = 0.42; rg.inputs['To Max'].default_value = 0.62; nt.links.new(mn.outputs['Fac'], rg.inputs['Value'])
    nt.links.new(rg.outputs['Result'], b.inputs['Roughness'])
    nt.links.new(poros(nt), b.inputs['Normal'])
    b.inputs['Subsurface Weight'].default_value = 0.18; b.inputs['Subsurface Radius'].default_value = (1.0, 0.35, 0.2); b.inputs['Subsurface Scale'].default_value = 0.004
    nt.links.new(b.outputs['BSDF'], o.inputs['Surface'])
    obj.data.materials[0] = mat
    return mat
piel_mpfb(geo)

RAPIDO = '--rapido' in args
sc = render_vertical(0.25, 8) if RAPIDO else render_vertical(0.5, 64)
sc.frame_start, sc.frame_end = 1, TOTAL
fondo_azul((0.19, 0.48, 0.75), 1.0, 0.25)

# ---------- 1. Caminata en su lugar (procedural, el rig de MPFB no trae animación) ----------
# Eje X local: cadera adelante = negativo, rodilla doblada = positivo, punta del pie arriba = positivo.
CICLO_F = 34                                   # cuadros por paso doble
def velocidad(f):                              # 1 = paso normal
    if f < 60: return 0.30
    if f < 95: return 0.30 + (0.03 - 0.30) * ((f - 60) / 35)
    if f < 780: return 0.03
    return 0.03 + (1.0 - 0.03) * min(1.0, (f - 780) / 50)
fase = [0.0]
for f in range(2, TOTAL + 2): fase.append(fase[-1] + velocidad(f) / CICLO_F)
FASE0 = 0.12
for pb in arm.pose.bones: pb.rotation_mode = 'XYZ'
def pose_pierna(lado, ph):
    s = math.sin(2 * math.pi * ph); c = math.cos(2 * math.pi * ph)
    arm.pose.bones['upperleg02.' + lado].rotation_euler = (-0.32 * s - 0.05, 0, 0)
    arm.pose.bones['lowerleg01.' + lado].rotation_euler = (0.08 + 0.55 * max(0.0, -c) ** 1.5, 0, 0)
    arm.pose.bones['foot.' + lado].rotation_euler = (0.18 * s, 0, 0)
for f in range(1, TOTAL + 1, 2):
    ph = fase[f - 1] + FASE0
    pose_pierna('R', ph); pose_pierna('L', ph + 0.5)
    arm.pose.bones['root'].location = (0, 0.008 * abs(math.sin(2 * math.pi * ph)), 0)
    for lado in 'RL':
        for bn in ['upperleg02.', 'lowerleg01.', 'foot.']:
            arm.pose.bones[bn + lado].keyframe_insert('rotation_euler', frame=f)
    arm.pose.bones['root'].keyframe_insert('location', frame=f)
# los brazos abajo (salen en la toma abierta del final)
for lado, sg in (('L', 1), ('R', -1)):
    arm.pose.bones['upperarm01.' + lado].rotation_mode = 'XYZ'
    arm.pose.bones['upperarm01.' + lado].rotation_euler = (0, 0, sg * 0.0)

# ---------- 2. Malla en triángulos (la herida usa exactamente los mismos) ----------
bm = bmesh.new(); bm.from_mesh(geo.data)
bmesh.ops.triangulate(bm, faces=bm.faces[:], quad_method='BEAUTY', ngon_method='BEAUTY')
bm.to_mesh(geo.data); bm.free()

# Pantorrilla derecha en reposo: eje rodilla→tobillo
M = arm.matrix_world
codo = M @ arm.data.bones['lowerleg01.R'].head_local; muneca = M @ arm.data.bones['foot.R'].head_local
eje = (muneca - codo).normalized()
largo = (muneca - codo).length
# La cámara mira desde atrás (+Y hacia −Y), un poco desde afuera de la pierna derecha
VISTA = Vector((0.30, -1.0, -0.06)).normalized()
sc.frame_set(120)
pb = arm.pose.bones['lowerleg01.R']
Mdef = arm.matrix_world @ pb.matrix @ pb.bone.matrix_local.inverted() @ arm.matrix_world.inverted()
LADO = Mdef.to_3x3().inverted() @ (-VISTA)
LADO = (LADO - eje * LADO.dot(eje)).normalized()
print('LADO reposo', [round(x,3) for x in LADO])
U0, U1 = 0.10, 0.50            # tramo de la pantorrilla donde va la herida (~17 cm)
centro_u = (U0 + U1) / 2

gm = geo.matrix_world
sel = set()
for v in geo.data.vertices:
    p = gm @ v.co
    d = p - codo; u = d.dot(eje) / largo
    radial = d - eje * d.dot(eje)
    if U0 - 0.04 < u < U1 + 0.04 and radial.length > 0.01 and radial.normalized().dot(LADO) > 0.75:
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
    # curación (como la suya, que copia la de Zack): hinchazón → capa amarilla → tejido rojo nuevo → cicatriz
    V_ = {}
    for nm_ in ('hinchazon', 'amarillo', 'tejido', 'cicatriz'):
        v_ = nt.nodes.new('ShaderNodeValue'); v_.name = nm_; v_.outputs[0].default_value = 0.0; V_[nm_] = v_.outputs[0]
    MEDIO = (U1 - U0) / 2 * largo           # medio largo de la herida (m)
    ANCHO = 0.0065                          # media abertura máxima (m)
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
    anillo.inputs['From Min'].default_value = 0.0
    fmx = nt.nodes.new('ShaderNodeMath'); fmx.operation = 'MULTIPLY_ADD'; L(V_['hinchazon'], fmx.inputs[0]); fmx.inputs[1].default_value = 0.0070; fmx.inputs[2].default_value = 0.0020
    L(fmx.outputs[0], anillo.inputs['From Max'])
    anillo.inputs['To Min'].default_value = 0.55; anillo.inputs['To Max'].default_value = 0.0
    # el anillo solo existe a lo largo de la herida
    a_largo = nt.nodes.new('ShaderNodeMath'); a_largo.operation = 'MULTIPLY'; L(anillo.outputs['Result'], a_largo.inputs[0]); L(e4.outputs[0], a_largo.inputs[1])
    ab_h = nt.nodes.new('ShaderNodeMath'); ab_h.operation = 'MAXIMUM'; L(ab.outputs[0], ab_h.inputs[0]); L(V_['hinchazon'], ab_h.inputs[1])
    ab_an = nt.nodes.new('ShaderNodeMath'); ab_an.operation = 'MULTIPLY'; L(a_largo.outputs[0], ab_an.inputs[0]); L(ab_h.outputs[0], ab_an.inputs[1])
    # piel = misma textura del cuerpo
    piel = nt.nodes.new('ShaderNodeTexImage'); piel.image = bpy.data.images.load(PIEL_DIF, check_existing=True); L(uvc.outputs['UV'], piel.inputs['Vector'])
    rojo_piel = nt.nodes.new('ShaderNodeMix'); rojo_piel.data_type = 'RGBA'; rojo_piel.blend_type = 'MULTIPLY'
    ph_ = nt.nodes.new('ShaderNodeHueSaturation'); ph_.inputs['Saturation'].default_value = 1.05; ph_.inputs['Value'].default_value = 0.46; L(piel.outputs['Color'], ph_.inputs['Color'])
    pt_ = nt.nodes.new('ShaderNodeMix'); pt_.data_type = 'RGBA'; pt_.blend_type = 'MULTIPLY'; pt_.inputs['Factor'].default_value = 1; pt_.inputs['B'].default_value = (0.92, 0.66, 0.48, 1); L(ph_.outputs['Color'], pt_.inputs['A'])
    L(ab_an.outputs[0], rojo_piel.inputs['Factor']); L(pt_.outputs['Result'], rojo_piel.inputs['A']); rojo_piel.inputs['B'].default_value = (0.80, 0.30, 0.26, 1)
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
    # capa amarilla (fibrina) dentro del corte, con manchas
    nam = nt.nodes.new('ShaderNodeTexNoise'); nam.inputs['Scale'].default_value = 600; nam.inputs['Detail'].default_value = 8; L(uvh.outputs['UV'], nam.inputs['Vector'])
    ram = nt.nodes.new('ShaderNodeValToRGB'); L(nam.outputs['Fac'], ram.inputs[0])
    ram.color_ramp.elements[0].color = (0.42, 0.22, 0.03, 1); ram.color_ramp.elements[1].color = (0.85, 0.62, 0.12, 1)
    cam_ = nt.nodes.new('ShaderNodeMix'); cam_.data_type = 'RGBA'; L(V_['amarillo'], cam_.inputs['Factor']); L(carne2.outputs['Result'], cam_.inputs['A']); L(ram.outputs['Color'], cam_.inputs['B'])
    L(rojo_piel.outputs['Result'], col.inputs['A']); L(cam_.outputs['Result'], col.inputs['B'])
    # MANCHAS OSCURAS y orilla de sangre seca adentro (la suya no es de un solo rojo)
    man = nt.nodes.new('ShaderNodeTexNoise'); man.inputs['Scale'].default_value = 70; man.inputs['Detail'].default_value = 3; L(uvh.outputs['UV'], man.inputs['Vector'])
    manr = nt.nodes.new('ShaderNodeMapRange'); L(man.outputs['Fac'], manr.inputs['Value']); manr.inputs['From Min'].default_value = 0.56; manr.inputs['From Max'].default_value = 0.7
    ori = nt.nodes.new('ShaderNodeMapRange'); L(dist.outputs[0], ori.inputs['Value']); ori.inputs['From Min'].default_value = -0.0008; ori.inputs['From Max'].default_value = 0.0; ori.inputs['To Min'].default_value = 0.0; ori.inputs['To Max'].default_value = 0.5
    osc = nt.nodes.new('ShaderNodeMath'); osc.operation = 'MAXIMUM'; L(manr.outputs['Result'], osc.inputs[0]); L(ori.outputs['Result'], osc.inputs[1])
    osc2 = nt.nodes.new('ShaderNodeMath'); osc2.operation = 'MULTIPLY'; L(osc.outputs[0], osc2.inputs[0]); L(dentro.outputs[0], osc2.inputs[1])
    col2 = nt.nodes.new('ShaderNodeMix'); col2.data_type = 'RGBA'; L(osc2.outputs[0], col2.inputs['Factor']); L(col.outputs['Result'], col2.inputs['A']); col2.inputs['B'].default_value = (0.17, 0.02, 0.014, 1)
    col = col2
    # franja de la herida (dentro + 2.5 mm) donde crece el tejido nuevo y luego la cicatriz
    franja = nt.nodes.new('ShaderNodeMath'); franja.operation = 'LESS_THAN'; L(av2.outputs[0], franja.inputs[0])
    fw = nt.nodes.new('ShaderNodeMath'); fw.operation = 'ADD'; L(w2.outputs[0], fw.inputs[0]); fwt = nt.nodes.new('ShaderNodeMath'); fwt.operation = 'MULTIPLY_ADD'; L(V_['tejido'], fwt.inputs[0]); fwt.inputs[1].default_value = 0.0045; fwt.inputs[2].default_value = 0.0026; L(fwt.outputs[0], fw.inputs[1]); L(fw.outputs[0], franja.inputs[1])
    fr_l = nt.nodes.new('ShaderNodeMath'); fr_l.operation = 'MULTIPLY'; L(franja.outputs[0], fr_l.inputs[0]); L(e4.outputs[0], fr_l.inputs[1])
    # tejido rojo: red de ramitas (orillas de Voronoi) que se va llenando
    dis = nt.nodes.new('ShaderNodeTexNoise'); dis.inputs['Scale'].default_value = 220; L(uvh.outputs['UV'], dis.inputs['Vector'])
    dsm = nt.nodes.new('ShaderNodeVectorMath'); dsm.operation = 'MULTIPLY_ADD'; L(dis.outputs['Color'], dsm.inputs[0]); dsm.inputs[1].default_value = (0.0012, 0.0012, 0.0); L(uvh.outputs['UV'], dsm.inputs[2])
    vor = nt.nodes.new('ShaderNodeTexVoronoi'); vor.feature = 'DISTANCE_TO_EDGE'; vor.inputs['Scale'].default_value = 300; L(dsm.outputs[0], vor.inputs['Vector'])
    org = nt.nodes.new('ShaderNodeTexNoise'); org.inputs['Scale'].default_value = 260; org.inputs['Detail'].default_value = 10; org.inputs['Roughness'].default_value = 0.6; L(dsm.outputs[0], org.inputs['Vector'])
    cen = nt.nodes.new('ShaderNodeMath'); cen.operation = 'DIVIDE'; L(av.outputs[0], cen.inputs[0]); cen.inputs[1].default_value = 0.012
    org2 = nt.nodes.new('ShaderNodeMath'); org2.operation = 'SUBTRACT'; L(org.outputs['Fac'], org2.inputs[0]); L(cen.outputs[0], org2.inputs[1])
    umb = nt.nodes.new('ShaderNodeMath'); umb.operation = 'MULTIPLY_ADD'; L(V_['tejido'], umb.inputs[0]); umb.inputs[1].default_value = -0.75; umb.inputs[2].default_value = 0.78
    ram_t0 = nt.nodes.new('ShaderNodeMath'); ram_t0.operation = 'SUBTRACT'; L(org2.outputs[0], ram_t0.inputs[0]); L(umb.outputs[0], ram_t0.inputs[1])
    ram_t = nt.nodes.new('ShaderNodeMath'); ram_t.operation = 'MULTIPLY'; ram_t.use_clamp = True; L(ram_t0.outputs[0], ram_t.inputs[0]); ram_t.inputs[1].default_value = 12.0
    tej = nt.nodes.new('ShaderNodeMath'); tej.operation = 'MULTIPLY'; L(ram_t.outputs[0], tej.inputs[0]); L(fr_l.outputs[0], tej.inputs[1])
    ct = nt.nodes.new('ShaderNodeMix'); ct.data_type = 'RGBA'; L(tej.outputs[0], ct.inputs['Factor']); L(col.outputs['Result'], ct.inputs['A']); ct.inputs['B'].default_value = (0.50, 0.012, 0.010, 1)
    # cicatriz rosa: cubre la franja (más angosta al final)
    cw2 = nt.nodes.new('ShaderNodeMath'); cw2.operation = 'MULTIPLY_ADD'; L(rr.outputs['Result'], cw2.inputs[0]); cw2.inputs[1].default_value = 1.6; cw2.inputs[2].default_value = 0.0013
    cfr = nt.nodes.new('ShaderNodeMath'); cfr.operation = 'LESS_THAN'; L(av.outputs[0], cfr.inputs[0]); L(cw2.outputs[0], cfr.inputs[1])
    cfl = nt.nodes.new('ShaderNodeMath'); cfl.operation = 'MULTIPLY'; L(cfr.outputs[0], cfl.inputs[0]); L(e4.outputs[0], cfl.inputs[1])
    cic_f = nt.nodes.new('ShaderNodeMath'); cic_f.operation = 'MULTIPLY'; L(cfl.outputs[0], cic_f.inputs[0]); L(V_['cicatriz'], cic_f.inputs[1])
    cic_m = nt.nodes.new('ShaderNodeMath'); cic_m.operation = 'MULTIPLY'; L(cic_f.outputs[0], cic_m.inputs[0]); cic_m.inputs[1].default_value = 0.7
    cc_ = nt.nodes.new('ShaderNodeMix'); cc_.data_type = 'RGBA'; L(cic_m.outputs[0], cc_.inputs['Factor']); L(ct.outputs['Result'], cc_.inputs['A']); cc_.inputs['B'].default_value = (0.42, 0.17, 0.15, 1)
    bs = nt.nodes.new('ShaderNodeBsdfPrincipled')
    L(cc_.outputs['Result'], bs.inputs['Base Color'])
    rug = nt.nodes.new('ShaderNodeMix'); rug.data_type = 'FLOAT'; L(dentro.outputs[0], rug.inputs['Factor']); rug.inputs['A'].default_value = 0.55; rug.inputs['B'].default_value = 0.12
    L(rug.outputs['Result'], bs.inputs['Roughness'])
    cw_ = nt.nodes.new('ShaderNodeMath'); cw_.operation = 'MULTIPLY'; L(dentro.outputs[0], cw_.inputs[0]); cw_.inputs[1].default_value = 0.15
    brillo = nt.nodes.new('ShaderNodeMath'); brillo.operation = 'MAXIMUM'; L(cw_.outputs[0], brillo.inputs[0])
    bm2 = nt.nodes.new('ShaderNodeMath'); bm2.operation = 'MAXIMUM'; L(V_['amarillo'], bm2.inputs[0]); L(tej.outputs[0], bm2.inputs[1])
    bm3 = nt.nodes.new('ShaderNodeMath'); bm3.operation = 'MULTIPLY'; L(bm2.outputs[0], bm3.inputs[0]); L(fr_l.outputs[0], bm3.inputs[1])
    L(bm3.outputs[0], brillo.inputs[1]); L(brillo.outputs[0], bs.inputs['Coat Weight']); bs.inputs['Coat Roughness'].default_value = 0.25; bs.inputs['Specular IOR Level'].default_value = 0.3; bs.inputs['Subsurface Weight'].default_value = 0.0; bs.inputs['Subsurface Radius'].default_value = (1, 0.35, 0.2); bs.inputs['Subsurface Scale'].default_value = 0.004
    # relieve: esponja dentro + bordes hundidos hacia el corte
    prof_cl = nt.nodes.new('ShaderNodeMath'); prof_cl.operation = 'MINIMUM'; L(prof.outputs[0], prof_cl.inputs[0]); prof_cl.inputs[1].default_value = 1.0
    surco = nt.nodes.new('ShaderNodeMath'); surco.operation = 'POWER'; L(prof_cl.outputs[0], surco.inputs[0]); surco.inputs[1].default_value = 0.6
    esp_h = nt.nodes.new('ShaderNodeMath'); esp_h.operation = 'MULTIPLY_ADD'; L(bw.outputs[0], esp_h.inputs[0]); esp_h.inputs[1].default_value = 0.25; L(surco.outputs[0], esp_h.inputs[2])
    bump_h = nt.nodes.new('ShaderNodeMath'); bump_h.operation = 'MULTIPLY'; L(esp_h.outputs[0], bump_h.inputs[0]); L(dentro.outputs[0], bump_h.inputs[1])
    lh = nt.nodes.new('ShaderNodeMath'); lh.operation = 'MULTIPLY_ADD'; L(V_['hinchazon'], lh.inputs[0]); lh.inputs[1].default_value = 2.0; lh.inputs[2].default_value = 0.9
    labio = nt.nodes.new('ShaderNodeMath'); labio.operation = 'MULTIPLY'; L(ab_an.outputs[0], labio.inputs[0]); L(lh.outputs[0], labio.inputs[1])
    fuera = nt.nodes.new('ShaderNodeMath'); fuera.operation = 'SUBTRACT'; fuera.inputs[0].default_value = 1.0; L(dentro.outputs[0], fuera.inputs[1])
    labio2 = nt.nodes.new('ShaderNodeMath'); labio2.operation = 'MULTIPLY_ADD'; L(labio.outputs[0], labio2.inputs[0]); L(fuera.outputs[0], labio2.inputs[1]); L(bump_h.outputs[0], labio2.inputs[2])
    bul = nt.nodes.new('ShaderNodeTexNoise'); bul.inputs['Scale'].default_value = 160; L(uvh.outputs['UV'], bul.inputs['Vector'])
    bul2 = nt.nodes.new('ShaderNodeMath'); bul2.operation = 'MULTIPLY'; L(bul.outputs['Fac'], bul2.inputs[0]); L(labio.outputs[0], bul2.inputs[1])
    tj_h = nt.nodes.new('ShaderNodeMath'); tj_h.operation = 'MULTIPLY_ADD'; L(tej.outputs[0], tj_h.inputs[0]); tj_h.inputs[1].default_value = 0.8; L(bul2.outputs[0], tj_h.inputs[2])
    sum_h = nt.nodes.new('ShaderNodeMath'); sum_h.operation = 'ADD'; L(labio2.outputs[0], sum_h.inputs[0]); L(tj_h.outputs[0], sum_h.inputs[1])
    bump_h = sum_h
    bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 1.0; bump.inputs['Distance'].default_value = 0.0025
    L(poros(nt), bump.inputs['Normal'])
    L(bump_h.outputs[0], bump.inputs['Height']); L(bump.outputs['Normal'], bs.inputs['Normal'])
    # visible solo cerca de la herida (fuera = transparente: se ve la piel de abajo)
    vis0 = nt.nodes.new('ShaderNodeMath'); vis0.operation = 'MAXIMUM'; L(dentro.outputs[0], vis0.inputs[0]); L(ab_an.outputs[0], vis0.inputs[1])
    vtc = nt.nodes.new('ShaderNodeMath'); vtc.operation = 'MAXIMUM'; L(tej.outputs[0], vtc.inputs[0]); L(cic_f.outputs[0], vtc.inputs[1])
    vis = nt.nodes.new('ShaderNodeMath'); vis.operation = 'MAXIMUM'; L(vis0.outputs[0], vis.inputs[0]); L(vtc.outputs[0], vis.inputs[1])
    vis2 = nt.nodes.new('ShaderNodeMath'); vis2.operation = 'MULTIPLY'; vis2.use_clamp = True; L(vis.outputs[0], vis2.inputs[0]); vis2.inputs[1].default_value = 2.2
    tr_ = nt.nodes.new('ShaderNodeBsdfTransparent')
    mix = nt.nodes.new('ShaderNodeMixShader'); L(vis2.outputs[0], mix.inputs[0]); L(tr_.outputs[0], mix.inputs[1]); L(bs.outputs[0], mix.inputs[2])
    L(mix.outputs[0], out.inputs['Surface'])
    # RELIEVE DE VERDAD (desplazamiento de la malla, no solo color), como la suya/Zack:
    # labios hinchados que se levantan, corte hundido, capa amarilla con grumos, tejido rojo abultado, cicatriz un poco alzada
    def M(op, a_, b_, clamp=False):
        n_ = nt.nodes.new('ShaderNodeMath'); n_.operation = op; n_.use_clamp = clamp
        for k_, x_ in enumerate((a_, b_)):
            if isinstance(x_, (int, float)): n_.inputs[k_].default_value = x_
            else: L(x_, n_.inputs[k_])
        return n_.outputs[0]
    # --- labios hinchados: almohadas redondas a cada lado del corte (como Zack/Mr omi) ---
    # x = distancia a la orilla / ancho del anillo (0 en la orilla, 1 afuera)
    x_ = M('DIVIDE', dist.outputs[0], fmx.outputs[0]); x_c = M('MINIMUM', M('MAXIMUM', x_, 0.0), 1.0)
    lipf = M('MULTIPLY', M('POWER', M('SUBTRACT', 1.0, M('POWER', x_c, 2.0)), 0.6), e4.outputs[0])   # 1 en la orilla → 0 afuera
    hs = M('ADD', M('MULTIPLY', ab.outputs[0], 0.25), M('MULTIPLY', V_['hinchazon'], 1.0))          # alto: poco al abrir, mucho al hincharse
    hs = M('MULTIPLY', hs, M('SUBTRACT', 1.0, M('MULTIPLY', V_['cicatriz'], 0.85)))                 # se desinfla al cicatrizar
    # chipotes grandes a lo largo del corte (los de Zack suben y bajan, no son una almohada pareja)
    chi = nt.nodes.new('ShaderNodeTexNoise'); chi.inputs['Scale'].default_value = 45; chi.inputs['Detail'].default_value = 2; L(uvh.outputs['UV'], chi.inputs['Vector'])
    grumo = M('ADD', M('ADD', 0.45, M('MULTIPLY', chi.outputs['Fac'], 1.1)), M('MULTIPLY', bul.outputs['Fac'], 0.25))
    H_LAB = 0.0030
    fuera_ = M('SUBTRACT', 1.0, dentro.outputs[0])
    h_lab = M('MULTIPLY', M('MULTIPLY', M('MULTIPLY', M('MULTIPLY', lipf, hs), grumo), fuera_), H_LAB)
    # dentro: las paredes bajan desde el alto del labio hasta el fondo
    hondo = M('SUBTRACT', 1.0, M('POWER', prof_cl.outputs[0], 2.0))         # 1 al centro del corte, 0 en la orilla
    h_pared = M('MULTIPLY', M('MULTIPLY', M('MULTIPLY', M('SUBTRACT', 1.0, hondo), hs), dentro.outputs[0]), H_LAB * 0.8)
    relleno = M('MULTIPLY', M('SUBTRACT', 1.0, M('MULTIPLY', V_['amarillo'], 0.6)), M('SUBTRACT', 1.0, M('MULTIPLY', tej.outputs[0], 0.7)))
    h_cut = M('MULTIPLY', M('MULTIPLY', M('MULTIPLY', dentro.outputs[0], hondo), relleno), -0.0002)   # la herida es una capa 0.25 mm sobre la piel: más hondo se esconde debajo
    h_yel = M('MULTIPLY', M('MULTIPLY', M('MULTIPLY', V_['amarillo'], dentro.outputs[0]), nam.outputs['Fac']), 0.0012)
    h_tej = M('MULTIPLY', M('MULTIPLY', tej.outputs[0], M('ADD', org.outputs['Fac'], 0.2)), 0.0026)
    h_cic = M('MULTIPLY', cic_f.outputs[0], 0.00045)
    h_tot = M('ADD', M('ADD', M('ADD', h_lab, h_pared), h_cut), M('ADD', M('ADD', h_yel, h_tej), h_cic))
    # color del labio: rosa-rojo inflamado, opaco (no transparente: si no, se ve la piel plana de abajo)
    rojo_f = M('MULTIPLY', M('MULTIPLY', lipf, M('ADD', M('MULTIPLY', ab.outputs[0], 0.35), M('MULTIPLY', V_['hinchazon'], 0.8))), fuera_, True)
    lab_c = nt.nodes.new('ShaderNodeMix'); lab_c.data_type = 'RGBA'; L(rojo_f, lab_c.inputs['Factor'])
    L(cc_.outputs['Result'], lab_c.inputs['A']); lab_c.inputs['B'].default_value = (0.55, 0.13, 0.11, 1)
    L(lab_c.outputs['Result'], bs.inputs['Base Color'])
    vis_lab = M('MULTIPLY', M('MULTIPLY', M('SUBTRACT', 1.0, M('POWER', x_c, 6.0)), e4.outputs[0]), 3.0, True)
    vis_t = M('MAXIMUM', vis2.outputs[0], vis_lab)
    L(vis_t, mix.inputs[0])
    dn = nt.nodes.new('ShaderNodeDisplacement'); dn.inputs['Midlevel'].default_value = 0.0; dn.inputs['Scale'].default_value = 1.0
    L(h_tot, dn.inputs['Height']); L(dn.outputs[0], out.inputs['Displacement'])
    mat.displacement_method = 'BOTH'
    bump.inputs['Strength'].default_value = 0.6
    return mat
herida.data.materials.clear(); herida.data.materials.append(material_herida())
# malla fina solo en el parche (para que el desplazamiento tenga dónde doblarse: ~1 mm entre vértices)
sub_h = herida.modifiers.new('SubHerida', 'SUBSURF'); sub_h.levels = 0; sub_h.render_levels = 3
with bpy.context.temp_override(object=herida):
    bpy.ops.object.modifier_move_to_index(modifier='SubHerida', index=0)
print('HERIDA modificadores', [m.name for m in herida.modifiers])
herida.visible_shadow = True     # con relieve, los labios hinchados deben dar sombra

# ---------- 5. Objetivo de cámara pegado al antebrazo ----------
def vacio(nombre):
    e = bpy.data.objects.new(nombre, None); sc.collection.objects.link(e); return e
centro_rest = codo + eje * (centro_u * largo)
# Punto sobre la piel en la herida (reposo): el vértice del parche más cercano al centro, en la línea dorsal
mejor = min(herida.data.vertices, key=lambda v: ((hm @ v.co) - (centro_rest + LADO * RADIO)).length)
sup_rest = hm @ mejor.co
obj_brazo = vacio('ObjetivoBrazo')
obj_brazo.parent = arm; obj_brazo.parent_type = 'BONE'; obj_brazo.parent_bone = 'lowerleg01.R'
# Hijo de hueso: el mundo = arm · pose · traslación a la cola · inversa · local. Se fija la inversa con la pose de reposo.
bL = arm.data.bones['lowerleg01.R']
obj_brazo.matrix_parent_inverse = (arm.matrix_world @ bL.matrix_local @ Matrix.Translation((0, bL.length, 0))).inverted()
obj_brazo.location = sup_rest

# ---------- 6. Cámara: un solo eje de dolly, siempre de frente a la herida ----------
seguir = vacio('Seguir')                               # punto que la cámara sigue
c1 = seguir.constraints.new('COPY_LOCATION'); c1.target = obj_brazo
cuerpo = vacio('Cuerpo'); cuerpo.location = (-0.06, 0.0, 0.42)   # lado derecho del torso
c2 = seguir.constraints.new('COPY_LOCATION'); c2.target = cuerpo
cam = bpy.data.cameras.new('Cam'); camo = bpy.data.objects.new('Cam', cam); sc.collection.objects.link(camo); sc.camera = camo
cam.lens = 70; cam.sensor_width = 36
cam.dof.use_dof = True; cam.dof.focus_object = obj_brazo; cam.dof.aperture_fstop = 4.0
camo.parent = seguir
camo.rotation_euler = VISTA.to_track_quat('-Z', 'Y').to_euler()
def suave(t): t = max(0.0, min(1.0, t)); return t*t*t*(t*(6*t-15)+10)
# Cámara MEDIDA a 30 fps (medida_30fps/curva_camara.py → camara_zack.json; ver PROCESO.md):
# zoom y paneo cuadro por cuadro; la cámara sigue la herida todo el tiempo y nunca se queda quieta.
import json
CAMZ = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'medida_30fps', 'camara_zack.json')))
assert CAMZ['TOTAL'] == TOTAL
D0 = 0.95                                    # encuadre inicial que ya estaba aprobado
def distancia(f):
    return D0 * CAMZ['zoom'][f] ** (-1 / 0.959)   # tamaño en pantalla ~ (1/d)^0.959 (medido en la prueba del brazo)
def peso_brazo(f):
    return 1.0
qc = VISTA.to_track_quat('-Z', 'Y')
DER = qc @ Vector((1, 0, 0)); ARR = qc @ Vector((0, 1, 0))
off = Vector((0, 0, 0))
for f in range(1, TOTAL + 1):
    d = distancia(f)
    px = d * (36 / cam.lens) / 1280               # metros por pixel (720x1280) a esa distancia
    off += (-CAMZ['dx_px720'][f] * DER + CAMZ['dy_px720'][f] * ARR) * px
    camo.location = -VISTA * d + off
    camo.keyframe_insert('location', frame=f)
    c2.influence = 1 - peso_brazo(f); c2.keyframe_insert('influence', frame=f)
print('CAMARA d1 %.3f  d min %.3f  d final %.3f  paneo final %s' % (distancia(1), min(distancia(f) for f in range(1, TOTAL+1)), distancia(TOTAL), [round(x, 3) for x in off]))

# ---------- 6b. Puntadas: un solo hilo continuo que se dibuja solo ----------
from mathutils.bvhtree import BVHTree
# Piel en reposo (coordenadas de mundo) para poner cada punto exactamente sobre la superficie
bm = bmesh.new(); bm.from_mesh(geo.data); bm.transform(geo.matrix_world); bm.normal_update()
arbol = BVHTree.FromBMesh(bm); bm.free()
lado2 = eje.cross(LADO).normalized()
def sobre_piel(s, t, alto=0.0):  # (mismo método que el brazo)
    """s = metros a lo largo de la herida (0 = centro), t = metros de lado (+ derecha de la cámara), alto = sobre la piel."""
    base = codo + eje * (centro_u * largo + s)
    ang = t / RADIO
    dirr = (LADO * math.cos(ang) + lado2 * math.sin(ang)).normalized()
    hit = arbol.ray_cast(base + dirr * 0.2, -dirr, 0.4)
    p, n = hit[0], hit[1]
    if p is None: p, n = base + dirr * RADIO, dirr
    if n.dot(dirr) < 0: n = -n          # normal siempre hacia afuera
    return p + n * (0.00025 + alto), n
MEDIO = (U1 - U0) / 2 * largo
N = 20                                  # puntadas (como la de él)
G = -0.0042                             # cada puntada entra/sale a 5 mm del corte (signo: arriba-izquierda → abajo-derecha, como él)
ds = (2 * MEDIO * 0.84) / N
s0 = -MEDIO * 0.84
ctrl = []
pts_entrada = []
for i in range(N):
    sa = s0 + i * ds
    # espiral como la suya: arriba cruza en diagonal casi una puntada entera; abajo regresa derecho
    a, _ = sobre_piel(sa, -G); b, _ = sobre_piel(sa + ds * 0.9, G)
    cima, _ = sobre_piel(sa + ds * 0.45, 0, 0.0018)
    ctrl += [a, cima, b]
    pts_entrada += [a, b]
    if i < N - 1:   # por debajo de la piel hasta la siguiente entrada
        b2, _ = sobre_piel(sa + ds * 0.92, G * 0.9, -0.0040)
        bajo, _ = sobre_piel(sa + ds * 0.96, 0, -0.0065)
        a2, _ = sobre_piel(sa + ds * 1.0, -G * 0.9, -0.0040)
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
HUESO = max([k for k in pesos if k in arm.data.bones], key=pesos.get)
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
hilo = tubo('Hilo', poli, 0.00058)
mh = bpy.data.materials.new('Nylon'); mh.use_nodes = True; ntm = mh.node_tree
bh = ntm.nodes['Principled BSDF']
bh.inputs['Base Color'].default_value = (0.60, 0.60, 0.62, 1); bh.inputs['Roughness'].default_value = 0.42
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
# Forma «hinchado»: cada punto del hilo sube lo mismo que sube el labio de la herida debajo de él
lado2_ = eje.cross(LADO).normalized(); MEDIO_ = (U1 - U0) / 2 * largo
hilo.shape_key_add(name='Basis'); sk_h = hilo.shape_key_add(name='hinchado', from_mix=False)
for i_, v_ in enumerate(hilo.data.vertices):
    d_ = v_.co - codo; X_ = (d_.dot(eje) / largo - centro_u) * largo
    rad_ = d_ - eje * d_.dot(eje); V_v = math.atan2(rad_.dot(lado2_), rad_.dot(LADO)) * rad_.length
    e4_ = max(0.0, 1 - (X_ / MEDIO_) ** 2) ** 0.7
    dist_ = abs(V_v) - 0.0065 * 0.45 * e4_
    x_ = min(1.0, max(0.0, dist_ / 0.009))
    lip_ = (1 - x_ * x_) ** 0.6 * e4_
    sk_h.data[i_].co = v_.co + rad_.normalized() * (0.0030 * lip_ * 1.55)   # 1.55 = labio más alto con chipotes (grumo máx ≈ 1.5)

# Tiempos (30 fps): cose de 1.5 s a 4.6 s; cada puntada ~8 cuadros como en la referencia
C0, C1 = 10, 150
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
CORTE = 176                                   # cuadro en que cierran las tijeras
izq_img = eje.cross(LADO).normalized()        # todo en reposo: LADO mira a la cámara
if izq_img.dot(lado2) < 0: izq_img = -izq_img
for f in range(1, TOTAL + 1):
    a = avance(f); punta = en(a)
    if f <= C1:   # mientras cose, el hilo sale de cuadro a la izquierda
        lejos = punta + izq_img * 0.13 + LADO * 0.012 + eje * (0.02 + 0.025 * math.sin(f * 0.07))
    else:         # al terminar, el hilo se jala hacia la derecha y queda tenso
        k = suave((f - C1) / 14)
        antes = punta + izq_img * 0.13 + LADO * 0.012 + eje * (0.02 + 0.025 * math.sin(C1 * 0.07))
        despues = punta - izq_img * 0.10 + LADO * 0.004 + eje * 0.004
        lejos = antes.lerp(despues, k)
        if f >= CORTE:  # cortado: queda un cabito de 7 mm
            lejos = punta - izq_img * 0.007 + LADO * 0.001
    medio = punta.lerp(lejos, 0.5) + LADO * (0.006 if f <= C1 else 0.0015)
    vis_ = 1.0 if f >= C0 - 3 else 0.0
    for p_, q in zip(ccu.splines[0].points, [punta, medio, lejos]):
        p_.co = (*q, 1); p_.keyframe_insert('co', frame=f)
    cola.hide_render = vis_ == 0; cola.keyframe_insert('hide_render', frame=f)

# Tijeras (plateadas, entran por abajo a la izquierda, cortan y salen)
def hoja_tijera(nombre, signo):
    """Una mitad: hoja curva + aro, en un plano local XY (X = hacia la punta). Pivote en el origen."""
    bm_ = bmesh.new(); pts_ = []
    LH = 0.070                       # largo de la hoja
    for i in range(13):              # contorno de la hoja (ancha en el pivote, punta fina)
        t = i / 12; x = LH * t; ancho = 0.0075 * (1 - t) ** 0.8 + 0.0006
        pts_.append((x, signo * ancho * 0.15, 0)); 
    for i in range(12, -1, -1):
        t = i / 12; x = LH * t; ancho = 0.0075 * (1 - t) ** 0.8 + 0.0006
        pts_.append((x, signo * ancho, 0))
    vs = [bm_.verts.new(p) for p in pts_]
    cara = bm_.faces.new(vs)
    ext = bmesh.ops.extrude_face_region(bm_, geom=[cara])
    for v in [e for e in ext['geom'] if isinstance(e, bmesh.types.BMVert)]: v.co.z += 0.0016 * signo
    # brazo del aro
    for i in range(2):
        pass
    me_ = bpy.data.meshes.new(nombre); bm_.to_mesh(me_); bm_.free()
    ob_ = bpy.data.objects.new(nombre, me_); sc.collection.objects.link(ob_)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.0115, minor_radius=0.0022, location=(-0.040, -signo * 0.006, 0.0008 * signo))
    aro = bpy.context.active_object; aro.name = nombre + '_aro'
    bpy.ops.mesh.primitive_cylinder_add(radius=0.0024, depth=0.030, location=(-0.016, -signo * 0.003, 0.0008 * signo), rotation=(0, math.pi / 2, 0))
    brazo = bpy.context.active_object; brazo.name = nombre + '_brazo'
    brazo.rotation_euler.z = -signo * 0.18
    for o_ in (aro, brazo): o_.parent = ob_
    return ob_, (aro, brazo)
metal = bpy.data.materials.new('Metal'); metal.use_nodes = True
bmet = metal.node_tree.nodes['Principled BSDF']
bmet.inputs['Base Color'].default_value = (0.78, 0.79, 0.81, 1); bmet.inputs['Metallic'].default_value = 1.0; bmet.inputs['Roughness'].default_value = 0.22
tijera = vacio('Tijeras')
mitades = []
for sg in (1, -1):
    ob_, extras = hoja_tijera('Hoja%d' % sg, sg)
    for o_ in (ob_,) + extras:
        o_.data.materials.append(metal)
        if o_.type == 'MESH': o_.data.shade_smooth() if hasattr(o_.data, 'shade_smooth') else None
    ob_.parent = tijera; mitades.append((ob_, sg))
pegar_a_hueso(tijera, HUESO)
# marco en reposo: X hacia arriba-derecha (la punta), Z hacia la cámara
xdir = (-izq_img * 0.85 - eje * 0.55).normalized(); zdir = LADO.copy(); ydir = zdir.cross(xdir).normalized(); xdir = ydir.cross(zdir)
base_rot = Matrix((xdir, ydir, zdir)).transposed().to_4x4()
for f in range(140, 215):
    punta_corte = en(1.0) - izq_img * 0.004 + LADO * 0.004
    if f < CORTE - 10:  k = suave((f - 140) / (CORTE - 10 - 140)); off = 0.10 * (1 - k)        # entra
    elif f < CORTE + 8: off = 0.0
    else:               off = 0.11 * suave((f - CORTE - 8) / 22)                                 # sale
    piv = punta_corte - xdir * 0.030 - xdir * off + eje * off * 0.6
    tijera.matrix_basis = Matrix.Translation(piv) @ base_rot       # (en reposo; el padre-hueso lo lleva)
    tijera.keyframe_insert('location', frame=f); tijera.keyframe_insert('rotation_euler', frame=f)
    ab_ = 0.32 if f < CORTE - 4 else (0.32 * (1 - suave((f - CORTE + 4) / 4)) if f <= CORTE else 0.0)
    for ob_, sg in mitades:
        ob_.rotation_euler = (0, 0, sg * ab_ / 2); ob_.keyframe_insert('rotation_euler', frame=f)
piezas_t = [o_ for o_ in bpy.data.objects if o_.name.startswith('Hoja')]
for f in range(1, 230):
    for o_ in piezas_t:
        o_.hide_render = not (140 <= f < 215); o_.keyframe_insert('hide_render', frame=f)

# La herida se cierra conforme avanzan las puntadas y luego queda como línea
nodo_ab = herida.data.materials[0].node_tree.nodes['abertura']
for f in range(1, TOTAL + 1):
    v_ = 1.0 - 0.50 * suave(cosido(f - 6))
    # en el acercamiento el corte se ve un poco abierto (como en la suya) y al final se cierra en cicatriz
    v_ = v_ + 0.25 * suave((f - 380) / 60) - 0.70 * suave((f - 650) / 80)
    nodo_ab.outputs[0].default_value = max(0.0, v_); nodo_ab.outputs[0].keyframe_insert('default_value', frame=f)
ntc = herida.data.materials[0].node_tree.nodes
CURA = {'hinchazon': lambda f: suave((f - 385) / 60) * (1 - 0.85 * suave((f - 680) / 120)),
        'amarillo':  lambda f: suave((f - 450) / 60) * (1 - suave((f - 600) / 60)),
        'tejido':    lambda f: suave((f - 530) / 100) * (1 - 0.7 * suave((f - 720) / 90)),
        'cicatriz':  lambda f: suave((f - 690) / 110)}
for nm_, fn in CURA.items():
    for f in range(1, TOTAL + 1, 2):
        ntc[nm_].outputs[0].default_value = fn(f); ntc[nm_].outputs[0].keyframe_insert('default_value', frame=f)
# el hilo sube igual que los labios: hs = 0.25·abertura + hinchazón, se desinfla con la cicatriz
for f in range(1, TOTAL + 1, 2):
    ab_f = max(0.0, 1.0 - 0.50 * suave(cosido(f - 6)) + 0.25 * suave((f - 380) / 60) - 0.70 * suave((f - 650) / 80))
    sk_h.value = min(1.0, (0.25 * ab_f + CURA['hinchazon'](f)) * (1 - 0.85 * CURA['cicatriz'](f)))
    sk_h.keyframe_insert('value', frame=f)
# se quitan los puntos cuando ya es cicatriz (25 s)
for f in range(1, TOTAL + 1):
    for o_ in (hilo, cola):
        o_.hide_render = (f >= 745) or (o_ is cola and f < C0 - 3); o_.keyframe_insert('hide_render', frame=f)

# ---------- 6c. Vello del antebrazo (él: ~2,600 pelos 3D) ----------
# Pelos propios (tubos finos con punta), en metros reales, pegados a la piel con sus pesos.
import random
random.seed(7)
bmv = bmesh.new(); bmv.from_mesh(geo.data); bmv.transform(geo.matrix_world); bmv.normal_update()
cand = []
for fa in bmv.faces:
    c_ = fa.calc_center_median(); d_ = c_ - codo; u_ = d_.dot(eje) / largo
    if 0.0 < u_ < 0.85 and (d_ - eje * d_.dot(eje)).length < 0.10:
        cand.append((fa, fa.calc_area()))
area_tot = sum(a_ for _, a_ in cand)
NPELOS = 9000
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
    if U0 - 0.01 < s_ < U1 + 0.01 and rad.dot(LADO) > 0.985: continue
    t_dir = (eje - n0 * eje.dot(n0)).normalized()
    giro = random.uniform(-0.45, 0.45); lat = n0.cross(t_dir)
    dirp = (t_dir * math.cos(giro) + lat * math.sin(giro)).normalized()
    Lp = random.uniform(0.005, 0.012)
    pts_ = [p0, p0 + dirp * 0.30 * Lp + n0 * 0.22 * Lp, p0 + dirp * 0.65 * Lp + n0 * 0.30 * Lp, p0 + dirp * Lp + n0 * 0.26 * Lp]
    base_i = len(verts_v)
    for k, q in enumerate(pts_):
        tg = (pts_[min(k+1, 3)] - pts_[max(k-1, 0)]).normalized(); nb = tg.cross(n0).normalized(); nc = tg.cross(nb)
        r_ = 0.000075 * (1 - 0.75 * k / 3)
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
luz_area('Key', (1.9, 1.3, 1.5), (-0.17, 0, 0.4), 380, 1.2, (1.0, 0.94, 0.86))
luz_area('Contra', (-1.4, 0.4, 1.0), (-0.17, 0, 0.4), 160, 2.0, (0.85, 0.92, 1.0))
sc.render.use_motion_blur = True; sc.render.motion_blur_shutter = 0.5

if '--guardar' in args:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(AQUI, 'puntadas_pierna.blend'))
if '--foto' in args:
    for fr in args[args.index('--foto')+1].split(','):
        sc.frame_set(int(fr))
        sc.render.filepath = os.path.join(AQUI, 'fotos', f'f{int(fr):03d}.png')
        bpy.ops.render.render(write_still=True)

if '--anim' in args:
    os.makedirs(os.path.join(AQUI, 'cuadros'), exist_ok=True)
    sc.render.filepath = os.path.join(AQUI, 'cuadros', 'c_')
    sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 92
    if '--desde' in args: sc.frame_start = int(args[args.index('--desde')+1])   # retomar un render cortado
    bpy.ops.render.render(animation=True)
