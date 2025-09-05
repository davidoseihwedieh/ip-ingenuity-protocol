import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
from typing import List, Dict, Optional, Tuple
import cv2
import torch
from dataclasses import dataclass
import json
import re

@dataclass
class SearchResult:
    asset_id: str
    similarity_score: float
    asset_type: str
    metadata: Dict

@dataclass
class VisualAnalysisResult:
    features: np.ndarray
    patterns: List[Dict]
    similar_assets: List[SearchResult]

class NLPProcessor:
    def __init__(self):
        self.technical_terms = {
            'system', 'method', 'apparatus', 'device', 'process', 'algorithm',
            'network', 'protocol', 'interface', 'module', 'component', 'framework'
        }
    
    def extract_technical_concepts(self, text: str) -> List[str]:
        # Extract technical concepts from patent text
        words = re.findall(r'\b\w+\b', text.lower())
        technical_concepts = [word for word in words if word in self.technical_terms]
        return list(set(technical_concepts))
    
    def preprocess_text(self, text: str) -> str:
        # Clean and normalize text for embedding
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip().lower()

class VectorDatabase:
    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self.index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
        self.metadata_store = {}
        self.id_counter = 0
    
    def add_embeddings(self, embeddings: np.ndarray, metadata: List[Dict]):
        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(embeddings)
        
        start_id = self.id_counter
        self.index.add(embeddings)
        
        for i, meta in enumerate(metadata):
            self.metadata_store[start_id + i] = meta
        
        self.id_counter += len(embeddings)
    
    def similarity_search(self, query_embedding: np.ndarray, k: int = 10) -> List[SearchResult]:
        # Normalize query embedding
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

