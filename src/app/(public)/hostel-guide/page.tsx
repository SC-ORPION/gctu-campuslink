import React from 'react';
import { BookOpen, Calendar, ShieldCheck, CreditCard, ChevronRight } from 'lucide-react';

export const metadata = {
  title: 'Hostel Booking Guide | GCTU CampusLink',
  description: 'A step-by-step guide on how to book and secure your hostel accommodation.',
};

export default function HostelGuidePage() {
  const steps = [
    {
      icon: <Calendar className="text-indigo-600" size={24} />,
      title: "Step 1: Browse Available Hostels",
      description: "Log into your student account, navigate to the hostels catalog, and filter by your preferences (gender segregation, price range, room size, and proximity to campus)."
    },
    {
      icon: <BookOpen className="text-teal-600" size={24} />,
      title: "Step 2: Choose Your Room & Book",
      description: "Select your desired hostel and look through the available room options. Click 'Book Room' to lock in your reservation temporarily."
    },
    {
      icon: <CreditCard className="text-indigo-600" size={24} />,
      title: "Step 3: Make Payment & Upload Receipt",
      description: "Pay the booking amount through any of our authorized banking channels or online payment options. Upload a clear picture of your payment slip or reference on your payments dashboard."
    },
    {
      icon: <ShieldCheck className="text-teal-600" size={24} />,
      title: "Step 4: Await Verification & Allocation",
      description: "Our accounts department will verify your transaction within 24-48 hours. Once verified, your room allocation slip will be generated automatically, containing roommate details and hostel rules."
    }
  ];

  return (
    <div className="bg-[#06182e]/40 min-h-screen pt-12 pb-24">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Hostel Booking Guide</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know to secure your student accommodation quickly and without stress.
          </p>
        </div>

        <div className="space-y-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="bg-[#0a2240]/60 backdrop-blur-sm rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.3)] border border-[#1e5faf]/15 p-8 flex flex-col md:flex-row gap-6 items-start hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-shadow">
              <div className="w-12 h-12 bg-[#06182e]/40 rounded-xl flex items-center justify-center flex-shrink-0">
                {step.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-300 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-indigo-600 to-teal-600 text-white rounded-3xl p-8 md:p-12 shadow-md flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Ready to secure your room?</h2>
            <p className="text-indigo-100 max-w-lg">
              Sign up today and start looking for your home on campus. Rooms are allocated on a first-come, first-served basis.
            </p>
          </div>
          <a 
            href="/register" 
            className="inline-flex items-center gap-2 bg-[#0a2240]/60 backdrop-blur-sm hover:bg-[#0f3058]/30 text-indigo-600 font-bold px-6 py-3 rounded-xl transition-all shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
          >
            <span>Register Now</span>
            <ChevronRight size={18} />
          </a>
        </div>
      </div>
    </div>
  );
}
