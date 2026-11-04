// SPDX-License-Identifier: MIT
'use strict';
function make(kind, theme, polarity, w, h) {
    w = w || 960; h = h || 360;
    const data = Buffer.alloc(w*h*4);
    const img = {width: w, height: h, channels: 4, data, bgr: true};
    function rect(x,y,rw,rh,c) {
        for (let yy=Math.max(0,Math.round(y)); yy<Math.min(h,Math.round(y+rh)); yy++)
            for (let xx=Math.max(0,Math.round(x)); xx<Math.min(w,Math.round(x+rw)); xx++) {
                const i=(yy*w+xx)*4; data[i]=c[2];data[i+1]=c[1];data[i+2]=c[0];data[i+3]=255;
            }
    }
    rect(0,0,w,h,theme === 'red' ? [110,20,45] : [30,30,30]);
    if (kind === 'dashboard' || kind === 'waze') {
        rect(w*.09,0,w*(kind==='waze'?.91:.55),h,[35,55,85]);
        for(let n=0;n<7;n++) rect(w*(.13+n*.065),h*.14,w*.004,h*.65,[50,95,145]);
    } else if (kind === 'spotify') {
        rect(w*.12,h*.16,w*.32,h*.65,[60,130,60]);
        rect(w*.49,h*.25,w*.33,h*.025,[230,230,230]);
    } else if (kind === 'launcher') {
        for(let n=0;n<6;n++) rect(w*(.15+n%3*.23),h*(.18+Math.floor(n/3)*.4),w*.08,h*.15,[30,140,90]);
    }
    const cx=w*.043, cy=h*.9, span=h*.06, dot=span*.20;
    const bg=polarity==='dark'?[235,235,235]:[30,30,30];
    const fg=polarity==='dark'?[25,25,25]:[235,235,235];
    rect(cx-span*.85,cy-span*.85,span*1.7,span*1.7,bg);
    if(kind==='dashboard') {
        for(let y=0;y<3;y++)for(let x=0;x<3;x++)
            rect(cx+(x-1)*span/2-dot/2,cy+(y-1)*span/2-dot/2,dot,dot,fg);
    } else {
        // Fullscreen apps and launcher: the 3-panel Dashboard button.
        rect(cx-span*.5,cy-span*.5,span*.4,span*.4,fg);
        rect(cx-span*.5,cy+span*.1,span*.4,span*.4,fg);
        rect(cx+span*.1,cy-span*.5,span*.4,span,fg);
    }
    return img;
}
module.exports = {make};
