# Counselling videos

Drop video files in this folder.

## Quick demo

Save one file here as `demo.mp4`. Every counselling topic will play it,
which is enough to demonstrate the flow.

## Per-topic videos

Edit `VIDEO_SOURCES` in `../app.js` and point each topic at its own file:

```js
const VIDEO_SOURCES = {
  "Understanding HIV risk and testing options": "./videos/hiv-risk-testing.mp4",
  "Reducing HIV risk from injecting drug use": "./videos/harm-reduction.mp4",
  // ...
};
```

Any topic with no file, or a file that fails to load, falls back to the
placeholder card automatically — the app will not break.

## Format

- **Container:** MP4 (H.264 video + AAC audio) plays in every browser
- **Resolution:** 720p is plenty; 1080p if the source is already that
- **Size:** keep each file under ~10 MB for the demo

Large media does not belong in git. If a file is more than a few MB, host
it and use the URL in `VIDEO_SOURCES` instead of committing it.
