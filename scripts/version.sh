#!/bin/bash
# Version management script for semantic versioning
# Usage: ./scripts/version.sh

set -e

# Get the latest git tag
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")

# Remove 'v' prefix if present
VERSION=${LATEST_TAG#v}

# Split version into components
IFS='.' read -ra VERSION_PARTS <<< "$VERSION"
MAJOR=${VERSION_PARTS[0]:-0}
MINOR=${VERSION_PARTS[1]:-0}
PATCH=${VERSION_PARTS[2]:-0}

# Get commit count since last tag
COMMIT_COUNT=$(git rev-list ${LATEST_TAG}..HEAD --count 2>/dev/null || echo "1")

# Get short commit SHA
COMMIT_SHA=$(git rev-parse --short HEAD)

# Determine version bump type from commit messages
if git log ${LATEST_TAG}..HEAD --oneline 2>/dev/null | grep -q "BREAKING CHANGE\|major:"; then
    # Major version bump
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    VERSION_TYPE="major"
elif git log ${LATEST_TAG}..HEAD --oneline 2>/dev/null | grep -q "feat:"; then
    # Minor version bump
    MINOR=$((MINOR + 1))
    PATCH=0
    VERSION_TYPE="minor"
elif git log ${LATEST_TAG}..HEAD --oneline 2>/dev/null | grep -q "fix:\|chore:\|docs:"; then
    # Patch version bump
    PATCH=$((PATCH + 1))
    VERSION_TYPE="patch"
else
    VERSION_TYPE="none"
fi

# Build version strings
SEMVER="v${MAJOR}.${MINOR}.${PATCH}"
BUILD_VERSION="${SEMVER}-${COMMIT_COUNT}-${COMMIT_SHA}"

# Output version information
echo "Current tag: ${LATEST_TAG}"
echo "New version: ${SEMVER}"
echo "Build version: ${BUILD_VERSION}"
echo "Commit SHA: ${COMMIT_SHA}"
echo "Version bump: ${VERSION_TYPE}"

# Create version file
mkdir -p dist
cat > dist/version.json << EOF
{
  "version": "${SEMVER}",
  "build": "${BUILD_VERSION}",
  "commit": "${COMMIT_SHA}",
  "date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo ""
echo "Version file created: dist/version.json"
