import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, AlertCircle, Loader2, ArrowLeft, BookOpen, BrainCircuit } from "lucide-react";

export default function ExamPortal() {
  const [student, setStudent] = useState<any>(null);
  
  // Login State
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Exam State
  const [examStatus, setExamStatus] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("fazStudent");
    if (stored) {
      setStudent(JSON.parse(stored));
      checkExamStatus();
    }
  }, []);

  useEffect(() => {
    let timer: any;
    if (isStarted && timeLeft > 0 && !isSubmitted) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isStarted && !isSubmitted) {
       handleSubmit(); // Auto submit
    }
    return () => clearInterval(timer);
  }, [isStarted, timeLeft, isSubmitted]);

  const checkExamStatus = async () => {
    try {
      const res = await fetch("/api/exam/status");
      const data = await res.json();
      if(data.success) {
        setExamStatus(data.settings);
      }
    } catch {
      console.log("Error fetching status");
    }
  };

  useEffect(() => {
    if(student && !isStarted && !isSubmitted) {
      const interval = setInterval(() => {
        checkExamStatus();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [student, isStarted, isSubmitted]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, password })
      });
      const data = await res.json();
      if(data.success) {
        setStudent(data.user);
        localStorage.setItem("fazStudent", JSON.stringify(data.user));
        checkExamStatus();
      } else {
        setLoginError(data.message);
      }
    } catch {
      setLoginError("Network error.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("fazStudent");
    setStudent(null);
  };

  const handleStart = async () => {
    try {
      const res = await fetch("/api/exam/questions");
      const data = await res.json();
      if(data.success && data.questions.length > 0) {
        setQuestions(data.questions);
        setTimeLeft(examStatus.timeMinutes * 60);
        setIsStarted(true);
      } else {
        alert("No questions available or exam is offline.");
      }
    } catch {
      alert("Failed to load questions");
    }
  };

  const handleOptionSelect = (qId: string, opt: string) => {
    setAnswers({ ...answers, [qId]: opt });
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1);
  };

  const handleSubmit = async () => {
    if(isSubmitted) return;
    try {
      const response = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, answers })
      });
      const data = await response.json();
      if (data.success) {
        setStudent({ ...student, score: data.score });
        setIsSubmitted(true);
      }
    } catch (e) {
      alert("Submission failed. Retrying...");
    }
  };

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
           <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-royal mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
           </Link>
           <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Student Portal</h2>
           <p className="text-slate-500 text-sm mb-8">Enter your unique ID and password</p>
           
           <form onSubmit={handleLogin} className="space-y-6">
             {loginError && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm font-bold text-center">{loginError}</div>}
             <div>
               <label className="block text-sm font-bold text-slate-700 mb-2">Student ID</label>
               <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-royal" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
             </div>
             <div>
               <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
               <div className="relative">
                 <input required type={showPassword ? "text" : "password"} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-royal" value={password} onChange={(e) => setPassword(e.target.value)} />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-4 flex items-center text-slate-400 font-bold text-xs hover:text-slate-600">
                   {showPassword ? "HIDE" : "SHOW"}
                 </button>
               </div>
             </div>
             <button disabled={isLoggingIn} className="w-full bg-brand-red text-white py-3 rounded-xl font-bold flex justify-center hover:bg-red-700 transition">
               {isLoggingIn ? <Loader2 className="animate-spin w-5 h-5"/> : "Access Portal"}
             </button>
           </form>
        </div>
      </div>
    );
  }

  // Logged in, but deactivated
  if (student.status === "deactivated") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 p-4 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-lg border border-slate-100 max-w-md w-full">
           <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4"/>
           <h2 className="text-2xl font-bold text-slate-800 mb-2">Account Deactivated</h2>
           <p className="text-slate-600 mb-6">You can no longer attempt challenges. You can only view your past progress.</p>
           <button onClick={handleLogout} className="text-brand-red font-bold hover:underline">Logout</button>
        </div>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-lg border border-slate-100 max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-royal mb-4">Exam Submitted!</h2>
          <p className="text-slate-600 mb-6">Your answers have been graded. The admin will announce the results shortly.</p>
          <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-200">
             <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Your Score</p>
             <p className="text-4xl font-black text-royal">{student.score || "0"} <span className="text-xl text-slate-400 font-medium">/ {questions.length}</span></p>
          </div>
          <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors" onClick={handleLogout}>Logout & Return</button>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-10 rounded-3xl shadow-lg max-w-lg w-full text-center border border-slate-100 relative overflow-hidden">
           <div className="absolute top-4 right-4"><button onClick={handleLogout} className="text-sm text-slate-400 hover:text-red-500">Logout</button></div>
           
           <img src="https://i.postimg.cc/s2y1xL74/logo.jpg" alt="FAZ College" className="w-24 h-24 mx-auto mb-6 object-contain" />
           <h2 className="text-2xl font-extrabold text-royal tracking-tight mb-2">Welcome, {student.studentName}!</h2>
           <p className="text-slate-500 font-mono mb-8 text-sm">ID: {student.id}</p>

           {!examStatus ? (
             <div className="flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-royal"/></div>
           ) : !examStatus.isLive ? (
             <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200">
               <h3 className="font-bold text-slate-800 text-lg mb-2">No active challenges</h3>
               <p className="text-slate-600 text-sm">Please visit later when the administrator makes the questions live.</p>
             </div>
           ) : (
             <>
               <div className="bg-blue-50 text-blue-900 p-6 rounded-2xl text-left border border-blue-100 mb-8">
                 <p className="font-bold mb-2 flex items-center"><AlertCircle className="w-4 h-4 mr-2"/> A challenge is LIVE!</p>
                 <ul className="list-disc pl-5 text-sm space-y-1 opacity-80">
                   <li>Questions: {examStatus.questionCount}</li>
                   <li>Time Limit: {examStatus.timeMinutes} Minutes</li>
                   <li>Auto-submit enabled at 00:00</li>
                 </ul>
               </div>
               <div className="flex space-x-4">
                 <button onClick={handleStart} className="flex-1 py-4 bg-brand-red text-white text-lg font-bold rounded-xl hover:bg-red-700 transition">Attempt Now</button>
                 <button onClick={handleLogout} className="flex-1 py-4 bg-slate-100 text-slate-700 text-lg font-bold rounded-xl hover:bg-slate-200 transition">Come Back Later</button>
               </div>
             </>
           )}
        </div>
      </div>
    );
  }

  const question = questions[currentQ];
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center font-bold">
          <span className="text-royal hidden sm:block">Faz Scholars Challenge</span>
          <span className="text-slate-500 font-mono text-sm sm:hidden">{student.id}</span>
          <div className={`flex items-center px-4 py-2 rounded-full border ${timeLeft < 60 ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
            <Clock className="w-4 h-4 mr-2" /> {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-12">
          <div className="mb-8">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Question {currentQ + 1} of {questions.length}</span>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed">{question?.text}</h1>
          </div>

          <div className="space-y-3 mb-10">
             {["A", "B", "C", "D"].map(optLabel => {
               const optionText = question[`option${optLabel}`];
               if(!optionText) return null;
               const isSelected = answers[question.id] === optLabel;
               return (
                  <button
                    key={optLabel}
                    onClick={() => handleOptionSelect(question.id, optLabel)}
                    className={`w-full flex items-center p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected 
                        ? "border-royal bg-blue-50/50 ring-2 ring-royal ring-offset-1 shadow-sm" 
                        : "border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-4 flex-shrink-0 ${isSelected ? "bg-royal text-white" : "bg-slate-100 text-slate-500"}`}>{optLabel}</span>
                    <span className={`text-base font-medium ${isSelected ? "text-royal" : "text-slate-700"}`}>{optionText}</span>
                  </button>
               )
             })}
          </div>

          <div className="flex border-t border-slate-100 pt-8 justify-between items-center">
            <button disabled={currentQ === 0} onClick={() => setCurrentQ(currentQ - 1)} className="text-slate-500 font-semibold hover:text-royal disabled:opacity-30 p-2">Previous</button>
            {currentQ === questions.length - 1 ? (
              <button onClick={handleSubmit} className="bg-brand-red text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-red-700 transform hover:scale-105 transition-all">Submit Exam</button>
            ) : (
              <button onClick={handleNext} className="bg-royal text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-blue-900 transition-colors">Next</button>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center mt-8 gap-2">
          {questions.map((q, i) => (
             <div key={q.id} className={`w-2.5 h-2.5 rounded-full ${i === currentQ ? 'bg-royal ring-2 ring-blue-200 ring-offset-2' : (answers[q.id] ? 'bg-green-400' : 'bg-slate-300')}`}></div>
          ))}
        </div>
      </div>
    </div>
  );
}
