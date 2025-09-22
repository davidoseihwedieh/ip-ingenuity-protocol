// package.json - React Native Project Configuration
{
  "name": "CreatorBondsMobile",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "build:android": "cd android && ./gradlew assembleRelease",
    "build:android:bundle": "cd android && ./gradlew bundleRelease",
    "build:ios": "react-native run-ios --configuration Release",
    "clean": "react-native clean",
    "clean:android": "cd android && ./gradlew clean",
    "clean:ios": "cd ios && xcodebuild clean",
    "pod:install": "cd ios && pod install",
    "release:android": "fastlane android release",
    "release:ios": "fastlane ios release",
    "test:e2e": "detox test",
    "build:e2e:android": "detox build --configuration android.emu.release",
    "build:e2e:ios": "detox build --configuration ios.sim.release"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.72.5",
    "@react-navigation/native": "^6.1.7",
    "@react-navigation/bottom-tabs": "^6.5.8",
    "@react-navigation/stack": "^6.3.17",
    "@react-native-async-storage/async-storage": "^1.19.3",
    "@react-native-netinfo/netinfo": "^9.4.1",
    "@react-native-firebase/app": "^18.4.0",
    "@react-native-firebase/messaging": "^18.4.0",
    "@notifee/react-native": "^7.8.0",
    "react-native-safe-area-context": "^4.7.2",
    "react-native-screens": "^3.25.0",
    "react-native-gesture-handler": "^2.12.1",
    "react-native-vector-icons": "^10.0.0",
    "react-native-linear-gradient": "^2.8.3",
    "react-native-svg": "^13.14.0",
    "react-native-chart-kit": "^6.12.0",
    "react-native-image-picker": "^5.6.0",
    "react-native-keychain": "^8.1.2",
    "react-native-biometrics": "^3.0.1",
    "react-native-share": "^9.4.1",
    "react-native-permissions": "^3.9.3",
    "socket.io-client": "^4.7.2",
    "react-query": "^3.39.3",
    "zustand": "^4.4.1"
  },
  "devDependencies": {
    "@babel/core": "^7.22.10",
    "@babel/preset-env": "^7.22.10",
    "@babel/runtime": "^7.22.10",
    "@react-native/eslint-config": "^0.72.2",
    "@react-native/metro-config": "^0.72.11",
    "@types/react": "^18.2.21",
    "@types/react-test-renderer": "^18.0.0",
    "babel-jest": "^29.6.3",
    "eslint": "^8.47.0",
    "jest": "^29.6.3",
    "metro-react-native-babel-preset": "0.76.8",
    "prettier": "^3.0.2",
    "react-test-renderer": "18.2.0",
    "typescript": "^5.1.6",
    "detox": "^20.11.3",
    "flipper": "^0.212.0"
  },
  "jest": {
    "preset": "react-native"
  },
  "engines": {
    "node": ">=16"
  }
}

// ================================
// android/app/build.gradle - Android Build Configuration
// ================================

apply plugin: "com.android.application"
apply plugin: "com.facebook.react"
apply plugin: 'com.google.gms.google-services'

import com.android.build.OutputFile

react {
    debuggableVariants = ["liveDebug", "stagingDebug"]
}

def enableSeparateBuildPerCPUArchitecture = false
def enableProguardInReleaseBuilds = true
def jscFlavor = 'org.webkit:android-jsc:+'
def enableHermes = project.ext.react.get("enableHermes", true)

def reactNativeArchitectures() {
    def value = project.getProperties().get("reactNativeArchitectures")
    return value ? value.split(",") : ["armeabi-v7a", "x86", "x86_64", "arm64-v8a"]
}

