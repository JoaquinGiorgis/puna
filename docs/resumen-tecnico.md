# PUNA: integridad para cómputo orbital

2026-11-11 · Joaquin

## Resumen técnico final

PUNA es un seguro paramétrico de incendio para lotes agrícolas del NOA. El índice de área quemada lo calcula un nodo de cómputo orbital, lo audita un validador de otro operador con Freivalds en enteros, y un escrow en Avalanche Fuji paga la indemnización solo si la cuenta es correcta. Esta sección manda sobre el resto del documento donde haya diferencias.

### Caso

- **Asegurado:** productor de caña, tabaco o vid en Salta o Jujuy.
- **Asegurador:** un fondo mutual o cooperativa en el piloto; decimos "aseguradora" solo como horizonte, por la regulación de la SSN.
- **Riesgo cubierto:** incendio. Si la fracción quemada del lote supera el disparador, el productor cobra sin perito.
- **Por qué un bit importa:** un "0% quemado" falso deja al productor sin cobrar; un "60%" falso le cuesta a la aseguradora. Las dos partes tienen plata en juego.
- **Cierre del pitch:** el mismo certificado sirve para alertas a brigadas, pero ahí no lo vendemos como decisor. Litio en la Puna queda en próximos pasos.

### Por qué cómputo orbital

Hoy este índice se puede calcular en tierra, y lo decimos nosotros antes que el jurado. PUNA verifica cómputo de un tercero no confiable; la órbita es el peor caso: más fallas, concentradas en la Anomalía, y el operador como único testigo. Cuando el satélite procese a bordo y baje solo el índice, la imagen cruda no llega a tierra y nadie puede recalcular: o se compromete el cálculo en origen o no hay auditoría. Por eso auditar capas desafiadas ahorra bajada de datos, no cómputo.

> "Hoy esto se calcula en tierra y PUNA sirve igual. Cuando el índice nazca en órbita, sin PUNA no hay forma de auditarlo."

### Componentes

| Componente | Qué hace | Tecnología |
|---|---|---|
| Agente cliente | La aseguradora crea la póliza, deposita indemnización y fee, elige el validador | Script + Core Wallet |
| Scheduler orbital | Calcula la exposición a la Anomalía de cada nodo en la ventana de ejecución (saaBps) | `sgp4`, TLE de CelesTrak, polígono de la Anomalía |
| Agente nodo | Corre la CNN entera, publica índice, outputHash y raíz Merkle, pide validación | Python, NumPy/PyTorch |
| Agente validador | De otro operador; audita con Freivalds y responde | Python, proceso e identidad separados |
| Escrow PunaEscrow | Único contrato propio: estados, liquidación de tres salidas, reasignación | Solidity, Foundry, Fuji |
| ERC-8004 | Identidad, validación y reputación de nodos y validadores | Registros ya desplegados en Fuji |
| Web | Mapa 2D con lote, focos, traza y Anomalía; línea de tiempo del job con links al explorer | Next.js, Leaflet o MapLibre, satellite.js; 3D opcional |

### Flujo de un job

1. La aseguradora llama a `createJob` con el hash de la grilla del lote, el hash del modelo, el validador, el beneficiario, el disparador y el depósito.
2. El scheduler elige nodo y lo asigna con su saaBps; el escrow rechaza si supera `maxSaaBps`.
3. El nodo calcula la fracción quemada, publica `indexBps`, `outputHash` y la raíz Merkle con `submitResult`, y llama a `validationRequest` en ERC-8004 nombrando al validador del cliente.
4. El validador baja las capas, verifica con Freivalds el encadenado completo y responde con `validationResponse` (0-100 y hash del certificado).
5. Cualquiera llama a `settle`: si validado y el índice supera el disparador, cobran productor y nodo; si validado y no supera, la indemnización vuelve a la aseguradora y el nodo cobra; si rechazado, no se mueve plata, baja la reputación y se reasigna con `reassign`.

### Matemática

**Modelo:** CNN chica de 3-4 capas cuantizada a enteros (pesos int8, acumulación entera), que clasifica cada celda de la grilla del lote como quemada o no. Índice = celdas quemadas / celdas del lote, en puntos básicos (0-10.000).

**Entrada:** grilla rasterizada desde focos reales de NASA FIRMS (VIIRS, ~375 m) de un incendio en Salta o Jujuy, guardada en `sample-data/`.

**Compromiso:** el nodo hashea entrada y salida de cada capa (SHA-256) en un árbol de Merkle y publica la raíz antes de que el validador elija sus vectores.

