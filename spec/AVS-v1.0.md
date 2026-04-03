# AI Visibility Score (AVS) — Specification v1.0

**Status**: DRAFT  
**Version**: 1.0.0  
**Date**: 2026-04-04  
**Author**: Min Yi Chen, Ultra Lab  
**License**: CC BY 4.0  

---

## Abstract

The AI Visibility Score (AVS) is an open, deterministic scoring standard that measures how discoverable a website is to both traditional search engines (Google, Bing) and AI-powered search engines (ChatGPT, Perplexity, Gemini, Copilot). It produces a single score (0-100) and letter grade (A-F) by combining two sub-scores: SEO (Search Engine Optimization) and AEO (Answer Engine Optimization).

AVS is designed to be:
- **Deterministic**: Same URL, same score, every time. No LLM calls.
- **Zero-cost**: Pure HTML parsing. No API fees, no cloud services.
- **Fast**: < 50ms per scan on any HTML document.
- **Open**: Scoring algorithm is fully open-source (MIT license).
- **Reproducible**: Any implementation following this spec should produce identical scores.

---

## 1. Motivation

### 1.1 The Problem

In 2026, a significant and growing portion of web traffic originates from AI-powered search interfaces (ChatGPT Browse, Perplexity, Google AI Overviews, Copilot). Traditional SEO metrics do not measure whether a website is optimized for these AI retrieval systems.

Website owners face a new question: **"Can AI find and cite my website?"** No standardized, free, open metric exists to answer this question.

### 1.2 Existing Gaps

| Tool/Standard | Measures SEO | Measures AEO | Open Source | Deterministic | Free |
|--------------|:-----------:|:-----------:|:-----------:|:------------:|:----:|
| Google Lighthouse | ✅ | ❌ | ✅ | ✅ | ✅ |
| Ahrefs | ✅ | ❌ | ❌ | ❌ | ❌ |
| Semrush | ✅ | ❌ | ❌ | ❌ | ❌ |
| Moz | ✅ | ❌ | ❌ | ❌ | ❌ |
| CVSS | ❌ | ❌ | ✅ | ✅ | ✅ |
| **AVS (this spec)** | **✅** | **✅** | **✅** | **✅** | **✅** |

AVS is the first scoring standard to combine SEO and AEO into a single, open metric.

---

## 2. Scoring Formula

### 2.1 Overall Score

```
AVS = round(SEO_score × 0.5 + AEO_score × 0.5)
```

Where:
- `SEO_score` ∈ [0, 100]: Traditional search engine optimization score
- `AEO_score` ∈ [0, 100]: Answer engine (AI search) optimization score
- `AVS` ∈ [0, 100]: Combined AI Visibility Score

### 2.2 Grade Mapping

| Grade | Score Range | Interpretation |
|:-----:|:----------:|----------------|
| A | 90-100 | Excellent. Highly visible to both Google and AI search engines. |
| B | 75-89 | Good. Well-optimized for traditional search; some AEO improvements possible. |
| C | 60-74 | Fair. Basic SEO present; significant AEO gaps. Competitors may be preferred by AI. |
| D | 45-59 | Poor. Notable SEO issues; largely invisible to AI search engines. |
| E | 30-44 | Very Poor. Major gaps in both SEO and AEO. |
| F | 0-29 | Critical. Effectively invisible. Immediate action required. |

### 2.3 Weight Rationale

The 50/50 split between SEO and AEO reflects the current transition period where traditional search and AI search coexist. As AI search adoption grows, future versions of AVS may adjust this weighting (e.g., 40/60 or 30/70).

---

## 3. SEO Sub-Score

### 3.1 Categories (8)

| # | Category | Weight | Checks |
|---|----------|--------|--------|
| 1 | Meta Tags | 15% | Title tag, meta description, canonical URL, favicon, viewport, charset |
| 2 | Headings | 12% | Single H1, heading hierarchy, H2 content structure |
| 3 | Images | 10% | Alt attributes, lazy loading |
| 4 | Links | 10% | Internal links, external link security, javascript: links |
| 5 | Social / Open Graph | 12% | og:title, og:description, og:image, og:url, Twitter Card |
| 6 | Technical | 15% | HTTPS, indexability, sitemap, hreflang, html lang |
| 7 | Structured Data | 15% | JSON-LD presence, Schema.org types, validity |
| 8 | Performance | 11% | Script count, CSS count, inline CSS size |

### 3.2 Check Scoring

Each check has:
- **Status**: `pass` | `fail` | `warn` | `info`
- **Weight**: 1 (low), 2 (medium), or 3 (high importance)

Score calculation:
```
category_score = (passed_weight + warn_weight × 0.5) / total_scorable_weight × 100
```

Where `total_scorable_weight` excludes `info` checks (informational only, not scored).

Overall SEO score = weighted average of category scores.

---

## 4. AEO Sub-Score

### 4.1 Categories (8)