android {
    ndkVersion rootProject.ext.ndkVersion
    compileSdkVersion rootProject.ext.compileSdkVersion

    namespace "com.creatorbonds.mobile"
    defaultConfig {
        applicationId "com.creatorbonds.mobile"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0.0"
        multiDexEnabled true
        
        buildConfigField "String", "API_BASE_URL", "\"https://api.yourdomain.com/api\""
        buildConfigField "String", "WS_URL", "\"wss://api.yourdomain.com\""
        
        ndk {
            abiFilters (*reactNativeArchitectures())
        }
    }

    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }

    buildTypes {
        debug {
            signingConfig signingConfigs.debug
            buildConfigField "String", "API_BASE_URL", "\"http://10.0.2.2:3001/api\""
            buildConfigField "String", "WS_URL", "\"ws://10.0.2.2:3001\""
        }
        staging {
            signingConfig signingConfigs.debug
            buildConfigField "String", "API_BASE_URL", "\"https://api-staging.yourdomain.com/api\""
            buildConfigField "String", "WS_URL", "\"wss://api-staging.yourdomain.com\""
            matchingFallbacks = ['debug', 'release']
        }
        release {
            signingConfig signingConfigs.release
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
            buildConfigField "String", "API_BASE_URL", "\"https://api.yourdomain.com/api\""
            buildConfigField "String", "WS_URL", "\"wss://api.yourdomain.com\""
        }
    }

    applicationVariants.all { variant ->
        variant.outputs.each { output ->
            def versionCodes = ["armeabi-v7a": 1, "x86": 2, "arm64-v8a": 3, "x86_64": 4]
            def abi = output.getFilter(OutputFile.ABI)
            if (abi != null) {
                output.versionCodeOverride =
                        defaultConfig.versionCode * 1000 + versionCodes.get(abi)
            }
        }
    }
}

dependencies {
    implementation fileTree(dir: "libs", include: ["*.jar"])
    implementation "com.facebook.react:react-native:+"
    implementation "androidx.swiperefreshlayout:swiperefreshlayout:1.0.0"
    
    // Firebase
    implementation platform('com.google.firebase:firebase-bom:32.3.1')
    implementation 'com.google.firebase:firebase-messaging'
    implementation 'com.google.firebase:firebase-analytics'
    
    // Biometric authentication
    implementation 'androidx.biometric:biometric:1.1.0'
    
    // Network security
    implementation 'com.squareup.okhttp3:okhttp:4.11.0'
    
    debugImplementation("com.facebook.flipper:flipper:${FLIPPER_VERSION}")
    debugImplementation("com.facebook.flipper:flipper-network-plugin:${FLIPPER_VERSION}") {
        exclude group:'com.squareup.okhttp3', module:'okhttp'
    }
    debugImplementation("com.facebook.flipper:flipper-fresco-plugin:${FLIPPER_VERSION}")

    if (enableHermes) {
        implementation("com.facebook.react:hermes-engine:+")
    } else {
        implementation jscFlavor
    }
}

