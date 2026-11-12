# Modelo de negocio de PUNA

> **En una frase:** PUNA es una herramienta que la aseguradora compra para tener la certeza de que el índice satelital que dispara un pago se calculó bien. Cobra una licencia, por hectárea monitoreada y por auditoría, nunca un porcentaje de la prima ni del pago. El primer caso es el incendio en campos del NOA; la misma capa sirve para sequía, inundación o helada.

Las cifras de mercado tienen su fuente en [`reports/Seguros paramétricos blockchain agro.md`](../reports/Seguros%20paramétricos%20blockchain%20agro.md). **Los precios y las proyecciones son supuestos nuestros** y están marcados como tales.

## 1. Qué vendemos

PUNA no es una aseguradora, ni un intermediario, ni un socio que comparte la prima. Tampoco vende imágenes. Es la **capa de validación y liquidación** que va entre el satélite que calcula y la aseguradora que paga:

```
Satélite / nodo orbital ──calcula el índice──▶ Validador de otro operador ──audita──▶ PunaEscrow (Avalanche) ──paga──▶ Asegurado
        (operador A)                              (operador B, Freivalds)                 (reglas fijas, públicas)
```

Un seguro paramétrico tiene tres riesgos de confianza:

| Riesgo | Pregunta | Quién lo resuelve hoy |
|---|---|---|
| Diseño | ¿El índice representa la pérdida real? | Actuarios, backtesting |
| Dato | ¿Llegó el dato correcto? | Proveedores de datos, oráculos (Chainlink) |
| **Cálculo** | **¿El índice se calculó bien con ese dato?** | **Nadie: se da por cero. Lo resuelve PUNA** |

El riesgo de cálculo deja de ser cero cuando el índice lo calcula un satélite de otra empresa:
- El operador cobra por el resultado y se certifica a sí mismo.
- Los bit flips se concentran en la Anomalía del Atlántico Sur, que está justo sobre Sudamérica.

## 2. Quién participa y qué gana cada uno

PUNA es un mercado de dos lados. La **demanda** son las aseguradoras que necesitan índices confiables. La **oferta** son los operadores de cómputo satelital y los validadores que los auditan. El productor es el beneficiario final.

| Actor | Qué le duele hoy | Qué le da PUNA | ¿Paga? |
|---|---|---|---|
| **Aseguradora con licencia** (cliente) | Liquidar un incendio pide un perito, tarda semanas y genera disputas. Para incendio en el NOA no tiene producto. La Res. SSN 315/2026 le exige dar acceso al cálculo y pagar en 15 días | Un índice auditado por un tercero en cada siniestro, el pago automático en minutos y un registro público que muestra a la SSN y al reasegurador. Sin perito para el disparador | **Sí: compra la herramienta** (plataforma anual y verificaciones) |
| **Asegurado** (productor, cooperativa) | Espera semanas para cobrar y no puede comprobar por qué le pagan o no | Cobra en horas, sin trámite, y ve el cálculo y el comprobante | No directamente: la prima la paga a la aseguradora |
| **Reasegurador** | Le cede riesgo a una aseguradora sin poder auditar evento por evento | Ve cada evento y cada pago on-chain, con menos riesgo de modelo | Indirectamente: con mejores condiciones de capacidad |
| **Operador de cómputo orbital** (nodo) | Vende cómputo y no puede probar que el resultado está bien | Un sello de "resultado verificado" y una reputación ERC-8004 que le trae más trabajos | Cobra el fee de cómputo **solo si pasa la auditoría** |
| **Validador** (otro operador) | No tiene un mercado donde cobrar por auditar | Cobra un fee por intento auditado, apruebe o rechace | Cobra |
| **Regulador (SSN)** | Le cuesta auditar productos paramétricos nuevos | Trazabilidad pública del índice, del cálculo y del pago | No |

## 3. Cliente ideal

### Cliente que paga: aseguradora agro con licencia que ya vende paramétrico

- **Quién:**
  - una aseguradora argentina con ramo agropecuario y cartera en el NOA;
  - que ya vende un paramétrico de sequía por satélite, porque ya entiende el producto y tiene el plan aprobado;
  - que tiene un área de innovación o un "agro digital".
