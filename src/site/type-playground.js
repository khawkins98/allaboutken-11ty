const FONTS = {
  "league": {
    "family": "League Mono",
    "axes": {
      "wght": [
        100.0,
        100.0,
        800.0
      ],
      "wdth": [
        50.0,
        50.0,
        200.0
      ]
    },
    "features": [
      "aalt",
      "case",
      "ccmp",
      "locl",
      "mark",
      "mkmk",
      "ordn",
      "pnum",
      "ss01",
      "tnum"
    ],
    "kern": false,
    "bytes": 56576,
    "fallback": "monospace"
  },
  "plex-mono": {
    "family": "IBM Plex Mono Variable",
    "axes": {
      "wght": [
        100.0,
        400.0,
        700.0
      ]
    },
    "features": [
      "aalt",
      "ccmp",
      "dnom",
      "frac",
      "lnum",
      "locl",
      "mark",
      "numr",
      "onum",
      "ordn",
      "rvrn",
      "salt",
      "sinf",
      "ss01",
      "ss02",
      "ss03",
      "ss04",
      "ss05",
      "ss06",
      "ss07",
      "ss08",
      "ss09",
      "subs",
      "sups",
      "zero"
    ],
    "kern": false,
    "bytes": 83488,
    "fallback": "monospace"
  },
  "plex-sans": {
    "family": "IBM Plex Sans Variable",
    "axes": {
      "wght": [
        100.0,
        400.0,
        700.0
      ],
      "wdth": [
        85.0,
        100.0,
        100.0
      ]
    },
    "features": [
      "aalt",
      "ccmp",
      "dnom",
      "frac",
      "kern",
      "liga",
      "lnum",
      "locl",
      "mark",
      "numr",
      "onum",
      "ordn",
      "rvrn",
      "salt",
      "sinf",
      "ss01",
      "ss02",
      "ss03",
      "ss04",
      "ss05",
      "ss06",
      "subs",
      "sups",
      "zero"
    ],
    "kern": true,
    "bytes": 234172,
    "fallback": "sans-serif"
  },
  "science": {
    "family": "Science Gothic",
    "axes": {
      "CTRS": [
        0.0,
        0.0,
        85.0
      ],
      "slnt": [
        -10.0,
        0.0,
        0.0
      ],
      "wdth": [
        50.0,
        100.0,
        200.0
      ],
      "wght": [
        100.0,
        400.0,
        900.0
      ]
    },
    "features": [
      "aalt",
      "c2sc",
      "case",
      "ccmp",
      "dnom",
      "frac",
      "kern",
      "locl",
      "mark",
      "mkmk",
      "numr",
      "ordn",
      "pnum",
      "rvrn",
      "salt",
      "sinf",
      "smcp",
      "ss01",
      "ss02",
      "subs",
      "sups",
      "tnum",
      "zero"
    ],
    "kern": true,
    "bytes": 908728,
    "fallback": "sans-serif"
  }
};
const lab = document.querySelector('.league-type');
const byId = name => document.getElementById(`league-${name}`);
const family = byId('family');
const featureBox = byId('features');
const ranges = {
  weight: ['--type-weight', ''], width: ['--type-width', '%'],
  size: ['--type-size', 'px'], leading: ['--type-leading', ''],
  tracking: ['--type-tracking', 'em'], wordspace: ['--type-wordspace', 'em'],
};
const selects = { kerning: '--type-kerning', case: '--type-case', align: '--type-align' };
const names = {
  case: 'Case-sensitive punctuation', ordn: 'Ordinal letter forms',
  frac: 'Diagonal fractions', zero: 'Slashed zero', liga: 'Standard ligatures',
  smcp: 'Small capitals', c2sc: 'Capitals to small capitals',
  salt: 'Stylistic alternates', sups: 'Superscripts', subs: 'Subscripts',
  sinf: 'Scientific inferiors', numr: 'Numerator forms', dnom: 'Denominator forms',
};
let fontRequest = 0;

