import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { COLORS, SHELL } from '../../constants/colors';

const RAIL_W = 74;

interface NavItem {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  route: string;
  matchPrefix?: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: 'book-open', label: '필사', route: '/write', matchPrefix: '/write' },
];

export { RAIL_W };

export default function Rail() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.matchPrefix) return pathname.startsWith(item.matchPrefix);
    return pathname === item.route;
  };

  const isHome = pathname === '/';

  return (
    <View style={styles.rail}>
      {/* 로고 */}
      <TouchableOpacity style={styles.logo} onPress={() => router.push('/')} activeOpacity={0.8}>
        <Text style={styles.logoText}>筆</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* 홈 */}
      <TouchableOpacity
        style={[styles.navItem, isHome && styles.navItemActive]}
        onPress={() => router.push('/')}
        activeOpacity={0.7}
      >
        <Feather name="home" size={22} color={isHome ? COLORS.primary : SHELL.iconOff} />
        <Text style={[styles.navLabel, isHome && styles.navLabelActive]}>홈</Text>
      </TouchableOpacity>

      {/* 필사 */}
      {NAV_ITEMS.map((item) => {
        const active = isActive(item);
        return (
          <TouchableOpacity
            key={item.route}
            style={[styles.navItem, active && styles.navItemActive]}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <Feather name={item.icon} size={22} color={active ? COLORS.primary : SHELL.iconOff} />
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}

      {/* 하단 설정 */}
      <View style={styles.bottom}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Feather name="settings" size={22} color={SHELL.iconOff} />
          <Text style={styles.navLabel}>설정</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: RAIL_W,
    backgroundColor: SHELL.rail,
    borderRightWidth: 1,
    borderRightColor: SHELL.border,
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    gap: 4,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoText: {
    fontSize: 22,
    color: COLORS.background,
    fontFamily: 'NanumMyeongjo_800ExtraBold',
  },
  divider: {
    width: 34,
    height: 1,
    backgroundColor: SHELL.borderSoft,
    marginVertical: 8,
  },
  navItem: {
    width: 48,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  navItemActive: {
    backgroundColor: SHELL.tint,
  },
  navLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: SHELL.iconOff,
    letterSpacing: 0.3,
  },
  navLabelActive: {
    color: COLORS.primary,
  },
  bottom: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});
