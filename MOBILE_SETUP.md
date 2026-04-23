# Mobile Build Setup (GitHub + Expo EAS)

## 1) Connect this repo to your new GitHub repo

If you want this exact project in `aiappbuilder`:

```bash
git remote set-url origin https://github.com/nmkrishh/aiappbuilder.git
```

## 2) Create EAS project ID

From `mobile/` run locally once:

```bash
npm install
npx expo login
npx eas init
```

Copy the generated project ID into:

- `mobile/app.json` -> `expo.extra.eas.projectId`

## 3) Add GitHub secret

In your GitHub repo:

- Settings -> Secrets and variables -> Actions -> New repository secret
- Name: `EXPO_TOKEN`
- Value: your Expo access token (`npx expo token:create`)

## 4) Trigger builds

Workflow file:

- `.github/workflows/android-eas-build.yml`

Run manually from Actions tab and choose profile:

- `preview` -> APK (installable demo)
- `production` -> AAB (Play Store)

## 5) Download build

The workflow logs include EAS build links where APK/AAB files can be downloaded.