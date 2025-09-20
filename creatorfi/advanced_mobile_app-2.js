/**
 * CreatorFi Advanced Mobile App
 * React Native with advanced features for creators and investors
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  PanGestureHandler,
  Dimensions,
  Alert,
  Platform
} from 'react-native';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { LineChart, AreaChart, BarChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { WebView } from 'react-native-webview';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';
import { 
  accelerometer, 
  gyroscope, 
  magnetometer,
  barometer 
} from 'react-native-sensors';

const { width, height } = Dimensions.get('window');

// Advanced Creator Content Hub
const CreatorContentHub = ({ navigation, creator }) => {
  const [contentItems, setContentItems] = useState([]);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  
  const animatedValue = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef(null);

  useEffect(() => {
    loadContentItems();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const cameraPermission = await Camera.requestCameraPermissionsAsync();
    const audioPermission = await Audio.requestPermissionsAsync();
    const locationPermission = await Location.requestForegroundPermissionsAsync();
    
    if (!cameraPermission.granted || !audioPermission.granted) {
      Alert.alert('Permissions Required', 'Camera and microphone access are needed for content creation.');
    }
  };

  const loadContentItems = async () => {
    try {
      const response = await fetch(`/api/creators/${creator.id}/content`);
      const items = await response.json();
      setContentItems(items);
    } catch (error) {
      console.error('Failed to load content:', error);
    }
  };

  const startVideoRecording = async () => {
    if (cameraRef.current) {
      try {
        setIsRecording(true);
        const videoData = await cameraRef.current.recordAsync({
          quality: Camera.Constants.VideoQuality['720p'],
          maxDuration: 60, // 60 seconds max
          mute: false
        });
        
        // Upload video with metadata
        await uploadContent(videoData, 'video');
        
      } catch (error) {
        console.error('Recording failed:', error);
      } finally {
        setIsRecording(false);
      }
    }
  };

  const stopVideoRecording = async () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  const startAudioRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopAudioRecording = async () => {
    setIsRecording(false);
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    
    await uploadContent({ uri }, 'audio');
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photoData = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          exif: true
        });
        
        await uploadContent(photoData, 'image');
      } catch (error) {
        console.error('Photo capture failed:', error);
      }
    }
  };

  const uploadContent = async (mediaData, type) => {
    try {
      // Get current location for geo-tagging
      const location = await Location.getCurrentPositionAsync({});
      
      const formData = new FormData();
      formData.append('media', {
        uri: mediaData.uri,
        type: `${type}/${type === 'image' ? 'jpeg' : 'mp4'}`,
        name: `content_${Date.now()}.${type === 'image' ? 'jpg' : 'mp4'}`
      });
      
      formData.append('metadata', JSON.stringify({
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        },
        timestamp: Date.now(),
        creatorId: creator.id,
        type
      }));

      const response = await fetch('/api/content/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      if (response.ok) {
        const newContent = await response.json();
        setContentItems(prev => [newContent, ...prev]);
        
        // Show success animation
        Animated.spring(animatedValue, {
          toValue: 1,
          useNativeDriver: true
        }).start(() => {
          setTimeout(() => {
            Animated.spring(animatedValue, {
              toValue: 0,
              useNativeDriver: true
            }).start();
          }, 2000);
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Upload Failed', 'Could not upload content. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Camera Interface */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        flashMode={flashMode}
        ratio="16:9"
      >
        <View style={styles.cameraOverlay}>
          {/* Recording Indicator */}
          {isRecording && (
            <View style={styles.recordingIndicator}>
              <LottieView
                source={require('./animations/recording.json')}
                autoPlay
                loop
                style={styles.recordingAnimation}
              />
              <Text style={styles.recordingText}>REC</Text>
            </View>
          )}

          {/* Camera Controls */}
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setCameraType(
                cameraType === Camera.Constants.Type.back
                  ? Camera.Constants.Type.front
                  : Camera.Constants.Type.back
              )}
            >
              <Text style={styles.controlText}>Flip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.captureButton, isRecording && styles.recordingButton]}
              onPress={takePicture}
              onLongPress={startVideoRecording}
              onPressOut={stopVideoRecording}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setFlashMode(
                flashMode === Camera.Constants.FlashMode.off
                  ? Camera.Constants.FlashMode.on
                  : Camera.Constants.FlashMode.off
              )}
            >
              <Text style={styles.controlText}>Flash</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Camera>

      {/* Content Grid */}
      <ScrollView style={styles.contentGrid}>
        <View style={styles.gridContainer}>
          {contentItems.map((item, index) => (
            <ContentItem key={item.id} item={item} index={index} />
          ))}
        </View>
      </ScrollView>

      {/* Success Animation Overlay */}
      <Animated.View
        style={[
          styles.successOverlay,
          {
            opacity: animatedValue,
            transform: [{
              scale: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1]
              })
            }]
          }
        ]}
        pointerEvents="none"
      >
        <LottieView
          source={require('./animations/success.json')}
          autoPlay
          loop={false}
          style={styles.successAnimation}
        />
        <Text style={styles.successText}>Content Uploaded!</Text>
      </Animated.View>
    </View>
  );
};

