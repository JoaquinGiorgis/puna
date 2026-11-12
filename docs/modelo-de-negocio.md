# Modelo de negocio de PUNA

> **En una frase:** PUNA le vende a la aseguradora la certeza de que el índice que dispara un pago se calculó bien. Hoy esa certeza no existe, y va a hacer falta cuando el cálculo corra en satélites de terceros. El primer mercado es el seguro paramétrico de incendio para campos del NOA.

Las cifras de mercado tienen su fuente en [`reports/Seguros paramétricos blockchain agro.md`](../reports/Seguros%20paramétricos%20blockchain%20agro.md). **Los precios y las proyecciones son supuestos nuestros** y están marcados como tales.

## 1. Qué vendemos

PUNA no es una aseguradora ni un proveedor de imágenes. Es la **capa de validación y liquidación** que va entre el satélite que calcula y la aseguradora que paga:

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
| **Aseguradora con licencia** (cliente) | Liquidar un incendio pide un perito, tarda semanas y genera disputas. Para incendio en el NOA no tiene producto. La Res. SSN 315/2026 le exige dar acceso al cálculo y pagar en 15 días | Un índice auditado por un tercero en cada siniestro, el pago automático en minutos y un registro público que muestra a la SSN y al reasegurador. Sin perito para el disparador | **Sí: es nuestro cliente** |
| **Asegurado** (productor, cooperativa) | Espera semanas para cobrar y no puede comprobar por qué le pagan o no | Cobra en horas, sin trámite, y ve el cálculo y el comprobante | No directamente: la prima la paga a la aseguradora |
| **Reasegurador** | Le cede riesgo a una aseguradora sin poder auditar evento por evento | Ve cada evento y cada pago on-chain, con menos riesgo de modelo | Indirectamente: con mejores condiciones de capacidad |
| **Operador de cómputo orbital** (nodo) | Vende cómputo y no puede probar que el resultado está bien | Un sello de "resultado verificado" y una reputación ERC-8004 que le trae más trabajos | Cobra el fee de cómputo **solo si pasa la auditoría** |
| **Validador** (otro operador) | No tiene un mercado donde cobrar por auditar | Cobra un fee por intento auditado, apruebe o rechace | Cobra |
| **Regulador (SSN)** | Le cuesta auditar productos paramétricos nuevos | Trazabilidad pública del índice, del cálculo y del pago | — |

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

## 4. Cómo ganamos plata

| Fuente | Quién paga | Cómo | Precio (supuesto nuestro) |
|---|---|---|---|
| **Fee de plataforma por hectárea** (principal) | Aseguradora | Por cada hectárea con póliza paramétrica que se monitorea y se liquida con PUNA, por campaña | **USD 0,30 / ha / campaña** |
| **Fee por verificación** | Aseguradora (dentro del depósito del siniestro) | Por cada siniestro auditado y liquidado | USD 25 por evento, más el costo de red |
| **Comisión del mercado de cómputo** (cuando haya cómputo orbital) | Se descuenta de los fees de nodo y validador | Un porcentaje de cada `computeFee` y `validatorFee` que pasa por el escrow | 10 % |
| **Licencia del índice o marca blanca** | Aseguradora o reasegurador | Índice de área quemada auditado más la cartera web con su marca | Anual, a negociar |

**Ejemplo con el Lote 14 de la demo:**
- Suma asegurada: 1.370 ha × USD 400/ha = **USD 548.000**.
- Prima: 1,8 % = **USD 9.864**.
- Fee de PUNA: 1.370 ha × 0,30 = **USD 411 por campaña**, o sea el **4,2 % de la prima**. Si hay siniestro se suman USD 25.
- Costo real de red: los 11 comprobantes del job 7 en Fuji costaron una fracción ínfima de AVAX. En mainnet, la liquidación cuesta centavos.
- Velocidad: el productor cobró **46 segundos** después de abrir el reclamo. La Res. 315 da 15 días.

**Lo que ya hace el contrato desplegado y lo que todavía no:**
- Ya hace: reparte la indemnización, el fee del nodo y el fee del validador, y devuelve lo que no se usó.
- Todavía no: el fee de plataforma de PUNA no está en `PunaEscrow` v1. Va en la v2, junto con el pago en USDC.

## 5. Tamaño del mercado

| Nivel | Qué es | Tamaño | Fuente o supuesto |
|---|---|---|---|
| **TAM** | Primas de seguros paramétricos en el mundo | USD 15–21 B en 2025, con un crecimiento de 8–13 % anual | GMI, MRFR (ver el informe) |
| **SAM** | Hectáreas agrícolas aseguradas en Argentina, todas candidatas a un paramétrico verificado (incendio primero, después sequía y helada) | 23,6 M ha × USD 0,30 ≈ **USD 7 M por año** | SSN 2024 para las hectáreas; el precio es supuesto nuestro |
| **SOM a 3 años** | El NOA más el Chaco con una o dos aseguradoras y una provincia | 500.000 ha × USD 0,30 ≈ **USD 150.000 por año** | Supuesto nuestro: el NOA hoy tiene unas 579.000 ha aseguradas |

- **Lo que agranda el mercado:**
  - La misma capa de validación sirve para cualquier índice calculado por satélite: sequía, helada, inundación y, fuera del agro, carga, energía o infraestructura.
  - El mercado de cómputo orbital (SpaceX, Google Suncatcher, Starcloud) todavía no existe a escala. Cuando exista, va a necesitar alguien que verifique sus resultados, y ahí está el negocio grande.
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
| **4. Cómputo orbital** | Los operadores satelitales se suman como nodos y los validadores ponen stake. Red propia de Avalanche con aseguradoras y reaseguradores como validadores | Comisión sobre el mercado de cómputo |

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

## 9. Para la slide de modelo de negocio

- **Cliente:** aseguradoras agro con licencia en el NOA. Después, provincias y quienes financian la campaña.
- **Beneficiario:** el productor, que cobra en minutos y puede verificar por qué.
- **Qué vendemos:** que el índice que dispara el pago esté bien calculado, auditado por un tercero y liquidado on-chain.
- **Precio:** USD 0,30 por hectárea por campaña, más USD 25 por siniestro verificado (supuestos). Para el Lote 14 son USD 411, el 4,2 % de la prima.
- **Mercado:** 23,6 M ha aseguradas en Argentina. La cabeza de playa es el NOA, donde casi nadie asegura el incendio.
- **Por qué ahora:** la Res. SSN 315/2026 (julio de 2026), los incendios de Salta (julio de 2026) y la llegada del cómputo orbital (2026–2028).
