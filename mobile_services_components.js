// src/services/APIService.js - Mobile API Client
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';

class APIService {
  constructor() {
    this.baseURL = __DEV__ 
      ? 'http://localhost:3001/api'
      : 'https://api.yourdomain.com/api';
    this.wsURL = __DEV__
      ? 'ws://localhost:3001'
      : 'wss://api.yourdomain.com';
    
    this.authToken = null;
    this.isOnline = true;
    this.requestQueue = [];
    
    this.initializeNetworkMonitoring();
  }

  async initializeNetworkMonitoring() {
    // Monitor network connectivity
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected;
      
      if (this.isOnline && this.requestQueue.length > 0) {
        this.processQueuedRequests();
      }
    });
  }

  async setAuthToken(token) {
    this.authToken = token;
    if (token) {
      await AsyncStorage.setItem('authToken', token);
    } else {
      await AsyncStorage.removeItem('authToken');
    }
  }

  async getAuthToken() {
    if (!this.authToken) {
      this.authToken = await AsyncStorage.getItem('authToken');
    }
    return this.authToken;
  }

  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      data = null,
      headers = {},
      requiresAuth = true,
      retryOnFailure = true,
      cacheResponse = false
    } = options;

    // Check for cached response first
    if (method === 'GET' && cacheResponse) {
      const cached = await this.getCachedResponse(endpoint);
      if (cached) return cached;
    }

    // Queue request if offline
    if (!this.isOnline && method !== 'GET') {
      return this.queueRequest(endpoint, options);
    }

    const url = `${this.baseURL}${endpoint}`;
    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    // Add auth token if required
    if (requiresAuth) {
      const token = await this.getAuthToken();
      if (token) {
        requestOptions.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Add body for non-GET requests
    if (data && method !== 'GET') {
      requestOptions.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, requestOptions);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP ${response.status}`);
      }

      // Cache successful GET responses
      if (method === 'GET' && cacheResponse) {
        await this.setCachedResponse(endpoint, responseData);
      }

      return responseData;

    } catch (error) {
      console.error(`API request failed: ${method} ${endpoint}`, error);

      // Return cached data for GET requests if available
      if (method === 'GET') {
        const cached = await this.getCachedResponse(endpoint);
        if (cached) {
          console.log('Returning cached data due to network error');
          return { ...cached, fromCache: true };
        }
      }

      // Retry logic for failed requests
      if (retryOnFailure && this.shouldRetry(error)) {
        console.log('Retrying request...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.request(endpoint, { ...options, retryOnFailure: false });
      }

      throw error;
    }
  }

  async get(endpoint, params = {}, options = {}) {
    let url = endpoint;
    if (Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }
    
    return this.request(url, { 
      method: 'GET', 
      cacheResponse: true,
      ...options 
    });
  }

  async post(endpoint, data = {}, options = {}) {
    return this.request(endpoint, { 
      method: 'POST', 
      data, 
      ...options 
    });
  }

  async put(endpoint, data = {}, options = {}) {
    return this.request(endpoint, { 
      method: 'PUT', 
      data, 
      ...options 
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { 
      method: 'DELETE', 
      ...options 
    });
  }

  async queueRequest(endpoint, options) {
    const queuedRequest = {
      endpoint,
      options,
      timestamp: Date.now()
    };

    this.requestQueue.push(queuedRequest);
    await AsyncStorage.setItem('requestQueue', JSON.stringify(this.requestQueue));

    return {
      success: false,
      queued: true,
      message: 'Request queued for when connection is restored'
    };
  }

  async processQueuedRequests() {
    const queue = [...this.requestQueue];
    this.requestQueue = [];

    for (const queuedRequest of queue) {
      try {
        await this.request(queuedRequest.endpoint, queuedRequest.options);
        console.log('Processed queued request:', queuedRequest.endpoint);
      } catch (error) {
        console.error('Failed to process queued request:', error);
        // Re-queue if still failing
        this.requestQueue.push(queuedRequest);
      }
    }

    await AsyncStorage.setItem('requestQueue', JSON.stringify(this.requestQueue));
  }

  async getCachedResponse(endpoint) {
    try {
      const cached = await AsyncStorage.getItem(`cache_${endpoint}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache valid for 5 minutes
        if (Date.now() - timestamp < 300000) {
          return data;
        }
      }
    } catch (error) {
      console.error('Cache retrieval error:', error);
    }
    return null;
  }

  async setCachedResponse(endpoint, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(`cache_${endpoint}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }

  shouldRetry(error) {
    // Retry on network errors, not on 4xx client errors
    return !error.message.includes('HTTP 4');
  }
}

export default new APIService();

// ================================
// src/services/SyncService.js - Mobile Data Synchronization
// ================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundJob from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';
import io from 'socket.io-client';
import APIService from './APIService';

class SyncService {
  constructor() {
    this.socket = null;
    this.userId = null;
    this.syncQueue = [];
    this.isOnline = true;
    this.lastSyncTime = null;
    this.syncInProgress = false;
  }

  async initialize(userId) {
    this.userId = userId;
    
    // Load stored sync queue
    await this.loadSyncQueue();
    
    // Initialize WebSocket connection
    await this.initializeWebSocket();
    
    // Monitor network connectivity
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected;
      if (this.isOnline && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    });

    // Start background sync
    this.startBackgroundSync();
  }

  async initializeWebSocket() {
    if (!this.userId) return;

    try {
      this.socket = io(APIService.wsURL, {
        transports: ['websocket'],
        timeout: 20000,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.authenticateSocket();
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });

      this.socket.on('data_sync', (data) => {
        this.handleIncomingSync(data);
      });

      this.socket.on('auth_error', () => {
        console.error('WebSocket authentication failed');
      });

    } catch (error) {
      console.error('WebSocket initialization error:', error);
    }
  }

  async authenticateSocket() {
    if (this.socket && this.socket.connected) {
      const token = await APIService.getAuthToken();
      this.socket.emit('authenticate', token);
    }
  }

  async syncData(data, strategy = 'merge') {
    if (!this.userId) return { success: false, error: 'User not initialized' };

    const syncRequest = {
      userId: this.userId,
      data,
      strategy,
      timestamp: new Date().toISOString(),
      platform: 'MOBILE'
    };

    if (!this.isOnline) {
      // Queue for later processing
      await this.queueSyncRequest(syncRequest);
      return { success: false, queued: true };
    }

    try {
      this.syncInProgress = true;
      
      const response = await APIService.post('/sync', syncRequest);
      
      if (response.success) {
        this.lastSyncTime = new Date().toISOString();
        await AsyncStorage.setItem('lastSyncTime', this.lastSyncTime);
        
        // Store synced data locally
        await this.storeLocalData(response.data);
      }

      return response;

    } catch (error) {
      console.error('Sync error:', error);
      
      // Queue for retry
      await this.queueSyncRequest(syncRequest);
      
      return { success: false, error: error.message };
    } finally {
      this.syncInProgress = false;
    }
  }

  async queueSyncRequest(syncRequest) {
    this.syncQueue.push(syncRequest);
    await AsyncStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
  }

  async loadSyncQueue() {
    try {
      const stored = await AsyncStorage.getItem('syncQueue');
      if (stored) {
        this.syncQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  async processSyncQueue() {
    if (this.syncInProgress || this.syncQueue.length === 0) return;

    const queue = [...this.syncQueue];
    this.syncQueue = [];

    for (const syncRequest of queue) {
      try {
        const response = await APIService.post('/sync', syncRequest);
        if (response.success) {
          console.log('Processed queued sync request');
        } else {
          // Re-queue if failed
          this.syncQueue.push(syncRequest);
        }
      } catch (error) {
        console.error('Failed to process sync request:', error);
        this.syncQueue.push(syncRequest);
      }
    }

    await AsyncStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
  }

  async handleIncomingSync(syncData) {
    try {
      // Store incoming synced data
      await this.storeLocalData(syncData.data);
      
      // Emit event for UI updates
      this.emit('dataUpdated', syncData);
      
    } catch (error) {
      console.error('Failed to handle incoming sync:', error);
    }
  }

  async storeLocalData(data) {
    try {
      // Store different data types separately
      if (data.bonds) {
        await AsyncStorage.setItem('userBonds', JSON.stringify(data.bonds));
      }
      
      if (data.tokens) {
        await AsyncStorage.setItem('userTokens', JSON.stringify(data.tokens));
      }
      
      if (data.profile) {
        await AsyncStorage.setItem('userProfile', JSON.stringify(data.profile));
      }

      // Update last sync time
      await AsyncStorage.setItem('lastDataUpdate', new Date().toISOString());
      
    } catch (error) {
      console.error('Failed to store local data:', error);
    }
  }

  async getLocalData(dataType) {
    try {
      const stored = await AsyncStorage.getItem(dataType);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get local data:', error);
      return null;
    }
  }

  async startBackgroundSync() {
    // Set up periodic background sync (every 15 minutes)
    BackgroundJob.start({
      taskName: 'syncData',
      taskTitle: 'Syncing your data',
      taskDesc: 'Keeping your bonds and tokens up to date',
      taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
      },
      parameters: {
        delay: 15 * 60 * 1000, // 15 minutes
      },
    });

    BackgroundJob.on('syncData', async () => {
      if (this.isOnline && !this.syncInProgress) {
        await this.processSyncQueue();
      }
    });
  }

  async startRealTimeSync() {
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    }
  }

  cleanup() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    BackgroundJob.stop('syncData');
  }

  // EventEmitter-like functionality
  listeners = {};

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

export default new SyncService();

// ================================
// src/services/NotificationService.js - Mobile Push Notifications
// ================================

import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidStyle } from '@notifee/react-native';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import APIService from './APIService';

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.userId = null;
    this.fcmToken = null;
  }

  async initialize(userId) {
    if (this.isInitialized) return;

    this.userId = userId;
    
    try {
      // Request permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('Push notification permission denied');
        return;
      }

      // Get FCM token
      this.fcmToken = await messaging().getToken();
      console.log('FCM Token:', this.fcmToken);

      // Register device with backend
      if (this.fcmToken) {
        await this.registerDevice();
      }

      // Create notification channels (Android)
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

      // Set up message handlers
      this.setupMessageHandlers();

      this.isInitialized = true;
      console.log('Notification service initialized');

    } catch (error) {
      console.error('Notification service initialization error:', error);
    }
  }

  async registerDevice() {
    try {
      await APIService.post('/notifications/subscribe', {
        subscription: {
          token: this.fcmToken,
          platform: Platform.OS.toUpperCase()
        },
        platform: Platform.OS === 'ios' ? 'MOBILE_IOS' : 'MOBILE_ANDROID'
      });

      console.log('Device registered for push notifications');
    } catch (error) {
      console.error('Device registration error:', error);
    }
  }

  async createNotificationChannels() {
    // High importance channel for urgent notifications
    await notifee.createChannel({
      id: 'urgent',
      name: 'Urgent Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    // Default channel for regular notifications
    await notifee.createChannel({
      id: 'default',
      name: 'General Notifications',
      importance: AndroidImportance.DEFAULT,
      sound: 'default',
    });

    // Low importance channel for promotional content
    await notifee.createChannel({
      id: 'promotional',
      name: 'Promotional',
      importance: AndroidImportance.LOW,
    });
  }

  setupMessageHandlers() {
    // Handle foreground messages
    messaging().onMessage(async remoteMessage => {
      await this.handleForegroundNotification(remoteMessage);
    });

    // Handle background/quit state messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      await this.handleBackgroundNotification(remoteMessage);
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp(remoteMessage => {
      this.handleNotificationPress(remoteMessage);
    });

    // Check if app was opened from notification (app was quit)
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        this.handleNotificationPress(remoteMessage);
      }
    });
  }

  async handleForegroundNotification(remoteMessage) {
    console.log('Foreground notification:', remoteMessage);

    // Show local notification when app is in foreground
    await this.displayLocalNotification(remoteMessage);
    
    // Store notification for later viewing
    await this.storeNotification(remoteMessage);
  }

  async handleBackgroundNotification(remoteMessage) {
    console.log('Background notification:', remoteMessage);
    
    // Store notification for later viewing
    await this.storeNotification(remoteMessage);
  }

  async displayLocalNotification(remoteMessage) {
    const { notification, data } = remoteMessage;

    try {
      // Determine notification channel based on priority
      let channelId = 'default';
      if (data.priority === 'HIGH' || data.priority === 'URGENT') {
        channelId = 'urgent';
      } else if (data.type === 'PROMOTIONAL') {
        channelId = 'promotional';
      }

      const notificationConfig = {
        title: notification.title,
        body: notification.body,
        data: data,
        android: {
          channelId,
          smallIcon: 'ic_notification',
          color: '#6366f1',
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'default',
          categoryId: 'default',
        },
      };

      // Add action buttons based on notification type
      if (data.type === 'BOND_CREATED' || data.type === 'BOND_SUPPORTED') {
        notificationConfig.android.actions = [
          {
            title: 'View Bond',
            pressAction: { id: 'view_bond' },
          },
          {
            title: 'Support Now',
            pressAction: { id: 'support_bond' },
          },
        ];
      }

      await notifee.displayNotification(notificationConfig);
    } catch (error) {
      console.error('Failed to display local notification:', error);
    }
  }

  async storeNotification(remoteMessage) {
    try {
      const { notification, data } = remoteMessage;
      
      const storedNotification = {
        id: data.notificationId || Date.now().toString(),
        title: notification.title,
        body: notification.body,
        data: data,
        timestamp: new Date().toISOString(),
        read: false,
      };

      // Get existing notifications
      const existing = await AsyncStorage.getItem('notifications');
      const notifications = existing ? JSON.parse(existing) : [];

      // Add new notification to the beginning
      notifications.unshift(storedNotification);

      // Keep only last 100 notifications
      const trimmed = notifications.slice(0, 100);

      // Store updated notifications
      await AsyncStorage.setItem('notifications', JSON.stringify(trimmed));

      // Update badge count
      await this.updateBadgeCount();

    } catch (error) {
      console.error('Failed to store notification:', error);
    }
  }

  async updateBadgeCount() {
    try {
      const stored = await AsyncStorage.getItem('notifications');
      if (stored) {
        const notifications = JSON.parse(stored);
        const unreadCount = notifications.filter(n => !n.read).length;
        
        if (Platform.OS === 'ios') {
          notifee.setBadgeCount(unreadCount);
        }
      }
    } catch (error) {
      console.error('Failed to update badge count:', error);
    }
  }

  async handleNotificationPress(remoteMessage) {
    console.log('Notification pressed:', remoteMessage);

    const { data } = remoteMessage;
    
    // Navigate based on notification type
    // This would integrate with your navigation system
    const navigationData = {
      type: data.type,
      bondId: data.bondId,
      tokenId: data.tokenId,
      creatorId: data.creatorId,
    };

    // Emit navigation event
    this.emit('notificationPressed', navigationData);
  }

  async getStoredNotifications() {
    try {
      const stored = await AsyncStorage.getItem('notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get stored notifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      const stored = await AsyncStorage.getItem('notifications');
      if (stored) {
        const notifications = JSON.parse(stored);
        const updated = notifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        );
        
        await AsyncStorage.setItem('notifications', JSON.stringify(updated));
        await this.updateBadgeCount();
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async markAllNotificationsAsRead() {
    try {
      const stored = await AsyncStorage.getItem('notifications');
      if (stored) {
        const notifications = JSON.parse(stored);
        const updated = notifications.map(n => ({ ...n, read: true }));
        
        await AsyncStorage.setItem('notifications', JSON.stringify(updated));
        await this.updateBadgeCount();
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  cleanup() {
    // Cleanup when user logs out
    this.isInitialized = false;
    this.userId = null;
    this.fcmToken = null;
  }

  // EventEmitter-like functionality
  listeners = {};

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

export default new NotificationService();