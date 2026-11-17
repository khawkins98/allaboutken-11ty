#!/usr/bin/env python3
"""Prepare a small homepage cover instance of official Science Gothic.
Requires fonttools[woff] (verified with 4.64.0). No new glyphs are drawn.
"""
from io import BytesIO
from pathlib import Path
from urllib.parse import quote
from urllib.request import urlopen
import hashlib
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

COMMIT = '9eae80c1fe8f937e4f7009629c8248a959735c77'
BASE = f'https://raw.githubusercontent.com/googlefonts/science-gothic/{COMMIT}'
SOURCE = BASE + '/fonts/variable/' + quote('ScienceGothic[CTRS,slnt,wdth,wght].ttf')
OUT = Path(__file__).resolve().parents[1] / 'src/components/kh-font/science-gothic'
OUT.mkdir(parents=True, exist_ok=True)
data = urlopen(SOURCE).read()
cover = instantiateVariableFont(TTFont(BytesIO(data), recalcTimestamp=False),
    {'wght': 750, 'wdth': 60, 'slnt': -5, 'CTRS': 0}, inplace=False)
options = subset.Options()
options.layout_features = ['*']
options.name_IDs = ['*']
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=list(range(0x20, 0x250)) + list(range(0x2000, 0x2070)))
subsetter.subset(cover)
cover.flavor = 'woff2'
cover.save(OUT / 'ScienceGothic-Cover.woff2')
for name in ['OFL.txt', 'AUTHORS.txt']:
    (OUT / name).write_bytes(urlopen(BASE + '/' + name).read())
print('Source SHA-256:', hashlib.sha256(data).hexdigest())
for p in OUT.glob('*.woff2'):
    print(p.name, p.stat().st_size, 'bytes', hashlib.sha256(p.read_bytes()).hexdigest())
