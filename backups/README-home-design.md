# Home design revert guide

The app supports two home screen layouts:

| Layout | How it works |
|--------|----------------|
| **Apple** (default) | Loads `design/home-apple.css` when `html[data-home-design="apple"]` |
| **Classic** | Original Figma/warm design from `styles.css` only |

## Revert to classic

**Option A — Settings (easiest)**  
Open **Settings** → **Home layout** → choose **Classic**.

**Option B — Remove the stylesheet**  
In `index.html`, remove or comment out:

```html
<link rel="stylesheet" href="design/home-apple.css?v=1" />
```

**Option C — localStorage**  
In the browser console:

```js
localStorage.setItem("priority-grid-home-design", "classic");
location.reload();
```

## Classic CSS snapshot

`backups/home-design-classic.css` is a read-only copy of the original home + sidebar styles (extracted from `styles.css` before the Apple redesign). It is for reference only; you do not need to load it to revert—classic is the default when the Apple overlay is off.
