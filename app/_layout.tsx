import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import { NanumPenScript_400Regular } from '@expo-google-fonts/nanum-pen-script';
import { NanumMyeongjo_700Bold, NanumMyeongjo_800ExtraBold } from '@expo-google-fonts/nanum-myeongjo';
import { useDiaryStore } from '../src/stores/diaryStore';
import { COLORS, SHELL } from '../src/constants/colors';
import Rail from '../src/components/shell/Rail';

export default function RootLayout() {
  const init = useDiaryStore((s) => s.init);

  const [fontsLoaded] = useFonts({
    NanumPenScript_400Regular,
    NanumMyeongjo_700Bold,
    NanumMyeongjo_800ExtraBold,
  });

  useEffect(() => {
    init();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.shell}>
        <Rail />
        <View style={styles.content}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: SHELL.work },
              animation: 'fade',
            }}
          />
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  shell: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
});
