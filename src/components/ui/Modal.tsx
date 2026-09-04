import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
  id?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-md',
  id,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id={id || 'afinity-modal'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="fixed inset-0" onClick={onClose} />

      <div
        className={cn(
          'relative z-10 w-full max-h-[92vh] flex flex-col rounded-3xl bg-[#0f182d] border border-slate-700/80 shadow-2xl p-4 sm:p-6 overflow-hidden animate-in zoom-in-95 duration-200',
          maxWidth
        )}
      >
        <div className="flex-shrink-0 flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div>
            {title && (
              <h3 className="text-lg font-bold text-white font-heading">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer flex-shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 pb-2 scrollbar-thin scrollbar-thumb-slate-700 w-full max-w-full">
          {children}
        </div>
      </div>
    </div>
  );
};