// Advanced Investment Portfolio with Gestures
const InvestmentPortfolio = ({ investor }) => {
  const [investments, setInvestments] = useState([]);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [200, 100],
    extrapolate: 'clamp'
  });

  useEffect(() => {
    loadPortfolioData();
    subscribeToRealTimeUpdates();
  }, []);

  const loadPortfolioData = async () => {
    try {
      const response = await fetch(`/api/investors/${investor.id}/portfolio`);
      const data = await response.json();
      
      setInvestments(data.investments);
      setPortfolioValue(data.totalValue);
      setChartData(data.chartData);
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    }
  };

  const subscribeToRealTimeUpdates = () => {
    const ws = new WebSocket(`ws://localhost:3001/portfolio/${investor.id}`);
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      
      if (update.type === 'portfolio_update') {
        setPortfolioValue(update.totalValue);
        updateInvestmentData(update.investmentId, update.data);
      }
    };

    return () => ws.close();
  };

  const updateInvestmentData = (investmentId, newData) => {
    setInvestments(prev => prev.map(inv => 
      inv.id === investmentId ? { ...inv, ...newData } : inv
    ));
  };

  const handleSwipeGesture = (gestureState, investment) => {
    const { dx, dy } = gestureState;
    
    // Right swipe - Quick buy more tokens
    if (dx > 100) {
      showQuickBuyModal(investment);
    }
    // Left swipe - Quick sell tokens
    else if (dx < -100) {
      showQuickSellModal(investment);
    }
    // Up swipe - View detailed analytics
    else if (dy < -100) {
      navigation.navigate('InvestmentDetails', { investment });
    }
  };

  const showQuickBuyModal = (investment) => {
    Alert.alert(
      `Buy More ${investment.creatorName} Tokens`,
      'How much would you like to invest?',
      [
        { text: '$50', onPress: () => buyTokens(investment.id, 50) },
        { text: '$100', onPress: () => buyTokens(investment.id, 100) },
        { text: '$250', onPress: () => buyTokens(investment.id, 250) },
        { text: 'Custom', onPress: () => showCustomAmountModal(investment) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const buyTokens = async (investmentId, amount) => {
    try {
      const response = await fetch('/api/investments/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investmentId, amount })
      });

      if (response.ok) {
        await loadPortfolioData(); // Refresh data
        showSuccessHaptic();
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  const showSuccessHaptic = () => {
    if (Platform.OS === 'ios') {
      const { Haptics } = require('expo-haptics');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.portfolioHeader, { height: headerHeight }]}>
        <BlurView intensity={80} style={styles.headerBlur}>
          <Text style={styles.portfolioValue}>${portfolioValue.toLocaleString()}</Text>
          <Text style={styles.portfolioLabel}>Portfolio Value</Text>
          
          {/* Mini Chart */}
          <LineChart
            data={chartData}
            width={width - 40}
            height={80}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: 'transparent',
              backgroundGradientTo: 'transparent',
              color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
              strokeWidth: 2,
              propsForDots: { r: '0' }
            }}
            bezier
            withDots={false}
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLabels={false}
            withHorizontalLabels={false}
          />
        </BlurView>
      </Animated.View>

      <Animated.ScrollView
        style={styles.investmentsList}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {investments.map((investment, index) => (
          <InvestmentCard
            key={investment.id}
            investment={investment}
            index={index}
            onSwipe={handleSwipeGesture}
          />
        ))}
      </Animated.ScrollView>
    </View>
  );
};

// Interactive Investment Card with Gestures
const InvestmentCard = ({ investment, index, onSwipe }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  const panGestureHandler = useRef();

  const animateCard = () => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true })
    ]).start();
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX, translationY } = event.nativeEvent;
      
      // Trigger swipe actions based on gesture
      if (Math.abs(translationX) > 100 || Math.abs(translationY) > 100) {
        onSwipe({ dx: translationX, dy: translationY }, investment);
      }
      
      animateCard();
    }
  };

  const calculatePerformance = () => {
    const performance = ((investment.currentValue - investment.investedAmount) / investment.investedAmount) * 100;
    return {
      percentage: performance,
      isPositive: performance >= 0,
      color: performance >= 0 ? '#10B981' : '#EF4444'
    };
  };

  const performance = calculatePerformance();

  return (
    <PanGestureHandler
      ref={panGestureHandler}
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <Animated.View
        style={[
          styles.investmentCard,
          {
            transform: [
              { translateX },
              { translateY },
              { scale }
            ]
          }
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.creatorInfo}>
            <Image source={{ uri: investment.creatorAvatar }} style={styles.creatorAvatar} />
            <View>
              <Text style={styles.creatorName}>{investment.creatorName}</Text>
              <Text style={styles.creatorCategory}>{investment.category}</Text>
            </View>
          </View>
          <View style={styles.performanceIndicator}>
            <Text style={[styles.performanceText, { color: performance.color }]}>
              {performance.isPositive ? '+' : ''}{performance.percentage.toFixed(1)}%
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.investmentMetrics}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Invested</Text>
              <Text style={styles.metricValue}>${investment.investedAmount}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Current Value</Text>
              <Text style={styles.metricValue}>${investment.currentValue}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Tokens</Text>
              <Text style={styles.metricValue}>{investment.tokenAmount}</Text>
            </View>
          </View>

          {/* Mini Performance Chart */}
          <AreaChart
            data={investment.performanceData}
            width={width - 80}
            height={60}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: 'transparent',
              backgroundGradientTo: 'transparent',
              color: (opacity = 1) => `${performance.color}${Math.round(opacity * 255).toString(16)}`,
              strokeWidth: 1
            }}
            bezier
            withDots={false}
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLabels={false}
            withHorizontalLabels={false}
          />
        </View>

        {/* Swipe Indicators */}
        <Animated.View
          style={[
            styles.swipeIndicator,
            styles.leftIndicator,
            {
              opacity: translateX.interpolate({
                inputRange: [-150, -50, 0],
                outputRange: [1, 0.5, 0],
                extrapolate: 'clamp'
              })
            }
          ]}
        >
          <Text style={styles.swipeText}>Sell</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.swipeIndicator,
            styles.rightIndicator,
            {
              opacity: translateX.interpolate({
                inputRange: [0, 50, 150],
                outputRange: [0, 0.5, 1],
                extrapolate: 'clamp'
              })
            }
          ]}
        >
          <Text style={styles.swipeText}>Buy More</Text>
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
};

