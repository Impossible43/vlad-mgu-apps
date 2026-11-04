# Offline validation — 2026-11-04

Passed with the upstream MGU Store source checkout:

- `repoCatalog`: discovers app and companion service with no skipped components.
- `packComponent`: creates deterministic source/tool archives with valid per-file SHA-256 hashes.
- Source app links against upstream Store's synthetic donor. No BMW SDK was used or saved.
- All JavaScript source passes syntax checking.
- Real producer, mocked vehicle/renderer: hidden output and zero capture at startup, explicit enable,
  Dashboard frame delivery, output handback and zero capture in BMW menus, disabled state retained when CarPlay returns.

Commands for developers with a checkout of `robertnisipeanu/mgu-store`:

```sh
node tests/runtime.js
MGU_STORE_PATH=/path/to/mgu-store node tests/store.js
```

No real-vehicle or BMW emulator validation has been performed. This is an experimental source ready for publication and subsequent compatibility checks, not a vehicle-certified release.
