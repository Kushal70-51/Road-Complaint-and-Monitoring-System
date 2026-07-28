import React, { useState, useEffect, useRef } from 'react';
import '../styles/ai-badge.css';
import { API_BASE_URL } from '../services/api';

const CATEGORIES = [
  'Pothole',
  'Waterlogging',
  'Broken Streetlight',
  'Road Crack',
  'Missing Signage',
  'Garbage Dump',
  'Other'
];

const AICategorizationBadge = ({ 
  description, 
  onCategoryDetected, 
  severity = 'Medium' 
}) => {
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceTimer = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!description || description.trim().length < 10) {
      setAiSuggestion(null);
      return;
    }

    // Debounce API call (500ms)
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    setLoading(true);
    const requestId = ++requestIdRef.current;
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/complaints/suggest-category`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              description: description.trim(),
              severity
            })
          }
        );

        if (!response.ok) {
          throw new Error('AI categorization failed');
        }

        const data = await response.json();

        // Ignore this response if a newer request has since been fired
        if (requestId !== requestIdRef.current) {
          return;
        }

        setAiSuggestion(data);
        setError(null);

        // Auto-select category if confidence > 80%
        if (data.confidence > 0.8 && CATEGORIES.includes(data.category)) {
          onCategoryDetected(data.category);
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          return;
        }
        console.error('AI categorization error:', err);
        setError(err.message);
        setAiSuggestion(null);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [description, severity, onCategoryDetected]);

  if (!description || description.trim().length < 10) {
    return null;
  }

  const getConfidenceColor = (confidence) => {
    if (confidence > 0.8) return 'high';
    if (confidence > 0.5) return 'medium';
    return 'low';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence > 0.8) return 'High Confidence';
    if (confidence > 0.5) return 'Medium Confidence';
    return 'Low Confidence - Please Verify';
  };

  return (
    <div className="ai-badge-container animate-fadeInUp">
      {loading && (
        <div className="ai-badge loading-badge">
          <div className="loading-spinner">🤖</div>
          <span>AI analyzing...</span>
        </div>
      )}

      {error && !loading && (
        <div className="ai-badge error-badge">
          <span>❌ AI unavailable</span>
        </div>
      )}

      {aiSuggestion && !loading && (
        <div className={`ai-badge success-badge ${getConfidenceColor(aiSuggestion.confidence)}`}>
          <div className="badge-header">
            <span className="badge-emoji">🤖</span>
            <span className="badge-title">AI Detected</span>
            <span className="badge-category">{aiSuggestion.category}</span>
          </div>

          <div className="confidence-section">
            <div className="confidence-bar-container">
              <div 
                className="confidence-bar"
                style={{ 
                  width: `${aiSuggestion.confidence * 100}%`
                }}
              />
            </div>
            <div className="confidence-text">
              <span className="confidence-percent">
                {Math.round(aiSuggestion.confidence * 100)}%
              </span>
              <span className="confidence-label">
                {getConfidenceLabel(aiSuggestion.confidence)}
              </span>
            </div>
          </div>

          {aiSuggestion.reason && (
            <div className="badge-reason">
              <small>{aiSuggestion.reason}</small>
            </div>
          )}

          {aiSuggestion.confidence <= 0.8 && (
            <div className="badge-hint">
              👆 Please confirm or adjust the category above
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AICategorizationBadge;
