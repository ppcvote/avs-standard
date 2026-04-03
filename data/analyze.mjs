/**
 * AVS Experiment Analyzer
 *
 * Reads experiment-results.jsonl and produces:
 * 1. Summary statistics
 * 2. AVS score distribution of cited vs general websites
 * 3. Correlation analysis (AVS score vs citation frequency)
 * 4. Per-domain breakdown
 * 5. Per-query-type breakdown
 * 6. Most cited domains
 * 7. Export for paper (CSV + summary JSON)
 *
 * Usage: node analyze.mjs
 */

import { readFileSync, writeFileSync } from 'fs'

const INPUT = 'data/results-v2.jsonl'
const OUTPUT_SUMMARY = 'data/analysis-summary.json'
const OUTPUT_CSV = 'data/citations-with-avs.csv'

// Read all results
const lines = readFileSync(INPUT, 'utf8').trim().split('\n').filter(Boolean)
const results = lines.map(l => JSON.parse(l))

console.log('╔══════════════════════════════════════════════╗')
console.log('║  AVS Experiment Analysis                     ║')
console.log('╚══════════════════════════════════════════════╝\n')

// ── 1. Basic Stats ──
const totalQueries = results.length
const totalCitations = results.reduce((s, r) => s + r.citationCount, 0)
const totalTokens = results.reduce((s, r) => s + r.tokens, 0)

// Flatten all citations with AVS scores
const allCitations = []
const domainCounts = {}
const domainAvs = {}

for (const r of results) {
  for (const cite of r.citations) {
    allCitations.push({
      queryId: r.queryId,
      domain: r.domain,
      queryType: r.queryType,
      query: r.query,
      citedUrl: cite.url,
      citedDomain: cite.domain,
      position: cite.position,
      avsScore: cite.avs?.score ?? null,
      avsGrade: cite.avs?.grade ?? null,
      seoScore: cite.seo?.score ?? null,
      aeoScore: cite.aeo?.score ?? null,
    })

    // Domain frequency
    const d = cite.domain
    domainCounts[d] = (domainCounts[d] || 0) + 1
    if (cite.avs?.score != null) {
      if (!domainAvs[d]) domainAvs[d] = []
      domainAvs[d].push(cite.avs.score)
    }
  }
}

const citationsWithAvs = allCitations.filter(c => c.avsScore !== null)
const citationsWithoutAvs = allCitations.filter(c => c.avsScore === null)

console.log('── 1. BASIC STATS ──')
console.log(`Total queries:          ${totalQueries}`)
console.log(`Total citations:        ${totalCitations}`)
console.log(`Citations with AVS:     ${citationsWithAvs.length}`)
console.log(`Citations without AVS:  ${citationsWithoutAvs.length} (scan failed/timeout)`)
console.log(`Total tokens:           ${totalTokens}`)
console.log(`Estimated cost:         $${(totalTokens * 0.6 / 1000000).toFixed(2)}`)
console.log()

// ── 2. AVS Score Distribution of Cited Sites ──
const avsScores = citationsWithAvs.map(c => c.avsScore)
const seoScores = citationsWithAvs.map(c => c.seoScore).filter(s => s != null)
const aeoScores = citationsWithAvs.map(c => c.aeoScore).filter(s => s != null)

function stats(arr) {
  if (arr.length === 0) return { n: 0, mean: 0, median: 0, min: 0, max: 0, stddev: 0 }
  const sorted = [...arr].sort((a, b) => a - b)
  const n = arr.length
  const mean = arr.reduce((s, v) => s + v, 0) / n
  const median = n % 2 === 0 ? (sorted[n/2-1] + sorted[n/2]) / 2 : sorted[Math.floor(n/2)]
  const min = sorted[0]
  const max = sorted[n-1]
  const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / n
  const stddev = Math.sqrt(variance)
  return { n, mean: +mean.toFixed(1), median, min, max, stddev: +stddev.toFixed(1) }
}

