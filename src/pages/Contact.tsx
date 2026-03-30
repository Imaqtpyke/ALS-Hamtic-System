import React, { useState } from 'react';
import { MapPinIcon, PhoneIcon, MailIcon, ClockIcon, CheckCircleIcon, ArrowRightIcon, MessageSquareIcon, HelpCircleIcon, ChevronDownIcon } from 'lucide-react';
import ContactMap from '../components/ContactMap';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const {
      name,
      value
    } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTimeout(() => {
      setFormSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    }, 1000);
  };
  
  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };
  
  const faqs = [{
    question: 'Who can enroll in the ALS program?',
    answer: 'Anyone who is unable to attend or complete formal basic education can enroll in ALS. This includes out-of-school youth, adults, persons with disabilities, indigenous peoples, and working individuals who need flexible learning options.'
  }, {
    question: 'How long does it take to complete the ALS program?',
    answer: "The duration varies depending on the learner's prior knowledge, skills, and the amount of time they can dedicate to learning. On average, it takes 5-10 months to prepare for the A&E test, but this can be shorter or longer based on individual circumstances."
  }, {
    question: 'Is there a fee to enroll in ALS?',
    answer: 'No, the ALS program is provided free of charge by the Department of Education. However, learners may need to provide their own basic learning materials like notebooks and writing implements.'
  }, {
    question: 'What documents do I need to enroll in ALS?',
    answer: 'Basic requirements include a birth certificate, a recent ID photo, and any available previous school records. However, lack of documentation should not be a barrier to enrollment - our staff can assist with alternative verification processes.'
  }, {
    question: 'What is the A&E Test and when is it conducted?',
    answer: "The Accreditation and Equivalency (A&E) Test is a national assessment that certifies ALS learners' competencies. It's usually conducted once or twice a year, with schedules announced by DepEd. Passing this test provides certification equivalent to elementary or junior high school completion."
  }, {
    question: 'Can I use my ALS certification to continue to higher education?',
    answer: 'Yes, ALS certification through the A&E Test is recognized for admission to the next level of formal education. Elementary level passers can proceed to junior high school, while junior high school level passers can proceed to senior high school.'
  }];
  
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* Hero Section */}
      <section className="bg-[#0038A8] text-white relative overflow-hidden">
        {/* Background Tonal Blurs */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-15">
             <div className="absolute top-10 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
             <div className="absolute bottom-20 left-10 w-80 h-80 bg-[#E2231A]/20 rounded-full blur-[100px]"></div>
          </div>
        </div>
        
        <div className="w-full px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center max-w-7xl mx-auto">
            <div className="md:col-span-3 text-center md:text-left">
              <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-sm font-semibold text-[#ffffff] mb-6 border border-white/10">
                Support & Inquiries
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-display tracking-tight leading-tight">
                Connect With Us
              </h1>
              <p className="mt-6 text-xl text-blue-100 max-w-2xl leading-relaxed">
                Get in touch with the Alternative Learning System team in Hamtic,
                Antique. We're here to guide your educational journey.
              </p>
              
              <div className="mt-10 flex flex-wrap justify-center md:justify-start gap-8">
                <div className="flex flex-col items-center md:items-start group">
                  <div className="p-3 bg-white/5 rounded-2xl mb-3 group-hover:bg-[#E2231A] transition-colors duration-300">
                    <PhoneIcon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-blue-100/70 text-sm font-medium tracking-wide uppercase">Call Us</span>
                  <span className="font-bold text-lg text-white mt-1">
                    (+63) 123-456-7890
                  </span>
                </div>
                <div className="flex flex-col items-center md:items-start group">
                  <div className="p-3 bg-white/5 rounded-2xl mb-3 group-hover:bg-[#E2231A] transition-colors duration-300">
                    <MailIcon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-blue-100/70 text-sm font-medium tracking-wide uppercase">Email Us</span>
                  <span className="font-bold text-lg text-white mt-1">
                    als.hamtic@deped.gov.ph
                  </span>
                </div>
              </div>
            </div>
            
            {/* Illustration */}
            <div className="md:col-span-2 hidden md:block">
               <div className="relative w-full aspect-square max-w-sm mx-auto">
                 <div className="absolute inset-0 bg-white/5 rounded-[3rem] rotate-6 transform blur-[40px]"></div>
                 <svg viewBox="0 0 300 240" className="w-full h-auto relative z-10" aria-hidden="true">
                    <rect x="20" y="20" width="260" height="200" rx="16" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.1" />
                    <rect x="50" y="60" width="100" height="12" rx="6" fill="#E2231A" />
                    <rect x="50" y="90" width="200" height="8" rx="4" fill="white" fillOpacity="0.3" />
                    <rect x="50" y="115" width="180" height="8" rx="4" fill="white" fillOpacity="0.3" />
                    <path d="M220 160L230 170L250 150" stroke="#E2231A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                 </svg>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-16 md:py-24 bg-[var(--surface-lowest)]">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
            
            {/* Contact Information */}
            <div className="lg:col-span-2">
              <div className="card-tonal p-8 sm:p-10 h-full">
                <div className="flex items-center mb-10">
                  <div className="p-3 bg-[#0038A8]/10 rounded-xl mr-4">
                    <MessageSquareIcon className="h-6 w-6 text-[#0038A8]" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 font-display">
                    Contact Details
                  </h2>
                </div>
                
                <div className="space-y-10">
                  <div className="flex items-start">
                    <div className="bg-[#E2231A]/10 rounded-xl p-3 mr-5 flex-shrink-0">
                      <MapPinIcon className="h-6 w-6 text-[#E2231A]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">
                        Office Address
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        Department of Education - ALS Program<br />
                        Municipal Hall Complex<br />
                        Hamtic, Antique<br />
                        Philippines 5700
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#0038A8]/10 rounded-xl p-3 mr-5 flex-shrink-0">
                      <PhoneIcon className="h-6 w-6 text-[#0038A8]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">
                        Phone Numbers
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        Main: <span className="font-medium text-gray-800">(+63) 123-456-7890</span><br />
                        Mobile: <span className="font-medium text-gray-800">(+63) 999-888-7777</span><br />
                        Fax: <span className="font-medium text-gray-800">(+63) 123-456-7891</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#E2231A]/10 rounded-xl p-3 mr-5 flex-shrink-0">
                      <MailIcon className="h-6 w-6 text-[#E2231A]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">
                        Email Addresses
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        Inquiries: <span className="font-medium text-gray-800">als.hamtic@deped.gov.ph</span><br />
                        Enrollment: <span className="font-medium text-gray-800">enrollment.als@deped.gov.ph</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#0038A8]/10 rounded-xl p-3 mr-5 flex-shrink-0">
                      <ClockIcon className="h-6 w-6 text-[#0038A8]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">
                        Office Hours
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        Mon-Fri: <span className="font-medium text-gray-800">8:00 AM - 5:00 PM</span><br />
                        Saturday: <span className="font-medium text-gray-800">8:00 AM - 12:00 PM</span><br />
                        Sunday/Holidays: <span className="text-[#E2231A] font-medium">Closed</span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Static Map Image */}
                  <div className="mt-10 overflow-hidden rounded-2xl border-4 border-white shadow-md">
                    <ContactMap />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="surface-tonal rounded-[2rem] p-8 sm:p-12 lg:p-14 h-full">
                <div className="mb-10">
                   <h2 className="text-4xl font-black text-gray-900 font-display tracking-tight">
                     Send Us a Message
                   </h2>
                   <p className="mt-3 text-lg text-gray-600">
                     Fill out the form below and our administrative team will reach out promptly.
                   </p>
                </div>
                
                {formSubmitted ? (
                  <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-[#0038A8]/10 mb-6">
                      <CheckCircleIcon className="h-10 w-10 text-[#0038A8]" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 font-display">
                      Message Delivered
                    </h3>
                    <p className="mt-4 text-xl text-gray-600 max-w-lg mx-auto">
                      Thank you for contacting us. We will get back to you as soon as possible.
                    </p>
                    <button className="mt-8 btn-primary px-8" onClick={() => setFormSubmitted(false)}>
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                          Full Name
                        </label>
                        <input 
                          type="text" id="name" name="name" value={formData.name} onChange={handleChange} 
                          className="block w-full bg-white border-0 border-b-2 border-transparent focus:border-[#0038A8] focus:ring-0 rounded-xl px-5 py-4 text-gray-900 shadow-sm transition-all" 
                          required 
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                          Email Address
                        </label>
                        <input 
                          type="email" id="email" name="email" value={formData.email} onChange={handleChange} 
                          className="block w-full bg-white border-0 border-b-2 border-transparent focus:border-[#0038A8] focus:ring-0 rounded-xl px-5 py-4 text-gray-900 shadow-sm transition-all" 
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                          Phone Number
                        </label>
                        <input 
                          type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} 
                          className="block w-full bg-white border-0 border-b-2 border-transparent focus:border-[#0038A8] focus:ring-0 rounded-xl px-5 py-4 text-gray-900 shadow-sm transition-all" 
                        />
                      </div>
                      <div>
                        <label htmlFor="subject" className="block text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                          Subject
                        </label>
                        <select 
                          id="subject" name="subject" value={formData.subject} onChange={handleChange} 
                          className="block w-full bg-white border-0 border-b-2 border-transparent focus:border-[#0038A8] focus:ring-0 rounded-xl px-5 py-4 text-gray-900 shadow-sm transition-all" 
                          required
                        >
                          <option value="">Select a subject...</option>
                          <option value="enrollment">Enrollment Inquiry</option>
                          <option value="programs">Programs Information</option>
                          <option value="schedule">Class Schedule</option>
                          <option value="documents">Document Requirements</option>
                          <option value="other">Other Inquiry</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                        Message
                      </label>
                      <textarea 
                        id="message" name="message" value={formData.message} onChange={handleChange} rows={5} 
                        className="block w-full bg-white border-0 border-b-2 border-transparent focus:border-[#0038A8] focus:ring-0 rounded-xl px-5 py-4 text-gray-900 shadow-sm transition-all resize-none" 
                        required 
                      />
                    </div>
                    
                    <div className="flex items-start pt-2">
                      <div className="flex items-center h-6">
                         <input 
                          id="privacy" type="checkbox" 
                          className="h-5 w-5 text-[#0038A8] border-gray-300 rounded focus:ring-[#0038A8] focus:ring-offset-0" 
                          required 
                        />
                      </div>
                      <label htmlFor="privacy" className="ml-3 block text-base text-gray-600 font-medium">
                        I agree to the privacy policy and consent to the
                        processing of my personal data for enrollment purposes.
                      </label>
                    </div>
                    
                    <div className="pt-6">
                       <button type="submit" className="btn-primary w-full sm:w-auto px-10 py-4 flex items-center justify-center text-lg">
                         Send Message
                         <ArrowRightIcon className="ml-3 h-5 w-5" />
                       </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-28 bg-[var(--surface-low)]">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#0038A8]/10 text-sm font-bold tracking-wider uppercase text-[#0038A8] mb-4">
              Knowledge Base
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 font-display">
              Frequently Asked Questions
            </h2>
            <div className="h-1.5 w-20 bg-[#E2231A] mx-auto mt-6 rounded-full"></div>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 ease-in-out ${
                  expandedFaq === index ? 'shadow-lg shadow-blue-900/5 ring-1 ring-[#0038A8]/10' : 'shadow-sm hover:shadow-md'
                }`}
              >
                <button 
                  className="w-full px-8 py-6 flex justify-between items-center focus:outline-none" 
                  onClick={() => toggleFaq(index)}
                >
                  <span className="font-bold text-lg text-gray-900 text-left pr-4">
                    {faq.question}
                  </span>
                  <div className={`p-2 rounded-full transition-colors ${expandedFaq === index ? 'bg-[#0038A8]/10' : 'bg-gray-50'}`}>
                    <ChevronDownIcon className={`h-5 w-5 transition-transform duration-300 ${
                      expandedFaq === index ? 'rotate-180 text-[#0038A8]' : 'text-gray-500'
                    }`} />
                  </div>
                </button>
                <div className={`px-8 transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedFaq === index ? 'max-h-96 pb-8 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="h-px w-full bg-gray-100 mb-6"></div>
                  <p className="text-gray-600 text-lg leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 card-tonal bg-white border-l-4 border-[#0038A8] p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <div className="bg-[#0038A8]/10 rounded-full p-4 flex-shrink-0 mr-6">
                <HelpCircleIcon className="h-8 w-8 text-[#0038A8]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 font-display">Need more help?</h3>
                <p className="text-gray-600 mt-2 text-lg">Our team is ready to answer any specific questions you may have.</p>
              </div>
            </div>
            <button className="btn-primary whitespace-nowrap px-8" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Contact Support
            </button>
          </div>
          
        </div>
      </section>
    </div>
  );
};

export default Contact;