#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "brotli==1.2.1",
#   "fonttools==4.68.0",
#   "uharfbuzz==0.57.0",
# ]
# ///
"""Cut Geist down to what Mosaic draws, as two WOFF2 files and their CSS.

Run by hand, never in the build, then commit what it writes to
src/styles/fonts/:

    uv run scripts/subset-fonts.py

The output is deterministic, so a rerun with nothing changed leaves git
clean. Rerun it when:

- `src/lib/fonts.test.ts` fails because src/ or Clerk's en-US strings use a
  character the files don't have (the test names it);
- the test fails because a style asks for a weight below AXIS[0]: first set
  AXIS to (100, 900), the full range;
- a style turns on an OpenType feature: first add its tag to FEATURES;
- you move to a newer Geist: first update SOURCE_COMMIT and SOURCE_SHA256.

Each choice keeps rendering identical to the fontsource files it replaced
(Geist 1.800 from Google Fonts, the same build as the source here):

- Characters: ASCII, Latin-1, Latin Extended-A, the punctuation pages use,
  and any other character in src/ or Clerk's strings that the old files
  drew. Characters they never had (arrows, box drawing, CJK) stay on system
  fonts.
- Two files, split like fontsource's latin and latin-ext files. Chrome
  shapes each unicode-range face on its own, so kerning only works between
  characters in the same file: moving Latin-1 letters out of the core would
  lose kerning in pairs like "Té" and "Vä". The core also keeps the
  combining macron and diaeresis, which the old latin file used to draw
  ĀāĒēĪīŌōŪū and Ÿ (see main()).

Before writing anything it checks that each file draws like the source,
and that both together, under their unicode-ranges and with Chrome's
fallback between faces, draw every kept character and pair of characters
like fontsource's five files did.
- wght from 400 to 900. Nothing uses less than 400, so the 100 master goes.
  Cutting at 700, the heaviest weight in use, would rescale every heavy
  delta and move advance widths at 500 and 600 by up to half a unit.
  Italic stays synthesized from the upright font; there's no italic file.
- OpenType features in FEATURES only. The old files had no stylistic sets,
  so the `ss02`–`ss09` that `__root.tsx` turns on must stay absent.
- `prep` (dropout control) and `gasp` stay: Geist has no glyph
  instructions, and those two tables steer rasterization on Windows.
"""

import argparse
import hashlib
import io
import json
import subprocess
import sys
import unicodedata
import urllib.request
from pathlib import Path

import uharfbuzz as hb
from fontTools import subset
from fontTools.pens.recordingPen import RecordingPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "src/styles/fonts"
CACHE_DIR = ROOT / "node_modules/.cache/fonts"

SOURCE_COMMIT = "6157dfaa640ca5738b4d1a7070fe389c3036d7fc"
SOURCE_BASE = (
    f"https://raw.githubusercontent.com/google/fonts/{SOURCE_COMMIT}/ofl/geist"
)
SOURCE_URL = f"{SOURCE_BASE}/Geist%5Bwght%5D.ttf"
SOURCE_SHA256 = "73894e0448cae90a92b6c2f8732b7bb9acb7b94c418bff559dad4a18e1de9659"
LICENSE_URL = f"{SOURCE_BASE}/OFL.txt"

FAMILY = "Geist Variable"

# The axis range the files keep: (400, 900) or the full (100, 900). Geist's
# masters are 100, 400, and 900, and any other cut would rescale deltas.
AXIS = (400, 900)
# The weights pages use, which the checks compare against the source:
# Tailwind's font-normal, font-medium, and font-semibold; prose text, and
# its headings and <strong> at 600 (prose-headings:font-semibold); Clerk's
# normal, medium, semibold, and bold; sonner's 400 and 500.
WEIGHTS = range(AXIS[0], 701, 50)

