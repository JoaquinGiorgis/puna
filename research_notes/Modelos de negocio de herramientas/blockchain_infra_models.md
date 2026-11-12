# Business models of blockchain oracle, verification and settlement infrastructure sold as a tool (2024–2026)

Scope: how blockchain infra vendors charge (per request, per proof, per transaction, subscriptions, enterprise licences), so PUNA can choose a tool-style price rather than a revenue share with insurers. Research date: 2026-11-12. Labels used below: **[REAL]** = paid by an external customer in money or in fees for usage; **[TOKEN]** = paid with token emissions or treasury incentives; **[SELF]** = figure reported by the company itself and not independently checked.

## 1. Chainlink: how it charges, how operators get paid, and what revenue is public

### Takeaway
Chainlink runs three billing models at once. (a) Onchain metered fees: prepaid subscriptions for Functions, VRF and Automation, plus a per-message fee for CCIP. (b) Offchain enterprise contracts, which Chainlink says reached "hundreds of millions of dollars" but which are not itemised. (c) Revenue share or value capture: 1.2 % of GMX fees and 35 % of liquidation MEV recaptured through SVR. Since August 2025, all three are converted to LINK and put into the Chainlink Reserve. The per-request fee is small (Functions: 3 US cents of premium plus gas), so the money comes from volume and enterprise deals, not from the unit fee.