- **Ejemplo del perfil:** las que hoy venden paramétrico de sequía en Salta, Tucumán y Santiago del Estero. **No tenemos acuerdos con ninguna**: es el perfil al que apuntamos.
- **Por qué ahora:**
  - **Regulación:** la Res. SSN 315/2026, vigente desde el 23/07/2026, abre el ramo y exige proveedor de datos, acceso al cálculo y pago en 15 días. PUNA cumple esos tres puntos sin trabajo extra.
  - **Evento:** en julio de 2026 el zonda provocó una ola de incendios en Salta, con unas 7.000 ha quemadas y un muerto.
  - **Hueco:** el 98,9 % de las primas agro del país es granizo, y el incendio solo existe como adicional.
- **Quién decide:**
  - **Decide:** el gerente de riesgos agropecuarios o de suscripción agro.
  - **Empuja:** el área de innovación.
  - **Frena:** legales y cumplimiento. Para ellos, el checklist de la Res. 315 ya está en el producto.
- **Señales de que encaja:**
  - tiene más de 50.000 ha aseguradas en el NOA o en el Chaco;
  - ya trabaja con datos de CONAE o NASA;
  - su reasegurador le pide más trazabilidad.

### Segundo cliente: tomador público

- **Quién:** una provincia o un municipio que contrata una cobertura colectiva de incendio para pequeños productores, como programa de emergencia agropecuaria.
- **Por qué:**
  - La Res. 315 **no exige aprobación previa** cuando el tomador es el Estado.
  - Es el modelo con el que arrancaron todos los paramétricos de la región: CCRIF, CADENA en México y SAC en Perú.
- **Rol de PUNA:** la provincia contrata con una aseguradora, y PUNA es la capa que mide, audita y dispara el pago.

### Tercer cliente: quien financia la campaña

- **Quién:** cooperativas, acopiadores, exportadores y bancos que adelantan la campaña. Piden que el seguro tenga un endoso a su favor.
- **Por qué:** quieren que su garantía no se queme. Con PUNA ven el siniestro y el pago al mismo tiempo que el productor.

### Beneficiario: el productor mediano del NOA

- **Perfil:** de 500 a 5.000 ha de soja, poroto o pastura, en zona de monte, con quemas vecinas y temporada seca de junio a octubre.
- **Hoy:** casi no se asegura contra incendio. El NOA es solo el 2,5 % de las hectáreas aseguradas del país, y Salta tuvo cero siniestros pagados en 2024.

## 4. Cómo ganamos plata: PUNA es una herramienta, no un socio

PUNA le vende software y un servicio de verificación a la aseguradora. **No cobra un porcentaje de la prima ni de los pagos.** Hay tres razones:

1. **Independencia.** PUNA audita el cálculo que decide si se paga. Si cobrara más cuando hay pago, o una parte de la prima, tendría interés en el resultado. Un auditor cobra lo mismo apruebe o rechace, y así funciona hoy el contrato: el validador cobra su fee en los dos casos.
2. **Regulación.** En Argentina, promover seguros y asesorar al asegurado es tarea de productores asesores matriculados en la SSN (Ley 22.400). Una comisión por póliza o por prima convertiría a PUNA en intermediario. Quien toma una parte de la prima a cambio de suscribir riesgo es una MGA (por ejemplo Descartes, Otonomi), y ese no es nuestro negocio.
3. **Precedentes.** Los proveedores que escalaron vendiéndole a aseguradoras cobran licencias y suscripciones por un trabajo concreto. Guidewire cobra por el volumen de primas que administra su software, pero como licencia, no como participación. CAPE Analytics, que Moody's acordó comprar en 2025, vende scores por suscripción. Floodbase es el agente de cálculo del producto de Guy Carpenter. Los protocolos on-chain que cobran un porcentaje de la prima, como Re y Ensuro, se quedan con muy poco. El detalle está en [`reports/Modelos de negocio de herramientas.md`](../reports/Modelos%20de%20negocio%20de%20herramientas.md).

### Planes (precios supuestos nuestros, a validar en el piloto)

| Plan | Qué incluye | Precio |
|---|---|---|
| **Piloto** | Una campaña (90 a 120 días) en paralelo con la liquidación tradicional, hasta 50 lotes, métricas acordadas de antemano: coincidencia con el perito, tiempo hasta el pago, costo por siniestro | **USD 10.000** fijo, o sin cargo si podemos publicar el caso |
| **Licencia anual** | Por programa paramétrico: cartera web, checklist de la Res. SSN 315, soporte, un cupo de auditorías incluido | **USD 10.000 a 25.000** al año según el plan |
| **Monitoreo** | Vigilancia satelital de cada lote asegurado durante la campaña | **USD 0,30 por ha por campaña** |
| **Auditoría** | Cada cálculo auditado por un validador independiente y liquidado on-chain, **apruebe o rechace**. Incluye el fee del validador, que se paga en stablecoin | **USD 20 por auditoría** fuera del cupo, más el costo de red al costo |
| **Enterprise** | Marca blanca para reaseguradores o brokers, SLA, red propia de Avalanche con la aseguradora y el reasegurador como validadores | Licencia anual a medida |
| **Implementación** | Integración con el sistema de la aseguradora y armado de la póliza paramétrica | USD 8.000 a 20.000, una sola vez |