apply from: file("../../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); applyNativeModulesAppBuildGradle(project)

// ================================
// ios/CreatorBondsMobile.xcodeproj/project.pbxproj - iOS Configuration
// ================================

// Info.plist additions for iOS
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>yourdomain.com</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <false/>
            <key>NSExceptionMinimumTLSVersion</key>
            <string>TLSv1.2</string>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
        <key>localhost</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
        </dict>
    </dict>
</dict>

<key>NSCameraUsageDescription</key>
<string>CreatorBonds needs camera access to capture photos for your bonds and tokens</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>CreatorBonds needs photo library access to select images for your content</string>
<key>NSFaceIDUsageDescription</key>
<string>CreatorBonds uses Face ID for secure authentication</string>
<key>NSContactsUsageDescription</key>
<string>CreatorBonds can access contacts to help you connect with other creators</string>

<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
    <string>background-fetch</string>
    <string>background-processing</string>
</array>

<key>BGTaskSchedulerPermittedIdentifiers</key>
<array>
    <string>com.creatorbonds.mobile.sync</string>
    <string>com.creatorbonds.mobile.refresh</string>
</array>

// ================================
// fastlane/Fastfile - Automated Deployment
// ================================

default_platform(:ios)

before_all do
  ensure_git_status_clean
  git_pull
end

platform :ios do
  desc "Run tests"
  lane :test do
    run_tests(
      workspace: "ios/CreatorBondsMobile.xcworkspace",
      scheme: "CreatorBondsMobile",
      device: "iPhone 14"
    )
  end

  desc "Build app for testing"
  lane :beta do
    increment_build_number(xcodeproj: "ios/CreatorBondsMobile.xcodeproj")
    
    build_app(
      workspace: "ios/CreatorBondsMobile.xcworkspace",
      scheme: "CreatorBondsMobile",
      export_method: "app-store"
    )
    
    upload_to_testflight(
      beta_app_description: "Latest beta build with new features and improvements",
      beta_app_feedback_email: "feedback@yourdomain.com",
      notify_external_testers: true,
      groups: ["Internal Testers", "Beta Users"]
    )
    
    slack(
      message: "🚀 iOS beta build uploaded to TestFlight!",
      channel: "#mobile-releases"
    )
  end

  desc "Deploy to App Store"
  lane :release do
    capture_screenshots
    
    increment_build_number(xcodeproj: "ios/CreatorBondsMobile.xcodeproj")
    
    build_app(
      workspace: "ios/CreatorBondsMobile.xcworkspace",
      scheme: "CreatorBondsMobile",
      export_method: "app-store"
    )
    
    upload_to_app_store(
      force: true,
      reject_if_possible: true,
      skip_metadata: false,
      skip_screenshots: false,
      submit_for_review: true,
      automatic_release: false,
      submission_information: {
        add_id_info_limits_tracking: true,
        add_id_info_serves_ads: false,
        add_id_info_tracks_action: true,
        add_id_info_tracks_install: true,
        add_id_info_uses_idfa: false,
        content_rights_has_rights: true,
        content_rights_contains_third_party_content: false,
        export_compliance_platform: 'ios',
        export_compliance_compliance_required: false,
        export_compliance_encryption_updated: false,
        export_compliance_app_type: nil,
        export_compliance_uses_encryption: false
      }
    )
    
    slack(
      message: "🎉 iOS app submitted to App Store for review!",
      channel: "#mobile-releases"
    )
  end
end

platform :android do
  desc "Run tests"
  lane :test do
    gradle(task: "test", project_dir: "android/")
  end

  desc "Build and upload to Play Console"
  lane :beta do
    gradle(
      task: "clean bundleRelease",
      project_dir: "android/",
      properties: {
        "android.injected.signing.store.file" => ENV["ANDROID_STORE_FILE"],
        "android.injected.signing.store.password" => ENV["ANDROID_STORE_PASSWORD"],
        "android.injected.signing.key.alias" => ENV["ANDROID_KEY_ALIAS"],
        "android.injected.signing.key.password" => ENV["ANDROID_KEY_PASSWORD"],
      }
    )
    
    upload_to_play_store(
      track: 'internal',
      release_status: 'draft',
      aab: 'android/app/build/outputs/bundle/release/app-release.aab'
    )
    
    slack(
      message: "🚀 Android beta build uploaded to Play Console!",
      channel: "#mobile-releases"
    )
  end

  desc "Deploy to Play Store"
  lane :release do
    gradle(
      task: "clean bundleRelease",
      project_dir: "android/",
      properties: {
        "android.injected.signing.store.file" => ENV["ANDROID_STORE_FILE"],
        "android.injected.signing.store.password" => ENV["ANDROID_STORE_PASSWORD"],
        "android.injected.signing.key.alias" => ENV["ANDROID_KEY_ALIAS"],
        "android.injected.signing.key.password" => ENV["ANDROID_KEY_PASSWORD"],
      }
    )
    
    upload_to_play_store(
      track: 'production',
      release_status: 'completed',
      aab: 'android/app/build/outputs/bundle/release/app-release.aab'
    )
    
    slack(
      message: "🎉 Android app released to Play Store!",
      channel: "#mobile-releases"
    )
  end
end

// ================================
// .github/workflows/mobile-ci-cd.yml - Mobile CI/CD Pipeline
// ================================

name: Mobile App CI/CD

on:
  push:
    branches: [ main, develop ]
    paths: [ 'mobile/**' ]
  pull_request:
    branches: [ main ]
    paths: [ 'mobile/**' ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: mobile/package-lock.json
    
    - name: Install dependencies
      working-directory: mobile
      run: npm ci
    
    - name: Run linting
      working-directory: mobile
      run: npm run lint
    
    - name: Run tests
      working-directory: mobile
      run: npm test -- --coverage
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        directory: mobile/coverage

  build-android:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: mobile/package-lock.json
    
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        distribution: 'zulu'
        java-version: '11'
    
    - name: Setup Android SDK
      uses: android-actions/setup-android@v2
    
    - name: Install dependencies
      working-directory: mobile
      run: npm ci
    
    - name: Decode Android keystore
      run: |
        echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > mobile/android/app/release.keystore
    
    - name: Build Android App Bundle
      working-directory: mobile
      run: |
        cd android
        ./gradlew bundleRelease
      env:
        MYAPP_UPLOAD_STORE_FILE: release.keystore
        MYAPP_UPLOAD_STORE_PASSWORD: ${{ secrets.ANDROID_STORE_PASSWORD }}
        MYAPP_UPLOAD_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
        MYAPP_UPLOAD_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
    
    - name: Upload to Play Console (Beta)
      if: github.ref == 'refs/heads/develop'
      uses: r0adkll/upload-google-play@v1
      with:
        serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON }}
        packageName: com.creatorbonds.mobile
        releaseFiles: mobile/android/app/build/outputs/bundle/release/app-release.aab
        track: internal
        status: completed
    
    - name: Upload to Play Console (Production)
      if: github.ref == 'refs/heads/main'
      uses: r0adkll/upload-google-play@v1
      with:
        serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON }}
        packageName: com.creatorbonds.mobile
        releaseFiles: mobile/android/app/build/outputs/bundle/release/app-release.aab
        track: production
        status: completed

  build-ios:
    needs: test
    runs-on: macos-latest
    if: github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: mobile/package-lock.json
    
    - name: Install dependencies
      working-directory: mobile
      run: npm ci
    
    - name: Install CocoaPods
      working-directory: mobile/ios
      run: pod install
    
    - name: Setup Xcode
      uses: maxim-lobanov/setup-xcode@v1
      with:
        xcode-version: '15.0'
    
    - name: Install Apple Certificate
      uses: apple-actions/import-codesign-certs@v2
      with:
        p12-file-base64: ${{ secrets.IOS_DISTRIBUTION_CERT_BASE64 }}
        p12-password: ${{ secrets.IOS_DISTRIBUTION_CERT_PASSWORD }}
    
    - name: Install Provisioning Profile
      uses: apple-actions/download-provisioning-profiles@v1
      with:
        bundle-id: com.creatorbonds.mobile
        issuer-id: ${{ secrets.APPSTORE_ISSUER_ID }}
        api-key-id: ${{ secrets.APPSTORE_KEY_ID }}
        api-private-key: ${{ secrets.APPSTORE_PRIVATE_KEY }}
    
    - name: Build iOS App
      working-directory: mobile
      run: |
        xcodebuild -workspace ios/CreatorBondsMobile.xcworkspace \
          -scheme CreatorBondsMobile \
          -configuration Release \
          -destination generic/platform=iOS \
          -archivePath ios/CreatorBondsMobile.xcarchive \
          archive
    
    - name: Export IPA
      working-directory: mobile
      run: |
        xcodebuild -exportArchive \
          -archivePath ios/CreatorBondsMobile.xcarchive \
          -exportOptionsPlist ios/ExportOptions.plist \
          -exportPath ios/build
    
    - name: Upload to TestFlight (Beta)
      if: github.ref == 'refs/heads/develop'
      uses: apple-actions/upload-testflight-build@v1
      with:
        app-path: mobile/ios/build/CreatorBondsMobile.ipa
        issuer-id: ${{ secrets.APPSTORE_ISSUER_ID }}
        api-key-id: ${{ secrets.APPSTORE_KEY_ID }}
        api-private-key: ${{ secrets.APPSTORE_PRIVATE_KEY }}
    
    - name: Upload to App Store (Production)
      if: github.ref == 'refs/heads/main'
      uses: apple-actions/upload-testflight-build@v1
      with:
        app-path: mobile/ios/build/CreatorBondsMobile.ipa
        issuer-id: ${{ secrets.APPSTORE_ISSUER_ID }}
        api-key-id: ${{ secrets.APPSTORE_KEY_ID }}
        api-private-key: ${{ secrets.APPSTORE_PRIVATE_KEY }}

