FROM ubuntu:22.04

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
        unzip \
    && rm -rf /var/lib/apt/lists/*

# Bun is Mosaic's pinned package manager (see package.json packageManager field).
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Install Bun for the ubuntu user that Cloud Agents run as.
RUN su - ubuntu -c 'curl -fsSL https://bun.sh/install | bash'
ENV PATH="/home/ubuntu/.bun/bin:${PATH}"

USER ubuntu