- **El precio no depende del resultado.** Ni la prima ni la indemnización cambian lo que cobra PUNA: se cobra la licencia, el monitoreo por hectárea y cada auditoría, apruebe o rechace.
- **Cobro on-chain como Chainlink Functions:** en la v2, la aseguradora carga un saldo prepago en el contrato y cada auditoría descuenta su fee. La plataforma anual se factura en pesos o dólares, como cualquier software.
- **Por qué cobramos más que el costo de cómputo:** auditar con Freivalds cuesta casi nada. Lo que se paga es la independencia del validador, la liquidación en 15 días que pide la Res. 315 y la trazabilidad para la SSN y el reasegurador.

### Por qué esos precios: el ancla es lo que la aseguradora ya gasta

Datos de la encuesta agro de la SSN (julio 2023 a junio 2024). Los montos en dólares son conversiones nuestras al mayorista de junio de 2024 (ARS 912).

| Dato real | Valor | Fuente |
|---|---|---|
| Hectáreas aseguradas | 23,57 M ha, 188.584 pólizas, 28 aseguradoras agrícolas | SSN 2024 |
| Primas agro | ARS 357.152 M, unos **USD 392 M**, o sea **USD 16,6 por ha** | SSN 2024 (conversión nuestra) |
| Siniestros pagados | **45.497** en el año, unos **1,9 por cada 1.000 ha** | SSN 2024 |
| Inspección | Con granizo (98,9 % de las primas) cada denuncia lleva perito en el campo dentro de los 15 días, a cargo de la aseguradora | Condiciones generales de La Dulce |
| Gastos | Administración 12,8 % y adquisición 13,6 % de las primas; combined ratio **121,5 %**: el ramo pierde plata | SSN 2024 |
| Referencia internacional | En EE. UU. el Estado le reconoce a la aseguradora un **6 % de la prima** como gasto de liquidación en la cobertura catastrófica | USDA RMA, vía CRS |
| NOA y Chaco | 819.000 ha aseguradas, unos USD 8 M de prima (USD 9,9 por ha), el 2,1 % de las primas del país | SSN 2024 |

**La regla de precio:** PUNA tiene que costar **menos que el gasto de liquidar con perito**. Apuntamos a que el total quede entre el **3 % y el 5 % de la prima** del programa, por debajo del 6 % que usa como referencia el sistema de EE. UU. y muy por debajo del 12,8 % que hoy se va en administración. Dato que falta y se mide en el piloto: cuánto cobra un perito por inspección en Argentina; no lo encontramos publicado.

### Ejemplo real 1: la plata que se movió en el job 7 (Fuji)

La aseguradora depositó 0,02 AVAX: 0,015 de indemnización, 0,002 para el satélite que calcule y 0,003 para hasta tres auditorías.

| Quién | Por qué | Cobró |
|---|---|---|
| Productor | 37,8 % quemado auditado supera el disparador del 30 % | 0,015 AVAX |
| ORBIT-03 | Su cálculo pasó la auditoría | 0,002 AVAX |
| ORBIT-07 | Su cálculo no pasó (score 49) | 0 |
| Validador | Dos auditorías, una rechazó y otra aprobó: cobra lo mismo en las dos | 0,002 AVAX |
| Aseguradora | Recupera la auditoría que no se usó | 0,001 AVAX |

Costo de red de las 11 transacciones: casi nulo. En la v1 PUNA no cobra; el fee de plataforma entra en la v2.

### Ejemplo real 2: un programa de 100.000 ha en Santiago del Estero

Con los datos de la SSN para esa provincia (358.000 ha aseguradas, ARS 3.890 M de prima, unos USD 11,9 por ha):

| Concepto | Cálculo | Monto |
|---|---|---|
| Prima del programa | 100.000 ha × USD 11,9 | USD 1.190.000 |
| Siniestros esperados | 100.000 ha × 1,9 por cada 1.000 ha | unos 193 (232 auditorías, contando reintentos) |
| Licencia anual, incluye 100 auditorías | Fijo | USD 15.000 |
| Monitoreo | 100.000 ha × USD 0,30 | USD 30.000 |
| Auditorías fuera del cupo | 132 × USD 20 | USD 2.640 |
| **PUNA total** | | **USD 47.640, el 4 % de la prima** |