**Freivalds módulo un primo:** cada convolución se expresa como multiplicación de matrices con im2col, C = A·B. El validador toma r al azar en el cuerpo de enteros módulo p = 2³¹−1 y comprueba:

```latex
C\, r \equiv A\,(B\, r) \pmod{p}
```

Con r uniforme, un C incorrecto pasa con probabilidad a lo sumo 1/p por repetición; con dos repeticiones es despreciable. Al ser enteros, no hay margen de redondeo donde esconder una falla.

**Encadenado:** además se verifica que la entrada de cada capa sea la salida (recuantizada, con ReLU y pooling recalculados) de la anterior, que la primera entrada coincida con `inputHash`, que la última salida coincida con `outputHash` y que los pesos coincidan con `modelHash`. Sin esto, la raíz Merkle no prueba nada.

**Cobertura:** en la demo se verifican todas las capas. Auditar k capas al azar queda como perilla para modelos grandes: atrapa una capa corrupta con probabilidad k/L.

**Riesgo orbital:** saaBps = fracción de la ventana de ejecución en que el nodo está dentro del polígono de la Anomalía, por 10.000. Es un proxy declarado, no una tasa de fallas.

**Fallas inyectadas:** tres familias, dentro de la operación verificada: flip de exponente en una activación, peso corrupto persistente y multi-bit. Cada prueba guarda semilla, capa, bit y tipo.

### Contrato PunaEscrow

```solidity
enum State { Created, Assigned, Submitted, Paid, NoPayout, Rejected, Refunded }

function createJob(bytes32 inputHash, bytes32 modelHash, address validator, address beneficiary,
                   uint32 triggerBps, uint8 minScore, uint16 maxSaaBps, uint64 deadline,
                   uint256 computeFee) external payable returns (uint256 jobId); // msg.value = indemnizacion + computeFee
function assignNode(uint256 jobId, uint256 agentId, uint16 saaBps, bytes32 orbitHash) external;
function submitResult(uint256 jobId, uint32 indexBps, bytes32 outputHash, bytes32 merkleRoot)
    external returns (bytes32 requestHash);
function settle(uint256 jobId) external;
function reassign(uint256 jobId, uint256 newAgentId, uint16 saaBps, bytes32 orbitHash) external;
function refund(uint256 jobId) external;
function setValidatorAllowed(address validator, bool allowed) external;

event JobCreated(uint256 indexed jobId, address indexed insurer, address beneficiary, uint256 indemnity);
event NodeAssigned(uint256 indexed jobId, uint256 indexed agentId, uint8 attempt, uint16 saaBps);
event ResultSubmitted(uint256 indexed jobId, bytes32 requestHash, uint32 indexBps);
event PayoutTriggered(uint256 indexed jobId, address beneficiary, uint32 indexBps, uint256 amount);
event NoPayout(uint256 indexed jobId, uint32 indexBps);
event JobRejected(uint256 indexed jobId, uint256 indexed agentId, uint8 score);
```

- `requestHash = keccak256(chainid, escrow, jobId, attempt, agentId, inputHash, modelHash, indexBps, outputHash, merkleRoot)`: ata intento, índice y resultado; es el anti-replay.
- `settle` lee la validación una sola vez y exige validador = el elegido por el cliente, agentId correcto y `responseHash` distinto de cero. La máquina de estados impide liquidar dos veces.
- El validador cobra un fee fijo apruebe o rechace. Feedback en Reputation desde el escrow con try/catch.
- Sin slashing económico en el MVP: el nodo pierde reputación y el fee, no una garantía.

### ERC-8004 en Fuji

| Registro | Dirección |
|---|---|
| Identity | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| Reputation | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| Validation | `0x8004Cb1BF31DAf7788923b405b754f57acEB4272` |

- Solo el dueño del agente pide validación; solo el validador nombrado responde.
- La respuesta es un número que pone el validador y se puede pisar: el escrow lee una vez.
- `requestHash` es único global.
- Reputation revierte si el dueño se califica a sí mismo.
- El README oficial no lista Validation para Avalanche testnet: smoke test en la primera hora; plan B, el escrow verifica la firma EIP-712 del validador con ecrecover.

### Demo (100-120 s)

1. Lote de caña en Salta con póliza on-chain y focos FIRMS reales sobre el mapa.
2. El nodo asignado cruza la Anomalía; un bit dado vuelta hace que devuelva "0% quemado": el productor no cobraría.
3. El validador rechaza, el escrow no liquida y baja la reputación del nodo.
4. Se reasigna a un nodo fuera de la Anomalía; el índice da 37% y supera el disparador; el productor cobra en el explorer.
5. Una frase sobre el caso inverso: un falso positivo le costaría a la aseguradora.

### Límites que declaramos

