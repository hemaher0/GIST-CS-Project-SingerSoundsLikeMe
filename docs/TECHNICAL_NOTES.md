# 구현 참고

검색 후보 구성, 참조 보컬 선택과 비동기 작업 처리의 세부 동작을 정리했습니다.

## 대표 벡터와 검색

[대표 벡터 구성 코드](../services/voice-embedding/voice_embedding/build_db.py)는 보컬 구간별로 Resemblyzer 임베딩을 추출한 뒤 곡, 가수 순으로 묶습니다. 곡별 벡터는 기본 10개까지 그대로 사용하고, 그보다 많으면 K-means 중심 10개로 요약합니다. 가수별로 모은 벡터는 10개 미만일 때 평균 벡터 하나를, 10개 이상일 때 K-means 중심 10개를 사용합니다. 가수 단위 집계 전에는 곡 벡터를 정규화합니다.

[검색 코드](../services/voice-embedding/voice_embedding/search.py)는 입력 임베딩과 저장 벡터를 정규화하고 GPU FAISS의 `IndexFlatIP`로 비교합니다. 프런트엔드의 가수 검색 요청은 `category="artist"`, `k=5`를 사용합니다.

요청한 결과 수의 두 배인 `k × 2`개 벡터 후보를 조회한 뒤, 같은 가수의 결과 중 가장 높은 점수만 남깁니다. 가까운 대표 벡터가 특정 가수에 몰리면 중복 제거 후 반환되는 가수 수가 요청한 수보다 적을 수 있습니다.

## 사용자 입력의 전처리

[사용자 음성 검색](../services/voice-embedding/voice_embedding/search.py#L51-L85)은 업로드 파일을 읽고 16kHz로 변환한 뒤 `VoiceEncoder`로 임베딩합니다. 보컬 분리는 가수 DB를 준비할 때 수행하며, 검색 요청의 전처리는 리샘플링과 임베딩으로 구성됩니다. 입력에는 반주와 주변 소음이 적고 목소리가 분명하게 들리는 음성을 사용합니다.

## 음색 변환과 참조 보컬

[변환 작업자](../services/voice-converter/main.py)는 사용자가 선택한 가수의 메타데이터에서 곡 하나를 무작위로 고르고, 해당 곡의 분리된 보컬을 Seed-VC의 참조 음성으로 전달합니다. 목표 음색은 참조 보컬로 지정하므로 가수를 바꿀 때도 같은 추론 경로를 사용합니다.

같은 가수를 선택해도 참조 파일이 달라질 수 있습니다.

## 비동기 요청과 결과 반환

[검색 API](../services/backend/routers/match.py)와 [변환 API](../services/backend/routers/convert.py)는 UUID로 요청을 구분하고 Kafka로 모델 작업을 전달합니다. 모델 작업자는 HTTP 콜백으로 결과를 반환하며, 서버는 같은 식별자의 요청에 결과를 저장합니다.

[검색 화면](../services/frontend/src/pages/MatchingPage.jsx)은 3초마다 상태와 결과를 조회합니다. [변환 화면](../services/frontend/src/pages/ConversionPage.jsx)은 WebSocket 알림과 3초 주기 조회를 함께 사용해 완료된 음성의 재생 URL을 받습니다. 서비스별 Docker 환경은 [로컬 Compose 설정](../docker-compose-local.yml)에서 확인할 수 있습니다.

### 작업 중단과 재시도

검색·변환 작업자는 Kafka 메시지를 커밋한 뒤 모델 작업을 실행합니다. 처리 중 작업자가 중단되면 이미 커밋한 작업은 Kafka에서 자동으로 재전달되지 않으므로, 해당 요청의 상태를 확인하고 다시 요청해야 합니다.

모델·데이터 준비와 서비스별 경로 설정은 [실행 참고](RUNNING.md)에서 확인할 수 있습니다.
