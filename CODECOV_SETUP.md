# Codecov Setup Guide for GoodHealth

This guide walks you through setting up Codecov for code coverage tracking in the GoodHealth project.

## What is Codecov?

Codecov is a code coverage reporting tool that:
- Tracks test coverage across your codebase
- Shows coverage reports on pull requests
- Provides visual coverage graphs and trends
- Helps ensure code quality by monitoring test coverage

## Prerequisites

- Jest is already installed and configured in the project
- GitHub Actions CI workflow is set up
- Admin access to the GitHub repository

## Step 1: Output a Coverage Report File in CI

The project is already configured to generate coverage reports using Jest.

### Verify Jest Configuration

The `jest.config.js` includes:

```javascript
coverageDirectory: 'coverage',
coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],
```

This generates coverage reports in multiple formats that Codecov can consume.

### Run Coverage Locally

You can test coverage generation locally:

```bash
npm run test:coverage
```

This will:
- Run all tests
- Generate coverage reports in the `coverage/` directory
- Display coverage summary in the terminal

## Step 2: Sign Up for Codecov

1. Go to [codecov.io](https://codecov.io)
2. Click "Sign up with GitHub"
3. Authorize Codecov to access your GitHub repositories
4. Select your organization (or personal account)

## Step 3: Add Your Repository to Codecov

1. In Codecov dashboard, click "Add new repository"
2. Find and select the `goodhealth` repository
3. Codecov will generate a repository upload token

## Step 4: Get Your Repository Token

1. In Codecov, navigate to your `goodhealth` repository settings
2. Go to "Settings" > "General"
3. Copy the **Repository Upload Token**
   - Example format: `27b4f80b-aad4-40ad-9b94-968b02a109f7`
4. Keep this token secure - you'll add it to GitHub secrets

## Step 5: Add Token as GitHub Repository Secret

1. Go to your `goodhealth` repository on GitHub
2. Click **Settings** (top navigation)
3. In the left sidebar, click **Secrets and variables** > **Actions**
4. Click **New repository secret**
5. Add the secret:
   - **Name**: `CODECOV_TOKEN`
   - **Value**: Paste your Codecov repository upload token
6. Click **Add secret**

Your secret should look like this:

```
Name: CODECOV_TOKEN
Value: 27b4f80b-aad4-40ad-9b94-968b02a109f7
```

## Step 6: Verify GitHub Actions Workflow

The CI workflow (`.github/workflows/ci.yml`) is already configured with Codecov integration:

```yaml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage reports to Codecov
  uses: codecov/codecov-action@v5
  if: always()
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    fail_ci_if_error: false
    files: ./coverage/coverage-final.json,./coverage/lcov.info
    flags: unittests
    name: codecov-umbrella
    verbose: true
```

### What This Does

- **Runs tests with coverage**: Generates coverage reports using Jest
- **Uploads to Codecov**: Sends coverage data to Codecov using v5 action
- **if: always()**: Uploads coverage even if tests fail
- **fail_ci_if_error: false**: Doesn't fail the build if Codecov upload fails
- **files**: Specifies which coverage files to upload (JSON and LCOV formats)
- **flags**: Tags the upload as "unittests" for organization
- **verbose**: Provides detailed logging for debugging

## Step 7: Merge to Main Branch

1. Commit your changes (if any were made during setup)
2. Create a pull request
3. Merge to your main branch

Once merged:
- GitHub Actions will run the CI workflow
- Coverage reports will be generated
- Coverage data will be uploaded to Codecov
- Future PRs will display Codecov checks and comments

## Step 8: Verify Codecov Integration

After your first successful workflow run:

1. Go to [codecov.io](https://codecov.io) and check your `goodhealth` repository
2. You should see:
   - Coverage percentage for your project
   - Coverage graphs and trends
   - File-by-file coverage breakdown

3. On pull requests, you'll see:
   - Codecov bot comments with coverage changes
   - Coverage checks in the PR status
   - Visual coverage reports

## Using Codecov

### View Coverage Reports

- **Dashboard**: Visit your Codecov repository page to see overall coverage
- **Pull Requests**: Codecov automatically comments on PRs with coverage changes
- **Commit View**: Click any commit to see its coverage report
- **File Browser**: Browse files to see line-by-line coverage

### Coverage Badge

The project README already includes a Codecov badge:

```markdown
[![codecov](https://codecov.io/gh/your-username/goodhealth/branch/main/graph/badge.svg)](https://codecov.io/gh/your-username/goodhealth)
```

Update `your-username` with your actual GitHub username.

### Understanding Coverage Metrics

- **Line Coverage**: Percentage of code lines executed by tests
- **Branch Coverage**: Percentage of code branches (if/else) tested
- **Function Coverage**: Percentage of functions called by tests
- **Statement Coverage**: Percentage of statements executed

## Troubleshooting

### Coverage Not Uploading

**Check GitHub Actions logs:**
1. Go to Actions tab in your GitHub repository
2. Click on the latest workflow run
3. Look at the "Upload coverage reports to Codecov" step

**Common issues:**
- **Missing CODECOV_TOKEN**: Verify the secret is added correctly
- **Coverage files not found**: Ensure tests are running and generating coverage
- **Network timeout**: Retry the workflow

### No Coverage Changes Shown on PRs

- Ensure at least one successful coverage upload to main branch exists
- Codecov needs a baseline to compare against
- First PR after setup may not show comparison

### Coverage Percentage is Low

Current coverage areas in the project:
```
Coverage Directory: coverage/
Files Covered:
  - app/**/*.{js,jsx,ts,tsx}
  - components/**/*.{js,jsx,ts,tsx}
  - lib/**/*.{js,jsx,ts,tsx}

Excluded:
  - **/*.d.ts (TypeScript definitions)
  - **/node_modules/**
  - **/.next/**
```

To improve coverage:
1. Add more tests for components and utilities
2. Test edge cases and error conditions
3. Review coverage report to find untested code
4. Run `npm run test:coverage` locally to see detailed report

### Codecov Upload Fails but CI Passes

This is expected behavior with `fail_ci_if_error: false`. This prevents:
- Codecov outages from blocking your CI
- Network issues from failing your builds
- Rate limiting from stopping deployments

If Codecov upload consistently fails, investigate the logs.

## Configuration Options

### Codecov Configuration File (Optional)

You can create a `codecov.yml` file in the repository root for advanced configuration:

```yaml
coverage:
  status:
    project:
      default:
        target: 80%
        threshold: 2%
    patch:
      default:
        target: 80%

comment:
  layout: "reach, diff, flags, files"
  behavior: default
```

This would:
- Set target coverage to 80%
- Allow 2% threshold before marking as failed
- Configure PR comment layout

### Jest Coverage Thresholds (Optional)

Add to `jest.config.js` to enforce minimum coverage locally:

```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70
  }
}
```

## Additional Resources

- [Codecov Documentation](https://docs.codecov.com/)
- [Jest Coverage Documentation](https://jestjs.io/docs/configuration#collectcoverage-boolean)
- [GitHub Actions Codecov Action](https://github.com/codecov/codecov-action)
- [Codecov GitHub App](https://github.com/apps/codecov) (optional, for enhanced features)

## Next Steps

1. ✅ Set up Codecov integration (you just did this!)
2. 📊 Monitor coverage trends over time
3. 🎯 Set coverage goals for your team
4. 🧪 Add more tests to increase coverage
5. 📈 Review coverage reports in PRs before merging

## Support

If you encounter issues:
1. Check the [Codecov Support](https://about.codecov.io/support/) page
2. Review GitHub Actions workflow logs
3. Verify all secrets are configured correctly
4. Open an issue in the repository with details

---

**Happy Testing!** 🧪📊
