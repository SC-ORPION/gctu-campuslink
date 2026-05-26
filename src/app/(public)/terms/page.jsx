import React from 'react';

export const metadata = {
  title: 'Terms of Service | GCTU CampusLink',
  description: 'Terms of Service for GCTU CampusLink.',
};

export default function TermsPage() {
  return (
    <div className="bg-slate-50 min-h-screen pt-12 pb-24">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 md:p-16">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">1. Agreement to Terms</h2>
            <p>By accessing or using GCTU CampusLink, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>

            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">2. Hostel Booking and Allocation</h2>
            <p>Booking a hostel through CampusLink does not guarantee allocation. Allocations are subject to payment verification, availability, and administrative approval. The university reserves the right to reassign rooms if necessary.</p>

            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">3. Payments</h2>
            <p>All payments must be made through approved university channels. Uploading fraudulent payment receipts is a strict violation of university policy and may result in disciplinary action.</p>

            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">4. Code of Conduct</h2>
            <p>Students must adhere to the GCTU Student Handbook and Hostel Rules. Vandalism, harassment, or illegal activities within the hostels will lead to immediate eviction and disciplinary action.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
