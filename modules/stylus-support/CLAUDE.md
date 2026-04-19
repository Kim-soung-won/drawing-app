# modules/stylus-support — CLAUDE.md

S펜(스타일러스) 지원 여부를 감지하는 Expo 네이티브 모듈.

---

## 목적

삼성 S펜처럼 스타일러스를 지원하는 기기인지 런타임에 판별한다. 지원 기기라면 `DrawingCanvas`에서 손가락 터치를 차단하고 스타일러스 입력만 필기로 처리한다.

---

## 사용법

```ts
import StylusSupportModule from '../../../modules/stylus-support';

const HAS_STYLUS = StylusSupportModule.hasStylusSupport(); // boolean
```

에러 가능성이 있으므로 항상 try/catch 감싸기:
```ts
let HAS_STYLUS = false;
try {
  HAS_STYLUS = StylusSupportModule.hasStylusSupport();
} catch (e) {
  console.warn('[StylusSupport] module failed:', e);
}
```

---

## 감지 방식

Android `PackageManager.hasSystemFeature("com.sec.feature.spen_usp")` 를 호출해 삼성 S펜 기능 플래그를 확인한다.

---

## 파일 구조

```
index.ts                  — JS 진입점 (네이티브 모듈 export)
src/StylusSupportModule.ts — TypeScript 타입 정의
expo-module.config.json   — Expo 모듈 설정
android/
└── src/main/java/expo/modules/stylussupport/
    └── StylusSupportModule.kt  — Kotlin 구현체
```

---

## 주의사항

- iOS 구현 없음 (현재 Android 전용)
- `build/` 디렉토리는 빌드 산출물. 수정 불필요.
