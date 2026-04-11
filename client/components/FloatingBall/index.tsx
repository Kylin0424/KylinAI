import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BALL_SIZE = 32;
const MENU_ITEM_SIZE = 40;
const MENU_RADIUS = 70;

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  color: string;
  action: () => void;
}

// 单独的菜单项组件（避免在循环中调用 hooks）
const MenuItemComponent: React.FC<{
  item: MenuItem;
  index: number;
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
  rotation: SharedValue<number>;
}> = ({ item, index, scale, opacity, rotation }) => {
  // 基础角度：每个菜单项的固定位置（-90度开始，顺时针分布）
  const baseAngle = (index * 45 - 90) * (Math.PI / 180);

  // 菜单项位置动画（公转）
  const menuItemStyle = useAnimatedStyle(() => {
    // 计算旋转后的实际角度
    const rotatedAngle = baseAngle + (rotation.value * Math.PI / 180);
    
    return {
      transform: [
        // 公转：围绕中心移动
        { translateX: interpolate(scale.value, [0, 1], [0, Math.cos(rotatedAngle) * MENU_RADIUS]) },
        { translateY: interpolate(scale.value, [0, 1], [0, Math.sin(rotatedAngle) * MENU_RADIUS]) },
        // 反向旋转：抵消父容器的旋转，保持菜单项垂直
        { rotate: `-${rotation.value}deg` },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.menuItemContainer, menuItemStyle]}>
      <TouchableOpacity style={styles.menuItem} onPress={item.action} activeOpacity={0.8}>
        <View style={[styles.menuIconWrap, { backgroundColor: item.color + '15' }]}>
          <Feather name={item.icon as any} size={16} color={item.color} />
        </View>
      </TouchableOpacity>
      <Text style={styles.menuItemLabel}>{item.label}</Text>
    </Animated.View>
  );
};

interface FloatingBallProps {
  onNavigate?: (screen: string) => void;
}

export const FloatingBall: React.FC<FloatingBallProps> = ({ onNavigate }) => {
  const { theme } = useTheme();
  const router = useSafeRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  // ============ 动画值 ============
  
  // 悬浮球位置
  const ballX = useSharedValue(SCREEN_WIDTH - BALL_SIZE - 12);
  const ballY = useSharedValue(SCREEN_HEIGHT / 2);
  
  // 保存拖拽前的位置
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // 菜单旋转角度
  const menuRotation = useSharedValue(0);

  // 菜单项动画（8个菜单项）
  const menuItemScales = useRef<SharedValue<number>[]>(
    Array.from({ length: 8 }, () => useSharedValue(0))
  ).current;
  const menuItemOpacities = useRef<SharedValue<number>[]>(
    Array.from({ length: 8 }, () => useSharedValue(0))
  ).current;

  // 重置菜单动画
  const resetMenuAnimations = useCallback(() => {
    menuItemScales.forEach(scale => { scale.value = 0; });
    menuItemOpacities.forEach(opacity => { opacity.value = 0; });
    menuRotation.value = 0;
  }, []);

  // 菜单项配置
  const menuItems: MenuItem[] = [
    {
      id: 'character-list',
      icon: 'users',
      label: '角色库',
      color: '#4F46E5',
      action: () => {
        setIsExpanded(false);
        resetMenuAnimations();
        router.push('/character-list');
      },
    },
    {
      id: 'character',
      icon: 'user-plus',
      label: '生成角色',
      color: '#059669',
      action: () => {
        setIsExpanded(false);
        resetMenuAnimations();
        router.push('/character');
      },
    },
    {
      id: 'ai-search',
      icon: 'search',
      label: 'AI查询',
      color: '#C8102E',
      action: () => {
        setIsExpanded(false);
        resetMenuAnimations();
        Alert.alert('AI智能查询', 'AI资料查询功能开发中，敬请期待');
      },
    },
    {
      id: 'gallery',
      icon: 'image',
      label: '相册',
      color: '#EA580C',
      action: () => {
        setIsExpanded(false);
        resetMenuAnimations();
        Alert.alert('相册', '手机相册功能开发中，敬请期待');
      },
    },
    {
      id: 'bookmark',
      icon: 'bookmark',
      label: '收藏',
      color: '#7C3AED',
      action: () => {
        setIsExpanded(false);
        resetMenuAnimations();
        Alert.alert('收藏', '收藏功能开发中，敬请期待');
      },
    },
    {
      id: 'settings',
      icon: 'settings',
      label: '设置',
      color: '#64748B',
      action: () => {
        setIsExpanded(false);
        resetMenuAnimations();
        router.push('/settings');
      },
    },
    {
      id: 'help',
      icon: 'help-circle',
      label: '帮助',
      color: '#0EA5E9',
      action: () => {
        setIsExpanded(false);
        resetMenuAnimations();
        Linking.openURL('https://help.example.com');
      },
    },
    {
      id: 'feedback',
      icon: 'message-circle',
      label: '反馈',
      color: '#F43F5E',
      action: () => {
        setIsExpanded(false);
        resetMenuAnimations();
        Linking.openURL('mailto:feedback@example.com');
      },
    },
  ];

  // 展开菜单动画
  const expandMenu = useCallback(() => {
    setIsExpanded(true);
    
    menuItemScales.forEach((scale, index) => {
      scale.value = withDelay(index * 40, withSpring(1, { damping: 12, stiffness: 200 }));
    });
    menuItemOpacities.forEach((opacity, index) => {
      opacity.value = withDelay(index * 40, withTiming(1, { duration: 200 }));
    });
  }, []);

  // 收起菜单动画
  const collapseMenu = useCallback(() => {
    menuItemScales.forEach(scale => { scale.value = withTiming(0, { duration: 150 }); });
    menuItemOpacities.forEach(opacity => { opacity.value = withTiming(0, { duration: 150 }); });
    
    setTimeout(() => {
      setIsExpanded(false);
      resetMenuAnimations();
    }, 200);
  }, []);

  // 切换菜单
  const toggleMenu = useCallback(() => {
    if (isExpanded) {
      collapseMenu();
    } else {
      expandMenu();
    }
  }, [isExpanded]);

  // 收起状态下的拖拽手势
  const dragGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      startX.value = ballX.value;
      startY.value = ballY.value;
    })
    .onUpdate((e) => {
      'worklet';
      ballX.value = startX.value + e.translationX;
      ballY.value = startY.value + e.translationY;
    })
    .onEnd((e) => {
      'worklet';
      // 如果移动很小，当作点击
      if (Math.abs(e.translationX) < 5 && Math.abs(e.translationY) < 5) {
        runOnJS(toggleMenu)();
      } else {
        // 吸附到边缘
        const targetX = ballX.value > SCREEN_WIDTH / 2
          ? SCREEN_WIDTH - BALL_SIZE - 12
          : 12;
        ballX.value = withSpring(targetX, { damping: 15, stiffness: 150 });
      }
    });

  // 展开状态下的旋转手势
  const rotateGesture = Gesture.Pan()
    .onUpdate((e) => {
      'worklet';
      // 获取悬浮球中心位置
      const centerX = ballX.value + BALL_SIZE / 2;
      const centerY = ballY.value + BALL_SIZE / 2;
      
      // 计算触摸点相对于中心的角度
      const touchX = e.absoluteX;
      const touchY = e.absoluteY;
      
      const dx = touchX - centerX;
      const dy = touchY - centerY;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      menuRotation.value = angle + 90;
    });

  // 悬浮球样式
  const ballStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: ballX.value },
      { translateY: ballY.value },
    ],
  }));

  return (
    <>
      {/* 遮罩层 */}
      {isExpanded && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={collapseMenu}
        />
      )}

      {/* 悬浮球容器 */}
      <GestureDetector gesture={isExpanded ? rotateGesture : dragGesture}>
        <Animated.View style={[styles.container, ballStyle]}>
          {/* 菜单项容器 */}
          {isExpanded && (
            <View style={styles.menuContainer}>
              {menuItems.map((item, index) => (
                <MenuItemComponent
                  key={item.id}
                  item={item}
                  index={index}
                  scale={menuItemScales[index]}
                  opacity={menuItemOpacities[index]}
                  rotation={menuRotation}
                />
              ))}
            </View>
          )}

          {/* 中心按钮 - 地球 */}
          <TouchableOpacity
            style={styles.ballContainer}
            activeOpacity={0.8}
            onPress={toggleMenu}
          >
            <View style={styles.ball}>
              {/* 地球图标 */}
              <View style={styles.earthIcon}>
                <View style={styles.earthBase} />
                <View style={styles.earthLine1} />
                <View style={styles.earthLine2} />
                <View style={styles.earthContinent1} />
                <View style={styles.earthContinent2} />
              </View>
              {/* 展开状态提示 */}
              {isExpanded && (
                <View style={styles.rotateHint}>
                  <Feather name="rotate-cw" size={8} color="#64748B" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContainer: {
    position: 'absolute',
    width: MENU_RADIUS * 2 + MENU_ITEM_SIZE,
    height: MENU_RADIUS * 2 + MENU_ITEM_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 998,
  },
  ballContainer: {
    width: BALL_SIZE,
    height: BALL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  ball: {
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: '#1A1A1A',
  },
  earthIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earthBase: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#3B82F6',
  },
  earthLine1: {
    position: 'absolute',
    width: 18,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  earthLine2: {
    position: 'absolute',
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  earthContinent1: {
    position: 'absolute',
    width: 6,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#22C55E',
    top: 4,
    left: 3,
  },
  earthContinent2: {
    position: 'absolute',
    width: 5,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#22C55E',
    bottom: 5,
    right: 4,
  },
  rotateHint: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuItemContainer: {
    position: 'absolute',
    width: MENU_ITEM_SIZE,
    height: MENU_ITEM_SIZE + 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItem: {
    width: MENU_ITEM_SIZE,
    height: MENU_ITEM_SIZE,
    borderRadius: MENU_ITEM_SIZE / 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemLabel: {
    position: 'absolute',
    bottom: -2,
    fontSize: 9,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
});

export default FloatingBall;
