# Verify GangtokGangsters
The Char Dham - atmospheric pilgrimage experience (plain static site).
## Launch
Serve the repo root over plain HTTP; everything is static.
## Doctor
`python3 .cursor/skills/verify-gangtok-gangsters/verify.py`
## Drive
Serves the app, renders it in headless Chromium, asserts the boot markers plus zero JS console errors. External-network content neutralized via host-resolver rules. Then drives the guided tour at 390px (start auto tour, Next pauses into manual stepping, Prev steps back, Auto resumes, Finish ends the session) via tour-journey.mjs when puppeteer-core is available (set VERIFY_DEPS to a dir with node_modules); skipped with a note otherwise.
## Evidence
`.cursor/skills/verify-gangtok-gangsters/evidence.json`
## Cleanup
No daemons left running.
## Known boundaries
Proves local boot and console cleanliness, not third-party services.