| # | Category | Weight | Checks |
|---|----------|--------|--------|
| 1 | FAQ Schema | 12% | FAQPage schema, HowTo schema, Q&A schema |
| 2 | Answer-Ready Content | 15% | Q&A headings, structured lists, concise paragraphs, definition patterns |
| 3 | Structured Data Richness | 12% | BreadcrumbList, content type schema, Organization, WebPage/WebSite |
| 4 | Content Clarity | 14% | Heading density, comparison tables, content length, direct answer patterns |
| 5 | Citation-Friendliness | 14% | Author information, publication date, copyright, rights meta |
| 6 | AI Crawler Access | 12% | Page indexability, AI bot access (robots.txt), AI content declaration |
| 7 | llms.txt & AI Standards | 10% | llms.txt reference, AI plugin manifest, semantic HTML5 |
| 8 | Entity Clarity (E-E-A-T) | 11% | Key term emphasis, about/author page, expertise signals, entity consistency |

### 4.2 AEO Check Rationale

Each AEO check is designed to improve the likelihood that AI search engines can:
1. **Discover** the content (AI Crawler Access, indexability)
2. **Understand** the content (structured data, semantic HTML, clear headings)
3. **Extract** answers from the content (Q&A patterns, concise paragraphs, lists)
4. **Trust** the content (E-E-A-T signals, author info, publication dates)
5. **Cite** the content (author attribution, clear entity references)

### 4.3 Evidence Base

The AEO scoring methodology draws from:
- **GEO (Generative Engine Optimization)** — Aggarwal et al., Princeton/IIT Delhi, 2023 (arXiv:2311.09735)
- **Google E-E-A-T guidelines** — Search Quality Evaluator Guidelines
- **Perplexity AI citation behavior** — empirical observation of citation patterns
- **llms.txt specification** — llmstxt.org
- **Schema.org structured data guidelines** — schema.org

---

## 5. Measurement Protocol

### 5.1 Input

A single URL pointing to a publicly accessible HTML page over HTTPS.

### 5.2 Process

1. Fetch the URL via HTTP GET with a standard user agent
2. Parse the returned HTML document
3. Execute all SEO checks (§3) against the parsed HTML
4. Execute all AEO checks (§4) against the parsed HTML
5. Compute category scores using the weighted scoring formula (§3.2)
6. Compute SEO and AEO sub-scores as weighted averages of their category scores
7. Compute AVS using the formula in §2.1
8. Map AVS to a letter grade using the table in §2.2

### 5.3 Requirements

- The fetch MUST use a timeout of 10 seconds maximum
- The analysis MUST be deterministic: no randomness, no LLM calls
- The analysis MUST operate only on the fetched HTML; no additional network requests
- The analysis SHOULD complete in under 100ms for typical HTML documents

---

## 6. Reference Implementation

The reference implementation is available at:
- **GitHub**: [github.com/ppcvote/ultralab-scanners](https://github.com/ppcvote/ultralab-scanners)
- **npm**: `@ultralab/scanners` (pending)
- **Live scanner**: [ultralab.tw/probe](https://ultralab.tw/probe)

Language: TypeScript (strict mode)  
License: MIT  
Dependencies: Zero  

---

## 7. Validation Study

### 7.1 Methodology

To validate whether AVS correlates with actual AI search engine citation behavior, we conducted an empirical study:

1. Submitted 250 queries across 5 domains to OpenAI's web_search API
2. Collected all cited URLs from AI-generated responses
3. Scanned each cited URL with the AVS reference implementation
4. Analyzed the correlation between AVS scores and citation frequency/position

### 7.2 Results

[TO BE FILLED AFTER EXPERIMENT COMPLETES]

- Total queries: 250
- Total citations collected: [TBD]
- Citations with AVS scores: [TBD]
- Mean AVS of cited sites: [TBD]
- Grade distribution of cited sites: [TBD]
- Correlation coefficient (AVS vs citation frequency): [TBD]

### 7.3 Limitations

- Only one AI search engine tested (OpenAI web_search). Future work should include Perplexity, Google AI Overviews, and Copilot.
- Temporal stability not measured (results may vary over time).
- Non-English queries (zh-TW) not included in v1.0 study.

---

## 8. Future Work

### 8.1 Planned for v1.1
- Cross-engine validation (Perplexity, Google AI Overview)
- zh-TW query support
- Temporal stability measurement (same queries, 1 week apart)
- Weight adjustment based on empirical correlation data

### 8.2 Planned for v2.0
- AI Visibility Score for specific topics (not just overall site score)
- Real-time monitoring (score changes over time)
- Competitive AVS comparison (your score vs competitors)
- Industry benchmarks (average AVS by industry vertical)

---

## 9. Contributing

AVS is designed to be community-owned. Contributions are welcome:

- **GitHub Issues**: Report bugs or suggest new checks
- **Pull Requests**: Add new AEO checks, improve scoring weights
- **Research**: Conduct independent validation studies
- **Translation**: Translate the spec to other languages

---

## 10. References

1. Aggarwal, P., et al. "GEO: Generative Engine Optimization." arXiv:2311.09735, 2023.
2. Google. "Search Quality Evaluator Guidelines." 2024.
3. llmstxt.org. "llms.txt specification." 2025.
4. Schema.org. "Schema.org structured data." schema.org.
5. OWASP. "Top 10 for Large Language Model Applications." 2025.

---

## License

This specification is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

The reference implementation is licensed under [MIT](https://opensource.org/licenses/MIT).

---

*AI Visibility Score is an open standard by Ultra Lab (ultralab.tw). It is not affiliated with Google, OpenAI, or any other AI company.*
