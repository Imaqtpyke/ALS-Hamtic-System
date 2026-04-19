import { Link } from 'react-router-dom';
import { UserPlus as UserPlusIcon, Shield as ShieldIcon, ChevronRight as ChevronRightIcon, CheckCircle as CheckCircleIcon, FileText as FileTextIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  return <div className="w-full">
      {/* Hero Section */}
      <section className="relative bg-[#0038A8] text-white overflow-hidden">
        {/* Background Pattern - Absolute Precision */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -left-10 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute top-40 right-10 w-80 h-80 bg-[#E2231A]/10 rounded-full blur-3xl"></div>
          </div>
        </div>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative z-10 md:col-span-3 pt-6 md:pt-0"
            >
              <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-sm font-semibold text-red-300 mb-6 border border-white/10">
                Official DepEd Hamtic ALS Portal
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15] font-display">
                Your Future Begins with the<br />
                <span className="text-red-400">Alternative Learning System</span>
              </h1>
              <p className="mt-8 text-xl text-blue-50/90 max-w-2xl leading-relaxed">
                Residents of Hamtic, Antique can now enroll in the Alternative Learning System online — no need to visit the DepEd office in person.
              </p>
              <div className="mt-12 flex flex-col sm:flex-row gap-5">
                <Link
                  to="/enrollment"
                  className="btn-cta text-lg px-8 py-4"
                >
                  Start Enrollment
                  <ChevronRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/20 backdrop-blur-sm transition-all touch-target"
                >
                  Learn About ALS
                </Link>
              </div>
            </motion.div>
            {/* Academic Illustration */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="md:col-span-2 hidden md:block relative"
            >
              <div className="absolute inset-0 bg-blue-400/20 blur-[100px] rounded-full"></div>
              <svg viewBox="0 0 300 240" className="w-full h-auto relative z-10" aria-hidden>
                <rect x="20" y="20" width="260" height="200" rx="16" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.1" />
                <rect x="40" y="50" width="160" height="12" rx="6" fill="#E2231A" />
                <rect x="40" y="75" width="220" height="8" rx="4" fill="white" fillOpacity="0.3" />
                <rect x="40" y="95" width="180" height="8" rx="4" fill="white" fillOpacity="0.3" />
                <circle cx="240" cy="180" r="30" fill="#E2231A" fillOpacity="0.8" />
                <path d="M230 180L237 187L250 174" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section - The Editorial Layout */}
      <section className="py-20 bg-[#F9F9F9]">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-[#0038A8] font-bold tracking-widest uppercase text-xs">
              What You Can Do Here
            </span>
            <h2 className="text-4xl font-black text-gray-900 mt-3 font-display">
              Simple Steps to Get Started
            </h2>
            <div className="h-1.5 w-20 bg-[#E2231A] mx-auto mt-6 rounded-full"></div>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[{
            icon: <FileTextIcon className="h-6 w-6 text-[#0038A8]" />,
            title: 'Online Application',
            description: 'Apply from any location. Our structured form ensures your data is captured accurately.'
          }, {
            icon: <CheckCircleIcon className="h-6 w-6 text-[#0038A8]" />,
            title: 'Direct Communication',
            description: 'Receive real-time system announcements and updates directly from the ALS Hamtic Coordinator.'
          }, {
            icon: <ShieldIcon className="h-6 w-6 text-[#0038A8]" />,
            title: 'Privacy Focus',
            description: 'Your personal information is handled with security and respect for your privacy.'
          }].map((feature, index) => <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                key={index} 
                className="card-tonal p-8"
              >
                <div className="rounded-2xl w-14 h-14 bg-blue-50 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* How it Works - Tonal High Contrast */}
      <section className="py-20 bg-[#0038A8] overflow-hidden relative">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-blue-800 rounded-full opacity-20"></div>
        <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-xl">
              <span className="text-red-600 font-bold tracking-widest uppercase text-xs">
                How It Works
              </span>
              <h2 className="text-4xl font-black text-white mt-3 font-display">
                Your 4-Step Journey
              </h2>
            </div>
            <p className="text-blue-100 text-lg md:text-right max-w-sm">
              We’ve streamlined the enrollment process to get you back to learning faster.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[{
            step: '01',
            title: 'Register',
            description: 'Create your secure account using a valid email address.',
            icon: <UserPlusIcon className="h-6 w-6" />
          }, {
            step: '02',
            title: 'Fill Form',
            description: 'Complete the digital enrollment questionnaire completely and accurately.',
            icon: <FileTextIcon className="h-6 w-6" />
          }, {
            step: '03',
            title: 'Assessment',
            description: 'Our coordinators will review your application. You may receive a message if any information needs to be corrected.',
            icon: <ShieldIcon className="h-6 w-6" />
          }, {
            step: '04',
            title: 'Result',
            description: 'Check your dashboard for your approval status and subject assignments.',
            icon: <CheckCircleIcon className="h-6 w-6" />
          }].map((item, index) => <div key={index} className="relative group">
                <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-all duration-500 h-full">
                  <div className="flex justify-between items-start mb-8">
                    <span className="text-4xl font-black text-white/20 group-hover:text-red-400/40 transition-colors duration-500">
                      {item.step}
                    </span>
                    <div className="p-3 bg-white/10 rounded-2xl text-red-400">
                      {item.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-blue-100/80 leading-relaxed font-medium">
                    {item.description}
                  </p>
                </div>
                {index < 3 && <div className="hidden lg:block absolute top-[25%] -right-4 w-8 h-0.5 bg-white/20 z-10"></div>}
              </div>)}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-white relative">
        <div className="w-full px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-4xl mx-auto card-tonal bg-[#0038A8] p-12 md:p-16 relative overflow-hidden">
            {/* Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight font-display mb-8 relative z-10">
              Education is the key to<br /><span className="text-red-400">a better future.</span>
            </h2>
            <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto relative z-10">
              Many residents of Hamtic have continued their education through ALS. Start your journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
              <Link to="/enrollment" className="btn-cta text-xl px-10 py-5">
                Join Now
              </Link>
              <Link to="/contact" className="inline-flex items-center justify-center px-10 py-5 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all border border-white/20">
                Contact Coordinator
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>;
};
export default Home;