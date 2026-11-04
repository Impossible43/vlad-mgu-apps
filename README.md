# CarPlay Map Mirror for MGU Store

Experimental Store packaging of [isaakbruno2/carplay-map-cluster](https://github.com/isaakbruno2/carplay-map-cluster).
It mirrors the **Dashboard** map already on the centre screen into an iDrive 7 instrument cluster.
It does not add a second CarPlay video stream and does not patch BMW's CarPlay executable.

## Install from the car

1. Keep the standard sources `robertnisipeanu/mgu-store` and `robertnisipeanu/idrive-apps` enabled and online.
2. Add this repository in **Store → Settings → Add source** and choose **Branch main**.
3. Install **CarPlay Map Mirror**. Store installs the service, cluster renderer and app privacy dependency first.
4. Use **Store → Settings → Restart head unit** when requested.
5. Set **Instrument cluster → Central display area → Map view**.
6. Open **CarPlay Map Mirror** and press **Enable map mirror**.
7. Open CarPlay Dashboard: map on the left, widgets on the right.

Version **0.1.2** is Dashboard-only: the dock's 3×3 app-grid button and map region identify Dashboard, independently of the card colour. A nonmatching frame is never sent; the mirror hides on Spotify, fullscreen maps, the app launcher, BMW menus or capture failures. Returning to Dashboard resumes automatically while enabled. Unknown layouts fail closed. No unfiltered/manual mode is available.

**View** cycles **Balanced**, **More map**, **Larger details**, and saves the choice. Balanced preserves aspect ratio while filling the cluster target; More map keeps the full selected map region by scaling its width and height separately; Larger details uses a tighter crop. The crop excludes the dock, music/turn cards and ETA strip. The stock cluster's gauges and media widgets are still overlaid by BMW; this app does not hide them.

Capture runs serially at up to 6 fps, with no screenshot queue. A rejected layout is checked again after a 200 ms capture cycle; disable and native-screen events hide immediately, including during in-flight capture. Screenshot time and the cluster renderer's slot arbitration add latency: zero-delay switching is not guaranteed. Diagnostics show frame count, capture-cycle time and the map slot state.

The mirror starts **off after every head-unit boot**. Enable it in the app when wanted.
Closing the control app leaves an enabled mirror running. **Disable map mirror** returns the map slot.
To remove it, remove the app and then **CarPlay Map Mirror service** in Store.

## Limits and verification

- Upstream reports success on a G20 with firmware G_20w28.3 and CarPlay 0.20.20.
- Version 0.1.0 was tried on an X3 G01: capture and cluster output worked, but automatic layout detection and scaling were incorrect. Version 0.1.2 corrects layout gating/cropping offline; its behaviour still needs confirmation on that vehicle. No BMW emulator validation was performed.
- Capture assumes a 1920×720 centre surface and a high cluster map slot of 1088×480. Other display layouts may need calibration.
- The upstream service targets about 6 fps. This is a screen mirror, not a replacement for a current native CarPlay implementation.
- The service checks capture/native-library/renderer prerequisites during install. Missing prerequisites refuse activation.
- Store package discovery, source packaging, protocol controls, and default-off capture behaviour are checked offline.
- No firmware binaries, BMW SDK, root keys, VINs, tokens or diagnostic logs are included.

Do not enable this mirror and another app claiming the same map slot simultaneously.

## Source and licences

See [THIRD_PARTY.md](THIRD_PARTY.md) and `LICENSES/`. Source components are pinned to the commits listed there.
The companion app links BMW's SDK already present on the owner's MGU at installation time.
