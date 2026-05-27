import { AlertTriangle } from 'lucide-react';

interface ErrorToastProps {
  error: string;
  onClose: () => void;
}

export const ErrorToast = ({ error, onClose }: ErrorToastProps) => {
  return (
    <div className="error-toast-banner">
      <AlertTriangle className="toast-warn-icon" size={16} />
      <div className="toast-warn-text">
        <strong>Crawl Warning:</strong> {error}
      </div>
      <button className="toast-warn-close" onClick={onClose} title="Dismiss Warning">
        &times;
      </button>
    </div>
  );
};
