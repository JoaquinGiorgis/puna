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

### Ejemplo con el Lote 14 de la demo

- Suma asegurada: 1.370 ha × USD 400/ha = **USD 548.000**. Prima de la aseguradora: 1,8 % = **USD 9.864**.
- PUNA cobra **USD 411 por la campaña** por monitorear el lote (1.370 ha × 0,30) y **USD 40 por las dos auditorías** del job 7: la que rechazó el cálculo con error y la que aprobó el segundo. Cobra igual por el rechazo que por la aprobación: así el auditor no tiene interés en que se pague.
- La licencia anual se reparte entre todos los lotes del programa, no se carga a uno solo.
- Los 11 comprobantes del job 7 en Fuji costaron una fracción ínfima de AVAX. El productor cobró **46 segundos** después de abrir el reclamo.

### Lo que ya hace el contrato y lo que falta

- **Ya hace:** el fee del validador es fijo por intento y se paga apruebe o rechace. Ese es el principio de herramienta, y es el mismo que usamos para cobrar la auditoría.
- **Falta (v2):** el saldo prepago de auditorías, el pago en USDC y que el fee de PUNA se descuente sin depender del resultado.

## 5. Tamaño del mercado

| Nivel | Qué es | Tamaño | Fuente o supuesto |
|---|---|---|---|
| **TAM** | Primas de seguros paramétricos en el mundo; mercado al que se le venden herramientas | USD 15–21 B en 2025, con un crecimiento de 8–13 % anual | GMI, MRFR (ver el informe de mercado) |
| **SAM** | Hectáreas agrícolas aseguradas en Argentina, todas candidatas a un índice satelital auditado | 23,6 M ha × USD 0,30 ≈ **USD 7 M por campaña** en monitoreo, más licencias y auditorías | SSN 2024 para las hectáreas; el precio es supuesto |
| **SOM a 3 años** | Tres aseguradoras y una provincia: unas 600.000 ha en el NOA y el Chaco y unas 3.000 auditorías al año | 4 licencias × 15.000 + 600.000 × 0,30 + 3.000 × 20 ≈ **USD 300.000 por año** | Supuesto nuestro |

- **Lo que agranda el mercado:**
  - La misma capa sirve para cualquier índice que calcule un satélite: sequía, inundación, helada y, fuera del agro, carga, energía o infraestructura.
  - Cuando exista el cómputo orbital a escala (SpaceX, Google Suncatcher, Starcloud), los operadores van a necesitar verificar sus resultados. Ahí PUNA cobra por auditoría, como hoy, pero con muchos más trabajos.
- **Conviene decirlo así:** el agro argentino es la cabeza de playa, no el techo.

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
- **Cómo cobramos:** como herramienta, no como socio. Piloto USD 10.000, licencia de USD 10.000 a 25.000 al año, USD 0,30 por hectárea por campaña y USD 20 por auditoría (supuestos). Cobramos lo mismo apruebe o rechace.
- **Mercado:** 23,6 M ha aseguradas en Argentina. La cabeza de playa es el NOA, donde casi nadie asegura el incendio.
- **Por qué ahora:** la Res. SSN 315/2026 (julio de 2026), los incendios de Salta (julio de 2026) y la llegada del cómputo orbital (2026–2028).
