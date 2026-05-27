import React from 'react';
import { AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface VerificationStatusProps {
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  message?: string;
}

export default function VerificationStatus({ status, message }: VerificationStatusProps) {
  const config = {
    PENDING: {
      icon: <Clock className="text-[#D97706]" size={18} />,
      bgColor: 'bg-[#FFFBEB]',
      borderColor: 'border-[#FEF3C7]',
      title: 'Awaiting Verification',
      text: message || 'Your payment slip is being processed by GCTU accounts department. This usually takes 24 hours.'
    },
    VERIFIED: {
      icon: <CheckCircle2 className="text-[#059669]" size={18} />,
      bgColor: 'bg-[#D1FAE5]',
      borderColor: 'border-[#A7F3D0]',
      title: 'Payment Verified',
      text: message || 'Your payment has been successfully verified! Room allocation slip has been unlocked.'
    },
    REJECTED: {
      icon: <XCircle className="text-[#DC2626]" size={18} />,
      bgColor: 'bg-[#FEE2E2]',
      borderColor: 'border-[#FCA5A5]',
      title: 'Payment Rejected',
      text: message || 'The submitted receipt reference number could not be authenticated. Please recheck and upload again.'
    }
  };

  const selected = config[status];

  return (
    <div className={`p-4 rounded-xl border ${selected.bgColor} ${selected.borderColor} flex gap-3 items-start`}>
      <div className="flex-shrink-0 mt-0.5">{selected.icon}</div>
      <div>
        <h4 className="text-xs font-bold text-[#0F172A]">{selected.title}</h4>
        <p className="text-[11px] font-medium text-[#475569] leading-relaxed mt-1">{selected.text}</p>
      </div>
    </div>
  );
}
