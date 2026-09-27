"""Build an original schematic fan-game layout, not a canonical political map.
Coordinates are arbitrary game units. No published map artwork is reproduced.
Run from the project root: python3 scripts/prepare-middle-earth.py
"""
import json, subprocess, tempfile, math
# Shared vertices define the game's approximate realm/region partitions.
p={
 'NW':(15,125),'N1':(38,125),'N2':(57,125),'NE':(125,125),
 'L1':(23,83),'L2':(25,71),'L3':(21,60),
 'M1':(45,83),'M2':(48,69),'M3':(46,58),
 'J':(55,48),'E1':(70,75),'E2':(73,60),'E3':(76,48),'E4':(72,34),
 'R1':(125,72),'R2':(125,52),'R3':(125,30),
 'W1':(12,91),'W2':(10,81),'W3':(18,77),'W4':(11,73),'W5':(14,65),'W6':(12,58),
 'W7':(18,48),'W8':(24,44),'W9':(22,39),'W10':(28,34),'W11':(37,33),'W12':(43,37),
 'G1':(49,31),'G2':(57,27),'G3':(63,26),
 'S1':(64,14),'S2':(62,-20),'SE':(125,-20),'K':(82,22),
 'H1':(31,77),'H2':(36,79),'H3':(39,74),'H4':(36,70),'H5':(30,72),
}
edges={}
def ring(names):
    names=names.split();points=[]
    for a,b in zip(names,names[1:]+names[:1]):
        lo,hi=sorted([a,b]);key=(lo,hi)
        if key not in edges:
            x,y=p[lo];u,v=p[hi];dx=u-x;dy=v-y;length=math.hypot(dx,dy);steps=max(2,round(length/2))
            seed=sum(ord(c) for c in lo+hi);line=[]
            for i in range(steps+1):
                t=i/steps;offset=0 if i in (0,steps) else math.sin(i*2.7+seed)*.6
                line.append([round((x+dx*t-dy/length*offset)/5,5),round((y+dy*t+dx/length*offset)/5,5)])
            edges[key]=line
        line=edges[key] if a==lo else list(reversed(edges[key]));points.extend(line[:-1])
    return points+[points[0]]
regions=[
 ('001','Lindon',['NW L1 L2 L3 W6 W5 W4 W3 W2 W1']),
 ('002','Eriador',['NW N1 M1 M2 M3 L3 L2 L1','H1 H2 H3 H4 H5']),
 ('003','The Shire',['H1 H2 H3 H4 H5']),
 ('004','Rhovanion',['N1 N2 E1 E2 J M3 M2 M1']),
 ('005','Rhûn',['N2 NE R1 R2 E3 E2 E1']),
 ('006','Enedwaith',['L3 M3 J W8 W7 W6']),
 ('007','Rohan',['J E2 E3 E4 G1 W8']),
 ('008','Gondor',['W8 G1 E4 G3 G2 W12 W11 W10 W9']),
 ('009','Mordor',['E3 R2 R3 K G3 E4']),
 ('010','Khand',['R3 SE K']),
 ('011','Harad',['G3 K SE S2 S1']),
]
features=[{'type':'Feature','properties':{'code':code,'nom':name},'geometry':{'type':'Polygon','coordinates':[ring(r) for r in rings]}} for code,name,rings in regions]
with tempfile.NamedTemporaryFile(mode='w',suffix='.geojson') as f:
    json.dump({'type':'FeatureCollection','features':features},f);f.flush()
    subprocess.run(['python3','scripts/prepare-regions.py',f.name,'data/middle-earth.json'],check=True)
