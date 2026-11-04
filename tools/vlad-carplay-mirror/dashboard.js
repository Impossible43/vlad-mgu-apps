// SPDX-License-Identifier: MIT
'use strict';

// Dashboard's dock button is a 3x3 app grid. Fullscreen apps and the launcher
// show the split-Dashboard button instead. Match its geometry in either polarity
// (white dots, or dark holes in a white disc), independently of the card theme.
function luma(img, x, y) {
    x = Math.max(0, Math.min(img.width - 1, Math.round(x)));
    y = Math.max(0, Math.min(img.height - 1, Math.round(y)));
    const i = (y * img.width + x) * img.channels, d = img.data;
    return img.bgr ? .114*d[i] + .587*d[i+1] + .299*d[i+2]
        : .299*d[i] + .587*d[i+1] + .114*d[i+2];
}

function gridButton(img) {
    const w = img.width, h = img.height;
    let best = {score: 0, contrast: 0, x: 0, y: 0, span: 0};
    if (w < 320 || h < 200) return best;
    const step = Math.max(2, Math.round(h / 240));
    const samples = new Array(25);
    for (let span = h*.035; span <= h*.105; span += step) {
        for (let y = h*.86; y <= h*.955; y += step) {
            for (let x = w*.018; x <= w*.070; x += step) {
                let on = 0, off = 0, k = 0;
                for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < 5; gx++) {
                    const v = luma(img, x + (gx/4-.5)*span, y + (gy/4-.5)*span);
                    samples[k++] = v;
                    if (!(gx % 2) && !(gy % 2)) on += v; else off += v;
                }
                on /= 9; off /= 16;
                const contrast = Math.abs(on-off);
                if (contrast < 30) continue;
                const sign = on > off ? 1 : -1;
                let goodOn = 0, goodOff = 0;
                k = 0;
                for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < 5; gx++) {
                    const v = samples[k++];
                    if (!(gx % 2) && !(gy % 2)) {
                        if (sign*(v-off) > contrast*.45) goodOn++;
                    } else if (sign*(on-v) > contrast*.45) goodOff++;
                }
                const score = Math.min(goodOn/9, goodOff/16);
                if (score > best.score || (score === best.score && contrast > best.contrast))
                    best = {score, contrast, x, y, span};
            }
        }
    }
    return best;
}

function detect(img) {
    const grid = gridButton(img);
    let coloured = 0, n = 0;
    const d = img.data;
    // A launcher icon alone is insufficient: require coloured road/map detail.
    for (let y = .12; y < .82; y += .035) for (let x = .12; x < .59; x += .025) {
        const i = (Math.floor(y*img.height)*img.width + Math.floor(x*img.width))*img.channels;
        if (Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2]) > 28) coloured++;
        n++;
    }
    const map = coloured/n;
    return {dashboard: grid.score >= .94 && map >= .015, grid: grid.score, contrast: grid.contrast, map};
}

// Crop only inside the left map card; discard the dock, right cards, top/bottom
// borders and the ETA strip. Fractions are independent of raw-capture resolution.
function crop(img, profile) {
    const p = profile === 'large' ? [.13,.15,.59,.80] : [.092,.025,.630,.82];
    return {x: Math.round(img.width*p[0]), y: Math.round(img.height*p[1]),
        w: Math.round(img.width*(p[2]-p[0])), h: Math.round(img.height*(p[3]-p[1]))};
}

module.exports = {detect, gridButton, crop};
