# Recursive webfont assets (self-hosted)

https://github.com/arrowtype/recursive/tree/main/fonts

Place the variable WOFF2 file for Recursive here. Recommended:

- Recursive_VF_1.085.woff2 (variable font with axes: wght, slnt, CASL, CRSV, MONO)

Download from the project releases or Google Fonts:
- https://github.com/arrowtype/recursive/

After placing the file, it will be copied to `build/kh-font/assets/` by Eleventy passthrough. Ensure CSS `@font-face` in `src/components/vf-componenet-rollup/index.scss` points to:

```
../kh-font/assets/Recursive_VF_1.085.woff2
```
