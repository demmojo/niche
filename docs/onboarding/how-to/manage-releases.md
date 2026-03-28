# How To: Manage Releases & Versioning

Releases in this repository are heavily automated using CI/CD pipelines and `semantic-release`. The goal of this guide is to explain the rules governing these automatic releases, and how to safely trigger a Major release manually.

## 1. Automated Semantic Versioning

When your branch is merged into `main` using **Squash and Merge**, the CI pipeline reads the final commit message to determine the next version bump.

Here is the exact mapping:

| Commit Type | Action Triggered  | Example Bump  |
| ----------- | ----------------- | ------------- |
| `fix: ...`  | **Patch** Release | 1.0.0 → 1.0.1 |
| `feat: ...` | **Minor** Release | 1.0.0 → 1.1.0 |
| `perf: ...` | **Patch** Release | 1.0.0 → 1.0.1 |

> ⚠️ **Breaking Changes Downgrade Rule**
> Under normal Semantic Versioning, adding `!` (e.g., `feat!: rewrite API`) triggers a Major version bump. However, to ensure production stability and avoid accidental major releases, our `semantic-release` configuration intentionally downgrades breaking changes to **Minor** bumps on automated runs.

## 2. How to Increment a Major Version

Major versions (e.g., v1.x.x → v2.0.0) are strictly controlled and require manual developer intervention to protect the `main` branch history and changelog.

To perform a major release, you must trigger the manual GitHub Actions workflow:

1. Go to your repository on GitHub.
2. Navigate to the **Actions** tab.
3. Select the **Release** (or `ci.yml`) workflow from the left sidebar.
4. Click the **Run workflow** dropdown on the right side.
5. In the form, select `Major` for the **Release Type** input.
6. Click **Run workflow**.

### What happens next?

The CI pipeline will start up. It will recognize the manual input, bypass the standard `minor` downgrade rule for this specific run, automatically bump `package.json` to the next major version, generate the associated changelog, and securely push the `v2.0.0` (or appropriate) tag back to `main`.
