import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Optional
import json
import requests
from datetime import datetime

@dataclass
class ValuationResult:
    valuation: float
    confidence: float
    breakdown: Dict[str, float]
    timestamp: datetime

class TechnicalAnalysisModel:
    def __init__(self):
        self.weights = {
            'claim_strength': 0.3,
            'innovation_level': 0.25,
            'prior_art_density': 0.25,
            'implementation_complexity': 0.2
        }
    
    def analyze(self, ip_data: Dict) -> float:
        claim_strength = self._assess_claim_strength(ip_data.get('claims', []))
        innovation_level = self._evaluate_innovation(ip_data.get('description', ''))
        prior_art_density = self._analyze_prior_art(ip_data.get('prior_art', []))
        complexity = self._score_complexity(ip_data.get('technical_details', {}))
        
        return (
            claim_strength * self.weights['claim_strength'] +
            innovation_level * self.weights['innovation_level'] +
            prior_art_density * self.weights['prior_art_density'] +
            complexity * self.weights['implementation_complexity']
        )
    
    def _assess_claim_strength(self, claims: List[str]) -> float:
        if not claims:
            return 0.0
        
        strength_score = 0.0
        for claim in claims:
            # Analyze claim breadth and specificity
            word_count = len(claim.split())
            technical_terms = sum(1 for word in claim.split() if len(word) > 8)
            strength_score += min(1.0, (word_count * 0.01) + (technical_terms * 0.05))
        
        return min(1.0, strength_score / len(claims))
    
    def _evaluate_innovation(self, description: str) -> float:
        innovation_keywords = ['novel', 'innovative', 'breakthrough', 'unprecedented', 'unique']
        technical_keywords = ['algorithm', 'system', 'method', 'process', 'architecture']
        
        innovation_score = sum(1 for keyword in innovation_keywords if keyword in description.lower())
        technical_score = sum(1 for keyword in technical_keywords if keyword in description.lower())
        
        return min(1.0, (innovation_score * 0.1) + (technical_score * 0.05))
    
    def _analyze_prior_art(self, prior_art: List[Dict]) -> float:
        if not prior_art:
            return 1.0  # No prior art = higher score
        
        # Lower density of similar prior art = higher score
        similarity_scores = [art.get('similarity', 0.5) for art in prior_art]
        avg_similarity = np.mean(similarity_scores)
        return max(0.0, 1.0 - avg_similarity)
    
    def _score_complexity(self, technical_details: Dict) -> float:
        complexity_factors = {
            'components': technical_details.get('component_count', 0) * 0.1,
            'integrations': technical_details.get('integration_count', 0) * 0.15,
            'algorithms': technical_details.get('algorithm_count', 0) * 0.2
        }
        return min(1.0, sum(complexity_factors.values()))

class MarketAnalysisModel:
    def __init__(self):
        self.weights = {
            'adoption_potential': 0.3,
            'competitive_position': 0.25,
            'market_size': 0.25,
            'trend_alignment': 0.2
        }
    
    def analyze(self, ip_data: Dict) -> float:
        adoption = self._assess_adoption_potential(ip_data.get('market_data', {}))
        competition = self._analyze_competition(ip_data.get('competitors', []))
        market_size = self._evaluate_market_size(ip_data.get('industry', ''))
        trends = self._analyze_trends(ip_data.get('technology_area', ''))
        
        return (
            adoption * self.weights['adoption_potential'] +
            competition * self.weights['competitive_position'] +
            market_size * self.weights['market_size'] +
            trends * self.weights['trend_alignment']
        )
    
    def _assess_adoption_potential(self, market_data: Dict) -> float:
        readiness = market_data.get('technology_readiness', 5) / 10.0
        barriers = 1.0 - (market_data.get('adoption_barriers', 5) / 10.0)
        return (readiness + barriers) / 2.0
    
    def _analyze_competition(self, competitors: List[Dict]) -> float:
        if not competitors:
            return 1.0  # No competition = higher score
        
        competitive_strength = sum(comp.get('strength', 0.5) for comp in competitors) / len(competitors)
        return max(0.0, 1.0 - competitive_strength)
    
    def _evaluate_market_size(self, industry: str) -> float:
        # Simplified market size scoring based on industry
        market_scores = {
            'software': 0.9,
            'healthcare': 0.8,
            'fintech': 0.85,
            'ai': 0.95,
            'blockchain': 0.8,
            'iot': 0.75,
            'default': 0.5
        }
        return market_scores.get(industry.lower(), market_scores['default'])
    
    def _analyze_trends(self, technology_area: str) -> float:
        # Simplified trend analysis
        trending_areas = ['ai', 'blockchain', 'quantum', 'biotech', 'clean energy']
        return 0.9 if any(area in technology_area.lower() for area in trending_areas) else 0.5

