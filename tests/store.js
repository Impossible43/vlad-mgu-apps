// SPDX-License-Identifier: MIT
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const cp = require('child_process');
const root = path.join(__dirname, '..');
const store = path.resolve(process.env.MGU_STORE_PATH || path.join(root, '../upstream-store'));
const sources = require(path.join(store, 'native/mgu-updater/js/sources.js'));
const tar = require(path.join(store, 'native/mgu-updater/js/tar.js'));
const link = require(path.join(store, 'tools/oap_link.js'));
const donor = require(path.join(store, 'tools/test/synthetic_donor.js'));
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
function walk(dir, base) {
    return fs.readdirSync(dir).sort().reduce((out, name) => {
        const p = path.join(dir, name), rel = path.relative(base, p), st = fs.statSync(p);
        return out.concat(st.isDirectory() ? walk(p, base) : [{name: rel, data: fs.readFileSync(p), mode: st.mode}]);
    }, []);
}
async function run() {
    const read = (p) => fs.promises.readFile(path.join(root, p)).catch((e) => {e.missing = e.code === 'ENOENT'; throw e;});
    const catalog = await sources.repoCatalog(read, 'test', 'test');
    assert.deepStrictEqual(catalog.skipped, []);
    assert.strictEqual(catalog.components.length, 2, 'Store discovers app and service');
    const out = path.join(root, 'dist');
    fs.mkdirSync(out, {recursive: true});
    for (const c of catalog.components) {
        const folder = path.join(root, c.path);
        const artifact = sources.packComponent(c, walk(folder, folder));
        assert(artifact.equals(sources.packComponent(c, walk(folder, folder))), 'deterministic package');
        fs.writeFileSync(path.join(out, c.artifact.name), artifact);
        const members = await tar.untgz(artifact, 16 * 1024 * 1024);
        if (c.kind === 'tool') {
            const manifest = JSON.parse(members.find((f) => f.name === 'component.json').data);
            for (const file of manifest.files) {
                const bytes = members.find((f) => f.name === 'files/' + file.path).data;
                assert.strictEqual(file.sha256, sha(bytes), 'file integrity checked by deploy');
            }
            assert.strictEqual(manifest.units.length, 1);
            assert.strictEqual(manifest.dropins, undefined, 'no OEM service override');
        } else {
            assert(members.some((f) => f.name === 'mgu-app.json'));
            assert(!members.some((f) => /node_modules|javascript\/app\.js|runner\.js/.test(f.name)), 'no BMW SDK or generated entry');
            assert(c.requires['vlad-carplay-mirror'], 'dependency installs service first');
        }
        console.log('PASS: Store lists and packs ' + c.id + ', sha256 ' + sha(artifact));
    }
    const appDir = path.join(root, 'apps/vlad_carplay_mirror');
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mgu-mirror-test-'));
    try {
        const donorFile = donor.tgz(path.join(temp, 'synthetic-donor.tgz'), {main: './javascript/entry.js'});
        const built = link.build(appDir, path.join(temp, 'synthetic-app.tgz'), {donors: [donorFile]});
        assert(built.moduleCount >= 2, 'SDK linker resolves both control app modules');
        console.log('PASS: app links against the Store synthetic SDK donor (not a BMW SDK)');
    } finally { fs.rmSync(temp, {recursive: true, force: true}); }
    for (const file of walk(root, root).filter((f) => f.name.endsWith('.js'))) {
        const check = cp.spawnSync(process.execPath, ['--check', path.join(root, file.name)], {encoding: 'utf8'});
        assert.strictEqual(check.status, 0, check.stderr);
    }
    console.log('PASS: JavaScript syntax');
}
run().catch((e) => {console.error(e.stack); process.exitCode = 1;});
