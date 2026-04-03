# AI Visibility Score (AVS)

> **The first open standard for measuring website discoverability by AI search engines.**

[![Spec](https://img.shields.io/badge/spec-v1.0-blue)](spec/AVS-v1.0.md)
[![License: CC BY 4.0](https://img.shields.io/badge/license-CC%20BY%204.0-green)](https://creativecommons.org/licenses/by/4.0/)
[![Reference Implementation](https://img.shields.io/badge/implementation-ultralab--scanners-purple)](https://github.com/ppcvote/ultralab-scanners)

---

## What is AVS?

**AI Visibility Score (AVS)** measures how discoverable your website is to both traditional search engines (Google, Bing) and AI-powered search engines (ChatGPT, Perplexity, Gemini, Copilot).

```
AVS = SEO Score × 0.5 + AEO Score × 0.5
```

One number. 0-100. Grade A-F. Tells you: **"Can AI find you?"**

## Why it matters

In 2026, a growing share of web traffic comes from AI search interfaces. Users ask ChatGPT "recommend a good restaurant" instead of Googling. If your website isn't optimized for AI retrieval, you're invisible to this new channel.

**No standardized, free, open metric existed to measure this. Until now.**

## How it works

| Component | What it measures | Checks | Cost |
|-----------|-----------------|--------|------|
| **SEO Score** | Traditional search engine optimization | 30+ checks, 8 categories | $0 |
| **AEO Score** | AI search engine optimization | 32+ checks, 8 categories | $0 |
| **AVS** | Combined AI Visibility | SEO + AEO weighted average | $0 |

The entire analysis is **deterministic** (pure HTML parsing, no LLM calls), completes in **< 50ms**, and costs **$0**.

## Quick Start

### Scan any website (free)

**Web UI**: [ultralab.tw/probe](https://ultralab.tw/probe)

### Use the reference implementation

```bash
npm install @ultralab/scanners
```

```typescript
import { runSeoScan, runAeoScan } from '@ultralab/scanners'

const html = await fetch('https://example.com').then(r => r.text())
const seo = runSeoScan(html, 'https://example.com')
const aeo = runAeoScan(html, 'https://example.com')
const avs = Math.round(seo.score * 0.5 + aeo.score * 0.5)

console.log(`AVS: ${avs}/100`) // AVS: 47/100
```

## Grade Scale

| Grade | Score | Meaning |
|:-----:|:-----:|---------|
| A | 90-100 | Highly visible to Google AND AI |
| B | 75-89 | Good SEO, some AEO gaps |
| C | 60-74 | Fair. Competitors may be preferred by AI |
| D | 45-59 | Poor. Largely invisible to AI search |
| F | 0-29 | Invisible. Immediate action required |

## Specification

Full specification: **[AVS v1.0](spec/AVS-v1.0.md)**

Covers:
- Scoring formula and grade mapping
- SEO sub-score: 8 categories, 30+ checks
- AEO sub-score: 8 categories, 32+ checks
- Measurement protocol
- Validation study methodology

## Validation

We are conducting an empirical validation study:
- 250 queries submitted to AI search engines (OpenAI web_search)
- Cited URLs scanned with AVS reference implementation
- Correlation analysis between AVS scores and AI citation behavior

**Preliminary finding**: Websites cited by AI search engines consistently score B or higher on AVS.

Results will be published as an arXiv preprint.

## Comparison with Existing Standards

| Standard | What it measures | Scope | Open | Free |
|----------|-----------------|-------|:----:|:----:|
| Lighthouse | Web performance + SEO basics | Google-centric | ✅ | ✅ |
| Core Web Vitals | Page experience metrics | Google-centric | ✅ | ✅ |
| CVSS | Vulnerability severity | Security | ✅ | ✅ |
| OWASP Top 10 | Security risk categories | Security | ✅ | ✅ |
| ATR (PanGuard) | AI agent threat rules | Agent security | ✅ | ✅ |
| **AVS** | **AI search visibility** | **SEO + AI search** | **✅** | **✅** |

AVS fills the gap between traditional SEO metrics and the emerging AI search landscape.

## Contributing

AVS is designed to be community-owned. We welcome:

- **New AEO checks**: Propose checks that improve AI citation prediction
- **Validation studies**: Run independent studies with different AI engines
- **Language support**: Test AVS with non-English queries
- **Weight calibration**: Help us optimize the scoring weights with data

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Links

- **Specification**: [AVS v1.0](spec/AVS-v1.0.md)
- **Reference Implementation**: [ultralab-scanners](https://github.com/ppcvote/ultralab-scanners)
- **Live Scanner**: [ultralab.tw/probe](https://ultralab.tw/probe)
- **Blog**: [ultralab.tw/blog](https://ultralab.tw/blog)
- **Discord**: [discord.gg/ultralab](https://discord.gg/ultralab)

## License

- Specification: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- Reference Implementation: [MIT](https://opensource.org/licenses/MIT)

---

*AVS is an open standard initiated by [Ultra Lab](https://ultralab.tw). It is not affiliated with Google, OpenAI, Anthropic, or any other AI company.*
