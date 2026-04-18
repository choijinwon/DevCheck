# QA 가이드 (Frontend QA Checker)

## 자동 검증 (PR·로컬)

| 명령 | 내용 |
|------|------|
| `npm run lint` | ESLint |
| `npm run test` | Vitest 단위 테스트 |
| `npm run build` | 프로덕션 빌드 |
| `npm run scan:ci` | 실행 중인 서버에 대해 URL 스캔 후 심각도 임계값으로 종료 코드 설정 (아래 참고) |

CI(GitHub Actions)에서 위 순서로 실행합니다.

### CI 스캔 스크립트 (`scan:ci`)

서버가 떠 있는 상태에서(예: `npm run dev` 또는 `npm start`) 다른 터미널에서:

```bash
SCAN_URL=https://example.com npm run scan:ci
# 또는
npm run scan:ci -- https://example.com
```

환경 변수:

| 변수 | 설명 |
|------|------|
| `SCAN_API_BASE` | API 베이스 URL (기본 `http://localhost:3000`) |
| `SCAN_PRESET` | `default` \| `extended` |
| `SCAN_FAIL_ON` | `any` \| `high` \| `medium` — 이 심각도 이상이면 종료 코드 `2` |

HTTP 오류는 종료 코드 `1`입니다.

## 수동 스모크 (배포 전)

1. `npm run dev` 후 `http://localhost:3000` 접속
2. **검사 범위**에서 기본 / 확장 중 하나 선택
3. 공개 URL 1개 입력 후 **분석하기** (예: `https://example.com`)
4. 결과 페이지에서 검색·심각도 필터·**JSON 내보내기** 동작 확인
5. **스캔 히스토리** 링크로 이동해 최근 분석 목록·결과 보기·다시 분석·삭제 동작 확인 (브라우저 `localStorage` 전용)
6. (선택) Supabase 연동 시 저장된 `scanId`로 `/result?scanId=…` 재접속 (프리셋은 DB에 없을 수 있음)

## 알려진 제한

- Puppeteer + Chrome이 필요합니다. `npm run install-browser` 참고.
- 서버리스(Vercel 기본 등)에서는 브라우저 실행 환경이 맞지 않을 수 있습니다.
- 자동 검사는 axe 규칙 일부만 사용합니다. 전체 WCAG 대체 수단은 아닙니다.
