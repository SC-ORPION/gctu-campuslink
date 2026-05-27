import React from 'react';
import { CreditCard } from 'lucide-react';

export default function OnlinePaymentPanel() {
  return (
    <div className="space-y-4 text-center">
      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
        <CreditCard size={24} />
      </div>
      <h3 className="text-sm font-black text-slate-800">Instant Online Checkout</h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
        Securely pay using Visa, Mastercard, or Mobile Money. Online payments are instantly verified and trigger auto-room allocation immediately.
      </p>
    </div>
  );
}