// ================================
// scripts/build-mobile.sh - Build Script
// ================================

#!/bin/bash

set -e

PLATFORM=${1:-both}
BUILD_TYPE=${2:-debug}
ENVIRONMENT=${3:-development}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

log "🏗️  Building CreatorBonds Mobile App"
log "Platform: $PLATFORM"
log "Build Type: $BUILD_TYPE"
log "Environment: $ENVIRONMENT"

# Navigate to mobile directory
cd mobile

# Validate environment
if [[ ! "$PLATFORM" =~ ^(android|ios|both)$ ]]; then
    error "Platform must be 'android', 'ios', or 'both'"
fi

if [[ ! "$BUILD_TYPE" =~ ^(debug|release)$ ]]; then
    error "Build type must be 'debug' or 'release'"
fi

# Install dependencies
log "📦 Installing dependencies..."
npm ci
success "Dependencies installed"

# Build Android
if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
    log "🤖 Building Android app..."
    
    # Clean previous builds
    cd android
    ./gradlew clean
    
    if [[ "$BUILD_TYPE" == "release" ]]; then
        # Check for release keystore
        if [[ ! -f "app/release.keystore" ]]; then
            error "Release keystore not found. Please add release.keystore to android/app/"
        fi
        
        # Build release AAB
        ./gradlew bundleRelease
        
        # Build release APK (for testing)
        ./gradlew assembleRelease
        
        success "Android release build completed"
        log "AAB: android/app/build/outputs/bundle/release/app-release.aab"
        log "APK: android/app/build/outputs/apk/release/app-release.apk"
    else
        # Build debug APK
        ./gradlew assembleDebug
        
        success "Android debug build completed"
        log "APK: android/app/build/outputs/apk/debug/app-debug.apk"
    fi
    
    cd ..
