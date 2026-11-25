# ALYZ BUILD

Web app Flutter / HTML to Android APK using Vercel Serverless Functions + GitHub Actions.

## 1. GitHub repository
1. Create a **private** or public GitHub repository for this project.
2. Upload all files in this folder, including `.github/workflows/build.yml`.
3. In repository Settings → Actions → General, allow GitHub Actions.
4. Create a fine-grained Personal Access Token with access to this repository:
   - Contents: Read and write
   - Actions: Read and write
   - Metadata: Read
   - Releases: Read and write (for release asset publishing)
5. Ensure workflow permissions allow read/write contents.

## 2. Vercel deployment
Import this repository into Vercel. Add these Environment Variables (Production + Preview as desired):

| Variable | Value |
|---|---|
| `GITHUB_TOKEN` | Fine-grained token from step 4 |
| `GITHUB_OWNER` | GitHub username or organization |
| `GITHUB_REPO` | Repository name |
| `GITHUB_BASE_BRANCH` | `main` (or your default branch) |

Deploy. Do not put the GitHub token in HTML, JavaScript, or any public environment variable.

## 3. Upload rules
- Flutter: ZIP containing a Flutter project and `pubspec.yaml`. The ZIP may have one enclosing folder.
- HTML: a standalone `.html` file, or ZIP containing `index.html` plus its CSS/JS/assets. For ZIPs, assets should be relative to the `index.html` directory.
- Upload limit in this starter: 45 MB.

## 4. Build results
GitHub Actions builds the APK. The workflow also publishes a GitHub Release named `alyz-JOB_ID`; Vercel's download endpoint streams the APK to the browser. The build page polls the Actions run status.

## Important limitations / production hardening
- This starter commits each uploaded archive to a dedicated branch in the configured build repository. Set repository retention/cleanup policies and consider a private build repository for user uploads.
- The current UI shows workflow state and run URL, but not raw compiler logs. Exact compiler diagnostics are available in GitHub Actions → the relevant run. A production version should add authenticated log retrieval and a job ownership/session mechanism.
- Vercel request body limits may be lower than 45 MB depending on plan/runtime. For larger uploads, use object storage (e.g. Vercel Blob or S3 presigned uploads) instead of JSON/base64.
- Add abuse protection (rate limits, authentication, quotas, malware scanning) before making this public. Untrusted Flutter projects execute build scripts during CI; isolate runners and never use privileged/self-hosted runners.
- The HTML pipeline uses Capacitor Android WebView and includes Android INTERNET permission through the generated Android manifest. It does not add Chrome browser controls.
- The workflow currently uses a fixed application ID `com.alyzbuild.webapp`; change it if you need unique app identities/signing.
- APKs produced here are unsigned debug APKs for HTML and release-mode APKs for Flutter. Configure Android signing secrets for production distribution.
