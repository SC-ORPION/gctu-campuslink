import React from 'react';

export const metadata = {
  title: 'FAQ | GCTU CampusLink',
  description: 'Frequently Asked Questions about GCTU CampusLink.',
};

const faqs = [
  {
    question: "How do I apply for a hostel?",
    answer: "You can apply for a hostel by logging into the Student Portal, navigating to the 'Hostels' page, selecting an available hostel, and clicking 'Apply'. Follow the instructions to upload your payment receipt."
  },
  {
    question: "When are allocations released?",
    answer: "Allocations are typically processed within 3-5 working days after payment verification. You will receive an email notification once your allocation status changes."
  },
  {
    question: "Can I choose my roommate?",
    answer: "Currently, roommates are assigned automatically based on program and gender to encourage diversity. We do not support manual roommate selection at this time."
  },
  {
    question: "What if my payment is rejected?",
    answer: "If your payment is rejected, the administration will provide a reason. You can re-upload a clear, valid payment receipt from your dashboard."
  }
];

export default function FAQPage() {
  return (
    <div className="bg-slate-50 min-h-screen pt-12 pb-24">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Frequently Asked Questions</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Find answers to common questions about the hostel booking and allocation process.
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-3">{faq.question}</h3>
              <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-slate-600">
            Still have questions? <a href="/contact" className="text-indigo-600 font-semibold hover:underline">Contact our support team</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