class FinancialAnalysisModel:
    def __init__(self):
        self.weights = {
            'revenue_potential': 0.4,
            'licensing_opportunity': 0.3,
            'development_cost': 0.2,
            'risk_factor': 0.1
        }
    
    def analyze(self, ip_data: Dict) -> float:
        revenue = self._calculate_revenue_potential(ip_data.get('financial_data', {}))
        licensing = self._assess_licensing_opportunity(ip_data.get('licensing_data', {}))
        cost = self._evaluate_development_cost(ip_data.get('development_data', {}))
        risk = self._assess_risk_factors(ip_data.get('risk_data', {}))
        
        return (
            revenue * self.weights['revenue_potential'] +
            licensing * self.weights['licensing_opportunity'] +
            cost * self.weights['development_cost'] +
            risk * self.weights['risk_factor']
        )
    
    def _calculate_revenue_potential(self, financial_data: Dict) -> float:
        projected_revenue = financial_data.get('projected_annual_revenue', 0)
        market_penetration = financial_data.get('market_penetration', 0.01)
        
        # Normalize to 0-1 scale
        revenue_score = min(1.0, (projected_revenue * market_penetration) / 10000000)  # $10M baseline
        return revenue_score
    
    def _assess_licensing_opportunity(self, licensing_data: Dict) -> float:
        licensing_potential = licensing_data.get('licensing_potential', 0.5)
        royalty_rate = licensing_data.get('expected_royalty_rate', 0.05)
        
        return min(1.0, licensing_potential * (royalty_rate * 10))
    
    def _evaluate_development_cost(self, development_data: Dict) -> float:
        development_cost = development_data.get('estimated_cost', 1000000)  # $1M default
        
        # Lower cost = higher score
        cost_score = max(0.0, 1.0 - (development_cost / 10000000))  # $10M max
        return cost_score
    
    def _assess_risk_factors(self, risk_data: Dict) -> float:
        technical_risk = risk_data.get('technical_risk', 0.5)
        market_risk = risk_data.get('market_risk', 0.5)
        regulatory_risk = risk_data.get('regulatory_risk', 0.3)
        
        avg_risk = (technical_risk + market_risk + regulatory_risk) / 3.0
        return max(0.0, 1.0 - avg_risk)

class ConfidenceScorer:
    def calculate_confidence(self, technical_score: float, market_score: float, financial_score: float) -> float:
        # Calculate confidence based on score consistency and data quality
        scores = [technical_score, market_score, financial_score]
        
        # Consistency factor (lower variance = higher confidence)
        variance = np.var(scores)
        consistency_factor = max(0.0, 1.0 - (variance * 2))
        
        # Average score factor
        avg_score = np.mean(scores)
        
        # Data completeness factor (simplified)
        completeness_factor = 0.8  # Assume 80% data completeness
        
        confidence = (consistency_factor * 0.4 + avg_score * 0.4 + completeness_factor * 0.2) * 100
        return min(100.0, max(0.0, confidence))

class IPValuationEngine:
    def __init__(self):
        self.technical_model = TechnicalAnalysisModel()
        self.market_model = MarketAnalysisModel()
        self.financial_model = FinancialAnalysisModel()
        self.confidence_scorer = ConfidenceScorer()
        
        # Weights for final valuation
        self.model_weights = {
            'technical': 0.4,
            'market': 0.35,
            'financial': 0.25
        }
    
    def evaluate_ip_asset(self, ip_data: Dict) -> ValuationResult:
        # Analyze each component
        technical_score = self.technical_model.analyze(ip_data)
        market_score = self.market_model.analyze(ip_data)
        financial_score = self.financial_model.analyze(ip_data)
        
        # Calculate weighted valuation
        weighted_valuation = self.calculate_weighted_score(
            technical_score, market_score, financial_score
        )
        
        # Calculate confidence
        confidence = self.confidence_scorer.calculate_confidence(
            technical_score, market_score, financial_score
        )
        
        # Convert to monetary valuation (simplified)
        base_valuation = ip_data.get('base_valuation', 1000000)  # $1M base
        final_valuation = base_valuation * weighted_valuation
        
        breakdown = {
            'technical': technical_score,
            'market': market_score,
            'financial': financial_score,
            'weighted_score': weighted_valuation
        }
        
        return ValuationResult(
            valuation=final_valuation,
            confidence=confidence,
            breakdown=breakdown,
            timestamp=datetime.now()
        )
    
    def calculate_weighted_score(self, technical: float, market: float, financial: float) -> float:
        return (
            technical * self.model_weights['technical'] +
            market * self.model_weights['market'] +
            financial * self.model_weights['financial']
        )
    
    def batch_evaluate(self, ip_assets: List[Dict]) -> List[ValuationResult]:
        return [self.evaluate_ip_asset(asset) for asset in ip_assets]

# Example usage
if __name__ == "__main__":
    engine = IPValuationEngine()
    
    sample_ip = {
        'claims': ['A system for automated IP valuation using AI'],
        'description': 'Novel AI-powered system for intellectual property valuation',
        'prior_art': [{'similarity': 0.3}, {'similarity': 0.4}],
        'technical_details': {'component_count': 5, 'integration_count': 3, 'algorithm_count': 2},
        'market_data': {'technology_readiness': 8, 'adoption_barriers': 3},
        'competitors': [{'strength': 0.6}],
        'industry': 'ai',
        'technology_area': 'ai blockchain',
        'financial_data': {'projected_annual_revenue': 5000000, 'market_penetration': 0.02},
        'licensing_data': {'licensing_potential': 0.8, 'expected_royalty_rate': 0.08},
        'development_data': {'estimated_cost': 2000000},
        'risk_data': {'technical_risk': 0.3, 'market_risk': 0.4, 'regulatory_risk': 0.2},
        'base_valuation': 1000000
    }
    
    result = engine.evaluate_ip_asset(sample_ip)
    print(f"Valuation: ${result.valuation:,.2f}")
    print(f"Confidence: {result.confidence:.1f}%")
    print(f"Breakdown: {result.breakdown}")