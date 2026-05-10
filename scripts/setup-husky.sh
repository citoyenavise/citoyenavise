#!/bin/bash

# Setup Husky for Git Hooks
# This script initializes husky and configures pre-commit hooks

echo "🔧 Setting up Husky..."

# Install husky as dev dependency (should be done via npm install)
# npm install -D husky

# Initialize husky
npx husky install

# Make hook executable
chmod +x .husky/pre-commit

echo "✅ Husky setup complete!"
echo ""
echo "Pre-commit hooks will:"
echo "  1. Format code with Prettier"
echo "  2. Lint code with ESLint (--fix)"
echo "  3. Stage formatted files"
echo ""
echo "To manually format:"
echo "  npm run format        # Format all files"
echo "  npm run lint:fix      # Lint and fix"
