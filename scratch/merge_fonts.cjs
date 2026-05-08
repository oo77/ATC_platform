const opentype = require('opentype.js');
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function woffToSfnt(woffBuf) {
    const total = woffBuf.readUInt32BE(16), n = woffBuf.readUInt16BE(12);
    const out = Buffer.alloc(total);
    out.writeUInt32BE(woffBuf.readUInt32BE(4), 0); out.writeUInt16BE(n, 4);
    let cur = 12 + n * 16;
    for(let i=0; i<n; i++) {
        const e = 44 + i * 20, tag = woffBuf.slice(e, e+4);
        const off = woffBuf.readUInt32BE(e+4), comp = woffBuf.readUInt32BE(e+8), orig = woffBuf.readUInt32BE(e+12);
        const chk = woffBuf.readUInt32BE(e+16);
        let data;
        if (comp < orig) { try { data = zlib.inflateRawSync(woffBuf.slice(off, off+comp)); } catch(_) { data = zlib.inflateSync(woffBuf.slice(off, off+comp)); } }
        else { data = woffBuf.slice(off, off+orig); }
        data.copy(out, cur);
        const se = 12 + i * 16;
        tag.copy(out, se); out.writeUInt32BE(chk, se+4); out.writeUInt32BE(cur, se+8); out.writeUInt32BE(orig, se+12);
        cur += (orig + 3) & ~3;
    }
    return out;
}

function loadFont(p) {
    const b = woffToSfnt(fs.readFileSync(p));
    return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}

function buildMerged(latinP, cyrP, outTtf, outTs, exportName, style) {
    console.log('Merging', style);
    const L = loadFont(latinP);
    const C = loadFont(cyrP);
    const glyphs = [];

    // Базовые глифы из латиницы
    for (let i = 0; i < L.numGlyphs; i++) {
        glyphs.push(L.glyphs.get(i));
    }

    // Добавляем кириллицу
    let added = 0;
    for (let i = 1; i < C.numGlyphs; i++) {
        const g = C.glyphs.get(i);
        if (!g.unicodes || !g.unicodes.length) continue;
        const u = g.unicodes[0];
        
        if (L.charToGlyphIndex(String.fromCodePoint(u)) === 0) {
            const newGlyph = new opentype.Glyph({
                name: g.name,
                unicode: u,
                unicodes: [u],
                advanceWidth: g.advanceWidth,
                path: g.path
            });
            glyphs.push(newGlyph);
            added++;
        }
    }

    console.log('  Latin:', L.numGlyphs, '+Cyr:', added, 'Total:', glyphs.length);

    const merged = new opentype.Font({
        familyName: 'Montserrat',
        styleName: style,
        unitsPerEm: L.unitsPerEm,
        ascender: L.ascender,
        descender: L.descender,
        glyphs: glyphs
    });

    const buf = Buffer.from(merged.toArrayBuffer());
    fs.writeFileSync(outTtf, buf);
    const b64 = buf.toString('base64');
    fs.writeFileSync(outTs, '// Auto-generated\nexport const ' + exportName + ' = \'' + b64 + '\';\n');
}

const src = 'D:/Projects/ATC_platform/node_modules/@fontsource/montserrat/files/';
const out = 'D:/Projects/ATC_platform/public/fonts/';
const ts = 'D:/Projects/ATC_platform/app/assets/fonts/';

buildMerged(src+'montserrat-latin-400-normal.woff', src+'montserrat-cyrillic-400-normal.woff', out+'Montserrat-Regular.ttf', ts+'montserrat-regular.ts', 'MontserratRegular', 'Regular');
buildMerged(src+'montserrat-latin-700-normal.woff', src+'montserrat-cyrillic-700-normal.woff', out+'Montserrat-Bold.ttf', ts+'montserrat-bold.ts', 'MontserratBold', 'Bold');
console.log('Done!');
