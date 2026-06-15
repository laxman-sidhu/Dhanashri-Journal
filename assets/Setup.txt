# Dhanashri Journal

A static, aesthetic journal site. Public pages are read-only; stories are written
in the private editor (admin.html) and published straight to this repo via the GitHub API.

## URLs (after setup)
- Homepage : https://laxman-sidhu.github.io/Dhanashri-Journal/
- Editor   : https://laxman-sidhu.github.io/Dhanashri-Journal/admin.html

## One-time setup
1. Create a repo named exactly `Dhanashri-Journal` (public).
2. Upload all these files keeping the folder structure:
   index.html, story.html, admin.html, README.md
   assets/style.css, assets/core.js
   data/index.json   (and an empty data/posts/ folder is created automatically on first publish)
3. Repo > Settings > Pages > Source: "Deploy from a branch", branch `main`, folder `/ (root)`. Save.
   Wait ~1 minute for the first build.
4. Create the publishing key (do this once):
   GitHub > Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate new token
   - Resource owner: laxman-sidhu
   - Repository access: Only select repositories > Dhanashri-Journal
   - Permissions > Repository permissions > Contents: Read and write
   Copy the token (starts with github_pat_...).
5. Open the editor, click the gear (settings), paste the token, Save. Done.

## How data is stored
- data/index.json        = list of all stories (id, title, date, small thumbnail)
- data/posts/<id>.json   = one complete story (text, layout, photos embedded, multiple pages)
The editor commits these files through the GitHub API when you press Publish.

## Notes
- The token lives only in your browser (localStorage). It is never written into any file.
- If the token leaks, revoke it in GitHub settings and make a new one.
- To rename the repo/user, edit CONFIG at the top of assets/core.js.