function gradeDistribution(scores) {
  const grades = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 }
  for (const s of scores) {
    if (s >= 90) grades.A++
    else if (s >= 75) grades.B++
    else if (s >= 60) grades.C++
    else if (s >= 45) grades.D++
    else if (s >= 30) grades.E++
    else grades.F++
  }
  return grades
}

console.log('── 2. AVS SCORE DISTRIBUTION (Cited Sites) ──')
const avsStats = stats(avsScores)
const seoStats = stats(seoScores)
const aeoStats = stats(aeoScores)
console.log(`AVS: mean=${avsStats.mean}, median=${avsStats.median}, min=${avsStats.min}, max=${avsStats.max}, stddev=${avsStats.stddev}, n=${avsStats.n}`)
console.log(`SEO: mean=${seoStats.mean}, median=${seoStats.median}, min=${seoStats.min}, max=${seoStats.max}, stddev=${seoStats.stddev}, n=${seoStats.n}`)
console.log(`AEO: mean=${aeoStats.mean}, median=${aeoStats.median}, min=${aeoStats.min}, max=${aeoStats.max}, stddev=${aeoStats.stddev}, n=${aeoStats.n}`)
console.log()

const avsGrades = gradeDistribution(avsScores)
console.log('Grade distribution (AVS):')
for (const [grade, count] of Object.entries(avsGrades)) {
  const pct = avsScores.length > 0 ? (count / avsScores.length * 100).toFixed(1) : 0
  const bar = '█'.repeat(Math.round(count / Math.max(...Object.values(avsGrades)) * 20)) || ''
  console.log(`  ${grade}: ${bar} ${count} (${pct}%)`)
}
console.log()

// ── 3. Correlation: Citation Position vs AVS Score ──
console.log('── 3. CITATION POSITION vs AVS SCORE ──')
const positionBuckets = {}
for (const c of citationsWithAvs) {
  const pos = Math.min(c.position, 10) // cap at 10
  if (!positionBuckets[pos]) positionBuckets[pos] = []
  positionBuckets[pos].push(c.avsScore)
}
for (const [pos, scores] of Object.entries(positionBuckets).sort((a, b) => +a[0] - +b[0])) {
  const s = stats(scores)
  console.log(`  Position ${pos}: avg AVS = ${s.mean}, n = ${s.n}`)
}
console.log()

// ── 4. Per-Domain (query domain) Breakdown ──
console.log('── 4. PER-QUERY-DOMAIN BREAKDOWN ──')
const domainBreakdown = {}
for (const r of results) {
  if (!domainBreakdown[r.domain]) domainBreakdown[r.domain] = { queries: 0, citations: 0, avsScores: [] }
  domainBreakdown[r.domain].queries++
  domainBreakdown[r.domain].citations += r.citationCount
  for (const cite of r.citations) {
    if (cite.avs?.score != null) domainBreakdown[r.domain].avsScores.push(cite.avs.score)
  }
}
for (const [domain, data] of Object.entries(domainBreakdown)) {
  const s = stats(data.avsScores)
  console.log(`  ${domain}: ${data.queries} queries, ${data.citations} citations, avg AVS = ${s.mean} (n=${s.n})`)
}
console.log()

// ── 5. Per-Query-Type Breakdown ──
console.log('── 5. PER-QUERY-TYPE BREAKDOWN ──')
const typeBreakdown = {}
for (const r of results) {
  if (!typeBreakdown[r.queryType]) typeBreakdown[r.queryType] = { queries: 0, citations: 0, avsScores: [] }
  typeBreakdown[r.queryType].queries++
  typeBreakdown[r.queryType].citations += r.citationCount
  for (const cite of r.citations) {
    if (cite.avs?.score != null) typeBreakdown[r.queryType].avsScores.push(cite.avs.score)
  }
}
for (const [type, data] of Object.entries(typeBreakdown)) {
  const s = stats(data.avsScores)
  console.log(`  ${type}: ${data.queries} queries, ${data.citations} citations, avg AVS = ${s.mean} (n=${s.n})`)
}
console.log()

