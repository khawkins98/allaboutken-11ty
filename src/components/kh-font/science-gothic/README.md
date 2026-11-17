# Science Gothic trial assets

Official source: [Science Gothic](https://github.com/googlefonts/science-gothic),
by Thomas Phinney, Vassil Kateliev and Brandon Buerkle. Original `OFL.txt` and
`AUTHORS.txt` are retained here.

Pinned source commit: `9eae80c1fe8f937e4f7009629c8248a959735c77`.
The source TTF is `fonts/variable/ScienceGothic[CTRS,slnt,wdth,wght].ttf`.
Its SHA-256 is `246e4d33a6fcb3846094e5c4c034616f83e9ae10100316df32e2436362deab3d`.

- `ScienceGothic-Cover.woff2`: fixed instance for the homepage and opt-in shard headings at weight 750,
  width 60, slant -5 and contrast 0; subset to U+0020–024F and U+2000–206F.
  It retains 411 encoded code points. No new outlines are drawn.

The actual file’s axes are `wght` 100–900, `wdth` 50–200, `slnt` -10–0,
and `CTRS` 0–85. The project README currently names contrast `CNTR`; the
preparation script uses the inspected binary’s `CTRS` tag.

Rebuild using Python 3 with `fonttools[woff]` (verified with 4.64.0):

```sh
python3 scripts/prepare-science-gothic.py
```

The script fetches the pinned source and licenses. It adds no authoring
requirement to the site’s Node build. The homepage cover and opt-in shard headings share this instance; other
display headings and social cards remain Anton.

## Output checksums

- `ScienceGothic-Cover.woff2`: 32,504 bytes; SHA-256 `50dc2601a3f20e66b33484f6d030ecd69278b88dcaec0413387ba32199a876cf`.
