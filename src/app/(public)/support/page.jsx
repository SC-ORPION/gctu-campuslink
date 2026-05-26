import React from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

import ContactForm from './ContactForm';

export const metadata = {
  title: 'Contact Us | GCTU CampusLink',
  description: 'Get in touch with the GCTU CampusLink support team.',
};

export default function ContactPage() {
  return (
    <div className="bg-slate-50 min-h-screen pt-12 pb-24">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Contact Us</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Have questions about hostel allocations or need technical support? We're here to help.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-8 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Contact Info Panel */}
          <div className="md:col-span-2 bg-indigo-600 text-white p-10 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Get in touch</h2>
              <p className="text-indigo-100 mb-8 leading-relaxed">
                Fill out the form and our team will get back to you within 24 hours.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Phone className="text-indigo-200 mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold">Phone</h4>
                    <p className="text-indigo-100">+233 24 000 0000</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <Mail className="text-indigo-200 mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold">Email</h4>
                    <p className="text-indigo-100">support@campuslink.gctu.edu.gh</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPin className="text-indigo-200 mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold">Location</h4>
                    <p className="text-indigo-100 leading-relaxed">
                      Ghana Communication Technology University<br />
                      PMB 100, Tesano<br />
                      Accra, Ghana
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-3 p-10">
            <ContactForm />
          </div>

        </div>
      </div>
    </div>
  );
}
