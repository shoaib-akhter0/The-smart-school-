import React from 'react';
import { SmartSchoolLogo } from '../common/SmartSchoolLogo';
import { Facebook, Instagram, Youtube, Linkedin, ArrowUp, Phone, Mail, MapPin } from 'lucide-react';

interface FooterProps {
  onNavigateTab?: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateTab }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full border-t border-slate-200 bg-white font-sans text-slate-700 antialiased pt-10 pb-6 px-4 sm:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Brand & Reach Us Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-slate-200">
          <div>
            <SmartSchoolLogo height={52} variant="full" />
          </div>

          <div className="text-left sm:text-right">
            <h4 className="text-xl font-extrabold text-[#C62828] tracking-tight">
              Reach Us
            </h4>
            <a
              href="tel:+9242111111877"
              className="block text-base font-bold text-slate-900 hover:text-[#C62828] transition mt-0.5"
            >
              +92 (42) 111 111 877
            </a>
            <a
              href="mailto:smartinfo@thesmartschools.edu.pk"
              className="block text-xs font-medium text-slate-600 hover:text-[#C62828] transition mt-0.5"
            >
              smartinfo@thesmartschools.edu.pk
            </a>
          </div>
        </div>

        {/* 4 Column Layout Matching Reference Image */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-2">
          
          {/* Column 1: Smart Web Portal Pill */}
          <div className="space-y-4">
            <button
              onClick={scrollToTop}
              className="inline-flex items-center justify-center rounded-full bg-[#C62828] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[#B71C1C] active:scale-[0.98] transition"
            >
              SMART WEB PORTAL
            </button>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              Official institutional portal for academic operations, fee collections, vendor disbursements, and financial audit trails.
            </p>
          </div>

          {/* Column 2: Navigation Links */}
          <div>
            <h5 className="text-sm font-bold text-slate-900 mb-3 tracking-tight">
              Navigation
            </h5>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('dashboard')}
                  className="hover:text-[#C62828] transition text-left"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('students')}
                  className="hover:text-[#C62828] transition text-left"
                >
                  Academics
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('students')}
                  className="hover:text-[#C62828] transition text-left"
                >
                  Admissions
                </button>
              </li>
              <li>
                <span className="hover:text-[#C62828] cursor-pointer transition">
                  School Support &amp; Improvement Department (SSID)
                </span>
              </li>
              <li>
                <span className="hover:text-[#C62828] cursor-pointer transition">
                  Trainings
                </span>
              </li>
              <li>
                <span className="hover:text-[#C62828] cursor-pointer transition">
                  Youth Programmes
                </span>
              </li>
              <li>
                <span className="hover:text-[#C62828] cursor-pointer transition">
                  Become a Franchise
                </span>
              </li>
              <li>
                <span className="hover:text-[#C62828] cursor-pointer transition">
                  Our Campuses
                </span>
              </li>
              <li>
                <span className="hover:text-[#C62828] cursor-pointer transition">
                  Contact Us
                </span>
              </li>
            </ul>
          </div>

          {/* Column 3: Follow Us */}
          <div>
            <h5 className="text-sm font-bold text-slate-900 mb-3 tracking-tight">
              Follow Us
            </h5>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#C62828] transition flex items-center gap-2"
                >
                  <Facebook className="h-3.5 w-3.5 text-[#C62828]" />
                  <span>Facebook</span>
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#C62828] transition flex items-center gap-2"
                >
                  <Instagram className="h-3.5 w-3.5 text-[#C62828]" />
                  <span>Instagram</span>
                </a>
              </li>
              <li>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#C62828] transition flex items-center gap-2"
                >
                  <Youtube className="h-3.5 w-3.5 text-[#C62828]" />
                  <span>YouTube</span>
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#C62828] transition flex items-center gap-2"
                >
                  <Linkedin className="h-3.5 w-3.5 text-[#C62828]" />
                  <span>LinkedIn</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Head Office */}
          <div>
            <h5 className="text-sm font-bold text-slate-900 mb-3 tracking-tight">
              Head Office
            </h5>
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#C62828] shrink-0 mt-0.5" />
                <span>
                  31-Gurumangat Road, Industrial Area, Gulberg III, Lahore, Pakistan
                </span>
              </p>
              <p className="flex items-center gap-2 pt-1">
                <Phone className="h-3.5 w-3.5 text-[#C62828] shrink-0" />
                <span>+92 (42) 111 111 TSS (877)</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[#C62828] shrink-0" />
                <span className="truncate">smartinfo@thesmartschools.edu.pk</span>
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar matching screenshot */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-medium">
              © {new Date().getFullYear()} <strong className="text-slate-800">The Smart School</strong>
            </span>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-4 text-slate-600">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-[#C62828] transition" aria-label="Facebook">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-[#C62828] transition" aria-label="Instagram">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-[#C62828] transition" aria-label="YouTube">
              <Youtube className="h-4 w-4" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-[#C62828] transition" aria-label="LinkedIn">
              <Linkedin className="h-4 w-4" />
            </a>
          </div>

          {/* Website by & Back to top */}
          <div className="flex items-center gap-4 text-xs">
            <span>Website by <strong className="text-slate-700">4M</strong></span>
            <span className="text-slate-300">•</span>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 font-semibold text-slate-700 hover:text-[#C62828] transition"
            >
              <span>Back to Top</span>
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
