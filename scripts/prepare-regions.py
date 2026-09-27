"""Convert France GeoJSON into shared-edge TopoJSON without dependencies.
Usage: python3 scripts/prepare-regions.py input.geojson output.json
Source and licence: data/README.md
"""
import json, sys
source=json.load(open(sys.argv[1]))
arcs=[]; lookup={}; geometries=[]
def ring_indices(ring):
    result=[]
    for a,b in zip(ring,ring[1:]):
        a=tuple(a); b=tuple(b)
        if a==b: continue
        if (a,b) in lookup: result.append(lookup[a,b])
        elif (b,a) in lookup: result.append(~lookup[b,a])
        else:
            result.append(len(arcs));lookup[a,b]=len(arcs);arcs.append([a,b])
    return result
for f in source['features']:
    g=f['geometry']; p=f['properties']
    polygons=[g['coordinates']] if g['type']=='Polygon' else g['coordinates']
    geometries.append({'type':'MultiPolygon','id':p['code'],'properties':{'name':p['nom']},'arcs':[[ring_indices(r) for r in poly] for poly in polygons]})
json.dump({'type':'Topology','objects':{'regions':{'type':'GeometryCollection','geometries':geometries}},'arcs':arcs},open(sys.argv[2],'w'),separators=(',',':'),ensure_ascii=False)
