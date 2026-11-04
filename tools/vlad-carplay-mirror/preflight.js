// SPDX-License-Identifier: MIT
'use strict';
const fs = require('fs');
const cp = require('child_process');
function check() {
    if (cp.spawnSync('/bin/sh', ['-c', 'command -v winston-grabber'], { encoding: 'utf8' }).status !== 0)
        throw new Error('winston-grabber is unavailable on this MGU; mirror was not activated');
    fs.accessSync('/usr/lib/someip.node', fs.constants.R_OK);
    fs.accessSync('/var/opt/cluster-render/current/cluster-render', fs.constants.X_OK);
    console.log(JSON.stringify({status: 'Mirror installed; restart the head unit, then open CarPlay Map Mirror to enable it'}));
}
if (require.main === module) {
    try { check(); } catch (e) { console.error(e.message); process.exitCode = 1; }
}
module.exports = {check};
