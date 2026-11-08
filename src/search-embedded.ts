/**
 * src/search-embedded.ts — TF-IDF vector search (zero external dependencies).
 * Builds a simple inverted index over skills and computes TF-IDF scores.
 */
import { SkillIndexEntry, EmbeddedSearchResult } from "./types.js";

// Stop words to ignore
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "can", "shall", "must", "not", "no", "of",
  "that", "this", "these", "those", "it", "its", "i", "me", "my", "we",
  "our", "you", "your", "he", "his", "she", "her", "they", "them", "their",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

interface InvertedIndexEntry {
  docIds: number[];
  termFreqs: number[];
}

interface DocInfo {
  text: string;
  name: string;
  category: string;
}

export function buildTfidfIndex(skills: SkillIndexEntry[]): {
  docInfos: DocInfo[];
  invertedIndex: Record<string, InvertedIndexEntry>;
  docLengths: number[];
  docTotalTerms: number[];
} {
  const docInfos: DocInfo[] = [];
  const docTotalTerms: number[] = [];

  for (const skill of skills) {
    const text = `${skill.name} ${skill.description} ${skill.when_to_use} ${skill.tags.join(" ")}`;
    docInfos.push({ text, name: skill.name, category: skill.category });
    const tokens = tokenize(text);
    docTotalTerms.push(tokens.length);
  }

  // Build inverted index
  const invertedIndex: Record<string, InvertedIndexEntry> = {};
  for (let i = 0; i < docInfos.length; i++) {
    const tokens = tokenize(docInfos[i].text);
    const freq: Record<string, number> = {};
    for (const t of tokens) {
      freq[t] = (freq[t] || 0) + 1;
    }
    for (const [term, tf] of Object.entries(freq)) {
      if (!invertedIndex[term]) {
        invertedIndex[term] = { docIds: [], termFreqs: [] };
      }
      invertedIndex[term].docIds.push(i);
      invertedIndex[term].termFreqs.push(tf);
    }
  }

  return { docInfos, invertedIndex, docLengths: docTotalTerms, docTotalTerms };
}

export function searchTfidf(
  query: string,
  skills: SkillIndexEntry[],
  limit = 10
): EmbeddedSearchResult[] {
  const { docInfos, invertedIndex, docLengths } = buildTfidfIndex(skills);
  const queryTokens = tokenize(query);
  const nDocs = docInfos.length;

  // IDF for each term
  const idf: Record<string, number> = {};
  for (const [term, idxEntry] of Object.entries(invertedIndex)) {
    idf[term] = Math.log((nDocs + 1) / (idxEntry.docIds.length + 1)) + 1;
  }

  // Compute scores
  const scores: { docId: number; score: number; tfidf: Record<string, number> }[] = [];

  for (let i = 0; i < nDocs; i++) {
    let score = 0;
    const tfidf: Record<string, number> = {};
    const docTokens = tokenize(docInfos[i].text);
    const tf: Record<string, number> = {};
    for (const t of docTokens) {
      tf[t] = (tf[t] || 0) + 1;
    }

    for (const qt of queryTokens) {
      const idxEntry = invertedIndex[qt];
      if (idxEntry) {
        const pos = idxEntry.docIds.indexOf(i);
        if (pos >= 0) {
          const tfVal = idxEntry.termFreqs[pos];
          const idfVal = idf[qt];
          const tfidfScore = (tfVal / docLengths[i]) * idfVal;
          score += tfidfScore;
          tfidf[qt] = +tfidfScore.toFixed(4);
        }
      }
    }

    if (score > 0) {
      scores.push({ docId: i, score, tfidf });
    }
  }

  // Sort and limit
  scores.sort((a, b) => b.score - a.score);
  const top = scores.slice(0, limit);

  return top.map(({ docId, score, tfidf }) => ({
    name: docInfos[docId].name,
    category: docInfos[docId].category as any,
    desc: docInfos[docId].text.slice(0, 120),
    score,
    tfidf,
  }));
}
