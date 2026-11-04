// SPDX-License-Identifier: MIT
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const EventEmitter = require('events');

// Run the real producer with fake vehicle/capture/renderer interfaces.
// No vehicle connection, firmware write, system service or screenshot is used.
async function run() {
    const timers = [];
    const subscriptions = {};
    const writes = [];
    let client, accept, captures = 0, frames = 0;
    const shot = Buffer.alloc(32 * 32 * 4, 100);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) {
        const i = (y * 32 + x) * 4;
        shot[i] = 0; shot[i + 1] = 0; shot[i + 2] = 255; shot[i + 3] = 255;
    }
    class Renderer extends EventEmitter {
        constructor() { super(); client = this; this.updates = []; }
        video(options) { this.options = options; return 1; }
        image(options) { this.options = options; return 1; }
        connect() {}
        set(ref, options) { this.updates.push(options); }
        frame() { frames++; }
        close() {}
    }
    const proxy = {
        init: () => Promise.resolve(),
        subscribe: (s) => { subscriptions[s.name] = s.onReceive; },
        getValue: () => Promise.resolve(false)
    };
    const fakeFs = {
        readFileSync: (p) => p === '/etc/group' ? 'tm_oap_app:x:1000:\n' : shot,
        mkdirSync() {}, unlinkSync() {}, chownSync() {}, chmodSync() {}
    };
    const fakeNet = {
        createServer(fn) {
            accept = fn;
            const server = new EventEmitter();
            server.listen = (p, cb) => cb();
            return server;
        }
    };
    const moduleObject = {exports: {}};
    function requireFake(id) {
        if (id === 'fs') return fakeFs;
        if (id === 'net') return fakeNet;
        if (id === './cluster_render_client.js') return {ClusterRender: Renderer};
        if (id === '/usr/lib/someip.node') return {buildProxy: () => Promise.resolve(proxy)};
        if (id === 'child_process') return {execFile: (file, args, options, cb) => {
            captures++; cb(null);
        }};
        return require(id);
    }
    requireFake.main = moduleObject;
    const proc = {
        argv: ['node', 'carplay-map-cluster.js', '--start-disabled', '--gate-initial', 'menu', '--fps', '6', '--cap-size', '32x32', '--crop', '0,0,32,32'],
        env: {}, on() {}, exit(code) { throw new Error('unexpected exit ' + code); }
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../tools/vlad-carplay-mirror/carplay-map-cluster.js'), 'utf8'), {
        require: requireFake, module: moduleObject, Buffer, process: proc,
        console: {log() {}, error() {}}, setTimeout: (fn) => { timers.push(fn); return fn; }, clearTimeout() {}
    });
    for (let i = 0; i < 6; i++) await Promise.resolve();
    const tick = () => { assert(timers.length, 'producer schedules its next tick'); timers.shift()(); };
    const socket = new EventEmitter();
    socket.write = (s) => writes.push(JSON.parse(s));
    accept(socket);
    assert.strictEqual(client.options.visible, false, 'map slot starts hidden');
    assert.strictEqual(writes[0].enabled, false, 'default-off is reported to the real control protocol');
    subscriptions.onScreenChange('PROJECTED');
    tick();
    assert.strictEqual(captures, 0, 'default-off does not capture even when CarPlay is visible');
    socket.emit('data', Buffer.from('{"cmd":"enable"}\n'));
    tick();
    assert.strictEqual(captures, 1, 'explicit enable captures one frame');
    assert.strictEqual(frames, 1, 'Dashboard frame reaches the renderer');
    assert(client.updates.some((u) => u.visible === true), 'explicit enable shows map');
    // Red Dashboard cards reproduce the user's theme: automatic detection rejects it.
    for (let y = 0; y < 32; y++) for (let x = 16; x < 32; x++) {
        const i = (y * 32 + x) * 4;
        shot[i] = 0; shot[i + 1] = 0; shot[i + 2] = 255; shot[i + 3] = 255;
    }
    tick();
    assert.strictEqual(frames, 1, 'automatic detection rejects coloured cards');
    socket.emit('data', Buffer.from('{"cmd":"layout-manual"}\n'));
    socket.emit('data', Buffer.from('{"cmd":"fit-contain"}\n'));
    tick();
    assert.strictEqual(frames, 2, 'manual Dashboard sends coloured-card capture');
    socket.emit('data', Buffer.from('{"cmd":"status"}\n'));
    const status = writes[writes.length - 1];
    assert.strictEqual(status.layout, 'manual');
    assert.strictEqual(status.fit, 'contain');
    assert.strictEqual(status.diagnostics.frames, 2);
    const capturesBeforeMenu = captures;
    subscriptions.onScreenChange('NATIVE');
    tick();
    assert.strictEqual(captures, capturesBeforeMenu, 'BMW menu does not capture or overwrite its map');
    assert.strictEqual(client.updates[client.updates.length - 1].visible, false);
    socket.emit('data', Buffer.from('{"cmd":"disable"}\n'));
    subscriptions.onScreenChange('PROJECTED');
    tick();
    assert.strictEqual(captures, capturesBeforeMenu, 'disable remains effective when CarPlay returns');
    assert.strictEqual(writes[writes.length - 1].enabled, false);
    // A tall map fitted into a wide slot retains its top and bottom, with neutral black margins.
    const img = {width: 4, height: 8, channels: 4, bgr: false, data: Buffer.alloc(4 * 8 * 4)};
    for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) {
        const i = (y * 4 + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 20 + y * 25;
        img.data[i + 3] = 255;
    }
    const opts = {outW: 16, outH: 8, crop: {x: 0, y: 0, w: 4, h: 8}, fit: 'contain', scale: 'nearest'};
    const atlas = moduleObject.exports.processToYUV(img, opts);
    assert.strictEqual(atlas.length, 16 * 8 * 1.5);
    assert.strictEqual(atlas[6], 20, 'top of the source remains visible');
    assert(Math.abs(atlas[7 * 16 + 6] - 195) <= 1, 'bottom of the source remains visible');
    assert.strictEqual(atlas[0], 0, 'margin luma is black');
    assert.strictEqual(atlas[128], 128, 'margin chroma is neutral');
    const cover = moduleObject.exports.processToYUV(img, Object.assign({}, opts, {fit: 'cover'}));
    assert(cover[0] > atlas[6], 'cover crops the source vertically');
    const wide = {outW: 4, outH: 16, crop: {x: 0, y: 0, w: 4, h: 8}, fit: 'contain'};
    const letterbox = moduleObject.exports.processToYUV(img, wide);
    assert.strictEqual(letterbox[0], 0, 'top letterbox is black');
    assert.strictEqual(letterbox[4 * 4], 20, 'map begins below the letterbox');
    console.log('PASS: contain retains full map; neutral pillarbox and letterbox margins');
    console.log('PASS: default-off, explicit enable, Dashboard output, BMW-menu handback, disable');
}
run().catch((e) => { console.error(e.stack); process.exitCode = 1; });
