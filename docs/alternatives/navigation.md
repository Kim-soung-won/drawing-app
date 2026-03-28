# 네비게이션 대안 분석

> 드로잉 캔버스와 네비게이션 제스처 간의 충돌 해결이 핵심 고려사항이다.

---

## 비교

| 솔루션 | 라우팅 방식 | 제스처 충돌 관리 | 러닝커브 | 비고 |
|--------|-----------|----------------|----------|------|
| **Expo Router** | 파일 기반 | 동일 | 낮음 | **현재 선정** |
| React Navigation | 코드 기반 | 동일 | 중간 | Expo Router의 기반 |

### 핵심 사실

> **Expo Router는 React Navigation 위에 구축되어 있다.**
> 제스처 처리, 전환 애니메이션, 스택 관리 등 핵심 동작이 동일.
> 차이는 라우팅 선언 방식(파일 vs 코드)뿐.

```
Spring으로 비유하면:
Expo Router = Spring Boot의 자동 설정 (@SpringBootApplication)
React Navigation = Spring MVC의 수동 설정 (WebMvcConfigurer)
같은 엔진, 다른 설정 방식.
```

---

## 캔버스와 네비게이션 제스처 충돌

손글씨 앱에서 가장 주의할 부분. 화면 가장자리에서의 스와이프가 "뒤로 가기"와 "글씨 쓰기" 중 어느 것인지 구분해야 한다.

### 해결 방법

```typescript
// Write Screen에서 네비게이션 제스처 비활성화
// app/write.tsx (Expo Router)
export default function WriteScreen() {
  return (
    <Stack.Screen
      options={{
        gestureEnabled: false  // 스와이프 뒤로가기 비활성화
      }}
    />
  );
}
```

### 추가 고려사항

| 제스처 | 용도 | 충돌 가능성 |
|--------|------|-----------|
| 화면 가장자리 스와이프 | 뒤로 가기 (네비게이션) | **높음** → `gestureEnabled: false` |
| 핀치 | 캔버스 줌 | 낮음 (캔버스 내부에서 처리) |
| 두 손가락 스와이프 | (없음) | 없음 |

### 필수 추가 의존성

Expo Router v3부터 `react-native-gesture-handler`가 기본 포함되지 않으므로 별도 설치 필요:

```bash
npx expo install react-native-gesture-handler react-native-reanimated
```

---

## 결론

**Expo Router 유지 권장.**

- 파일 기반 라우팅이 3개 화면(Home, Write, View) 구조에 직관적
- React Navigation으로 전환해도 제스처 충돌 문제는 동일하게 존재
- 프로토타입에서 라우팅은 핵심이 아니므로 가장 간단한 방식 유지
