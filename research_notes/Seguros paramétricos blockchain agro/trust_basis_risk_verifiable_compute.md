# Trust problems in parametric insurance and the verifiable / orbital compute landscape (as of Nov 2026)

Scope note: ~20 searches/fetches. Many orbital-compute and ERC-8004 sources are secondary (blogs, aggregators). Each is flagged where relevant. Prefer the primary sources marked [PRIMARY].

## 1. Basis risk in parametric insurance: definitions, quantified examples, disputed or missed payouts, mitigation

### Takeaway
Basis risk is the gap between what the index pays and what the policyholder actually lost. It is the best-documented trust problem in index insurance, and the evidence quantifies it well: IBLI covered only 62–77 % of household risk, and in India the average claim was about 12 % of a 100 % sub-district loss. The literature, though, treats basis risk as a problem of design and data (wrong index, wrong data source, idiosyncratic loss). It assumes the index is computed correctly. Almost no source addresses the separate risk that the index computation itself is wrong or tampered with. PUNA can claim that gap.

### Cited Findings
- Definition used in the literature: basis risk is "the risk that a farmer suffers a loss but the insurance index does not trigger a payout." Clarke's model shows basis risk can make index insurance welfare-reducing for smallholders — [IFPRI blog summarizing Clarke](https://www.ifpri.org/blog/index-insurance-instrument-managing-risk-and-modernizing-agricultural-production/)
- India, 270 weather-index products, 1999–2007 (Clarke et al. 2012): with a 100 % loss at sub-district level, the average claim payment was only 12 % — [MPRA paper](https://mpra.ub.uni-muenchen.de/75026/9/MPRA_paper_75026.pdf) / [core.ac.uk](https://core.ac.uk/download/150158966.pdf) (figure as reported in the search snippet; verify the page before quoting it)
- Zambia: basis risk measured as the probability of a false negative (no payout despite a loss), using plot-level rainfall. The study tests whether it lowers purchases — [MPRA 59153](https://mpra.ub.uni-muenchen.de/59153/1/MPRA_paper_59153.pdf)
- Kenya IBLI (satellite NDVI index for pastoralist livestock loss): covers 62–77 % of the herd-mortality risk households face in Marsabit. Index error explains part of the remainder; a larger share comes from differences in loss rates between households — [ILRI/BASIS, Mude 2017](https://basis.ucdavis.edu/sites/g/files/dgvnsk466/files/2017-08/Mude_EtoA-ICED-workshop_The-Case-of-IBLI-May-2017.pdf); [Jensen, Barrett & Mude](https://barrett.dyson.cornell.edu/files/papers/150824_JensenBarrettMude_FavorableImpactsKenya.pdf)
- IBLI's method for turning raw NDVI into the index "has changed through the years" to reduce basis risk. The choice of NDVI product changes the result: eMODIS (free, about a 5-week lag) versus BOKU (near-real-time filtering) — [BASIS/Cornell technical report](https://basis.ucdavis.edu/sites/g/files/dgvnsk466/files/2017-05/Cornell_AMA_Technical_Report.pdf)
- IBLI's welfare gains still exceeded those of unconditional cash transfers, despite imperfect coverage — [ILRI/BASIS slides](https://basis.ucdavis.edu/sites/g/files/dgvnsk466/files/2017-08/Mude_EtoA-ICED-workshop_The-Case-of-IBLI-May-2017.pdf)
- CCRIF Hurricane Sandy (2012): Jamaica and the Bahamas got no payout because the modelled government losses fell below the trigger. The Jamaica event was about a 1-in-6-year return period. Haiti, which had the highest death toll, did not even qualify for assessment: it lay outside the modelled wind field, and most of its damage came from rain and floods, a peril it had no cover for at the time — [Artemis](https://www.artemis.bm/news/2012/10/31/caribbean-catastrophe-risk-insurance-facility-no-payouts-from-sandy/); [Post Online](https://www.postonline.co.uk/claims/2221366/caribbean-cat-risk-report-issued-on-sandy)
- CCRIF Haiti 2010 earthquake: a quick payout of about US$7.7–8 M, roughly 20× the $385,500 earthquake premium. It was small next to the losses, because Haiti had allocated only 20 % of its cover to earthquake — [The New Humanitarian](https://www.thenewhumanitarian.org/Report/91385/CLIMATE-CHANGE-Disaster-insurance-the-Caribbean-way); [CCRIF model evolution](https://www.ccrif.org/sites/default/files/DRF-Course-2023/CCRIFModel-Evolution-February2023.pdf)
- Mitigation practices include:
  - Using the same data source for pricing and monitoring.
  - Backtesting against about 20 years of historical imagery.
  - A dedicated validation step before launch. Floodbase: "satellite data alone is unreliable," so validation comes first — [Insurance Business](https://www.insurancebusinessmag.com/au/news/catastrophe/how-do-you-structure-a-parametric-using-a-satellite-439347.aspx); [Floodbase blog](https://floodbase.com/blog-posts/unlocking-large-scale-parametric-flood-insurance-with-reliable-continuous-data)
  - Others: conditional audits (an audit triggered when the satellite index and farmer reports disagree) — [BASIS satellite-based conditional audit](https://basis.ucdavis.edu/sites/g/files/dgvnsk466/files/2017-05/Satellite_based_conditional_audit_index_insurance_170217.pdf); replanting guarantees in Kenya, with about 200,000 adoptions — [CCAFS](https://ccafs.cgiar.org/node/51458)

### Inferences
- Basis risk splits into three parts: (a) design risk (wrong index), (b) data risk (wrong or late inputs), and (c) computation risk (the right index computed wrongly, through a bug, a bit flip, or tampering). The literature covers (a) and (b) in depth and assumes (c) away, because a trusted calculation agent computes on the ground. When the index is computed in orbit by a third-party operator, (c) stops being negligible. That is PUNA's niche.
- The CCRIF Sandy case also shows that trust erodes when a payout fails and nobody can independently reproduce why. A public, auditable certificate addresses that explainability problem, even though it does not fix the design.
- PUNA should not claim to solve basis risk. It removes one component, computation risk, and makes the rest auditable.

### Gaps
- Found no documented case of a satellite index payout that was wrong because of a computation error rather than design or data. Searches surfaced none. Say "no public case found," not "never happens."
- Did not find a formal CCRIF dispute (litigation or arbitration). The cases are politically contested shortfalls, not legal disputes.
- The exact Clarke false-negative probabilities were not retrieved.

## 2. Oracle trust: Chainlink weather/satellite oracles, manipulation risk, known failures

### Takeaway
On-chain parametric products depend on an oracle that delivers the index. The oracle problem is real in DeFi price feeds, such as Mango Markets (~$114 M, Oct 2022). However, no documented weather or satellite oracle manipulation affecting a policy was found. Chainlink's answer is to aggregate several data providers and nodes. That checks the data, not whether the ML model's computation on that data was correct.

### Cited Findings
- Chainlink positions decentralized oracle networks for parametric insurance, aggregating multiple premium weather data providers and nodes to avoid a single point of failure. This is a vendor claim — [Chainlink: What is parametric insurance](https://chain.link/article/what-is-parametric-insurance)
- Mango Markets, 11 Oct 2022: about $114 M drained after the attacker pumped the price of their own MNGO collateral (reported range $100–117 M). They later returned $67 M and kept about $47 M — [The Block](https://www.theblock.co/news/regulation/2022-10-11-hacker-steals-over-100-million-from-mango-markets-176445); [Cointelegraph](https://cointelegraph.com/magazine/how-low-liquidity-led-to-mango-markets-losing-over-116-million); [Fortune](https://fortune.com/crypto/2022/10/17/a-solona-hacker-calls-67m-he-stole-from-the-mango-platform-a-profitable-trading-strategy)
  - Caveat: Mango said the oracle reported market prices correctly; the market itself was manipulated, which is why some call it a pump-and-dump rather than an oracle attack.
- Chainalysis context: October 2022 was the year's worst month for hacks, with $718 M lost across 11 DeFi protocols by mid-month — [Blockworks](https://blockworks.co/news/october-already-record-month-for-hacks-and-exploits)
- Commentary argues that parametric products tied to one data feed (e.g., NOAA) have a single point of failure. This source is a vendor-style blog of low reliability — [Chainscore Labs](https://www.chainscorelabs.com/blog/real-estate-tokenization-hype-vs-reality/insurance-and-risk-mitigation/the-hidden-cost-of-oracles-in-parametric-property-coverage)
- Etherisc payout figures conflict across sources ($40 K in flight-delay payouts in 2022 versus over $50 M in crop payouts). No primary source was found — same Chainscore results; treat both figures as unverified.

### Inferences
- PUNA's angle on the oracle problem: classic oracles answer "is this data true?" PUNA answers "was the function applied to this data computed correctly?" When an ML model runs on the satellite, only the answer comes down to the ground, so the second question can't be delegated to a data-aggregation oracle.
- The Mango case shows the general principle: when the trigger value can be influenced by an interested party, someone will exploit it. In orbital compute, the interested party could be the compute operator itself.

### Gaps
- No primary source found for a weather or satellite oracle failure in Arbol, Etherisc or another live parametric product.
- No Chainlink product specific to satellite imagery or ML inference was verified in this pass.

## 3. Satellite-derived indices in insurance: who computes them, how they are validated, AI/ML, explainability

### Takeaway
Satellite-index providers such as Floodbase, Descartes, Pula and OKO compute their indices in-house, often with ML. They validate through backtesting and historical reprocessing, sometimes relying on independent third-party data such as ICEYE. No provider publishes a cryptographic or independent re-computation audit of each event's index. Trust rests on the provider's reputation and the contract terms.

### Cited Findings
- Floodbase builds its US product with an ML model "interpolating between direct observations." It reprocesses up to about 20 years of historical imagery to set thresholds, price and backtest the index — [Insurance Business](https://www.insurancebusinessmag.com/au/news/catastrophe/how-do-you-structure-a-parametric-using-a-satellite-439347.aspx); [Floodbase](https://floodbase.com/blog-posts/unlocking-large-scale-parametric-flood-insurance-with-reliable-continuous-data)
- Descartes Underwriting uses "machine learning and real-time monitoring from satellite imagery & IoT" for North American flood. Its flood-at-location product uses depth sensors installed at the client's site — [Descartes flood NA](https://descartesunderwriting.com/solutions/flood-na)
  - Its partnership with ICEYE was framed this way by Descartes' head of underwriting: accurate data from an independent third party is a prerequisite for all parametric contracts — [Artemis](https://www.artemis.bm/news/descartes-partners-with-iceye-for-parametric-flood-risk-transfer/)
- Descartes on AI for natural perils — [Descartes newsroom](https://descartesunderwriting.com/newsroom/how-ai-enables-natural-perils-resilience)
- Pula: Area Yield Index Insurance compares end-of-season yields with a historical average per agro-ecological zone. Zones are defined from satellite, rainfall and yield data — [Pula products](https://www.pula-advisors.com/productsandservices)
  - Self-reported scale: 24 M farmers reached, more than $2.8 B in farm investments protected, about $136.5 M in automated payouts (timeframe unclear) — [African Mirror](https://theafricanmirror.africa/business/new-technologies-are-unlocking-farm-insurance-in-africa/)
  - 2026 Earthshot Prize finalist — [LaunchBase Africa](https://launchbaseafrica.com/2026/09/18/prince-williams-climate-hunt-african-insurtech-pula-named-a-1m-earthshot-finalist/)
- OKO: mobile weather-index insurance for smallholders (Mali, Uganda), using satellite weather data with automatic triggers — [Catalyst Fund](https://www.thecatalystfund.com/insights/why-we-invested-in-oko-finance-an-agri-insurtech-building-climate-resilience-for-africas-smallholder-farmers)
- Industry commentary: "a visually convincing map does not automatically provide a legally or actuarially suitable insurance measurement." It calls for independent validation of satellite information. This is a secondary source — [NewSpace Economy](https://newspaceeconomy.ca/?p=207544)

### Inferences
- In every case, the index provider is also the party that computes it, and the policyholder can't recompute it. Today that is tolerable because the provider is a regulated company computing on the ground. With orbital edge compute sold by a third-party operator, a new party enters the trust chain, and per-event verification becomes the natural extension of "independent third-party data."
- PUNA's fixed-weight, untrained CNN is consistent with how the industry works: what matters for a contract is that the formula is fixed and published in advance, not that it is the most accurate one. Say this plainly to judges.

### Gaps
- Ignitia: no current information found; status not verified.
- Did not find any regulator (NAIC, EIOPA, IAIS) with explicit explainability requirements for ML-derived parametric triggers.
- No public methodology documents with per-event audit procedures from Floodbase or Descartes.

## 4. Verifiable ML compute: zkML, opML, TEEs, Freivalds; cost, latency and maturity in 2026

### Takeaway
There are four families:
- **zkML:** the strongest trust model (succinct proofs), but proving is slow and expensive; minutes to hours for non-trivial models.
- **opML:** cheap, but with a challenge window of about 7 days.
- **TEEs:** fast, but they trust hardware vendors, and TEE.fail (Oct 2025) broke TDX, SEV-SNP and, through them, NVIDIA GPU attestation with a physical interposer under $1 k.
- **Freivalds-based checking:** costs O(n²) per matrix product instead of O(n³), needs no trusted hardware and no proving delay. It does assume the verifier has the inputs and intermediate activations, which is where Merkle commitments come in.

PUNA's design, integer CNN + Freivalds mod p + per-layer Merkle commitments, belongs to a recognized research line (Slalom, VeriML, Range-Arithmetic, Maverick 2026).

### Cited Findings
- **Freivalds in ML verification:**
  - Slalom (Tramèr & Boneh, ICLR 2019): a TEE outsources a DNN's matrix multiplications to an untrusted GPU and checks them with Freivalds. Reported speedups are 6–20× for verifiable inference and 4–11× for verifiable and private inference (VGG16, MobileNet, ResNet). Because weights are fixed at inference time, part of the check can be precomputed — [arXiv 1806.03287](https://arxiv.org/pdf/1806.03287)
  - VeriML uses Freivalds inside circuits to shrink them, and analyzes the false-positive rate across a network's matrix multiplications — [arXiv 1909.06961](https://arxiv.org/pdf/1909.06961)
  - Range-Arithmetic checks matrix multiplications with Freivalds and ReLU with range proofs and sum-check — [arXiv 2505.17623](https://arxiv.org/pdf/2505.17623)
  - Maverick (2026) delegates matrix-vector products for verifiable and private LLM inference, using sparse random challenges; it claims information-theoretic soundness — [arXiv 2609.10264](https://arxiv.org/pdf/2609.10264) / [ePrint 2026/1955](https://eprint.iacr.org/2026/1955.pdf)
  - Lightweight cryptographic proofs of inference (2026) — [arXiv 2603.19025](https://arxiv.org/pdf/2603.19025) (not confirmed whether it uses Freivalds)
- **zkML:**
  - Bionetta (arXiv 2510.06784, rev. Dec 2025) benchmarks EZKL, ZKML, deep-prove and zkCNN. It notes that in its design proving cost depends on the non-linearities, while linear operations are "free." It marks EZKL as lacking mobile proving and effective EVM verification. Part of its server numbers are estimates — [arXiv 2510.06784](https://arxiv.org/pdf/2510.06784)
  - Secondary claim: EZKL's Halo2 proving can be up to 373× slower than Groth16 systems, with "minutes to hours" for complex models. This is an aggregator source; verify before citing — [EmergentMind](https://api.emergentmind.com/topics/ezkl)
  - Layer-level EZKL CNN profiling (ICAIIC 2026): proving time scales roughly as O(|C| log |C|) in the number of constraints — [ICAIIC 2026 slides](https://di0zxmb8pwajl.cloudfront.net/kics/conference/icaiic2026/presentation/1571230597.pdf)
  - Verifiable evaluations of ML models with zkSNARKs — [arXiv 2402.02675](https://arxiv.org/pdf/2402.02675.pdf)
- **opML** (ORA):
  - Interactive fraud proofs bisect a dispute down to a single instruction, resolved on a MIPS fraud-proof VM. The original paper argues opML finalizes faster than zkML when a large model's proving time exceeds the challenge period — [arXiv 2401.17555](https://arxiv.org/pdf/2401.17555); [opML wiki](https://github.com/hyperoracle/opml/wiki)
  - Finality only after the dispute window, typically about 7 days. That breaks composability with protocols that need immediate settlement, and the full inference trace must be reproducible, which raises privacy concerns — [Optimistic TEE-Rollups, arXiv 2512.20176](https://arxiv.org/pdf/2512.20176)
  - ORA's onchain AI oracle — [ethresear.ch OAO](https://ethresear.ch/t/oao-onchain-ai-oracle/18675)
- **TEEs:**
  - TEE.fail (Oct 2025; Georgia Tech, Purdue, Synkhronix): a DDR5 memory-bus interposer costing under $1,000 extracted keys from Intel TDX and from AMD SEV-SNP, even with Ciphertext Hiding enabled.
  - It also forged TDX attestations (demonstrated against BuilderNet), and the extracted keys can undermine NVIDIA GPU Confidential Computing.
  - Intel and AMD consider physical attacks out of scope; AMD plans no mitigation — [BleepingComputer](https://www.bleepingcomputer.com/news/security/teefail-attack-breaks-confidential-computing-on-intel-amd-nvidia-cpus/amp/); [SecurityWeek](https://securityweek.com/new-attack-targets-ddr5-memory-to-steal-keys-from-intel-and-amd-tees); [The Hacker News](https://thehackernews.com/2025/10/new-teefail-side-channel-attack.html)

### Inferences
- Comparison for PUNA's use case: a small CNN, a 12×12 grid, and a payout that must settle in minutes.

  | | Trust assumption | Settlement latency | Weakness in orbit |
  |---|---|---|---|
  | zkML | Cryptography only | Proving takes minutes to hours | Satellite power and compute budget is spent on proving |
  | opML | At least one honest challenger | ~7 days | Defeats a fast payout |
  | TEE | The chip vendor | Low | The operator physically owns the hardware, and physical attacks are out of the vendor's scope (TEE.fail); a radiation bit flip inside an enclave is still attested as valid |
  | Freivalds + Merkle (PUNA) | Validator gets the committed data (Merkle per layer) and is independent | Ground validator does cheap O(n²) checks; soundness error ≤ 1/p per random check, p = 2³¹−1, about 4.7·10⁻¹⁰ | Not succinct, not zero-knowledge |

- The integer, mod-p design avoids the floating-point non-determinism that makes re-execution and Freivalds hard with float models. Slalom and its successors likewise use quantized or integer arithmetic.
- Important point for the pitch: TEEs and attestation prove which code ran, not that the hardware computed it correctly. An SEU silently corrupts an attested computation. Freivalds catches the wrong numerical result, whatever caused it.
- Honest limitations to state: Freivalds checks the linear layers. The non-linear parts (ReLU, requantization) are re-executed or checked by the validator, which needs the activations committed via Merkle. That is not zero-knowledge, the model and data are visible to the validator, and the scheme does not stop the validator itself from colluding.

### Gaps
- No apples-to-apples latency or cost benchmark comparing zkML, opML, TEE and Freivalds on the same small CNN.
- Modulus Labs and Giza: 2026 status not checked in this pass.
- The primary text for the "373×" figure was not verified.

## 5. Orbital and space data centers: Starcloud, Axiom, Kepler, Suncatcher, Lonestar, SpaceX; SEUs and the SAA; result verification

### Takeaway
Orbital compute went from concept to hardware between late 2025 and 2026:
- Starcloud-1 flew an H100 in November 2025.
- Axiom and Kepler nodes were reported in orbit in January 2026.
- Google's Suncatcher plans two prototypes with Planet by early 2027.
- SpaceX filed for up to 1 M compute satellites in January 2026.

Radiation is the acknowledged risk. Google measured HBM sensitivity, and a silent data corruption event was reportedly observed during beam testing. ESA's Swarm data shows memory upsets concentrated in the South Atlantic Anomaly. No operator was found publishing a mechanism by which customers can verify individual results.

### Cited Findings
- **Google Project Suncatcher [PRIMARY]:**
  - Trillium (v6e) TPUs were tested in a 67 MeV proton beam for total ionizing dose and single-event effects. HBM was the most sensitive component, showing irregularities only after 2 krad(Si), against an expected shielded 5-year mission dose of 750 rad(Si). There were no TID hard failures up to 15 krad(Si).
  - Illustrative design: an 81-satellite cluster at about 650 km in a dawn–dusk sun-synchronous orbit.
  - A learning mission with Planet will launch two prototype satellites by early 2027.
  - [Google Research blog](https://research.google/blog/exploring-a-space-based-scalable-ai-infrastructure-system-design/)
- Secondary reporting on Suncatcher says most radiation bit flips were recoverable by restart, and Google disclosed a silent data corruption event during beam testing. Not confirmed in the primary blog; check the preprint — [Futurum](https://futurumgroup.com/?p=95983); [Verdict](https://www.verdict.co.uk/newsletters/google-project-suncatcher-ai-chips); [W.Media](https://w.media/google-prepares-ai-chip-test-in-low-earth-orbit/)
- **Starcloud** (formerly Lumen Orbit):
  - Starcloud-1 launched on 2 Nov 2025 with one NVIDIA H100. It reportedly ran Gemma inference and trained a small model on Shakespeare. The next satellite was reported for October 2026 with several H100s and Blackwell hardware.
  - No flight radiation, SEU or result-verification data published — [ScienceBlog](https://scienceblog.com/t-starcloud-first-llm-trained-orbit-nvidia-h100-500-km/); [AINews](https://www.ainews.com/p/nvidia-backed-startup-trains-ai-model-in-space-advancing-orbital-data-centers); [Newsweek](https://www.newsweek.com/data-centers-space-startup-raises-250-million-12368510) (company claims, secondary coverage)
- **NVIDIA:** a mid-2026 analysis says NVIDIA has not disclosed radiation tolerance or SEU mitigation for its Space-1 Vera Rubin module — [SoftwareSeni](https://www.softwareseni.com/nvidia-vera-rubin-space-1-the-hardware-behind-orbital-ai-compute/) (secondary)
- **Axiom Space and Kepler:**
  - Axiom announced orbital data center work with Kepler and Skyloom optical inter-satellite links. Its larger ODC T1 deployment is expected by 2027. The AxDCU-1 prototype on the ISS ran Red Hat Device Edge test apps in fall 2025 — [DCD](https://datacenterdynamics.com/en/news/axiom-space-to-develop-orbital-data-center-on-its-commercial-space-station)
  - First two ODC nodes reportedly launched on 11 Jan 2026 aboard Kepler's optical relay satellites (10 satellites, Falcon 9) — [Introl](https://introl.com/blog/orbital-data-centers-space-computing-race-2026) (blog; not confirmed against Axiom or Kepler press releases)
- **Lonestar:** reportedly targets first commercial LEO service by Q4 2026, plus lunar data storage — [Introl](https://introl.com/blog/orbital-data-centers-space-computing-race-2026) (secondary)
- **SpaceX:**
  - FCC application dated 30 Jan 2026 for up to 1,000,000 solar-powered orbital data-center satellites at 500–2,000 km, aimed at AI inference. The vision cited: 1 M tonnes at 100 kW per tonne, about 100 GW.
  - It requests waivers of deployment milestones and includes no schedule. The xAI acquisition was announced 2 Feb 2026. FCC status pending as of those reports — [Tom's Hardware](https://www.tomshardware.com/tech-industry/spacex-formalizes-plan-to-build-1-million-satellite-orbital-data-center-system-fcc-filing-sketches-out-plans-but-over-packed-orbits-could-be-limiting-factor); [Engadget](https://www.engadget.com/science/space/spacex-wants-to-launch-a-constellation-of-a-million-satellites-to-power-ai-needs-175607771.html); [Introl](https://introl.com/blog/spacex-1-million-orbital-data-centers-fcc-filing-2026)
- **SEUs and the South Atlantic Anomaly:**
  - ESA Swarm, 3 satellites over about 10 years (3,327 days): memory upsets were geographically concentrated, and most were likely triggered by protons in the SAA — [ESA](https://www.esa.int/Enabling_Support/Space_Engineering_Technology/Swarm_vs._space_radiation_the_first_10_years)
  - UoSAT-2 flight data: upsets strongly concentrated in the SAA — [OSTI](https://www.osti.gov/biblio/5722116)
  - CRUX/APEX: trapped protons, including the SAA, dominated upset rates in quiet conditions — [govdocs PDF](https://corpora.tika.apache.org/base/docs/govdocs1/316/316023.pdf)
  - Sentinel-2 SRAM: 4,157 correctable upsets in 789 days on S2A and 2,776 in 524 days on S2B; the SAA was the most relevant radiation feature — [TU Delft repository](https://repository.tudelft.nl/file/File_1a8cd524-88c7-408a-9f86-c2639456e275?preview=1)
  - Geomagnetic storms raise SEU rates by about 19 % versus quiet conditions — [Kyushu Univ.](https://catalog.lib.kyushu-u.ac.jp/opac_download_md/7330310/7330310.pdf)

### Inferences
- The SAA lies over South America, including northern Argentina, so a LEO compute node passing over the NOA crosses the region of highest upset risk. That makes the demo story (ORBIT-07 in the anomaly) physically grounded, not decorative.
- Commercial orbital compute ships today with radiation tolerance testing (Google) or no published radiation data at all (Starcloud, NVIDIA Space-1). Nobody has published a protocol for third-party per-result verification. Error correction (ECC, restarts) and checks like Freivalds are complementary: ECC protects memory, but silent data corruption in logic or compute units still escapes. Google's reported silent-corruption event is the strongest evidence of this, pending primary confirmation.
- Selling orbital compute to third parties (insurers) breaks the self-certification model, since the operator is both the computing party and an interested one.

### Gaps
- No primary statement from Starcloud, Axiom, Lonestar or SpaceX about customer-verifiable results.
- The exact share of Swarm upsets attributable to the SAA was not extracted.
- Starcloud's second launch (Oct 2026) was not confirmed as having happened.
- Some team-internal figures (Orbview-2 >80 % in the Anomaly; Google ~1 per ~3 M inferences at 1 inference/s) were not re-found in this pass. Rely on the team's own 11/11 verification record for those.

## 6. ERC-8004 (Trustless Agents): status, adoption and Validation Registry use in 2026

### Takeaway
ERC-8004 is still a Draft EIP (created 13 Aug 2025). Identity and Reputation registries went live on Ethereum mainnet around 29 Jan 2026 and are reported on Avalanche C-Chain and Fuji. The Validation Registry is the least mature part. Several sources say it is not deployed on mainnet or still under development. Adoption counts range from about 21 k to over 170 k registered agents depending on source and date, and an academic study calls adoption "registration-heavy but operationally shallow." A real Validation Registry use case, such as PUNA reporting a Freivalds audit score of 0–100, is therefore rare and differentiating.

### Cited Findings
- **EIP-8004 spec [PRIMARY]:**
  - `validationRequest(validatorAddress, agentId, requestURI, requestHash)` may be called only by the agent's owner or operator.
  - `validationResponse(requestHash, response 0–100, responseURI, responseHash, tag)` may be called only by the named validator. Multiple responses are allowed, for example "soft" and "hard" finality via the tag.
  - Trust models named: reputation, stake-secured re-execution, zkML, TEE oracles. Payments are "orthogonal"; incentives and slashing are left to the validation protocol.
  - Status: Draft. Authors: De Rossi (MetaMask), Crapis (Ethereum Foundation), Ellis, Reppel.
  - [eips.ethereum.org/EIPS/eip-8004](https://eips.ethereum.org/EIPS/eip-8004)
- Mainnet launch, late January 2026 — [The Block](https://www.theblock.co/news/ecosystems/2026-01-28-ethereum-ai-agentic-economy-mainnet-387345)
- Validation Registry "not yet deployed (spec under active development)" on Ethereum mainnet or Taiko — [Taiko guide](https://taiko.xyz/guides/erc-8004-trustless-agent-standard); "under development" — [growthepie](https://www.growthepie.com/quick-bites/eip-8004). Possibly outdated: an Oct 2026 article lists reference deployments on several testnets and mainnets without saying whether Validation is included — [eco.com](https://eco.com/support/en/articles/13221214-what-is-erc-8004-the-ethereum-standard-enabling-trustle)
- Avalanche: deployments reported on C-Chain mainnet and Fuji, with vanity addresses `0x8004A169…` (Identity) and `0x8004BAa1…` (Reputation) — [skills.sh den-labs](https://skills.sh/den-labs/agent-skills/erc8004-avalanche) (third-party); QuickNode lists Avalanche among live chains — [QuickNode ERC-8004](https://erc-8004.quicknode.com/learn/registries/identity). Verify on Snowtrace.
- Adoption counts, which conflict:
  - 21,562 agents (via 8004scan.io) — [Bitcoin.com](https://news.bitcoin.com/what-is-erc-8004-ethereums-new-agent-standard-powers-thousands-of-onchain-ai-identities)
  - 89,451 by mid-March 2026 — [Nevermined](https://nevermined.ai/blog/erc-8004-agent-identity-statistics)
  - More than 170 k across Ethereum, BSC and Base — empirical study, [arXiv/alphaXiv 2606.26028](https://www.alphaxiv.org/abs/2606.26028), which also notes that adoption is registration-heavy and operationally shallow

### Inferences
- Because the Validation Registry is the least deployed part, PUNA should say it uses the Validation Registry interface as deployed and verified on Fuji. This matches the CLAUDE.md rule to verify against the deployed contract.
- The spec explicitly names re-execution, zkML and TEE as validation backends but not Freivalds. PUNA can position itself as a fourth, cheap, hardware-independent backend that fits the same 0–100 response field.
- The spec leaves incentives and slashing to the validation protocol. PunaEscrow (pay only if score ≥ threshold, otherwise reject and reassign) is exactly that missing economic layer, applied to one vertical.

### Gaps
- No count of Validation Registry requests or responses on any chain was found.
- No public production use of the Validation Registry for ML or satellite data was found.
- Official Avalanche addresses were not verified on Snowtrace in this pass.
