# Validador de PUNA como servicio (Railway). Solo el código Python: sin web, sin contratos, sin .env.
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 MPLBACKEND=Agg
COPY pyproject.toml ./
COPY node ./node
COPY validator ./validator
COPY orbit ./orbit
COPY onchain ./onchain
COPY bench ./bench
RUN pip install .
CMD ["python", "-m", "validator.serve"]
