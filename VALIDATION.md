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

## Version 0.1.2

- Grid detector tests: red/grey cards, dark/light grid polarity, 960×360, 1280×480 and 1920×720 synthetic captures.
- Negative cases: Spotify, fullscreen Waze, app launcher and blank captures. Legacy manual-bypass commands cannot disable detection.
- Real producer with mocked interfaces: Dashboard → Spotify → full map → launcher → Dashboard; rejected frames are never sent, Dashboard resumes without another enable press.
- Native-screen change during pending capture: output hides immediately and the late frame is discarded. Disable/BMW-menu handback and default-off remain covered.
- Crop bounds exclude the dock, right cards and ETA; view profile/status covered.
- A perspective-corrected copy of the owner's red-theme Dashboard photo matched the detector; this checks geometry on a photographed frame, not actual raw capture. No user photos are published in this repository.
- Camera photographs are insufficient to prove all real CarPlay transitions. Version 0.1.2 still needs in-car confirmation; slot-arbitration delay is outside this producer's control.

Run `node tests/dashboard.js`, `node tests/runtime.js`, `node tests/store.js`.

## Version 0.1.3

The owner confirmed More map still hides labels at the edges of the full map layer. Fit cluster therefore places the entire crop inside the upstream patch's advertised UI safe rectangle instead of filling the video layer. Offline tests check containment/aspect ratio, identical per-pixel RGBA/YUV placement and black/neutral margins, migration from the owner's legacy More map preference, and persistence of schema-2 choices. Existing Dashboard/Spotify transitions still pass. The safe rectangle is a reference geometry, not a measurement of this owner's particular cluster; real-car display confirmation remains necessary.
