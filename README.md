# MirrorStack Wallet Browser Extension

A secure, enterprise-grade cryptocurrency wallet browser extension built with Vue 3, TypeScript, and advanced security features including HSM integration, biometric authentication, device fingerprinting, and Zero-Knowledge Proof (ZKP) authentication.

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- Yarn package manager (recommended) or npm
- Modern browser with extension support

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd mirrorstack_wallet

# Install dependencies using Yarn (recommended)
yarn install

# Or using npm
npm install
```

### Development

```bash
# Start development server
yarn dev

# Build for production
yarn build

# Run tests
yarn test:unit
yarn test:e2e

# Lint and format code
yarn lint
yarn format
```

## 📦 Package Manager

This project is configured to use **Yarn** as the primary package manager. The project includes:

- `yarn.lock` - Lock file for deterministic dependency resolution
- `packageManager` field in `package.json` specifying yarn version
- Yarn-compatible scripts and configurations

### Why Yarn?

- **Faster installation** - Parallel package downloads
- **Better security** - Enhanced security features
- **Deterministic builds** - Consistent dependency resolution
- **Workspaces support** - For monorepo management
- **Offline mode** - Can work without internet connection

### Migration from npm

If you're migrating from npm to yarn:

1. Remove `node_modules` and `package-lock.json` (if exists)
2. Install yarn: `npm install -g yarn`
3. Run `yarn install` to generate `yarn.lock`
4. Use `yarn` commands instead of `npm` commands

## 🚀 Features

### 🔐 Security Features

- **Hardware Security Module (HSM) Integration**: Hardware-backed security for key storage and operations
- **Biometric Authentication**: Platform-specific biometric support (Touch ID, Windows Hello)
- **Device Fingerprinting**: Browser and hardware characteristics verification
- **Zero-Knowledge Proof (ZKP)**: Privacy-preserving authentication
- **Security Indicators**: Visual security status on webpages

### 🛠️ Technical Features

- **Background Script**: Handles security checks and extension lifecycle
- **Popup Interface**: Main extension interface with security status
- **Content Script**: Monitors webpages for crypto-related elements
- **Settings Page**: Comprehensive settings management
- **Storage API**: Settings persistence across sessions

## 📋 Prerequisites

- Google Chrome or Chromium-based browser
- Node.js and Yarn installed
- Vue 3 project initialized

### Current Development Status

- ✅ **Vue 3 + TypeScript** setup complete
- ✅ **Tailwind CSS v4.1** with Google Material colors configured
- ✅ **Security Check UI** component implemented with modern design
- ✅ **Object-oriented** service architecture
- ✅ **Dark/Light theme** toggle functionality
- 🔄 **Browser Extension** foundation ready for development

### Step 1: Build the Extension

```bash
# Install dependencies (if not already done)
yarn install

# Build the extension
yarn build
```

### Step 2: Load the Extension in Chrome

1. **Open Chrome Extensions Page**

   - Open Chrome and navigate to `chrome://extensions/`
   - Or go to Chrome Menu → More Tools → Extensions

2. **Enable Developer Mode**

   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to your project's `dist` folder
   - Select the folder and click "Select Folder"

### Step 3: Test the Extension

#### **Test the Popup**

1. Click the MirrorStack Wallet icon in the Chrome toolbar
2. You should see the popup with:
   - Security status indicators
   - "Run Security Check" button
   - "Settings" and "About" buttons

#### **Test the Security Check**

1. Click "Run Security Check" in the popup
2. Watch the progress indicators
3. Verify the security status updates

#### **Test the Settings Page**

1. Click "Settings" in the popup
2. Or right-click the extension icon → Options
3. Test the toggle switches and settings

#### **Test Content Script**

1. Navigate to any website
2. Look for security indicators on crypto-related elements
3. Check browser console for extension messages

## 🛠️ Development

### Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

### Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

### Project Setup

```sh
yarn
```

### Compile and Hot-Reload for Development

```sh
yarn dev
```

### Type-Check, Compile and Minify for Production

```sh
yarn build
```

### Development Workflow

#### **For Development:**

```bash
# Start development server
yarn dev

# Build for production
yarn build

# Watch for changes
yarn build --watch
```

#### **For Testing Changes:**

1. Make your changes to the code
2. Build the extension: `yarn build`
3. Go to `chrome://extensions/`
4. Click the refresh icon on the MirrorStack Wallet extension
5. Test your changes

## 🐛 Debugging

### View Extension Logs

