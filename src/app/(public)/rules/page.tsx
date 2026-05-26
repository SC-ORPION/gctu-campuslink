import React from 'react';
import { Shield, VolumeX, Users, Sparkles, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Hostel Rules & Code of Conduct | GCTU CampusLink',
  description: 'Code of conduct and guidelines to maintain safety, hygiene, and harmony in GCTU hostels.',
};

export default function RulesPage() {
  const rules = [
    {
      icon: <VolumeX className="text-rose-600" size={24} />,
      title: "1. Noise Regulation & Quiet Hours",
      description: "Quiet hours are observed from 10:00 PM to 6:00 AM daily. Avoid playing loud music, hosting large gatherings, or making disruptive sounds during these times to ensure an environment conducive to studying and sleep."
    },
    {
      icon: <Users className="text-indigo-600" size={24} />,
      title: "2. Visitation Policy",
      description: "Visitors are allowed between 8:00 AM and 8:00 PM. No overnight visitors are permitted under any circumstances. All visitors must be signed in at the front desk with a valid ID card."
    },
    {
      icon: <Sparkles className="text-teal-600" size={24} />,
      title: "3. Cleanliness & General Hygiene",
      description: "Students are responsible for maintaining the cleanliness of their respective rooms. Common areas (pantries, hallways, washrooms) must be used responsibly and kept free of trash."
    },
    {
      icon: <Shield className="text-indigo-600" size={24} />,
      title: "4. Security & Access Control",
      description: "Hostel gates are locked at 11:00 PM. Late entries are restricted unless accompanied by prior written permission from the hostel manager. Do not share your room key or entry cards with anyone."
    },
    {
      icon: <AlertTriangle className="text-rose-600" size={24} />,
      title: "5. Strictly Prohibited Activities",
      description: "Vandalism, drug use, unauthorized electrical appliances (such as hot plates and submersibles in rooms), and cooking inside rooms are strictly banned. Violations lead to immediate eviction without a refund."
    }
  ];

  return (
    <div className="bg-[#06182e]/40 min-h-screen pt-12 pb-24">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Hostel Rules & Conduct</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Please read these guidelines carefully. A safe, secure, and clean environment is our primary goal.
          </p>
        </div>

        <div className="space-y-8 mb-16">
          {rules.map((rule, index) => (
            <div key={index} className="bg-[#0a2240]/60 backdrop-blur-sm rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.3)] border border-[#1e5faf]/15 p-8 flex flex-col md:flex-row gap-6 items-start">
              <div className="w-12 h-12 bg-[#06182e]/40 rounded-xl flex items-center justify-center flex-shrink-0">
                {rule.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-3">{rule.title}</h3>
                <p className="text-slate-300 leading-relaxed">{rule.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#0a2240]/60 backdrop-blur-sm border border-rose-200 rounded-3xl p-8 md:p-12 shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col md:flex-row gap-6 items-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={36} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Penalties for Violation</h2>
            <p className="text-slate-300 leading-relaxed max-w-2xl">
              Failing to adhere to the code of conduct may result in fines, referral to the Disciplinary Committee, loss of accommodation allocation, and/or eviction from the premises depending on the severity of the offence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
