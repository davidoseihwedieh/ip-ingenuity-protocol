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
        implementation jsc