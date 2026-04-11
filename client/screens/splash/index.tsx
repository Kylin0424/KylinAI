import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 动画时间配置（总时长5秒）
const TIMING = {
  // 阶段1：书本出现并平放展示 (0-800ms)
  BOOK_APPEAR: 0,
  BOOK_APPEAR_DURATION: 800,
  
  // 阶段2：左手进入并翻书 (800-2200ms)
  LEFT_HAND_ENTER: 800,
  LEFT_HAND_ENTER_DURATION: 600,
  PAGE_FLIP_START: 1200,
  PAGE_FLIP_DURATION: 800,
  
  // 阶段3：书本缩小成LOGO (2200-3000ms)
  BOOK_SHRINK: 2200,
  BOOK_SHRINK_DURATION: 800,
  
  // 阶段4：右手和钢笔进入 (3000-4000ms)
  RIGHT_HAND_ENTER: 3000,
  RIGHT_HAND_ENTER_DURATION: 600,
  PEN_ENTER_DELAY: 3200,
  
  // 阶段5：LOGO圆圈出现，文字出现 (4000-4800ms)
  LOGO_CIRCLE_APPEAR: 4000,
  TEXT_APPEAR: 4400,
  
  // 总时长
  TOTAL: 5000,
};

export default function SplashScreen() {
  const { theme } = useTheme();
  const router = useSafeRouter();

  // ============ 动画值 ============
  
  // 书本动画
  const bookScale = useSharedValue(0);
  const bookOpacity = useSharedValue(0);
  
  // 左手动画
  const leftHandX = useSharedValue(-100);
  const leftHandOpacity = useSharedValue(0);
  const leftHandRotation = useSharedValue(0); // 翻书动作
  
  // 书页翻转
  const pageRotateY = useSharedValue(0);
  const pageOpacity = useSharedValue(1);
  
  // 右手动画
  const rightHandX = useSharedValue(100);
  const rightHandOpacity = useSharedValue(0);
  
  // 钢笔动画
  const penX = useSharedValue(50);
  const penOpacity = useSharedValue(0);
  const penRotation = useSharedValue(0);
  
  // LOGO圆圈（独立元素，最后出现）
  const circleScale = useSharedValue(0);
  const circleOpacity = useSharedValue(0);
  
  // 文字动画
  const textOpacity = useSharedValue(0);
  const textY = useSharedValue(20);

  // 跳转到首页
  const navigateToHome = () => {
    router.replace('/home');
  };

  useEffect(() => {
    // ============ 阶段1：书本出现 (0-800ms) ============
    bookOpacity.value = withTiming(1, { duration: TIMING.BOOK_APPEAR_DURATION });
    bookScale.value = withSpring(1, { damping: 12, stiffness: 80 });

    // ============ 阶段2：左手进入并翻书 (800-2200ms) ============
    leftHandOpacity.value = withDelay(
      TIMING.LEFT_HAND_ENTER,
      withTiming(1, { duration: TIMING.LEFT_HAND_ENTER_DURATION })
    );
    leftHandX.value = withDelay(
      TIMING.LEFT_HAND_ENTER,
      withSpring(0, { damping: 15, stiffness: 100 })
    );
    
    // 左手翻书动作
    leftHandRotation.value = withDelay(
      TIMING.PAGE_FLIP_START,
      withTiming(-45, { duration: TIMING.PAGE_FLIP_DURATION, easing: Easing.out(Easing.cubic) })
    );
    
    // 书页翻转
    pageRotateY.value = withDelay(
      TIMING.PAGE_FLIP_START,
      withTiming(-180, { duration: TIMING.PAGE_FLIP_DURATION, easing: Easing.out(Easing.cubic) })
    );
    pageOpacity.value = withDelay(
      TIMING.PAGE_FLIP_START + 400,
      withTiming(0, { duration: 400 })
    );

    // ============ 阶段3：书本缩小成LOGO (2200-3000ms) ============
    bookScale.value = withDelay(
      TIMING.BOOK_SHRINK,
      withTiming(0.6, { duration: TIMING.BOOK_SHRINK_DURATION, easing: Easing.inOut(Easing.cubic) })
    );
    leftHandOpacity.value = withDelay(
      TIMING.BOOK_SHRINK,
      withTiming(0, { duration: 400 })
    );

    // ============ 阶段4：右手和钢笔进入 (3000-4000ms) ============
    rightHandOpacity.value = withDelay(
      TIMING.RIGHT_HAND_ENTER,
      withTiming(1, { duration: TIMING.RIGHT_HAND_ENTER_DURATION })
    );
    rightHandX.value = withDelay(
      TIMING.RIGHT_HAND_ENTER,
      withSpring(0, { damping: 15, stiffness: 100 })
    );
    
    penOpacity.value = withDelay(
      TIMING.PEN_ENTER_DELAY,
      withTiming(1, { duration: 400 })
    );
    penX.value = withDelay(
      TIMING.PEN_ENTER_DELAY,
      withSpring(0, { damping: 12, stiffness: 80 })
    );
    penRotation.value = withDelay(
      TIMING.PEN_ENTER_DELAY + 200,
      withTiming(-30, { duration: 400, easing: Easing.out(Easing.cubic) })
    );

    // ============ 阶段5：LOGO圆圈和文字 (4000-4800ms) ============
    circleOpacity.value = withDelay(
      TIMING.LOGO_CIRCLE_APPEAR,
      withTiming(1, { duration: 500 })
    );
    circleScale.value = withDelay(
      TIMING.LOGO_CIRCLE_APPEAR,
      withSpring(1, { damping: 10, stiffness: 80 })
    );
    
    // 隐藏右手，只保留书和笔
    rightHandOpacity.value = withDelay(
      TIMING.LOGO_CIRCLE_APPEAR,
      withTiming(0, { duration: 300 })
    );
    
    textOpacity.value = withDelay(
      TIMING.TEXT_APPEAR,
      withTiming(1, { duration: 400 })
    );
    textY.value = withDelay(
      TIMING.TEXT_APPEAR,
      withSpring(0, { damping: 15, stiffness: 100 })
    );

    // ============ 5秒后跳转 ============
    const timer = setTimeout(() => {
      navigateToHome();
    }, TIMING.TOTAL);

    return () => clearTimeout(timer);
  }, []);

  // ============ 动画样式 ============

  // 书本样式
  const bookStyle = useAnimatedStyle(() => ({
    opacity: bookOpacity.value,
    transform: [
      { scale: bookScale.value },
    ],
  }));

  // 左手样式
  const leftHandStyle = useAnimatedStyle(() => ({
    opacity: leftHandOpacity.value,
    transform: [
      { translateX: leftHandX.value },
      { rotate: `${leftHandRotation.value}deg` },
    ],
  }));

  // 书页样式
  const pageStyle = useAnimatedStyle(() => ({
    opacity: pageOpacity.value,
    transform: [
      { perspective: 1000 },
      { rotateY: `${pageRotateY.value}deg` },
    ],
  }));

  // 右手样式
  const rightHandStyle = useAnimatedStyle(() => ({
    opacity: rightHandOpacity.value,
    transform: [
      { translateX: rightHandX.value },
    ],
  }));

  // 钢笔样式
  const penStyle = useAnimatedStyle(() => ({
    opacity: penOpacity.value,
    transform: [
      { translateX: penX.value },
      { rotate: `${penRotation.value}deg` },
    ],
  }));

  // LOGO圆圈样式（独立的边框效果，最后出现）
  const circleStyle = useAnimatedStyle(() => ({
    opacity: circleOpacity.value,
    transform: [{ scale: circleScale.value }],
  }));

  // 文字样式
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {/* 动画舞台 */}
      <View style={styles.stage}>
        {/* LOGO圆圈边框（最后出现，作为装饰） */}
        <Animated.View style={[styles.logoCircle, circleStyle]} pointerEvents="none" />
        
        {/* 书本主体（独立元素，不受圆圈影响） */}
        <Animated.View style={[styles.bookContainer, bookStyle]}>
          {/* 书本 */}
          <View style={styles.book}>
            {/* 左页 */}
            <View style={styles.leftPage}>
              <View style={styles.pageLines}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={styles.pageLine} />
                ))}
              </View>
            </View>
            {/* 右页 */}
            <View style={styles.rightPage}>
              <View style={styles.pageLines}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={styles.pageLine} />
                ))}
              </View>
            </View>
            {/* 翻转的书页 */}
            <Animated.View style={[styles.flipPage, pageStyle]}>
              <View style={styles.pageLines}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={styles.pageLine} />
                ))}
              </View>
            </Animated.View>
          </View>

          {/* 左手（翻书后消失） */}
          <Animated.View style={[styles.leftHandContainer, leftHandStyle]}>
            <View style={styles.hand}>
              <View style={styles.palm} />
              <View style={[styles.finger, { height: 24 }]} />
              <View style={[styles.finger, { height: 28, marginLeft: -2 }]} />
              <View style={[styles.finger, { height: 24, marginLeft: -2 }]} />
            </View>
          </Animated.View>

          {/* 右手拿钢笔（最后消失，只保留钢笔） */}
          <Animated.View style={[styles.rightHandContainer, rightHandStyle]}>
            <View style={styles.hand}>
              <View style={styles.palm} />
              <View style={[styles.finger, { height: 18, width: 7 }]} />
              <View style={[styles.finger, { height: 20, width: 7, marginLeft: -2 }]} />
            </View>
          </Animated.View>
        </Animated.View>

        {/* 钢笔（最终LOGO的一部分） */}
        <Animated.View style={[styles.penContainer, penStyle]}>
          <View style={styles.pen}>
            <View style={styles.penBody} />
            <View style={styles.penTip} />
          </View>
        </Animated.View>
      </View>

      {/* 应用名称 */}
      <Animated.View style={[styles.textContainer, textStyle]}>
        <ThemedText variant="h1" color={theme.textPrimary} style={styles.appName}>
          齐思秒说
        </ThemedText>
        <ThemedText variant="caption" color={theme.textMuted}>
          AI · 第三人称叙事
        </ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stage: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  // LOGO圆圈（独立的边框，最后出现）
  logoCircle: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: '#1A1A1A',
    backgroundColor: 'transparent',
  },
  // 书本容器
  bookContainer: {
    width: 180,
    height: 120,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  book: {
    flexDirection: 'row',
    width: 90,
    height: 60,
    backgroundColor: '#F5F5F0',
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  leftPage: {
    width: 45,
    height: '100%',
    padding: 8,
    backgroundColor: '#FFFEF8',
    borderRightWidth: 0.5,
    borderRightColor: '#E8E8E0',
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  rightPage: {
    width: 45,
    height: '100%',
    padding: 8,
    backgroundColor: '#FFFEF8',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  flipPage: {
    position: 'absolute',
    left: 45,
    top: 0,
    width: 45,
    height: 60,
    padding: 8,
    backgroundColor: '#FFFEF8',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backfaceVisibility: 'hidden',
  },
  pageLines: {
    gap: 6,
  },
  pageLine: {
    height: 1.5,
    backgroundColor: '#E0E0E0',
    borderRadius: 0.5,
  },
  // 左手
  leftHandContainer: {
    position: 'absolute',
    left: -40,
    top: 15,
    zIndex: 10,
  },
  // 右手
  rightHandContainer: {
    position: 'absolute',
    right: -25,
    bottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  hand: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  palm: {
    width: 28,
    height: 22,
    backgroundColor: '#FFDAB9',
    borderRadius: 8,
  },
  finger: {
    width: 7,
    height: 20,
    backgroundColor: '#FFDAB9',
    borderRadius: 4,
  },
  // 钢笔容器
  penContainer: {
    position: 'absolute',
    right: 35,
    bottom: 40,
    zIndex: 20,
  },
  pen: {
    flexDirection: 'row',
    alignItems: 'center',
    transform: [{ rotate: '-30deg' }],
  },
  penBody: {
    width: 28,
    height: 5,
    backgroundColor: '#1A1A1A',
    borderRadius: 2,
  },
  penTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderLeftColor: '#C8102E',
    borderTopWidth: 2.5,
    borderTopColor: 'transparent',
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  // 文字
  textContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  appName: {
    fontWeight: '900',
    letterSpacing: 4,
    fontSize: 32,
  },
});
