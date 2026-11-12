# Satellite / parametric-index vendors that sell TO insurers: pricing, packaging, traction (2024–2026)

Research date: 2026-11-12. About 16 search/fetch calls. Almost no vendor in this space publishes prices. Where pricing is unpublished, these notes say "not public". Inferences are labeled as such.

## 1. What each company sells, who pays, and the pricing unit

### Takeaway
Pure tool vendors (Floodbase, ICEYE, Planet/Sentinel Hub, EarthDaily, CAPE, ZestyAI, Satellites on Fire) sell data licences, platform subscriptions, or APIs to carriers, reinsurers and brokers. None of them publishes an insurer-facing price list. The only public, metered price unit in the stack is the low-level imagery-processing unit (Sentinel Hub "processing units"). Descartes, Arbol and Kettle are the contrast cases: they earn on premium (MGA commission or risk capacity), not on licences.

### Cited Findings

**Floodbase (formerly Cloud to Street), tool vendor and "reporting agent"**
- It describes itself as "a data provider and reporting agent" that partners with re/insurers and humanitarian organizations to design, underwrite and monitor parametric flood products, covering everything from index design and pricing to triggering payouts. — [Floodbase blog](https://www.floodbase.com/blog-posts/unlocking-large-scale-parametric-flood-insurance-with-reliable-continuous-data)
- It is the flood monitoring provider behind Guy Carpenter's GC FloodShield parametric product, a white-label "Powered by Floodbase" arrangement. — [Floodbase / GC FloodShield](https://www.floodbase.com/guy-carpenter-floodshield)
- In February 2026 it launched an instant quoting application for parametric flood (re)insurance in the US commercial market with Liberty Mutual. — [Fintech Global, Feb 2026](https://fintech.global/2026/02/25/liberty-mutual-and-floodbase-target-us-flood-gap/); [Insurance Journal, Feb 2026](https://www.insurancejournal.com/news/national/2026/02/25/859593.htm)
- In March 2026 it added a Quote API that lets carriers give brokers standardized quote tools. — [Insurance Journal, Mar 2026](https://amp.insurancejournal.com/news/national/2026/03/06/860867.htm)
- In April 2025 it launched automated parametric flood cover for New Orleans businesses with the intermediary Yokahu. — [Fintech Global](https://fintech.global/2025/04/28/floodbase-and-yokahu-launch-new-parametric-flood-insurance-for-new-orleans-businesses/)
- Pricing unit: **not public**. No source says whether it charges per policy, per area or a platform fee.

**ICEYE (SAR constellation), data licence and subscription platform**
- ICEYE Insights (June 2022) lets insurers upload property portfolios and overlay ICEYE flood extent and depth data. — [ICEYE press release](https://www.iceye.com/press/press-releases/iceye-launches-geospatial-analysis-platform-to-provide-insurers-with-instant-flood-impact-analysis)
- ICEYE markets its flood offering as "the world's first global and always-on data utility" for insurance. — [ICEYE flood monitoring](https://www.iceye.com/solutions/flood-monitoring)
- Aon expanded its data licensing agreement for ICEYE flood and wildfire data in September 2024. Juniper Re signed a multi-year flood and wildfire data collaboration. — [InsuranceNewsNet (Juniper Re)](https://insurancenewsnet.com/oarticle/iceye-and-juniper-re-llc-announce-multi-year-flood-and-wildfire-data-collaboration); timeline summarized by [Sacra](https://sacra.com/chat/h/db8b44ed-e3ed-4baf-a707-0888076f593c)
- Munich Re integrated ICEYE flood data into its Location Risk Intelligence platform (December 2025). ICEYE launched a hurricane solution for insurance in March 2025. — [Sacra timeline](https://sacra.com/chat/h/db8b44ed-e3ed-4baf-a707-0888076f593c)
- A 2025 launch promised near-real-time flood data within as little as 6 hours of an event. The UK Flood Early Warning product gives a 4-day impact forecast. — [Insurance Times](https://www.insurancetimes.co.uk/news/iceye-launches-products-to-help-insurers-reduce-cost-of-floods/1451887.article)
- Pricing unit: **not public**. Sacra describes "subscription-like, ongoing licenses" but gives no contract length or price. — [Sacra](https://sacra.com/chat/h/db8b44ed-e3ed-4baf-a707-0888076f593c)

**Planet and Sentinel Hub (Sinergise), metered processing plus enterprise contracts**
- sentinel-hub.com/pricing now redirects to planet.com/pricing, which shows Sentinel Hub is folded into Planet's commercial offer. The Planet pricing page did not render any plan figures when fetched. — [sentinel-hub.com/pricing](https://www.sentinel-hub.com/pricing/)
- The billing unit is the **processing unit (PU)** plus requests. Plans set monthly or yearly PU and request quotas, unused quota does not roll over, and quotas can be customized. — [Sentinel Hub billing docs](https://docs.sentinel-hub.com/api/latest/api/overview/billing)
- PU cost examples: a 2500×2500 px RGB image is about 23.8 PU and a 500×500 px image about 1.27 PU. Batch processing costs about one third of the Process API rate. — [Sentinel Hub forum](https://forum.sentinel-hub.com/t/what-is-the-difference-between-a-processing-unit-and-request-i-see-for-enterprise-plans-the-number-of-requests-are-less-than-processing-units/6572); [Sentinel Hub FAQ](https://www.sentinel-hub.com/faq/how-can-i-know-how-many-processing-units-i-need/)
- Enterprise S rate limits: 600 requests/min and 1,000 PU/min. — [Copernicus Data Space docs](https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Overview/RateLimiting.html)
- An older, undated Euro Data Cube price list put prepaid PUs at **EUR 2.50 per 1,000 PU** (40k–400k PU) and EUR 1.50 per 1,000 above that, expiring after 24 months. This may be outdated. — [Euro Data Cube brochure (PDF)](https://cockpit.hub.eox.at/storage/uploads/edc-editor/Euro_Data_Cube_summary_brochure.pdf)
- Insurance customer: Planet and AXA Climate extended a strategic partnership (May 2023) to drive a drought index insurance programme. — [Business Wire](https://businesswire.com/news/home/20230510005420/en/Planet-and-AXA-Climate-Extend-Strategic-Partnership-to-Drive-Drought-Insurance-Program)
- Insurer-facing pricing: **not public**.

**EarthDaily Agro, portfolio monitoring and loss verification for ag insurers**
- It sells portfolio management, remote claims verification and before/after imagery to insurers and lenders. — [EarthDaily insurance & lending](https://earthdaily.com/insurance-lending); [Portfolio docs](https://docs.earthdaily.com/agro/portfolio/)
- Case studies (anonymized, vendor-authored): a leading Brazilian insurer has been a customer for over a decade, a French ag insurer uses its weather data for policy setting, and a reinsurer uses its archive to build parametric triggers in place of field assessment. — [EarthDaily Brazil case](https://earthdaily.com/blog/weather-analytics-help-brazilian-insurer-reduce-daily-risk-in-agriculture); [EarthDaily reinsurer case](https://earthdaily.com/blog/reducing-financial-risk-for-a-global-insurance-leader)
- Pricing: **not public**.

**CAPE Analytics, property analytics SaaS (acquired)**
- Moody's announced the acquisition of CAPE Analytics on 13 Jan 2025, terms undisclosed, with closing expected in Q1 2025. — [Business Wire](https://www.businesswire.com/news/home/20250113472182/en); [Insurance Journal](https://www.insurancejournal.com/news/national/2025/01/13/807956.htm)
- About $75M raised before the acquisition. Nearly half of the top 50 US property insurers use CAPE in pricing and underwriting. Named customers: The Hartford, Mercury, Amica, Hippo, American Integrity, Cypress. — [InsurTech Digital](https://insurtechdigital.com/technology-and-ai/how-moodys-acquisition-of-cape-will-redefine-property-risk)
- Pricing unit: **not public**. The industry norm is per-property lookup or annual licence, but that is not confirmed by a source here.

**ZestyAI, property and climate risk AI SaaS**
- It says it partners with about half of the top 50 US P&C carriers. Customers include Amica, Aon, Berkshire Hathaway, Cincinnati Insurance, Farmers and the California FAIR Plan. It reports 33 new and expanded customer partnerships in one year. — [Insurance Business](https://insurancebusinessmag.com/us/news/technology/rivals-beware-property-risk-analytics-insurtech-promises-to-stick-around-416006.aspx)
- Funding: Series B $33M (July 2022, led by Centana) and a **$15M CIBC credit facility (June 2025)**. No Series C found. — [InsurTech Digital](https://insurtechdigital.com/articles/climate-risk-insurtech-zesty-ai-closes-33mn-series-b-round); [The Insurer](https://www.theinsurer.com/ti/news/risk-analytics-insurtech-zestyai-secures-15-million-credit-facility-from-cibc-2025-06-26/)
- Valuation: Dealroom lists only a USD 100–500M range, an estimate. — [Dealroom](https://dealroom.co/companies/zestyai/)
- Pricing: **not public**.

**Pula, B2B2C embedded ag insurance (intermediary and technical service provider)**
- It does not sell to farmers directly. It embeds cover in partners' products, for example premiums bundled with fertilizer and seed in a Zambian government programme. — [Insurtech Insights](https://www.insurtechinsights.com/pula-raises-us20m-series-b-funding-to-expand-agricultural-insurance-coverage-across-emerging-markets/)
- It has 70+ insurer partners, 20 reinsurers and 100 distribution partners, and has covered 15.4M farmers. — [Insurtech Insights](https://www.insurtechinsights.com/pula-raises-us20m-series-b-funding-to-expand-agricultural-insurance-coverage-across-emerging-markets/)
- Series B: $20M (April 2024, led by BlueOrchard / InsuResilience). — [Agrifocus Africa](https://agrifocusafrica.com/2024/04/15/pula-raises-20m-series-b-to-provide-agricultural-insurance-to-farmers-in-africa-asia-and-latam/)
- Revenue model: per Dealroom (single source), revenue comes from premiums, often subsidized, plus fees for digital services. **The insurer-side fee or commission is not public.** — [Dealroom](https://app.dealroom.co/companies/pula)

**OKO (Mali/Uganda), small B2C/B2B2C index insurtech**
- It uses satellite data and mobile money for automated drought and flood cover. It reported about 7,000 paying customers in Mali and more than 1,000 farmers compensated in a year. — [AgFunderNews](https://agfundernews.com/oko-finance-is-delivering-crop-insurance-to-cushion-malis-farmers-from-intensifying-weather-patterns); [Coverager](https://coverager.com/oko-raises-1-2-million/)
- Seed round: $1.2M (2021, Newfund and ResiliAnce). Total funding is about $2M+ per Dealroom, which is unverified. — [Africa Global Funds](https://www.africaglobalfunds.com/news/private-equity/deals/newfund-and-resiliance-lead-12m-seed-round-in-oko/); [Dealroom](https://app.dealroom.co/companies/oko_2)

**Contrast cases that monetize premium or risk, not a tool fee**
- **Descartes Underwriting (parametric MGA, commission on premium):** gross written premium was $250M+ in 2025 and more than $200M in 2024. It targets $500M GWP (about 2028). It raised a $120M Series B in 2022, and Battery Ventures later invested at a premium to that valuation. — [Descartes 2025 review](https://descartesunderwriting.com/newsroom/2025-successful-year-global-resilience-descartes); [Insurtech Insights (Battery)](https://www.insurtechinsights.com/battery-ventures-invests-in-parametric-insurance-leader-descartes-underwriting/); [Insurance Insider](https://www.insuranceinsider.com/article/29nidgyb0v8s36kj8e41s/insurtech-descartes-underwriting-raises-120mn-in-series-b-round); [ReinAsia](https://reinasia.com/descartes-underwriting-names-first-cso-as-mga-targets-us500m-in-premiums-within-three-years/)
- **Arbol (risk-taking parametric platform with its own capacity):** Series B $60M (April 2024). It said it had more than $250M of its own risk capacity and expected over $1B the following year. In 2025 it launched a parametric wildfire product with limits up to $10M. — [Arbol press](https://arbol.io/post/arbol-raises-60-million-in-series-b-funding-to-scale-parametric-insurance-responding-to-increasing-climate-risk); [Artemis](https://www.artemis.bm/news/arbol-lines-up-250m-non-traditional-capacity-targets-1bn-next-year/); [Reinsurance News](https://www.reinsurancene.ws/arbol-launches-new-wildfire-parametric-product-for-western-states/)
- **Kettle (Bermuda reinsurance MGA, wildfire):** Series A $25M (Nov 2021). It is an MGA using ML on weather and satellite data, so it earns on premium, not a data fee. No later rounds were found. — [TechCrunch](https://techcrunch.com/2021/11/19/kettle-books-25m-for-its-reinsurance-platform-against-fire-and-other-catastrophes); [Artemis](https://www.artemis.bm/news/wildfire-reinsurance-insurtech-kettle-raises-25m-series-a/)

**Argentina**
- Sancor Seguros sells a parametric drought cover for soy and maize based on the TVDI water-deficit satellite index **published by CONAE**. Here the public agency supplies the index for free, and the insurer carries the product. — [Bichos de Campo](https://bichosdecampo.com/sancor-seguros-lanzo-una-novedosa-cobertura-para-la-sequia-que-se-basa-en-la-informacion-satelital-y-puede-ser-monitoreada-desde-el-celular)
- El Norte was the first company authorized by the SSN for a parametric drought policy (2020 report). — [La Voz de San Justo](https://www.lavozdesanjusto.com.ar/el-norte-presenta-el-innovador-seguro-parametrico-de-sequia-una-nueva-forma-de-proteger-los-cultivo-94187)
- Forbes Argentina reports that parametric ag policies doubled in one year. — [Forbes Argentina](https://www.forbesargentina.com/negocios/en-ano-duplicaron-polizas-seguro-parametrico-agro-n11497)
- **Satellites on Fire** (Argentine AI wildfire detection) raised **$2.7M** led by Dalus Capital (April 2026). Sources disagree on whether it was a seed or Series A. It sells as SaaS to forestry, agriculture, energy, carbon projects, **insurers** and governments. — [Descubre.vc](https://www.descubre.vc/noticia/dalus-capital-lidera-ronda-de-2-7m-en-la-startup-argentina-satellites-on-fire-2026-04-25); [The SaaS News](https://www.thesaasnews.com/news/satellites-on-fire-lands-2-7m-seed-round/)
- YielData (Argentina, 2022) builds an agricultural risk index and was invited by NASA to present it. It notes that SSN approval of parametric products is now faster. — [Ecosistema Startup](https://ecosistemastartup.com/yieldata-lleva-su-seguro-agricola-satelital-a-la-nasa/)

**Verisk / Moody's RMS (cat-model licence model)**
- Verisk counts extreme event solutions (cat models) inside **subscription revenue**, which grew 7.8% OCC in Q1 2024. Extreme event solutions also drove underwriting revenue growth in Q3 2024. FY2024 total revenue was $2,882M. — [InsuranceNewsNet Q1 2024](https://insurancenewsnet.com/oarticle/first-quarter-2024-earnings-presentation-3); [Verisk FY2024](https://www.verisk.com/company/newsroom/verisk-reports-fourth-quarter-2024-and-full-year-2024-financial-results/)

### Inferences
- The dominant packaging for vendors that sell to insurers is an **annual or multi-year data licence or platform subscription** (ICEYE–Aon "data licensing agreement", Juniper Re "multi-year collaboration", Verisk "subscription revenue"), sometimes with a white-label "Powered by X" layer for a broker (Floodbase in GC FloodShield). Per-event or per-policy fees are plausible for Floodbase's "reporting agent" role but are not confirmed.
- Metered unit pricing (per km² or per PU) appears only at the raw-imagery layer (Sentinel Hub). Insurer-facing products are priced through custom enterprise contracts.
- Closest analogue for PUNA: Floodbase's "reporting agent / calculation agent" role, an independent party that computes and certifies the trigger. Its distribution through a broker (Guy Carpenter) and a carrier (Liberty Mutual quote app, Quote API) shows how a tool vendor plugs into the existing value chain without taking risk.

### Gaps
- No published insurer-facing price for any vendor (Floodbase, ICEYE, Planet insurance, EarthDaily, CAPE, ZestyAI, Satellites on Fire). The planet.com/pricing fetch returned no figures.
- Swiss Re CatNet: no current pricing or packaging found. It was not searched in depth.
- Gro Intelligence's pricing model was not captured.
- Satelligence: no funding or insurance data found.
- Kettle after 2021: no updates found.

## 2. Revenue, ARR, funding, valuation, number of insurer customers

### Takeaway
Funding is public, but revenue and ARR are almost never public for the pure tool vendors. Customer counts are expressed as "about half of the top 50 US P&C carriers" (CAPE, ZestyAI), or as policies and farmers enabled (Floodbase, Pula).

### Cited Findings
- Floodbase: $12M Series A in 2023 (Lowercarbon), then $5M in Feb/Mar 2025 (Ecosystem Integrity Fund, Pulse Fund). It operates in 40+ countries and has enabled more than 9,000 flood policies. — [Fintech Global 2023](https://fintech.global/2023/01/30/floodbase-launches-parametric-flood-solution-and-bags-12m/); [Pulse 2.0](https://pulse2.com/floodbase-5-million-raised-for-parametric-platform-for-insuring-uncovered-flood-risk/); [Fintech Global 2025](https://fintech.global/2025/02/25/floodbase-raises-5m-to-expand-data-driven-flood-insurance-solutions/)
- CAPE: about $75M raised, then the Moody's acquisition (terms undisclosed). About half of the top 50 US property insurers are customers. — [InsurTech Digital](https://insurtechdigital.com/technology-and-ai/how-moodys-acquisition-of-cape-will-redefine-property-risk)
- ZestyAI: total funding estimates vary ($58M vs about $77M across trackers), plus a $15M credit line in 2025. Valuation is estimated at USD 100–500M. — [Dealroom](https://dealroom.co/companies/zestyai/); [The Insurer](https://www.theinsurer.com/ti/news/risk-analytics-insurtech-zestyai-secures-15-million-credit-facility-from-cibc-2025-06-26/)
- Pula: $20M Series B, 15.4M farmers covered, 70+ insurers. — [Insurtech Insights](https://www.insurtechinsights.com/pula-raises-us20m-series-b-funding-to-expand-agricultural-insurance-coverage-across-emerging-markets/)
- Descartes: $250M+ GWP in 2025. — [Descartes](https://descartesunderwriting.com/newsroom/2025-successful-year-global-resilience-descartes)
- Arbol: $60M Series B, with more than $250M in capacity. — [Artemis](https://www.artemis.bm/news/arbol-raises-60m-to-scale-parametrics-make-climate-risk-an-investable-asset-class)
- Gro Intelligence: raised more than $125M, including an $85M round co-led by Intel Capital in 2021. — [Semafor](https://www.semafor.com/article/06/04/2024/kenyan-ai-data-gro-intelligence-startup-shuts-down)
- ICEYE: no insurance revenue split or customer count is public. — [Sacra](https://sacra.com/chat/h/db8b44ed-e3ed-4baf-a707-0888076f593c)

### Inferences
- The two vendors that reached exit or scale on the tool model (CAPE acquired by Moody's; ZestyAI at about half the top-50 US carriers) sell **into core underwriting and pricing workflows of large carriers**, not into niche parametric programmes.
- Parametric-native tool vendors (Floodbase, OKO) raise small rounds of $1–12M. The capital-heavy players in parametrics (Arbol, Descartes) are the ones taking risk or premium.

### Gaps
- ARR and revenue figures for Floodbase, ICEYE insurance, ZestyAI, CAPE and Planet's insurance vertical were not found.

## 3. Which models scaled and which failed, and why

### Takeaway
Analytics embedded in carrier underwriting (CAPE, ZestyAI) and premium-earning MGAs (Descartes) scaled. Gro Intelligence, a broad horizontal ag-data platform, collapsed after raising more than $125M. The causes were failed financing, a 60% layoff and a board-ousted founder, not a validated insurance-specific failure.

### Cited Findings
- Gro shut down in June 2024 after failing to secure financing. Earlier in 2024 it took eleventh-hour funding in March and laid off 60% of staff. Founder Sara Menker was replaced by the board in February. — [Semafor](https://www.semafor.com/article/06/04/2024/kenyan-ai-data-gro-intelligence-startup-shuts-down); [AgFunderNews](https://agfundernews.com/breaking-ag-insights-platform-gro-intelligence-is-closing-down)
- Almanac later acquired Gro's IP and assets. — [Ground News](https://ground.news/article/almanac-acquires-gro-intelligence-ip-to-deliver-actionable-insights-across-the-global-agricultural-sector)
- ClimateAi, a climate-resilience data platform that raised $38M, also wound down. — [AgFunderNews](https://agfundernews.com/climate-resilience-platform-climateai-winds-down-operations); [Dealroom news](https://dealroom.co/news/144261-climateai-shuts-down-after-raising-38m-in-funding/)
- CAPE exited to Moody's, which now pairs it with RMS cat models. — [Business Wire](https://www.businesswire.com/news/home/20250113472182/en)

### Inferences
- Pattern: horizontal "insights" platforms with diffuse buyers (Gro, ClimateAi) struggled to convert to recurring revenue. Vendors tied to a specific, budgeted insurer workflow survived or exited: underwriting score (CAPE, ZestyAI), parametric trigger and reporting (Floodbase), cat data licence (ICEYE–Aon).
- For PUNA, the lesson is to anchor on a budgeted line item: the calculation/reporting-agent or claims-verification cost per programme, not "insights".

### Gaps
- No primary post-mortem attributes Gro's failure specifically to its pricing model.

## 4. Sales cycle, procurement, and how vendors avoid being seen as a partner taking a cut

### Takeaway
Vendors get into insurers through reinsurers and brokers (Aon, Guy Carpenter, Munich Re, Swiss Re, Juniper Re) and through carrier-branded front ends (Liberty Mutual quote app). They present themselves as neutral data, calculation or reporting agents with fixed licences, which preserves independence. Taking a premium share turns the company into an MGA (Descartes, Kettle) or a risk-taker (Arbol), with very different capital and regulatory needs.

### Cited Findings
- Floodbase calls itself a "data provider and reporting agent", a neutral role in trigger determination. — [Floodbase](https://www.floodbase.com/blog-posts/unlocking-large-scale-parametric-flood-insurance-with-reliable-continuous-data)
- Its distribution runs through a broker (Guy Carpenter FloodShield) and a carrier (Liberty Mutual). — [Floodbase/GC](https://www.floodbase.com/guy-carpenter-floodshield); [Insurance Journal](https://www.insurancejournal.com/news/national/2026/02/25/859593.htm)
- ICEYE grew through re/insurer and broker partnerships: Swiss Re (2021), Aon licence expansion (2024), Munich Re platform integration (2025), and a pilot with If P&C. — [Sacra](https://sacra.com/chat/h/db8b44ed-e3ed-4baf-a707-0888076f593c); [Intelligent Insurer](https://www.intelligentinsurer.com/insurance/iceye-and-if-p-c-partner-on-flood-monitoring-and-response-using-satellite-imagery-30403)
- EarthDaily's Brazilian insurer relationship has run for more than 10 years, which points to long-tenure licences once a vendor is embedded. — [EarthDaily](https://earthdaily.com/blog/weather-analytics-help-brazilian-insurer-reduce-daily-risk-in-agriculture)
- Basis risk (the gap between index and actual loss) is the main objection insurers and regulators raise in Argentina. — [Innovación Digital 360](https://www.innovaciondigital360.com/agrotech/agrotech-seguros-parametricos-agro-argentina-tecnologia-satelital-2026/)

### Inferences
- PUNA should position itself as an **independent calculation and verification agent**. Pricing options consistent with comparables: an annual platform licence per programme or carrier, plus a per-settlement (per-event or per-claim verification) fee, plus optional per-hectare monitoring tiers. A fixed fee keeps PUNA independent of the payout outcome, which is critical for an auditor. A fee that varies with payouts would create a conflict of interest.
- Typical entry path: pilot with a reinsurer or broker, then a white-label integration, then a multi-year licence. Sales-cycle length is not quantified in any source found.

### Gaps
- No source quantified sales-cycle length (months) or typical pilot fees.
- No source documented contract language on "no revenue share" for data vendors.
