import re
import math
from typing import List, Tuple, Dict, Set
from ..models.schemas import DocumentChunk, EvidenceItem
from ..config import settings

class PassageRetriever:
    """
    Hybrid lexical and passage retriever with honest coverage calculation
    and strict confidence scoring.
    """
    
    STOPWORDS: Set[str] = {
        "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", 
        "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", 
        "by", "can", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", 
        "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", 
        "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", 
        "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once", 
        "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", 
        "she", "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them", 
        "themselves", "then", "there", "these", "they", "this", "those", "through", "to", "too", 
        "under", "until", "up", "very", "was", "we", "were", "what", "when", "where", "which", 
        "while", "who", "whom", "why", "with", "would", "you", "your", "yours", "yourself", "yourselves"
    }

    def tokenize(self, text: str) -> List[str]:
        tokens = re.findall(r'[a-zA-Z0-9]+', text.lower())
        return [t for t in tokens if len(t) > 1 and t not in self.STOPWORDS]

    def extract_key_concepts(self, text: str) -> List[str]:
        """Extracts significant keywords and bigrams."""
        tokens = self.tokenize(text)
        bigrams = [f"{tokens[i]} {tokens[i+1]}" for i in range(len(tokens) - 1)]
        return tokens + bigrams

    def score_chunk(self, query_tokens: List[str], chunk_text: str) -> float:
        """
        Calculates normalized passage relevance based on term frequency,
        token overlap, and density.
        """
        if not query_tokens or not chunk_text:
            return 0.0

        chunk_tokens = self.tokenize(chunk_text)
        if not chunk_tokens:
            return 0.0

        chunk_set = set(chunk_tokens)
        matched_tokens = [t for t in query_tokens if t in chunk_set]
        if not matched_tokens:
            return 0.0

        # Term coverage ratio
        token_coverage = len(set(matched_tokens)) / len(set(query_tokens))
        
        # Frequency density boost
        tf_sum = sum(chunk_tokens.count(t) for t in set(matched_tokens))
        tf_density = tf_sum / (len(chunk_tokens) + 15)

        # Exact phrase bonus
        phrase_bonus = 0.0
        query_str = " ".join(query_tokens).lower()
        if len(query_tokens) >= 2 and query_str in chunk_text.lower():
            phrase_bonus = 0.25

        score = (token_coverage * 0.65) + (min(tf_density * 4.0, 0.2)) + phrase_bonus
        return min(max(round(score, 3), 0.0), 1.0)

    def extract_concise_excerpt(self, chunk_text: str, query_tokens: List[str]) -> str:
        """Extracts the most relevant 1-2 sentences around matching terms."""
        sentences = re.split(r'(?<=[.!?])\s+', chunk_text)
        best_sentence = ""
        best_hits = -1

        query_set = set(query_tokens)
        for s in sentences:
            s_tokens = set(self.tokenize(s))
            hits = len(query_set.intersection(s_tokens))
            if hits > best_hits:
                best_hits = hits
                best_sentence = s.strip()

        if best_sentence and len(best_sentence) > 30:
            return best_sentence
        # Fallback to first 200 characters cleanly
        return chunk_text[:220].rsplit(' ', 1)[0] + "..." if len(chunk_text) > 220 else chunk_text

    def retrieve_passages(
        self,
        query: str,
        chunks: List[DocumentChunk],
        top_k: int = 4
    ) -> Tuple[List[EvidenceItem], float, bool]:
        """
        Retrieves top relevant chunks and computes actual evidence coverage.
        Returns:
            - List of EvidenceItems
            - Source coverage percentage (0.0 to 100.0)
            - Has sufficient evidence (bool)
        """
        if not chunks or not query.strip():
            return [], 0.0, False

        query_tokens = self.tokenize(query)
        if not query_tokens:
            return [], 0.0, False

        scored_chunks: List[Tuple[float, DocumentChunk]] = []
        for chunk in chunks:
            s = self.score_chunk(query_tokens, chunk.content)
            if s > 0.12:  # baseline filter
                scored_chunks.append((s, chunk))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_matches = scored_chunks[:top_k]

        if not top_matches:
            return [], 0.0, False

        max_score = top_matches[0][0]
        has_sufficient = max_score >= settings.CONFIDENCE_THRESHOLD

        # Calculate genuine source coverage percent
        all_retrieved_tokens = set()
        for _, ch in top_matches:
            all_retrieved_tokens.update(self.tokenize(ch.content))
        
        covered_query_tokens = [t for t in set(query_tokens) if t in all_retrieved_tokens]
        coverage_percent = round((len(covered_query_tokens) / len(set(query_tokens))) * 100.0, 1)

        evidence_items: List[EvidenceItem] = []
        for idx, (score, chunk) in enumerate(top_matches):
            excerpt = self.extract_concise_excerpt(chunk.content, query_tokens)
            evidence_items.append(
                EvidenceItem(
                    id=f"ev-{chunk.id[:8]}-{idx+1}",
                    source_filename=chunk.source_filename,
                    page_number=chunk.page_number,
                    section_title=chunk.section_title,
                    excerpt=excerpt,
                    relevance_score=score,
                    is_direct_quote=True
                )
            )

        return evidence_items, coverage_percent, has_sufficient

retriever = PassageRetriever()