- PUNA prueba que el cálculo es correcto, no que la imagen de entrada sea auténtica.
- Satélites, nodos, operadores y radiación son simulados y están etiquetados; órbitas, focos FIRMS, verificación y transacciones son reales.
- Hoy el índice se puede calcular en tierra.
- ERC-8004 es borrador y Validation no figura en el README para Avalanche testnet.
- No reemplazamos la detección de Flipless; somos complementarios.

### Pitch

> "Cuando el satélite que decide si te pagan el seguro pasa por la Anomalía del Atlántico Sur, un bit dado vuelta te puede costar la cosecha: PUNA hace que un tercero audite el cálculo y el contrato pague solo si la cuenta es correcta."

## La idea en simple

PUNA (Proof of Untampered Neural Answers) permite que alguien que no confía en el operador de un satélite compruebe que una IA calculada en órbita se calculó bien, antes de pagar por el resultado.

Un productor de caña en Salta tiene un seguro paramétrico de incendio: si el satélite calcula que se quemó más de cierta fracción del lote, cobra sin perito. Si un bit dado vuelta por radiación hace que el cálculo dé "0% quemado", se queda sin cobrar; si da un falso positivo, pierde la aseguradora. Hoy nadie fuera del operador puede comprobar ese cálculo.

Contexto: SpaceX, Google y Starcloud quieren data centers en órbita. Allá arriba la radiación da vuelta bits en los chips sin tirar errores, y la zona donde más pasa, la Anomalía del Atlántico Sur, está sobre Argentina.

PUNA hace tres cosas: elige un satélite según su exposición a la Anomalía, hace que publique una huella de cada capa de su cálculo, y deja que un validador elegido por la aseguradora lo audite con Freivalds en enteros sin rehacer todo. El escrow en Avalanche paga la indemnización solo si el cálculo pasa y el índice supera el disparador; si falla, no se mueve plata, el nodo pierde reputación y el trabajo se reasigna.

> "Cuando el satélite que decide si te pagan el seguro pasa por la Anomalía del Atlántico Sur, un bit dado vuelta te puede costar la cosecha: PUNA hace que un tercero audite el cálculo y el contrato pague solo si la cuenta es correcta."

## El problema

Cuando el cómputo orbital se venda como servicio, el cliente no va a tener forma de comprobar por su cuenta que un resultado se calculó bien: hoy el operador se autocertifica.

**Quién lo sufre**

- El productor asegurado, que puede quedarse sin cobrar por un cálculo corrupto.
- La aseguradora o fondo mutual, que puede pagar de más por un falso positivo.
- El operador de la constelación, que vende cómputo y no puede probar que sus resultados están bien.

**Contexto del mercado**

| Actor | Qué está haciendo |
|---|---|
| SpaceX (con xAI) | Pidió a la FCC hasta 1 millón de satélites como data centers orbitales; demostradores hacia Q4 2027 y, según su S-1, despliegue desde 2028 |
| Starcloud (YC, Nvidia) | Puso la primera H100 en órbita en noviembre 2025 |
| Google, Project Suncatcher | Lanzó cuatro TPUs en órbita el 1 de octubre de 2026; en su ensayo de radiación estima una corrupción silenciosa cada ~3 millones de inferencias |

**El hueco no es la detección, es la confianza entre partes.** Detectar bit-flips ya está resuelto bastante bien por otros (ver Competencia). Lo que nadie resuelve es que un tercero, sin confiar en el operador, pueda comprobar el resultado antes de pagar.

### Competencia: Flipless

