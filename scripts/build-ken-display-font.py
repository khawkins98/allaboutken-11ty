#!/usr/bin/env python3
"""Build Ken Cartridge Display: original geometric uppercase, width 65–115.

Requirements: Python 3, fonttools[woff] (tested with FontTools 4.64.0).
The editable centre-line drawings below are authored for this experiment.
Width changes advances, counters, diagonals and sidebearings; stems do not
get horizontally scaled. Output files are build artefacts, not the source.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
import math
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.designspaceLib import DesignSpaceDocument, AxisDescriptor, SourceDescriptor
from fontTools.varLib import build
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'src/components/kh-font/ken-display'
UPM, CAP = 1000, 700
# Each entry is (relative width, paths in unit design space). Polygonal curves
# and flat terminals are intentional; this is a display experiment, not Plex.
G = {}
def glyph(char, width, *paths): G[char] = (width, paths)
O = [(0,.18),(0,.82),(.18,1),(.82,1),(1,.82),(1,.18),(.82,0),(.18,0),(0,.18)]
glyph('A',1, [(0,0),(.5,1),(1,0)], [(.18,.36),(.82,.36)])
glyph('B',1, [(0,0),(0,1),(.72,1),(1,.82),(1,.65),(.73,.51),(0,.51)], [(.73,.51),(1,.34),(1,.18),(.75,0),(0,0)])
glyph('C',1, [(1,.83),(.82,1),(.18,1),(0,.82),(0,.18),(.18,0),(.82,0),(1,.17)])
glyph('D',1, [(0,0),(0,1),(.7,1),(1,.78),(1,.22),(.7,0),(0,0)])
glyph('E',.88, [(1,1),(0,1),(0,0),(1,0)], [(0,.51),(.8,.51)])
glyph('F',.88, [(0,0),(0,1),(1,1)], [(0,.52),(.8,.52)])
glyph('G',1, [(1,.83),(.82,1),(.18,1),(0,.82),(0,.18),(.18,0),(.82,0),(1,.18),(1,.46),(.56,.46)])
glyph('H',1, [(0,0),(0,1)], [(1,0),(1,1)], [(0,.51),(1,.51)])
glyph('I',.34, [(0,1),(1,1)], [(.5,0),(.5,1)], [(0,0),(1,0)])
glyph('J',.85, [(0,.21),(.2,0),(.75,0),(1,.2),(1,1)], [(.46,1),(1,1)])
glyph('K',1, [(0,0),(0,1)], [(1,1),(0,.45)], [(.35,.64),(1,0)])
glyph('L',.86, [(0,1),(0,0),(1,0)])
glyph('M',1.3, [(0,0),(0,1),(.5,.43),(1,1),(1,0)])
glyph('N',1.08, [(0,0),(0,1),(1,0),(1,1)])
glyph('O',1, O)
glyph('P',1, [(0,0),(0,1),(.75,1),(1,.82),(1,.64),(.75,.47),(0,.47)])
glyph('Q',1, O, [(.6,.28),(1.1,-.08)])
glyph('R',1, [(0,0),(0,1),(.75,1),(1,.82),(1,.64),(.75,.49),(0,.49)], [(.54,.49),(1,0)])
glyph('S',1, [(1,.84),(.82,1),(.2,1),(0,.8),(0,.65),(.2,.51),(.8,.49),(1,.33),(1,.18),(.8,0),(.18,0),(0,.17)])
glyph('T',1, [(0,1),(1,1)], [(.5,1),(.5,0)])
glyph('U',1, [(0,1),(0,.18),(.18,0),(.82,0),(1,.18),(1,1)])
glyph('V',1, [(0,1),(.5,0),(1,1)])
glyph('W',1.4, [(0,1),(.22,0),(.5,.58),(.78,0),(1,1)])
glyph('X',1, [(0,1),(1,0)], [(0,0),(1,1)])
glyph('Y',1, [(0,1),(.5,.5),(1,1)], [(.5,.5),(.5,0)])
glyph('Z',1, [(0,1),(1,1),(0,0),(1,0)])
glyph('0',1, O, [(.18,.18),(.82,.82)])
glyph('1',.65, [(0,.77),(.58,1),(.58,0)], [(0,0),(1,0)])
glyph('2',1, [(0,.8),(.2,1),(.8,1),(1,.8),(1,.65),(0,0),(1,0)])
glyph('3',1, [(0,1),(1,1),(.5,.56),(.8,.56),(1,.36),(1,.19),(.8,0),(.2,0),(0,.18)])
glyph('4',1, [(.78,0),(.78,1),(0,.32),(1,.32)])
glyph('5',1, [(1,1),(0,1),(0,.53),(.78,.53),(1,.33),(1,.18),(.8,0),(.2,0),(0,.17)])
glyph('6',1, [(1,.84),(.8,1),(.2,1),(0,.8),(0,.18),(.2,0),(.8,0),(1,.18),(1,.38),(.8,.55),(0,.55)])
glyph('7',1, [(0,1),(1,1),(.28,0)])
glyph('8',1, [(.2,.51),(0,.69),(0,.83),(.18,1),(.82,1),(1,.83),(1,.69),(.8,.51),(.2,.51),(0,.32),(0,.18),(.18,0),(.82,0),(1,.18),(1,.32),(.8,.51)])
glyph('9',1, [(0,.16),(.2,0),(.8,0),(1,.2),(1,.82),(.8,1),(.2,1),(0,.82),(0,.62),(.2,.45),(1,.45)])
glyph('.',.22, [(.5,0),(.5,.025)])
glyph(',',.26, [(.6,.08),(.6,0),(.1,-.14)])
glyph(':',.22, [(.5,.12),(.5,.145)], [(.5,.68),(.5,.705)])
glyph(';',.26, [(.6,.15),(.6,.07),(.1,-.07)], [(.6,.68),(.6,.705)])
glyph('!',.22, [(.5,1),(.5,.3)], [(.5,0),(.5,.025)])
glyph('?',.9, [(0,.8),(.2,1),(.8,1),(1,.8),(1,.65),(.5,.4),(.5,.28)], [(.5,0),(.5,.025)])
glyph('-',.65, [(0,.46),(1,.46)])
glyph('–',1, [(0,.46),(1,.46)])
glyph('—',1.5, [(0,.46),(1,.46)])
glyph('/',.8, [(0,-.04),(1,1.04)])
glyph('(',.5, [(1,1),(.4,.8),(0,.5),(.4,.2),(1,0)])
glyph(')',.5, [(0,1),(.6,.8),(1,.5),(.6,.2),(0,0)])
glyph('[',.5, [(1,1),(0,1),(0,0),(1,0)])
glyph(']',.5, [(0,1),(1,1),(1,0),(0,0)])
glyph("'",.22, [(.5,1),(.5,.77)])
glyph('’',.26, [(.8,1),(.8,.85),(.2,.73)])
glyph('‘',.26, [(.8,.73),(.2,.85),(.2,1)])
glyph('"',.5, [(0,1),(0,.77)], [(1,1),(1,.77)])
glyph('“',.6, [(.35,.73),(0,.85),(0,1)], [(1,.73),(.65,.85),(.65,1)])
glyph('”',.6, [(.35,1),(.35,.85),(0,.73)], [(1,1),(1,.85),(.65,.73)])
glyph('+',.85, [(0,.5),(1,.5)], [(.5,.15),(.5,.85)])
glyph('=',.85, [(0,.3),(1,.3)], [(0,.7),(1,.7)])
glyph('&',1.05, [(1,0),(.12,.77),(.12,.88),(.3,1),(.55,1),(.73,.85),(.73,.7),(0,.22),(0,.12),(.18,0),(.65,0),(1,.4)])
glyph('#',1, [(.22,0),(.38,1)], [(.65,0),(.82,1)], [(0,.33),(1,.33)], [(0,.68),(1,.68)])
glyph('…',.9, [(0,0),(0,.025)], [(.5,0),(.5,.025)], [(1,0),(1,.025)])
glyph('↗',1, [(0,.05),(1,.95)], [(.35,.95),(1,.95),(1,.3)])
glyph('*',.8, [(0,.25),(1,.85)], [(0,.85),(1,.25)], [(.5,.1),(.5,1)])

# A mitered stroked path becomes a single contour with compatible point order.
def stroke(pen, points, thickness):
    normals=[]
    for a,b in zip(points,points[1:]):
        dx,dy=b[0]-a[0],b[1]-a[1]; length=math.hypot(dx,dy)
        normals.append((-dy/length,dx/length))
    def side(sign):
        result=[]
        for i,p in enumerate(points):
            if i==0:n=normals[0]; scale=thickness/2
            elif i==len(points)-1:n=normals[-1];scale=thickness/2
            else:
                a,b=normals[i-1],normals[i];n=(a[0]+b[0],a[1]+b[1]); length=math.hypot(*n)
                if length < .001:n=b;scale=thickness/2
                else:
                    n=(n[0]/length,n[1]/length); dot=n[0]*b[0]+n[1]*b[1]
                    scale=min(thickness/2/max(dot,.25),thickness*.75)
            result.append((round(p[0]+sign*n[0]*scale),round(p[1]+sign*n[1]*scale)))
        return result
    contour=side(1)+list(reversed(side(-1)))
    # One winding for every stroke, so overlaps add rather than cancel.
    area=sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(contour,contour[1:]+contour[:1]))
    if area>0:contour.reverse()
    pen.moveTo(contour[0])
    for p in contour[1:]:pen.lineTo(p)
    pen.closePath()

def build_master(width, path):
    fb=FontBuilder(UPM,isTTF=True)
    cmap={ord(c):f'uni{ord(c):04X}' for c in G};cmap[32]='space'
    order=['.notdef','space']+list(cmap.values())[:-1]
    fb.setupGlyphOrder(order);fb.setupCharacterMap(cmap)
    glyf={};metrics={}
    # Counter growth is independent of stroke thickness. Diagonals are stroked
    # after their centre lines move; they keep perpendicular thickness.
    for c,(ratio,paths) in G.items():
        pen=TTGlyphPen(None)
        body=(410+(width-85)*5.4)*ratio
        bearing=98+(width-85)*.12
        for p in paths:
            p=list(p)
            if len(p)==2 and p[0][0]==p[1][0] and abs(p[1][1]-p[0][1])<.03:
                p[1]=(p[1][0],p[0][1]+.14)
            points=[(bearing+x*body,48+y*(CAP-96)) for x,y in p]
            stroke(pen,points,120 if c not in '.:,;…' else 98)
        name=cmap[ord(c)];g=pen.glyph()
        if len(g.flags):g.flags[0] |= 0x40 # OVERLAP_SIMPLE for rasterisers
        g.recalcBounds({name:g})
        glyf[name]=g;metrics[name]=(round(body+2*bearing),g.xMin)
    pen=TTGlyphPen(None);stroke(pen,[(65,0),(65,700),(465,700),(465,0),(65,0)],45)
    glyf['.notdef']=pen.glyph();metrics['.notdef']=(530,42)
    glyf['space']=TTGlyphPen(None).glyph();metrics['space']=(round(220+(width-85)*1.2),0)
    fb.setupGlyf(glyf);fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=850,descent=-200)
    fb.setupNameTable({'familyName':'Ken Cartridge Display','styleName':f'Width {width}','uniqueFontIdentifier':f'KenCartridgeDisplay-0.1-{width}','fullName':f'Ken Cartridge Display Width {width}','psName':f'KenCartridgeDisplay-W{width}','version':'Version 0.100','copyright':'Copyright 2026 Ken Hawkins. Licensed under the SIL Open Font License, Version 1.1.'})
    fb.setupOS2(sTypoAscender=850,sTypoDescender=-200,sTypoLineGap=0,usWinAscent=900,usWinDescent=220,sCapHeight=700,sxHeight=500,usWeightClass=400,usWidthClass=5,fsSelection=0x40)
    fb.setupPost();fb.setupMaxp()
    pairs=[('A','V',-35),('A','W',-25),('A','T',-20),('T','A',-25),('T','O',-15),('V','A',-35),('W','A',-25),('Y','A',-30),('L','T',-25),('L','Y',-25),('F','A',-20)]
    feature='feature kern {\n'+''.join(f'pos {cmap[ord(a)]} {cmap[ord(b)]} {v};\n' for a,b,v in pairs)+'} kern;'
    addOpenTypeFeaturesFromString(fb.font,feature)
    fb.font.recalcTimestamp=False
    fb.font['head'].created=fb.font['head'].modified=3849984000 # reproducible timestamp
    fb.save(path)

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    with TemporaryDirectory() as temp:
        doc=DesignSpaceDocument();axis=AxisDescriptor();axis.name='Width';axis.tag='wdth';axis.minimum=65;axis.default=85;axis.maximum=115;doc.addAxis(axis)
        for width,label in [(65,'Condensed'),(85,'Regular'),(115,'Expanded')]:
            path=Path(temp)/f'{label}.ttf';build_master(width,path)
            source=SourceDescriptor();source.path=str(path);source.name=label;source.familyName='Ken Cartridge Display';source.styleName=label;source.location={'Width':width}
            if width==85:source.copyInfo=source.copyLib=source.copyFeatures=True
            doc.addSource(source)
        vf,_,_=build(doc)
        for record in vf['name'].names:
            if record.nameID in (1,4,6,16,17):
                values={1:'Ken Cartridge Display',4:'Ken Cartridge Display Variable',6:'KenCartridgeDisplay-Variable',16:'Ken Cartridge Display',17:'Regular'}
                record.string=values[record.nameID].encode(record.getEncoding())
        vf['OS/2'].usWeightClass=400
        vf.recalcTimestamp=False
        vf['head'].created=vf['head'].modified=3849984000
        vf.save(OUT/'KenCartridgeDisplay-Variable.ttf')
        vf.flavor='woff2';vf.save(OUT/'KenCartridgeDisplay-Variable.woff2')
        print(f'Built {len(vf.getBestCmap())} code points; wdth 65–115 (default 85).')
        for width in [65,75,85,100,115]:
            instance=instantiateVariableFont(vf,{'wdth':width},inplace=False)
            for char in 'ABGOPQR0689':
                g=instance['glyf'][instance.getBestCmap()[ord(char)]]
                assert g.numberOfContours>0
            print(f'  width {width}: M advance {instance["hmtx"]["uni004D"][0]}, O advance {instance["hmtx"]["uni004F"][0]}')
if __name__=='__main__': main()