### Cited findings
- **Functions:** the premium is a fixed USD amount, deducted in LINK from a prepaid subscription when the response arrives. Total cost per request = callback gas + premium. Mainnet premiums such as Arbitrum's are listed at **3 US cents**. Cancelling a subscription that has fewer fulfilled requests than the threshold costs **0.1 LINK** [REAL] — [Chainlink Functions Billing](https://docs.chain.link/chainlink-functions/resources/billing); [Supported Networks](https://docs.chain.link/chainlink-functions/supported-networks)
- Functions moved to USD-denominated fixed premiums on all networks in July 2024 — [Chainlink changelog](https://dev.chain.link/changelog/usd-denominated-premium-fees-on-all-supported-networks)
- **VRF and Automation** are also billed from onchain subscriptions or balances in LINK or the native token. Billing pages: [VRF v2.5 Billing](https://docs.chain.link/vrf/v2-5/billing) and [Automation Billing and Costs](https://docs.chain.link/chainlink-automation/overview/automation-economics). I could not extract the exact premium percentages (the Automation page returned 404 when fetched).
- **CCIP:** fee = blockchain fee (gas) + network fee. Data-only messages pay a fixed network fee in USD. Token transfers pay a percentage in basis points (multiples of 0.1 bps), with a per-transfer minimum and maximum in multiples of 0.01 USD. Fees can be paid in LINK or other tokens — [CCIP Billing](https://docs.chain.link/ccip/billing); [FeeQuoter v1.6.0](https://docs.chain.link/ccip/api-reference/evm/v1.6.0/fee-quoter). Mirror copies of the docs show 0.50 USD per message to Ethereum and 0.10 USD to other chains, **not confirmed against the canonical page** — [mirror](https://documentation-8rpbcg1gs-chainlinklabs.vercel.app/ccip/architecture)
- **The Chainlink Reserve (launched 7 Aug 2025)** converts offchain enterprise payments and onchain service fees into LINK through "Payment Abstraction", which uses CCIP, Automation, Price Feeds and Uniswap V3. No withdrawals are planned "for multiple years". It held more than $1M in LINK at launch [REAL→LINK] — [Chainlink blog](https://chain.link/blog/chainlink-reserve-strategic-link-reserve); [The Block](https://www.theblock.co/news/ecosystems/2025-08-07-chainlink-strategic-link-reserve-365988)
- Chainlink names its revenue streams as follows: enterprise integrations, usage and maintenance paid offchain; onchain subscriptions (VRF, Automation, Functions) and per-call CCIP fees; revenue share (**GMX pays 1.2 % of total fees** for Data Streams; Chainlink takes **35 % of recaptured liquidation MEV** on Aave SVR markets); and a "Build" programme in which early projects pay with a share of their **own token supply**. "Demand for Chainlink has already created hundreds of millions of dollars in revenue", including the **Chainlink Scale** programme, but no breakdown is given [SELF] — [Chainlink blog](https://chain.link/blog/chainlink-reserve-strategic-link-reserve)
- Reserve holdings: about 193,100 LINK (~$4.4M) in early September 2025 — [Token Relations](https://tokenrelations.substack.com/chainlink-reserves-grows-with-4m); 523,159 LINK at the end of Q3 2025 per a secondary summary — [MEXC](https://www.mexc.com/news/134106)
- **Chainlink Scale:** under this programme, chains such as Avalanche cover the operating costs of nodes and feeds so that dapps get Data Feeds sponsored. Only a passing mention was found: Chainlink counts Scale as "existing and historical revenue" with no figures — [Chainlink blog](https://chain.link/blog/chainlink-reserve-strategic-link-reserve)
- **Enterprise (SWIFT, DTCC, Euroclear, ANZ):** public sources describe pilots and collaborations, for example 24 institutions on corporate actions where CRE validated AI outputs and turned them into ISO 20022 messages over SWIFT, or ANZ settling tokenised assets with CCIP. **No public contract amounts** — [Blockworks](https://blockworks.co/news/chainlink-industry-initiative); [ANZ case study](https://pages.chain.link/hubfs/e/anz-ccip-cross-chain-tokenized-asset-settlement-case-study.pdf); [DTCC, May 2026](https://www.dtcc.com/en/news/2026/may/12/dtcc-collaborates-with-chainlink-to-advance-24-7-collateral-management)
- **Proof of Reserve:** there is no public price list. On AWS Marketplace it is sold as a "private offer" priced "based on your specific requirements" (enterprise licence) — [AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-puk4hjjubskkg)
- **Staking and operators:** DefiLlama puts Chainlink Staking at ~$4.24M of revenue in August 2025 and ~$4.05M in September 2025, an annualised ~$59M of fees — [DefiLlama Chainlink Staking](https://defillama.com/protocol/chainlink-staking). Other analysts say staker rewards still come **mostly from token emissions** [TOKEN] — cited in the search aggregate, not confirmed; see [DefiLlama Chainlink](https://defillama.com/protocol/chainlink). Node operators stake between 1,000 and 75,000 LINK, and slashing of 700 LINK per valid alert applies on the ETH/USD feed — [Everstake](https://everstake.one/resources/blog/chainlink-staking-multi-chain-guide)
- SVR reportedly generated ~$18.7M of revenue (secondary source) — [KuCoin news](https://www.kucoin.com/news/flash/chainlink-s-svr-generates-18-7m-in-revenue-captures-99-mev-market-share)
- Token Terminal counts as "revenue" only what the protocol keeps. Payments to the supply side (operators) are excluded — [Token Terminal](https://tokenterminal.com/resources/weekly-fundamentals/rainmakers-of-the-crypto-market)

### Inferences
- Chainlink's per-request model fits PUNA as a template: a **fixed premium in USD, charged in the network's token, deducted from a prepaid subscription** at the moment of fulfilment, and a cancellation fee that discourages abuse. PUNA could charge "USD X per audit" from a prepaid escrow balance on Avalanche.
- Chainlink's real money comes from **offchain enterprise licences**, not from the 3 cents per request. For PUNA this means the per-audit fee is the "self-serve" layer, and the annual contract with an insurer or orbital operator is the real business.
- Chainlink Scale (the chain subsidises the oracle) is a precedent for Avalanche or an L1 paying for PUNA's verification for its dapps.

### Gaps
- No audited annual Chainlink Labs revenue for 2024 or 2025 was found.
- Exact current premiums for VRF and Automation were not extracted.
- No contract values with SWIFT, DTCC or ANZ were found. It is not known whether they pay or are design partners.

## 2. Verifiable compute and proof networks (RISC Zero Boundless, Succinct, Brevis, Lagrange, EigenLayer, EZKL, Giza, Gensyn)

### Takeaway
The dominant model in 2025–2026 is an **open proving market**: the customer (rollup or app) pays per proof, the price is set by auction (reverse auction or double auction), and the protocol keeps a small, governable take-rate. Prices have fallen sharply (Boundless: < $0.04 per billion cycles). A large share of the provers' income is still **token emissions** (ZKC's PoVW, PROVE, EigenLayer AVS rewards). Few AVSs generate real fees.

### Cited findings
- **Boundless (RISC Zero):** the median clearing price is "under $0.04 per billion cycles". The rollup pays per proof, only for proofs delivered, and provers compete. Spare capacity is paid through "Proof of Verifiable Work" (PoVW) [TOKEN, amount not stated]. Self-reported capacity is 400 trillion cycles per day (post dated 6 Jan 2026) [SELF] — [Boundless Foundation blog](https://boundlessfdn.org/blog/real-economics-of-proving)
- A Boundless Notion update describes a ~73 % price fall since the mainnet launch [SELF] — [Boundless Notion](https://boundless-network.notion.site/2e6baf72735180cdace7e7f954930517). Mainnet launched in September 2025 — [BlockEden](https://blockeden.xyz/blog/2026/01/14/boundless-risc-zero-decentralized-proof-market-zk/)
- The earlier, centralised RISC Zero Bonsai was quoted at ~$0.01 per 100K cycles (about $100 per billion cycles, three orders of magnitude more). It is a secondary source, so treat it with caution — [ChainScore](https://www.chainscorelabs.com/blog/zk-rollups-the-endgame-for-scaling/prover-economics-and-hardware/pay-per-proof-vs-subscription-the-prover-revenue-war)
- **Succinct Prover Network:** cost = a fixed **base fee** per proof type (the example uses 0.2 PROVE for compressed proofs) + PGUs (prover gas units) × a per-PGU price set by **auction**. Payment in PROVE is split between the prover, the stakers delegated to it and the protocol treasury. The example uses a 1 % protocol fee and a 10 % staker fee, and PROVE holders vote on the protocol fee — [Succinct auction docs](https://docs.succinct.xyz/docs/protocol/spn/auction); [Succinct FAQ](https://docs.succinct.xyz/docs/sp1/prover-network/faq). Mainnet and PROVE activation were reported by [The Block](https://www.theblock.co/amp/post/365606/succinct-mainnet-prove-token). An average of ~1.25 PROVE per proof (August 2025) is unverified — [blockchain.news](https://blockchain.news/flashnews/succinct-labs-zk-verification-data-update-12-integrations-42-2k-proofs-in-2-weeks)
- **Brevis:** ProverNet is a market in which apps buy proving capacity, with prices cleared by a "Truthful Online Double Auction". Brevis claims >250M proofs and >30 partners [SELF] — [Binance Research](https://www.binance.com/research/analysis/brevis); [Blockmedia](https://www.blockmedia.co.kr/archives/1019916). A competitor (Space and Time) calls Brevis pricing opaque and hard to predict [biased source] — [Space and Time](https://spaceandtime.io/blog/brevis-zk-coprocessor-vs-space-and-time-a-complete-comparison-for-developers). A 3 % marketplace take-rate in BREV appears only in an unverified secondary source — [indiebuidl](https://portfolio-indiebuidl.vercel.app/blog/brev_brevis_2026_zk)
- **EigenLayer (AVS model):** each AVS (the service) pays rewards to operators and restakers. Rewards v2 (January 2025) lets an AVS target rewards at specific operator sets and lets operators set a variable fee per AVS instead of the fixed 10 % — [Kiln](https://www.kiln.fi/post/eigenlayer-unveils-rewards-v2-and-slashing-for-2025); [Coin360](https://coin360.com/news/eigenlayer-rewards-v2-upgrade). Slashing went live on mainnet on 17 April 2025, with conditions defined by each AVS — [Chaos Labs / ether.fi governance](https://governance.ether.fi/t/chaos-labs-eigenlayer-eeth-security-upgrade-risk-analysis/2906). AVS fees "depend on usage and are not guaranteed". A claim of ~$15B restaked with only three AVSs generating real fees could not be verified — [BlockEden](https://blockeden.xyz/blog/2025/09/01/how-eigenlayer-liquid-restaking-are-re-pricing-defi-yields-in-2025/)

### Inferences
- For PUNA, the "proof market" model translates into a **fixed base fee per audit plus a variable part per verified work** (for example per layer or per Freivalds multiplication). It is the same shape as Succinct's base fee + PGU × price.
- Freivalds verification is O(n²) and very cheap compared with a ZK proof. If proving one billion cycles costs $0.04, verification compute cost is not a defensible price. PUNA has to charge for **independence, liability and settlement** (the validator from another operator, its signature, the escrow), not for compute.
- Avoid relying on a token to pay validators. The sector shows that emission-driven income is not real revenue.

### Gaps
- No public per-proof prices were found for Lagrange (LA), EZKL/Lilith, Giza or Gensyn. Search returned nothing on Lagrange's fees.
- No dollar revenue from customers (not emissions) was found for Succinct, Boundless or Brevis.

## 3. Onchain insurance protocols: % of premium or fixed tool fee?

### Takeaway
Almost every onchain insurance protocol charges **a percentage of premium or of float**, not a fixed tool fee. Ensuro charges a fee proportional to pure premium and to the cost of capital. Re lives on performance fee + float. Nexus Mutual earns from cover fees + investments. Otonomi is an MGA, so it earns commission on policies. Etherisc is the exception with a "tool" approach: an open-source framework (GIF) where operators and products pay in DIP. The Lemonade Coalition is non-profit. The protocol's real revenue is usually small next to gross volume.

### Cited findings
- **Ensuro:** its contracts define an "Ensuro fee" with two parts, one **proportional to the pure premium** (expected loss) and one **proportional to the cost of capital**. The percentages were not found — [Ensuro docs](https://ensuro.readthedocs.io); [Ensuro Protocol.md](https://cdn.jsdelivr.net/npm/ensuro@1.2.0/Protocol.md). An aggregator says income = share of premiums + yield from investing capital in DeFi (Aave) — [Alchemy dapps](https://www.alchemy.com/dapps/ensuro)
- **Etherisc (GIF/DIP):** instance operators are paid exclusively in DIP. Risk-pool keepers earn a management fee. Product and oracle owners are paid for supplying contracts and data, in a freely chosen token. Projects have to buy DIP to go to production. **No protocol-fee percentage is published** — [Etherisc Token Model](https://docs.etherisc.com/gif/token-model). The foundation says operator fees only cover costs and are "not profit-oriented" — [Etherisc Governance Model](https://docs.etherisc.com/gif/governance-model)
- **Re (onchain reinsurance):** over 30 days, $2.02M of fees but only **$3,857 of protocol revenue**, annualised ~$12.6M of fees vs ~$163K of revenue. The model is "Performance Fee + Float Income", with a 0 bps mint fee and a 6 bps redemption fee (issuer-disclosed, October 2026 snapshot) — [DefiLlama Re](https://defillama.com/protocol/re). Re reports $510.5M of reinsurance premium written onchain [SELF] — [Re blog](https://blog.re.xyz/half-billion-milestone/)
- **Nexus Mutual:** in 2025, >$5.7M of **cover fees**, >$3.2M of treasury investment returns and >$5.6M of value accrued through the RAMM, with >$370K of claims paid [SELF] — [Nexus Mutual blog](https://nexusmutual.io/blog/nexus-mutual-v3-a-year-of-progress-in-onchain-risk-infrastructure). A quarterly review cites $1B+ of cover purchased and $5.5M+ of premiums earned by underwriters — [Nexus forum](https://forum.nexusmutual.io/t/the-nexus-review-q4-2025-wrap-up/1824)
- **Otonomi:** a parametric cargo-delay insurer that operates as a **tech platform and MGA** for insurers and reinsurers, uses Chainlink oracles, raised a $3.4M seed in 2022 and a **$5M Series A on 30 October 2025** — [Coverager](https://coverager.com/otonomi-raises-5-million/); [Reinsurance News](https://www.reinsurancene.ws/insurtech-otonomi-raises-3-4m-to-build-blockchain-powered-parametric-cargo-platform/). Its commission percentage is not public.
- **Lemonade Crypto Climate Coalition:** a project of the Lemonade Foundation (non-profit) organised as a DAO, with Avalanche, Chainlink, DAOstack, Etherisc, Hannover Re and Pula as partners. The first pilot covered ~7,000 Kenyan farmers in the October 2022 to January 2023 season, with automatic payout on area-yield data — [Artemis](https://www.artemis.bm/news/lemonade-launches-crypto-parametric-climate-insurance-coalition/); [BusinessWire](https://www.businesswire.com/news/home/20230328005342/en/5412644/Nearly-7000-Kenyan-Farmers-Protected-by-the-Lemonade-Crypto-Climate-Coalition)

### Inferences
- The Re figures (≈1.3 % of fees stays with the protocol) illustrate the risk of a revenue share on premiums: high gross volume, low net capture, plus regulatory exposure as an intermediary. A fixed fee per verification separates PUNA from the insurance risk and from the need for an insurance licence.
- Etherisc shows that a "tool for building insurance" paid in its own token did not produce visible profit. Its foundation itself defines it as cost recovery.

### Gaps
- Ensuro's fee percentages, OnRe's and Nayms' fees, and Otonomi's commission were not found. Nayms and OnRe were not searched for lack of time.

## 4. Avalanche ecosystem: AvaCloud and Chainlink on Avalanche

### Takeaway
AvaCloud sells managed L1s as **SaaS with tiers** (Starter, Pro, Enterprise for testnet and mainnet) plus **metered storage**, and support tiers on top. Enterprise is custom pricing through sales.

### Cited findings
- Plans: Starter (early projects), Pro (scale and support), Enterprise (custom, onboarding, dedicated support), for testnet and mainnet. Prices appear only as images in the docs — [AvaCloud docs: plans](https://docs.avacloud.io/portal/l1-creation/what-plans-are-offered-via-avacloud-portal); Enterprise through sales — [AvaCloud Enterprise](https://docs.avacloud.io/portal/l1-creation/create-l1-enterprise)
- Past promotion: Testnet Starter at **$50, down from $1,599**, until 30 June 2025. Metered storage: **$0.12/GB** for chain storage and **$1.50/GB** for the explorer (per the search summary of the AvaCloud pricing post; the URL returned 404 when fetched again) — [AvaCloud pricing blog](https://site.avacloud.io/blog/avacloud-new-pricing-making-web3-accessible)
- Support tiers Starter, Pro, Pro+ and Enterprise with increasing response times — [AvaCloud Support Tiers](https://docs.avacloud.io/getting-started/support-tiers); SLAs — [AvaCloud SLAs](https://docs.avacloud.io/getting-started/service-level-agreements)
- Chainlink Functions and CCIP operate on Avalanche with the same USD-premium billing — [Functions Supported Networks](https://docs.chain.link/chainlink-functions/supported-networks)

### Inferences
- Within the Avalanche track, "tier plan + metered usage + paid support" is the native language. PUNA could copy it as a free testnet (pilot) / Pro / Enterprise with an SLA.

### Gaps
- Current monthly prices for AvaCloud Starter and Pro on mainnet were not confirmed.

## 5. Attestation and audit SaaS analogies (Chainalysis, TRM, audits, proof of reserves)

### Takeaway
Trust and compliance tools charge through **annual subscriptions** (Chainalysis: from tens of thousands to tens of millions of dollars depending on the customer) or **fixed fees per engagement** (audits: ~$15K–60K mid-size, ~$23–25K per engineer-week at top-tier firms). Proof of reserves done by accountants collapsed after FTX because of reputational risk.

### Cited findings
- **Chainalysis:** the IRS enterprise subscription is worth up to **$34.4M over three years** (sole-source, 2026) — [HigherGov](https://www.highergov.com/contract/2023H226C00018/); a ~$22M IRS web subscription — [OrangeSlices](https://orangeslices.ai/contract-award-22m-irs-chainalysis-web-subscription/); the US Air Force paid **$799K** for one year (2020) — [Decrypt](https://decrypt.co/40705/us-air-force-spends-800000-on-chainalysiss-crypto-services?amp=1). Commercial prices are not published. Third-party estimates conflict: KYT at $60–120K per year for a small exchange, a median of $18.5K per year, a median of ~$175K in year one for enterprise — [Costbench](https://www.costbench.com/software/crypto-compliance/chainalysis/)
- **Audits:** firms quote per engagement after scoping. OpenZeppelin's disclosed engagement with Venus was **$554,400 over 24 weeks (~$23K per week)**. The ~$25K per engineer-week estimate is third-party — [Spark audit comparison](https://www.spark.money/tools/smart-contract-audit-firm-comparison); [Sherlock](https://sherlock.xyz/post/smart-contract-audit-cost)
- **Proof of reserves:** Armanino, the PoR leader (Kraken, Nexo, FTX US), **left crypto in December 2022** after FTX. Mazars also withdrew. The team moved to The Network Firm — [Blockworks](https://blockworks.co/news/ftx-nexo-auditor-armanino-to-quit-crypto-after-8-years-report); [Bloomberg Tax](https://news.bloombergtax.com/financial-accounting/auditors-spurn-crypto-after-ftx-misleading-reserve-estimates). Chainlink PoR is sold as a private offer — [AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-puk4hjjubskkg). Critique: "Chainlink PoR proves little beyond data going in, coming out" — [CoinDesk 2023](https://dev.coindesk.com/tech/2023/07/05/chainlink-proof-of-reserve-proves-little-beyond-data-going-in-coming-out)

### Inferences
- PUNA sits between an "onchain audit" and "PoR". The lesson from PoR is that a narrow attestation (data in, data out) loses credibility and the provider carries reputational risk. PUNA's argument, a mathematical check of the computation plus an independent operator, addresses exactly that weakness and should be stated in the contract terms (what it certifies and what it does not).
- An annual subscription per insured portfolio or per orbital operator (the Chainalysis model) plus a fee per audited job (the Chainlink model) is a combination with precedents.

### Gaps
- No public TRM Labs or Certora prices were found.

## 6. Which models produced real revenue and which collapsed

### Takeaway
Real revenue came from (1) **enterprise contracts and subscriptions paid in fiat** (Chainalysis, Chainlink enterprise according to Chainlink itself, audits), (2) **value capture or revenue share where volume is large** (Chainlink SVR and GMX, Nexus cover fees), and (3) **metered usage** at low prices with volume. What did not produce net revenue, or collapsed: proving and AVS networks that mostly pay with emissions, protocol tokens that are only cost recovery (Etherisc DIP), protocols with high gross volume and near-zero net capture (Re), and accountant-run PoR (Armanino 2022).

### Cited findings
- Chainlink: "hundreds of millions" of enterprise revenue [SELF]; GMX 1.2 % and SVR 35 % [REAL] — [Chainlink blog](https://chain.link/blog/chainlink-reserve-strategic-link-reserve)
- Nexus Mutual: >$5.7M of cover fees in 2025 [REAL, SELF] — [Nexus blog](https://nexusmutual.io/blog/nexus-mutual-v3-a-year-of-progress-in-onchain-risk-infrastructure)
- Re: ~$12.6M of annualised fees vs ~$163K of protocol revenue — [DefiLlama](https://defillama.com/protocol/re)
- EigenLayer: AVS fees not guaranteed; claim of only three AVSs with real fees (unverified) — [BlockEden](https://blockeden.xyz/blog/2025/09/01/how-eigenlayer-liquid-restaking-are-re-pricing-defi-yields-in-2025/)
- Chainlink staking: rewards mostly from emissions according to analysts [TOKEN] vs DefiLlama measuring ~$4M per month of staking revenue (sources conflict) — [DefiLlama](https://defillama.com/protocol/chainlink-staking)
- Armanino and Mazars left PoR in 2022 — [Blockworks](https://blockworks.co/news/crypto-auditors-call-it-quits)

### Inferences (for PUNA's pricing)
- Suggested tool model with sector precedents:
  - **Per-audit fee in USD**, charged in AVAX or USDC from a prepaid balance in `PunaEscrow` (like Chainlink Functions). Fixed base + a variable part per verified layer (like Succinct).
  - **Annual subscription by tier** (pilot or testnet / Pro / Enterprise with an SLA and a contractual certificate), like AvaCloud and Chainalysis.
  - Optionally, an **ecosystem sponsor** (like Chainlink Scale) where an L1 or orbital operator pays for verification of its jobs.
- Avoid a % of premium (the Ensuro and Re model): it ties PUNA to the insurance business and to regulation, and the empirical net capture is low.
- Validator payment should be in fees (stablecoin), not token emissions, so the pitch can claim "real revenue".

### Gaps
- No audited figures (Token Terminal or Messari) for 2024–2025 revenue of Chainlink, Succinct or Boundless were obtained.
- Lagrange, EZKL/Lilith, Giza, Gensyn, Nayms, OnRe and TRM were not covered in depth because of the tool-call limit.
