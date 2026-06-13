# macemu-jit: project background notes

Reference material for blog posts about the Apple Silicon SheepShaver project.
Source repo: https://github.com/khawkins98/macemu-jit

## What it is

A macOS Apple Silicon port of SheepShaver with a native AArch64 JIT backend. Boots Mac OS 8.6/9
to the Finder desktop on M-series Macs. Not yet distributed.

Fork chain: cebix/macemu → kanjitalk755/macemu → rcarmo/macemu-jit → khawkins98/macemu-jit (this)

## Related projects (the arc)

- **classic-vibe-mac** (github.com/khawkins98/classic-vibe-mac): C source in, 68k Mac binary out,
  runs in System 7.5.5 in the browser via WebAssembly Basilisk II
- **scriptoscope** (github.com/khawkins98/scriptoscope): Mac OS-style window manager + Kaleidoscope
  theme engine for the web
- **PDF-A-go-slim** (/posts/20260216-introducing-pdf-a-go-slim/): browser utility with Mac OS 8
  floating palette UI
- **macsurf** (github.com/mplsllc/macsurf): the QML app that started the emulator detour

## What's working

- SheepShaver boots Mac OS 8.6/9 to Finder on M-series Macs
- Native AArch64 JIT on by default (SS_USE_JIT=0 to force interpreter)
- Preliminary AltiVec/NEON support (opt-in; Mac OS 8.6/9 don't save vector registers across task
  switches, so not safe for general multitasking yet)
- Full opcode harness: 353 vectors, score=100

## What's in progress

- **Machine Layer** (M0-M13): hardware emulation layer enabling Mac OS ROM 9.0.1 to boot natively.
  Requires device models for SCC 8530 serial, VIA 6522 timer, Cuda/ADB, OpenPIC interrupt routing.
  Current frontier (M13): A-trap bootstrapping for interrupt delivery.
- **Silicon Sheep**: native macOS launcher (Tauri app) for SheepShaver

## Why Mac OS 9.2 is hard

The 1998 Mac OS ROM 1.1 (which SheepShaver has historically required) is structurally incompatible
with Mac OS 9.2: missing CFM boot fragments and heap layout mismatches. The 9.0.1 ROM needs a
proper NewWorld hardware emulation layer that SheepShaver never had.

## Key technical facts for posts

- MAP_JIT required on macOS for JIT executable pages (Linux doesn't need this)
- Mach exception handling replaces POSIX signals for memory fault handling on macOS
- Guest memory lives in the host address space at a fixed offset (NATMEM_OFFSET) -- no TLB
  simulation, just pointer arithmetic
- AltiVec advertised via `altivec true` pref; apps detect and use the Velocity Engine through JIT
- Build: SDL3, VDE networking via Homebrew; requires OldWorld PPC Mac ROM 1.1 (not included)

## Voice notes for posts

From README "Why does this exist?":
> "After waiting a quarter of a century, it became obvious that nobody else was going to get New
> World ROMs running just-in-time on Apple Silicon either. So I thought maybe I would."

AI collaboration: "a genuine partnership with the agent, not just prompting and hoping." Cross-link
to /posts/20260420-let-ai-worry-about-the-code/

## Internal links

- Anchor post: /posts/20200208-its-been-20-years.html ("a long history with classic Mac OS")
- AI collaboration: /posts/20260420-let-ai-worry-about-the-code/
- PDF-A-go-slim paradigm: /posts/20260216-90s-desktop-paradigm-browser-utilities/