1. Go to `chrome://extensions/`
2. Find MirrorStack Wallet
3. Click "Details"
4. Click "background page" under "Inspect views"
5. Check the Console tab for logs

### Debug Popup

1. Right-click the extension icon
2. Click "Inspect popup"
3. Use the developer tools to debug

### Debug Content Script

1. Open any webpage
2. Open Developer Tools (F12)
3. Check Console for extension messages
4. Look for "MirrorStack Wallet:" prefixed messages

### Debug Commands

```bash
# Check extension files
ls -la public/

# Verify manifest
cat public/manifest.json

# Check for syntax errors
node -c public/background.js
node -c public/content.js
node -c public/popup.js
node -c public/options.js
```

## 🧪 Testing

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
yarn test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
yarn build

# Runs the end-to-end tests
yarn test:e2e
# Runs the tests only on Chromium
yarn test:e2e --project=chromium
# Runs the tests of a specific file
yarn test:e2e tests/example.spec.ts
# Runs the tests in debug mode
yarn test:e2e --debug
```

### Testing Checklist

#### **✅ Basic Functionality:**

- [ ] Extension loads without errors
- [ ] Popup opens and displays correctly
- [ ] Settings page is accessible
- [ ] Security check runs successfully
- [ ] Settings are saved and loaded

#### **✅ Security Features:**

- [ ] HSM detection works
- [ ] Biometric authentication available
- [ ] Device fingerprinting functional
- [ ] ZKP authentication working
- [ ] Security indicators appear on webpages

#### **✅ User Experience:**

- [ ] UI is responsive and accessible
- [ ] Error handling works properly
- [ ] Notifications display correctly
- [ ] Theme switching works
- [ ] Settings import/export functional

## 🔧 Linting

### Lint with [ESLint](https://eslint.org/)

```sh
yarn lint
```

## 📁 Project Structure

```
mirrorstack_wallet/
├── public/                    # Browser extension files
│   ├── manifest.json          # Extension manifest
│   ├── background.js          # Background service worker
│   ├── content.js            # Content script
│   ├── popup.html            # Popup interface
│   ├── popup.js              # Popup functionality
│   ├── options.html          # Settings page
│   ├── options.js            # Settings functionality
│   └── icons/                # Extension icons
│       ├── icon-16.png
│       ├── icon-32.png
│       ├── icon-48.png
│       └── icon-128.png
├── src/                      # Vue 3 source code
│   ├── components/           # Vue components
│   │   └── SecurityCheck.vue # Security check component
│   ├── services/             # TypeScript services
│   │   └── SecurityCheckService.ts
│   ├── types/                # TypeScript type definitions
│   │   └── security.ts
│   └── main.ts              # Vue app entry point
├── docs/                     # Documentation
├── TODO.md                   # Project progress tracking
└── test-case.md             # QA test cases
```

## 🚨 Troubleshooting

### Common Issues

**Extension won't load:**

- Check that all files are in the `public` folder
- Verify `manifest.json` is valid
- Check browser console for errors

**Security check fails:**

- Check browser console for detailed error messages
- Verify HSM detection is working
- Check biometric capabilities

**Popup doesn't work:**

- Check `popup.html` and `popup.js` files
- Verify message passing between popup and background
- Check for JavaScript errors in popup console

**Content script not working:**

- Verify `content.js` is properly injected
- Check for CSP (Content Security Policy) issues
- Look for console errors on webpages

## 🚀 Production Deployment

### For Chrome Web Store

1. Create a production build
2. Zip the `public` folder
3. Submit to Chrome Web Store

### For Firefox Add-ons

1. Modify manifest for Firefox compatibility
2. Submit to Firefox Add-ons

## 🎯 Quick Start Commands

```bash
# 1. Build the extension
yarn build

# 2. Load in Chrome
# - Go to chrome://extensions/
# - Enable Developer mode
# - Click "Load unpacked"
# - Select the public folder

# 3. Test the extension
# - Click the extension icon
# - Run security check
# - Test settings page

# 4. Debug if needed
# - Check browser console
# - Inspect popup/background
# - Monitor content script
```

## 📚 Documentation

- [User Stories and Flow Diagrams](docs/user-stories-and-flow-diagrams.md)
- [UML Diagrams](docs/uml-diagrams.md)
- [Test Cases](test-case.md)
- [Project Progress](TODO.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.

---

**MirrorStack Wallet** - Enterprise-grade security for cryptocurrency management 🛡️
