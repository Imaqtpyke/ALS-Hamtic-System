import { UsersIcon, TargetIcon, AwardIcon, ClipboardCheckIcon, ArrowRightIcon } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* Hero Section */}
      <section className="relative bg-[#0038A8] text-white overflow-hidden">
        {/* Decorative blur elements for tonal depth without lines */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -left-10 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute top-20 -right-14 w-80 h-80 bg-[#E2231A]/10 rounded-full blur-3xl"></div>
          </div>
        </div>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
           <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center max-w-7xl mx-auto">
             <div className="md:col-span-3 text-center md:text-left">
               <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-sm font-semibold text-white mb-6 border border-white/10">
                  Alternative Learning System
               </div>
               <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight leading-tight">
                 Quality Education for <span className="text-white opacity-90">All in Hamtic</span>
               </h1>
               <p className="mt-6 text-xl text-blue-100 max-w-2xl font-medium">
                 The ALS program in Hamtic, Antique gives out-of-school youth and adults the opportunity to complete their basic education — no matter their age or situation.
               </p>
             </div>
             <div className="md:col-span-2 hidden md:block">
                <div className="relative w-full aspect-square max-w-md mx-auto">
                  <div className="absolute inset-0 bg-white/5 rounded-full blur-[80px]"></div>
                  <svg viewBox="0 0 300 240" className="w-full h-auto relative z-10" aria-hidden="true">
                    <rect x="20" y="20" width="260" height="200" rx="16" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.1" />
                    <rect x="40" y="50" width="160" height="12" rx="6" fill="#E2231A" />
                    <rect x="40" y="75" width="220" height="8" rx="4" fill="white" fillOpacity="0.3" />
                    <rect x="40" y="95" width="180" height="8" rx="4" fill="white" fillOpacity="0.3" />
                    <circle cx="240" cy="180" r="30" fill="#E2231A" fillOpacity="0.8" />
                  </svg>
                </div>
             </div>
           </div>
        </div>
      </section>

      {/* Mission & Vision (Tonal Layering, Expansive White Space) */}
      <section className="py-16 md:py-24">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
            <div className="card-tonal p-8 sm:p-10">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-[#0038A8]/10 rounded-xl mr-4">
                  <TargetIcon className="h-6 w-6 text-[#0038A8]" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 font-display">
                  Our Mission
                </h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                To provide quality, accessible basic education for out-of-school
                children, youth, and adults through alternative learning
                interventions, enabling them to improve their quality of life
                and contribute meaningfully to community development and
                nation-building.
              </p>
            </div>
            
            <div className="surface-tonal rounded-2xl p-8 sm:p-10 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-[#E2231A]/10 rounded-xl mr-4">
                  <AwardIcon className="h-6 w-6 text-[#E2231A]" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 font-display">
                  Our Vision
                </h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                We envision a community where all citizens of Hamtic, Antique
                have access to quality basic education, regardless of age,
                socioeconomic status, or personal circumstances, empowering them
                to achieve their full potential and contribute to sustainable
                development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What is ALS */}
      <section className="py-16 md:py-20 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-[#0038A8] font-display">
              Understanding ALS
            </h2>
             <div className="h-1.5 w-20 bg-[#E2231A] mx-auto mt-6 rounded-full"></div>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              ALS is a free government program that lets you study and get a diploma even if you didn't finish regular school.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed font-medium">
                ALS serves those who cannot access formal education in schools.
                It aims to:
              </p>
              <ul className="space-y-5">
                {[
                  'Learn how to read, write, and count better.',
                  'Get a certificate that is equal to regular school.',
                  'Prepare for college, a job, or starting a business.',
                  'Learn new skills to improve your daily life.',
                  'Help your family and community more effectively.',
                ].map((item, index) => (
                  <li key={index} className="flex items-start bg-gray-50 p-4 rounded-xl">
                    <ClipboardCheckIcon className="h-6 w-6 text-[#0038A8] mr-4 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="card-tonal p-8 sm:p-10 border-t-4 border-[#0038A8]">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 font-display">
                Who is ALS for?
              </h3>
              <div className="space-y-6">
                {[
                  { title: 'Out-of-school youth', desc: 'Individuals aged 15-30 who are not enrolled in school' },
                  { title: 'Adult learners', desc: 'Those who want to finish elementary or secondary education' },
                  { title: 'Indigenous peoples', desc: 'Members of indigenous communities seeking basic education' },
                  { title: 'Persons with disabilities', desc: 'Individuals with special educational needs' },
                  { title: 'Working individuals', desc: 'People who need flexible learning options' },
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className="bg-[#E2231A]/10 rounded-full p-2.5 mr-4 flex-shrink-0">
                      <UsersIcon className="h-5 w-5 text-[#E2231A]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">
                        {item.title}
                      </h4>
                      <p className="text-gray-600 mt-1">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Certification and Equivalency */}
      <section className="py-16 md:py-24 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="card-tonal p-8 sm:p-12 md:p-16 border-t-[6px] border-[#0038A8]">
             <div className="text-center mb-10">
               <span className="bg-[#E2231A]/10 text-red-600 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-4 inline-block">Official DepEd Accreditation</span>
               <h2 className="text-4xl font-black text-gray-900 font-display mt-4">
                 Certification & Equivalency
               </h2>
               <p className="mt-4 text-xl text-gray-600">
                 Learners earn official certifications recognized nationwide.
               </p>
             </div>
             
             <div className="bg-[var(--surface-low)] rounded-2xl p-6 sm:p-8 mb-8">
               <h3 className="text-2xl font-bold text-gray-900 mb-4 font-display">
                 Accreditation and Equivalency (A&E) Test
               </h3>
               <p className="text-lg text-gray-700 leading-relaxed mb-6">
                 Upon completing the ALS program, learners can take the A&E Test to
                 receive certification equivalent to elementary or junior high
                 school completion.
               </p>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm">
                   <h4 className="font-bold text-[#0038A8] text-lg mb-2">Elementary Level</h4>
                   <p className="text-gray-600">Equivalent to Grade 6 completion.</p>
                 </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm">
                   <h4 className="font-bold text-[#0038A8] text-lg mb-2">Junior High Level</h4>
                   <p className="text-gray-600">Equivalent to Grade 10 completion.</p>
                 </div>
               </div>
             </div>
             
             <div>
                <p className="font-bold text-gray-900 text-lg mb-4">Core Benefits:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    'Qualify for admission to higher education',
                    'Meet requirements for employment',
                    'Officially recognized by government agencies'
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-start bg-gray-50 p-4 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-[#E2231A] mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-700 font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-[#0038A8] text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#E2231A]/30 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-white font-display mb-6">
            Ready to Sign Up?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Starting is easy. Fill out the online enrollment form and the ALS Hamtic coordinator will review your application and guide you through the next steps.
          </p>
          <a href="/enrollment" className="btn-cta text-lg px-8 py-4 inline-flex items-center group">
             Start Enrollment
             <ArrowRightIcon className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>
    </div>
  );
};
export default About;
