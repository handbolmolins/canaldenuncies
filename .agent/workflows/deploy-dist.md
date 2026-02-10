---
description: Build the application and deploy the contents of the dist folder to the main branch of the GitHub repository.
---

This workflow has been simplified. Now, every time you push the source code to the `main` branch, GitHub Actions automatically builds and deploys the website.

1. Commit and push your changes:
   `git add .`
   `git commit -m "Your descriptive message"`
   `git push origin main`

2. Alternatively, use the included shortcut script:
   Run `push.bat` from the root folder.

3. Verify the deployment:
   The website will update automatically in a few minutes at:
   https://handbolmolins.github.io/canaldenuncies/

Note: You no longer need to manually build or force-push the `dist` folder.

