# Transacciones de respaldo (Fuji, chain 43113)

Se completa en cada hito. Explorer: https://testnet.snowtrace.io

| Hito | Acción | Tx | Notas |
|---|---|---|---|
| H0 | Identity.register (ORBIT-07) | [0x043b90c0…](https://testnet.snowtrace.io/tx/0x043b90c0a14aa5f9509d2c4d7fc450e5e6fee926d4653ddd7be486ae930c26e2) | agentId 300, owner nodeA `0xf6B9…cE67` |
| H0 | Identity.register (ORBIT-03) | [0x98670499…](https://testnet.snowtrace.io/tx/0x98670499a76434f7eef6c018a8b3489636b8c64f5c6b40f6ab3be80d1dd41639) | agentId 301, owner nodeB `0x5C8b…B6a0` |
| H0 | validationRequest (nodeA → validator, agent 300) | [0xd1dffb35…](https://testnet.snowtrace.io/tx/0xd1dffb3597e292c68dc10a82d1ad44feb4a0275b1f416adfcf60df938590c6aa) | requestHash `0xcc59fe57…f600f0a2` |
| H0 | validationResponse (100, tag `smoke`) | [0x5e60c269…](https://testnet.snowtrace.io/tx/0x5e60c269170b68ababe2c7e06830c9d0299a88285dabc935b2e7f58bcccecc73) | getValidationStatus coincide campo por campo |
| H1 | Deploy PunaEscrow | [0x4d2bffa9…](https://testnet.snowtrace.io/tx/0x4d2bffa900264d27a39ef83f0143f1975cc9d0f88df5b41aa490906566b44d69) | dirección: [`0xBcA4312A49CD8CED7aC61fd630F114E0DD2CF982`](https://testnet.snowtrace.io/address/0xBcA4312A49CD8CED7aC61fd630F114E0DD2CF982) (verificado) |
| H1 | setValidatorAllowed(validator) | [0x17df5680…](https://testnet.snowtrace.io/tx/0x17df5680ec02e079b8f1b6e4db744420a6c0b9d9b780eec2ad2c908a2da72127) | validator `0xFdce…17B4` |
| H1 | createJob de prueba (insurer) | [0x82f82dd2…](https://testnet.snowtrace.io/tx/0x82f82dd2e43a2717a6c92372610bfc068fa7d531ebd6ef2fcd0c110d798a7c46) | jobId 1, indemnización 0,006 AVAX, disparador 3.000 bps, deadline 15:41 ART (refund después) |
| H2 | createJob (aseguradora, 0,02 AVAX) | [0x494b82b9…](https://testnet.snowtrace.io/tx/0x494b82b9e9220d8bf68c130c5430de717851881195faf6d319484738c061ced1) | jobId 4, indemnización 0,015, minScore 80, maxSaaBps 10.000 |
| H2 | assignNode ORBIT-03 (scheduler) | [0xf14155c3…](https://testnet.snowtrace.io/tx/0xf14155c3bee7695331628495379d585f4685f0a9cbdbeccbaced14347ffbea8b) | agentId 301, saaBps 0 (NOAA 21, ventana 12/11 15:30Z) |
| H2 | submitResult (nodo ORBIT-03) | [0x4a36ef62…](https://testnet.snowtrace.io/tx/0x4a36ef62d389cb150d282e916887e7147a846605ddf086182739efc330771810) | indexBps 3.777 |
| H2 | validationRequest ERC-8004 (nodo) | [0x7e09fbee…](https://testnet.snowtrace.io/tx/0x7e09fbee8c003167d295f8f30ee4412afab6537aaffc9d99d5cf06b6ca62c0f5) | requestHash `0xfa0ac7ae…35c2ca` |
| H2 | validationResponse (agente validador) | [0xd7b86fec…](https://testnet.snowtrace.io/tx/0xd7b86fec9268a092c05ec51c468956439d4d58e6c8f901d651aa6ae4ed1697f8) | score 100, tag `puna-freivalds` |
| H2 | settle → **Paid** | [0x1b25b961…](https://testnet.snowtrace.io/tx/0x1b25b9614e9263de5f15e3a25c0a559346a1ef660cbf2da850572f97489a9153) | productor +0,015 AVAX; giveFeedback en Reputation OK |
| H2 | (previas) jobs 2 y 3, también Paid | [job 2 settle…](https://testnet.snowtrace.io/tx/0x82bdb11c61bc21c112ffd5e0048024d4767c9f40080cf6e33d511f2e60ce5c56) · [job 3 settle…](https://testnet.snowtrace.io/tx/0x5593f69bb69b1bba768ef7cc1c6adcb21172234d632e6b99792fe9474b92000d) | job 3: la 1.ª validationResponse se quedó sin gas; se agregó margen de 30 % |
| H3 | Dirección congelada | — | PunaEscrow `0xBcA4312A49CD8CED7aC61fd630F114E0DD2CF982` (sin redeploy: el fuente no cambió desde v0) |
| H3 | assignNode con saaBps 10.000 > maxSaaBps 2.000 (job 6) | [0xf5f6017f…](https://testnet.snowtrace.io/tx/0xf5f6017fb1b91c66e72f6e28d54bb4ca2c258c08311db6ec9a3ee819db350009) | revierte `SaaTooHigh(10000, 2000)` |
| H3 | Job 5: settle intento 1 → Rejected | [0x8edd7671…](https://testnet.snowtrace.io/tx/0x8edd7671f3bb4ec1265e0fadffe8ab397ec60390027691dfaf6da26d61e0bd05) | score 49; giveFeedback 0 en Reputation OK (sin FeedbackFailed) |
| H3 | Job 5: reassign ORBIT-03 → settle Paid | [0x586ae6e3…](https://testnet.snowtrace.io/tx/0x586ae6e3cc3dd9d86ccbeea7b36816778d68f0e0812fc4e94f862dbf1148ef4e) | [reassign](https://testnet.snowtrace.io/tx/0xbdb4d03a055f41c3806e4f26a8d4f21f6721627ee5883da5f76f19240acfec18), score 100, productor +0,015 |
| H4 | Demo job 7: createJob (maxSaaBps 10.000) | [0xd24f08e4…](https://testnet.snowtrace.io/tx/0xd24f08e41dbb9cdd85894f90cc75318a9225e67ce475e7d9450db12d3ea5fad9) | jobId 7 |
| H4 | Demo job 7: assignNode ORBIT-07, saaBps 10.000 | [0x58835a6f…](https://testnet.snowtrace.io/tx/0x58835a6f00da7e50e0423625208b6255b9846a5e12b0b056a4e482f2b2756402) | el scheduler (modo demo) asigna el nodo en la Anomalía |
| H4 | Demo job 7: submitResult ORBIT-07 (falla weight:2:2:7) | [0xd34583fe…](https://testnet.snowtrace.io/tx/0xd34583feb3b00cec5116759901b585dd12e6ae70c3765964e6dd104b5838d0da) | indexBps 0 |
| H4 | Demo job 7: validationRequest ORBIT-07 | [0x4aa0a698…](https://testnet.snowtrace.io/tx/0x4aa0a69873cca142ef8a0f32c2288d2296755fc8c503ecb94279034bd4df1835) |  |
| H4 | Demo job 7: validationResponse score 49 | [0x2239deb0…](https://testnet.snowtrace.io/tx/0x2239deb0ba3fb2f0a14cf46ac344d0023366efe0b0592873183880b914879c3f) | "Rechazado: capa L3 … no pasa Freivalds" |
| H4 | Demo job 7: settle → **Rejected** | [0x15914187…](https://testnet.snowtrace.io/tx/0x15914187dcdd71b61d6c8687f1ff9137722878a59faf72b29cd473e888dd089e) | sin pago; reputación de ORBIT-07 baja |
| H4 | Demo job 7: reassign ORBIT-03, saaBps 0 | [0x09943229…](https://testnet.snowtrace.io/tx/0x0994322995664806a636988d6702dd1b524570523069e5edb8bff9b0afe30ee3) | política: releva al nodo fuera de la Anomalía |
| H4 | Demo job 7: submitResult ORBIT-03 | [0x267dbe59…](https://testnet.snowtrace.io/tx/0x267dbe59b5a22ca9678ec61f2581d26191f372cef255e0708a9f1534f5506870) | indexBps 3.777 |
| H4 | Demo job 7: validationRequest ORBIT-03 | [0x0bc70463…](https://testnet.snowtrace.io/tx/0x0bc70463012f21c3230a3c036d33438c76af7a2d297bcaa12f63c4513b82f0fa) |  |
| H4 | Demo job 7: validationResponse score 100 | [0xc94ad8fe…](https://testnet.snowtrace.io/tx/0xc94ad8fe383654790d032092f831638351a32c5c19c84fb0e9a31319311d2f96) |  |
| H4 | Demo job 7: settle → **Paid** | [0xba0727e9…](https://testnet.snowtrace.io/tx/0xba0727e9691b788e74a1e1c7054a6613413d537dd43749fa3442973c814ddd6b) | productor +0,015 AVAX |