# ccmp, kern, liga, mark, and mkmk are on by default; Geist's liga draws
# "->" and "<-" as arrows. tnum is `tabular-nums` on the dashboard. The old
# files also had locl (only for languages like Turkish, Romanian, and
# Dutch; Mosaic is lang="en"), frac, numr, dnom, and pnum, which nothing
# turns on.
FEATURES = ["ccmp", "kern", "liga", "mark", "mkmk", "tnum"]

# The unicode-ranges of fontsource's files, in the order Chrome tries them
# (the reverse of their order in its CSS). The core takes characters from
# the first, the extended file from the rest.
OLD_FACES = {
    "latin": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,"
    "U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,"
    "U+2215,U+FEFF,U+FFFD",
    "latin-ext": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,"
    "U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,"
    "U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
    "vietnamese": "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,"
    "U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,"
    "U+0329,U+1EA0-1EF9,U+20AB",
    "cyrillic": "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116",
    "cyrillic-ext": "U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,"
    "U+FE2E-FE2F",
}

ASCII = set(range(0x20, 0x7F))
LATIN_1 = set(range(0xA0, 0x100))
LATIN_EXT_A = set(range(0x100, 0x180))
# Curly quotes, en and em dashes, the ellipsis (also text-overflow's), and
# the bullet in Clerk's strings.
PUNCTUATION = {0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026}

# Where the text pages draw comes from. Clerk renders its en-US strings in
# Geist (fontFamily: "inherit").
SCANNED = ["src/**/*.ts", "src/**/*.tsx", "src/**/*.md", "src/**/*.css"]
SCANNED_FILES = ["node_modules/@clerk/localizations/dist/en-US.mjs"]


def parse_ranges(spec: str) -> set[int]:
    chars: set[int] = set()
    for part in spec.split(","):
        lo, _, hi = part.strip().removeprefix("U+").partition("-")
        chars.update(range(int(lo, 16), int(hi or lo, 16) + 1))
    return chars


def format_ranges(chars: set[int]) -> str:
    runs: list[list[int]] = []
    for c in sorted(chars):
        if runs and c == runs[-1][1] + 1:
            runs[-1][1] = c
        else:
            runs.append([c, c])
    return ", ".join(
        f"U+{a:04X}" if a == b else f"U+{a:04X}-{b:04X}" for a, b in runs
    )


def used_characters() -> set[int]:
    paths = {p for pattern in SCANNED for p in ROOT.glob(pattern)}
    paths = sorted(p for p in paths if ".test." not in p.name)
    chars: set[int] = set()
    for path in paths + [ROOT / f for f in SCANNED_FILES]:
        chars.update(ord(c) for c in path.read_text("utf-8") if ord(c) > 0x7E)
    return chars


def fetch(url: str, path: Path, sha256: str | None = None) -> bytes:
    if path.exists():
        data = path.read_bytes()
    else:
        print(f"Downloading {url}")
        with urllib.request.urlopen(url) as response:
            data = response.read()
    if sha256 and hashlib.sha256(data).hexdigest() != sha256:
        sys.exit(f"{url} doesn't match SOURCE_SHA256")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return data


def build(source: bytes, chars: set[int]) -> bytes:
    font = TTFont(io.BytesIO(source))
    options = subset.Options()
    options.layout_features = FEATURES
    options.layout_scripts = ["DFLT", "latn"]
    # Copyright, names, version, and the OFL notice and its URL.
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    options.name_languages = [0x409]
    options.glyph_names = False
    options.hinting = True
    options.drop_tables += ["meta", "STAT"]
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=chars)
    subsetter.subset(font)

    # The instancer trims fvar and the HVAR, MVAR, and GDEF deltas, but it
    # also rewrites gvar with every point's delta rounded, where Geist leaves
    # some points to be interpolated (to fractional positions). So gvar keeps
    # the subset's own deltas, minus those for the 100 master when AXIS
    # starts at 400. That is exact: above 400 the normalized axis doesn't
    # change.
    if AXIS not in ((400, 900), (100, 900)):
        sys.exit("AXIS must be (400, 900) or (100, 900)")
    limited = instancer.instantiateVariableFont(
        font, {"wght": AXIS}, updateFontNames=False
    )
    limited["gvar"].variations = {
        glyph: [v for v in variations if AXIS[0] < 400 or v.axes["wght"][1] > 0]
        for glyph, variations in font["gvar"].variations.items()
    }
    # Browsers don't use named instances, or the names only they refer to.
    limited["fvar"].instances = []
    axis_names = {axis.axisNameID for axis in limited["fvar"].axes}
    limited["name"].names = [
        n for n in limited["name"].names if n.nameID < 256 or n.nameID in axis_names
    ]
    limited.flavor = "woff2"
    # Keep head.modified, so a rerun writes the same bytes.
    limited.recalcTimestamp = False
    out = io.BytesIO()
    limited.save(out)
    return out.getvalue()