Contra eso, la aseguradora deja de mandar perito a unos 190 siniestros para decidir si se dispara el pago, y cumple de entrada el acceso al cálculo y el plazo de 15 días de la Res. SSN 315.

### Lo que ya hace el contrato y lo que falta

- **Ya hace:** el fee del validador es fijo por intento y se paga apruebe o rechace. Es el mismo principio con el que cobramos la auditoría.
- **Falta (v2):** el saldo prepago de auditorías, el pago en USDC y el fee de PUNA descontado sin depender del resultado.

## 5. Proyección a 3 años

**Supuestos:** precios de la tabla de planes; 1,9 siniestros por cada 1.000 ha (SSN 2024) y 1,2 auditorías por siniestro; costos de un equipo chico en Argentina (3 a 6 personas) más infraestructura: USD 120.000, 220.000 y 320.000 por año. Los datos satelitales que usamos hoy (FIRMS, Sentinel) son gratuitos y auditar con Freivalds cuesta casi nada, así que el costo es casi todo equipo.

| Escenario | 2027 | 2028 | 2029 |
|---|---|---|---|
| **Conservador** | Piloto pago, sin programa · **USD 10.000** | 1 aseguradora, 80.000 ha · **USD 40.700** | 2 aseguradoras, 200.000 ha · **USD 101.300** |
| **Base** | Piloto + 1 programa de 50.000 ha · **USD 40.300** | 3 aseguradoras, 200.000 ha · **USD 117.300** | 4 aseguradoras + 1 provincia, 500.000 ha · **USD 266.200** |
| **Optimista** | 2 programas, 120.000 ha · **USD 77.600** | 5 aseguradoras, 500.000 ha · **USD 263.200** | 7 aseguradoras + 2 provincias, 1,2 M ha · **USD 590.600** |
| Costos | USD 120.000 | USD 220.000 | USD 320.000 |

- **Lectura honesta:** en el escenario base, PUNA no cubre sus costos en 3 años solo con agro en el norte argentino (resultado 2029: unos USD −54.000). El punto de equilibrio llega cerca de las **600.000 ha** bajo PUNA. Es el 2,5 % de las hectáreas aseguradas del país, pero más que todo el NOA y el Chaco juntos.
- **El precio queda entre 3 % y 5 % de la prima** en todos los escenarios, como apunta la regla de precio.
- **Qué tiene que pasar para el base:** que el piloto muestre que el índice coincide con el perito y que una aseguradora del top 10 (el top 10 tiene el 90 % de las primas) lo lleve a su programa. Una provincia como tomadora (exenta de aprobación previa por la Res. 315) acelera el año 3.
- **Para crecer de verdad** hay que salir del incendio en el NOA: sequía en la zona núcleo (Córdoba ya tiene un piloto provincial de hasta 500.000 ha), otros países (Brasil, Paraguay) y, cuando llegue, el cómputo orbital, donde los operadores satelitales pagan por auditoría.

| Nivel | Qué es | Tamaño | Fuente |
|---|---|---|---|
| **TAM** | Primas de seguros paramétricos en el mundo | USD 15–21 B en 2025, +8–13 % anual | GMI, MRFR (informe de mercado) |
| **SAM** | Seguro agrícola argentino, a USD 0,30 por ha más licencias | 23,57 M ha ≈ **USD 7 M de monitoreo por campaña**, más licencias y auditorías | SSN 2024; precio supuesto |
| **SOM a 3 años** | Escenario base | **500.000 ha, unos USD 266.000 por año** | Cálculo de arriba |

## 6. Competencia y alternativas

| Alternativa | Qué hace | Por qué no alcanza |
|---|---|---|
| Perito tradicional | Inspecciona el campo después del siniestro | Tarda semanas y genera disputas. No escala para miles de hectáreas en el monte |
| Proveedores de índice (Descartes, Floodbase, Arbol) | Calculan el índice satelital en su casa | Validan con backtesting, no auditan cada evento. Además venden el índice, así que no son un tercero neutral |
| Oráculos (Chainlink) | Llevan el dato a la cadena | Prueban que **llegó** el dato, no que el índice **se calculó bien** |
| Detección en el nodo (Flipless) | Detecta bit flips dentro del satélite | El log lo genera el mismo operador, así que no hay un tercero ni un pago condicionado. Es complementario |
| zkML, opML, TEE | Otras formas de cómputo verificable | zkML tarda minutos u horas en probar. opML tiene una ventana de unos 7 días que mata el pago rápido. Un TEE certifica qué código corrió, pero no que el hardware calculó bien |

