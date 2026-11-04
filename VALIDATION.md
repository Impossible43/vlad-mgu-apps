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

Version 0.1.0 was exercised by the owner on an X3 G01: capture and output worked, while coloured Dashboard cards were rejected and fullscreen Waze was magnified. Version 0.1.1 adds manual Dashboard mode and contain scaling. Offline regression tests cover the coloured-card rejection/manual override, settings/status protocol, BMW menu handback in manual mode, and full-height map retention with neutral black margins. These changes still require confirmation in the owner’s vehicle. No BMW emulator validation was performed.
