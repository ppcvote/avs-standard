# AI Application Security Standard v1.0

**Status**: DRAFT  
**Version**: 1.0.0  
**Date**: 2026-04-05  
**Author**: MinYi Xie, Ultra Lab  
**License**: CC BY 4.0  

---

## Abstract

The AI Application Security Standard (AASS) is an open framework for evaluating the security, visibility, and data protection posture of AI-integrated applications and websites. It combines seven assessment dimensions into a unified scoring system, providing organizations with a single, actionable measure of their AI readiness.

Unlike existing frameworks that focus on a single dimension (OWASP on threats, Lighthouse on performance, CVSS on vulnerabilities), AASS evaluates the complete AI surface: defense, visibility, accessibility, data protection, and real-world AI engagement.

All assessment tools are open source (MIT license), deterministic (no LLM inference required), and free.

---

## 1. Scope

This standard applies to:
- Websites and web applications using or referenced by AI systems
- AI-integrated applications with system prompts, chatbots, or agent capabilities
- Organizations that want to assess their AI security and visibility posture

This standard does NOT cover:
- AI model security (weight poisoning, adversarial examples)
- AI training data integrity
- Hardware-level AI security

---

## 2. Assessment Dimensions

### 2.1 AI Visibility Score (AVS)

**Purpose**: Measures how discoverable a website is to AI-powered search engines.

**Formula**: `AVS = SEO × 0.35 + AEO × 0.35 + AAO × 0.30`

| Sub-dimension | Checks | What it measures |
|--------------|--------|-----------------|
| SEO | 30+ | Traditional search engine optimization |
| AEO | 32+ | Answer Engine Optimization (ChatGPT, Perplexity, Gemini readiness) |
| AAO | 30 | Agent Accessibility (can AI agents use your website?) |

**Grade Scale**: A (90+), B (75-89), C (60-74), D (45-59), E (30-44), F (0-29)

**Validation**: Empirically validated with 155 queries × 816 AI citations × 721 scanned URLs. Websites scoring B+ are cited 3x more frequently by AI search engines.

