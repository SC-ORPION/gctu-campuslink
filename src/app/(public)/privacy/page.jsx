import React from 'react';

export const metadata = {
  title: 'Privacy Policy | GCTU CampusLink',
  description: 'Privacy Policy for GCTU CampusLink.',
};

export default function PrivacyPage() {
  return (
    <div className="bg-slate-50 min-h-screen pt-12 pb-24">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 md:p-16">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">1. Information We Collect</h2>
            <p>We collect information that you provide directly to us when registering for an account, such as your full name, student ID, email address, phone number, gender, and academic program. We also collect information related to your hostel preferences and payment receipts.</p>

            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">2. How We Use Your Information</h2>
            <p>Your information is used solely for the purpose of managing hostel allocations, verifying payments, communicating updates regarding your accommodation, and improving our services.</p>

            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">3. Data Security</h2>
            <p>We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no electronic transmission over the internet can be guaranteed to be 100% secure.</p>

            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">4. Sharing of Information</h2>
            <p>We do not share your personal information with third parties except as necessary for university administration, legal compliance, or to protect the safety and rights of GCTU and its students.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
