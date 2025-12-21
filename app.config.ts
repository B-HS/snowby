import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: 'Snowby',
    slug: 'snowby',
    version: '1.0.0',
    orientation: 'portrait',
    // icon: './assets/images/icon.png',
    scheme: 'snowby',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
        // image: './assets/images/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.snowby.app',
        infoPlist: {
            NSLocationWhenInUseUsageDescription: 'This app uses your location to track your ski/snowboard activities.',
            NSLocationAlwaysAndWhenInUseUsageDescription: 'This app uses your location to track your ski/snowboard activities even in the background.',
            NSPhotoLibraryUsageDescription: 'This app accesses your photos to display pictures taken during your ski/snowboard activities on the map.',
            UIBackgroundModes: ['location', 'fetch'],
        },
    },
    android: {
        edgeToEdgeEnabled: true,
        adaptiveIcon: {
            // foregroundImage: './assets/images/adaptive-icon.png',
            backgroundColor: '#ffffff',
        },
        package: 'com.snowby.app',
    },
    web: {
        bundler: 'metro',
        output: 'static',
        // favicon: './assets/images/favicon.png',
    },
    plugins: [
        'expo-router',
        'expo-localization',
        [
            'expo-maps',
            {
                googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
            },
        ],
        [
            'expo-location',
            {
                locationAlwaysAndWhenInUsePermission: 'Allow $(PRODUCT_NAME) to use your location for tracking ski/snowboard activities.',
                isBackgroundLocationEnabled: true,
            },
        ],
        [
            'expo-media-library',
            {
                photosPermission: 'Allow $(PRODUCT_NAME) to access your photos to display on the tracking map.',
                isAccessMediaLocationEnabled: true,
            },
        ],
        // 'expo-notifications', // 개인 계정에서는 Push Notifications 불가
        'expo-sqlite',
        'expo-task-manager',
    ],
    experiments: {
        typedRoutes: true,
    },
})
