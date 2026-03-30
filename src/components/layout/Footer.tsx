import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PhoneIcon, MailIcon, MapPinIcon, ExternalLinkIcon, HeartIcon, ChevronDownIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Footer = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <footer className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
      <div className="w-full py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="flex flex-col md:grid md:grid-cols-3 gap-8 justify-items-center text-center md:text-left">
          <div className="w-full flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start">
              <div className="p-2 bg-white rounded-lg">
                <img className="h-10 w-auto" src="/DepED-Logo.jpg" alt="DEPED Logo" />
              </div>
              <span className="ml-3 text-xl font-bold">
                ALS <span className="text-blue-300">Enroll</span>
                <span className="text-red-300">ment</span>
              </span>
            </div>
            <p className="mt-4 text-sm text-blue-200">
              Alternative Learning System (ALS) of the Department of Education,
              Hamtic, Antique. Providing educational opportunities for all.
            </p>
            {/* 
            <div className="flex flex-wrap gap-2 mt-6 justify-center md:justify-start">
              <SocialButton icon={<FacebookIcon className="h-5 w-5" />} />
              <SocialButton icon={<TwitterIcon className="h-5 w-5" />} />
              <SocialButton icon={<InstagramIcon className="h-5 w-5" />} />
              <SocialButton icon={<YoutubeIcon className="h-5 w-5" />} />
              <SocialButton icon={<LinkedinIcon className="h-5 w-5" />} />
            </div> 
            */}
          </div>
          
          <div className="w-full">
            <button 
              onClick={() => toggleSection('links')}
              className="w-full flex justify-between items-center md:hidden pb-2 border-b border-blue-700 text-sm font-semibold tracking-wider uppercase touch-target"
            >
              Quick Links
              <ChevronDownIcon className={`h-5 w-5 transition-transform ${openSection === 'links' ? 'rotate-180' : ''}`} />
            </button>
            <h3 className="hidden md:block text-sm font-semibold text-white tracking-wider uppercase pb-2 border-b border-blue-700">
              Quick Links
            </h3>
            
            <AnimatePresence initial={false}>
              {(openSection === 'links' || typeof window !== 'undefined' && window.innerWidth >= 768) && (
                <motion.ul 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 space-y-2 overflow-hidden md:!h-auto md:!opacity-100 flex flex-col items-center md:items-start"
                >
                  <FooterLink to="/">Home</FooterLink>
                  <FooterLink to="/enrollment">Enroll Now</FooterLink>
                  <FooterLink to="/about">About ALS</FooterLink>
                  <FooterLink to="/contact">Contact Us</FooterLink>
                  <FooterLink to="/login">Student Login</FooterLink>
                  <FooterLink to="/admin/login">Admin Login</FooterLink>
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
          
          <div className="w-full">
            <button 
              onClick={() => toggleSection('contact')}
              className="w-full flex justify-between items-center md:hidden pb-2 border-b border-blue-700 text-sm font-semibold tracking-wider uppercase touch-target"
            >
              Contact
              <ChevronDownIcon className={`h-5 w-5 transition-transform ${openSection === 'contact' ? 'rotate-180' : ''}`} />
            </button>
            <h3 className="hidden md:block text-sm font-semibold text-white tracking-wider uppercase pb-2 border-b border-blue-700">
              Contact
            </h3>
            
            <AnimatePresence initial={false}>
              {(openSection === 'contact' || typeof window !== 'undefined' && window.innerWidth >= 768) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden md:!h-auto md:!opacity-100"
                >
                  <ul className="mt-4 space-y-4">
                    <li className="flex items-start justify-center md:justify-start">
                      <MapPinIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-blue-200 text-sm text-left">
                        DEPED Office, Hamtic, Antique, Philippines
                      </span>
                    </li>
                    <li className="flex items-center justify-center md:justify-start">
                      <PhoneIcon className="h-5 w-5 text-red-400 mr-2" />
                      <span className="text-blue-200 text-sm">
                        (+63) 123-456-7890
                      </span>
                    </li>
                    <li className="flex items-center justify-center md:justify-start">
                      <MailIcon className="h-5 w-5 text-red-400 mr-2" />
                      <span className="text-blue-200 text-sm">
                        als.hamtic@deped.gov.ph
                      </span>
                    </li>
                  </ul>
                  <div className="mt-6 p-4 bg-blue-800 rounded-lg border border-blue-700 text-left">
                    <h4 className="font-medium text-white text-sm">Office Hours</h4>
                    <p className="mt-2 text-xs text-blue-200">
                      Monday - Friday: 8:00 AM - 5:00 PM
                      <br />
                      Saturday: 8:00 AM - 12:00 PM
                      <br />
                      Sunday: Closed
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="mt-12 border-t border-blue-700 pt-8 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
          <p className="text-sm text-blue-300">
            © {new Date().getFullYear()} Department of Education - Alternative
            Learning System, Hamtic, Antique. All rights reserved.
          </p>
          <div className="flex items-center justify-center text-blue-300 mt-2 md:mt-0">
            <span className="text-xs">Made with</span>
            <HeartIcon className="h-4 w-4 mx-1 text-red-400" />
            <span className="text-xs">for education</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

const FooterLink = ({ children, to }: { children: React.ReactNode; to: string }) => {
  return (
    <li className="w-full">
      <Link to={to} className="text-blue-200 hover:text-white text-sm flex items-center group touch-target w-full md:w-auto justify-center md:justify-start">
        <span className="transform transition-transform duration-150 group-hover:translate-x-1">
          {children}
        </span>
        <ExternalLinkIcon className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
      </Link>
    </li>
  );
};

export default Footer;