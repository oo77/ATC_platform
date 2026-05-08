const opentype = require('opentype.js');
const fs = require('fs');
const zlib = require('zlib');

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

function patchFont(latinP, cyrP, outTtf, outTs, exportName) {
    console.log('Patching:', outTtf);
    const L = loadFont(latinP);
    const C = loadFont(cyrP);

    let added = 0;
    // Переносим глифы из C в L
    for (let i = 1; i < C.numGlyphs; i++) {
        const glyph = C.glyphs.get(i);
        if (!glyph.unicodes || !glyph.unicodes.length) continue;
        const u = glyph.unicodes[0];
        
        if (L.charToGlyphIndex(String.fromCodePoint(u)) === 0) {
            // Важно: в opentype.js добавление в конец массива и обновление cmap 
            // в существующем объекте шрифта сохраняет другие таблицы (OS/2, post и т.д.)
            const newIndex = L.glyphs.length;
            glyph.index = newIndex;
            L.glyphs.push(glyph);
            
            // Ручное обновление таблицы cmap
            if (L.tables.cmap && L.tables.cmap.unicode) {
                L.tables.cmap.unicode.cmap[u] = newIndex;
            }
            added++;
        }
    }
    L.numGlyphs = L.glyphs.length;
    console.log('  Glyphs added:', added, 'Total:', L.numGlyphs);

    // Сохраняем как полноценный TTF
    const buf = Buffer.from(L.toArrayBuffer());
    fs.writeFileSync(outTtf, buf);
    const b64 = buf.toString('base64');
    fs.writeFileSync(outTs, '// Auto-generated (Patched Montserrat)\nexport const ' + exportName + ' = \'' + b64 + '\';\n');
}

const src = 'D:/Projects/ATC_platform/node_modules/@fontsource/montserrat/files/';
const out = 'D:/Projects/ATC_platform/public/fonts/';
const ts  = 'D:/Projects/ATC_platform/app/assets/fonts/';

patchFont(src+'montserrat-latin-400-normal.woff', src+'montserrat-cyrillic-400-normal.woff', out+'Montserrat-Regular.ttf', ts+'montserrat-regular.ts', 'MontserratRegular');
patchFont(src+'montserrat-latin-700-normal.woff', src+'montserrat-cyrillic-700-normal.woff', out+'Montserrat-Bold.ttf',    ts+'montserrat-bold.ts',    'MontserratBold');
console.log('Done!');
