"""
Semantic Search and Discovery System for IP Ingenuity Protocol
Implements advanced NLP, vector search, and visual recognition for prior art discovery
Based on patent specifications with FAISS indexing and transformer embeddings
"""

import numpy as np
import pandas as pd
import faiss
import torch
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModel
import cv2
import json
import logging
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Union
import spacy
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import requests
from dataclasses import dataclass
import pickle
import os

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('wordnet')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class SearchResult:
    """Data class for search results"""
    patent_id: str
    title: str
    similarity_score: float
    metadata_score: float
    final_score: float
    patent_text: str
    filing_date: str
    assignee: str
    technology_class: str
    citation_count: int
    visual_similarity: float = 0.0
    relevance_explanation: str = ""

class IPSemanticSearch:
    """
    Advanced semantic search engine for intellectual property discovery
    """
    
    def __init__(self, config: Dict):
        self.config = config
        self.embedding_model = None
        self.visual_model = None
        self.text_index = None
        self.visual_index = None
        self.metadata_store = {}
        self.stop_words = set(stopwords.words('english'))
        self.lemmatizer = WordNetLemmatizer()
        
        # Initialize models and indices
        self._initialize_models()
        self._load_or_create_indices()
        
        logger.info("IP Semantic Search Engine initialized successfully")

    def _initialize_models(self):
        """Initialize embedding and visual models"""
        try:
            # Load patent-specific sentence transformer
            model_name = self.config.get('embedding_model', 'sentence-transformers/all-MiniLM-L6-v2')
            self.embedding_model = SentenceTransformer(model_name)
            
            # Fine-tune on patent data if available
            if self.config.get('patent_training_data'):
                self._fine_tune_embeddings()
            
            # Load spaCy model for NLP preprocessing
            try:
                self.nlp = spacy.load("en_core_web_sm")
            except OSError:
                logger.warning("spaCy model not found. Using basic preprocessing.")
                self.nlp = None
            
            # Initialize visual recognition model
            self._initialize_visual_model()
            
            logger.info("Models initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing models: {e}")
            raise

    def _initialize_visual_model(self):
        """Initialize visual recognition model for technical drawings"""
        try:
            # Simple CNN for visual similarity (placeholder)
            # In production, use pre-trained models like ResNet, VGG, etc.
            self.visual_model = {
                'feature_extractor': self._create_visual_feature_extractor(),
                'dimension': 2048
            }
            
        except Exception as e:
            logger.error(f"Error initializing visual model: {e}")

    def _create_visual_feature_extractor(self):
        """Create visual feature extraction pipeline"""
        def extract_features(image_path: str) -> np.ndarray:
            try:
                # Load and preprocess image
                image = cv2.imread(image_path)
                if image is None:
                    return np.zeros(2048)
                
                # Resize to standard size
                image = cv2.resize(image, (224, 224))
                
                # Convert to RGB
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                
                # Extract basic features (histogram, edges, etc.)
                features = self._extract_basic_visual_features(image_rgb)
                
                return features
                
            except Exception as e:
                logger.error(f"Error extracting visual features: {e}")
                return np.zeros(2048)
        
        return extract_features

    def _extract_basic_visual_features(self, image: np.ndarray) -> np.ndarray:
        """Extract basic visual features from image"""
        features = []
        
        # Color histogram
        hist = cv2.calcHist([image], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
        features.extend(hist.flatten())
        
        # Edge features
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])
        features.append(edge_density)
        
        # Texture features (using LBP-like approach)
        texture_features = self._calculate_texture_features(gray)
        features.extend(texture_features)
        
        # Pad or truncate to desired dimension
        features_array = np.array(features)
        if len(features_array) < 2048:
            features_array = np.pad(features_array, (0, 2048 - len(features_array)))
        else:
            features_array = features_array[:2048]
        
        return features_array.astype(np.float32)

    def _calculate_texture_features(self, gray_image: np.ndarray) -> List[float]:
        """Calculate texture features from grayscale image"""
        # Simple texture analysis using local standard deviation
        kernel_size = 5
        kernel = np.ones((kernel_size, kernel_size), np.float32) / (kernel_size * kernel_size)
        
        # Local mean
        local_mean = cv2.filter2D(gray_image.astype(np.float32), -1, kernel)
        
        # Local variance
        local_var = cv2.filter2D((gray_image.astype(np.float32) - local_mean) ** 2, -1, kernel)
        
        # Texture statistics
        texture_stats = [
            float(np.mean(local_var)),
            float(np.std(local_var)),
            float(np.min(local_var)),
            float(np.max(local_var))
        ]
        
        return texture_stats

    def _load_or_create_indices(self):
        """Load existing indices or create new ones"""
        try:
            index_path = self.config.get('index_path', './indices/')
            os.makedirs(index_path, exist_ok=True)
            
            text_index_file = os.path.join(index_path, 'text_index.faiss')
            visual_index_file = os.path.join(index_path, 'visual_index.faiss')
            metadata_file = os.path.join(index_path, 'metadata.pkl')
            
            if os.path.exists(text_index_file) and os.path.exists(metadata_file):
                # Load existing indices
                self.text_index = faiss.read_index(text_index_file)
                
                if os.path.exists(visual_index_file):
                    self.visual_index = faiss.read_index(visual_index_file)
                
                with open(metadata_file, 'rb') as f:
                    self.metadata_store = pickle.load(f)
                
                logger.info(f"Loaded existing indices with {self.text_index.ntotal} documents")
            else:
                # Create new indices
                embedding_dim = self.embedding_model.get_sentence_embedding_dimension()
                
                # Create FAISS index for text embeddings
                self.text_index = faiss.IndexFlatIP(embedding_dim)  # Inner product for cosine similarity
                
                # Create FAISS index for visual features
                visual_dim = self.visual_model['dimension']
                self.visual_index = faiss.IndexFlatL2(visual_dim)
                
                logger.info("Created new empty indices")
                
        except Exception as e:
            logger.error(f"Error loading/creating indices: {e}")
            raise

    def preprocess_text(self, text: str) -> str:
        """Preprocess patent text for better search"""
        try:
            # Clean text
            text = re.sub(r'[^\w\s]', ' ', text.lower())
            text = re.sub(r'\s+', ' ', text).strip()
            
            if self.nlp:
                # Use spaCy for advanced preprocessing
                doc = self.nlp(text)
                tokens = [
                    token.lemma_ for token in doc 
                    if not token.is_stop and not token.is_punct and token.is_alpha
                ]
            else:
                # Basic preprocessing
                tokens = [
                    self.lemmatizer.lemmatize(word) 
                    for word in text.split() 
                    if word not in self.stop_words and len(word) > 2
                ]
            
            return ' '.join(tokens)
            
        except Exception as e:
            logger.warning(f"Error preprocessing text: {e}")
            return text

    def index_patent_document(self, patent_data: Dict) -> bool:
        """Index a single patent document"""
        try:
            patent_id = patent_data['patent_id']
            patent_text = patent_data.get('abstract', '') + ' ' + patent_data.get('claims', '')
            
            # Preprocess text
            processed_text = self.preprocess_text(patent_text)
            
            # Generate embedding
            embedding = self.embedding_model.encode(processed_text)
            embedding = embedding.reshape(1, -1).astype('float32')
            
            # Normalize for cosine similarity
            faiss.normalize_L2(embedding)
            
            # Add to text index
            self.text_index.add(embedding)
            
            # Handle visual data if available
            visual_embedding = None
            if 'image_path' in patent_data:
                visual_features = self.visual_model['feature_extractor'](patent_data['image_path'])
                visual_embedding = visual_features.reshape(1, -1).astype('float32')
                self.visual_index.add(visual_embedding)
            
            # Store metadata
            index_id = self.text_index.ntotal - 1
            self.metadata_store[index_id] = {
                'patent_id': patent_id,
                'title': patent_data.get('title', ''),
                'abstract': patent_data.get('abstract', ''),
                'claims': patent_data.get('claims', ''),
                'filing_date': patent_data.get('filing_date', ''),
                'assignee': patent_data.get('assignee', ''),
                'technology_class': patent_data.get('technology_class', ''),
                'citation_count': patent_data.get('citation_count', 0),
                'original_text': patent_text,
                'processed_text': processed_text,
                'has_visual': visual_embedding is not None
            }
            
            return True
            
        except Exception as e:
            logger.error(f"Error indexing patent {patent_data.get('patent_id', 'unknown')}: {e}")
            return False

    def batch_index_patents(self, patent_list: List[Dict]) -> int:
        """Index multiple patent documents"""
        successful_count = 0
        
        logger.info(f"Starting batch indexing of {len(patent_list)} patents")
        
        for i, patent_data in enumerate(patent_list):
            if i % 100 == 0:
                logger.info(f"Processed {i}/{len(patent_list)} patents")
            
            if self.index_patent_document(patent_data):
                successful_count += 1
        
        # Save indices after batch processing
        self.save_indices()
        
        logger.info(f"Batch indexing completed. {successful_count}/{len(patent_list)} patents indexed successfully")
        return successful_count

    def search_prior_art(self, query_text: str, top_k: int = 50, 
                        include_visual: bool = False, 
                        visual_query_path: str = None) -> List[SearchResult]:
        """
        Comprehensive prior art search combining text and visual similarity
        """
        try:
            logger.info(f"Searching prior art for query (top {top_k} results)")
            
            # Text-based search
            text_results = self._search_text_similarity(query_text, top_k * 2)
            
            # Visual search if requested
            visual_results = []
            if include_visual and visual_query_path:
                visual_results = self._search_visual_similarity(visual_query_path, top_k)
            
            # Combine and rank results
            combined_results = self._combine_search_results(text_results, visual_results, top_k)
            
            # Add relevance explanations
            for result in combined_results:
                result.relevance_explanation = self._explain_relevance(query_text, result)
            
            logger.info(f"Found {len(combined_results)} relevant results")
            return combined_results
            
        except Exception as e:
            logger.error(f"Error in prior art search: {e}")
            return []

    def _search_text_similarity(self, query_text: str, top_k: int) -> List[SearchResult]:
        """Search based on text semantic similarity"""
        try:
            # Preprocess query
            processed_query = self.preprocess_text(query_text)
            
            # Generate query embedding
            query_embedding = self.embedding_model.encode(processed_query)
            query_embedding = query_embedding.reshape(1, -1).astype('float32')
            faiss.normalize_L2(query_embedding)
            
            # Search index
            similarities, indices = self.text_index.search(query_embedding, top_k)
            
            results = []
            for i, (similarity, idx) in enumerate(zip(similarities[0], indices[0])):
                if idx == -1:  # FAISS returns -1 for empty results
                    continue
                
                metadata = self.metadata_store.get(idx, {})
                
                # Calculate metadata score
                metadata_score = self._calculate_metadata_score(query_text, metadata)
                
                # Combine similarity and metadata scores
                final_score = similarity * 0.7 + metadata_score * 0.3
                
                result = SearchResult(
                    patent_id=metadata.get('patent_id', f'unknown_{idx}'),
                    title=metadata.get('title', ''),
                    similarity_score=float(similarity),
                    metadata_score=metadata_score,
                    final_score=final_score,
                    patent_text=metadata.get('original_text', ''),
                    filing_date=metadata.get('filing_date', ''),
                    assignee=metadata.get('assignee', ''),
                    technology_class=metadata.get('technology_class', ''),
                    citation_count=metadata.get('citation_count', 0)
                )
                
                results.append(result)
            
            # Sort by final score
            results.sort(key=lambda x: x.final_score, reverse=True)
            return results
            
        except Exception as e:
            logger.error(f"Error in text similarity search: {e}")
            return []

    def _search_visual_similarity(self, image_path: str, top_k: int) -> List[SearchResult]:
        """Search based on visual similarity of technical drawings"""
        try:
            if self.visual_index.ntotal == 0:
                logger.warning("Visual index is empty")
                return []
            
            # Extract visual features from query image
            query_features = self.visual_model['feature_extractor'](image_path)
            query_features = query_features.reshape(1, -1).astype('float32')
            
            # Search visual index
            distances, indices = self.visual_index.search(query_features, top_k)
            
            results = []
            for distance, idx in zip(distances[0], indices[0]):
                if idx == -1:
                    continue
                
                metadata = self.metadata_store.get(idx, {})
                if not metadata.get('has_visual', False):
                    continue
                
                # Convert distance to similarity (lower distance = higher similarity)
                visual_similarity = 1.0 / (1.0 + distance)
                
                result = SearchResult(
                    patent_id=metadata.get('patent_id', f'visual_{idx}'),
                    title=metadata.get('title', ''),
                    similarity_score=0.0,  # No text similarity for visual-only results
                    metadata_score=0.0,
                    final_score=visual_similarity,
                    patent_text=metadata.get('original_text', ''),
                    filing_date=metadata.get('filing_date', ''),
                    assignee=metadata.get('assignee', ''),
                    technology_class=metadata.get('technology_class', ''),
                    citation_count=metadata.get('citation_count', 0),
                    visual_similarity=visual_similarity
                )
                
                results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"Error in visual similarity search: {e}")
            return []

    def _calculate_metadata_score(self, query_text: str, metadata: Dict) -> float:
        """Calculate metadata-based relevance score"""
        try:
            score = 0.0
            
            # Technology class matching
            query_lower = query_text.lower()
            tech_class = metadata.get('technology_class', '').lower()
            if tech_class and any(word in tech_class for word in query_lower.split()):
                score += 0.3
            
            # Citation count (normalize by log scale)
            citation_count = metadata.get('citation_count', 0)
            if citation_count > 0:
                citation_score = min(0.2, np.log(citation_count + 1) / 10)
                score += citation_score
            
            # Recency bias (more recent patents get slight boost)
            filing_date = metadata.get('filing_date', '')
            if filing_date:
                try:
                    file_year = int(filing_date[:4])
                    current_year = datetime.now().year
                    years_old = current_year - file_year
                    recency_score = max(0, 0.1 * (1 - years_old / 20))  # Decay over 20 years
                    score += recency_score
                except:
                    pass
            
            # Assignee reputation (simplified)
            assignee = metadata.get('assignee', '').lower()
            major_companies = ['ibm', 'microsoft', 'google', 'apple', 'samsung', 'intel', 'amazon']
            if any(company in assignee for company in major_companies):
                score += 0.1
            
            return min(1.0, score)
            
        except Exception as e:
            logger.warning(f"Error calculating metadata score: {e}")
            return 0.0

    def _combine_search_results(self, text_results: List[SearchResult], 
                               visual_results: List[SearchResult], 
                               top_k: int) -> List[SearchResult]:
        """Combine text and visual search results"""
        try:
            # Create combined results dictionary to avoid duplicates
            combined_dict = {}
            
            # Add text results
            for result in text_results:
                combined_dict[result.patent_id] = result
            
            # Add or enhance with visual results
            for visual_result in visual_results:
                patent_id = visual_result.patent_id
                if patent_id in combined_dict:
                    # Enhance existing result with visual similarity
                    existing = combined_dict[patent_id]
                    existing.visual_similarity = visual_result.visual_similarity
                    # Recalculate final score with visual component
                    existing.final_score = (
                        existing.final_score * 0.7 + 
                        visual_result.visual_similarity * 0.3
                    )
                else:
                    # Add as new result
                    combined_dict[patent_id] = visual_result
            
            # Convert to list and sort
            combined_results = list(combined_dict.values())
            combined_results.sort(key=lambda x: x.final_score, reverse=True)
            
            return combined_results[:top_k]
            
        except Exception as e:
            logger.error(f"Error combining search results: {e}")
            return text_results[:top_k]

    def _explain_relevance(self, query: str, result: SearchResult) -> str:
        """Generate explanation for why a result is relevant"""
        try:
            explanations = []
            
            # Similarity score explanation
            if result.similarity_score > 0.8:
                explanations.append("High semantic similarity to query")
            elif result.similarity_score > 0.6:
                explanations.append("Moderate semantic similarity to query")
            
            # Visual similarity explanation
            if result.visual_similarity > 0.7:
                explanations.append("Strong visual similarity in technical drawings")
            elif result.visual_similarity > 0.5:
                explanations.append("Some visual similarity in technical diagrams")
            
            # Technology class match
            query_lower = query.lower()
            if result.technology_class and any(word in result.technology_class.lower() 
                                             for word in query_lower.split()):
                explanations.append(f"Same technology classification ({result.technology_class})")
            
            # Citation count
            if result.citation_count > 10:
                explanations.append(f"Highly cited patent ({result.citation_count} citations)")
            elif result.citation_count > 5:
                explanations.append(f"Well-cited patent ({result.citation_count} citations)")
            
            # Assignee reputation
            if any(company in result.assignee.lower() 
                  for company in ['ibm', 'microsoft', 'google', 'apple', 'samsung']):
                explanations.append(f"Filed by major technology company ({result.assignee})")
            
            return "; ".join(explanations) if explanations else "General relevance to query terms"
            
        except Exception as e:
            logger.warning(f"Error explaining relevance: {e}")
            return "Relevant based on search algorithm"

    def find_patent_families(self, patent_id: str) -> List[Dict]:
        """Find related patents in the same patent family"""
        try:
            # Find the patent in metadata
            target_metadata = None
            target_index = None
            
            for idx, metadata in self.metadata_store.items():
                if metadata['patent_id'] == patent_id:
                    target_metadata = metadata
                    target_index = idx
                    break
            
            if not target_metadata:
                logger.warning(f"Patent {patent_id} not found in index")
                return []
            
            # Search for similar patents using the patent's own text
            family_results = self._search_text_similarity(
                target_metadata['original_text'], 20
            )
            
            # Filter out the original patent and apply stricter similarity threshold
            family_patents = []
            for result in family_results:
                if (result.patent_id != patent_id and 
                    result.similarity_score > 0.85):  # High similarity threshold for families
                    
                    family_patents.append({
                        'patent_id': result.patent_id,
                        'title': result.title,
                        'similarity_score': result.similarity_score,
                        'assignee': result.assignee,
                        'filing_date': result.filing_date,
                        'relationship': 'continuation' if result.similarity_score > 0.95 else 'related'
                    })
            
            logger.info(f"Found {len(family_patents)} family members for {patent_id}")
            return family_patents
            
        except Exception as e:
            logger.error(f"Error finding patent families: {e}")
            return []

    def analyze_citation_network(self, patent_id: str, depth: int = 2) -> Dict:
        """Analyze citation network around a patent"""
        try:
            # This is a simplified implementation
            # In practice, you'd need actual citation data from patent databases
            
            citation_data = {
                'patent_id': patent_id,
                'forward_citations': [],
                'backward_citations': [],
                'citation_clusters': [],
                'influence_score': 0.0
            }
            
            # Find patents that cite this one (forward citations)
            search_results = self._search_text_similarity(
                f"citing patent {patent_id}", 50
            )
            
            for result in search_results[:10]:  # Limit to top 10
                if result.patent_id != patent_id:
                    citation_data['forward_citations'].append({
                        'patent_id': result.patent_id,
                        'title': result.title,
                        'similarity': result.similarity_score
                    })
            
            # Calculate influence score based on citation patterns
            citation_data['influence_score'] = len(citation_data['forward_citations']) * 0.1
            
            return citation_data
            
        except Exception as e:
            logger.error(f"Error analyzing citation network: {e}")
            return {'error': str(e)}

    def technology_trend_analysis(self, technology_field: str, 
                                 time_window: int = 5) -> Dict:
        """Analyze technology trends in patent filings"""
        try:
            current_year = datetime.now().year
            start_year = current_year - time_window
            
            # Search for patents in the technology field
            search_results = self._search_text_similarity(technology_field, 1000)
            
            # Group by year and analyze trends
            yearly_counts = {}
            top_assignees = {}
            key_innovations = []
            
            for result in search_results:
                try:
                    file_year = int(result.filing_date[:4]) if result.filing_date else 0
                    if file_year >= start_year:
                        yearly_counts[file_year] = yearly_counts.get(file_year, 0) + 1
                        
                        # Track assignees
                        assignee = result.assignee
                        if assignee:
                            top_assignees[assignee] = top_assignees.get(assignee, 0) + 1
                        
                        # Identify key innovations (high similarity + high citations)
                        if (result.similarity_score > 0.8 and 
                            result.citation_count > 5):
                            key_innovations.append({
                                'patent_id': result.patent_id,
                                'title': result.title,
                                'score': result.similarity_score * result.citation_count
                            })
                            
                except (ValueError, IndexError):
                    continue
            
            # Sort key innovations by score
            key_innovations.sort(key=lambda x: x['score'], reverse=True)
            key_innovations = key_innovations[:10]  # Top 10
            
            # Calculate trend direction
            years = sorted(yearly_counts.keys())
            if len(years) >= 2:
                recent_avg = np.mean([yearly_counts.get(y, 0) for y in years[-2:]])
                earlier_avg = np.mean([yearly_counts.get(y, 0) for y in years[:2]])
                trend_direction = 'increasing' if recent_avg > earlier_avg else 'decreasing'
            else:
                trend_direction = 'insufficient_data'
            
            return {
                'technology_field': technology_field,
                'time_window': time_window,
                'yearly_filing_counts': yearly_counts,
                'trend_direction': trend_direction,
                'top_assignees': dict(sorted(top_assignees.items(), 
                                           key=lambda x: x[1], reverse=True)[:10]),
                'key_innovations': key_innovations,
                'total_patents_analyzed': len(search_results)
            }
            
        except Exception as e:
            logger.error(f"Error in technology trend analysis: {e}")
            return {'error': str(e)}

    def save_indices(self):
        """Save FAISS indices and metadata to disk"""
        try:
            index_path = self.config.get('index_path', './indices/')
            os.makedirs(index_path, exist_ok=True)
            
            # Save text index
            text_index_file = os.path.join(index_path, 'text_index.faiss')
            faiss.write_index(self.text_index, text_index_file)
            
            # Save visual index if it exists
            if self.visual_index and self.visual_index.ntotal > 0:
                visual_index_file = os.path.join(index_path, 'visual_index.faiss')
                faiss.write_index(self.visual_index, visual_index_file)
            
            # Save metadata
            metadata_file = os.path.join(index_path, 'metadata.pkl')
            with open(metadata_file, 'wb') as f:
                pickle.dump(self.metadata_store, f)
            
            logger.info(f"Indices saved successfully to {index_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving indices: {e}")
            return False

    def get_search_statistics(self) -> Dict:
        """Get statistics about the search index"""
        try:
            total_patents = self.text_index.ntotal if self.text_index else 0
            visual_patents = self.visual_index.ntotal if self.visual_index else 0
            
            # Analyze metadata for additional stats
            assignee_counts = {}
            tech_class_counts = {}
            year_counts = {}
            
            for metadata in self.metadata_store.values():
                # Assignee distribution
                assignee = metadata.get('assignee', 'Unknown')
                assignee_counts[assignee] = assignee_counts.get(assignee, 0) + 1
                
                # Technology class distribution
                tech_class = metadata.get('technology_class', 'Unknown')
                tech_class_counts[tech_class] = tech_class_counts.get(tech_class, 0) + 1
                
                # Year distribution
                filing_date = metadata.get('filing_date', '')
                if filing_date and len(filing_date) >= 4:
                    try:
                        year = filing_date[:4]
                        year_counts[year] = year_counts.get(year, 0) + 1
                    except:
                        pass
            
            return {
                'total_text_patents': total_patents,
                'total_visual_patents': visual_patents,
                'coverage_ratio': visual_patents / total_patents if total_patents > 0 else 0,
                'top_assignees': dict(sorted(assignee_counts.items(), 
                                           key=lambda x: x[1], reverse=True)[:10]),
                'top_technology_classes': dict(sorted(tech_class_counts.items(), 
                                                    key=lambda x: x[1], reverse=True)[:10]),
                'filing_years_range': {
                    'earliest': min(year_counts.keys()) if year_counts else 'Unknown',
                    'latest': max(year_counts.keys()) if year_counts else 'Unknown',
                    'total_years': len(year_counts)
                },
                'index_size_mb': self._estimate_index_size()
            }
            
        except Exception as e:
            logger.error(f"Error getting search statistics: {e}")
            return {'error': str(e)}

    def _estimate_index_size(self) -> float:
        """Estimate the size of indices in MB"""
        try:
            size_mb = 0.0
            
            if self.text_index:
                # Rough estimate: 4 bytes per float * dimensions * number of vectors
                embedding_dim = self.embedding_model.get_sentence_embedding_dimension()
                text_size = (4 * embedding_dim * self.text_index.ntotal) / (1024 * 1024)
                size_mb += text_size
            
            if self.visual_index:
                visual_dim = self.visual_model['dimension']
                visual_size = (4 * visual_dim * self.visual_index.ntotal) / (1024 * 1024)
                size_mb += visual_size
            
            # Add metadata size estimate
            metadata_size = len(str(self.metadata_store)) / (1024 * 1024)
            size_mb += metadata_size
            
            return round(size_mb, 2)
            
        except Exception:
            return 0.0


