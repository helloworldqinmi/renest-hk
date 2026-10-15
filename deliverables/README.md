# ReNest HK final presentation package

The final Team 1064 presentation is in **[presentation-redesign/](presentation-redesign/)**. This folder contains the three approved submission files, with their original submission filenames.

| File | Contents |
| --- | --- |
| [1064 - Renest.pptx](presentation-redesign/1064%20-%20Renest.pptx?raw=true) | 13-slide pitch deck with five embedded demonstration videos. |
| [1064 - Renest.mp4](presentation-redesign/1064%20-%20Renest.mp4?raw=true) | Full demonstration with English narration and subtitles. 3 min 29.2 sec, 1920 x 1080, 60 fps. |
| [1064 - Renest - Project Guide.pdf](presentation-redesign/1064%20-%20Renest%20-%20Project%20Guide.pdf?raw=true) | One-page project guide with team information, review instructions, live-demo and source-code links, and QR codes. |

The film is the v1.13 paced export. The presentation and guide were reviewed on 16 October 2026. Start with the deck, watch the full film, then [open the interactive demo](https://renest-hk.vercel.app/) for a hands-on review. Desktop PowerPoint is recommended for embedded video playback. The standalone MP4 can be played separately.

GitHub may show a file page instead of previewing a large video. Use **Download raw file** or the download links above, then open the file locally. The final package is stored outside `public/` and is not served as website runtime content.

## Verification

Run `npm run check:delivery` from the repository root. [manifest.json](manifest.json) identifies the final package and records file sizes and SHA-256 hashes. [final-verification.json](final-verification.json) preserves the selected film's production checks and the final package review results.

The review included PowerPoint rendering, required cover information, all five embedded video files, full film decoding, PDF layout, hyperlinks and QR codes. The repository check validates the saved bytes and filenames; it does not rerun those visual or playback checks.

## Earlier reference materials

The files in [demo-film/](demo-film/release-notes.md) preserve the earlier v1.11.1 film and its production evidence. [presentation-clips/](presentation-clips/README.md) contains earlier standalone feature clips. These are reference materials, not the final submission package. Earlier local deck drafts and editing files remain in the ignored production archive.
