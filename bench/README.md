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
- **El modelo es chico** (4 capas, grilla 12×12). Cómo escala la verificación está medido aparte, en la sección siguiente.

## Escala: verificar contra recalcular

```bash
.venv/bin/python -m bench.scale      # ~3 min; escribe bench/scale.json
```

Medimos matrices n×n int8 con acumulación exacta, en un Mac con Apple Silicon (8 núcleos). Comparamos Freivalds exacto mód 2³¹−1, con 2 repeticiones, contra recalcular el producto de dos formas:

- **Exacto en enteros:** lo que haría un auditor de un modelo entero.
- **float32 con BLAS:** el recálculo más rápido posible, aunque no es exacto bit a bit.

| n | Verificar | Recalcular exacto (int64) | Recalcular float32 BLAS | Verificar vs BLAS |
|---|---|---|---|---|
| 256 | 0,6 ms | 16 ms | 0,04 ms | BLAS 15× más rápido |
| 512 | 2,2 ms | 227 ms | 0,27 ms | BLAS 8× más rápido |
| 1024 | 8,6 ms | 2,2 s | 2,6 ms | BLAS 3× más rápido |
| 2048 | 35 ms | 75 s | 22 ms | BLAS 1,6× más rápido |
| 4096 | 140 ms | — | 193 ms | **verificar 1,4× más rápido** |
| 6144 | 340 ms | — | 628 ms | **verificar 1,9× más rápido** |

### Lectura honesta

- **La forma de crecer es lo que importa.** Al duplicar n, verificar tarda ×4 (O(n²)) y recalcular ×8 (O(n³)). Por eso, a partir de n ≈ 3.000 verificar le gana incluso al recálculo más optimizado, y la ventaja sigue creciendo. Las capas de los modelos reales están en ese rango o más arriba.
- **En matrices chicas, recalcular con BLAS es más rápido.** Es el caso de la demo (12×12): ahí el validador podría recalcular, y lo decimos.
- **La comparación favorece al recálculo.** El BLAS usa el acelerador matricial del chip, y nuestro Freivalds es numpy sin optimizar.
- **El recálculo exacto en enteros (columna int64) es lento** en parte porque numpy no optimiza la multiplicación de enteros. No usamos esos 2.181× como argumento.
- **Hay una diferencia cualitativa.** Recalcular en float no es exacto bit a bit: para comparar con el resultado del nodo hace falta una tolerancia, y una falla chica se puede esconder ahí. Freivalds en enteros es exacto: cualquier diferencia se detecta, salvo con probabilidad ≤ 1/p².
