"""Globo a pantalla completa de la cartera (web/public/renders/globe-noa.jpg, 2880x1800).

Cámara ortográfica inclinada sobre el NOA: centro de vista lat -78,9 / lon -63,5, R = 3000 px (a 1x) con el centro
del disco en (480, 2960), así se ve la curvatura arriba a la derecha y el NOA queda en ~(480, 520).
web/lib/globe-noa.ts usa exactamente esta proyección para dibujar focos, satélites y pines encima.

Texturas: NASA GIBS BlueMarble_NextGeneration (WMTS EPSG:3857, GoogleMapsCompatible_Level8), zooms 3, 6 y 7,
bajadas a bmtiles/{z}_{x}_{y}.jpg (z3 completo; z6 x15-27 y30-45; z7 x36-47 y66-79).
"""
import math, numpy as np
from PIL import Image
S=2; W,H=1440*S,900*S
LAT0,LON0=-78.9,-63.5
CX,CY,R=480*S,2960*S,3000*S
def mosaic(z,x0,x1,y0,y1):
    m=Image.new('RGB',((x1-x0)*256,(y1-y0)*256))
    for x in range(x0,x1):
        for y in range(y0,y1):
            m.paste(Image.open(f'bmtiles/{z}_{x}_{y}.jpg').convert('RGB'),((x-x0)*256,(y-y0)*256))
    return np.asarray(m).astype(np.float32)/255
lo=mosaic(3,0,8,0,8); hi=mosaic(6,15,28,30,46); h7=mosaic(7,36,48,66,80)
la0,lo0=math.radians(LAT0),math.radians(LON0)
f=np.array([math.cos(la0)*math.cos(lo0),math.cos(la0)*math.sin(lo0),math.sin(la0)])
e=np.array([-math.sin(lo0),math.cos(lo0),0.]); n=np.array([-math.sin(la0)*math.cos(lo0),-math.sin(la0)*math.sin(lo0),math.cos(la0)])
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
dx=(xx-CX)/R; dy=-(yy-CY)/R; d2=dx*dx+dy*dy; inside=d2<=1
dz=np.sqrt(np.clip(1-d2,0,1))
P=dx[...,None]*e+dy[...,None]*n+dz[...,None]*f
lat=np.degrees(np.arcsin(np.clip(P[...,2],-1,1))); lon=np.degrees(np.arctan2(P[...,1],P[...,0]))
def merc(lat,lon,z):
    size=256*2**z; latc=np.clip(lat,-85,85); r=np.radians(latc)
    return (lon+180)/360*size,(1-np.log(np.tan(r)+1/np.cos(r))/np.pi)/2*size
px,py=merc(lat,lon,3); col=lo[np.clip(py.astype(int),0,lo.shape[0]-1),np.clip(px.astype(int),0,lo.shape[1]-1)]
hx,hy=merc(lat,lon,6); hx-=15*256; hy-=30*256
inhi=(hx>=0)&(hx<hi.shape[1]-1)&(hy>=0)&(hy<hi.shape[0]-1)
# bilinear on hi
x0=np.clip(np.floor(hx).astype(int),0,hi.shape[1]-2); y0=np.clip(np.floor(hy).astype(int),0,hi.shape[0]-2)
fx=(hx-x0)[...,None]; fy=(hy-y0)[...,None]
hc=hi[y0,x0]*(1-fx)*(1-fy)+hi[y0,x0+1]*fx*(1-fy)+hi[y0+1,x0]*(1-fx)*fy+hi[y0+1,x0+1]*fx*fy
col=np.where(inhi[...,None],hc,col)
gx,gy=merc(lat,lon,7); gx-=36*256; gy-=66*256
in7=(gx>=0)&(gx<h7.shape[1]-1)&(gy>=0)&(gy<h7.shape[0]-1)
x0=np.clip(np.floor(gx).astype(int),0,h7.shape[1]-2); y0=np.clip(np.floor(gy).astype(int),0,h7.shape[0]-2)
fx=(gx-x0)[...,None]; fy=(gy-y0)[...,None]
c7=h7[y0,x0]*(1-fx)*(1-fy)+h7[y0,x0+1]*fx*(1-fy)+h7[y0+1,x0]*(1-fx)*fy+h7[y0+1,x0+1]*fx*fy
col=np.where(in7[...,None],c7,col)
sun=np.array([-0.35,0.55,0.75]); sun/=np.linalg.norm(sun)
ndl=np.clip(dx*sun[0]+dy*sun[1]+dz*sun[2],0,1)
img=col*(0.22+0.95*ndl**0.8)[...,None]
# atmosphere haze toward limb
rim=np.clip((np.sqrt(d2)-0.80)/0.20,0,1)**2.2
img=img*(1-rim[...,None]*0.55)+np.array([0.35,0.6,1.0])*rim[...,None]*0.55
img=np.clip(img,0,1)**0.92
# space + glow outside
rr=np.sqrt(d2); glow=np.exp(-((rr-1)*R/(22*S))**2)*(rr>1)
bg=np.zeros((H,W,3),np.float32)+np.array([0.016,0.027,0.05])
rng=np.random.default_rng(3); sy=rng.integers(0,H,500); sx=rng.integers(0,W,500); bg[sy,sx]+=rng.uniform(0.2,0.8,500)[:,None]
bg+=glow[...,None]*np.array([0.30,0.55,1.0])*0.75
out=np.where(inside[...,None],img,np.clip(bg,0,1))
Image.fromarray((out*255).astype(np.uint8)).save('globe_full.jpg',quality=88)
print('ok')
