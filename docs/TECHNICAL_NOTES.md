# Technical Notes

Implementation details for search candidates, reference vocal selection, and asynchronous job processing.

## Representative vectors and search

The [database builder](../services/voice-embedding/voice_embedding/build_db.py) extracts Resemblyzer embeddings from vocal segments, then groups them by track and singer. By default, a track retains its segment vectors when there are 10 or fewer; larger sets are summarized as 10 K-means centers. At the singer level, fewer than 10 collected vectors are reduced to one mean vector; sets of 10 or more use 10 K-means centers. Track vectors are normalized before artist-level aggregation.

The [search implementation](../services/voice-embedding/voice_embedding/search.py) normalizes the input embedding and stored vectors, then compares them with GPU FAISS's `IndexFlatIP`. Singer searches from the frontend use `category="artist"` and `k=5`.

The search retrieves `k × 2` vector candidates, twice the requested result count, and keeps only the highest-scoring result for each singer. If the nearest representative vectors are concentrated among a few singers, deduplication can leave fewer singers than requested.

## User audio preprocessing

[Query processing](../services/voice-embedding/voice_embedding/search.py#L51-L85) reads the uploaded file, resamples it to 16 kHz, and embeds it with `VoiceEncoder`. Vocal separation takes place during singer database preparation; search request preprocessing consists of resampling and embedding. Use recordings with a clear voice and minimal accompaniment or background noise.

## Voice conversion and reference vocals

The [conversion worker](../services/voice-converter/main.py) randomly selects one track from the chosen singer's metadata and supplies that track's separated vocals to Seed-VC as reference audio. The reference vocals specify the target timbre, so changing singers uses the same inference pipeline.

Selecting the same singer can therefore use a different reference file on another request.

## Asynchronous requests and result delivery

The [search API](../services/backend/routers/match.py) and [conversion API](../services/backend/routers/convert.py) identify requests by UUID and dispatch model jobs through Kafka. Workers return results through HTTP callbacks, and the server stores each result against the request with the same ID.

The [search screen](../services/frontend/src/pages/MatchingPage.jsx) polls for status and results every three seconds. The [conversion screen](../services/frontend/src/pages/ConversionPage.jsx) combines WebSocket notifications with three-second polling to retrieve the completed audio's playback URL. See the [local Compose configuration](../docker-compose-local.yml) for each service's Docker environment.

### Interrupted jobs and retries

Search and conversion workers commit Kafka messages before running model inference. If a worker stops during processing, Kafka does not automatically redeliver the committed job. Check the affected request's status and submit a new request if needed.

See the [running guide](RUNNING.md) for model and data preparation and service-specific paths.
