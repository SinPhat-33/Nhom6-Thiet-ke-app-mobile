import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../theme';
import { getFriendsAPI, updateLocationAPI, getFriendsPOIsAPI, createPOIAPI, bumpAPI } from '../services/api';
import useShakeDetector from '../hooks/useShakeDetector';
import wsService from '../services/websocket';
import { triggerMatchHaptics, triggerMatchSound } from '../services/feedback';

// ====================================================================
// TÍNH KHOẢNG CÁCH HAVERSINE
// ====================================================================
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatDistance = (meters) => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

// Bản đồ Light Silver Minimalist (Zenly Clean Style)
const mapLightStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
  { "featureType": "administrative.land_parcel", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
  { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
  { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "color": "#dce8dc" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "road.arterial", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "road.local", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
  { "featureType": "transit.line", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
  { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9d8e8" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }
];

const MY_EMOJI = '🧑';

const HomeScreen = ({ route, navigation }) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const mapRefCallback = useRef(null);
  const [friends, setFriends] = useState([]);
  const [pois, setPois] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showDistancePopup, setShowDistancePopup] = useState(false);
  const [is3D, setIs3D] = useState(true);
  
  // POI Modal state
  const [showPoiModal, setShowPoiModal] = useState(false);
  const [poiCoords, setPoiCoords] = useState(null);
  const [poiName, setPoiName] = useState('');
  const [poiType, setPoiType] = useState('home'); // home | food | cafe

  // ── Bump / Lắc state (SCRUM-36 & SCRUM-43) ──
  const [isBumping, setIsBumping] = useState(false);       // Đang xử lý bump request
  const [bumpResult, setBumpResult] = useState(null);       // Kết quả từ /api/bump
  const [showBumpModal, setShowBumpModal] = useState(false); // Hiện modal kết quả
  const shakeAnimRef = useRef(new Animated.Value(1)).current; // Animation icon rung

  // Vị trí mặc định (Sài Gòn)
  const defaultRegion = {
    latitude: 10.762622,
    longitude: 106.660172,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // ── Load vị trí lần đầu & Khởi tạo WebSocket ──
  useEffect(() => {
    // 1. Kết nối WebSocket server (SCRUM-44)
    wsService.connect();

    // 2. Lắng nghe event Match_Success từ người khác gửi tới qua WebSocket
    const unsubscribeWS = wsService.onMatchSuccess((matchedUser) => {
      setBumpResult({
        status: 'matched',
        message: `🎉 ${matchedUser.full_name || matchedUser.username} vừa lắc trúng bạn!`,
        matches: [matchedUser],
      });
      setShowBumpModal(true);
    });

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Không có quyền truy cập vị trí');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

      // Gửi vị trí lên backend
      try {
        await updateLocationAPI(loc.coords.latitude, loc.coords.longitude);
      } catch (err) {
        console.log('Update location error:', err);
      }

      // Tự động cuộn tới vị trí hiện tại
      if (mapRefCallback.current) {
        mapRefCallback.current.animateToRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1000);
      }
    })();

    return () => {
      unsubscribeWS();
    };
  }, []);

  // ── Reload bạn bè & POI MỖI KHI tab Home được focus ──
  useFocusEffect(
    useCallback(() => {
      loadFriends();
      loadPOIs();
    }, [])
  );

  // ── Bay tới vị trí bạn bè khi nhấn từ FriendsScreen ──
  useEffect(() => {
    if (route?.params?.friendLat && route?.params?.friendLng && mapRefCallback.current) {
      const { friendLat, friendLng, friendName, friendEmoji } = route.params;
      
      // Bay tới vị trí bạn
      mapRefCallback.current.animateToRegion({
        latitude: friendLat,
        longitude: friendLng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);

      // Tìm bạn trong danh sách và hiện popup khoảng cách
      const friend = friends.find(f => 
        f.latitude === friendLat && f.longitude === friendLng
      ) || {
        full_name: friendName,
        emoji: friendEmoji,
        latitude: friendLat,
        longitude: friendLng,
      };
      
      setTimeout(() => {
        setSelectedFriend(friend);
        setShowDistancePopup(true);
      }, 1200);
    }
  }, [route?.params]);

  const loadFriends = async () => {
    try {
      const res = await getFriendsAPI();
      setFriends(res.friends || []);
    } catch (err) {
      console.log('Load friends error:', err);
    }
  };

  const loadPOIs = async () => {
    try {
      const res = await getFriendsPOIsAPI();
      setPois(res.pois || []);
    } catch (err) {
      console.log('Load pois error:', err);
    }
  };

  // Nút về vị trí hiện tại
  const goToMyLocation = () => {
    if (location && mapRefCallback.current) {
      mapRefCallback.current.animateCamera({
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        pitch: is3D ? 60 : 0,
        zoom: 15,
      }, { duration: 1000 });
    }
  };

  // Nút bật/tắt chế độ 3D (Nghiêng / Phẳng)
  const toggle3D = () => {
    const next3D = !is3D;
    setIs3D(next3D);
    if (mapRefCallback.current) {
      mapRefCallback.current.animateCamera({
        pitch: next3D ? 60 : 0,
      }, { duration: 800 });
    }
  };

  // Bấm vào avatar bạn bè → hiện popup khoảng cách
  const handleFriendPress = (friend) => {
    setSelectedFriend(friend);
    setShowDistancePopup(true);
  };

  // Tính khoảng cách từ mình đến bạn
  const getDistanceToFriend = (friend) => {
    if (!location) return 'Chưa có vị trí';
    const dist = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      friend.latitude,
      friend.longitude
    );
    return formatDistance(dist);
  };

  // Tạo POI
  const handleMapLongPress = (e) => {
    setPoiCoords(e.nativeEvent.coordinate);
    setShowPoiModal(true);
  };

  const submitPOI = async () => {
    if (!poiName.trim()) {
      alert("Vui lòng nhập tên địa điểm");
      return;
    }
    try {
      await createPOIAPI(poiType, poiName.trim(), poiCoords.latitude, poiCoords.longitude);
      setShowPoiModal(false);
      setPoiName('');
      loadPOIs(); // reload
    } catch (err) {
      if (err.status === 401 || err.message?.includes('token')) {
        alert("🔑 Phiên đăng nhập đã hết hạn. Vui lòng sang tab 'Hồ sơ', bấm Đăng xuất và đăng nhập lại.");
      } else {
        alert(err.message || "Lỗi tạo địa điểm");
      }
    }
  };

  const getPoiEmoji = (type) => {
    switch (type) {
      case 'home': return '🏠';
      case 'food': return '🍜';
      case 'cafe': return '☕';
      default: return '📍';
    }
  };

  // ── Xử lý sự kiện lắc điện thoại (SCRUM-36 + SCRUM-43) ──
  const handleShake = useCallback(async () => {
    if (isBumping) return; // Đang xử lý → bỏ qua lắc tiếp theo

    // Animation: rung icon để thông báo đã detect lắc
    Animated.sequence([
      Animated.timing(shakeAnimRef, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimRef, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimRef, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimRef, { toValue: 1.0, duration: 100, useNativeDriver: true }),
    ]).start();

    setIsBumping(true);
    setBumpResult(null);
    setShowBumpModal(true);

    try {
      // Lấy tọa độ GPS hiện tại
      const lat = location?.coords?.latitude;
      const lng = location?.coords?.longitude;

      if (!lat || !lng) {
        setBumpResult({
          status: 'error',
          message: '📍 Chưa lấy được vị trí GPS. Vui lòng bật GPS và thử lại.',
        });
        return;
      }

      // Gọi API bump
      const result = await bumpAPI(lat, lng);
      setBumpResult(result);

      if (result.status === 'matched') {
        // Trigger Haptic Feedback & Sound Effect (SCRUM-48)
        triggerMatchHaptics();
        triggerMatchSound();
      }
    } catch (err) {
      setBumpResult({
        status: 'error',
        message: err.message || '🚫 Lỗi kết nối. Vui lòng thử lại.',
      });
    } finally {
      setIsBumping(false);
    }
  }, [isBumping, location]);

  // Đăng ký hook phát hiện lắc (SCRUM-36)
  useShakeDetector(handleShake, true);

  return (
    <View style={styles.container}>
      {/* BẢN ĐỒ CHÍNH */}
      <MapView
        ref={mapRefCallback}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={defaultRegion}
        customMapStyle={mapLightStyle}
        showsUserLocation={false} 
        showsMyLocationButton={false}
        showsCompass={false}
        pitchEnabled={true}
        pitch={60} // Mặc định nghiêng 3D
        onLongPress={handleMapLongPress}
      >
        {/* ── MARKER CỦA MÌNH (Avatar) ── */}
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.myMarkerWrapper}>
              <View style={styles.myNameBubble}>
                <Text style={styles.myNameText}>Tôi</Text>
              </View>
              <View style={styles.myAvatarBubble}>
                <Text style={styles.myAvatarEmoji}>{MY_EMOJI}</Text>
              </View>
              {/* Vòng sóng radar xung quanh */}
              <View style={styles.radarRing} />
            </View>
          </Marker>
        )}

        {/* ── MARKER CỦA BẠN BÈ ── */}
        {friends.map(friend => (
          <Marker
            key={friend.user_id}
            coordinate={{ latitude: friend.latitude, longitude: friend.longitude }}
            tracksViewChanges={false}
            onPress={() => handleFriendPress(friend)}
          >
            <View style={styles.markerWrapper}>
              {/* Cục tên hiển thị phía trên */}
              <View style={styles.nameBubble}>
                <Text style={styles.nameText}>{friend.full_name || friend.username}</Text>
              </View>

              {/* Hình ảnh/Avatar */}
              <View style={styles.avatarBubble}>
                <Text style={styles.avatarEmoji}>{friend.emoji || '👤'}</Text>
              </View>
            </View>
          </Marker>
        ))}

        {/* ── MARKER POI (Nhà, Quán) ── */}
        {pois.map(poi => (
          <Marker
            key={poi.ID}
            coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
            tracksViewChanges={false}
          >
            <View style={styles.poiMarkerWrapper}>
              <View style={styles.poiBubble}>
                <Text style={styles.poiEmoji}>{getPoiEmoji(poi.type)}</Text>
              </View>
              <Text style={styles.poiNameText}>{poi.name}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* THANH TÌM KIẾM BẠN BÈ */}
      <View style={styles.searchBarContainer}>
        <TouchableOpacity style={styles.searchBar} activeOpacity={0.8}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchText}>Tìm kiếm bạn bè...</Text>
        </TouchableOpacity>
      </View>

      {/* NÚT ĐIỀU KHIỂN BẢN ĐỒ (3D Toggle + Về vị trí) */}
      <View style={styles.mapControlContainer}>
        <TouchableOpacity 
          style={[styles.mapControlButton, is3D && styles.mapControlButtonActive]} 
          onPress={toggle3D}
          activeOpacity={0.8}
        >
          <Text style={[styles.mapControlText, is3D && styles.mapControlTextActive]}>
            {is3D ? '3D' : '2D'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.mapControlButton} 
          onPress={goToMyLocation}
          activeOpacity={0.8}
        >
          <Text style={styles.myLocationIcon}>📍</Text>
        </TouchableOpacity>
      </View>

      {/* ── POPUP KHOẢNG CÁCH KHI NHẤN BẠN BÈ ── */}
      <Modal
        visible={showDistancePopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDistancePopup(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDistancePopup(false)}
        >
          <View style={styles.distancePopup}>
            {selectedFriend && (
              <>
                {/* Avatar lớn */}
                <View style={styles.popupAvatar}>
                  <Text style={styles.popupAvatarEmoji}>
                    {selectedFriend.emoji || '👤'}
                  </Text>
                </View>

                {/* Tên */}
                <Text style={styles.popupName}>
                  {selectedFriend.full_name || selectedFriend.username}
                </Text>
                <Text style={styles.popupUsername}>
                  @{selectedFriend.username}
                </Text>

                {/* Khoảng cách */}
                <View style={styles.distanceContainer}>
                  <Text style={styles.distanceIcon}>📏</Text>
                  <Text style={styles.distanceValue}>
                    {getDistanceToFriend(selectedFriend)}
                  </Text>
                </View>
                <Text style={styles.distanceLabel}>khoảng cách từ bạn</Text>

                <View style={styles.popupActionRow}>
                  {/* Nút Nhắn tin */}
                  <TouchableOpacity
                    style={styles.messagePopupBtn}
                    onPress={() => {
                      setShowDistancePopup(false);
                      navigation.navigate('Chat', {
                        friendId: selectedFriend.user_id,
                        friendName: selectedFriend.full_name || selectedFriend.username,
                        friendAvatar: selectedFriend.emoji || '👤'
                      });
                    }}
                  >
                    <Text style={styles.messagePopupText}>💬 Nhắn tin</Text>
                  </TouchableOpacity>

                  {/* Nút đóng */}
                  <TouchableOpacity
                    style={styles.closePopupBtn}
                    onPress={() => setShowDistancePopup(false)}
                  >
                    <Text style={styles.closePopupText}>Đóng</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── POPUP TẠO POI ── */}
      <Modal
        visible={showPoiModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPoiModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPoiModal(false)}
        >
          <View style={styles.poiModalContainer}>
            <Text style={styles.poiModalTitle}>Tạo địa điểm mới</Text>
            <Text style={styles.poiModalSubtitle}>Chia sẻ vị trí này cho bạn bè</Text>
            
            <View style={styles.poiTypeSelector}>
              <TouchableOpacity style={[styles.poiTypeBtn, poiType === 'home' && styles.poiTypeActive]} onPress={() => setPoiType('home')}>
                <Text style={styles.poiTypeEmoji}>🏠</Text>
                <Text style={[styles.poiTypeText, poiType === 'home' && styles.poiTypeTextActive]}>Nhà ở</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.poiTypeBtn, poiType === 'food' && styles.poiTypeActive]} onPress={() => setPoiType('food')}>
                <Text style={styles.poiTypeEmoji}>🍜</Text>
                <Text style={[styles.poiTypeText, poiType === 'food' && styles.poiTypeTextActive]}>Quán ăn</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.poiTypeBtn, poiType === 'cafe' && styles.poiTypeActive]} onPress={() => setPoiType('cafe')}>
                <Text style={styles.poiTypeEmoji}>☕</Text>
                <Text style={[styles.poiTypeText, poiType === 'cafe' && styles.poiTypeTextActive]}>Cafe</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.poiInput}
              placeholder="Tên địa điểm (vd: Nhà của tôi)"
              placeholderTextColor={COLORS.textMuted}
              value={poiName}
              onChangeText={setPoiName}
            />

            <View style={styles.poiActionRow}>
              <TouchableOpacity style={styles.poiCancelBtn} onPress={() => setShowPoiModal(false)}>
                <Text style={styles.poiCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.poiSubmitBtn} onPress={submitPOI}>
                <Text style={styles.poiSubmitText}>Tạo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── NÚT LẮC THỦ CÔNG (FAB) — cho phép test không cần lắc thật ── */}
      <Animated.View
        style={[
          styles.shakeFabContainer,
          { transform: [{ scale: shakeAnimRef }] },
        ]}
      >
        <TouchableOpacity
          style={[styles.shakeFab, isBumping && styles.shakeFabActive]}
          onPress={handleShake}
          activeOpacity={0.8}
          disabled={isBumping}
        >
          {isBumping ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.shakeFabIcon}>📳</Text>
          )}
          <Text style={styles.shakeFabText}>
            {isBumping ? 'Đang quét...' : 'Lắc / Bump'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── BUMP RESULT MODAL (SCRUM-43) ── */}
      <Modal
        visible={showBumpModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBumpModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !isBumping && setShowBumpModal(false)}
        >
          <View style={styles.bumpModalContainer}>
            {/* Header */}
            <View style={styles.bumpModalHandle} />
            <Text style={styles.bumpModalTitle}>
              {isBumping ? '🔍 Đang tìm kiếm...' : (
                bumpResult?.status === 'matched' ? '🎉 Tìm thấy rồi!' :
                bumpResult?.status === 'no_match' ? '😔 Không tìm thấy ai' :
                '⚠️ Lỗi'
              )}
            </Text>

            {/* LOADING STATE */}
            {isBumping && (
              <View style={styles.bumpLoadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.bumpLoadingText}>
                  Đang quét người dùng quanh bạn trong bán kính 100m...
                </Text>
              </View>
            )}

            {/* NO MATCH / WARNING (Edge Case 1) */}
            {!isBumping && bumpResult?.status === 'no_match' && (
              <View style={styles.bumpNoMatchContainer}>
                <Text style={styles.bumpNoMatchEmoji}>😕</Text>
                <Text style={styles.bumpNoMatchText}>{bumpResult.message}</Text>
                <Text style={styles.bumpHintText}>
                  Đảm bảo bạn và người kia cùng lắc điện thoại trong vòng 5 giây!
                </Text>
              </View>
            )}

            {/* MATCHED — 1 người (Edge Case 2 - ghép đôi) */}
            {!isBumping && bumpResult?.status === 'matched' && bumpResult?.matches?.length > 0 && (
              <View style={styles.bumpMatchContainer}>
                <Text style={styles.bumpMatchMessage}>{bumpResult.message}</Text>

                {/* Danh sách người được match */}
                {bumpResult.matches.map((match, index) => (
                  <View key={match.user_id} style={[
                    styles.bumpMatchCard,
                    index === 0 && styles.bumpMatchCardBest,
                  ]}>
                    <View style={styles.bumpMatchAvatarCircle}>
                      <Text style={styles.bumpMatchAvatar}>
                        {match.avatar_url || '👤'}
                      </Text>
                    </View>
                    <View style={styles.bumpMatchInfo}>
                      {index === 0 && (
                        <Text style={styles.bumpMatchBadge}>⭐ Gần nhất</Text>
                      )}
                      <Text style={styles.bumpMatchName}>
                        {match.full_name || match.username}
                      </Text>
                      <Text style={styles.bumpMatchUsername}>@{match.username}</Text>
                      <Text style={styles.bumpMatchDistance}>
                        📏 {match.distance_meters < 1000
                          ? `${Math.round(match.distance_meters)} m`
                          : `${(match.distance_meters / 1000).toFixed(1)} km`}
                      </Text>
                    </View>
                  </View>
                ))}

                {/* Nút Chụp ảnh Locket Kỷ niệm (SCRUM-49) */}
                <TouchableOpacity
                  style={styles.locketCameraBtn}
                  onPress={() => {
                    setShowBumpModal(false);
                    navigation.navigate('Camera', {
                      matchedUser: bumpResult.matches[0],
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.locketCameraBtnText}>📷 Chụp ảnh Locket kỷ niệm</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ERROR STATE */}
            {!isBumping && bumpResult?.status === 'error' && (
              <View style={styles.bumpNoMatchContainer}>
                <Text style={styles.bumpNoMatchEmoji}>🚫</Text>
                <Text style={styles.bumpNoMatchText}>{bumpResult.message}</Text>
              </View>
            )}

            {/* Nút đóng */}
            {!isBumping && (
              <TouchableOpacity
                style={styles.bumpCloseBtn}
                onPress={() => setShowBumpModal(false)}
              >
                <Text style={styles.bumpCloseBtnText}>Đóng</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // === Marker của Mình ===
  myMarkerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
    height: 100,
  },
  myNameBubble: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  myNameText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  myAvatarBubble: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 2,
  },
  myAvatarEmoji: {
    fontSize: 26,
  },
  radarRing: {
    position: 'absolute',
    bottom: 0,
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'rgba(79, 70, 229, 0.2)',
    backgroundColor: 'rgba(79, 70, 229, 0.06)',
    zIndex: 1,
  },

  // === Marker của Bạn bè ===
  markerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 90,
  },
  nameBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  nameText: {
    color: '#1E293B',
    fontSize: 10,
    fontWeight: 'bold',
  },
  avatarBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#6366F1',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  avatarEmoji: {
    fontSize: 22,
  },

  // === Thanh tìm kiếm ===
  searchBarContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '500',
  },

  // === Floating Control Buttons ===
  mapControlContainer: {
    position: 'absolute',
    right: 20,
    bottom: 110,
    gap: 12,
  },
  mapControlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
  mapControlButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  mapControlText: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '800',
  },
  mapControlTextActive: {
    color: '#FFFFFF',
  },
  myLocationButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
  myLocationIcon: {
    fontSize: 22,
  },

  // === Modal Overlay ===
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // === Popup Khoảng Cách ===
  distancePopup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    width: Dimensions.get('window').width * 0.78,
    borderWidth: 1,
    borderColor: '#F1F3F5',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 20,
  },
  popupAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F3F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4F46E5',
    marginBottom: 12,
  },
  popupAvatarEmoji: {
    fontSize: 36,
  },
  popupName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  popupUsername: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 16,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  distanceIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  distanceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4F46E5',
  },
  distanceLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 18,
  },
  popupActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  messagePopupBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  messagePopupText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  closePopupBtn: {
    backgroundColor: '#F1F3F5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  closePopupText: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '700',
  },

  // === POI Marker ===
  poiMarkerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  poiBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  poiEmoji: {
    fontSize: 16,
  },
  poiNameText: {
    fontSize: 10,
    color: '#1E293B',
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // === POI Modal ===
  poiModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    width: Dimensions.get('window').width * 0.85,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 20,
  },
  poiModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  poiModalSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
  },
  poiTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  poiTypeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F3F5',
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  poiTypeActive: {
    borderColor: '#4F46E5',
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
  },
  poiTypeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  poiTypeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  poiTypeTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  poiInput: {
    backgroundColor: '#F1F3F5',
    borderRadius: 14,
    padding: 14,
    color: '#1E293B',
    fontSize: 16,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  poiActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  poiCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  poiCancelText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  poiSubmitBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  poiSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // === SHAKE FAB BUTTON — Indigo + soft glow shadow ===
  shakeFabContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    zIndex: 10,
  },
  shakeFab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 32,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  shakeFabActive: {
    backgroundColor: '#4338CA',
  },
  shakeFabIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  shakeFabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },

  // === BUMP RESULT MODAL — White bottom sheet ===
  bumpModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: SPACING.xl,
    paddingBottom: 40,
    maxHeight: '80%',
    width: '100%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 20,
  },
  bumpModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  bumpModalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },

  // Loading state
  bumpLoadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  bumpLoadingText: {
    color: '#64748B',
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginTop: SPACING.lg,
    lineHeight: 20,
  },

  // No match state
  bumpNoMatchContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  bumpNoMatchEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  bumpNoMatchText: {
    fontSize: FONT_SIZES.md,
    color: '#1E293B',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  bumpHintText: {
    fontSize: FONT_SIZES.xs,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },

  // Match state
  bumpMatchContainer: {
    marginBottom: SPACING.md,
  },
  bumpMatchMessage: {
    fontSize: FONT_SIZES.sm,
    color: '#4F46E5',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  bumpMatchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bumpMatchCardBest: {
    borderColor: '#4F46E5',
    backgroundColor: 'rgba(79, 70, 229, 0.06)',
  },
  bumpMatchAvatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F3F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  bumpMatchAvatar: {
    fontSize: 26,
  },
  bumpMatchInfo: {
    flex: 1,
  },
  bumpMatchBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 2,
  },
  bumpMatchName: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  bumpMatchUsername: {
    fontSize: FONT_SIZES.xs,
    color: '#64748B',
    marginBottom: 2,
  },
  bumpMatchDistance: {
    fontSize: FONT_SIZES.xs,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Nút đóng
  bumpCloseBtn: {
    backgroundColor: '#F1F3F5',
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  bumpCloseBtnText: {
    color: '#1E293B',
    fontWeight: '700',
    fontSize: FONT_SIZES.md,
  },

  // Nút Locket Camera — Electric Pink accent
  locketCameraBtn: {
    backgroundColor: '#EC4899',
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  locketCameraBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: FONT_SIZES.md,
  },
});

export default HomeScreen;

