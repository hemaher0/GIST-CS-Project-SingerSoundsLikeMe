FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

ARG UID=1000
ARG GID=1000
ARG CONDA_DIR=/opt/conda

RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential python3 python3-pip python3-dev sudo wget \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -g ${GID} appgroup \
 && useradd -m -u ${UID} -g appgroup appuser
RUN ln -sf $(which python3) /usr/local/bin/python

ENV PATH="${CONDA_DIR}/bin:${PATH}"
RUN wget --quiet https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda.sh && \
    mkdir -p ${CONDA_DIR} && \
    bash ~/miniconda.sh -b -u -p ${CONDA_DIR} && \
    rm ~/miniconda.sh && \
    ${CONDA_DIR}/bin/conda clean -afy

USER appuser
WORKDIR /app

COPY --chown=appuser:appgroup services/voice-embedding/requirements.txt ./
ENV PATH="/home/appuser/.local/bin:${PATH}"
RUN conda create -n voice python=3.10 -y && \
    echo "conda activate voice" >> ~/.bashrc
SHELL ["conda", "run", "-n", "voice", "/bin/bash", "-c"]
RUN conda install -c pytorch faiss-gpu=1.9.0 torchaudio numpy=1.26.4 -y && \
    pip install -r requirements.txt

COPY --chown=appuser:appgroup scripts/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

COPY --chown=appuser:appgroup services/voice-embedding/ ./

ENTRYPOINT ["/wait-for-it.sh","kafka:29092","-t","60","--strict","--"]
CMD ["conda", "run", "--no-capture-output", "-n", "voice", "python", "main.py"]
