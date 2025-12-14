# Snowby

스키 & 스노보드 트래킹 앱

## 요구사항

- Node.js 18+
- [Bun](https://bun.sh) (권장) 또는 npm/yarn
- iOS: Xcode 15+ (macOS 전용)
- Android: Android Studio + SDK

## 설치

```bash
# 의존성 설치
bun install
```

## 개발 빌드

이 프로젝트는 네이티브 모듈(MapLibre)을 사용하므로 **Expo Go가 아닌 Development Build**가 필요합니다.

### iOS (macOS 전용)

```bash
# iOS 빌드 및 실행
bun run build:ios
```

### Android

1. Android Studio 설치
2. SDK Manager에서 Android SDK 설치
3. 환경변수 설정 (`~/.zshrc` 또는 `~/.bashrc`):

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

4. 터미널 재시작 후:

```bash
# Android 빌드 및 실행
bun run build:android
```

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `bun run dev` | Metro 번들러 시작 (캐시 클리어) |
| `bun run ios` | iOS 시뮬레이터에서 실행 |
| `bun run android` | Android 에뮬레이터에서 실행 |
| `bun run build:ios` | iOS 네이티브 빌드 |
| `bun run build:android` | Android 네이티브 빌드 |
| `bun run clean` | 빌드 캐시 및 네이티브 폴더 삭제 |

## 프로젝트 구조

```
snowby/
├── app/                    # Expo Router 페이지
│   ├── (tabs)/            # 탭 네비게이션
│   │   ├── index.tsx      # 홈 (지도)
│   │   ├── history.tsx    # 기록
│   │   ├── rank.tsx       # 랭킹
│   │   ├── user.tsx       # 프로필
│   │   └── setting.tsx    # 설정
│   └── _layout.tsx        # 루트 레이아웃
├── components/            # 재사용 컴포넌트
│   ├── ui/               # 기본 UI 컴포넌트
│   ├── history/          # 기록 관련 컴포넌트
│   ├── rank/             # 랭킹 관련 컴포넌트
│   ├── setting/          # 설정 관련 컴포넌트
│   └── user/             # 프로필 관련 컴포넌트
├── lib/                   # 유틸리티 및 설정
│   ├── langs/            # i18n 번역 파일
│   ├── i18n.ts           # 다국어 설정
│   ├── constant.ts       # 상수
│   └── utils.ts          # 유틸 함수
├── stores/               # Zustand 상태 관리
└── assets/               # 이미지, 폰트 등
```

## 기술 스택

- **Framework**: React Native 0.81 + Expo SDK 54
- **Router**: Expo Router v6
- **Styling**: NativeWind v4 (Tailwind CSS)
- **State**: Zustand
- **i18n**: i18n-js (한국어, 영어, 일본어)
- **Map**: MapLibre React Native
- **UI Components**: React Native Reusables

## 컴포넌트 추가

React Native Reusables CLI로 컴포넌트 추가:

```bash
npx @react-native-reusables/cli@latest add [...components]
```

## 문제 해결

### iOS 빌드 실패

```bash
# 클린 빌드
bun run clean
bun install
bun run build:ios
```

### Android SDK 경로 오류

```bash
# SDK 경로 확인
echo $ANDROID_HOME
# 출력이 없으면 환경변수 설정 필요
```

### Metro 캐시 문제

```bash
# 캐시 클리어 후 재시작
bun run dev
```

### Expo Go에서 실행 불가

이 앱은 네이티브 모듈(MapLibre)을 사용하므로 Expo Go에서 실행할 수 없습니다.
반드시 `bun run build:ios` 또는 `bun run build:android`로 Development Build를 생성해야 합니다.

## 배포

[Expo Application Services (EAS)](https://expo.dev/eas)를 사용하여 배포:

- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Updates](https://docs.expo.dev/eas-update/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)
