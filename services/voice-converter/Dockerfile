FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

ARG UID=1000
ARG GID=1000

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg libsndfile1 python3 python3-pip sudo git \
    build-essential python3-dev \
 && rm -rf /var/lib/apt/lists/*

RUN groupadd -g ${GID} appgroup \
 && useradd -m -u ${UID} -g appgroup appuser
RUN ln -sf $(which python3) /usr/local/bin/python

RUN git clone https://github.com/Plachtaa/seed-vc.git /tmp/seed-vc \
 && mkdir -p /app \
 && mv /tmp/seed-vc/* /tmp/seed-vc/.[!.]* /app/ \
 && chown -R ${UID}:${GID} /app
 
USER appuser
WORKDIR /app

COPY --chown=appuser:appgroup services/voice-converter/requirements.txt ./
ENV PATH="/home/appuser/.local/bin:${PATH}"
RUN python3 -m pip install --user --upgrade pip \
 && python3 -m pip install --user --no-cache-dir -r requirements.txt

COPY --chown=appuser:appgroup scripts/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

COPY --chown=appuser:appgroup services/voice-converter/ ./
ENTRYPOINT ["/wait-for-it.sh","kafka:29092","-t","60","--strict","--"]

CMD ["python3", "main.py"]
