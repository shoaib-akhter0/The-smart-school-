import React, { useState } from 'react';
import {
  MapPin, Phone, Mail, ChevronDown, ChevronUp,
  Send, Building2, CheckCircle2, Menu, Search, Navigation
} from 'lucide-react';

interface ContactPortalViewProps {
  onNavigateTab?: (tab: string) => void;
  onOpenSidebar?: () => void;
}

export const ContactPortalView: React.FC<ContactPortalViewProps> = ({
  onNavigateTab,
  onOpenSidebar,
}) => {
  // Accordion state for regional offices
  const [activeAccordion, setActiveAccordion] = useState<string>('head-office');

  // Form states
  const [messageForm, setMessageForm] = useState({
    purpose: 'General',
    fullName: '',
    phone: '',
    email: '',
    message: '',
  });
  const [messageSuccess, setMessageSuccess] = useState(false);

  const [collabForm, setCollabForm] = useState({
    name: '',
    companyName: '',
    contactNumber: '',
    emailAddress: '',
    orgType: '',
    interestedIn: '',
    preferredTime: '',
  });
  const [collabSuccess, setCollabSuccess] = useState(false);

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessageSuccess(true);
    setTimeout(() => setMessageSuccess(false), 5000);
  };

  const handleCollabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCollabSuccess(true);
    setTimeout(() => setCollabSuccess(false), 5000);
  };

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? '' : id);
  };

  return (
    <div className="w-full bg-white font-sans text-slate-800 antialiased -mx-4 sm:-mx-6 lg:-mx-8 -my-4 sm:-my-6 lg:-my-8">
      {/* 1. Hero Banner with Boy Painting & Red Pills */}
      <div className="relative w-full h-[320px] sm:h-[400px] lg:h-[460px] overflow-hidden bg-slate-900">
        {/* Photography Background - School Child in uniform painting */}
        <div
          className="absolute inset-0 bg-cover bg-center brightness-95"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1920&q=80')`,
          }}
        />
        {/* Soft overlay gradient for depth and readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />

        {/* Top Right Floating Action Pills matching reference */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-20 flex flex-col items-end gap-2.5">
          {/* Square Red MENU button */}
          <button
            onClick={onOpenSidebar}
            className="flex flex-col items-center justify-center w-16 h-16 sm:w-18 sm:h-18 rounded-md bg-[#C62828] text-white shadow-lg hover:bg-[#B71C1C] transition transform active:scale-95"
            aria-label="Toggle main menu"
          >
            <Menu className="h-6 w-6 stroke-[2.5]" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest mt-1">
              MENU
            </span>
          </button>

          {/* ENROL NOW pill button */}
          <button
            onClick={() => {
              const el = document.getElementById('send-message-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="rounded-full bg-[#C62828] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#B71C1C] transition transform active:scale-95"
          >
            ENROL NOW
          </button>

          {/* LOCATE OUR CAMPUS pill button */}
          <button
            onClick={() => {
              const el = document.getElementById('contact-info-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="rounded-full bg-[#C62828] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#B71C1C] transition transform active:scale-95"
          >
            LOCATE OUR CAMPUS
          </button>
        </div>

        {/* Hero Title: "Contact Us" */}
        <div className="absolute bottom-8 left-6 sm:bottom-12 sm:left-12 lg:left-16 z-10">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-normal drop-shadow-md">
            Contact Us
          </h1>
        </div>
      </div>

      {/* 2. Main Contact Section (White background, 2 columns) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          
          {/* Left Column: Contact Information (4 cols) */}
          <div id="contact-info-section" className="lg:col-span-5 space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#C62828] mb-6">
              Contact Information
            </h2>

            {/* Accordion Item 1: Head Office (Active Red Header) */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => toggleAccordion('head-office')}
                className={`w-full flex items-center justify-between rounded-full px-5 py-3 transition text-sm font-semibold shadow-xs ${
                  activeAccordion === 'head-office'
                    ? 'bg-[#C62828] text-white shadow-md'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-[#C62828]'
                }`}
              >
                <span>Head Office</span>
                {activeAccordion === 'head-office' ? (
                  <ChevronDown className="h-4 w-4 text-white" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {activeAccordion === 'head-office' && (
                <div className="px-5 py-3 space-y-3.5 text-xs text-slate-700 font-medium">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-[#C62828] shrink-0 mt-0.5" />
                    <span>
                      31-Gurumangat Road, Industrial Area, Gulberg III, Lahore, Pakistan
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-[#C62828] shrink-0" />
                    <span>+92 (42) 111 111 TSS (877)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-[#C62828] shrink-0" />
                    <span className="text-[#C62828] font-semibold">
                      smartinfo@thesmartschools.edu.pk
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion Item 2: Central Region */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => toggleAccordion('central')}
                className={`w-full flex items-center justify-between rounded-full px-5 py-3 transition text-sm font-semibold shadow-xs ${
                  activeAccordion === 'central'
                    ? 'bg-[#C62828] text-white shadow-md'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-[#C62828]'
                }`}
              >
                <span>Central Region</span>
                {activeAccordion === 'central' ? (
                  <ChevronDown className="h-4 w-4 text-white" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {activeAccordion === 'central' && (
                <div className="px-5 py-3 space-y-3 text-xs text-slate-700 font-medium bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-[#C62828] shrink-0 mt-0.5" />
                    <span>Regional Office Central: Faisalabad Road, Lahore</span>
                  </p>
                  <p className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-[#C62828] shrink-0" />
                    <span>+92 (42) 3575 8891-4</span>
                  </p>
                </div>
              )}
            </div>

            {/* Accordion Item 3: Northern Region */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => toggleAccordion('northern')}
                className={`w-full flex items-center justify-between rounded-full px-5 py-3 transition text-sm font-semibold shadow-xs ${
                  activeAccordion === 'northern'
                    ? 'bg-[#C62828] text-white shadow-md'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-[#C62828]'
                }`}
              >
                <span>Northern Region</span>
                {activeAccordion === 'northern' ? (
                  <ChevronDown className="h-4 w-4 text-white" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {activeAccordion === 'northern' && (
                <div className="px-5 py-3 space-y-3 text-xs text-slate-700 font-medium bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-[#C62828] shrink-0 mt-0.5" />
                    <span>Regional Office North: Plot 18, Sector I-9/3, Islamabad</span>
                  </p>
                  <p className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-[#C62828] shrink-0" />
                    <span>+92 (51) 485 9101</span>
                  </p>
                </div>
              )}
            </div>

            {/* Accordion Item 4: Southern Region */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => toggleAccordion('southern')}
                className={`w-full flex items-center justify-between rounded-full px-5 py-3 transition text-sm font-semibold shadow-xs ${
                  activeAccordion === 'southern'
                    ? 'bg-[#C62828] text-white shadow-md'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-[#C62828]'
                }`}
              >
                <span>Southern Region</span>
                {activeAccordion === 'southern' ? (
                  <ChevronDown className="h-4 w-4 text-white" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {activeAccordion === 'southern' && (
                <div className="px-5 py-3 space-y-3 text-xs text-slate-700 font-medium bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-[#C62828] shrink-0 mt-0.5" />
                    <span>Regional Office South: Shahrah-e-Faisal, PECHS, Karachi</span>
                  </p>
                  <p className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-[#C62828] shrink-0" />
                    <span>+92 (21) 3454 8192</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Send Us a Message (7 cols) */}
          <div id="send-message-section" className="lg:col-span-7">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#C62828] mb-6">
              Send Us a Message
            </h2>

            {messageSuccess && (
              <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Thank you! Your message has been sent to The Smart School admissions desk.</span>
              </div>
            )}

            <form onSubmit={handleMessageSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Your purpose of contact
                  </label>
                  <select
                    value={messageForm.purpose}
                    onChange={(e) => setMessageForm({ ...messageForm, purpose: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#C62828] focus:outline-none focus:ring-1 focus:ring-[#C62828]"
                  >
                    <option value="General">General</option>
                    <option value="Admissions">Admissions</option>
                    <option value="Academics">Academics</option>
                    <option value="Franchise">Franchise Inquiry</option>
                    <option value="Fee Support">Fee &amp; Financial Support</option>
                    <option value="Careers">Careers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={messageForm.fullName}
                    onChange={(e) => setMessageForm({ ...messageForm, fullName: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#C62828] focus:outline-none focus:ring-1 focus:ring-[#C62828]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0300-1234567"
                    value={messageForm.phone}
                    onChange={(e) => setMessageForm({ ...messageForm, phone: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#C62828] focus:outline-none focus:ring-1 focus:ring-[#C62828]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={messageForm.email}
                    onChange={(e) => setMessageForm({ ...messageForm, email: e.target.value })}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#C62828] focus:outline-none focus:ring-1 focus:ring-[#C62828]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Message
                </label>
                <textarea
                  rows={6}
                  required
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                  placeholder="How can we help you today?"
                  className="w-full rounded-md border border-slate-300 bg-white p-3 text-xs text-slate-700 focus:border-[#C62828] focus:outline-none focus:ring-1 focus:ring-[#C62828]"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="rounded-full bg-[#C62828] px-8 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[#B71C1C] active:scale-[0.98] transition"
                >
                  SEND MESSAGE
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

      {/* 3. Curved Wavy Divider & Collaboration & Sponsors Section */}
      <div className="relative bg-[#FFF5F5] pt-12 pb-16 px-4 sm:px-8 lg:px-12 border-t border-red-100">
        {/* Soft decorative wave top svg */}
        <div className="absolute top-0 left-0 right-0 overflow-hidden leading-none transform -translate-y-[99%]">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-10 text-[#FFF5F5] fill-current">
            <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,30 L1200,120 L0,120 Z" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#C62828] text-center mb-8">
            Collaboration &amp; Sponsors
          </h2>

          {collabSuccess && (
            <div className="mb-6 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 flex items-center justify-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Thank you! Your collaboration inquiry has been received by our Corporate Relations team.</span>
            </div>
          )}

          <form onSubmit={handleCollabSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={collabForm.name}
                  onChange={(e) => setCollabForm({ ...collabForm, name: e.target.value })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#C62828] focus:outline-none focus:ring-1 focus:ring-[#C62828]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={collabForm.companyName}
                  onChange={(e) => setCollabForm({ ...collabForm, companyName: e.target.value })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#C62828] focus:outline-none focus:ring-1 focus:ring-[#C62828]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Contact Number
                </label>
                <input
                  type="tel"
                  required
                  value={collabForm.contactNumber}
                  onChange={(e) => setCollabForm({ ...collabForm, contactNumber: e.target.value })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#C62828] focus:outline-none focus:ring-1 focus:ring-[#C62828]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={collabForm.emailAddress}
                  onChange={(e) => setCollabForm({ ...collabForm, emailAddress: e.target.value })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#C62828] focus:outline-none focus:ring-1 focus:ring-[#C62828]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Organization Type
                </label>
                <select
                  value={collabForm.orgType}
                  onChange={(e) => setCollabForm({ ...collabForm, orgType: e.target.value })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#C62828] focus:outline-none focus:ring-1 focus:ring-[#C62828]"
                >
                  <option value="">Please select</option>
                  <option value="Corporate">Corporate Partner</option>
                  <option value="Supplier">Educational Vendor / Supplier</option>
                  <option value="NGO">NGO / Non-Profit</option>
                  <option value="Tech">Technology Provider</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Interested In
                </label>
                <select
                  value={collabForm.interestedIn}
                  onChange={(e) => setCollabForm({ ...collabForm, interestedIn: e.target.value })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#C62828] focus:outline-none focus:ring-1 focus:ring-[#C62828]"
                >
                  <option value="">Please select</option>
                  <option value="CSR">CSR Sponsorship</option>
                  <option value="Events">School Event Sponsorship</option>
                  <option value="Partnership">Academic Partnership</option>
                  <option value="Vendor">Vendor Payables &amp; Supplies</option>
                  <option value="Franchise">Franchise Association</option>
                </select>
              </div>
            </div>

            <div className="sm:w-1/2">
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Preferred Time to Connect
              </label>
              <input
                type="text"
                placeholder="e.g. Weekdays 10:00 AM - 2:00 PM"
                value={collabForm.preferredTime}
                onChange={(e) => setCollabForm({ ...collabForm, preferredTime: e.target.value })}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#C62828] focus:outline-none focus:ring-1 focus:ring-[#C62828]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="rounded-full bg-[#C62828] px-8 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[#B71C1C] active:scale-[0.98] transition"
              >
                SUBMIT INFORMATION
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
