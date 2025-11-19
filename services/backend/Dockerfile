FROM python:3.10-slim

ARG UID=1000
ARG GID=1000

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg\
    sudo && \
    groupadd -g ${GID} appgroup && \
    useradd -m -u ${UID} -g appgroup appuser && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --chown=appuser:appgroup requirements.txt . 
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=appuser:appgroup . .

ENV PATH="/home/appuser/.local/bin:${PATH}"

EXPOSE 8000
