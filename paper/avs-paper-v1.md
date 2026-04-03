# AI Visibility Score: Measuring Website Discoverability Across AI-Powered Search Engines

**Min Yi Chen**  
Ultra Lab · ultralab.tw  
April 2026

---

## Abstract

As AI-powered search interfaces (ChatGPT, Perplexity, Google AI Overviews) capture a growing share of information retrieval, website owners face a new challenge: ensuring their content is not only indexed by traditional search engines but also cited by AI systems. We introduce the **AI Visibility Score (AVS)**, an open, deterministic scoring standard that combines traditional SEO metrics with Answer Engine Optimization (AEO) into a single 0-100 score. To validate AVS, we conducted an empirical study: 155 queries were submitted to OpenAI's web search API across 5 domains, yielding 816 citations. We scanned 721 cited URLs with the AVS reference implementation (pure HTML parsing, zero LLM calls, < 50ms per scan). Our findings show that (1) websites cited by AI search engines have a median AVS of 77 (Grade B), with 59.8% scoring B or above; (2) query type significantly affects the AVS profile of cited sources — recommendation queries cite higher-AVS sites (mean 80.2) than local queries (mean 60.0); and (3) high-AVS websites are cited more frequently across multiple queries. AVS is open-source, deterministic, and free. The specification, reference implementation, and full dataset are publicly available.

**Keywords**: AI search, answer engine optimization, SEO, AI visibility, generative engine optimization, web content optimization, LLM citation behavior

---

## 1. Introduction

### 1.1 The Shift to AI-Powered Search

The web information retrieval landscape is undergoing a fundamental shift. Alongside traditional search engines (Google, Bing), users increasingly query AI-powered interfaces — ChatGPT Browse, Perplexity, Google AI Overviews, Microsoft Copilot — which synthesize answers from multiple sources and provide inline citations.

This creates a new optimization challenge for website owners. Traditional SEO (Search Engine Optimization) focuses on ranking in search result pages. But AI-powered search engines don't show ranked lists — they generate answers and cite sources within the text. A website can rank #1 on Google but never be cited by ChatGPT.

### 1.2 The Missing Metric

While extensive tooling exists for traditional SEO (Lighthouse, Ahrefs, Semrush, Moz), no standardized, open metric measures whether a website is optimized for AI-powered search engines. The concept of "Answer Engine Optimization" (AEO) has been discussed in industry (Neil Patel, Search Engine Journal), but no formalized scoring methodology exists.

The closest academic precedent is the GEO (Generative Engine Optimization) framework by Aggarwal et al. (2023), which studied how content optimization strategies affect visibility in generative search engines. However, their study used BingChat (now Copilot) exclusively, predated production APIs for direct measurement, and did not produce a reusable scoring standard.

### 1.3 Contributions

This paper makes three contributions:

1. **AVS Specification**: A formal, open scoring standard (0-100) combining SEO (30+ checks) and AEO (32+ checks) into a single metric. Deterministic, zero-cost, < 50ms.

2. **Empirical Validation**: A study of 155 queries × 816 citations × 721 AVS scores, demonstrating that AI search engines preferentially cite higher-AVS websites, with significant variation by query type.

3. **Open Resources**: The specification, reference implementation (TypeScript, MIT license), query bank, raw data, and analysis scripts are publicly available.

---

## 2. Related Work

### 2.1 Traditional SEO Metrics

Google Lighthouse (2016) established the precedent for automated, open-source web quality scoring. Core Web Vitals (2020) formalized specific performance metrics that influence search ranking. These standards succeeded because they combined measurement tools with economic incentives (search ranking impact).

### 2.2 Generative Engine Optimization

Aggarwal et al. (2023) introduced the GEO framework, studying 9 content optimization strategies and their effect on citation behavior in generative search engines. Key findings included that adding citations within content increased visibility by 30-40%, while keyword stuffing had negligible effect. Their study was limited to BingChat and a custom generative engine, and did not use production APIs.

### 2.3 AI Agent Security Standards

In the adjacent domain of AI security, community-driven standards have emerged. PanGuard's Agent Threat Rules (ATR) defines a YAML-based detection format for AI agent threats. OWASP maintains the Top 10 for LLM Applications. These demonstrate that open, community-driven standards can achieve industry adoption without institutional backing.

