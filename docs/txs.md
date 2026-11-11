# Transacciones de respaldo (Fuji, chain 43113)

Se completa en cada hito. Explorer: https://testnet.snowtrace.io

| Hito | Acción | Tx | Notas |
|---|---|---|---|
| H0 | Identity.register (ORBIT-07) | [0x043b90c0…](https://testnet.snowtrace.io/tx/0x043b90c0a14aa5f9509d2c4d7fc450e5e6fee926d4653ddd7be486ae930c26e2) | agentId 300, owner nodeA `0xf6B9…cE67` |
| H0 | Identity.register (ORBIT-03) | [0x98670499…](https://testnet.snowtrace.io/tx/0x98670499a76434f7eef6c018a8b3489636b8c64f5c6b40f6ab3be80d1dd41639) | agentId 301, owner nodeB `0x5C8b…B6a0` |
| H0 | validationRequest (nodeA → validator, agent 300) | [0xd1dffb35…](https://testnet.snowtrace.io/tx/0xd1dffb3597e292c68dc10a82d1ad44feb4a0275b1f416adfcf60df938590c6aa) | requestHash `0xcc59fe57…f600f0a2` |
| H0 | validationResponse (100, tag `smoke`) | [0x5e60c269…](https://testnet.snowtrace.io/tx/0x5e60c269170b68ababe2c7e06830c9d0299a88285dabc935b2e7f58bcccecc73) | getValidationStatus coincide campo por campo |
| H1 | Deploy PunaEscrow | | dirección: |
| H2 | createJob → assign → submit → response → settle (camino feliz) | | |
| H4 | Demo completa: rechazo → reassign → Paid | | |