**Paper**: [DOI: 10.5281/zenodo.19410475](https://doi.org/10.5281/zenodo.19410475)

### 2.2 Prompt Defense Score (PDS)

**Purpose**: Assesses whether an AI system's prompts are hardened against known attack vectors.

**Method**: Deterministic regex analysis of system prompts for presence/absence of defensive measures.

| # | Attack Vector | Industry Defense Rate |
|---|-------------|:-------------------:|
| 1 | Role Boundary | 78% |
| 2 | Instruction Override | 72% |
| 3 | Data Leakage | 41% |
| 4 | Output Control | 34% |
| 5 | Multi-language Bypass | 28% |
| 6 | Social Engineering | 18% |
| 7 | Unicode Exploitation | 6% |
| 8 | Context Overflow | 22% |
| 9 | Indirect Injection | 4% |
| 10 | Harmful Content | 31% |
| 11 | Abuse Prevention | 24% |
| 12 | Input Validation | 19% |

**Score**: `PDS = (defended_vectors / 12) × 100`

**Characteristics**: < 5ms execution, zero LLM cost, 100% reproducible.

### 2.3 AI Data Protection Score (ADP)

**Purpose**: Evaluates whether text contains Personally Identifiable Information (PII) that should not be shared with AI systems.

**Detection Categories**:

| Category | Types Detected | Severity |
|----------|---------------|----------|
| Identity | National ID (TW), SSN (US), Passport | Critical |
| Contact | Email, Phone (TW/International) | High |
| Financial | Credit Card, Bank Account | Critical |
| Credentials | API Keys, JWT, Passwords, Private Keys, DB Connection Strings | Critical |
| Digital | Internal IP addresses | Medium |

**Score**: `ADP = 100 - (critical × 30 + high × 15 + count × 5)`

**Characteristics**: < 1ms execution, supports TW/US/International formats, deterministic.

### 2.4 AI Bot Accessibility

**Purpose**: Tracks whether AI crawlers can and do visit your website.

**Checks**:
- robots.txt allows AI bots (GPTBot, ClaudeBot, PerplexityBot, etc.)
- llms.txt file exists and is linked
- AI crawlers have actually visited (verified via Edge Middleware tracking)
- Pages are indexable by search engines

### 2.5 AI Citation Verification

**Purpose**: Determines whether AI search engines actually cite your website when relevant queries are made.

**Method**: Sends brand-relevant queries to AI search APIs and checks if the target domain appears in citations.

**Output**: Binary (cited/not cited) + citation count + specific queries tested.

---

## 3. Unified Score

### AI Trust Score (ATS)

```
ATS = AVS × 0.30 + PDS × 0.35 + ADP × 0.35
```

| Component | Weight | What it tells you |
|-----------|--------|-------------------|
| AVS | 30% | Can AI find and use your website? |
| PDS | 35% | Is your AI system defended against attacks? |
| ADP | 35% | Are you protecting sensitive data from AI? |

**Grade Scale**: Same A-F scale as AVS.

---

## 4. Reference Implementations

All tools are open source under MIT license:

| Tool | Repository | npm |
|------|-----------|-----|
| SEO + AEO Scanner | [ultralab-scanners](https://github.com/ppcvote/ultralab-scanners) | `@ultralab/scanners` |
| Prompt Defense Scanner | [prompt-defense-audit](https://github.com/ppcvote/prompt-defense-audit) | `prompt-defense-audit` |
| PII Guard | [ultraprobe](https://github.com/ppcvote/ultralab) | — |
| AVS Standard | [avs-standard](https://github.com/ppcvote/avs-standard) | — |

**Live Scanner**: [ultralab.tw/probe](https://ultralab.tw/probe) — free, no signup, 5 seconds.

---

## 5. Compliance Mapping

| AASS Dimension | OWASP LLM Top 10 | NIST AI RMF | EU AI Act | Taiwan AI Basic Law |
|---------------|:-----------------:|:-----------:|:---------:|:------------------:|
| Prompt Defense (PDS) | LLM01, LLM02 | GOVERN, MAP | Art. 9 | §5 安全性 |
| Data Protection (ADP) | LLM06 | MEASURE | Art. 10 | §7 個資保護 |
| Visibility (AVS) | — | — | — | — |
| Bot Accessibility | LLM06 | MAP | — | — |
| Citation Verification | — | — | — | — |

---

## 6. Industry Benchmarks

### Global (based on 1000+ scans)

| Metric | Average | Median |
|--------|---------|--------|
| AVS | 60/C | 62 |
| SEO | 72/C | 76 |
| AEO | 47/D | 51 |
| AAO | 65/C | 68 |

### Taiwan Enterprises (25 major brands)

| Metric | Average | Best | Worst |
|--------|---------|------|-------|
| AVS | 54/D | 69 (E.SUN Bank) | 26 (United Daily News) |
| SEO | 67/C | 85 (Appier) | 30 (United Daily News) |
| AEO | 40/E | 56 (E.SUN, Liberty Times) | 21 (Multiple) |

**Key finding**: 0 out of 25 Taiwan enterprises scored A or B on AVS.

---

## 7. Methodology

### Assessment Protocol

1. **Input**: URL or system prompt text
2. **Process**: Deterministic analysis (regex + HTML parsing)
3. **Output**: Scores (0-100), grades (A-F), specific findings, recommendations
4. **Time**: < 50ms per assessment
5. **Cost**: $0 (no API calls required)
6. **Reproducibility**: Same input → same output, every time

### Scoring Formula

For each dimension, individual checks have:
- **Status**: pass / fail / warn / info
- **Weight**: 1-3 (importance multiplier)

```
dimension_score = (passed_weight + warn_weight × 0.5) / total_scorable_weight × 100
```

---

## 8. Contributing

This is an open standard. Contributions welcome:

- **New checks**: Propose new detection rules for any dimension
- **Validation studies**: Run independent studies with different AI engines
- **Compliance mapping**: Help map to additional regulatory frameworks
- **Language support**: Add PII detection for more locales
- **Industry benchmarks**: Submit scan data for industry-specific reports

---

## 9. References

1. Xie, M. (2026). AI Visibility Score: Measuring Website Discoverability Across AI-Powered Search Engines. Zenodo. DOI: 10.5281/zenodo.19410475
2. OWASP. (2025). Top 10 for Large Language Model Applications.
3. NIST. (2024). AI Risk Management Framework (AI RMF 1.0).
4. European Union. (2024). AI Act — Regulation (EU) 2024/1689.
5. 台灣立法院. (2025). 人工智慧基本法.

---

## License

- Standard document: CC BY 4.0
- Reference implementations: MIT

---

*AI Application Security Standard is an open standard by [Ultra Lab](https://ultralab.tw). It is not affiliated with OWASP, NIST, or any government organization.*