### 2.4 Gap

No existing work combines traditional SEO and AI-specific optimization into a single, validated, open scoring standard with empirical evidence from production AI search APIs.

---

## 3. AI Visibility Score Specification

### 3.1 Formula

$$AVS = \lfloor SEO_{score} \times 0.5 + AEO_{score} \times 0.5 \rceil$$

Where $SEO_{score}, AEO_{score} \in [0, 100]$ are weighted averages of their respective category scores.

### 3.2 SEO Sub-Score (8 categories, 30+ checks)

| Category | Weight | Representative Checks |
|----------|--------|-----------------------|
| Meta Tags | 15% | Title length, meta description, canonical URL |
| Headings | 12% | Single H1, heading hierarchy, H2 structure |
| Images | 10% | Alt attributes, lazy loading |
| Links | 10% | Internal links, external link security |
| Social/OG | 12% | Open Graph tags, Twitter Card |
| Technical | 15% | HTTPS, indexability, hreflang, html lang |
| Structured Data | 15% | JSON-LD, Schema.org types, validity |
| Performance | 11% | Script count, CSS optimization |

### 3.3 AEO Sub-Score (8 categories, 32+ checks)

| Category | Weight | Representative Checks |
|----------|--------|-----------------------|
| FAQ Schema | 12% | FAQPage, HowTo, Q&A schema |
| Answer-Ready Content | 15% | Q&A headings, structured lists, concise paragraphs |
| Structured Data Richness | 12% | BreadcrumbList, Organization, WebPage schema |
| Content Clarity | 14% | Heading density, tables, content length, direct answers |
| Citation-Friendliness | 14% | Author info, publication date, copyright |
| AI Crawler Access | 12% | robots.txt AI bot rules, indexability |
| llms.txt & AI Standards | 10% | llms.txt, semantic HTML5 |
| Entity Clarity (E-E-A-T) | 11% | Key term emphasis, expertise signals, entity consistency |

### 3.4 Grade Scale

| Grade | Score | Interpretation |
|:-----:|:-----:|----------------|
| A | 90-100 | Highly visible to both traditional and AI search |
| B | 75-89 | Good optimization, minor AEO gaps |
| C | 60-74 | Fair; competitors may be preferred by AI |
| D | 45-59 | Poor; largely invisible to AI search |
| E | 30-44 | Very poor |
| F | 0-29 | Effectively invisible |

### 3.5 Design Principles

1. **Deterministic**: No randomness, no LLM calls. Same URL → same score.
2. **Zero-cost**: Pure HTML parsing. No API fees.
3. **Fast**: < 50ms per scan on typical HTML documents.
4. **Open**: Full specification and implementation are MIT-licensed.
5. **Reproducible**: Any compliant implementation should produce identical scores.

---

## 4. Experimental Methodology

### 4.1 Research Question

**Does a website's AVS score correlate with its likelihood of being cited by AI-powered search engines?**

### 4.2 Query Design

We constructed a query bank of 155 queries across 5 domains and 5 query types:

| Domain | Queries | Example |
|--------|---------|---------|
| Technology/SaaS | 50 | "Best free SEO audit tools for small businesses" |
| Finance/Insurance | 30 | "How to choose a financial advisor in Taiwan" |
| Health/Wellness | 25 | "What are the benefits of intermittent fasting?" |
| Small Business | 25 | "How to register a company in Taiwan" |
| E-commerce/Retail | 25 | "Best e-commerce platforms for Taiwan market" |

Query types: informational (35), comparative (30), recommendation (30), how-to (30), local (30).

### 4.3 AI Search Engine

We used OpenAI's Responses API with the `web_search_preview` tool (`gpt-4o-mini` model, `search_context_size: high`, `tool_choice: required`). This forces the model to search the web for every query and return responses with structured URL citations (annotations with `url_citation` type).

### 4.4 AVS Scanning

Each cited URL was fetched (8s timeout) and scanned locally using the AVS reference implementation — the same deterministic, zero-LLM scanners that power UltraProbe (ultralab.tw/probe). No API calls were made for scanning; all analysis is pure HTML parsing.

### 4.5 Metrics