def hb_font(data: bytes, unicode_range: set[int] | None = None) -> hb.Font:
    """The font for HarfBuzz. With a unicode-range, characters outside it
    have no glyph, as when Chrome shapes with an @font-face."""
    font = TTFont(io.BytesIO(data))
    font.flavor = None
    if unicode_range is not None:
        for table in font["cmap"].tables:
            table.cmap = {c: g for c, g in table.cmap.items() if c in unicode_range}
    out = io.BytesIO()
    font.save(out)
    return hb.Font(hb.Face(hb.Blob(out.getvalue())))


def shape(font: hb.Font, text: str, features: dict, outlines: dict) -> list:
    """Each glyph's position and outline points. `outlines` caches points by
    glyph, for the font's current weight."""
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    buf.language = "en"
    hb.shape(font, buf, features)
    glyphs = []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        if info.codepoint not in outlines:
            pen = RecordingPen()
            font.draw_glyph_with_pen(info.codepoint, pen)
            outlines[info.codepoint] = [pt for _, a in pen.value for pt in a]
        glyphs.append(
            ((pos.x_advance, pos.x_offset, pos.y_offset), outlines[info.codepoint])
        )
    return glyphs


METRICS = [
    hb.OTMetricsTag.UNDERLINE_OFFSET,
    hb.OTMetricsTag.UNDERLINE_SIZE,
    hb.OTMetricsTag.STRIKEOUT_OFFSET,
    hb.OTMetricsTag.STRIKEOUT_SIZE,
    hb.OTMetricsTag.X_HEIGHT,
    hb.OTMetricsTag.CAP_HEIGHT,
    hb.OTMetricsTag.HORIZONTAL_ASCENDER,
    hb.OTMetricsTag.HORIZONTAL_DESCENDER,
    hb.OTMetricsTag.HORIZONTAL_LINE_GAP,
]


