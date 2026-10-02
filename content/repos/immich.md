---
github: immich-app/immich
name: Immich
category: [self-hosted, photos, media]
license: AGPL-3.0
status: active
featured: false
groves: [self-hosted]
alternatives:
  open_source: []
  commercial: [Google Photos, Apple iCloud Photos]
---

# Immich

Self-hosted photo and video backup that mirrors the Google Photos experience on
infrastructure you control.

## What it does
Immich runs a server (plus native iOS/Android apps) that automatically backs up photos
and videos from your phone, then organizes them with the kind of features people expect
from a cloud photo service: a searchable timeline, albums and sharing, machine-learning
face recognition, and natural-language/semantic search over your own library — all
processed on your own hardware rather than a third party's.

## Why people use it
- Automatic background backup from a phone app, not a manual upload workflow
- Face recognition and semantic photo search without sending images to a cloud provider
- A timeline/album UI deliberately close to Google Photos, so the switch doesn't feel
  like a downgrade
- Keeps a personal photo library under the owner's control instead of a vendor's

## Pros
- Feature parity with commercial cloud photo services is unusually complete for a self-hosted project — timeline, albums, sharing, and ML search all work out of the box
- Native mobile apps make day-to-day backup close to automatic, not just a web-upload tool
- Fast release cadence with frequent, visible feature and bug-fix updates

## Cons
- Face recognition and smart search are compute-heavy; a smooth experience benefits from a GPU or a reasonably capable server, unlike most lightweight self-hosted apps
- AGPL-3.0 licensing means a company wanting to host or resell it commercially without AGPL's copyleft obligations needs to buy a separate license from the Immich team
- Built around the mobile-backup workflow first — someone who only wants a simple web-upload photo library has lighter-weight options

## Alternatives
No open-source alternative in RepoGrove's catalog yet.
**Commercial:** Google Photos, Apple iCloud Photos.

## Related Grove
[Self-Hosted](/grove/self-hosted)
