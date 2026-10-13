# ReNest HK delivery package

This directory contains the selected presentation assets for review. File names and delivery documentation are in English. Media are kept outside `public/` so the website does not ship the presentation package as runtime content.

## Main film

- [Demo film — v1.11.1, 1080p60](demo-film/renest-hk-demo-v1.11.1-1080p60.mp4)
- [English subtitles](demo-film/renest-hk-demo-v1.11.1-en.srt)
- [Release notes](demo-film/release-notes.md)
- [Original production verification](demo-film/verification.json)

Duration: **3 minutes 43 seconds**. Resolution: **1920 × 1080**, **60 fps**. The film has English narration. Use a local media player if a repository preview does not play the MP4.

The selected film is the v1.11.1 polished export identified by the existing presentation notes and production checksum. Its bytes are unchanged. Earlier cuts, silent picture masters and intermediate renders remain in the ignored local production workspace; they are not alternative submission files.

## Presentation clips

The [five short clips](presentation-clips/README.md) provide separate feature demonstrations for a slide presentation. They have no narration, music or added subtitles. No PowerPoint deck is included in this package.

## Integrity and scope

Run `npm run check:delivery` from the repository root. [manifest.json](manifest.json) records byte counts and SHA-256 hashes. The film's hash is also checked against the preserved production report.

The verification JSON files are historical production evidence. The repository check validates the files and checksums; it does not rerun the original visual, loudness or QR-code review.

The film contains illustrative storytelling, including proposed service and community scenarios. Refer to [product scope](../docs/product-scope.md) for the capabilities implemented by the application.
