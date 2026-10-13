# 🎙️ Singer Sounds Like Me

### 내 목소리와 닮은 가수를 찾고, 원하는 음색으로 들어보기

Singer Sounds Like Me는 **사용자의 음성으로 유사한 가수를 검색하고, 선택한 가수의 음색으로 변환해 재생하는 웹 서비스**입니다. 사용자는 음성을 업로드하거나 녹음한 뒤 가수 후보를 확인하고, 원하는 음색을 골라 같은 음성이 어떻게 달라지는지 들어볼 수 있습니다.

이 프로젝트는 **목소리 특징을 비교하는 검색**에 초점을 둡니다. 가수 음원으로 검색용 데이터베이스를 구성하고, 검색과 음색 변환을 웹에서 이어서 사용할 수 있도록 음성 모델·API·사용자 화면을 연결했습니다.

**음성 입력 → 가수 후보 검색 → 변환할 음색 선택 → 결과 재생**

[주요 기능](#주요-기능) · [서비스 구조](#서비스-구조) · [음원 데이터 파이프라인](#음원-데이터-파이프라인) · [기술 선택과 구현](#기술-선택과-구현) · [실행 방법](#실행-방법)

## 주요 기능

<table>
  <tr>
    <th>음성 입력과 검색</th>
    <th>유사 가수 후보 확인</th>
  </tr>
  <tr>
    <td align="center"><a href="assets/img/voice-input.png"><img src="assets/img/voice-input.png" width="280" alt="업로드한 음성을 선택하고 검색 조건을 정하는 화면"></a></td>
    <td align="center"><a href="assets/img/artist-results.png"><img src="assets/img/artist-results.png" width="280" alt="입력 음성과의 유사도에 따라 가수 후보를 보여주는 화면"></a></td>
  </tr>
</table>

### 1. 음성을 올리거나 직접 녹음하기

파일 업로드와 브라우저 녹음을 같은 입력 창에서 제공합니다. 녹음을 마치면 음성 파일로 만들어 업로드 목록에 추가하고, 전송 전에는 입력한 음성을 재생해 확인할 수 있습니다. 업로드된 파일은 사용자별 목록에서 다시 선택해 검색과 변환에 사용합니다.

- 검색할 음성을 선택한 뒤, 전체·남성·여성 가수 조건을 지정할 수 있습니다.
- 화면은 업로드 목록, 선택한 음성, 검색 진행 상태를 구분해 표시합니다.

[업로드·녹음 화면](services/frontend/src/components/widgets/UploadModal.jsx) · [브라우저 녹음](services/frontend/src/components/common/VoiceRecorder.jsx) · [업로드 API](services/backend/routers/uploads.py)

### 2. 내 목소리와 가까운 가수 후보 확인하기

Match를 누르면 선택한 음성을 가수 데이터베이스와 비교합니다. 검색 결과는 가수 이름과 매칭 점수로 표시합니다.

검색 화면은 **중복을 제거한 가수 후보를 최대 5명까지 표시**합니다. 사용자는 이 후보를 보고 검색을 다시 진행하거나 변환 화면으로 이동할 수 있습니다. 매칭 점수는 입력 음성과 대표 벡터의 코사인 유사도를 화면에 표현한 값입니다.

[검색 화면](services/frontend/src/pages/MatchingPage.jsx) · [후보 표시 화면](services/frontend/src/pages/ResultPage.jsx) · [유사도 검색](services/voice-embedding/voice_embedding/search.py#L51-L85)

### 3. 원하는 가수의 음색으로 변환하고 재생하기

변환 화면에서 **입력 음성과 목표 가수를 직접 선택**할 수 있습니다.

변환 요청이 접수되면 화면에 진행 상태를 표시합니다. 모델 작업이 완료되면 결과 음성의 URL을 받아 Play 버튼과 공통 오디오 플레이어에서 재생할 수 있습니다. 검색 단계에서 사용한 가수의 보컬 데이터는 변환 단계의 참조 음성으로도 활용합니다.

[음색 선택·변환·재생 화면](services/frontend/src/pages/ConversionPage.jsx) · [오디오 플레이어](services/frontend/src/components/common/Player.jsx) · [변환 API](services/backend/routers/convert.py)

## 서비스 구조

### 음성 입력에서 검색과 변환으로

<p align="center">
  <a href="assets/img/data-flow.png"><img src="assets/img/data-flow.png" width="620" alt="음성 입력, 가수 검색, 음색 변환과 데이터 저장의 전체 흐름"></a>
</p>

시스템은 사용자 요청을 처리하는 웹 영역과, 음성 모델을 실행하는 영역으로 나뉩니다. 웹 서버는 업로드 파일과 작업 상태를 관리하고, 모델 서비스는 검색 또는 변환 결과를 반환합니다. 사용자·요청 정보는 PostgreSQL에 저장하고, 음성 벡터 검색에는 NPZ 데이터와 FAISS 인덱스를 사용합니다.

| 구성 요소 | 역할 | 주요 코드 |
| --- | --- | --- |
| React 프런트엔드 | 음성 입력, 후보 확인, 가수 선택, 작업 상태와 재생 제어 | [pages](services/frontend/src/pages) |
| FastAPI 백엔드 | 인증된 사용자 요청 접수, 파일·작업 정보 저장, 결과 조회와 반환 | [routers](services/backend/routers) |
| 음성 임베딩 서비스 | 가수 DB 구성, 입력 음성 임베딩, 유사도 검색 | [voice-embedding](services/voice-embedding) |
| 음색 변환 서비스 | 선택한 가수의 참조 보컬로 Seed-VC 추론 | [voice-converter](services/voice-converter) |
| 보컬 분리 서비스 | 가수 음원의 보컬과 반주 분리 | [vocal-separation](services/vocal-separation) |
| Kafka · PostgreSQL · Nginx | 모델 작업 전달, 요청 상태 저장, 웹·음성 파일 제공 | [Compose 설정](docker-compose-local.yml) |

### 요청 접수와 결과 반환

<p align="center">
  <a href="assets/img/request-flow.png"><img src="assets/img/request-flow.png" width="900" alt="웹 요청 접수, 작업 식별자 반환, Kafka 작업 전달, 모델 콜백과 결과 조회 순서"></a>
</p>

1. **접수:** 백엔드가 음성 경로와 검색 조건 또는 목표 가수를 받아 요청 식별자를 생성하고, 작업을 `pending` 상태로 저장합니다.
2. **전달:** 요청 정보와 식별자를 Kafka 메시지에 담아 모델 서비스에 전달합니다. 웹 화면은 추론 완료를 기다리는 긴 HTTP 요청 대신 식별자로 진행 상태를 확인합니다.
3. **처리:** 검색 서비스는 가수 후보를, 변환 서비스는 생성된 음성 파일을 HTTP 콜백으로 백엔드에 반환합니다.
4. **반영:** 백엔드는 같은 식별자의 요청에 결과를 저장합니다. 검색 화면은 주기적으로 결과를 조회하고, 변환 화면은 WebSocket 알림과 주기적 조회를 함께 사용해 재생 가능한 결과를 받습니다.

[검색 요청 접수](services/backend/routers/match.py#L41-L99) · [검색 결과 저장](services/backend/routers/match.py#L164-L187) · [변환 결과 저장·알림](services/backend/routers/convert.py#L114-L138)

## 음원 데이터 파이프라인

가수 음원은 미리 보컬을 분리하고 대표 벡터를 만들어 검색 DB에 저장합니다. 검색 요청이 들어오면 업로드된 사용자 음성을 직접 임베딩해 준비된 벡터 집합과 비교합니다.

### 가수 데이터베이스 준비

| 단계 | 처리 내용 | 만들어지는 데이터 |
| --- | --- | --- |
| 음원·메타데이터 구성 | 가수와 곡 정보, 파일 경로를 연결 | 가수·곡 CSV, `metadata.jsonl` |
| 보컬 분리 | Mel-Band Roformer로 가수 음원의 보컬 추출 | 분리된 보컬 파일 |
| 구간 추출 | 분리된 보컬에서 무음이 아닌 구간을 추출 | 기본 3–5초 길이, 곡당 최대 10개 구간 |
| 음성 특징 추출 | 16kHz로 변환한 구간을 Resemblyzer에 입력 | 구간별 음성 임베딩 |
| 대표 벡터 구성 | 구간을 곡별·가수별로 묶어 요약 | 구간·곡·가수 단위 NPZ 데이터 |
| 검색 인덱스 구성 | 벡터 정규화 후 FAISS 인덱스에 적재 | 유형·성별별 검색 인덱스 |

[보컬 분리](services/vocal-separation/vocal_separation/core/process.py) · [구간 추출](scripts/sampling_audio.py) · [메타데이터 연결](scripts/merge_metadata.py) · [임베딩·대표 벡터 생성](services/voice-embedding/voice_embedding/build_db.py)

### 사용자 음성의 검색과 변환

- **검색:** 업로드된 음성을 읽어 16kHz로 변환하고, 가수 DB와 같은 인코더로 임베딩을 추출합니다. 선택한 조건의 인덱스를 조회한 뒤 가수 단위로 중복을 제거해 반환합니다.
- **변환:** 사용자의 입력 음성과 선택한 가수의 참조 보컬을 Seed-VC에 전달합니다. 결과 파일은 백엔드에 업로드하고 재생 URL로 제공합니다.

## 기술 선택과 구현

### 1. 노래의 유사성보다 목소리 특징을 비교하기

**해결할 문제:** 노래에는 화자의 음색 외에도 반주, 가사와 멜로디가 함께 들어 있습니다. 가수를 검색하려면 먼저 어떤 특징을 비교 대상으로 삼을지 정해야 합니다.

**접근:** 가수 음원에서 보컬을 분리하고, 화자 특징을 표현하도록 학습된 Resemblyzer의 임베딩을 검색 기준으로 사용했습니다. 가수 이름을 출력하는 분류기를 따로 학습하는 방식 대신, 입력 음성과 가수 음원을 같은 벡터 공간에서 비교합니다. 새로운 가수를 추가할 때도 해당 음원의 특징과 인덱스를 갱신하는 흐름으로 다룰 수 있습니다.

- 가수 DB를 만드는 코드와 입력 음성을 검색하는 코드 모두 음성을 16kHz로 맞추고 `VoiceEncoder`를 사용합니다.
- 검색 서비스는 구간·곡·가수 단위의 DB를 구분해 읽습니다. 실제 웹 검색 화면은 가수 단위 인덱스를 사용합니다.

[DB의 음성 특징 추출](services/voice-embedding/voice_embedding/build_db.py#L59-L76) · [입력 음성 처리와 검색](services/voice-embedding/voice_embedding/search.py#L51-L85)

### 2. 한 가수를 하나의 평균으로만 표현하지 않기

**해결할 문제:** 같은 가수도 곡과 구간에 따라 고음·저음, 발성 강도와 음색이 달라집니다. 모든 구간을 하나의 평균으로 합치면 이러한 차이를 잃을 수 있고, 모든 구간 벡터를 그대로 유지하면 가수별로 비교해야 할 벡터 수가 커집니다.

**접근:** 구간별 임베딩을 곡 단위로 묶고, 다시 가수 단위로 묶는 두 단계의 대표 벡터 구성을 사용했습니다. K-means는 여러 구간의 특징을 제한된 수의 군집 중심으로 요약하는 역할을 하고, FAISS는 만들어진 대표 벡터와 입력 음성의 유사도를 찾는 역할을 합니다.

| 대표 벡터를 만드는 단계 | 기본 처리 조건 |
| --- | --- |
| 곡별 구간 벡터 | 10개 이하면 그대로 사용, 10개를 넘으면 K-means 중심 10개 사용 |
| 가수별로 모은 곡 벡터 | 10개 미만이면 평균 벡터 1개, 10개 이상이면 K-means 중심 10개 사용 |

기본 샘플링 설정에서는 곡별 벡터를 그대로 사용하고, 가수 단위로 모은 벡터를 대표 벡터로 요약합니다.

검색할 때는 정규화한 벡터를 FAISS의 내적 인덱스로 비교합니다. 같은 가수의 여러 대표 벡터가 가까운 결과로 나타나면, 가장 높은 점수의 결과만 남깁니다. 따라서 한 가수가 후보 목록을 여러 칸 차지하지 않으면서도, 입력과 가까운 목소리 특징으로 검색될 수 있습니다.

[곡별 대표 벡터](services/voice-embedding/voice_embedding/build_db.py#L98-L114) · [가수별 대표 벡터](services/voice-embedding/voice_embedding/build_db.py#L132-L164) · [인덱스와 중복 제거](services/voice-embedding/voice_embedding/search.py)

### 3. 검색 후보와 변환할 음색을 분리하기

**해결할 문제:** 입력 음성과 가까운 가수가 사용자가 바꾸고 싶은 음색과 항상 같지는 않습니다. 또한 가수별 모델을 학습하는 방식은 새로운 가수를 추가할 때마다 모델 학습과 관리가 필요합니다.

**접근:** 검색은 선택을 돕는 후보 제시로 두고, 음색 변환에서는 사용자가 목표 가수를 직접 고르도록 했습니다. Seed-VC는 참조 음성으로 목표 음색을 지정할 수 있어, 가수 선택을 해당 가수의 보컬 파일 선택으로 연결할 수 있습니다.

- 백엔드는 입력 음성과 목표 가수 이름을 받아 변환 요청을 만듭니다. 필요한 경우 입력 파일을 WAV로 변환합니다.
- 변환 작업자는 메타데이터에서 선택한 가수의 곡을 찾고, 분리된 보컬 파일을 참조 음성으로 전달합니다.
- 변환 결과는 WAV 파일로 백엔드에 반환되며, 화면은 완료된 요청의 재생 URL을 사용합니다.

[목표 가수 선택 UI](services/frontend/src/pages/ConversionPage.jsx) · [참조 보컬 선택](services/voice-converter/main.py#L45-L64) · [Seed-VC 실행](services/voice-converter/main.py#L66-L92)

### 4. 모델 추론을 웹 요청과 분리하고 결과를 다시 연결하기

**해결할 문제:** 음성 검색과 변환은 일반적인 웹 요청 처리보다 오래 걸릴 수 있고, 모델마다 의존성과 GPU 실행 환경이 다릅니다. 사용자는 작업을 요청한 뒤 나중에 완료된 결과를 다시 찾을 수 있어야 합니다.

**접근:** 모델 서비스별 Docker 컨테이너를 두고 Kafka로 작업을 전달합니다. 백엔드는 요청마다 UUID를 부여해 입력 조건과 작업 상태를 저장하고, 모델 서비스가 돌려준 결과를 같은 식별자의 요청에 연결합니다. 이 식별자가 웹 화면, 백엔드와 모델 작업 사이에서 하나의 작업을 추적하는 기준이 됩니다.

PostgreSQL에는 요청 상태와 결과 또는 결과 파일 경로를 저장하고, 음성 파일은 Nginx가 제공하는 경로로 재생합니다.

[검색 작업자](services/voice-embedding/main.py#L110-L141) · [변환 작업자](services/voice-converter/main.py#L95-L155) · [요청·상태 테이블](services/backend/init_schema.py) · [WebSocket 연결 관리](services/backend/main.py)

## 기술 스택과 저장소 구성

| 영역 | 사용 기술 | 이 프로젝트에서의 역할 |
| --- | --- | --- |
| 화면 | React, Redux Toolkit, Tailwind CSS, Vite | 음성 선택, 요청 상태, 결과 목록과 플레이어 구성 |
| API·데이터 | FastAPI, PostgreSQL | 사용자·업로드·검색·변환 요청 및 결과 관리 |
| 음성 처리 | Mel-Band Roformer, Resemblyzer, scikit-learn, FAISS, Seed-VC | 보컬 분리, 임베딩, 대표 벡터, 검색과 변환 |
| 실행·통신 | Docker Compose, Kafka, Nginx | 서비스 분리, 작업 전달, 웹·정적 음성 제공 |

```text
services/
  frontend/          # 사용자 화면, 상태 관리, 오디오 플레이어
  backend/           # 인증, 업로드, 검색·변환 API와 DB 초기화
  vocal-separation/  # 가수 음원 보컬 분리
  voice-embedding/   # 임베딩 DB 구성과 유사도 검색
  voice-converter/   # Seed-VC 작업자와 결과 반환
  nginx/             # 프런트엔드 빌드, API·음성 파일 제공
scripts/             # 음원·메타데이터 준비와 구간 추출
datasets/            # 가수·곡 정보와 실행 시 준비할 데이터
assets/img/          # README 화면과 흐름도
docs/                # 실행·구현 참고
```

처음 코드를 살펴본다면 [검색 화면](services/frontend/src/pages/MatchingPage.jsx) → [검색 API](services/backend/routers/match.py) → [검색 작업자](services/voice-embedding/main.py) → [검색 구현](services/voice-embedding/voice_embedding/search.py) 순서로 따라갈 수 있습니다. 변환 경로는 [변환 화면](services/frontend/src/pages/ConversionPage.jsx) → [변환 API](services/backend/routers/convert.py) → [변환 작업자](services/voice-converter/main.py)로 이어집니다.

## 프로젝트 정보

- **개발 기간:** 2025.03–06
- **프로젝트:** GIST C&S Project · 2인 팀
- **강민우 담당:** 음원 데이터 구성, 음성 모델 선택, 유사도 검색·변환 파이프라인과 웹 서비스 구현

## 실행 방법

### 1. 저장소 받기

```bash
git clone https://github.com/hemaher0/GIST-CS-Project-SingerSoundsLikeMe.git
cd GIST-CS-Project-SingerSoundsLikeMe
```

### 2. 실행 환경과 데이터 준비

- **실행 환경:** Docker Compose와 NVIDIA GPU 컨테이너 실행 환경을 준비합니다. 검색 서비스는 CUDA와 GPU FAISS를 사용합니다.
- **모델·음원:** 보컬 분리용 `MelBandRoformer.ckpt`, Seed-VC 모델 파일과 사용할 가수 음원을 준비합니다.
- **검색 DB:** 가수·곡 CSV와 `datasets/metadata.jsonl`을 구성하고, 보컬 분리·구간 추출·임베딩을 거쳐 검색용 NPZ 파일을 만듭니다.
- **경로 설정:** 모델 파일, 데이터와 검색 DB를 각 서비스의 환경 변수와 볼륨 경로에 맞춰 배치합니다. 구체적인 파일명과 생성·조회 경로는 [실행 참고](docs/RUNNING.md)에 정리했습니다.

### 3. 서비스 실행

모델·데이터와 경로 설정을 마친 뒤 저장소 루트에서 실행합니다.

```bash
docker compose -f docker-compose-local.yml up --build
```

검색 후보 구성, 참조 보컬 선택과 작업 처리의 세부 동작은 [구현 참고](docs/TECHNICAL_NOTES.md)에서 확인할 수 있습니다.

Nginx가 호스트의 80번 포트로 웹 화면을 제공합니다. 로그인한 뒤 음성을 업로드하거나 녹음해 검색하고, 변환 화면에서 목표 가수를 선택합니다. 변환이 끝나면 Play 버튼으로 결과를 재생할 수 있습니다.
