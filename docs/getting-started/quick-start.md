# Quick Start Guide

Get up and running with MirrorStack Wallet in minutes! This guide will help you install, configure, and start using the enterprise-grade cryptocurrency wallet browser extension.

## 🚀 **Prerequisites**

Before you begin, ensure you have:

- **Node.js 22+** installed
- **Yarn package manager** (recommended) or npm
- **Modern browser** with extension support (Chrome, Firefox, Edge)
- **Git** for version control

## 📦 **Installation**

### **Step 1: Clone the Repository**

```bash
git clone <repository-url>
cd mirrorstack_wallet
```

### **Step 2: Install Dependencies**

```bash
# Using Yarn (recommended)
yarn install

# Or using npm
npm install
```

### **Step 3: Build the Extension**

```bash
# Build for development
yarn dev

# Build for production
yarn build
```

## 🔧 **Development Setup**

### **Start Development Server**

```bash
yarn dev
```

This will:

- Start the Vite development server
- Watch for file changes
- Provide hot module replacement
- Serve the extension at `http://localhost:5173`

### **Load Extension in Browser**

#### **Chrome/Edge:**

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder from your project

#### **Firefox:**

1. Open `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from the `dist` folder

## 🧪 **Testing**

### **Run Unit Tests**

```bash
yarn test:unit
```

### **Run E2E Tests**

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
yarn test:e2e

# Run tests for specific browser
yarn test:e2e --project=chromium
yarn test:e2e --project=firefox
```

### **Run Security Tests**

```bash
# Run security-specific tests
yarn test:e2e e2e/security-attacks.spec.ts
yarn test:e2e e2e/advanced-penetration-testing.spec.ts
```

## 🔐 **Security Features**

MirrorStack Wallet includes enterprise-grade security features:

### **Hardware Security Module (HSM)**

- Hardware-backed key storage
- FIPS 140-2 Level 3 compliance
- Secure key generation and storage

### **Biometric Authentication**

- **macOS**: Apple Key integration
- **Windows**: Windows Hello support
- **Linux**: Platform-specific biometrics

### **Zero-Knowledge Proof (ZKP)**

- Privacy-preserving authentication
- No private key transmission
- Cryptographic proof verification

### **Device Fingerprinting**

- Privacy-focused device identification
- Hardware characteristics verification
- Cross-platform compatibility

## 🛠️ **Development Workflow**

### **1. Make Changes**

Edit files in the `src/` directory:

- `src/components/` - Vue components
- `src/services/` - TypeScript services
- `src/views/` - Page components

### **2. Build and Test**

```bash
# Build the extension
yarn build

# Run tests
yarn test:unit
yarn test:e2e
```

### **3. Load Updated Extension**

1. Go to `chrome://extensions/`
2. Click the refresh icon on MirrorStack Wallet
3. Test your changes

### **4. Debug Issues**

#### **View Extension Logs:**

1. Go to `chrome://extensions/`
2. Find MirrorStack Wallet
3. Click "Details"
4. Click "background page" under "Inspect views"

#### **Debug Popup:**

1. Right-click the extension icon
2. Click "Inspect popup"

#### **Debug Content Script:**

1. Open any webpage
2. Open Developer Tools (F12)
3. Check Console for extension messages

## 📋 **Configuration**

### **Environment Variables**

Create a `.env` file in the project root:

```env
# Development settings
NODE_ENV=development
VITE_APP_TITLE=MirrorStack Wallet
VITE_APP_VERSION=1.0.0

# Security settings
VITE_ENABLE_HSM=true
VITE_ENABLE_BIOMETRIC=true
VITE_ENABLE_ZKP=true
VITE_ENABLE_DEVICE_FINGERPRINTING=true
```

### **Security Configuration**

The extension uses a comprehensive security configuration:

```typescript
const SECURITY_CONFIG = {
  enableHSM: true,
  enableBiometric: true,
  enableDeviceFingerprinting: true,
  enableZKP: true,
  enableCSP: true,
  enableTLS: true,
  enableHeaders: true,
  enableCrypto: true,
  enableStorage: true,
  enableDOMProtection: true,
  timeoutMs: 30000,
  retryAttempts: 3,
  delayMs: 50,
}
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Extension Won't Load**

- Check that all files are in the `dist` folder
- Verify `manifest.json` is valid
- Check browser console for errors

#### **Security Check Fails**

- Check browser console for detailed error messages
- Verify HSM detection is working
- Check biometric capabilities

#### **Tests Fail**

- Ensure all dependencies are installed
- Check that the development server is running
- Verify browser compatibility

#### **Build Errors**

- Clear `node_modules` and reinstall
- Check Node.js version compatibility
- Verify TypeScript configuration

### **Debug Commands**

```bash
# Check extension files
ls -la dist/

# Verify manifest
cat dist/manifest.json

# Check for syntax errors
node -c dist/background.js
node -c dist/content.js
node -c dist/popup.js

# Lint code
yarn lint

# Format code
yarn format
```

## 📚 **Next Steps**

Now that you're up and running:

1. **Explore the Documentation**:

   - [Security Features](./../security/overview.md)
   - [API Reference](./../development/api-reference.md)
   - [Testing Guide](./../development/testing.md)

2. **Learn the Architecture**:

   - [Architecture Overview](./architecture.md)
   - [UML Diagrams](./../technical/uml-diagrams.md)

3. **Understand Security**:

   - [HSM Integration](./../security/hsm-integration.md)
   - [Biometric Authentication](./../security/biometric-auth.md)
   - [ZKP Authentication](./../security/zkp-authentication.md)

4. **Contribute**:
   - [Contributing Guidelines](./../project/contributing.md)
   - [Development Roadmap](./../project/roadmap.md)

## 🆘 **Need Help?**

- **Technical Issues**: Create an issue in the GitHub repository
- **Security Concerns**: Contact the security team directly
- **Documentation**: Check the comprehensive documentation structure
- **Community**: Join our development community

---

**Ready to build secure cryptocurrency solutions?** 🚀

Start exploring the advanced security features and contribute to the future of secure digital asset management!
