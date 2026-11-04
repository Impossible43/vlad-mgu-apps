// SPDX-License-Identifier: MIT
'use strict';
const assert=require('assert');
const d=require('../tools/vlad-carplay-mirror/dashboard');
const {make}=require('./frames');
for(const theme of ['red','grey']) for(const polarity of ['dark','light']) {
    for(const size of [[960,360],[1920,720],[1280,480]]) {
        const img=make('dashboard',theme,polarity,...size);
        assert(d.detect(img).dashboard, 'Dashboard accepted: '+[theme,polarity,size]);
    }
    for(const kind of ['spotify','waze','launcher']) {
        const img=make(kind,theme,polarity);
        assert(!d.detect(img).dashboard, kind+' must not be mirrored: '+[theme,polarity]);
    }
}
const blank=make('dashboard','red','dark');blank.data.fill(100);
assert(!d.detect(blank).dashboard,'blank frame must hide');
const raw=make('dashboard','red','dark');
const c=d.crop(raw,'balanced');
assert(c.x>=raw.width*.09 && c.x+c.w<=raw.width*.64, 'crop excludes dock and right music cards');
assert(c.y+c.h<raw.height*.88,'crop excludes ETA strip');
assert(d.crop(raw,'large').w<c.w,'larger-details profile uses a tighter crop');
console.log('PASS: Dashboard grid in both polarities, red/grey themes, 3 resolutions; Spotify/full Waze/launcher rejected; crop boundaries');

const Control=require('../apps/vlad_carplay_mirror/src/control').MapToggleControl;
const ctl=new Control();const sent=[];ctl.ctl.send=m=>sent.push(m);
ctl.status={enabled:false,layout:'manual',fit:'contain'};
ctl.enable();ctl.toggleFit();assert.strictEqual(sent.length,0,'new UI cannot enable an old unfiltered service');
ctl.status.enabled=true;ctl.disable();assert.strictEqual(sent.pop().cmd,'disable','old service can still be disabled');
ctl.status={enabled:false,layout:'auto',profile:'balanced'};
ctl.enable();ctl.toggleFit();assert.deepStrictEqual(sent,[{cmd:'enable'},{cmd:'view-overview'}]);
console.log('PASS: partial-update compatibility guard and view-control protocol');