class FeatureExtractor:
    def __init__(self):
        # Simplified feature extraction for technical drawings
        self.edge_detector = cv2.Canny
        self.contour_detector = cv2.findContours
    
    def extract(self, image_data: np.ndarray) -> np.ndarray:
        # Convert to grayscale if needed
        if len(image_data.shape) == 3:
            gray = cv2.cvtColor(image_data, cv2.COLOR_BGR2GRAY)
        else:
            gray = image_data
        
        # Extract edge features
        edges = self.edge_detector(gray, 50, 150)
        
        # Extract contour features
        contours, _ = self.contour_detector(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Create feature vector from contours
        features = []
        for contour in contours[:10]:  # Limit to top 10 contours
            area = cv2.contourArea(contour)
            perimeter = cv2.arcLength(contour, True)
            if perimeter > 0:
                circularity = 4 * np.pi * area / (perimeter * perimeter)
                features.extend([area, perimeter, circularity])
        
        # Pad or truncate to fixed size
        target_size = 30  # 10 contours * 3 features
        if len(features) < target_size:
            features.extend([0.0] * (target_size - len(features)))
        else:
            features = features[:target_size]
        
        return np.array(features, dtype=np.float32)

class PatternMatcher:
    def __init__(self):
        self.pattern_templates = {
            'circuit': {'min_components': 3, 'connection_ratio': 0.6},
            'mechanical': {'symmetry_threshold': 0.7, 'complexity_score': 0.5},
            'flowchart': {'box_ratio': 0.4, 'arrow_count': 2}
        }
    
    def identify_patterns(self, features: np.ndarray) -> List[Dict]:
        patterns = []
        
        # Simplified pattern identification based on feature analysis
        if len(features) >= 9:  # At least 3 contours
            avg_area = np.mean(features[::3])  # Every 3rd element is area
            avg_circularity = np.mean(features[2::3])  # Every 3rd element starting from 2 is circularity
            
            if avg_circularity > 0.7:
                patterns.append({
                    'type': 'circuit',
                    'confidence': avg_circularity,
                    'characteristics': {'component_density': avg_area}
                })
            elif avg_area > 1000:
                patterns.append({
                    'type': 'mechanical',
                    'confidence': min(1.0, avg_area / 5000),
                    'characteristics': {'complexity': avg_area}
                })
        
        return patterns

class VisualRecognitionEngine:
    def __init__(self):
        self.feature_extractor = FeatureExtractor()
        self.pattern_matcher = PatternMatcher()
        self.visual_index = VectorDatabase(dimension=30)  # Match feature vector size
    
    def analyze_technical_drawing(self, image_data: np.ndarray) -> VisualAnalysisResult:
        features = self.feature_extractor.extract(image_data)
        patterns = self.pattern_matcher.identify_patterns(features)
        similar_assets = self.find_similar_visual_assets(features)
        
        return VisualAnalysisResult(features, patterns, similar_assets)
    
    def find_similar_visual_assets(self, features: np.ndarray) -> List[SearchResult]:
        return self.visual_index.similarity_search(features, k=5)
    
    def add_visual_asset(self, image_data: np.ndarray, metadata: Dict):
        features = self.feature_extractor.extract(image_data)
        self.visual_index.add_embeddings(features.reshape(1, -1), [metadata])

class SemanticSearchEngine:
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        self.nlp_processor = NLPProcessor()
        self.embedding_model = SentenceTransformer(model_name)
        self.vector_database = VectorDatabase(dimension=384)  # MiniLM embedding size
        self.visual_recognition = VisualRecognitionEngine()
    
    def add_ip_asset(self, asset_data: Dict):
        # Process text content
        text_content = f"{asset_data.get('title', '')} {asset_data.get('description', '')} {asset_data.get('claims', '')}"
        processed_text = self.nlp_processor.preprocess_text(text_content)
        
        # Generate text embedding
        text_embedding = self.embedding_model.encode([processed_text])
        
        # Add to vector database
        metadata = {
            'id': asset_data.get('id'),
            'type': asset_data.get('type', 'patent'),
            'title': asset_data.get('title'),
            'creator': asset_data.get('creator'),
            'creation_date': asset_data.get('creation_date'),
            'technical_concepts': self.nlp_processor.extract_technical_concepts(text_content)
        }
        
        self.vector_database.add_embeddings(text_embedding, [metadata])
        
        # Process visual content if available
        if 'images' in asset_data:
            for img_data in asset_data['images']:
                self.visual_recognition.add_visual_asset(img_data, metadata)
    
    def search_similar_ip(self, query_text: str, query_images: Optional[List[np.ndarray]] = None, k: int = 10) -> List[SearchResult]:
        # Text-based semantic search
        processed_query = self.nlp_processor.preprocess_text(query_text)
        text_embeddings = self.embedding_model.encode([processed_query])
        text_results = self.vector_database.similarity_search(text_embeddings[0], k=k)
        
        # Visual pattern recognition (if images provided)
        if query_images:
            visual_results = []
            for img in query_images:
                visual_analysis = self.visual_recognition.analyze_technical_drawing(img)
                visual_results.extend(visual_analysis.similar_assets)
            
            # Merge text and visual results
            combined_results = self.merge_results(text_results, visual_results)
        else:
            combined_results = text_results
        
        return self.rank_and_filter_results(combined_results, k)
    
    def merge_results(self, text_results: List[SearchResult], visual_results: List[SearchResult]) -> List[SearchResult]:
        # Combine and deduplicate results
        result_dict = {}
        
        # Add text results with weight
        for result in text_results:
            result_dict[result.asset_id] = SearchResult(
                asset_id=result.asset_id,
                similarity_score=result.similarity_score * 0.7,  # Text weight
                asset_type=result.asset_type,
                metadata=result.metadata
            )
        
        # Add visual results with weight
        for result in visual_results:
            if result.asset_id in result_dict:
                # Combine scores
                existing = result_dict[result.asset_id]
                combined_score = existing.similarity_score + (result.similarity_score * 0.3)  # Visual weight
                result_dict[result.asset_id] = SearchResult(
                    asset_id=result.asset_id,
                    similarity_score=combined_score,
                    asset_type=result.asset_type,
                    metadata=result.metadata
                )
            else:
                result_dict[result.asset_id] = SearchResult(
                    asset_id=result.asset_id,
                    similarity_score=result.similarity_score * 0.3,
                    asset_type=result.asset_type,
                    metadata=result.metadata
                )
        
        return list(result_dict.values())
    
    def rank_and_filter_results(self, results: List[SearchResult], k: int) -> List[SearchResult]:
        # Sort by similarity score and return top k
        sorted_results = sorted(results, key=lambda x: x.similarity_score, reverse=True)
        return sorted_results[:k]
    
    def search_by_technical_concepts(self, concepts: List[str], k: int = 10) -> List[SearchResult]:
        # Search based on specific technical concepts
        query_text = " ".join(concepts)
        return self.search_similar_ip(query_text, k=k)
    
    def get_trending_technologies(self) -> Dict[str, int]:
        # Analyze trending technologies from stored assets
        concept_counts = {}
        
        for metadata in self.vector_database.metadata_store.values():
            concepts = metadata.get('technical_concepts', [])
            for concept in concepts:
                concept_counts[concept] = concept_counts.get(concept, 0) + 1
        
        # Sort by frequency
        return dict(sorted(concept_counts.items(), key=lambda x: x[1], reverse=True)[:20])

# Example usage
if __name__ == "__main__":
    search_engine = SemanticSearchEngine()
    
    # Add sample IP assets
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
    
    # Search for similar IP
    results = search_engine.search_similar_ip("AI valuation blockchain system")
    
    print("Search Results:")
    for result in results:
        print(f"Asset ID: {result.asset_id}")
        print(f"Similarity: {result.similarity_score:.3f}")
        print(f"Title: {result.metadata.get('title', 'N/A')}")
        print("---")
    
    # Get trending technologies
    trending = search_engine.get_trending_technologies()
    print(f"\nTrending Technologies: {trending}")