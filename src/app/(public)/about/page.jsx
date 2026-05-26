import React from 'react';
import { Building2, Users, Target, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'About Us | GCTU CampusLink',
  description: 'Learn about GCTU CampusLink and our mission to simplify hostel allocations.',
};

export default function AboutPage() {
  return (
    <div className="bg-slate-50 min-h-screen pt-12 pb-24">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">About CampusLink</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Revolutionizing the student accommodation experience at Ghana Communication Technology University.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-16">
          <div className="p-8 md:p-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              GCTU CampusLink was developed with a singular focus: to make the process of finding and securing student accommodation as seamless, transparent, and fair as possible. We understand that a comfortable living environment is crucial for academic success.
            </p>
            <p className="text-slate-600 leading-relaxed">
              By digitizing the hostel allocation process, we eliminate long queues, reduce administrative bottlenecks, and provide real-time updates to students regarding room availability, pricing, and their allocation status.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
              <Target size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Efficiency</h3>
            <p className="text-slate-600 leading-relaxed">
              Automated booking workflows that save time for both students and university administrators.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Transparency</h3>
            <p className="text-slate-600 leading-relaxed">
              Clear visibility into available rooms, transparent pricing, and verifiable allocation history.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-6">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Student-Centric</h3>
            <p className="text-slate-600 leading-relaxed">
              Designed from the ground up with the student experience in mind, ensuring ease of use on any device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
