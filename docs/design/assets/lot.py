import numpy as np, math
from PIL import Image, ImageDraw, ImageFilter
S=3; N=196*S
rng=np.random.default_rng(11)
def noise(scale,seed):
    r=np.random.default_rng(seed); small=r.random((N//scale+2,N//scale+2)).astype(np.float32)
    im=Image.fromarray((small*255).astype(np.uint8)).resize((N,N),Image.BICUBIC)
    return np.asarray(im).astype(np.float32)/255
n1,n2,n3=noise(40,1),noise(12,2),noise(4,3)
yy,xx=np.mgrid[0:N,0:N].astype(np.float32)
# rotated field coordinates
ang=math.radians(8); u=xx*math.cos(ang)+yy*math.sin(ang); v=-xx*math.sin(ang)+yy*math.cos(ang)
img=np.zeros((N,N,3),np.float32)
# parcels grid (irregular widths)
cols=np.cumsum(rng.integers(150,260,8)); rows=np.cumsum(rng.integers(110,200,8))
ci=np.searchsorted(cols,u+60); ri=np.searchsorted(rows,v+120)
pid=ci*37+ri
palette=np.array([[0.27,0.32,0.20],[0.31,0.35,0.22],[0.23,0.29,0.18],[0.36,0.37,0.25],[0.47,0.42,0.31],[0.41,0.36,0.27],[0.29,0.33,0.21]])
pr=np.random.default_rng(5).integers(0,len(palette),2000)
base=palette[pr[pid%2000]]
# crop rows texture
rows_tex=0.5+0.5*np.sin(v*2*math.pi/(1.6*S))
img=base*(0.93+0.07*rows_tex[...,None])*(0.78+0.44*n1[...,None])*(0.9+0.2*n2[...,None])*(0.94+0.12*n3[...,None])
# roads between parcels
du=np.minimum(np.abs((u+60)[...,None]-cols[None,None,:]).min(-1),999); dv=np.abs((v+120)[...,None]-rows[None,None,:]).min(-1)
road=(np.minimum(du,dv)<0.8*S).astype(np.float32)
img=img*(1-road[...,None])+np.array([0.66,0.60,0.50])*(0.9+0.15*n3[...,None])*road[...,None]
# canal
canal=np.abs(v-(0.62*N)-18*np.sin(u/90))<1.1*S
img[canal]=np.array([0.16,0.26,0.30])
# burn mask from cells
lvl={}
L1="1,6 1,7 1,8 1,9 2,5 3,4 3,11 5,4 6,4 6,11 7,5 7,10 8,7 8,8 8,9".split()
L2="2,6 2,7 2,8 2,9 2,10 3,5 3,10 4,4 4,5 4,10 4,11 5,5 5,10 5,11 6,5 6,6 6,10 7,6 7,7 7,8 7,9".split()
L3="3,6 3,7 3,8 3,9 4,6 4,7 4,8 4,9 5,6 5,7 5,8 5,9 6,7 6,8 6,9".split()
cell=16.33*S
M=np.zeros((12,12),np.float32)
for k,val in [(L1,0.55),(L2,0.85),(L3,1.0)]:
    for s in k: r,c=map(int,s.split(',')); M[r,c]=val
Mi=Image.fromarray((M*255).astype(np.uint8)).resize((N,N),Image.NEAREST).filter(ImageFilter.GaussianBlur(6*S))
m=np.asarray(Mi).astype(np.float32)/255
pm=np.random.default_rng(9).random(4000)[pid%4000]
m=m+(n2-0.5)*0.25+(n3-0.5)*0.06+(pm-0.5)*0.28
burn=np.clip((m-0.42)/0.05,0,1)
char=np.array([0.085,0.072,0.062])*(0.8+0.35*n2[...,None])*(0.92+0.16*rows_tex[...,None])+np.array([0.10,0.08,0.06])*np.clip((0.62-m),0,1)[...,None]*1.4+np.array([0.05,0.045,0.04])*n3[...,None]
img=img*(1-burn[...,None])+char*burn[...,None]
# scorched halo
halo=np.clip((m-0.32)/0.10,0,1)*(1-burn)
img=img*(1-0.45*halo[...,None])+np.array([0.35,0.24,0.12])*0.45*halo[...,None]
# active fire front: thin band at hottest boundary (eastern/northern edge)
hot=np.clip(1-np.abs(m-0.425)/0.02,0,1)*((xx-N*0.62)-(yy-N*0.25)*0.6>0)*(n1>0.3)
glow=np.asarray(Image.fromarray((hot*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(4*S))).astype(np.float32)/255
img=img+np.array([1.0,0.45,0.08])*np.clip(glow*2.2,0,1)[...,None]*0.9+np.array([1.0,0.82,0.45])*hot[...,None]*0.8
# smoke plume drifting to NE
sx,sy=N*0.80,N*0.40
d=((xx-sx)*0.7+(yy-sy)*0.7)
w=np.exp(-(((xx-sx)*0.7-(yy-sy)*0.7)/(40*S+0.25*np.clip(d,0,None)))**2)*np.clip(d/(60*S)+0.6,0,1)*np.exp(-np.clip(d,0,None)/(220*S))
smoke=np.clip(w*(0.3+0.8*n1)*(0.5+0.7*n2),0,1)*0.38
img=img*(1-smoke[...,None])+np.array([0.80,0.78,0.74])*smoke[...,None]
# outside lot: dim
lim=[(47,0),(192,0),(192,160),(160,192),(14,192),(14,145),(0,145),(0,16),(47,16)]
mk=Image.new('L',(N,N),0); ImageDraw.Draw(mk).polygon([((x+2)*S,(y+2)*S) for x,y in lim],fill=255)
inside=np.asarray(mk.filter(ImageFilter.GaussianBlur(1.5*S))).astype(np.float32)/255
gray=img.mean(-1,keepdims=True)
out_img=(img*0.35+gray*0.65)*0.55
img=img*inside[...,None]+out_img*(1-inside[...,None])
img=np.clip(img,0,1)**0.95
Image.fromarray((img*255).astype(np.uint8)).save('lot.png')
