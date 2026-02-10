
import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 5000 }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    const Icon = type === 'success' ? CheckCircle : AlertCircle;

    return (
        <div className={`fixed top-24 right-8 z-[200] ${bgColor} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-4 max-w-md`}>
            <Icon className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm font-bold flex-1">{message}</p>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};

export default Toast;
