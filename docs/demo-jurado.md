# Demo: el jurado elige la falla

```bash
# Antes: pnpm --dir web dev (Mission Control abierto) y FUJI_RPC_URL de publicnode en .env
.venv/bin/python scripts/e2e.py --demo --capa <1-4> --bit <0-7>
```

El jurado elige **una capa (1 a 4) y un bit (0 a 7)**. El nodo ORBIT-07 corre con ese bit dado vuelta en un peso de esa capa.

1. El scheduler muestra qué recomendaba su política (ORBIT-03) y que la asignación a ORBIT-07 es **forzada para la demo**.
2. El validador audita y señala la capa exacta que no cierra.
3. El escrow no paga, baja la reputación de ORBIT-07 y reasigna a ORBIT-03.
4. ORBIT-03 da 37,8 %, el validador aprueba y se paga.

Son unas 11 txs y ~45 s. La web avanza sola.

## Qué pasa con cada elección

Medido con el Lote 14 real. El índice honesto es 37,8 % y el disparador, 30 %.

| Capa | Bits | Índice que reporta el nodo | Sin auditoría… | Con PUNA |
|---|---|---|---|---|
| L1 | 0–7 | 37,8 % (igual) | daría bien de casualidad | **rechaza igual**: la cuenta no cierra |
| L2 | 0–4, 7 | 37,8 % (igual) | daría bien de casualidad | **rechaza igual** |
| L2 | 5, 6 | 38,5 % / 39,2 % | paga igual, pero con un número inventado | rechaza, señala L2 |
| L3 | 0, 1 | 35,5 % / 34,1 % | paga igual, pero con un número inventado | rechaza, señala L3 |
| L3 | 2–6 | 40,7 % a 55,5 % | paga igual, pero con un número inventado | rechaza, señala L3 |
| L3 | **7** | **0 %** | **el productor no cobraría** | rechaza, señala L3 |
| L4 | 0–6 | 35,5 % a 52,6 % | paga igual, pero con un número inventado | rechaza, señala L4 |
| L4 | **7** | **0 %** | **el productor no cobraría** | rechaza, señala L4 |

En las 32 combinaciones el validador detecta la falla y nombra la capa elegida. 18 de las 32 cambian el índice.

La indemnización es binaria: se paga entera si el índice supera el 30 %. Con este lote, el índice real (37,8 %) ya supera el disparador, así que **solo las fallas que lo bajan del 30 % (las de 0 %) cambian la plata**. Las demás dan un número inventado que con otro lote, uno cerca del disparador, sí cambiaría el pago.

## Cómo contarlo según lo que salga

- **0 % (L3 o L4, bit 7):** "Con un bit, el satélite dice que no se quemó nada. Sin auditoría, el productor no cobra."
- **Otro número (L3 o L4, bits 0 a 6):** "El satélite inventó un 52 %. Acá pagaría igual, pero si el lote estuviera en 25 %, ese número haría pagar algo que no corresponde. PUNA protege a las dos partes."
- **37,8 % igual (L1, casi toda L2):** "El resultado salió igual de casualidad, y aun así lo rechazamos. No auditamos el número final, auditamos el cálculo. La próxima vez ese bit sí cambia la respuesta."

## Plan B

- **Si Fuji o la RPC fallan:** abrí `http://localhost:3000/?job=7`, que es la corrida completa ya en cadena, o el video.
- **Si se acaban los AVAX:** el insurer necesita ~0,02 por demo. Recargalo desde el deployer antes de presentar.

## Respuestas cortas

| Si preguntan | Respondemos |
|---|---|
| ¿Con qué entrenaron la red? | No está entrenada: son pesos fijos hechos a mano, un modelo de juguete. Freivalds verifica el producto de matrices sin importar qué pesos sean; con una red real funciona igual. |
| ¿Por qué el validador no recalcula todo? | Acá podría, porque la grilla es chica. Con modelos reales en órbita, la entrada cruda no baja a tierra y recalcular cuesta lo mismo que el cómputo original. Freivalds verifica en O(n²) en vez de O(n³). |
| ¿Por qué el scheduler mandó el trabajo a la Anomalía? | No lo haría: su política elegía ORBIT-03 y lo forzamos para mostrar la red de seguridad. En producción, la auditoría cubre los casos que el scheduler no puede evitar. |
| ¿El bit-flip lo causa la Anomalía? | En la demo lo inyectamos nosotros. En vuelo real (Orbview-2, NASA), más del 80 % de los errores ocurrieron dentro de la Anomalía, aunque el satélite pasaba ahí menos del 20 % de la órbita. |
| ¿Quién audita al auditor? | Los compromisos (Merkle, hashes) y el certificado son públicos: cualquiera puede re-auditar. El validador tiene identidad y reputación en ERC-8004. El próximo paso es un quórum de validadores. |
| ¿Google no dice que la tasa es aceptable? | Su paper estima ~1 corrupción cada 3 millones de inferencias por chip, a 1 inferencia por segundo, y la considera aceptable para inferencia. Con 1 millón de chips son unas 3 por segundo en la flota, y quien paga por el resultado no sabe cuál. |