def check(name: str, data: bytes, chars: set[int], source: bytes) -> None:
    """Exits unless the file has exactly the characters, axis, and features
    asked for, and shapes and draws exactly like the source at every weight
    in WEIGHTS: same glyphs, advances, kerning, ligatures, outlines, and
    font-wide metrics."""
    font = TTFont(io.BytesIO(data))
    problems = []
    if set(font.getBestCmap()) != chars:
        problems.append("its cmap isn't the requested characters")
    axes = [(a.axisTag, a.minValue, a.maxValue) for a in font["fvar"].axes]
    if axes != [("wght", *AXIS)]:
        problems.append(f"its axes are {axes}")
    for tag in ("GSUB", "GPOS"):
        records = font[tag].table.FeatureList.FeatureRecord
        extra = {r.FeatureTag for r in records} - set(FEATURES)
        if extra:
            problems.append(f"{tag} has {sorted(extra)}")
    # Under the OFL, a Reserved Font Name would have to change once subset.
    if "Reserved Font Name" in (font["name"].getDebugName(0) or ""):
        problems.append("the copyright reserves a font name; rename the font")

    ours, theirs = hb_font(data), hb_font(source, chars)
    text = [chr(c) for c in sorted(chars)]
    specials = ["->", "<-", "-->", "<--", "--->", "<---", "ff", "fi", "fl",
                "tt", "affluent", "Mosaic — “quotes” … ©", "0123456789"]
    singles = text + [s for s in specials if set(map(ord, s)) <= chars]
    # Every pair, for kerning between any two characters in the file.
    pairs = [a + b for a in text for b in text]
    mismatches = 0
    for weight in WEIGHTS:
        for f in (ours, theirs):
            f.set_variations({"wght": weight})
        for tag in METRICS:
            if ours.get_metric_position(tag) != theirs.get_metric_position(tag):
                problems.append(f"{tag.name} differs at {weight}")
        if ours.get_font_extents("ltr") != theirs.get_font_extents("ltr"):
            problems.append(f"line metrics differ at {weight}")
        cache_ours, cache_theirs = {}, {}
        runs = [(s, f) for s in singles for f in ({}, {"tnum": True})]
        if weight in (WEIGHTS[0], 550, WEIGHTS[-1]):
            runs += [(p, {}) for p in pairs]
        for sample, features in runs:
            a = shape(ours, sample, features, cache_ours)
            b = shape(theirs, sample, features, cache_theirs)
            mismatches += a != b
    if mismatches:
        problems.append(f"{mismatches} runs shape or draw unlike the source")
    if problems:
        sys.exit(f"geist-{name}.woff2: " + "; ".join(problems))
    print(
        f"  geist-{name}.woff2: {len(data):,} bytes, "
        f"{font['maxp'].numGlyphs} glyphs, {len(chars)} characters, "
        "identical to the source"
    )


def cascade(faces: list, codepoints: list[int], start: int = 0) -> list:
    """Shapes text the way Chrome does with a family split by unicode-range:
    the first face shapes it all, each run of characters it has no glyph for
    goes to the next face, and what no face has goes to a system font
    (None). Each face is (hb.Font, outline cache)."""
    if start == len(faces):
        return [None] * len(codepoints)
    font, outlines = faces[start]
    buf = hb.Buffer()
    buf.add_codepoints(codepoints)
    buf.guess_segment_properties()
    buf.language = "en"
    hb.shape(font, buf, {})
    by_cluster: dict[int, list] = {}
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        by_cluster.setdefault(info.cluster, []).append((info.codepoint, pos))
    missing = {c for c, glyphs in by_cluster.items() if any(g == 0 for g, _ in glyphs)}
    result, i = [], 0
    while i < len(codepoints):
        if i in missing:
            # The hole runs to the next cluster this face can draw.
            j = i + 1
            while j < len(codepoints) and (j in missing or j not in by_cluster):
                j += 1
            result += cascade(faces, codepoints[i:j], start + 1)
            i = j
            continue
        for glyph, pos in by_cluster.get(i, []):
            if glyph not in outlines:
                pen = RecordingPen()
                font.draw_glyph_with_pen(glyph, pen)
                outlines[glyph] = [pt for _, a in pen.value for pt in a]
            result.append(((pos.x_advance, pos.x_offset, pos.y_offset), outlines[glyph]))
        i += 1
    return result


def check_cascade(new: list, old: list, chars: set[int]) -> None:
    """Exits unless the new faces, under their unicode-ranges, draw every
    character and every pair of characters like fontsource's faces did, with
    Chrome's fallback between them: same glyphs, positions, and kerning, and
    the same characters left to system fonts."""
    text = sorted(chars)
    samples = [[c] for c in text] + [[a, b] for a in text for b in text]
    mismatches = []
    for weight in (WEIGHTS[0], WEIGHTS[-1]):
        faces = {}
        for key, specs in (("new", new), ("old", old)):
            faces[key] = []
            for data, unicode_range in specs:
                font = hb_font(data, unicode_range)
                font.set_variations({"wght": weight})
                faces[key].append((font, {}))
        for sample in samples:
            if cascade(faces["new"], sample) != cascade(faces["old"], sample):
                mismatches.append("".join(map(chr, sample)))
    if mismatches:
        sys.exit(
            f"{len(mismatches)} texts render unlike the old files with Chrome's "
            f"fallback, e.g. {mismatches[:8]}"
        )
    print(f"  Both files together render {len(samples):,} texts like the old ones")


