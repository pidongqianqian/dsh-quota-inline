# Publishing

## First release

1. Create the public repository `pidongqianqian/dsh-quota-inline`, then push this
   directory's contents to `main`. The package name and repository fields in
   `package.json` already point there.
2. Add the GitHub topic `dsh-plugin` (DeepSeek 1024 Store and other indexes
   collect repositories by that topic) and a one-line description.
3. Publish to npm from a tag; the release workflow runs the suites, checks the
   packed file list, and publishes:

   ```sh
   git tag v0.1.0
   git push origin v0.1.0
   ```

   The workflow needs a repository secret `NPM_TOKEN`: an npm granular access
   token with read/write for this package and **Bypass 2FA** enabled (npm
   rejects plain tokens for publishing with a fresh 2FA challenge).

   Without the secret, publish locally instead:

   ```sh
   npm test
   npm run pack:check
   npm publish
   ```

## Verifying an install

```sh
dsh plugin --profile desktop add dsh-quota-inline
```

Reload the page (or restart DSH), then check:

- the reading sits left of the model selector and follows model switches;
- Settings → Quota badge lists the provider cards and **Test** returns values;
- `settings.json` appears under `$DSH_HOME/dsh-quota-inline/`;
- the plugin row shows the badge icon and the localized title.

## Versioning

Semantic Versioning. `package.json` and `CHANGELOG.md` move together; the tag
must equal the manifest version (the release workflow enforces it).