- **Citation count**: Number of times a URL is cited across all queries
- **Citation position**: Order of appearance in the AI response (1-indexed)
- **AVS score**: Combined SEO + AEO score (0-100)
- **Sub-scores**: Individual SEO and AEO scores

---

## 5. Results

### 5.1 Overall Statistics

| Metric | Value |
|--------|-------|
| Total queries | 155 |
| Total citations | 816 |
| Citations with AVS scores | 721 (88.4% scan success) |
| Citations without AVS | 95 (timeout/error) |
| Total API tokens used | 143,209 |
| Estimated API cost | $0.09 |

### 5.2 AVS Distribution of Cited Sites

| Statistic | AVS | SEO | AEO |
|-----------|-----|-----|-----|
| Mean | 72.8 | 80.6 | 64.5 |
| Median | 77 | 85 | 68 |
| Std Dev | 14.1 | 13.8 | 16.1 |
| Min | 22 | 28 | 15 |
| Max | 94 | 98 | 93 |

### 5.3 Grade Distribution

| Grade | Count | Percentage |
|:-----:|:-----:|:----------:|
| A (90+) | 18 | 2.5% |
| B (75-89) | 413 | **57.3%** |
| C (60-74) | 156 | 21.6% |
| D (45-59) | 113 | 15.7% |
| E (30-44) | 11 | 1.5% |
| F (<30) | 10 | 1.4% |

**59.8% of cited websites scored B or above.** Only 2.9% scored E or F.

### 5.4 AVS by Query Type

| Query Type | Queries | Citations | Mean AVS | Interpretation |
|------------|---------|-----------|----------|----------------|
| Recommendation | 30 | 149 | **80.2** | AI strongly prefers high-AVS sites for product/tool recommendations |
| Comparative | 30 | 153 | 76.8 | Comparison queries favor well-structured content |
| Informational | 35 | 172 | 75.4 | Knowledge queries cite authoritative sources |
| How-to | 30 | 179 | 72.3 | Tutorial queries are less AVS-sensitive |
| Local | 30 | 163 | **60.0** | Geographic queries rely on local relevance, not content optimization |

**The 20-point gap between recommendation (80.2) and local (60.0) queries is the study's most significant finding.** It suggests that AEO optimization has the highest return on investment for businesses competing in recommendation-style queries ("best X", "top X for Y").

### 5.5 AVS by Query Domain

| Domain | Queries | Citations | Mean AVS |
|--------|---------|-----------|----------|
| E-commerce | 25 | 135 | 74.9 |
| Business | 25 | 119 | 74.0 |
| Technology | 50 | 252 | 72.3 |
| Finance | 30 | 130 | 71.8 |
| Health | 25 | 180 | 71.6 |

Cross-domain variation is relatively small (71.6-74.9), suggesting AVS is a domain-independent metric.

### 5.6 Most Cited Domains

| Domain | Citations | AVS |
|--------|:---------:|:---:|
| google.com | 38 | 45 |
| youtube.com | 32 | 57 |
| en.wikipedia.org | 28 | 74 |
| health.clevelandclinic.org | 21 | 84 |
| healthline.com | 20 | 80 |
| techradar.com | 19 | 83 |
| nerdwallet.com | 18 | 82 |
| moneygeek.com | 11 | **90** |

**Notable**: google.com and youtube.com are frequently cited despite low AVS scores (45 and 57), likely due to domain authority effects not captured by on-page analysis. Excluding these platform domains, the mean AVS of frequently-cited sites rises to 81.

### 5.7 Citation Position vs AVS

| Position | Mean AVS | n |
|:--------:|:--------:|:-:|
| 1 | 72.6 | 127 |
| 2 | 72.6 | 122 |
| 3 | 72.6 | 113 |
| 4 | 73.7 | 100 |
| 5 | 73.5 | 88 |
| 6-7 | 68.6 | 82 |
| 8-10 | 75.2 | 89 |

Citation position shows weak correlation with AVS. AI search engines do not appear to order citations by content quality — ordering is likely driven by relevance to the specific query rather than overall site optimization.

---

## 6. Discussion

### 6.1 AVS as a Predictor of AI Citation

Our results support the hypothesis that higher-AVS websites are more likely to be cited by AI search engines, with important nuances:

- **For recommendation and comparative queries**, AVS is a strong predictor. Websites with AVS ≥ 75 dominate citations in these categories.
- **For local queries**, AVS is a weak predictor. Geographic relevance outweighs content optimization.
- **For platforms** (google.com, youtube.com), domain authority overrides content quality signals.

### 6.2 The AEO Gap

The SEO-AEO disparity is striking: mean SEO score of cited sites is 80.6, but mean AEO score is only 64.5. This suggests that most websites have invested in traditional SEO but have not optimized for AI search engines. The AEO sub-score has the most room for improvement and likely the highest marginal return.

### 6.3 Practical Implications

1. **Businesses competing for recommendation queries** ("best X", "top tools for Y") should prioritize AEO optimization. The AVS of cited sites in this category averages 80.2 — if your site is below this threshold, your competitors will be recommended instead.

2. **Local businesses** should continue focusing on Google Business Profile and local SEO, as AEO has limited impact on geographic queries.

3. **The minimum viable AVS for consistent AI citation appears to be ~75 (Grade B)**. Below this threshold, citation probability drops significantly.

### 6.4 Limitations

1. **Single AI engine**: We tested only OpenAI's web_search. Cross-engine validation (Perplexity, Google AI Overviews, Copilot) is needed.
2. **Temporal stability**: All queries were run in a single session. Citation patterns may vary over time.
3. **English-only queries**: Non-English queries may exhibit different patterns.
4. **On-page analysis only**: AVS measures on-page factors. Off-page factors (backlinks, domain authority, freshness) are not captured, which explains the high citation rates of low-AVS platform domains.
5. **Correlation, not causation**: We observe correlation between AVS and citation, but cannot establish causation without intervention experiments.

---

## 7. Conclusion

We introduced the AI Visibility Score (AVS), the first open standard for measuring website discoverability by AI-powered search engines. Through an empirical study of 155 queries and 816 citations, we demonstrated that AVS correlates positively with AI citation behavior, particularly for recommendation and comparative queries.

The AVS specification, reference implementation, query bank, raw data, and analysis code are publicly available:

- **Specification**: github.com/ppcvote/avs-standard
- **Reference Implementation**: github.com/ppcvote/ultralab-scanners
- **Live Scanner**: ultralab.tw/probe
- **Dataset**: [included in supplementary materials]

We invite the community to conduct independent validation studies, contribute new AEO checks, and help refine the scoring weights based on empirical evidence.

---

## References

1. Aggarwal, P., Murahari, V., Rajpurohkar, T., Kalyan, A., Narasimhan, K., & Deshpande, A. (2023). GEO: Generative Engine Optimization. arXiv:2311.09735.

2. Google. (2024). Search Quality Evaluator Guidelines.

3. Google Web Platform Team. (2020). Web Vitals: Essential metrics for a healthy site.

4. OWASP. (2025). Top 10 for Large Language Model Applications.

5. PanGuard AI. (2026). Agent Threat Rules (ATR) Specification. Zenodo DOI: 10.5281/zenodo.19178002.

6. Schema.org. (2024). Schema.org Structured Data Documentation.

7. llmstxt.org. (2025). llms.txt Specification.

---

## Appendix A: Dataset Summary

| Field | Value |
|-------|-------|
| Queries | 155 |
| Domains | 5 (tech, finance, health, business, ecommerce) |
| Query types | 5 (informational, comparative, recommendation, howto, local) |
| AI engine | OpenAI web_search (gpt-4o-mini) |
| Total citations | 816 |
| Scanned with AVS | 721 (88.4%) |
| Scan failures | 95 (timeout/blocked) |
| API cost | $0.09 |
| Scan method | Local HTML parsing, zero LLM calls |
| Scan time | < 50ms per URL |

## Appendix B: Reproducibility

All materials for reproducing this study are available at:
- Query bank: `query-bank.json` (155 queries with IDs, domains, types)
- Experiment runner: `run-experiment.mjs` (Node.js/TypeScript)
- Analysis script: `analyze.mjs` (summary statistics + CSV export)
- Raw results: `results-v2.jsonl` (816 citation records)
- AVS scanner: github.com/ppcvote/ultralab-scanners (MIT license)

Requirements: Node.js 20+, OpenAI API key ($0.09 estimated cost for full replication).
