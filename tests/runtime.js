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
    const shot = Buffer.alloc(4 * 4 * 4, 100);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 2; x++) {
        const i = (y * 4 + x) * 4;
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
        argv: ['node', 'carplay-map-cluster.js', '--start-disabled', '--gate-initial', 'menu', '--fps', '6', '--cap-size', '4x4', '--crop', '0,0,4,4'],
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
    subscriptions.onScreenChange('NATIVE');
    tick();
    assert.strictEqual(captures, 1, 'BMW menu does not capture or overwrite its map');
    assert.strictEqual(client.updates[client.updates.length - 1].visible, false);
    socket.emit('data', Buffer.from('{"cmd":"disable"}\n'));
    subscriptions.onScreenChange('PROJECTED');
    tick();
    assert.strictEqual(captures, 1, 'disable remains effective when CarPlay returns');
    assert.strictEqual(writes[writes.length - 1].enabled, false);
    console.log('PASS: default-off, explicit enable, Dashboard output, BMW-menu handback, disable');
}
run().catch((e) => { console.error(e.stack); process.exitCode = 1; });
