import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ColorSchemeProvider } from '@/hooks/useColorScheme';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
  // 添加其它想暂时忽略的错误或警告信息
]);

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ColorSchemeProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar style="dark"></StatusBar>
            <Stack screenOptions={{
              // 设置所有页面的切换动画为从右侧滑入，适用于iOS 和 Android
              animation: 'slide_from_right',
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              // 隐藏自带的头部
              headerShown: false
            }}>
              <Stack.Screen name="index" options={{ title: "", animation: 'fade' }} />
              <Stack.Screen name="splash" options={{ title: "", animation: 'fade' }} />
              <Stack.Screen name="home" options={{ title: "" }} />
              <Stack.Screen name="settings" options={{ title: "设置" }} />
              <Stack.Screen name="novel" options={{ title: "小说创作" }} />
              <Stack.Screen name="novel-writing" options={{ title: "续写小说" }} />
              <Stack.Screen name="novel-import" options={{ title: "导入小说" }} />
              <Stack.Screen name="character" options={{ title: "角色生成器" }} />
              <Stack.Screen name="character-result" options={{ title: "角色档案" }} />
              <Stack.Screen name="character-list" options={{ title: "角色库" }} />
              <Stack.Screen name="character-detail" options={{ title: "角色详情" }} />
              <Stack.Screen name="relation-network" options={{ title: "关系网络" }} />
            </Stack>
            <Toast />
          </GestureHandlerRootView>
        </ColorSchemeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