// AI-Powered Creator Discovery with AR
const CreatorDiscoveryAR = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [creators, setCreators] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [arMode, setARMode] = useState(false);
  
  useEffect(() => {
    requestCameraPermission();
    getCurrentLocation();
    loadNearbyCreators();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
      }
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const loadNearbyCreators = async () => {
    try {
      const response = await fetch('/api/creators/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: userLocation,
          preferences: await getUserPreferences(),
          limit: 20
        })
      });
      
      const data = await response.json();
      setCreators(data.creators);
    } catch (error) {
      console.error('Failed to load creators:', error);
    }
  };

  const getUserPreferences = async () => {
    try {
      const preferences = await AsyncStorage.getItem('userPreferences');
      return preferences ? JSON.parse(preferences) : {};
    } catch (error) {
      return {};
    }
  };

  const renderAROverlay = () => {
    if (!arMode || !userLocation) return null;

    return (
      <View style={styles.arOverlay}>
        {creators.map((creator, index) => {
          const distance = calculateDistance(userLocation, creator.location);
          const angle = calculateAngle(userLocation, creator.location);
          
          return (
            <ARCreatorMarker
              key={creator.id}
              creator={creator}
              distance={distance}
              angle={angle}
              onPress={() => navigation.navigate('CreatorProfile', { creator })}
            />
          );
        })}
      </View>
    );
  };

  if (hasPermission === null) {
    return <View />;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {arMode ? (
        <>
          <Camera style={styles.camera} type={Camera.Constants.Type.back}>
            {renderAROverlay()}
          </Camera>
          <TouchableOpacity
            style={styles.arToggle}
            onPress={() => setARMode(false)}
          >
            <Text style={styles.arToggleText}>Exit AR</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <ScrollView style={styles.creatorsList}>
            {creators.map((creator, index) => (
              <CreatorDiscoveryCard
                key={creator.id}
                creator={creator}
                onInvest={() => handleInvestment(creator)}
                onViewProfile={() => navigation.navigate('CreatorProfile', { creator })}
              />
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.arToggle}
            onPress={() => setARMode(true)}
          >
            <Text style={styles.arToggleText}>AR View</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

// AR Creator Marker Component
const ARCreatorMarker = ({ creator, distance, angle, onPress }) => {
  const markerRef = useRef();
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for active creators
    if (creator.isLive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          })
        ])
      ).start();
    }
  }, [creator.isLive]);

  const markerStyle = {
    position: 'absolute',
    left: width / 2 + Math.sin(angle) * 100 - 30,
    top: height / 2 - Math.cos(angle) * 100 - 30,
    width: 60,
    height: 60,
    transform: [{ scale: pulseAnimation }]
  };

  return (
    <Animated.View style={markerStyle}>
      <TouchableOpacity style={styles.arMarker} onPress={onPress}>
        <Image source={{ uri: creator.avatar }} style={styles.arCreatorAvatar} />
        <View style={styles.arMarkerInfo}>
          <Text style={styles.arCreatorName}>{creator.name}</Text>
          <Text style={styles.arDistance}>{distance.toFixed(0)}m</Text>
        </View>
        {creator.isLive && <View style={styles.liveIndicator} />}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Biometric Authentication Component
const BiometricAuth = ({ onSuccess, onError }) => {
  const [biometricType, setBiometricType] = useState(null);
  
  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const { LocalAuthentication } = require('expo-local-authentication');
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (compatible) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        setBiometricType(types[0]);
      }
    } catch (error) {
      console.error('Biometric check failed:', error);
    }
  };

  const authenticateWithBiometrics = async () => {
    try {
      const { LocalAuthentication } = require('expo-local-authentication');
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your CreatorFi account',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode'
      });

      if (result.success) {
        onSuccess();
      } else {
        onError('Authentication failed');
      }
    } catch (error) {
      onError(error.message);
    }
  };

  return (
    <View style={styles.biometricContainer}>
      <TouchableOpacity
        style={styles.biometricButton}
        onPress={authenticateWithBiometrics}
      >
        <Text style={styles.biometricText}>
          {biometricType === 1 ? 'Touch ID' : 
           biometricType === 2 ? 'Face ID' : 
           'Biometric Authentication'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Advanced Notification System
const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    setupNotificationListener();
    registerForPushNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const setupNotificationListener = () => {
    Notifications.addNotificationReceivedListener(notification => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationPress(response.notification);
    });
  };

  const registerForPushNotifications = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Permission Required', 'Push notifications are needed for real-time updates.');
        return;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      
      // Send token to backend
      await fetch('/api/notifications/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

    } catch (error) {
      console.error('Push notification setup failed:', error);
    }
  };

  const handleNotificationPress = (notification) => {
    const { data } = notification.request.content;
    
    switch (data.type) {
      case 'investment_update':
        navigation.navigate('Portfolio');
        break;
      case 'revenue_alert':
        navigation.navigate('CreatorDashboard');
        break;
      case 'new_creator':
        navigation.navigate('CreatorProfile', { creatorId: data.creatorId });
        break;
      default:
        navigation.navigate('Notifications');
    }
  };

  return (
    <ScrollView style={styles.notificationsList}>
      {notifications.map((notification, index) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onPress={() => handleNotificationPress(notification)}
        />
      ))}
    </ScrollView>
  );
};

