import math, numpy as np
from PIL import Image, ImageDraw, ImageFilter
SS=4
def rot(yaw,pitch,roll):
    cy,sy=math.cos(yaw),math.sin(yaw); cp,sp=math.cos(pitch),math.sin(pitch); cr,sr=math.cos(roll),math.sin(roll)
    Ry=np.array([[cy,0,sy],[0,1,0],[-sy,0,cy]]); Rx=np.array([[1,0,0],[0,cp,-sp],[0,sp,cp]]); Rz=np.array([[cr,-sr,0],[sr,cr,0],[0,0,1]])
    return Rz@Rx@Ry
def render(W,H,yaw,pitch,roll,fname,scale):
    w,h=W*SS,H*SS
    img=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(img)
    R=rot(yaw,pitch,roll); light=np.array([0.5,0.6,0.62]); light/=np.linalg.norm(light)
    def P(v):
        v=R@np.array(v,float); f=6.0/(6.0+v[2])
        return (w/2+v[0]*scale*SS*f, h/2-v[1]*scale*SS*f, v[2])
    quads=[]
    def quad(pts,base,kind,meta=None):
        pts=[np.array(p,float) for p in pts]
        n=np.cross(pts[1]-pts[0],pts[3]-pts[0]); n=R@n; n/=np.linalg.norm(n)+1e-9
        quads.append((pts,base,kind,n,meta))
    def box(c,s,base,kind):
        x,y,z=c; a,b,e=s
        V=[[x+i*a,y+j*b,z+k*e] for i in(-1,1) for j in(-1,1) for k in(-1,1)]
        F=[(0,1,3,2),(4,6,7,5),(0,4,5,1),(2,3,7,6),(0,2,6,4),(1,5,7,3)]
        for f in F: quad([V[i] for i in f],base,kind)
    # body (gold MLI), bus
    box((0,0,0),(0.55,0.42,0.42),(176,128,48),'foil')
    box((0,0.52,0),(0.36,0.1,0.3),(200,202,208),'metal')      # top deck
    # yokes
    box((0.75,0,0),(0.2,0.03,0.03),(170,172,178),'metal'); box((-0.75,0,0),(0.2,0.03,0.03),(170,172,178),'metal')
    # solar wings (2 panels each side)
    for sgn in(1,-1):
        for k in range(2):
            x0=sgn*(0.95+k*1.02); x1=sgn*(0.95+k*1.02+0.98)
            quad([[x0,-0.42,0.02],[x1,-0.42,0.02],[x1,0.42,0.02],[x0,0.42,0.02]],(28,52,110),'panel')

    # dish (approx as octagon fan) on front face
    cen=np.array([0,-0.05,-0.62]); rr=0.22
    ring=[cen+np.array([rr*math.cos(t),rr*math.sin(t),0.08]) for t in np.linspace(0,2*math.pi,13)[:-1]]
    for i in range(12):
        quads.append(([cen-np.array([0,0,0.02]),ring[i],ring[(i+1)%12],ring[(i+1)%12]],(225,226,230),'dish',None,None) if False else None)
        pts=[np.array(p) for p in (cen,ring[i],ring[(i+1)%12],cen)]
        n=R@np.cross(ring[i]-cen,ring[(i+1)%12]-cen); n/=np.linalg.norm(n)+1e-9
        quads.append((pts,(222,224,228),'dish',n,None))
    quads=[q for q in quads if q]
    # sensor stub
    box((0.3,-0.2,-0.5),(0.06,0.06,0.1),(30,30,34),'metal')
    rng=np.random.default_rng(3)
    order=sorted(quads,key=lambda q:-np.mean([P(p)[2] for p in q[0]]))
    view=np.array([0,0,-1.0])
    for pts,base,kind,n,meta in order:
        sp=[P(p)[:2] for p in pts]
        nn=n if n@view<0 else -n  # face toward camera
        if kind in('back',) and n@view>0: continue
        diff=max(0.0,float(nn@light)); amb=0.28
        hv=light-view; hv/=np.linalg.norm(hv); spec=max(0.0,float(nn@hv))**30
        col=np.array(base)*(amb+0.85*diff)+255*spec*(0.9 if kind in('foil','dish','metal') else 0.6)
        if kind=='foil':
            for _ in range(3):  # crinkled foil: split into jittered tone
                pass
        col=tuple(int(min(255,c)) for c in col)
        d.polygon(sp,fill=col+(255,))
        if kind=='panel':
            # cell grid
            p0,p1,p2,p3=[np.array(s) for s in sp]
            for i in range(1,8):
                t=i/8; a=p0+(p3-p0)*t; b=p1+(p2-p1)*t; d.line([tuple(a),tuple(b)],fill=(150,175,220,90),width=SS//2+1)
            for i in range(1,5):
                t=i/5; a=p0+(p1-p0)*t; b=p3+(p2-p3)*t; d.line([tuple(a),tuple(b)],fill=(150,175,220,90),width=SS//2+1)
            d.polygon(sp,outline=(190,200,215,200),width=SS)
        if kind=='foil':
            p0,p1,p2,p3=[np.array(s) for s in sp]
            for _ in range(10):
                u,v=rng.random(2); a=p0+(p1-p0)*u+(p3-p0)*v
                u2,v2=min(1,u+rng.random()*0.3),min(1,v+rng.random()*0.3); b=p0+(p1-p0)*u2+(p3-p0)*v2
                tone=int(rng.integers(-40,50)); c=tuple(int(max(0,min(255,x+tone))) for x in col)
                d.polygon([tuple(a),tuple(p0+(p1-p0)*u2+(p3-p0)*v),tuple(b),tuple(p0+(p1-p0)*u+(p3-p0)*v2)],fill=c+(255,))
    img=img.resize((W,H),Image.LANCZOS)
    img.save(fname); return img
render(240,150,math.radians(28),math.radians(-24),math.radians(-14),'satA.png',36)
render(240,150,math.radians(-34),math.radians(-20),math.radians(10),'satB.png',36)
