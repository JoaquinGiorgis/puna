# On-chain / blockchain parametric insurance: players, outcomes, architecture, regulation (as of Nov 2026)

Scope note: about 20 searches and fetches, run on 2026-11-12. Most hard metrics for agricultural on-chain parametric products date from 2021–2023 pilots. I found almost no 2024–2026 scale-up data for them, and that absence is itself a finding. Older data carries its year.

## Main projects and their metrics

### Takeaway
On-chain agricultural parametric insurance has stayed at pilot scale: tens of thousands of farmers at most, premiums around US$1, and no published payout totals. The projects with real money are either regulated reinsurance and ILS-style platforms (Arbol, Re, Ensuro, Nayms/OnRe) or DeFi cover for crypto-native risks (Nexus Mutual). Most Avalanche-relevant precedents are the Lemonade Crypto Climate Coalition (Kenya, 2022–23) and Re's tokenized reinsurance fund (2024).

### Cited Findings

**Etherisc + ACRE Africa (Kenya, weather-index crop insurance on Ethereum, Chainlink data)**
- Built on Etherisc's "Generic Insurance Framework" on Ethereum, using local weather parameters as smart-contract inputs. It was integrated into ACRE's existing "Bima Pima" product. First payouts were processed in 2021 and are visible on-chain. — [Ledger Insights](https://www.ledgerinsights.com/etherisc-blockchain-parametric-crop-insurance-kenya-chainlink/); [Cointelegraph](https://cointelegraph.com/news/etherisc-onboards-17k-kenyan-farmers-covered-by-blockchain-based-crop-insurance)
- July 2021: more than 17,000 Kenyan smallholders were covered, and payouts were processed for "some" of them. The target was about 250,000 farmers in East Africa. — [Cointelegraph (2021)](https://cointelegraph.com/news/etherisc-onboards-17k-kenyan-farmers-covered-by-blockchain-based-crop-insurance)
- April 2022: about 22,000 Kenyan farmers had accessed the product. — [Techpoint Africa (2022)](https://techpoint.africa/2022/04/21/decentralised-insurance-kenya-etherisc/)
- The 2021 pilot reported an 80% cost reduction for ACRE's product, which translated into a 27% increase in sum insured for farmers. — [WFP Innovation project page](https://innovation.wfp.org/project/etherisc)
- The FinX pilot (Mercy Corps AgriFin, ACRE, Etherisc, APA Insurance) tested smart-contract index insurance with more than 10,000 farmers, including mid-season payouts. — [Mercy Corps Social Venture Fund (Medium)](https://medium.com/mercy-corps-social-venture-fund/finx-pilot-smart-contract-based-weather-index-insurance-in-kenya-part-1-d7a59eba644e)
- The motivation came from ACRE's 2020 survey: about 45% of 241 farmers were dissatisfied, citing claim-status communication and payouts that did not arrive after weather shocks. — [Ledger Insights](https://www.ledgerinsights.com/etherisc-blockchain-parametric-crop-insurance-kenya-chainlink/)
- The collaboration was supported by a Chainlink Community Grant. — [Chainlink blog](https://blog.chain.link/chainlink-awards-grant-to-support-the-joint-venture-between-acre-africa-and-etherisc/)
- Etherisc-wide, WFP's page (updated July 2023) says Etherisc reaches about 80,000 farmers. In 2023 Etherisc built a real-time data source for 5,500 smallholders insured in Burkina Faso, and it helped protect 7,000 farmers under the Lemonade coalition. — [WFP Innovation](https://innovation.wfp.org/project/etherisc)

**Etherisc FlightDelay**
- Launched in 2017 as automated blockchain flight-delay cover. — [Insurance Journal (2017)](https://www.insurancejournal.com/news/international/2017/10/30/469647.htm)
- A later version used a risk pool staked by DIP-token holders, Chainlink oracles, and crypto-only payments. The article is undated. — [Blockworks](https://blockworks.com/news/etherisc-insures-against-flight-delays-via-crypto-rails)

**Lemonade Crypto Climate Coalition (Kenya, on Avalanche)**
- Founding members were Avalanche, Chainlink, DAOstack, Etherisc, Hannover Re, Pula, and the Lemonade Foundation. It was announced in March 2022. — [Reinsurance News (2023)](https://www.reinsurancene.ws/lemonade-crypto-climate-coalition-protects-nearly-7000-kenyan-farmers/); [FinTech Global (2022)](https://fintech.global/2022/03/24/lemonade-to-deploy-blockchain-to-protect-subsistence-farmers/)
- The first pilot enrolled nearly 7,000 farmers in the short-rains season (Oct 2022–Jan 2023). Eligible farmers were paid at season end through smart contracts, with no claims filing and no adjusters. The payout amount and trigger thresholds were not disclosed. — [Reinsurance News (Mar 2023)](https://www.reinsurancene.ws/lemonade-crypto-climate-coalition-protects-nearly-7000-kenyan-farmers/)
- Example premium: US$0.83 to insure one farmer's entire maize crop for a season. Avalanche's post says traditional insurance doesn't make sense for premiums under US$10 a year. — [Avalanche blog, 7 Dec 2024](https://www.avalanche.com/blog/builder-spotlight-the-lemonade-foundation-and-insuring-smallholder-farmers-with-avalanche)
- Mechanics: an **area-yield index**. Five farms are sampled from a segment of 1,000 farms. If the sampled yield falls below the threshold (e.g. 3 t/ha expected vs under 2 t/ha actual), every farm in the segment is paid. Chainlink oracles bring the data on-chain, and policy funds are held as stablecoins on Avalanche. — [Avalanche blog](https://www.avalanche.com/blog/builder-spotlight-the-lemonade-foundation-and-insuring-smallholder-farmers-with-avalanche)
- The next phase (long rains, April 2023) aimed at "tens of thousands more" farmers. — [Reinsurance News](https://www.reinsurancene.ws/lemonade-crypto-climate-coalition-protects-nearly-7000-kenyan-farmers/). Even Avalanche's Dec 2024 post still cites only about 7,000 farmers. — [Avalanche blog](https://www.avalanche.com/blog/builder-spotlight-the-lemonade-foundation-and-insuring-smallholder-farmers-with-avalanche)

**Arbol (US; parametric weather/climate risk, "blockchain-powered")**
- In 2021 Arbol transacted US$70M of gross premium, up from US$2.2M in 2020. The loss ratio on transacted deals was under 50%. Contracts run as Ethereum smart contracts with Chainlink oracles, and data comes from dClimate, a decentralized climate data network. Smallholder rice cover in Cambodia started at US$11 premiums. — [Arbol press release, Feb 2022](https://www.arbol.io/post/arbols-blockchain-powered-platform-transacts-70-million-in-premium-in-2021)
- A US$60M Series B in 2024 funded expansion into P&C and home insurance. — [Arbol](https://arbol.io/post/arbol-raises-60-million-in-series-b-funding-to-scale-parametric-insurance-responding-to-increasing-climate-risk)
- In June 2023 Arbol unveiled an AI and blockchain climate insurance platform. — [CoinDesk (2023)](https://www.coindesk.com/business/2023/06/20/startup-arbol-unveils-ai-and-blockchain-powered-climate-insurance-platform/)
- Arbol received a Chainlink grant for Cambodian parametric crop cover. — [Chainlink blog](https://blog.chain.link/arbol-receives-chainlink-grant-to-build-parametric-crop-coverage-service)

**Nexus Mutual (DeFi smart-contract and protocol cover; Ethereum)**
- The only DeFi insurance protocol still operating at meaningful scale. As of mid-2026 its TVL was about US$82M, with US$18.6M+ in cumulative claims since 2019. — [Spark comparison tool, data "as of mid-2026"](https://www.spark.money/tools/defi-insurance-protocol-comparison)
- Nexus says it paid more than US$370K in claims in 2025, including Arcadia Finance (US$213,153.69 of active cover at the July 2025 exploit) and Stream Finance. — [Nexus Mutual Q4-2025 review](https://nexusmutual.io/reports/nexus_review_2025_q4.pdf); [Nexus blog](https://nexusmutual.io/blog/nexus-mutual-pays-nearly-100k-in-claims-due-to-stream-finance-fallout)
- A third-party review counts US$24.7M in claims since 2020. It says the capital pool shrank from 101,320 ETH (end of 2023) to about 40,652 ETH, mostly through NXM redemptions, while active cover rose from 23,278 to about 33,446 ETH. — [AltStreet review, 2026-11-01](https://altstreet.investments/platforms/reviews/nexus-mutual). These figures conflict with the Spark numbers above; both are third-party.
- Nexus committed US$15M as the first investor in Re's reinsurance fund on Avalanche (May 2024). — [Yahoo/press](https://malaysia.news.yahoo.com/rwa-platform-debuts-tokenized-reinsurance-130000303.html)

**InsurAce, Neptune Mutual, Unslashed, Bridge Mutual (DeFi cover)**
- InsurAce is functionally inactive, with about US$132K TVL against a peak capital pool of about US$150M. It paid about US$11.7M in claims, much of it for the Terra/UST depeg against roughly US$94K in UST premiums collected. — [Spark comparison (mid-2026)](https://www.spark.money/tools/defi-insurance-protocol-comparison). This conflicts with a 2026 article that still lists InsurAce as an active underwriter. — [BlockEden (May 2026)](https://blockeden.xyz/pt/blog/2026/05/03/defi-insurance-450m-q1-hacks-coverage-gap/)
- Neptune Mutual shut down in late 2024 and refunded its LPs. Its post-mortem cited "insufficient adoption across the DeFi insurance sector". Unslashed went dormant in late 2024, and Bridge Mutual is defunct (about US$56K TVL). — [Spark comparison](https://www.spark.money/tools/defi-insurance-protocol-comparison)

**Otonomi (US; parametric air-cargo delay cover, smart contracts + Chainlink)**
- Its first product (2023) covers air shipment delay and interruption. Policies are smart contracts, and Chainlink Data Feeds trigger them. — [Chainlink case study](https://chain.link/case-studies/otonomi); [Ledger Insights](https://ledgerinsights.com/blockchain-parametric-insurer-otonomi-logistics-delay-cover)
- Capacity comes from Greenlight Re's Lloyd's Innovation Syndicate 3456. — [AJOT](https://www.ajot.com/news/otonomi-partners-with-greenlight-re-innovations-to-launching-an-innovative-platform-for-parametric-cargo-insurance)
- Otonomi raised US$3.4M. — [Coverager](https://coverager.com/otonomi-raises-3-4-million/)
- Oct 2026: Otonomi Insurance Services LLC, a "licensed MGA", launched a perishable-cargo program with Tag-N-Trac and Solent Freight. — [Reinsurance News](https://www.reinsurancene.ws/otonomi-tag-n-trac-solent-freight-services-launch-parametric-cargo-coverage/)

**Wildfire-specific products**
- I found **no live on-chain wildfire parametric product**. Satellite-based wildfire parametrics do exist off-chain:
  - Liberty + ICEYE offer building-level wildfire cover in the US and Australia using SAR satellites. — [Reinsurance News](https://www.reinsurancene.ws/liberty-and-iceye-launch-new-parametric-wildfire-insurance-solution/)
  - LSM + ICEYE offer wildfire cover. — [Global Reinsurance](https://www.globalreinsurance.com/home/lsm-iceye-launch-parametric-wildfire-cover-using-satellite-data/1458839.article)
  - Descartes sells "fire-in-a-circle" cover for data centers, using a satellite burnt-area index. An independent certification agent retrieves the satellite data. — [Descartes white paper](https://descartesunderwriting.com/white-papers/parametric-wildfire-insurance-data-centers-fire-circle-protection-us)
  - Skyline Partners and ESA are developing satellite wildfire and drought products to reduce basis risk. — [Artemis](https://www.artemis.bm/news/leveraging-space-technology-to-refine-parametric-wildfire-and-drought-products-skyline-partners)

### Inferences
- The pilots that made the most noise were Etherisc/ACRE (17–22k farmers, 2021–22) and Lemonade on Avalanche (about 7k, 2022–23). Neither has published scale-up numbers since 2023, which suggests stagnation rather than growth.
- Per-farmer premiums of about US$1 mean revenue is tiny. These pilots were grant- or foundation-funded (Chainlink grants, the Lemonade Foundation), not commercially self-sustaining.
- Descartes' "independent certification agent retrieves satellite data" is the closest off-chain analogue to PUNA's independent validator. PUNA can frame itself as putting that certification step on-chain and making it verifiable.

### Gaps
- Blink Parametric: I did not research it. As far as I know it is an off-chain parametric travel provider, but that is unverified.
- No public payout totals (US$) for Etherisc/ACRE or the Lemonade coalition.
- No 2024–2026 status for Etherisc's agricultural programs, or for whether FlightDelay is still live.
- DeFiLlama's insurance category returned 403, so I have no category-wide TVL figure from it.
- I did not verify Arbol's 2025–2026 premium volume.

## Failures, shutdowns, pivots and their reasons

### Takeaway
The failures in DeFi cover were about capital and demand: a pool-shrink spiral, plus one correlated event (UST) that wiped out a pool. The agricultural pilots did not "fail" publicly. They plateaued: they depended on grants, premiums were tiny, and basis risk is structural. Arbol moved toward conventional P&C, and Nayms rebranded to OnRe as a reinsurance-yield product.

### Cited Findings
- Neptune Mutual closed in late 2024, citing insufficient adoption sector-wide; it had shown no significant growth in the 18 months before closing. Unslashed and Bridge Mutual failed to attract and retain capital. The broader pattern: low premium revenue drives away capital providers, the shrinking capital limits coverage, and that deters buyers. — [Spark comparison](https://www.spark.money/tools/defi-insurance-protocol-comparison)
- InsurAce's Terra/UST payouts (about US$11.7M total claims against about US$94K of UST premium) show correlated-loss risk in under-diversified pools. — [Spark comparison](https://www.spark.money/tools/defi-insurance-protocol-comparison)
- Nexus Mutual's capital pool fell by more than half in ETH terms between 2023 and 2026, through redemptions. — [AltStreet](https://altstreet.investments/platforms/reviews/nexus-mutual)
- Lemonade coalition: the planned expansion to "tens of thousands more" farmers (April 2023) shows no confirmed follow-up; the Dec 2024 Avalanche post still cites about 7,000. — [Reinsurance News](https://www.reinsurancene.ws/lemonade-crypto-climate-coalition-protects-nearly-7000-kenyan-farmers/); [Avalanche blog](https://www.avalanche.com/blog/builder-spotlight-the-lemonade-foundation-and-insuring-smallholder-farmers-with-avalanche)
- Arbol's 2024 Series B was explicitly for expansion into P&C and home insurance, a move toward conventional lines. — [Arbol](https://arbol.io/post/arbol-raises-60-million-in-series-b-funding-to-scale-parametric-insurance-responding-to-increasing-climate-risk)
- Nayms rebranded to OnRe (May 2025) and launched an accumulating LP token. Its projected returns of "up to 36.5%" are a projection, not a realised figure. — [Reinsurance News tag/nayms](https://www.reinsurancene.ws/tag/nayms/)
- Skeptic view: one expert interviewed "sits squarely in the 'no smart contracts' camp" because parametric contracts go wrong often. The World Bank's GIIF parametric projects in Africa did not use blockchain. — [Cointelegraph Magazine](https://cointelegraph.com/magazine/smart-contract-enabled-insurance-holds-promise-but-can-it-be-scaled)
- A Commonwealth Secretariat publication names the barriers as lack of data, poor design, and divergent regulatory approaches, and recommends regulatory sandboxes. — [Commonwealth iLibrary](https://www.thecommonwealth-ilibrary.org/index.php/comsec/catalog/download/16/13/103?inline=1)
- Basis risk is described as an "irreducible structural feature" of parametric design, not an oracle bug. — [Chainscore Labs blog (vendor commentary, low authority)](https://www.chainscorelabs.com/blog/regenerative-finance-refi-crypto-for-good/refi-in-emerging-markets/the-future-of-agricultural-insurance-is-in-parametric-smart-contracts)
- Skyline/ESA say basis risk on wildfire and drought products would be "very high" without space data. — [Artemis](https://www.artemis.bm/news/leveraging-space-technology-to-refine-parametric-wildfire-and-drought-products-skyline-partners)

### Inferences
- The failure modes cluster as follows:
  1. Too little demand or distribution: the products work technically but don't sell.
  2. Thin capital pools with correlated risk.
  3. Dependence on grants and foundations.
  4. Trust in the data and index: basis risk, and who computes the index.
- PUNA addresses (4) directly by making index computation auditable. It does not by itself solve (1) through (3). A judge-proof framing is to admit that and point to fronting and reinsurance for (2) and (3).
- Exact basis-risk percentages circulating online (for example "20–40%") come from unsourced vendor blogs. Do not cite them.

### Gaps
- I found no official post-mortem text from Neptune Mutual or InsurAce; their status comes from a third-party comparison page.
- I found no published evaluation (RCT or impact report) of the FinX or Lemonade pilots.

## Common architecture: oracles, trust, disputes

### Takeaway
Nearly every product uses the same pattern: an off-chain data source (weather station, area-yield sampling, flight or logistics feed, satellite) → Chainlink oracle → smart contract that pays automatically in stablecoin or crypto. The data provider and the index model are trusted, not verified. Dispute handling for parametric triggers is essentially absent. Only DeFi cover such as Nexus uses human claims assessment, which is discretionary rather than parametric.

### Cited Findings
- Etherisc/ACRE: local weather parameters → smart contract on Ethereum, with Chainlink data feeds. — [Ledger Insights](https://www.ledgerinsights.com/etherisc-blockchain-parametric-crop-insurance-kenya-chainlink/)
- Lemonade coalition: area-yield sampling (5 of 1,000 farms) → Chainlink → Avalanche contract, paying in stablecoins. The "highly-accurate data models" were built by the Lemonade Foundation itself. — [Avalanche blog](https://www.avalanche.com/blog/builder-spotlight-the-lemonade-foundation-and-insuring-smallholder-farmers-with-avalanche); [Reinsurance News](https://www.reinsurancene.ws/lemonade-crypto-climate-coalition-protects-nearly-7000-kenyan-farmers/)
- Arbol: dClimate data → Chainlink → Ethereum smart contracts. — [Arbol (2022)](https://www.arbol.io/post/arbols-blockchain-powered-platform-transacts-70-million-in-premium-in-2021)
- Otonomi: Chainlink Data Feeds for logistics data trigger the policies. — [Chainlink case study](https://chain.link/case-studies/otonomi)
- Descartes (off-chain): an independent certification agent retrieves the satellite burnt-area data. — [Descartes](https://descartesunderwriting.com/white-papers/parametric-wildfire-insurance-data-centers-fire-circle-protection-us)
- Nexus Mutual claims are decided by people. Since Nov 2025, a three-person committee (two of them board members) reportedly decides every claim. This is third-party, unverified. — [AltStreet](https://altstreet.investments/platforms/reviews/nexus-mutual)
- Recommended oracle hygiene: signed data from authorized oracles plus staleness thresholds. — [Chainscore guide (vendor)](https://www.chainscorelabs.com/guides/decentralized-insurance-and-risk-pools/oracle-integration/how-to-architect-an-oracle-network-for-parametric-insurance)

### Inferences
- **This is PUNA's clearest differentiator.** In every precedent, the oracle relays a number that someone else computed (a weather station reading, an area-yield sample, the Lemonade data model). Nobody verifies the *computation* of the index. PUNA adds an independent validator that checks the integrity of the AI computation (Freivalds) before the escrow pays. The pitch can say: "Chainlink proves the data arrived. PUNA proves the index was computed correctly."
- Satellite-derived burned-area indices are an established off-chain parametric practice (Descartes, ICEYE). PUNA is not inventing the index type, only the verifiable delivery.

### Gaps
- I found no documented on-chain dispute or appeal mechanism for any agricultural parametric product.

## Regulatory pattern: licensed partners and fronting

### Takeaway
Every on-chain insurer with real premium volume operates through a regulated vehicle: a Bermuda BMA licence (Ensuro Re, Nayms/OnRe), Cayman regulation (Re), a Lloyd's syndicate plus a US MGA or producer licence (Otonomi), or a local licensed insurer (APA Insurance in the ACRE/FinX pilot). Pure DeFi mutuals (Nexus) sell discretionary "cover", not regulated insurance.

### Cited Findings
- Ensuro Re holds a BMA insurance general business licence and a class T digital asset business licence. Licences issued in 2022. Self-described as the first authorized reinsurer to use smart contracts and stablecoin solvency capital. — [Bermuda Re Magazine](https://www.bermudareinsurancemagazine.com/ils/ensuro-wins-bermuda-licenses-7515)
- Nayms became fully regulated in Bermuda in May 2022 (DABA licence plus an Innovative General Business Insurance licence). It rebranded to OnRe in 2025 and calls itself the first fully licensed on-chain reinsurer (self-description). — [Reinsurance News](https://www.reinsurancene.ws/nayms-becomes-fully-regulated-in-bermuda/); [OnRe](https://www.onre.finance/about-us)
- Re is regulated in the Cayman Islands. — [Yahoo/press, May 2024](https://malaysia.news.yahoo.com/rwa-platform-debuts-tokenized-reinsurance-130000303.html)
- Otonomi is fronted by Greenlight Re's Lloyd's Syndicate 3456 and operates as a licensed MGA (2026). — [AJOT](https://www.ajot.com/news/otonomi-partners-with-greenlight-re-innovations-to-launching-an-innovative-platform-for-parametric-cargo-insurance); [Reinsurance News (Oct 2026)](https://www.reinsurancene.ws/otonomi-tag-n-trac-solent-freight-services-launch-parametric-cargo-coverage/)
- ACRE/Etherisc FinX pilot: APA Insurance was the licensed insurer partner. — [Mercy Corps (Medium)](https://medium.com/mercy-corps-social-venture-fund/finx-pilot-smart-contract-based-weather-index-insurance-in-kenya-part-1-d7a59eba644e)
- Lemonade coalition: Hannover Re was a founding partner, but its formal role (reinsurer or modeler) is not stated. The program is described as non-profit and foundation-led. — [Reinsurance News](https://www.reinsurancene.ws/lemonade-crypto-climate-coalition-protects-nearly-7000-kenyan-farmers/); [Avalanche blog](https://www.avalanche.com/blog/builder-spotlight-the-lemonade-foundation-and-insuring-smallholder-farmers-with-avalanche)
- Slovenia and Croatia have no dedicated legal framework for parametric contracts. Commonwealth guidance points to sandboxes. — [Preprints.org (2025)](https://www.preprints.org/manuscript/202506.1655); [Commonwealth iLibrary](https://www.thecommonwealth-ilibrary.org/index.php/comsec/catalog/download/16/13/103?inline=1)

### Inferences
- For PUNA in Argentina, the credible path is the standard one: a licensed local insurer (supervised by the SSN) issues the policy, a reinsurer takes the risk, and the smart contract acts as the settlement and verification rail. PUNA is the trust layer, not the insurer. This matches CLAUDE.md's framing of PUNA as a "capa de confianza" (trust layer).

### Gaps
- I found no IAIS, Swiss Re sigma, or Geneva Association document specifically on blockchain parametric fronting; the searches returned none.
- Argentina's SSN position on parametric or blockchain insurance was not researched here.

## Insurance / RWA insurance on Avalanche

### Takeaway
Avalanche has two real insurance precedents: the Lemonade Crypto Climate Coalition (parametric crop, Kenya, about 7,000 farmers, Chainlink oracles, stablecoins) and Re's tokenized reinsurance fund (May 2024, US$15M from Nexus Mutual plus Ava Labs' Vista fund). Neither verifies how the index is computed. I found no wildfire or satellite-index insurance on Avalanche.

### Cited Findings
- Lemonade Crypto Climate Coalition: built on Avalanche with Chainlink oracles; about 7,000 Kenyan farmers in 2022–23; premiums around US$0.83; stablecoin payouts. — [Avalanche blog (Dec 2024)](https://www.avalanche.com/blog/builder-spotlight-the-lemonade-foundation-and-insuring-smallholder-farmers-with-avalanche); [Reinsurance News](https://www.reinsurancene.ws/lemonade-crypto-climate-coalition-protects-nearly-7000-kenyan-farmers/)
- Re (May 2024): launched an open-ended reinsurance fund on Avalanche. Nexus Mutual committed US$15M and Ava Labs' Vista fund put in a smaller amount. Lines are property, trucking, aviation, and workers' comp, with catastrophe excluded at the start. The target was backing US$200M of premiums by year-end, with US$3B in pipeline (targets, not results). — [Yahoo/press](https://malaysia.news.yahoo.com/rwa-platform-debuts-tokenized-reinsurance-130000303.html); [Insurance Business](https://www.insurancebusinessmag.com/us/news/reinsurance/rwa-platform-launches-tokenized-reinsurance-fund-489282.aspx)
- Re is listed as a C-Chain integration in Avalanche's builder hub. In 2022 it said it planned to use both the C-Chain and a subnet. Later it added reinsurance yield products and a points program on Avalanche. — [build.avax.network](https://build.avax.network/integrations/re); [Avalanche Medium (2022)](https://medium.com/avalancheavax/re-is-building-a-global-decentralized-insurance-marketplace-on-avalanche-4d23ef366077); [Investing.com](https://www.investing.com/news/cryptocurrency-news/re-expands-institutional-offerings-on-avalanche-with-new-reinsurance-yield-products-and-points-program-4185254)
- Sentinel Protocol is a Chainlink hackathon project for parametric flight-delay insurance on Avalanche using Chainlink CRE; its status is unknown. — [Chainlink hackathon page](https://chain.link/hack-26/projects/sentinel-protocol)
- Avalanche RWA context: about US$740M of tokenized RWAs across 41 assets (undated Delphi report). — [Delphi Digital](https://members.delphidigital.io/reports/scaling-real-world-assets-on-avalanche)

### Inferences
- PUNA can position itself as "the agricultural parametric line Avalanche already validated with Lemonade, plus what was missing there: independently verifiable index computation". It can also note that capital-side primitives such as Re's tokenized reinsurance already exist on Avalanche to back such policies.
- Hackathon-level competitors on Avalanche (Sentinel-type flight-delay parametrics) mostly copy the Etherisc FlightDelay pattern. PUNA's satellite, AI, and validator angle is distinct.

### Gaps
- No dedicated insurance Avalanche L1 was found.
- Re's actual premiums backed and fund size after 2024 were not found.
