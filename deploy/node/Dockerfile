# Nodo de PUNA como servicio (Railway): dispara la demo on-chain desde la web. Sin .env ni clave del validador.
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 MPLBACKEND=Agg
COPY pyproject.toml ./
COPY node ./node
COPY validator ./validator
COPY orbit ./orbit
COPY onchain ./onchain
COPY bench ./bench
COPY scripts ./scripts
COPY sample-data ./sample-data
RUN pip install .
CMD ["python", "-m", "node.serve"]
