# pub-diary 앱 실행 가이드

Expo Dev Client 기반 앱. USB로 연결된 태블릿에서 실행한다.

## 사전 조건

- 태블릿이 USB로 연결되어 있어야 함 (Wi-Fi 끄기 — Wi-Fi 켜면 ADB 연결 끊김)
- 태블릿에 pub-diary 개발 빌드(Expo Dev Client)가 설치되어 있어야 함

## 실행 순서

### 1. ADB 연결 확인

```bash
adb devices
```

`device` 상태인지 확인. `unauthorized`면 태블릿에서 "USB 디버깅 허용" 팝업을 승인한다.

### 2. Metro 서버 시작

사용자에게 아래 명령을 터미널에서 실행하도록 안내:

```
npx expo start
```

Metro가 시작되면 QR 코드와 함께 로그가 출력된다.

### 3. 태블릿에서 앱 접속

**방법 A — QR 스캔 (권장):**
태블릿의 Expo Dev Client 홈에서 "Scan QR code"로 Metro QR 코드를 스캔한다.

**방법 B — URL 수동 입력 (QR 스캔 안 될 때):**
1. ADB 포트 포워딩 설정:
   ```bash
   adb reverse tcp:8081 tcp:8081
   ```
2. 태블릿 Expo Dev Client → "Enter URL manually"에 입력:
   ```
   exp://127.0.0.1:8081
   ```
   → Connect 버튼 탭

### 4. 화면 확인

```bash
adb exec-out screencap -p > c:/dev/pub-diary/tmp_screen.png
```

`tmp_screen.png`를 Read 도구로 열어 이미지로 확인한다.

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| `unauthorized` | USB 디버깅 미승인 | 태블릿 팝업 승인 |
| Connection refused | ADB 포워딩 미설정 또는 Metro 미실행 | `adb reverse tcp:8081 tcp:8081` 후 Reload |
| Metro가 IPv6 `[::1]`에만 바인딩 | `--localhost` 플래그 사용 시 발생 | `--localhost` 없이 `npx expo start`만 실행 |
