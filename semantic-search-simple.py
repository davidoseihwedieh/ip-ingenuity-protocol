import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
from typing import List, Dict, Optional
from dataclasses import dataclass
import json
import re

@dataclass
class SearchResult:
    asset_id: str
    similarity_score: float
    asset_type: str
    metadata: Dict

class NLPProcessor:
    def __init__(self):
        self.technical_terms = {
            'system', 'method', 'apparatus', 'device', 'process', 'algorithm',
            'network', 'protocol', 'interface', 'module', 'component', 'framework'
        }
    
    def extract_technical_concepts(self, text: str) -> List[str]:
        words = re.findall(r'\b\w+\b', text.lower())
        technical_concepts = [word for word in words if word in self.technical_terms]
        return list(set(technical_concepts))
    
    def preprocess_text(self, text: str) -> str:
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip().lower()

class VectorDatabase:
    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self.index = faiss.IndexFlatIP(dimension)
        self.metadata_store = {}
        self.id_counter = 0
    
    def add_embeddings(self, embeddings: np.ndarray, metadata: List[Dict]):
        faiss.normalize_L2(embeddings)
        
        start_id = self.id_counter
        self.index.add(embeddings)
        
        for i, meta in enumerate(metadata):
            self.metadata_store[start_id + i] = meta
        
        self.id_counter += len(embeddings)
    
    def similarity_search(self, query_embedding: np.ndarray, k: int = 10) -> List[SearchResult]:
        query_embedding = query_embedding.reshape(1, -1)
        faiss.normalize_L2(query_embedding)
        
        scores, indices = self.index.search(query_embedding, k)
        
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx in self.metadata_store:
                metadata = self.metadata_store[idx]
                results.append(SearchResult(
                    asset_id=metadata.get('id', str(idx)),
                    similarity_score=float(score),
                    asset_type=metadata.get('type', 'unknown'),
                    metadata=metadata
                ))
        
        return results

class SemanticSearchEngine:
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        self.nlp_processor = NLPProcessor()
        self.embedding_model = SentenceTransformer(model_name)
        self.vector_database = VectorDatabase(dimension=384)
    
    def add_ip_asset(self, asset_data: Dict):
        text_content = f"{asset_data.get('title', '')} {asset_data.get('description', '')} {asset_data.get('claims', '')}"
        processed_text = self.nlp_processor.preprocess_text(text_content)
        
        text_embedding = self.embedding_model.encode([processed_text])
        
        metadata = {
            'id': asset_data.get('id'),
            'type': asset_data.get('type', 'patent'),
            'title': asset_data.get('title'),
            'creator': asset_data.get('creator'),
            'creation_date': asset_data.get('creation_date'),
            'technical_concepts': self.nlp_processor.extract_technical_concepts(text_content)
        }
        
        self.vector_database.add_embeddings(text_embedding, [metadata])
    
    def search_similar_ip(self, query_text: str, k: int = 10) -> List[SearchResult]:
        processed_query = self.nlp_processor.preprocess_text(query_text)
        text_embeddings = self.embedding_model.encode([processed_query])
        return self.vector_database.similarity_search(text_embeddings[0], k=k)
    
    def get_trending_technologies(self) -> Dict[str, int]:
        concept_counts = {}
        
        for metadata in self.vector_database.metadata_store.values():
            concepts = metadata.get('technical_concepts', [])
            for concept in concepts:
                concept_counts[concept] = concept_counts.get(concept, 0) + 1
        
        return dict(sorted(concept_counts.items(), key=lambda x: x[1], reverse=True)[:20])

if __name__ == "__main__":
    search_engine = SemanticSearchEngine()
    
    sample_assets = [
        {
            'id': 'patent_001',
            'type': 'patent',
            'title': 'AI-Powered Valuation System',
            'description': 'A system for automated intellectual property valuation using machine learning',
            'claims': 'A computer-implemented method for IP valuation',
            'creator': 'John Doe',
            'creation_date': '2024-01-01'
        },
        {
            'id': 'patent_002',
            'type': 'patent',
            'title': 'Blockchain Token Standard',
            'description': 'Novel token standard for intellectual property assets',
            'claims': 'A blockchain-based system for IP tokenization',
            'creator': 'Jane Smith',
            'creation_date': '2024-02-01'
        }
    ]
    
    for asset in sample_assets:
        search_engine.add_ip_asset(asset)
    
    results = search_engine.search_similar_ip("AI valuation blockchain system")
    
    print("Search Results:")
    for result in results:
        print(f"Asset ID: {result.asset_id}")
        print(f"Similarity: {result.similarity_score:.3f}")
        print(f"Title: {result.metadata.get('title', 'N/A')}")
        print("---")
    
    trending = search_engine.get_trending_technologies()
    print(f"\nTrending Technologies: {trending}")