/**
 * AVS Validation Experiment Runner
 *
 * Sends queries to OpenAI web_search and collects cited URLs.
 * Then scans each cited URL with UltraProbe AVS to get scores.
 * Output: JSONL file with query → citations → AVS scores.
 *
 * Usage: OPENAI_API_KEY=sk-... node run-experiment.mjs [--limit 10] [--domain tech]
 */

import { readFileSync, appendFileSync, existsSync, writeFileSync } from 'fs'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) {
  console.error('ERROR: Set OPENAI_API_KEY environment variable')
  process.exit(1)
}

const PROBE_API = 'https://ultralab.tw/api/probe-scan'
const OPENAI_API = 'https://api.openai.com/v1/responses'
const OUTPUT_FILE = 'data/results-v2.jsonl'
const PROGRESS_FILE = 'data/progress-v2.json'

// Parse args
const args = process.argv.slice(2)
const limitIdx = args.indexOf('--limit')
const domainIdx = args.indexOf('--domain')
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : Infinity
const DOMAIN_FILTER = domainIdx !== -1 ? args[domainIdx + 1] : null

// Load query bank
const queryBank = JSON.parse(readFileSync('query-bank.json', 'utf8'))

// Load progress (skip already completed queries)
let progress = {}
if (existsSync(PROGRESS_FILE)) {
  progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'))
}

function saveProgress() {
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

// Step 1: Send query to OpenAI web_search, extract citations
async function queryOpenAI(query) {
  const res = await fetch(OPENAI_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      tools: [{ type: 'web_search_preview', search_context_size: 'high' }],
      tool_choice: 'required',
      input: query,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const citations = []

  for (const item of data.output || []) {
    if (item.type === 'message') {
      for (const content of item.content || []) {
        if (content.type === 'output_text') {
          for (const annot of content.annotations || []) {
            if (annot.type === 'url_citation' && annot.url) {
              // Clean UTM params
              const cleanUrl = annot.url.replace(/\?utm_source=openai$/, '')
              citations.push({
                url: cleanUrl,
                title: annot.title || '',
                position: citations.length + 1,
              })
            }
          }
        }
      }
    }
  }

  return {
    citations,
    tokens: data.usage?.total_tokens || 0,
    responseText: extractResponseText(data),
  }
}

function extractResponseText(data) {
  for (const item of data.output || []) {
    if (item.type === 'message') {
      for (const content of item.content || []) {
        if (content.type === 'output_text') {
          return content.text?.substring(0, 500) || ''
        }
      }
    }
  }
  return ''
}

// Step 2: Scan a URL locally (no API, no rate limit, pure HTML parsing)
async function scanAVS(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'UltraProbe/1.0 (AVS Research; +https://ultralab.tw/probe)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return null
    const html = await res.text()
    if (!html || html.length < 100) return null

    // Dynamic import of scanners from the project
    const { runSeoScan } = await import('../../api/_seo-scanner.ts')
    const { runAeoScan } = await import('../../api/_aeo-scanner.ts')

    const seo = runSeoScan(html, url)
    const aeo = runAeoScan(html, url)
    const avsScore = Math.round(seo.score * 0.5 + aeo.score * 0.5)
    const avsGrade = avsScore >= 90 ? 'A' : avsScore >= 75 ? 'B' : avsScore >= 60 ? 'C' : avsScore >= 45 ? 'D' : avsScore >= 30 ? 'E' : 'F'

    return {
      avs: { score: avsScore, grade: avsGrade },
      seo: { score: seo.score, grade: seo.grade },
      aeo: { score: aeo.score, grade: aeo.grade },
    }
  } catch (err) {
    console.log(`    ⚠ AVS scan failed for ${url}: ${err.message}`)
    return null
  }
}

// Main experiment loop
async function run() {
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║  AVS Validation Experiment v1.0              ║')
  console.log('║  Ultra Lab Research · 2026                   ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log()

  // Flatten all queries
  let allQueries = []
  for (const domain of queryBank.domains) {
    if (DOMAIN_FILTER && domain.id !== DOMAIN_FILTER) continue
    for (const q of domain.queries) {
      allQueries.push({ ...q, domain: domain.id, domainName: domain.name })
    }
  }

  // Apply limit
  if (LIMIT < allQueries.length) {
    allQueries = allQueries.slice(0, LIMIT)
  }

  console.log(`Queries: ${allQueries.length}`)
  console.log(`Domain filter: ${DOMAIN_FILTER || 'all'}`)
  console.log(`Output: ${OUTPUT_FILE}`)
  console.log()

  let totalCitations = 0
  let totalScanned = 0
  let totalTokens = 0
  let queryCount = 0

  for (const q of allQueries) {
    // Skip if already done
    if (progress[q.id]) {
      console.log(`⏭ ${q.id} (already done)`)
      continue
    }

    queryCount++
    console.log(`\n[${queryCount}/${allQueries.length}] ${q.domain} / ${q.type}`)
    console.log(`  Q: "${q.query}"`)

    // Step 1: Query OpenAI
    let result
    try {
      result = await queryOpenAI(q.query)
    } catch (err) {
      console.log(`  ✗ OpenAI error: ${err.message}`)
      // Rate limit — wait and retry
      if (err.message.includes('429')) {
        console.log('  ⏳ Rate limited, waiting 60s...')
        await new Promise(r => setTimeout(r, 60000))
        try {
          result = await queryOpenAI(q.query)
        } catch (err2) {
          console.log(`  ✗ Retry failed: ${err2.message}`)
          continue
        }
      } else {
        continue
      }
    }

    totalTokens += result.tokens
    console.log(`  → ${result.citations.length} citations, ${result.tokens} tokens`)

    // Step 2: Scan each cited URL with AVS
    const citationsWithScores = []
    for (const cite of result.citations) {
      // Only scan unique domains (deduplicate)
      const domain = new URL(cite.url).hostname
      console.log(`    [${cite.position}] ${domain}`)

      const avs = await scanAVS(cite.url)
      citationsWithScores.push({
        ...cite,
        domain,
        avs: avs?.avs || null,
        seo: avs?.seo || null,
        aeo: avs?.aeo || null,
      })

      if (avs) {
        totalScanned++
        console.log(`        AVS: ${avs.avs.score}/${avs.avs.grade} (SEO: ${avs.seo.score}, AEO: ${avs.aeo.score})`)
      }

      // Small delay between fetches to be polite
      await new Promise(r => setTimeout(r, 300))
    }

    totalCitations += result.citations.length

    // Write result
    const record = {
      queryId: q.id,
      domain: q.domain,
      queryType: q.type,
      query: q.query,
      timestamp: new Date().toISOString(),
      citationCount: result.citations.length,
      tokens: result.tokens,
      citations: citationsWithScores,
    }

    appendFileSync(OUTPUT_FILE, JSON.stringify(record) + '\n')

    // Mark as done
    progress[q.id] = true
    saveProgress()

    // Rate limit: wait 2s between queries
    await new Promise(r => setTimeout(r, 2000))
  }

  console.log('\n══════════════════════════════════════')
  console.log(`Done!`)
  console.log(`Queries: ${queryCount}`)
  console.log(`Citations collected: ${totalCitations}`)
  console.log(`URLs scanned (AVS): ${totalScanned}`)
  console.log(`Total tokens used: ${totalTokens}`)
  console.log(`Estimated cost: $${(totalTokens * 0.00015 / 1000 * 4).toFixed(2)}`)
  console.log(`Results: ${OUTPUT_FILE}`)
}

run().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