[Flipless](https://flipless.space/) detecta y repara bit-flips en inferencia de IA mientras corre, para GPUs en órbita. Recalcula cada 16 pasos y compara bit a bit; reporta 0 de 3.296 fallas que cambiaban la respuesta sin detectar (inyectadas por software, H100/H200/B200) y 0 de 10.048 falsas alarmas. Es mucho más avanzado que nosotros en detección.

Su log de fallas lo genera el mismo operador. No competimos en detección; nos diferenciamos en tres cosas:

|  | Flipless | PUNA |
|---|---|---|
| Detección dentro del nodo | Sí, muy avanzada | Sí, ABFT básico |
| Verificación por un tercero que no confía en el operador | No | Sí, con Freivalds sobre compromisos Merkle |
| Pago condicionado en la cadena | No | Sí, escrow en Avalanche |
| Ubicar el trabajo según la órbita (fuera de la Anomalía) | No, reubica después de una falla | Sí, antes de ejecutar |

**Por qué Argentina:** la Anomalía del Atlántico Sur está sobre Sudamérica. En los datos de vuelo del satélite Orbview-2 (705 km), más del 80% de los bit-flips ocurrieron dentro de la Anomalía, aunque el satélite pasa menos del 20% de su órbita ahí ([NASA](https://nepp.nasa.gov/DocUploads/42DD3AD9-E539-4B6C-A2867222EA313B9A/Jul03_Flight.pdf)). La exposición real depende de altitud, inclinación y blindaje.

## Cómo funciona

Esta sección es el diseño de trabajo previo y queda como referencia; donde difiera, manda el Resumen técnico final (Freivalds en enteros, sin ABFT interno, riesgo como saaBps, caso de seguro de incendio).

_(diagrama de flujo en el doc original)_

Si el cálculo falla la verificación, el nodo no cobra, pierde reputación y el trabajo se reejecuta en un nodo fuera de la Anomalía.

### 1. Dónde está cada satélite

Bajamos los TLE de satélites reales desde CelesTrak y los propagamos con SGP4 (librerías `sgp4` o `skyfield`). Resultado: latitud, longitud y altitud de cada nodo, segundo a segundo.

### 2. Cuánta radiación recibe

Para el MVP usamos un mapa 2D con la intensidad del campo magnético de IGRF o un polígono de la Anomalía: campo más débil, más radiación. AP8/AP9 queda como mejora, porque intensidad magnética no es lo mismo que flujo de partículas. El sistema corre en dos modos explícitos: **modo científico** (exposición estimada con un modelo documentado) y **modo inyección** (frecuencia de fallas amplificada para la demo, etiquetada como simulación). Con eso calculamos la tasa esperada de errores, donde σ es la sección eficaz del chip y Φ el flujo de partículas en esa posición:

```latex
\lambda = \sigma \cdot \Phi
```

La probabilidad de al menos un bit dado vuelta durante un trabajo de duración t es el riesgo del nodo en ese momento:

```latex
P = 1 - e^{-\lambda t}
```

### 3. Verificar el cálculo con ABFT

Una red neuronal es multiplicar matrices, C = A·B. Usamos Algorithm-Based Fault Tolerance (Huang y Abraham, 1984):

- Antes de multiplicar, agregamos a A una fila con la suma de sus columnas y a B una columna con la suma de sus filas.
- Después chequeamos que las sumas de C coincidan con las predichas. Si un bit se dio vuelta en el medio, no cierran.
- Si fallan una fila y una columna, el cruce indica qué número se corrompió y permite corregirlo.
- Chequear cuesta O(n²) y multiplicar O(n³): casi gratis.
- En float32 se compara con una tolerancia, para no confundir redondeo con corrupción.

```latex
e^{T} C \overset{?}{=} (e^{T} A)\, B \qquad C\, e \overset{?}{=} A\, (B\, e)
```

En float los resultados nunca coinciden exactos por redondeo, así que el umbral es adaptativo: se calibra por capa con ejecuciones limpias y se reporta la tasa de falsos positivos. Límite honesto: un checksum detecta bien los flips del exponente pero casi no ve los de bits bajos de la mantisa. Por eso ABFT queda como chequeo interno del nodo, no como prueba hacia afuera.

### 3b. Verificación por un tercero con Freivalds

El nodo publica una raíz Merkle de las entradas y salidas de cada capa. Un validador de otro operador elige una capa al azar, el nodo revela esos datos con su prueba Merkle y el validador comprueba la multiplicación con un vector r al azar, sin rehacerla ([Slalom](https://ar5iv.labs.arxiv.org/html/1806.03287v1) usa la misma idea para verificar redes neuronales):

```latex
C\, r \overset{?}{=} A\,(B\, r)
```

- Cuesta O(n²) contra O(n³) de recalcular, y se repite con varios r para bajar la probabilidad de error.
- Funciona bien en las multiplicaciones matriz-matriz de una red convolucional sobre imágenes.
- Los pesos se comparan contra el hash del modelo registrado, así un peso corrompido también falla.
- Para falsificar una huella que pase, el nodo tendría que hacer el cálculo correcto de todos modos.
- Revisar una sola capa al azar atrapa una capa corrupta con probabilidad 1/L; la política define cuántas capas auditar según el riesgo del trabajo.

### 4. Verificar los pesos del modelo

La memoria es lo más frágil. Hasheamos cada capa con SHA-256, armamos un árbol de Merkle y recalculamos la raíz periódicamente. Un solo bit cambiado en los pesos cambia la raíz e indica qué capa se dañó.

### 5. Decidir qué hacer

Si P supera un umbral, o falla un checksum, el trabajo se reejecuta en el nodo con menor riesgo que tenga contacto. Comparamos ambas salidas midiendo la distancia entre coordenadas con haversine; si difieren más de unos cientos de metros, se descarta la corrupta.

### 6. Inyección de errores para la demo

Con hooks de PyTorch inyectamos fallas **dentro de la operación que se verifica**, nunca después del chequeo (si no, la prueba no demuestra nada). Familias: un bit del exponente, un bit de la mantisa, varios bits, errores correlacionados en una región, peso corrompido persistente, activación corrompida, falla repetida en el mismo nodo y caída del nodo. Cada prueba guarda semilla, capa, bit y tipo. También corremos miles de inferencias limpias para medir falsos positivos.

### 7. Certificado firmado

Cada veredicto sale con un certificado: jobId y nonce, hash de la entrada, hash del modelo, hash del resultado, raíz Merkle de las capas, política de verificación, chequeos hechos, versión del detector y del modelo de radiación, marcas de simulación, firmas de los validadores y vencimiento. Se firma con ECDSA secp256k1 en formato EIP-712, que Solidity verifica nativamente. Es una atestación de qué controles se hicieron, no una prueba de que la IA "dice la verdad".

### 8. Dato real

NASA FIRMS (sensor VIIRS) da detecciones de anomalías térmicas con coordenadas, a ~375 m de resolución; no son imágenes etiquetadas. Lo usamos como referencia para comparar la salida de una red convolucional chica que detecta focos de calor en imágenes satelitales de Salta. El caso de la demo: con un bit corrompido, la red deja de ver un foco real de FIRMS o inventa uno. Un solo bit en los pesos puede bajar la precisión de una red más de 90% ([Hong et al., USENIX Security 2019](https://www.usenix.org/conference/usenixsecurity19/presentation/hong)). Mostramos un caso medido, no armado a mano.

## Blockchain en Avalanche

El escrow paga a un nodo orbital solo si un validador de otro operador aprueba su resultado en el registro de validación de ERC-8004; así el operador deja de autocertificarse. Categoría del track: Agentes, cruzada con Geoespacial.

**Frase de la solución:** cuando un nodo orbital calcula la fracción quemada de un lote asegurado, el escrow paga la indemnización al productor solo si un validador independiente aprueba el cálculo y el índice supera el disparador; si el cálculo falla, no se mueve plata y el trabajo se reasigna.

**Contrato en Solidity, desplegado en Fuji (C-Chain)**

1. **Identidad:** cada nodo y cada validador se registra en el Identity Registry de ERC-8004 ya desplegado en Fuji (`0x8004A818BFB912233c491871b3d84c89A494BD9e`).
2. **Escrow (lo único que escribimos nosotros):** el cliente deposita el pago; estados Creado → Enviado → Validado o Rechazado, con protección contra doble liquidación, firmas reusadas, validadores no autorizados y trabajos que vencen.
3. **Pedido de validación:** el nodo publica la raíz Merkle y llama a `validationRequest` en el Validation Registry (`0x8004Cb1BF31DAf7788923b405b754f57acEB4272`), apuntando a un validador de otro operador.
4. **Respuesta:** el validador corre Freivalds y responde con `validationResponse` (puntaje de 0 a 100 más el hash del certificado).
5. **Liquidación:** el escrow lee esa respuesta y libera el pago o lo retiene; el reintento queda atado al mismo trabajo, sin cobrar dos veces.
6. **Reputación:** el cliente deja feedback en el Reputation Registry (`0x8004B663056A597Dffe9eCcC1965A193B7388713`).

No hay un relayer central de PUNA: el veredicto lo emite un validador distinto del que ejecutó. Perder reputación no es lo mismo que perder plata: slashing económico solo existe si el nodo deposita una garantía antes, y en el MVP no la pedimos. ERC-8004 sigue siendo un borrador ([EIP-8004](https://eips.ethereum.org/EIPS/eip-8004)).

**Test de las 4 preguntas**

| Pregunta | Respuesta |
|---|---|
| ¿Quién desconfía de quién? | Productor y aseguradora entre sí, y los dos del operador orbital, que hoy se autocertifica |
| ¿Qué evento dispara algo on-chain? | Un índice validado por encima del disparador libera la indemnización al productor |
| ¿Qué pasa si el dato miente? | El validador rechaza con Freivalds y no se paga a nadie; límite declarado: la autenticidad de la imagen de entrada |
| ¿Quién paga y quién cobra? | La aseguradora deposita indemnización y fee; el productor cobra si corresponde; el nodo cobra por el cálculo validado; el validador, un fee fijo |

**Entregables obligatorios del track:** contrato en el explorer de Fuji, video de 1 a 3 minutos con una acción on-chain, deck de 5 a 7 slides con la slide "por qué blockchain", repo y atribución de las fuentes de datos.

## Qué es real y qué es simulado

La física, los datos y la criptografía son reales; que esos satélites sean nodos de cómputo es simulado, y se dice en pantalla.

| Real | Simulado (etiquetado en pantalla) |
|---|---|
| Órbitas de satélites reales vía CelesTrak, propagadas con SGP4 | Que esos satélites sean nodos de cómputo |
| Campo magnético IGRF / polígono de la Anomalía | La tasa de bit-flips en modo inyección, amplificada para la demo |
| Detecciones reales de NASA FIRMS en Salta como referencia | La inferencia corre en la laptop, no en órbita |
| Fallas inyectadas de verdad dentro de las operaciones verificadas | Operadores distintos: validadores corriendo como procesos separados con identidad propia |
| Freivalds, Merkle y firmas EIP-712 reales | — |
| Contratos ERC-8004 y escrow con transacciones reales en Fuji | — |

## Demo y pitch

La demo abre con el productor de caña asegurado y cierra con números del benchmark. El guion vigente está en el Resumen técnico final.

**Guion de 3 minutos**

1. Lote de caña en Salta con póliza on-chain y focos FIRMS reales en el mapa.
2. El nodo cruza la Anomalía; un bit dado vuelta da "0% quemado": el productor no cobraría.
3. El validador rechaza, el escrow no liquida y baja la reputación del nodo.
4. Se reasigna a un nodo fuera de la Anomalía; el índice da 37%, supera el disparador y el productor cobra en el explorer.
5. Cierre: el caso inverso le costaría a la aseguradora, y el mismo certificado sirve para alertas a brigadas.

**Métricas del benchmark**

- Tasa de detección por familia de falla
- Tasa de falsos positivos sobre miles de ejecuciones limpias
- Corrupciones que escapan sin detectar
- Cómputo extra y latencia de recuperación
- Latencia y costo de gas de la liquidación en Fuji

No anunciamos ninguna cifra antes de medirla, y no extrapolamos fallas inyectadas por software a tasas reales en órbita.

**Deck de 7 slides:** problema en el NOA, solución, cómo funciona, por qué blockchain, demo, modelo de negocio, próximos pasos y fuentes.

**Pitch en una línea:** cuando el satélite que decide si te pagan el seguro pasa por la Anomalía, un bit dado vuelta te puede costar la cosecha; PUNA hace que un tercero audite el cálculo y el contrato pague solo si la cuenta es correcta.

### Respuestas para el jurado

| Si preguntan | Respondemos |
|---|---|
| "Google estima una corrupción cada ~3 millones de inferencias y la considera aceptable" | Ese número es para su órbita y blindaje; los errores se concentran en la Anomalía, son silenciosos, y a escala de millones de inferencias por día "raro" pasa todos los días |
| "Flipless ya detecta bit-flips" | Sí, y mejor que nosotros. Su log lo genera el operador; PUNA agrega verificación por un tercero, pago en la cadena y ubicación según la órbita. Son complementarios |
| "¿Por qué no una base de datos?" | Porque las partes no confían entre sí: el que ejecuta no puede ser el que certifica |
| "¿Y si el validador miente?" | Es de otro operador, tiene identidad y reputación propias, y su veredicto queda firmado en la cadena; con más validadores se usa quórum |
| "¿El mercado existe?" | Todavía no a escala: SpaceX, Google y Starcloud tienen demostradores y el despliegue arranca desde 2028. Construimos la capa de confianza antes de que haga falta |

## Stack, alcance y riesgos

Todo es software y entra en 2,5 días si el contrato se despliega el primer día.

| Capa | Tecnología |
|---|---|
| Motor de verificación | Python, PyTorch (red convolucional, ABFT, Merkle por capa, inyección de fallas), FastAPI con WebSocket |
| Validadores externos | Procesos separados con identidad propia, Freivalds en NumPy |
| Órbita y radiación | `sgp4` o `skyfield`, IGRF o polígono de la Anomalía en mapa 2D |
| Criptografía | SHA-256, árbol de Merkle, ECDSA secp256k1 con EIP-712 |
| Blockchain | Avalanche Fuji: registros ERC-8004 ya desplegados + escrow propio en Solidity, Foundry, Core Wallet |
| Frontend | Next.js con mapa 2D; globo 3D (globe.gl) como extra |
| Datos | CelesTrak (TLE), NASA FIRMS (focos de calor) |
| Infraestructura | Oracle Cloud si los mentores lo piden (preguntar si es obligatorio) |

**Fuera de alcance:** hardware, térmica, comunicaciones reales con satélites, L1 propia, AP8/AP9 y slashing con garantía económica.

**Riesgos**

- Flipless ya resuelve detección mejor que nosotros: no competimos ahí, nos posicionamos en verificación por terceros, pago y ubicación orbital.
- El jurado puede decir que el mercado todavía no existe: respuesta con el caso de incendios en el NOA y los demostradores de SpaceX, Google y Starcloud.
- Freivalds sobre una capa al azar es probabilístico: mostrar la política de cuántas capas auditar y su probabilidad de captura.
- ERC-8004 es borrador y su interfaz puede cambiar: el escrow lo envuelve con una capa propia delgada.
- La API de FIRMS puede caerse: respuestas guardadas en `sample-data/`.
- Video y deploy fallan más que el código: transacción confirmada de respaldo y video grabado antes del viernes 13 a las 9:00.

**Abierto:** confirmar con los mentores el track final (Avalanche, categoría Agentes, salvo que el desafío de QualyData encaje mejor) y si Oracle Cloud es obligatorio.

## Plan de desarrollo

El contrato en Fuji tiene que estar en el explorer el miércoles a las 17:00; la entrega se hace el viernes a las 07:30, con 90 minutos de colchón antes del cierre de las 09:00.

**Cambios de diseño tras la validación**

- **Freivalds en enteros:** la CNN se cuantiza a enteros y se verifica módulo un primo (2³¹−1). En float32 hay que dejar un margen de redondeo y una falla puede esconderse dentro de él.
- **Se verifican todas las capas** de una CNN chica (3-4 capas), más el encadenado: entrada de cada capa = salida de la anterior, primera entrada = inputHash, última salida = outputHash. ReLU y pooling se recalculan directo.
- **Sin ABFT interno:** no competimos en detección y es el mayor sumidero de tiempo.
- **Riesgo orbital como proxy honesto:** fracción de la ventana de ejecución dentro del polígono de la Anomalía (saaBps), no una P con σ inventada.
- **El cliente elige al validador** de una lista autorizada; el validador cobra un fee fijo apruebe o rechace.
- **Política del caso:** el satélite que ve Salta está dentro de la Anomalía, así que la inferencia se difiere hasta salir o se releva a otro nodo.

**Roles**

| Persona | Responsabilidad |
|---|---|
| P1, Joaquín | Solidity y Foundry, scripts on-chain, integración e2e, lead |
| P2 | Python: modelo entero, Merkle, Freivalds, validador, inyección |
| P3 | Datos y órbita (FIRMS, CelesTrak, sgp4, polígono) y mapa Next.js |
| P4 | Línea de tiempo del job, deck, guion, video, README, QA |

Con 3 personas, P3 suma deck y video, y P1 la UI.

**Miércoles 11**

| Hora | Qué | Hito |
|---|---|---|
| 12:00-13:00 | Congelar alcance, repo público, 5 wallets, faucet, pedir MAP_KEY de FIRMS; smoke test de ERC-8004 en Fuji | H0: tx de register y validationResponse en el explorer |
| 13:00-16:00 | Escrow y tests; CNN entera y Merkle; FIRMS y TLE a sample-data/; guion | Tests de Foundry en verde |
| 16:00-17:00 | Deploy v0 y verificación | H1: contrato en el explorer con un createJob |
| 17:00-20:00 | e2e con hashes dummy; Freivalds y validador CLI; exposición a la Anomalía; shell Next.js | Camino feliz on-chain con dummy |
| 21:00-00:30 | Integración real: nodo, submit, validador, response, settle | H2: camino feliz real por CLI, grabado (respaldo 1) |
| 01:00-07:00 | Dormir |  |

Plan B si H0 falla: el escrow verifica la firma EIP-712 del validador con ecrecover y ERC-8004 queda solo para Identity y Reputation.

**Jueves 12**

| Hora | Qué | Hito |
|---|---|---|
| 07:30-11:00 | Reasignación, feedback, maxSaaBps, redeploy final; 3 inyecciones; mapa 2D; línea de tiempo | H3: contrato final verificado, dirección congelada |
| 11:00-13:00 | e2e completo: rechaza, no paga, baja reputación, reasigna, paga | H4: respaldo 2 en docs/txs.md |
| 14:00-18:00 | UI conectada; benchmark mini de 300 inyecciones; deck | H5: demo completa dos veces seguidas; feature freeze |
| 18:00-20:00 | Solo bugs y ensayo |  |
| 21:00-23:30 | Grabar video (3 tomas, 1080p, explorer visible) | Video subido como no listado |
| 23:30-01:00 | Deck, README, atribución, sample-data/; entrega en borrador |  |

**Opcional, vista 3D (P4, jueves 14:00-18:00, solo si H4 está cumplido a las 13:00):** React Three Fiber con drei, Tierra con texturas Blue Marble y Black Marble de NASA, satélites con modelos GLB gratis de NASA 3D Resources (comprimidos con Draco), órbitas con satellite.js desde los TLE y la Anomalía como mancha roja sobre Sudamérica. Momento de la demo: el satélite entra a la zona, destello del bit-flip y zoom a Salta con el foco de FIRMS. Sin lógica propia: lee los mismos datos que el mapa 2D, que se hace igual como plan B. Blender solo para un render de 10 segundos que abre el video, hecho en paralelo por quien arme el video.

**Viernes 13:** 06:30-07:30 probar links en incógnito y entregar; 07:30-09:00 ensayo del pitch.

**Qué se tira primero si hay atraso**

1. Benchmark: queda una tabla chica
2. maxSaaBps on-chain: la Anomalía queda solo en el mapa
3. Mapa interactivo: imagen estática
4. Feedback en Reputation
5. UI: demo por terminal más explorer
6. Reasignación: dos jobs separados

Nunca se tiran el contrato desplegado, el rechazo sin pago ni FIRMS real.

**Contrato PunaEscrow**

Las firmas vigentes del contrato, con beneficiario, disparador y liquidación de tres salidas, están en el Resumen técnico final.

- requestHash = keccak256 de chainid, escrow, jobId, intento, agentId, inputHash, modelHash, outputHash y merkleRoot: ata intento y resultado, y es el anti-replay.
- El nodo llama a validationRequest; el escrow no puede, porque no es dueño del agente.
- settle exige validador = el elegido por el cliente, agentId correcto y responseHash distinto de cero; paga o rechaza una sola vez y llama a giveFeedback con try/catch.

**Gotchas verificados de ERC-8004 en Fuji:** solo el dueño del agente pide validación y solo el validador nombrado responde; la respuesta es un número que pone el validador y se puede pisar; requestHash es único global; Reputation revierte si el dueño se califica a sí mismo. El README oficial todavía no lista Validation para Avalanche testnet: puede cambiar.

**Estructura del repo:** contracts/ (PunaEscrow, interfaz ERC-8004, tests, deploy) · node/ (modelo, job, Merkle, inyección) · validator/ (Freivalds, verify, respond) · orbit/ (TLE, Anomalía, FIRMS) · web/ (mapa y línea de tiempo) · scripts/ · sample-data/ · bench/ · docs/ (txs.md, deck, ATTRIBUTION.md).

## Fuentes

- [Hackathon Argentina Space 2026](https://competencia.argentinaspace.com/)
- [Track Blockchain Avalanche: guía y criterios](https://avalanche-track.vercel.app/guia)
- [Track Avalanche: cómo llevar datos a la cadena](https://avalanche-track.vercel.app/blockchain)
- [FCC: pedido de SpaceX por hasta 1 millón de satélites](https://docs.fcc.gov/public/attachments/DA-26-113A1.txt)
- [Satellite Today: SpaceX compra xAI y presenta el pedido](https://www.satellitetoday.com/connectivity/2026/02/02/spacex-files-for-orbital-data-center-satellites-amid-xai-merger-reports/)
- [Google: el prototipo de Project Suncatcher está en órbita](https://blog.google/innovation-and-ai/models-and-research/google-research/project-suncatcher-prototype/)
- [Google: paper de Suncatcher, ensayo de radiación y tasa de corrupción](https://arxiv.org/abs/2511.19468)
- [Flipless: detección de bit-flips en IA orbital](https://flipless.space/)
- [NASA: datos de vuelo de Orbview-2, más del 80% de los bit-flips en la Anomalía](https://nepp.nasa.gov/DocUploads/42DD3AD9-E539-4B6C-A2867222EA313B9A/Jul03_Flight.pdf)
- [Slalom: verificación de redes neuronales con Freivalds](https://ar5iv.labs.arxiv.org/html/1806.03287v1)
- [EIP-8004 (borrador)](https://eips.ethereum.org/EIPS/eip-8004)
- [Direcciones de los contratos ERC-8004, incluida Fuji](https://erc-8004.quicknode.com/docs/contracts)
- [Hong et al., USENIX Security 2019: un bit puede romper una red neuronal](https://www.usenix.org/conference/usenixsecurity19/presentation/hong)
- [Starcloud-1 y la H100 en órbita](https://goraka.pages.dev/stories/starcloud-trains-first-llm-in-space.html)

Atribución de datos para la entrega: CelesTrak (TLE), NASA FIRMS (detecciones de incendios).