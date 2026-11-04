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

The default **Map size: fit whole map** preserves the entire Dashboard crop with margins instead of zooming/cropping it. The size button can select the older fill/crop behaviour. The last capture, layout result, sent-frame count and renderer connection remain visible in the control app for diagnosis.

The mirror starts **off after every head-unit boot**. Enable it in the app when wanted.
Closing the control app leaves an enabled mirror running. **Disable map mirror** returns the map slot.
To remove it, remove the app and then **CarPlay Map Mirror service** in Store.

## Limits and verification

- Upstream reports success on a G20 with firmware G_20w28.3 and CarPlay 0.20.20.
- Version 0.1.0 was tried on an X3 G01: capture and cluster output worked, but automatic layout detection and scaling were incorrect. Version 0.1.1 corrects these paths offline; its layout still needs confirmation on that vehicle. No BMW emulator validation was performed.
- The default is **Layout: Dashboard (manual)**. Keep Dashboard open: the manual mode crops the same map region from any visible CarPlay screen. Returning to BMW menus still hides the mirror. Automatic layout detection is optional and can reject coloured card themes or accept some fullscreen maps.
- Capture assumes a 1920×720 centre surface and a high cluster map slot of 1088×480. Other display layouts may need calibration.
- The upstream service targets about 6 fps. This is a screen mirror, not a replacement for a current native CarPlay implementation.
- The service checks capture/native-library/renderer prerequisites during install. Missing prerequisites refuse activation.
- Store package discovery, source packaging, protocol controls, and default-off capture behaviour are checked offline.
- No firmware binaries, BMW SDK, root keys, VINs, tokens or diagnostic logs are included.

Do not enable this mirror and another app claiming the same map slot simultaneously.

## Source and licences

See [THIRD_PARTY.md](THIRD_PARTY.md) and `LICENSES/`. Source components are pinned to the commits listed there.
The companion app links BMW's SDK already present on the owner's MGU at installation time.
