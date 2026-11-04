# Source attribution

- Map producer and companion app: Isaak, https://github.com/isaakbruno2/carplay-map-cluster/tree/2ab4318d6fcc981ffc647597ae91c7d6405de4ec.
  Producer and service carry MPL-2.0 notices; app source carries GPL-3.0-or-later notices.
  The upstream top-level licence describes MPL-2.0 for its code. Original notices are preserved;
  this distribution conservatively includes both licences and the complete source.
- ClusterRender JavaScript client: Copyright (C) 2026 Robert Nisipeanu, MPL-2.0,
  https://github.com/robertnisipeanu/idrive-apps/blob/96a306dbcda5effe1089e26e890c0382b891c061/native/cluster-render/js/cluster_render_client.js.
  This is public client source, not BMW firmware or an SDK.
- New packaging, preflight, tests and service definition: MIT.

Local adaptations: unique app/service/socket identities; English controls; Store manifest and dependencies;
hidden initial layer; default-off startup; bounded service restarts; installation prerequisite checks.

Version 0.1.1 adds manual Dashboard selection, contain scaling for YUV video, and control-app diagnostics/settings.
