# 실행 참고

모델 파일과 음원 데이터, 검색 DB를 준비하고 서비스별 경로를 맞춘 뒤 Docker Compose로 로컬 환경을 실행합니다.

## 1. 실행 환경과 파일 준비

- **GPU 실행 환경:** Docker Compose와 NVIDIA GPU 컨테이너 실행 환경을 준비합니다. 모델 서비스는 `runtime: nvidia`를 사용하며, 임베딩 검색은 CUDA와 GPU FAISS로 실행합니다.
- **음원 데이터:** 사용 권한을 확보한 원본 음원과 가수·곡 CSV를 바탕으로 `datasets/metadata.jsonl`, 분리된 보컬과 샘플 구간을 준비합니다. 저장소의 CSV를 시작점으로 음원과 전처리 결과를 구성합니다.
- **보컬 분리 모델:** `MelBandRoformer.ckpt`를 `CHECKPOINT_DIR`에 배치합니다. 로컬 Compose의 호스트 경로는 `services/vocal-separation/checkpoints/`입니다.
- **음색 변환 모델:** [Seed-VC](https://github.com/Plachtaa/seed-vc)의 모델 파일과 다운로드 환경을 준비합니다. 변환용 Dockerfile은 빌드할 때 이 저장소를 복제합니다.
- **검색 DB:** `segment_db_{gender}.npz`, `track_db_{gender}.npz`, `artist_db_{gender}.npz`를 준비합니다. `gender` 값은 `all`, `male`, `female`이며, 검색 서비스는 `DB_DIR`에서 해당 파일을 읽어 인덱스를 구성합니다.

## 2. 데이터와 경로 설정

[로컬 Compose](../docker-compose-local.yml)는 기본적으로 호스트의 `datasets/`를 데이터 경로로 사용합니다. 호스트에서 `DATA_DIR`를 지정하면 해당 경로를 마운트합니다.

| 항목 | 코드의 경로와 준비 방법 |
| --- | --- |
| 검색 DB 생성·조회 | DB 생성 코드의 성별 분할 파일은 `DATA_DIR`에 저장되고, 검색 코드는 `DB_DIR`에서 읽습니다. 기본 Compose에서는 생성된 분할 DB를 호스트의 `datasets/db/`에 두어 컨테이너의 `/app/db`와 연결하거나, 생성·조회 경로를 일치시킵니다. |
| DB 빌드 진입점 | `scripts/build_all_db.sh`가 가리키는 경로 대신 실제 구현 위치인 `services/voice-embedding/voice_embedding/build_db.py`를 사용합니다. 빌드 환경의 `DATA_DIR`와 `DB_DIR`를 함께 설정합니다. |
| 변환용 메타데이터·보컬 | 변환 작업자는 `INPUT_DIR/metadata.jsonl`과 `INPUT_DIR/separated/`를 읽습니다. 기본 Compose에서는 호스트의 `datasets/`가 컨테이너의 `/app/input`에 연결됩니다. |
| 변환 모델 버전 | Dockerfile의 Seed-VC 복제 단계는 특정 버전에 고정되어 있지 않습니다. 동일한 환경을 다시 구성하려면 사용할 버전과 모델 파일을 고정합니다. |

### 전처리와 DB 생성 순서

1. **데이터 경로 구성:** 저장소 루트의 `.env`에 `DATA_DIR=./datasets`를 지정하고 `downloads/`, `separated/`, `sampled/`, `db/`를 그 아래에 준비합니다. 호스트에서 전처리할 때는 각 서비스의 Python 의존성과 FFmpeg를 준비합니다.
2. **음원과 메타데이터 연결:** `downloads/`에 원본 MP3를 두고 `metadata_downloaded_batch_{번호}.jsonl`에 `id`, `artist_name`, `track_name`, `mp3_path`를 연결합니다. `mp3_path`는 데이터 경로 기준의 `downloads/파일명.mp3` 형태이며, 파일명은 DB 생성 코드의 `slugify(가수명, 곡명)` 규칙에 맞춥니다. 가수 정보는 `artists.csv`에 준비합니다.
3. **보컬 분리:** 배치 진입점은 [vocal_separation/core/process.py](../services/vocal-separation/vocal_separation/core/process.py)입니다. `services/vocal-separation/`에서 `python -m vocal_separation.core.process`로 실행하며, `--input_jsonl`에 배치 JSONL, `--input_dir`에 데이터 경로, `--output_dir`에 `separated/`를 지정하고 `--device_ids 0`처럼 GPU를 선택합니다. 실행 환경에는 `INPUT_DIR`, `OUTPUT_DIR`, `CHECKPOINT_DIR`, `CONFIG_DIR`를 설정하고, 각각의 모델·설정 경로에 `MelBandRoformer.ckpt`와 `config_kj.yaml`을 둡니다. 결과 보컬은 `원본파일명_vocals.mp3`로 저장됩니다.
4. **보컬 구간 추출:** 저장소 루트에서 `python scripts/sampling_audio.py --batch-indices 1`처럼 처리할 배치 번호를 지정합니다. 이 스크립트는 해당 배치 JSONL과 `separated/`를 읽고 `sampled/`의 WAV 구간과 `metadata_processed_batch_{번호}.jsonl`을 생성합니다.
5. **메타데이터 병합:** [merge_metadata.py](../scripts/merge_metadata.py)로 음원 정보와 샘플 경로를 묶어 `metadata.jsonl`을 만듭니다. 현재 스크립트는 1~10번 배치를 읽고 병합 후 원본 배치 JSONL을 삭제합니다. 사용 전에 입력 파일의 복사본을 보관하고, 코드의 배치 범위가 준비한 데이터와 맞는지 확인합니다.
6. **검색 DB 생성:** 임베딩 실행 환경에서 `DATA_DIR`를 준비한 데이터 경로로, `DB_DIR`를 그 아래 `db/`로 지정하고 `python services/voice-embedding/voice_embedding/build_db.py`를 저장소 루트에서 실행합니다. 생성된 성별 분할 NPZ 파일을 위 표의 조회 경로에 배치한 뒤 검색 서비스를 시작합니다.

대표 벡터의 처리 조건은 [구현 참고](TECHNICAL_NOTES.md)에 정리했습니다.

## 3. 로컬 서비스 실행

준비한 파일과 경로를 확인한 뒤 저장소 루트에서 실행합니다.

```bash
docker compose -f docker-compose-local.yml up --build
```

이 구성은 PostgreSQL, Kafka, FastAPI 백엔드와 세 개의 모델 서비스를 함께 실행합니다. Nginx는 호스트의 80번 포트로 프런트엔드를 제공합니다.

## 사용 흐름

1. 웹 화면에서 회원가입 또는 로그인을 진행합니다.
2. 음성을 업로드하거나 녹음한 뒤 검색할 음성을 선택합니다.
3. Match를 실행하고 가수 후보를 확인합니다.
4. 변환 화면에서 입력 음성과 목표 가수를 선택합니다.
5. 변환이 끝나면 Play로 결과를 재생합니다.