// Utility Functions
const calculateDistance = (location1, location2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = location1.latitude * Math.PI/180;
  const φ2 = location2.latitude * Math.PI/180;
  const Δφ = (location2.latitude-location1.latitude) * Math.PI/180;
  const Δλ = (location2.longitude-location1.longitude) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

const calculateAngle = (location1, location2) => {
  const dLon = (location2.longitude - location1.longitude) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(location2.latitude * Math.PI / 180);
  const x = Math.cos(location1.latitude * Math.PI / 180) * Math.sin(location2.latitude * Math.PI / 180) -
            Math.sin(location1.latitude * Math.PI / 180) * Math.cos(location2.latitude * Math.PI / 180) * Math.cos(dLon);
  
  return Math.atan2(y, x);
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  camera: {
    flex: 1
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between'
  },
  recordingIndicator: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  recordingAnimation: {
    width: 20,
    height: 20,
    marginRight: 8
  },
  recordingText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 50,
    paddingHorizontal: 20
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  controlText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  recordingButton: {
    borderColor: '#ef4444'
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8b5cf6'
  },
  contentGrid: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  successAnimation: {
    width: 100,
    height: 100
  },
  successText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10
  },
  portfolioHeader: {
    backgroundColor: '#8b5cf6',
    paddingTop: 50
  },
  headerBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  portfolioValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5
  },
  portfolioLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20
  },
  investmentsList: {
    flex: 1,
    padding: 20
  },
  investmentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  creatorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12
  },
  creatorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937'
  },
  creatorCategory: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2
  },
  performanceIndicator: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  performanceText: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  cardBody: {
    marginTop: 16
  },
  investmentMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  metric: {
    alignItems: 'center'
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937'
  },
  swipeIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  leftIndicator: {
    left: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16
  },
  rightIndicator: {
    right: 0,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16
  },
  swipeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white'
  },
  arOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  arMarker: {
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    borderRadius: 30,
    padding: 8,
    alignItems: 'center',
    minWidth: 60
  },
  arCreatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4
  },
  arMarkerInfo: {
    alignItems: 'center'
  },
  arCreatorName: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  arDistance: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10
  },
  liveIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444'
  },
  arToggle: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25
  },
  arToggleText: {
    color: 'white',
    fontWeight: 'bold'
  },
  biometricContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  biometricButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25
  },
  biometricText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  notificationsList: {
    flex: 1,
    backgroundColor: '#f8fafc'
  }
});

export {
  CreatorContentHub,
  InvestmentPortfolio,
  CreatorDiscoveryAR,
  BiometricAuth,
  NotificationCenter
};