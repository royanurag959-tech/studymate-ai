import { config } from '../config.js';

const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but',
  'by', 'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself',
  'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just',
  'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once',
  'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same',
  'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them',
  'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which',
  'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
]);

export class PassageRetriever {
  tokenize(text) {
    if (!text) return [];
    const tokens = text.toLowerCase().match(/[a-zA-Z0-9]+/g) || [];
    return tokens.filter((t) => t.length > 1 && !STOPWORDS.has(t));
  }

  scoreChunk(queryTokens, chunkText) {
    if (!queryTokens || queryTokens.length === 0 || !chunkText) return 0.0;

    const chunkTokens = this.tokenize(chunkText);
    if (chunkTokens.length === 0) return 0.0;

    const chunkSet = new Set(chunkTokens);
    const matchedTokens = queryTokens.filter((t) => chunkSet.has(t));
    if (matchedTokens.length === 0) return 0.0;

    const tokenCoverage = new Set(matchedTokens).size / new Set(queryTokens).size;
    const tfSum = matchedTokens.reduce((acc, t) => acc + chunkTokens.filter((ct) => ct === t).length, 0);
    const tfDensity = tfSum / (chunkTokens.length + 15);

    let phraseBonus = 0.0;
    const queryStr = queryTokens.join(' ').toLowerCase();
    if (queryTokens.length >= 2 && chunkText.toLowerCase().includes(queryStr)) {
      phraseBonus = 0.25;
    }

    const score = tokenCoverage * 0.65 + Math.min(tfDensity * 4.0, 0.2) + phraseBonus;
    return Math.min(Math.max(parseFloat(score.toFixed(3)), 0.0), 1.0);
  }

  extractConciseExcerpt(chunkText, queryTokens) {
    const sentences = chunkText.split(/(?<=[.!?])\s+/);
    let bestSentence = '';
    let bestHits = -1;
    const querySet = new Set(queryTokens);

    for (const s of sentences) {
      const sTokens = new Set(this.tokenize(s));
      let hits = 0;
      for (const t of querySet) {
        if (sTokens.has(t)) hits++;
      }
      if (hits > bestHits) {
        bestHits = hits;
        bestSentence = s.trim();
      }
    }

    if (bestSentence && bestSentence.length > 30) {
      return bestSentence;
    }

    return chunkText.length > 220 ? chunkText.slice(0, 220) + '...' : chunkText;
  }

  retrievePassages(query, chunks, topK = 4) {
    if (!chunks || chunks.length === 0 || !query || !query.trim()) {
      return { evidence: [], coveragePercent: 0.0, hasSufficient: false };
    }

    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) {
      return { evidence: [], coveragePercent: 0.0, hasSufficient: false };
    }

    const scoredChunks = [];
    for (const chunk of chunks) {
      const s = this.scoreChunk(queryTokens, chunk.content);
      if (s > 0.12) {
        scoredChunks.push({ score: s, chunk });
      }
    }

    scoredChunks.sort((a, b) => b.score - a.score);
    const topMatches = scoredChunks.slice(0, topK);

    if (topMatches.length === 0) {
      return { evidence: [], coveragePercent: 0.0, hasSufficient: false };
    }

    const maxScore = topMatches[0].score;
    const hasSufficient = maxScore >= config.CONFIDENCE_THRESHOLD;

    const allRetrievedTokens = new Set();
    for (const match of topMatches) {
      for (const t of this.tokenize(match.chunk.content)) {
        allRetrievedTokens.add(t);
      }
    }

    const coveredQueryTokens = [...new Set(queryTokens)].filter((t) => allRetrievedTokens.has(t));
    const coveragePercent = parseFloat(
      ((coveredQueryTokens.length / new Set(queryTokens).size) * 100.0).toFixed(1)
    );

    const evidence = topMatches.map((match, idx) => {
      const excerpt = this.extractConciseExcerpt(match.chunk.content, queryTokens);
      return {
        id: `ev-${match.chunk.id ? match.chunk.id.slice(0, 8) : idx}-${idx + 1}`,
        source_filename: match.chunk.source_filename,
        page_number: match.chunk.page_number,
        section_title: match.chunk.section_title,
        excerpt,
        relevance_score: match.score,
        is_direct_quote: true,
      };
    });

    return { evidence, coveragePercent, hasSufficient };
  }
}

export const retriever = new PassageRetriever();
