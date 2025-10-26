import { useState, useEffect } from 'react';

interface RateLimitState {
  canSubmit: boolean;
  remainingTime: number;
  attempts: number;
}

// Rate limiting hook för event submissions
export function useEventSubmissionRateLimit() {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    canSubmit: true,
    remainingTime: 0,
    attempts: 0
  });

  useEffect(() => {
    // Läs från localStorage vid mount
    const storedData = localStorage.getItem('eventSubmissionRateLimit');
    if (storedData) {
      const data = JSON.parse(storedData);
      const now = Date.now();
      
      if (data.lastSubmission && now - data.lastSubmission < 300000) { // 5 minuter
        setRateLimitState({
          canSubmit: false,
          remainingTime: Math.ceil((300000 - (now - data.lastSubmission)) / 1000),
          attempts: data.attempts || 0
        });
      } else {
        // Reset om mer än 5 minuter har passerat
        localStorage.removeItem('eventSubmissionRateLimit');
        setRateLimitState({
          canSubmit: true,
          remainingTime: 0,
          attempts: 0
        });
      }
    }
  }, []);

  const recordSubmission = () => {
    const now = Date.now();
    const data = {
      lastSubmission: now,
      attempts: (rateLimitState.attempts || 0) + 1
    };
    
    localStorage.setItem('eventSubmissionRateLimit', JSON.stringify(data));
    
    setRateLimitState({
      canSubmit: false,
      remainingTime: 300, // 5 minuter
      attempts: data.attempts
    });

    // Starta countdown
    const interval = setInterval(() => {
      setRateLimitState(prev => {
        if (prev.remainingTime <= 1) {
          clearInterval(interval);
          return {
            canSubmit: true,
            remainingTime: 0,
            attempts: prev.attempts
          };
        }
        return {
          ...prev,
          remainingTime: prev.remainingTime - 1
        };
      });
    }, 1000);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return {
    canSubmit: rateLimitState.canSubmit,
    remainingTime: rateLimitState.remainingTime,
    attempts: rateLimitState.attempts,
    recordSubmission,
    formatTime
  };
}