# Example usage and testing
if __name__ == "__main__":
    # Configuration
    config = {
        'embedding_model': 'sentence-transformers/all-MiniLM-L6-v2',
        'index_path': './patent_indices/',
        'batch_size': 32
    }
    
    # Initialize search engine
    search_engine = IPSemanticSearch(config)
    
    # Example patent data for indexing
    sample_patents = [
        {
            'patent_id': 'US10123456',
            'title': 'Blockchain-based IP Management System',
            'abstract': 'A system for managing intellectual property using blockchain technology...',
            'claims': 'A method comprising tokenizing IP assets on a blockchain...',
            'filing_date': '2023-01-15',
            'assignee': 'Tech Innovations LLC',
            'technology_class': 'G06Q',
            'citation_count': 12
        },
        {
            'patent_id': 'US10234567',
            'title': 'AI-Powered Patent Valuation',
            'abstract': 'An artificial intelligence system for automated patent valuation...',
            'claims': 'A system comprising machine learning models for IP assessment...',
            'filing_date': '2023-03-22',
            'assignee': 'AI Patents Corp',
            'technology_class': 'G06N',
            'citation_count': 8
        }
    ]
    
    # Index sample patents
    indexed_count = search_engine.batch_index_patents(sample_patents)
    print(f"Indexed {indexed_count} patents successfully")
    
    # Perform prior art search
    query = "blockchain tokenization intellectual property management"
    results = search_engine.search_prior_art(query, top_k=10)
    
    print(f"\nPrior Art Search Results for: '{query}'")
    print("=" * 60)
    
    for i, result in enumerate(results, 1):
        print(f"{i}. {result.title}")
        print(f"   Patent ID: {result.patent_id}")
        print(f"   Similarity: {result.similarity_score:.3f}")
        print(f"   Final Score: {result.final_score:.3f}")
        print(f"   Explanation: {result.relevance_explanation}")
        print(f"   Assignee: {result.assignee}")
        print()
    
    # Get search statistics
    stats = search_engine.get_search_statistics()
    print("Search Engine Statistics:")
    print(f"Total Patents: {stats['total_text_patents']}")
    print(f"Index Size: {stats['index_size_mb']} MB")
    
    # Analyze technology trends
    trend_analysis = search_engine.technology_trend_analysis("artificial intelligence", 5)
    print(f"\nTechnology Trend Analysis: {trend_analysis}")
    
    # Save indices
    search_engine.save_indices()