fi

# Build iOS
if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
    log "🍎 Building iOS app..."
    
    # Check if running on macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        warning "iOS build requires macOS. Skipping iOS build."
    else
        # Install CocoaPods dependencies
        cd ios
        pod install
        cd ..
        
        if [[ "$BUILD_TYPE" == "release" ]]; then
            # Build for release
            npx react-native run-ios --configuration Release
            success "iOS release build completed"
        else
            # Build for debug
            npx react-native run-ios
            success "iOS debug build completed"
        fi
    fi
fi

# Run tests
log "🧪 Running tests..."
npm test -- --passWithNoTests
success "Tests completed"

# Generate build report
log "📊 Generating build report..."
BUILD_DATE=$(date)
BUILD_COMMIT=$(git rev-parse --short HEAD)

cat > build-report.md << EOF
# Mobile Build Report

**Date**: $BUILD_DATE
**Platform**: $PLATFORM
**Build Type**: $BUILD_TYPE
**Environment**: $ENVIRONMENT
**Commit**: $BUILD_COMMIT

## Build Artifacts

EOF

if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
    echo "### Android" >> build-report.md
    if [[ "$BUILD_TYPE" == "release" ]]; then
        echo "- AAB: \`android/app/build/outputs/bundle/release/app-release.aab\`" >> build-report.md
        echo "- APK: \`android/app/build/outputs/apk/release/app-release.apk\`" >> build-report.md
    else
        echo "- APK: \`android/app/build/outputs/apk/debug/app-debug.apk\`" >> build-report.md
    fi
    echo "" >> build-report.md
fi

if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
    echo "### iOS" >> build-report.md
    echo "- Archive: Available in Xcode Organizer" >> build-report.md
    echo "" >> build-report.md
fi

echo "## Next Steps" >> build-report.md
echo "" >> build-report.md

if [[ "$BUILD_TYPE" == "release" ]]; then
    echo "### For Production Release:" >> build-report.md
    echo "1. Test the builds thoroughly" >> build-report.md
    echo "2. Upload to app stores using Fastlane:" >> build-report.md
    echo "   - Android: \`fastlane android release\`" >> build-report.md
    echo "   - iOS: \`fastlane ios release\`" >> build-report.md
else
    echo "### For Testing:" >> build-report.md
    echo "1. Install APK on Android devices for testing" >> build-report.md
    echo "2. Use iOS Simulator or TestFlight for iOS testing" >> build-report.md
fi

success "Build report generated: build-report.md"

log "🎉 Mobile app build completed successfully!"
echo ""
echo "📱 Build Summary:"
echo "================="
echo "Platform: $PLATFORM"
echo "Build Type: $BUILD_TYPE"
echo "Environment: $ENVIRONMENT"
echo "Status: ✅ Success"
echo ""
success "🚀 Ready for testing and deployment!"