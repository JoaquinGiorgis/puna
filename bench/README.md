# Benchmark mini: detección de inyecciones

```bash
.venv/bin/python -m bench.run      # ~1 s; escribe bench/results.json
```

## Cómo se corre

- **Corridas:** 300 fallas simuladas = 3 familias × 4 capas × 25 semillas, sobre el Lote 14 real (FIRMS, Anta).
- **Bits:** salen de la semilla, no siempre el bit alto. Peso: bit 0–7. SEU: bit 0–30. Multi-bit: 2 bits distintos.
- **Auditor:** el validador de PUNA, con Freivalds mod p = 2³¹−1 y 2 repeticiones por capa, más el resto de los chequeos (requant, encadenado, hashes y Merkle).
- **Falsos positivos:** 300 corridas honestas, cada una con una semilla distinta del validador.

## Resultado (11/11/2026)

| Familia | L1 | L2 | L3 | L4 | Total |
|---|---|---|---|---|---|
| SEU (1 bit en acumulador) | 25/25 | 25/25 | 25/25 | 25/25 | **100/100** |
| Peso (1 bit en W) | 25/25 | 25/25 | 25/25 | 25/25 | **100/100** |
| Multi-bit (2 bits × 3 acum.) | 25/25 | 25/25 | 25/25 | 25/25 | **100/100** |

- **Detectadas: 300/300.**
- **Falsos positivos: 0/300** corridas honestas.
- 286 fallas cambian la salida final y 172 cambian el índice de la póliza. Una falla silenciosa en esas 172 haría pagar o no pagar mal.
- Las 14 fallas que no cambian la salida (la recuantización absorbe el bit) también se detectan: Freivalds controla el acumulador de cada capa, no solo el resultado.

## Límites honestos

- **Las fallas son simuladas.** Es un modelo de bit-flip, no radiación medida.
- **Freivalds es probabilístico.** La chance de que una matriz alterada pase 2 repeticiones es ≤ 1/p² ≈ 2·10⁻¹⁹ por capa. Que no aparezca ninguna falsa aceptación en 300 casos es lo esperado; no prueba un 100 % absoluto.
- **El modelo es chico** (4 capas, grilla 12×12). El costo de verificar escala como O(n²) contra O(n³) del producto, pero acá no lo medimos.