**Nuestra ventaja:**
- Una auditoría barata por un tercero: Freivalds más compromisos Merkle, sin hardware especial.
- El pago condicionado on-chain.
- La asignación según la órbita: el trabajo no se manda a un satélite que está en la Anomalía.

## 7. Cómo llegamos al mercado

| Fase | Qué | Hito |
|---|---|---|
| **0. Hoy** | Demo en Fuji: rechazo de un cálculo corrupto, reasignación y pago. Cartera web para la aseguradora | Hecho |
| **1. Piloto (6 meses)** | Una aseguradora del perfil ideal, de 20 a 50 lotes en el NOA, en paralelo con su liquidación tradicional (shadow mode). Validadores corridos por dos empresas distintas | Comparar el índice de PUNA con el perito, y el tiempo hasta el pago |
| **2. Producto aprobado (12 meses)** | Plan paramétrico de incendio presentado a la SSN, con estudio actuarial y backtesting con FIRMS desde 2012. O tomador provincial, que no necesita aprobación previa | Primera campaña con primas reales. Pago en USDC o en pesos |
| **3. Más riesgos y regiones** | Sequía y helada con la misma capa. Chaco, Santiago del Estero y Paraguay | Más de 500.000 ha |
| **4. Cómputo orbital** | Los operadores satelitales se suman como nodos y los validadores ponen stake. Red propia de Avalanche con aseguradoras y reaseguradores como validadores | Fee por auditoría a gran volumen |

**Canales:**
- Productores asesores de seguros, que son los que ya venden agro en el NOA.
- Cooperativas.
- Programas provinciales de emergencia agropecuaria.

## 8. Riesgos y cómo los bajamos

| Riesgo | Mitigación |
|---|---|
| Riesgo de base: el índice no refleja la pérdida real | No lo negamos. Se informa en la póliza, como pide la Res. 315, y se reduce con backtesting y con disparadores escalonados |
| La regulación no contempla blockchain ni pagos en cripto | Paga la aseguradora con licencia, en pesos o USDC. PUNA es la capa de auditoría y disparo, no el asegurador |
| Poca demanda: varios seguros on-chain cerraron | Arrancamos con una aseguradora con distribución propia y un tomador público, no vendiéndole al productor de a uno |
| Que el validador se ponga de acuerdo con el nodo | Validadores de otro operador elegidos por la aseguradora. En la v2, varios validadores con stake y slashing |
| El cómputo orbital tarda en llegar | El producto ya sirve con cálculo en tierra. La auditoría por un tercero vale igual |
| Que nos traten como intermediarios o como socios | Le vendemos solo a la aseguradora, nunca al productor, y cobramos licencia, hectárea y auditoría, sin comisión por póliza ni porcentaje de prima o de pago |
| Venta larga: con aseguradoras un contrato tarda 12 a 18 meses | Entramos con un piloto pago de una campaña, con métricas acordadas, y vendemos también a través de reaseguradores y brokers con marca blanca |

## 9. Para la slide de modelo de negocio

- **Cliente:** aseguradoras agro con licencia en el NOA. Después, provincias y quienes financian la campaña.
- **Beneficiario:** el productor, que cobra en minutos y puede verificar por qué.
- **Qué vendemos:** que el índice que dispara el pago esté bien calculado, auditado por un tercero y liquidado on-chain.
- **Cómo cobramos:** como herramienta, no como socio. Piloto USD 10.000, licencia de USD 10.000 a 25.000 al año, USD 0,30 por hectárea por campaña y USD 20 por auditoría (supuestos). Cobramos lo mismo apruebe o rechace. Total: entre 3 % y 5 % de la prima, por debajo del 6 % de gasto de liquidación de referencia.
- **Ejemplo:** un programa de 100.000 ha en Santiago del Estero paga unos USD 47.600 al año, el 4 % de su prima.
- **Proyección (base):** USD 40.000 en 2027, 117.000 en 2028 y 266.000 en 2029. El equilibrio llega cerca de las 600.000 ha; para crecer más hay que sumar sequía, otros países y cómputo orbital.
- **Mercado:** 23,6 M ha aseguradas en Argentina. La cabeza de playa es el NOA, donde casi nadie asegura el incendio.
- **Por qué ahora:** la Res. SSN 315/2026 (julio de 2026), los incendios de Salta (julio de 2026) y la llegada del cómputo orbital (2026–2028).
