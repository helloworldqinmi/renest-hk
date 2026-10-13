# ReNest HK delivery package

This directory contains the selected presentation assets for review. File names and delivery documentation are in English. Media are kept outside `public/` so the website does not ship the presentation package as runtime content.

## Main film — download for local playback

- [Download MP4 — v1.11.1, 1080p60, 74.1 MiB](demo-film/renest-hk-demo-v1.11.1-1080p60.mp4?raw=true)
- [Download English subtitles](demo-film/renest-hk-demo-v1.11.1-en.srt?raw=true)
- [Release notes](demo-film/release-notes.md)
- [Original production verification](demo-film/verification.json)

Duration: **3 minutes 43 seconds**. Resolution: **1920 × 1080**, **60 fps**. The film has English narration.

GitHub's file page does not preview this large MP4. Download it and open it in a local media player. If a link opens the file page instead, use **Download raw file** (the download icon beside **Raw**). A local clone also includes the film at the path above. Access to a private repository is required to download its files.

For a browser-based review without downloading media, [open the interactive application](https://renest-hk.vercel.app/).

The selected film is the v1.11.1 polished export identified by the existing presentation notes and production checksum. Its bytes are unchanged. Earlier cuts, silent picture masters and intermediate renders remain in the ignored local production workspace; they are not alternative submission files.

## Presentation clips

The [five short clips](presentation-clips/README.md) provide separate feature demonstrations for a slide presentation. They have no narration, music or added subtitles. No PowerPoint deck is included in this package.

## Integrity and scope

Run `npm run check:delivery` from the repository root. [manifest.json](manifest.json) records byte counts and SHA-256 hashes. The film's hash is also checked against the preserved production report.

The verification JSON files are historical production evidence. The repository check validates the files and checksums; it does not rerun the original visual, loudness or QR-code review.

The film contains illustrative storytelling, including proposed service and community scenarios. Refer to [product scope](../docs/product-scope.md) for the capabilities implemented by the application.
