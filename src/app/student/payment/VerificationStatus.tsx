import React from 'react';
import { AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface VerificationStatusProps {
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  message?: string;
}

export default function VerificationStatus({ status, message }: VerificationStatusProps) {
  const config = {
    PENDING: {
      icon: <Clock className="text-amber-600 dark:text-amber-400" size={18} />,
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      borderColor: 'border-amber-200 dark:border-amber-900/30',
      title: 'Awaiting Verification',
      text: message || 'Your payment slip is being processed by GCTU accounts department. This usually takes 24 hours.'
    },
    VERIFIED: {
      icon: <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={18} />,
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
      borderColor: 'border-emerald-200 dark:border-emerald-900/30',
      title: 'Payment Verified',
      text: message || 'Your payment has been successfully verified! Room allocation slip has been unlocked.'
    },
    REJECTED: {
      icon: <XCircle className="text-rose-600 dark:text-rose-450" size={18} />,
      bgColor: 'bg-rose-50 dark:bg-rose-950/20',
      borderColor: 'border-rose-200 dark:border-rose-900/30',
      title: 'Payment Rejected',
      text: message || 'The submitted receipt reference number could not be authenticated. Please recheck and upload again.'
    }
  };

  const selected = config[status];

  return (
    <div className={`p-4 rounded-xl border ${selected.bgColor} ${selected.borderColor} flex gap-3 items-start`}>
      <div className="flex-shrink-0 mt-0.5">{selected.icon}</div>
      <div>
        <h4 className="text-xs font-black text-slate-800">{selected.title}</h4>
        <p className="text-[11px] text-slate-600 leading-relaxed mt-1">{selected.text}</p>
      </div>
    </div>
  );
}
