import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Phone, GraduationCap, Building, Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Registration() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{studentId: string, password: string} | null>(null);

  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorStatus(null);
    
    // Gather form data
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      
      if (result.success) {
        setSuccessData({ studentId: result.studentId, password: result.password });
      } else {
        setErrorStatus(result.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration failed:", error);
      setErrorStatus("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full mx-auto bg-white p-8 rounded-3xl shadow-xl text-center border border-slate-100"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-royal mb-4 tracking-tight">Registration Complete!</h2>
          <p className="text-slate-600 mb-8">
            An email has been sent to the parent and teacher. Please save your login credentials below:
          </p>
          
          <div className="bg-slate-50 rounded-2xl p-6 text-left mb-8 border border-slate-200">
            <div className="mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Student ID</span>
              <span className="text-xl font-mono font-bold text-royal">{successData.studentId}</span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Password</span>
              <span className="text-xl font-mono font-bold tracking-widest text-slate-800">{successData.password}</span>
            </div>
          </div>

          <Link
            to="/exam"
            className="w-full inline-flex justify-center py-4 px-4 border border-transparent shadow-sm text-sm font-bold rounded-xl text-white bg-royal hover:bg-blue-900 focus:outline-none transition-all"
          >
            Go to Student Portal
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full mx-auto">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-royal mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>
        
        <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100">
          <div className="bg-royal py-8 px-10 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-bl-full -mr-16 -mt-16"></div>
             <h2 className="text-3xl font-extrabold text-white tracking-tight relative z-10">Scholar Registration</h2>
             <p className="text-blue-200 mt-2 relative z-10">Enter details carefully. ID sets are permanent.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-10">
            {errorStatus && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 uppercase tracking-wide">
                {errorStatus}
              </div>
            )}
            {/* Student Section */}
            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-brand-red" /> Student Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                  <input required name="studentName" type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-royal focus:border-transparent transition-colors" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date of Birth</label>
                  <input required name="dob" type="date" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-royal focus:border-transparent transition-colors" />
                </div>
              </div>
            </section>

             <hr className="border-slate-100" />

            {/* Parent Section */}
            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                <Building className="w-5 h-5 mr-2 text-brand-red" /> Guardian / Parent
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Parent Name</label>
                  <input required name="parentName" type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-royal transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                  <input required name="parentEmail" type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-royal transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                  <input required name="parentPhone" type="tel" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-royal transition-colors" />
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* School Section */}
            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-brand-red" /> Academic Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">School Name</label>
                  <input required name="school" type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-royal transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Current Class</label>
                  <select required name="studentClass" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-royal transition-colors">
                    <option value="">Select Class...</option>
                    <option value="Primary 4">Primary 4</option>
                    <option value="Primary 5">Primary 5</option>
                    <option value="Primary 6">Primary 6</option>
                  </select>
                </div>
                <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-100 border-dashed">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">Sponsoring Teacher</span>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Teacher Name</label>
                  <input required name="teacherName" type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-royal transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Teacher Email</label>
                  <input required name="teacherEmail" type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-royal transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Teacher Phone</label>
                  <input required name="teacherPhone" type="tel" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-royal transition-colors" />
                </div>
              </div>
            </section>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-4 px-4 border border-transparent shadow-md text-base font-bold rounded-xl text-white bg-brand-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Complete Registration"}
              </button>
              <p className="text-center text-xs text-slate-500 mt-4">
                By registering, you agree to the Challenge Terms and Conditions.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