function featuresFor(font) {
  return font.features.filter(tag => names[tag] || /^ss\d\d$/.test(tag));
}
function update() {
  const font = FONTS[family.value];
  lab.style.setProperty('--type-family', `'${font.family}'`);
  lab.style.setProperty('--type-fallback', font.fallback);
  const css = [`font-family: '${font.family}', ${font.fallback};`];
  for (const [name, [property, unit]] of Object.entries(ranges)) {
    const value = byId(name).value + unit;
    lab.style.setProperty(property, value);
    byId(`${name}-value`).value = value;
    const cssName = { width: 'font-stretch', weight: 'font-weight', size: 'font-size', leading: 'line-height', tracking: 'letter-spacing', wordspace: 'word-spacing' }[name];
    css.push(`${cssName}: ${value};`);
  }
  const style = font.axes.slnt ? `oblique ${-Number(byId('slant').value)}deg` : 'normal';
  const variations = font.axes.CTRS ? `'CTRS' ${byId('contrast').value}` : 'normal';
  lab.style.setProperty('--type-style', style);
  lab.style.setProperty('--type-variations', variations);
  byId('slant-value').value = `${byId('slant').value}°`;
  byId('contrast-value').value = byId('contrast').value;
  css.push(`font-style: ${style};`, `font-variation-settings: ${variations};`);
  for (const [name, property] of Object.entries(selects)) {
    lab.style.setProperty(property, byId(name).value);
    css.push(`${{ kerning:'font-kerning', case:'text-transform', align:'text-align' }[name]}: ${byId(name).value};`);
  }
  const numeric = [byId('numerals').value, byId('number-spacing').value].filter(v => v !== 'normal').join(' ') || 'normal';
  lab.style.setProperty('--type-numbers', numeric);
  css.push(`font-variant-numeric: ${numeric};`);
  const features = [...featureBox.querySelectorAll('input')].map(input => `'${input.value}' ${input.checked ? 1 : 0}`).join(', ') || 'normal';
  lab.style.setProperty('--type-features', features);
  css.push(`font-feature-settings: ${features};`);
  for (const sample of lab.querySelectorAll('.league-type__sample')) sample.lang = byId('language').value;
  byId('live').textContent = byId('text').value || 'Make it make sense.';
  byId('css').textContent = css.join('\n');
}

async function configureFont() {
  const font = FONTS[family.value];
  const weight = byId('weight');
  weight.min = font.axes.wght[0]; weight.max = font.axes.wght[2];
  weight.value = Math.max(+weight.min, Math.min(+weight.max, +weight.value));
  const width = byId('width');
  const axis = font.axes.wdth;
  width.disabled = !axis;
  width.min = axis ? axis[0] : 100; width.max = axis ? axis[2] : 100;
  width.value = axis ? Math.max(+width.min, Math.min(+width.max, +width.value)) : 100;
  byId('axis-help').textContent = `${font.family}: weight ${weight.min}–${weight.max}; ${axis ? `width ${width.min}–${width.max}%` : 'fixed width (no width axis)'}.`;
  for (const [name, tag] of [['slant', 'slnt'], ['contrast', 'CTRS']]) {
    const input = byId(name), axis = font.axes[tag];
    input.disabled = !axis;
    input.min = axis ? axis[0] : 0; input.max = axis ? axis[2] : 0;
    input.value = axis ? Math.max(+input.min, Math.min(+input.max, +input.value)) : 0;
  }
  byId('kerning').disabled = !font.kern;
  byId('kerning').value = 'normal';
  byId('kerning-help').textContent = font.kern
    ? 'Pair kerning is available. Try AVATAR, WA and To. Tracking separately changes spacing between every character.'
    : `${font.family} has no kerning pairs. Use tracking above to change visible letter spacing, or select a proportional face to compare pair kerning.`;
  for (const name of ['numerals', 'number-spacing']) {
    const select = byId(name);
    select.value = 'normal';
    for (const option of select.options) option.disabled = !!option.dataset.feature && !font.features.includes(option.dataset.feature);
    select.disabled = ![...select.options].some(option => option.dataset.feature && !option.disabled);
  }
  featureBox.replaceChildren();
  for (const tag of featuresFor(font)) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox'; input.value = tag; input.checked = tag === 'liga';
    const title = names[tag] || `Alternate letterforms ${Number(tag.slice(2))}`;
    label.append(input, document.createTextNode(`${title} (${tag})`));
    featureBox.append(label);
  }
  update();
  const request = ++fontRequest;
  byId('font-status').textContent = `Loading local ${font.family}…`;
  try {
    const style = font.axes.slnt ? `oblique ${-Number(byId('slant').value)}deg ` : '';
    const loaded = await document.fonts.load(`${style}${byId('weight').value} 32px "${font.family}"`, 'AVATAR Make it make sense.');
    if (request === fontRequest) byId('font-status').textContent = loaded.length
      ? `${font.family} loaded locally. ${Math.round(font.bytes / 1024)} KiB complete WOFF2.`
      : 'The local font did not load; the preview is using a fallback.';
  } catch {
    if (request === fontRequest) byId('font-status').textContent = 'The local font did not load; the preview is using a fallback.';
  }
}

family.addEventListener('change', configureFont);
for (const name of [...Object.keys(ranges), 'slant', 'contrast']) byId(name).addEventListener('input', update);
for (const name of [...Object.keys(selects), 'numerals', 'number-spacing', 'language']) byId(name).addEventListener('change', update);
featureBox.addEventListener('change', update);
byId('text').addEventListener('input', update);
byId('reset').addEventListener('click', () => {
  family.value = 'science';
  configureFont();
  for (const name of [...Object.keys(ranges), 'slant', 'contrast']) byId(name).value = byId(name).defaultValue;
  for (const name of [...Object.keys(selects), 'language']) byId(name).selectedIndex = 0;
  byId('text').value = byId('text').defaultValue;
  byId('copy-status').textContent = '';
  update();
});
byId('copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(byId('css').textContent);
    byId('copy-status').textContent = ' CSS copied.';
  } catch {
    byId('copy-status').textContent = ' Select the CSS above and copy it manually.';
  }
});
configureFont();