def main() -> None:
    argparse.ArgumentParser(description=__doc__.split("\n")[0]).parse_args()
    source = fetch(
        SOURCE_URL, CACHE_DIR / f"Geist-{SOURCE_SHA256[:12]}.ttf", SOURCE_SHA256
    )
    supported = set(TTFont(io.BytesIO(source)).getBestCmap())
    old = {name: parse_ranges(spec) for name, spec in OLD_FACES.items()}
    old_latin = old["latin"]
    old_other = set().union(*old.values()) - old_latin

    used = used_characters()
    wanted = (ASCII | LATIN_1 | LATIN_EXT_A | PUNCTUATION | used) & supported
    # Chrome hides characters outside a face's unicode-range from HarfBuzz,
    # which then draws Ā as A plus U+0304 when the face has both. The old
    # latin file did that for ĀāĒēĪīŌōŪū and Ÿ, so the core keeps the marks.
    marks = {
        int(part, 16)
        for c in wanted
        if not unicodedata.decomposition(chr(c)).startswith("<")
        for part in unicodedata.decomposition(chr(c)).split()
    }
    # The old latin file also had ı, Œ, and œ from Latin Extended-A.
    core = (wanted | marks) & old_latin & supported
    extended = wanted & old_other - old_latin
    system = sorted(c for c in used if c not in core | extended)

    print(f"Geist from {SOURCE_URL}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    # The extended face first, as fontsource declared latin-ext before
    # latin. The ranges don't overlap, so the order doesn't matter.
    files = {"extended": extended, "core": core}
    built = {}
    for name, chars in files.items():
        built[name] = build(source, chars)
        check(name, built[name], chars, source)
    check_cascade(
        [(built["core"], core), (built["extended"], extended)],
        [(source, chars & supported) for chars in old.values()],
        wanted,
    )
    for name, data in built.items():
        (OUT_DIR / f"geist-{name}.woff2").write_bytes(data)
    license_text = fetch(LICENSE_URL, CACHE_DIR / f"OFL-{SOURCE_COMMIT[:12]}.txt")
    (OUT_DIR / "OFL.txt").write_bytes(license_text)

    faces = "\n".join(
        f"""@font-face {{
  font-family: "{FAMILY}";
  font-style: normal;
  font-display: swap;
  font-weight: {AXIS[0]} {AXIS[1]};
  src: url("./geist-{name}.woff2") format("woff2-variations");
  unicode-range: {format_ranges(chars)};
}}
"""
        for name, chars in files.items()
    )
    (OUT_DIR / "geist.css").write_text(
        "/* Generated by scripts/subset-fonts.py; rerun it instead of editing.\n"
        "   The core file is preloaded (src/routes/__root.tsx, src/start.ts); the\n"
        "   extended one downloads only for pages with one of its characters. */\n"
        + faces
    )
    # src/lib/fonts.test.ts fails when src/ or Clerk's strings use a
    # character that is in neither file and not listed here.
    manifest = {
        "source": SOURCE_URL,
        "axis": list(AXIS),
        "features": FEATURES,
        "scanned": SCANNED + SCANNED_FILES,
        "systemFonts": "".join(map(chr, system)),
    }
    (OUT_DIR / "geist.json").write_text(json.dumps(manifest, ensure_ascii=False))
    subprocess.run(
        ["bun", "x", "prettier", "--write", "--log-level", "warn",
         "src/styles/fonts/geist.css", "src/styles/fonts/geist.json"],
        cwd=ROOT,
        check=True,
    )
    if system:
        print("Left to system fonts, as before:", " ".join(map(chr, system)))


if __name__ == "__main__":
    main()
