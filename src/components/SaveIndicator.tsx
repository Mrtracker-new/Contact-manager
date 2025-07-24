import { Check, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SaveIndicatorProps {
  isVisible: boolean;
  isSaving: boolean;
  message?: string;
}

export const SaveIndicator = ({ isVisible, isSaving, message }: SaveIndicatorProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      if (!isSaving) {
        // Hide after showing success for 2 seconds
        const timer = setTimeout(() => setShow(false), 2000);
        return () => clearTimeout(timer);
      }
    } else {
      setShow(false);
    }
  }, [isVisible, isSaving]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div className={`
        flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg
        ${isSaving 
          ? 'bg-blue-500 text-white' 
          : 'bg-green-500 text-white'
        }
        transition-all duration-300 ease-in-out
      `}>
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">{message || 'Saving...'}</span>
          </>
        ) : (
          <>
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">{message || 'Saved!'}</span>
          </>
        )}
      </div>
    </div>
  );
};
