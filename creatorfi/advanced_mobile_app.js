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