'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: string; // e.g., 'ai-coaching', 'epic-connection', etc.
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ 
  isOpen, 
  onClose, 
  context = 'general' 
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !feedback.trim()) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid,
          rating,
          feedback: feedback.trim(),
          context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
          setSubmitted(false);
          setRating(null);
          setFeedback('');
        }, 2000);
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Share Your Feedback</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-8">
            <div className="text-green-500 text-4xl mb-4">✅</div>
            <h3 className="text-lg font-semibold text-white mb-2">Thank you!</h3>
            <p className="text-gray-300">Your feedback has been submitted.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-white font-semibold mb-2">
                How would you rate your experience?
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-2xl ${
                      rating && star <= rating
                        ? 'text-yellow-400'
                        : 'text-gray-400 hover:text-yellow-300'
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">
                Tell us more about your experience:
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What worked well? What could be improved?"
                className="w-full h-32 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!rating || !feedback.trim() || isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// Quick feedback button component
export const QuickFeedbackButton: React.FC<{ context?: string }> = ({ 
  context = 'general' 
}) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors z-40"
        title="Share feedback"
      >
        💬
      </button>
      
      <FeedbackModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        context={context}
      />
    </>
  );
};

export default FeedbackModal;
