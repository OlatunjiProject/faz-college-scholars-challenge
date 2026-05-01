import { Link } from "react-router-dom";
import { ChevronRight, Calendar, MapPin, Trophy, GraduationCap, Users, BrainCircuit, Phone, Mail } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              {/* Logo Replacement */}
              <div className="w-12 h-12 flex items-center justify-center bg-white shadow-sm overflow-hidden">
                 <img src="https://i.postimg.cc/s2y1xL74/logo.jpg" alt="FAZ College" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl text-royal tracking-tight uppercase leading-none mt-1">
                  Faz College
                </span>
                <span className="text-[10px] uppercase tracking-widest text-brand-red font-bold">Nothing But Excellence</span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <Link to="/" className="text-sm font-bold text-royal hover:text-brand-red transition-colors relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-brand-red">
                Home
              </Link>
              <Link to="/exam" className="text-sm font-medium text-slate-500 hover:text-royal transition-colors">
                Student Login
              </Link>
              <Link to="/admin" className="text-sm font-medium text-slate-500 hover:text-royal transition-colors">
                Admin Panel
              </Link>
              <Link
                to="/register"
                className="bg-brand-red hover:bg-red-700 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center"
              >
                Register Now <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="relative bg-gradient-to-br from-royal via-blue-900 to-indigo-900 overflow-hidden">
          {/* Default texture fallback */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
          
          {/* Logo Watermark */}
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10 pointer-events-none select-none">
            <img src="https://i.postimg.cc/s2y1xL74/logo.jpg" alt="" className="w-full h-full object-cover sm:object-contain sm:w-[800px] sm:h-[800px]" />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-48 relative z-10 flex flex-col items-center justify-center text-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="max-w-4xl flex flex-col items-center"
            >
              <span className="inline-flex items-center py-1.5 px-4 rounded-full bg-slate-900/40 border border-slate-700/50 text-blue-200 text-sm font-semibold mb-8 uppercase tracking-wider shadow-sm backdrop-blur-sm">
                <BrainCircuit className="w-4 h-4 mr-2" /> The Ultimate Academic Showdown
              </span>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-white tracking-tight mb-8 drop-shadow-md">
                Faz Scholars Challenge <span className="text-brand-red inline-block transform hover:scale-110 transition-transform">2.0</span>
              </h1>
              <p className="text-xl text-blue-100 mx-auto leading-relaxed mb-12 max-w-3xl font-medium">
                Step into the arena of intellect. The Faz Scholars Challenge is a nationwide quiz competition designed to discover, celebrate, and reward the brightest minds. Engage in thrilling academic battles across Mathematics, Sciences, and General Knowledge. Do you have what it takes to be the next grand scholar?
              </p>
              <div className="flex justify-center mt-4">
                <a
                  href="#faz-scholars-2"
                  className="px-10 py-5 bg-white text-royal hover:bg-slate-100 rounded-full font-bold text-xl transition-all shadow-xl flex items-center justify-center w-full sm:w-auto"
                >
                  Read More
                </a>
              </div>
            </motion.div>
          </div>
          
        </div>

        {/* History / Info Section (Replaced Video with Images & Content) */}
        <section id="history" className="py-24 bg-slate-50 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold text-royal mb-4 tracking-tight">The Legacy of Excellence</h2>
              <div className="w-24 h-1.5 bg-brand-red rounded-full mx-auto"></div>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-3xl font-bold text-slate-800 mb-6">Faz Scholars Challenge 1.0 Recap</h3>
                <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                  The inaugural Faz Scholars Challenge transformed the educational landscape, bringing together over 5,000 prodigious students. It wasn't just an exam; it was a festival of intellect. Students tackled mind-bending analytical questions, logic puzzles, and core subject challenges.
                </p>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-royal mb-2 flex items-center"><Users className="w-5 h-5 mr-2 text-brand-red"/> Nationwide Participation</h4>
                  <p className="text-slate-600 text-sm">We witnessed entries from over 50 prominent schools. The energy, the rivalry, and the ultimate camaraderie formed the bedrock of Faz College's academic community.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-royal mb-2 flex items-center"><Trophy className="w-5 h-5 mr-2 text-yellow-500"/> Unprecedented Rewards</h4>
                  <p className="text-slate-600 text-sm">Top scholars didn't just walk away with pride. They secured over ₦5 Million in combined cash prizes and our highly coveted 100% Tuition Scholarships, ensuring their brilliant futures are fully funded.</p>
                </div>
              </div>
              
              {/* Picture Collage Banners */}
              <div className="relative h-full flex items-center justify-center p-4">
                 <div className="absolute inset-0 bg-gradient-to-tr from-brand-red/20 to-royal/20 rounded-3xl transform translate-x-4 translate-y-4 -z-10"></div>
                 <img src="https://i.postimg.cc/52mQB1xZ/banner.jpg" alt="Faz Scholars Challenge Banner" className="w-full h-auto object-contain rounded-2xl shadow-xl border-4 border-white" />
              </div>
            </div>
          </div>
        </section>

        {/* Faz Scholars Challenge 2.0 */}
        <section id="faz-scholars-2" className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold text-royal mb-4 tracking-tight">Faz Scholars Challenge <span className="text-brand-red">2.0</span></h2>
              <div className="w-24 h-1.5 bg-brand-red rounded-full mx-auto mb-6"></div>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                Bigger, better, and more competitive. This year, we are taking the challenge to new heights.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Picture Collage Banners for 2.0 */}
              <div className="grid grid-cols-2 gap-4 h-full relative order-last lg:order-first">
                 <div className="absolute inset-0 bg-gradient-to-bl from-brand-red/10 to-royal/10 rounded-3xl transform -translate-x-4 translate-y-4 -z-10"></div>
                 <div className="space-y-4">
                   <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80" alt="Students focused" className="w-full h-48 object-cover rounded-2xl shadow-lg border-2 border-slate-100" />
                   <img src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80" alt="Teamwork" className="w-full h-64 object-cover rounded-2xl shadow-lg border-2 border-slate-100" />
                 </div>
                 <div className="space-y-4 pt-12">
                   <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80" alt="Group discussion" className="w-full h-64 object-cover rounded-2xl shadow-lg border-2 border-slate-100" />
                   <img src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80" alt="Library" className="w-full h-48 object-cover rounded-2xl shadow-lg border-2 border-slate-100" />
                 </div>
              </div>

              <div>
                <h3 className="text-3xl font-bold text-slate-800 mb-6">What to Expect in 2.0</h3>
                <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                  Version 2.0 introduces harder questions, broader topics, and a live broadcast finale. We are searching for students who don't just memorize, but who understand and apply knowledge creatively.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <GraduationCap className="w-6 h-6 text-brand-red shrink-0 mr-3 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800">Advanced Curriculum</p>
                      <p className="text-slate-600 text-sm">Covering standard topics plus deep dives into cutting-edge scientific developments.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Trophy className="w-6 h-6 text-yellow-500 shrink-0 mr-3 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800">Bigger Prize Pool</p>
                      <p className="text-slate-600 text-sm">Expanded to include the top 10 finalists, with laptops and larger cash rewards.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Users className="w-6 h-6 text-royal shrink-0 mr-3 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800">Live Stage Finale</p>
                      <p className="text-slate-600 text-sm">Experience the thrill of a live-audience quiz show for the ultimate showdown.</p>
                    </div>
                  </li>
                </ul>
                <div className="flex">
                  <Link
                    to="/register"
                    className="px-8 py-4 bg-brand-red hover:bg-red-700 text-white rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-md flex items-center justify-center w-full sm:w-auto"
                  >
                    Register Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Procedure & Timeline */}
        <section className="py-24 bg-white border-t border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-royal mb-4 tracking-tight">Event Details & Timeline</h2>
            <p className="text-slate-500 max-w-2xl mx-auto mb-16">Mark your calendars. The journey to becoming a Faz Scholar is structured in rigorous but rewarding phases.</p>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Box 1 */}
              <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100 hover:shadow-xl transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-125"></div>
                <Calendar className="w-12 h-12 text-brand-red mb-6 mx-auto relative z-10" />
                <h3 className="text-xl font-bold text-royal mb-3 relative z-10">Important Dates</h3>
                <p className="text-slate-600 relative z-10 text-sm">Valid Registration closes Nov 15th.<br/>Stage 1 Live Exams begin Dec 1st.</p>
              </div>

              {/* Box 2 */}
              <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100 hover:shadow-xl transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-royal/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-125"></div>
                <MapPin className="w-12 h-12 text-royal mb-6 mx-auto relative z-10" />
                <h3 className="text-xl font-bold text-royal mb-3 relative z-10">Venue</h3>
                <p className="text-slate-600 relative z-10 text-sm">Stage 1: Dedicated Online Portal.<br/>Grand Finale: Faz College Campus.</p>
              </div>

              {/* Box 3 */}
              <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100 hover:shadow-xl transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-125"></div>
                <Trophy className="w-12 h-12 text-yellow-500 mb-6 mx-auto relative z-10" />
                <h3 className="text-xl font-bold text-royal mb-3 relative z-10">Prizes</h3>
                <p className="text-slate-600 relative z-10 text-sm">₦300k, ₦200k, ₦100k plus guaranteed 100% Tuition Scholarships for top 3.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Action Call */}
        <section className="py-20 bg-brand-red">
          <div className="max-w-4xl mx-auto px-4 text-center">
             <h2 className="text-3xl font-bold text-white mb-6">Ready to Take on the Challenge?</h2>
             <Link to="/register" className="inline-block px-10 py-4 bg-white text-brand-red rounded-full font-bold text-lg hover:bg-slate-100 transition-colors shadow-lg">Register Now</Link>
          </div>
        </section>

        {/* Contact Info */}
        <section className="py-16 bg-white shrink-0 items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 text-center">
             <h2 className="text-2xl font-bold text-royal mb-10 tracking-tight">Contact Information</h2>
             <div className="flex flex-col md:flex-row justify-center items-start md:items-center gap-10 text-slate-600">
                <div className="flex flex-col items-center flex-1">
                   <div className="w-12 h-12 rounded-full bg-brand-red/10 flex items-center justify-center mb-4">
                     <MapPin className="w-6 h-6 text-brand-red" />
                   </div>
                   <p className="font-bold text-slate-900 mb-1">Address</p>
                   <p className="text-sm text-slate-500 text-center">123 Faz College Avenue,<br/>Ikeja, Lagos State, Nigeria</p>
                </div>
                <div className="flex flex-col items-center flex-1">
                   <div className="w-12 h-12 rounded-full bg-brand-red/10 flex items-center justify-center mb-4">
                     <Phone className="w-6 h-6 text-brand-red" />
                   </div>
                   <p className="font-bold text-slate-900 mb-1">Phone</p>
                   <p className="text-sm text-slate-500 text-center">+234 (0) 123 456 7890<br/>+234 (0) 098 765 4321</p>
                </div>
                <div className="flex flex-col items-center flex-1">
                   <div className="w-12 h-12 rounded-full bg-brand-red/10 flex items-center justify-center mb-4">
                     <Mail className="w-6 h-6 text-brand-red" />
                   </div>
                   <p className="font-bold text-slate-900 mb-1">Email</p>
                   <p className="text-sm text-slate-500 text-center">info@fazcollege.dummy<br/>admissions@fazcollege.dummy</p>
                </div>
             </div>
          </div>
        </section>

        {/* T&Cs */}
        <section className="py-16 bg-slate-900 text-slate-300">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Terms and Conditions</h4>
            <p className="opacity-70 leading-relaxed mb-6 max-w-2xl mx-auto flex flex-col items-center">
              <span>Participation in the Faz Scholars Challenge 2.0 implies acceptance of our strict zero-malpractice policy. Any form of impersonation or cheating will lead to immediate portal deactivation.</span>
            </p>
            <p className="opacity-40">© 2026 Faz College. All Rights Reserved. Nothing But Excellence.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