// ── 6. Most Cited Domains ──
console.log('── 6. TOP 20 MOST CITED DOMAINS ──')
const sortedDomains = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]).slice(0, 20)
for (const [domain, count] of sortedDomains) {
  const avgAvs = domainAvs[domain] ? stats(domainAvs[domain]).mean : 'N/A'
  console.log(`  ${count}x  ${domain}  (avg AVS: ${avgAvs})`)
}
console.log()

// ── 7. Key Finding: Do higher-AVS sites get cited more? ──
console.log('── 7. KEY FINDING ──')
if (avsScores.length >= 5) {
  // Split into high AVS (>= 75) and low AVS (< 75)
  const highAvs = citationsWithAvs.filter(c => c.avsScore >= 75)
  const lowAvs = citationsWithAvs.filter(c => c.avsScore < 75)
  console.log(`Sites with AVS >= 75 (B or better): ${highAvs.length} citations`)
  console.log(`Sites with AVS <  75 (C or worse):  ${lowAvs.length} citations`)
  if (highAvs.length + lowAvs.length > 0) {
    const highPct = (highAvs.length / (highAvs.length + lowAvs.length) * 100).toFixed(1)
    console.log(`→ ${highPct}% of cited sites (with AVS data) scored B or better`)
  }

  // Average citation position by AVS tier
  const highPos = stats(highAvs.map(c => c.position))
  const lowPos = stats(lowAvs.map(c => c.position))
  console.log(`\nAvg citation position:`)
  console.log(`  High AVS (>=75): position ${highPos.mean} (n=${highPos.n})`)
  console.log(`  Low AVS  (<75):  position ${lowPos.mean} (n=${lowPos.n})`)
} else {
  console.log('Not enough data for key finding analysis (need >= 5 AVS scores)')
}
console.log()

// ── Export CSV ──
const csvHeader = 'queryId,queryDomain,queryType,query,citedUrl,citedDomain,position,avsScore,avsGrade,seoScore,aeoScore'
const csvRows = allCitations.map(c =>
  `"${c.queryId}","${c.domain}","${c.queryType}","${c.query.replace(/"/g, '""')}","${c.citedUrl}","${c.citedDomain}",${c.position},${c.avsScore ?? ''},${c.avsGrade ?? ''},"${c.seoScore ?? ''}","${c.aeoScore ?? ''}"`
)
writeFileSync(OUTPUT_CSV, csvHeader + '\n' + csvRows.join('\n'))
console.log(`CSV exported: ${OUTPUT_CSV} (${allCitations.length} rows)`)

// ── Export Summary JSON ──
const summary = {
  experiment: {
    version: '1.0',
    date: new Date().toISOString().split('T')[0],
    totalQueries,
    totalCitations,
    citationsWithAvs: citationsWithAvs.length,
    totalTokens,
    estimatedCost: +(totalTokens * 0.6 / 1000000).toFixed(2),
  },
  avsDistribution: {
    stats: avsStats,
    grades: avsGrades,
  },
  seoDistribution: { stats: seoStats },
  aeoDistribution: { stats: aeoStats },
  byQueryDomain: domainBreakdown,
  byQueryType: typeBreakdown,
  topCitedDomains: sortedDomains.slice(0, 20).map(([d, c]) => ({ domain: d, citations: c, avgAvs: domainAvs[d] ? stats(domainAvs[d]).mean : null })),
}
writeFileSync(OUTPUT_SUMMARY, JSON.stringify(summary, null, 2))
console.log(`Summary exported: ${OUTPUT_SUMMARY}`)

console.log('\n════════════════════════════════════════')
console.log('Analysis complete. Use data for AVS Spec v1.0 paper.')
