# Revisión técnica de Avalanche (12/11/2026)

Revisamos todo lo que toca Avalanche contra la guía del track (avalanche-track.vercel.app: `/`, `/guia`, `/blockchain`) y contra la cadena: el contrato, los scripts on-chain, la web y la documentación.

## Resultado

- Las cuatro entregas técnicas del track están cubiertas.
- El contrato está desplegado, verificado y con la demo completa on-chain.
- No hay fallas que obliguen a redesplegar.
- Se corrigió un problema chico en los scripts y se documentaron, con tests, dos límites del contrato para la v2.

## Checklist del track

| Requisito | Estado | Evidencia |
|---|---|---|
| Contrato desplegado en Fuji, con link al explorer | ✓ | `PunaEscrow` [`0xBcA4…F982`](https://testnet.snowtrace.io/address/0xBcA4312A49CD8CED7aC61fd630F114E0DD2CF982) · también en el [explorer de Avalanche](https://explorer-test.avax.network/c-chain/address/0xBcA4312A49CD8CED7aC61fd630F114E0DD2CF982) |
| Acción on-chain demostrable | ✓ | Job 7: rechazo → reasignación → pago ([`txs.md`](txs.md)) |
| Datos reales | ✓ | NASA FIRMS (Anta, Salta), TLE de CelesTrak, guardados en `sample-data/` como plan B |
| Slide «por qué blockchain» | ✓ en el repo | Sección "Por qué blockchain" del README, con las 4 preguntas del track |
| Atribución de fuentes | ✓ | [`ATTRIBUTION.md`](ATTRIBUTION.md) |
| Secretos fuera del repo | ✓ | `.env` en `.gitignore`. Solo `.env.example` está versionado y no tiene valores. `FIRMS_MAP_KEY` solo vive en el servidor |
| Video (1–3 min) y deck | Pendiente | Lo hace el equipo |

## Verificado contra la cadena

| Qué | Cómo | Resultado |
|---|---|---|
| Fuente verificado = fuente del repo | `getsourcecode` de Routescan, comparado archivo por archivo | `PunaEscrow.sol` e `IERC8004.sol` idénticos. solc 0.8.24, optimizer 200, EVM cancun, igual a `foundry.toml` |
| ABI de los scripts y de la web | Comparadas con `contracts/out` | `onchain/abi` y `web/lib/abi` idénticas |
| Firmas ERC-8004 | Smoke test H0 contra los proxies de Fuji ([`erc8004.md`](erc8004.md)) | Coinciden. Validation está desplegado aunque no figure en el README oficial |
| Reputación | `getSummary(agente, [escrow], "puna", "")` | ORBIT-07 (300): 5 feedbacks, promedio 0. ORBIT-03 (301): 8 feedbacks, promedio 100 |
| Estado de los jobs | `getJob(1..10)` | 8 `Paid`, 1 `Refunded`, y el job 6 en `Created` con el deadline vencido |
| Tests | `forge test` · `pytest -q` | 16/16 y 35/35 |

El job 6 fue la prueba de `SaaTooHigh` y retiene 0,005 AVAX. Cualquiera puede llamar `refund(6)`, que se los devuelve a la aseguradora y además deja un `Refunded` real on-chain.

## Revisión del contrato

**Lo que está bien**
- Liquidación en tres salidas: `Paid`, `NoPayout` y `Rejected`.
- La validación se lee una sola vez en `settle`, porque la respuesta en el registro se puede pisar.
- El `requestHash` incluye `chainid` y la dirección del escrow, así que no se reusa entre cadenas ni entre contratos. Además se marca como usado.
- `settle` exige que el validador y el agente sean los del job. Solo el dueño del agente en Identity publica el resultado.
- Sigue el orden checks-effects-interactions y tiene `nonReentrant` en `settle` y `refund`.
- El feedback en Reputation va en `try/catch`, así que no bloquea el pago.
- Los fees del validador quedan fijos al crear el job. Los fees no usados vuelven a la aseguradora.
- Usa errores tipados y emite eventos para cada transición.

**Límites conocidos.** No se arreglan ahora para no cambiar el fuente verificado. Cada uno tiene un test que fija el comportamiento actual, en `contracts/test/PunaEscrowLimits.t.sol`.

| # | Límite | Impacto | Mitigación hoy | Arreglo v2 |
|---|---|---|---|---|
| 1 | Pasado el deadline, `refund` acepta un job `Submitted` aunque el validador ya haya aprobado. | Si nadie llama `settle` antes del deadline, la aseguradora puede recuperar la plata de un siniestro aprobado. | Cualquiera puede llamar `settle`: el productor, el nodo o un bot, apenas responde el validador. Los scripts lo llaman enseguida. | En `refund`, si hay respuesta del validador, revertir y obligar a `settle`. O dar un período de gracia después del deadline. |
| 2 | Pagos push: si el beneficiario o el nodo no aceptan AVAX, `settle` revierte entero. | El job queda trabado hasta el deadline y después vuelve a la aseguradora. | El beneficiario y el nodo son cuentas EOA. | Pull payments: un saldo por cuenta y `withdraw()`. |
| 3 | `owner` no se puede transferir y no hay pausa. | Si se pierde la clave del deployer, no se pueden habilitar validadores nuevos. | Es testnet, con la clave del deployer en `.env`. | `Ownable2Step` y `Pausable`. |
| 4 | Un solo validador por job. | La garantía depende de ese validador. | Está en una allowlist, lo elige la aseguradora y es de otro operador que el nodo. | Quorum de validadores (2 de 3) o un validador que pone stake. |
| 5 | `assignNode` no comprueba que el agente exista en Identity. | Un `agentId` inexistente recién falla en `submitResult` y gasta un intento. | Lo llama un scheduler de confianza. | Llamar `identity.ownerOf(agentId)` al asignar. |

## Scripts y web

| Hallazgo | Estado |
|---|---|
| `onchain.send` pedía el nonce con `latest`. La RPC pública balancea entre nodos, y uno atrasado puede devolver un nonce viejo, lo que provoca "nonce too low" o una tx reemplazada. | **Corregido**: usa `pending`. |
| Gas: a `validationResponse` le quedaba justa la estimación. | Ya tenía un margen del 30 %. Las tx son EIP-1559, con fees que completa web3. |
| `eth_getLogs` en la RPC de Avalanche está limitado a 100 bloques. | El validador barre de a 100. La web usa publicnode (que tiene CORS) en tramos de 20.000 bloques. |
| La web lee en vivo con viem (`avalancheFuji`) y verifica el sha256 de cada certificado antes de mostrarlo. | OK. Si la RPC falla, muestra la última lectura o la foto, y lo indica. |
| Comentario desactualizado en `Deploy.s.sol` (decía "confirmar Validation en H0"). | **Corregido**. Además ahora indica que la dirección está congelada. |
| Explorer: la guía del track usa `explorer-test.avax.network`. Nosotros linkeamos Snowtrace (Routescan), que es donde está verificado el código. | El README ahora suma el link al explorer de Avalanche. |

## Pendientes que requieren una acción

- `refund(6)` para liberar los 0,005 AVAX trabados. Es opcional y cualquier wallet con gas lo puede hacer.
- El video y el deck. El deck tiene que incluir la slide «por qué blockchain». Se puede tomar de la sección del README.
- Hacer público el repo, si el reglamento lo pide.
