import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Mic, MicOff, Copy, Share2 } from 'lucide-react';

interface AnalysisResult {
  label: string;
  score: number;
}

export function AnalysisPage() {
  const [inputText, setInputText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = () => {
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const handleVoiceInput = () => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      recognition?.start();
      setIsListening(true);
    }
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3004/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: inputText })
      });

      const result = await response.json();

      if (result.prediction && result.prediction.length > 0) {
        const prediction = result.prediction[0];
        setAnalysisResult({
          label: prediction.label,
          score: prediction.score
        });
      } else {
        setAnalysisResult({
          label: 'Unable to classify',
          score: 0
        });
      }
    } catch (error) {
      console.error('Error calling analysis API:', error);
      setAnalysisResult({
        label: 'Error processing request',
        score: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareLink = async () => {
    if (!analysisResult) return;

    const text = `${analysisResult.label} - ${(analysisResult.score * 100).toFixed(2)}%`;
    try {
      await navigator.clipboard.writeText(text);
      alert('Analysis copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-6" style={{ backgroundColor: 'white' }}>
      {/* Main Container */}
      <div className="w-full max-w-7xl h-full flex flex-col gap-6">
        {/* Two Column Layout */}
        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Left: Text Input */}
          <div className="flex-1 flex flex-col">
            <div
              className="flex-1 p-6 rounded-lg border"
              style={{
                backgroundColor: '#f5f5f5',
                borderColor: '#ddd',
              }}
            >
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter text for analysis..."
                className="w-full h-full bg-transparent text-black text-lg resize-none focus:outline-none placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Right: Output Display */}
          <div className="flex-1 flex flex-col">
            <div
              className="flex-1 p-8 rounded-lg border flex flex-col justify-between"
              style={{
                backgroundColor: '#f5f5f5',
                borderColor: '#ddd',
              }}
            >
              {analysisResult ? (
                <>
                  <div>
                    <h3 className="text-black text-5xl font-black mb-6 break-words leading-tight">
                      {analysisResult.label}
                    </h3>
                    <div
                      className="h-1 w-40 mb-8"
                      style={{ backgroundColor: '#FF6B35' }}
                    />
                    <p className="text-black text-xl font-black mb-3">
                      Confidence Score
                    </p>
                    <div
                      className="h-1 w-48 mb-6"
                      style={{ backgroundColor: '#FF6B35' }}
                    />
                    <p className="text-black text-5xl font-black">
                      {(analysisResult.score * 100).toFixed(2)}%
                    </p>
                  </div>
                  <button
                    onClick={handleShareLink}
                    className="w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                    style={{
                      backgroundColor: '#e5e5e5',
                      color: '#666'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#ccc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#e5e5e5';
                    }}
                  >
                    <Share2 size={18} />
                    Share via Link
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-700 text-lg">
                  Submit text to see analysis
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analyze Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleAnalyze}
            disabled={!inputText.trim() || isLoading}
            className="px-8 py-3 text-lg"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Text'}
          </Button>
        </div>

        {/* Listening Indicator */}
        {isListening && (
          <div className="text-center">
            <p className="text-sm text-black animate-pulse flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
              Listening... Speak now
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}