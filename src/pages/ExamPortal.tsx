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
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const navigate = useNavigate();

  // Create refs to avoid closure stale values in timers
  const answersRef = React.useRef(answers);
  const studentRef = React.useRef(student);
  const isSubmittedRef = React.useRef(isSubmitted);
  const questionsRef = React.useRef(questions);
  const currentQRef = React.useRef(currentQ);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    studentRef.current = student;
  }, [student]);

  useEffect(() => {
    isSubmittedRef.current = isSubmitted;
  }, [isSubmitted]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    currentQRef.current = currentQ;
  }, [currentQ]);

  const fetchQuestionsOnly = async () => {
    try {
      const res = await fetch("/api/exam/questions");
      const data = await res.json();
      if(data.success && data.questions.length > 0) {
        setQuestions(data.questions);
      }
    } catch {
      console.log("Failed to load questions on restore");
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("fazStudent");
    if (stored) {
      const parsedStudent = JSON.parse(stored);
      setStudent(parsedStudent);
      checkExamStatus();

      const storedStart = localStorage.getItem(`fazExamStartedAt_${parsedStudent.id}`);
      if (storedStart) {
        setStartTime(parseInt(storedStart, 10));
        setIsStarted(true);
        fetchQuestionsOnly();
        const storedAns = localStorage.getItem(`fazExamAnswers_${parsedStudent.id}`);
        if (storedAns) {
          setAnswers(JSON.parse(storedAns));
        }
      }
    }
  }, []);

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

  // Continuous background status polling (allows live time updates to sync immediately)
  useEffect(() => {
    if (student && !isSubmitted) {
      const interval = setInterval(() => {
        checkExamStatus();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [student, isSubmitted]);

  const handleSubmit = async () => {
    if (isSubmittedRef.current || !studentRef.current) return;
    try {
      const response = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: studentRef.current.id, answers: answersRef.current })
      });
      const data = await response.json();
      if (data.success) {
        setStudent({ ...studentRef.current, score: data.score });
        setIsSubmitted(true);
        localStorage.removeItem(`fazExamStartedAt_${studentRef.current.id}`);
        localStorage.removeItem(`fazExamAnswers_${studentRef.current.id}`);
      }
    } catch (e) {
      alert("Submission failed. Retrying...");
    }
  };

  const handleSubmitRef = React.useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  const examTimeMinutes = examStatus?.timeMinutes || 30;

  // Live Timer Count-down useEffect
  useEffect(() => {
    let timer: any;
    if (isStarted && startTime && examTimeMinutes && !isSubmitted) {
      const calculateTimeLeft = () => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const totalAllottedSeconds = examTimeMinutes * 60;
        const remaining = totalAllottedSeconds - elapsedSeconds;
        return Math.max(0, remaining);
      };

      const initialRemaining = calculateTimeLeft();
      setTimeLeft(initialRemaining);

      if (initialRemaining <= 0) {
        handleSubmitRef.current();
        return;
      }

      timer = setInterval(() => {
        const rem = calculateTimeLeft();
        setTimeLeft(rem);
        if (rem <= 0) {
          clearInterval(timer);
          handleSubmitRef.current(); // Auto submit
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isStarted, startTime, examTimeMinutes, isSubmitted]);

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
    if (student) {
      localStorage.removeItem(`fazExamStartedAt_${student.id}`);
      localStorage.removeItem(`fazExamAnswers_${student.id}`);
    }
    localStorage.removeItem("fazStudent");
    setStudent(null);
    setIsStarted(false);
    setStartTime(null);
    setAnswers({});
    setCurrentQ(0);
  };

  const handleStart = async () => {
    try {
      const res = await fetch("/api/exam/questions");
      const data = await res.json();
      if(data.success && data.questions.length > 0) {
        setQuestions(data.questions);
        const now = Date.now();
        setStartTime(now);
        if (student) {
          localStorage.setItem(`fazExamStartedAt_${student.id}`, now.toString());
        }
        setIsStarted(true);
      } else {
        alert("No questions available or exam is offline.");
      }
    } catch {
      alert("Failed to load questions");
    }
  };

  const handleOptionSelect = (qId: string, opt: string) => {
    const updatedAnswers = { ...answers, [qId]: opt };
    setAnswers(updatedAnswers);
    if (student) {
      localStorage.setItem(`fazExamAnswers_${student.id}`, JSON.stringify(updatedAnswers));
    }
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1);
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
           {examStatus && (
             <div className="mb-4 inline-block bg-royal text-white px-4 py-1.5 rounded-full font-bold text-xs tracking-wider uppercase shadow-sm border border-royal/10">
               🏆 Scholars' Challenge Round {examStatus.round}
             </div>
           )}
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
               <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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

  if (isStarted && (questions.length === 0 || !question)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-lg max-w-sm w-full text-center border border-slate-100 flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-royal animate-spin mb-4" />
          <h3 className="font-bold text-slate-800 text-lg mb-2">Loading questions</h3>
          <p className="text-slate-500 text-sm">Please wait while the challenge content is retrieved...</p>
        </div>
      </div>
    );
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {examStatus && (
        <div className="bg-royal text-white text-center py-2.5 px-4 font-bold text-xs sm:text-sm uppercase tracking-wider relative flex justify-center items-center gap-2 shadow-sm">
          <span>🏆 Scholars' Challenge Round {examStatus.round}</span>
          <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase">Active</span>
        </div>
      )}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center font-bold">
          <span className="text-royal hidden sm:block">Faz Scholars' Challenge</span>
          <span className="text-slate-500 font-mono text-sm sm:hidden">{student.id}</span>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="bg-red-50 hover:bg-red-100 text-brand-red border border-red-200 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
              id="header-submit-btn"
            >
              Submit Exam
            </button>
            <div className={`flex items-center px-4 py-2 rounded-full border ${timeLeft < 60 ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
              <Clock className="w-4 h-4 mr-2" /> {formatTime(timeLeft)}
            </div>
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

               let buttonClasses = "border-slate-100 hover:border-slate-300 hover:bg-slate-50";
               let badgeClasses = "bg-slate-100 text-slate-500";
               let textClasses = "text-slate-700";

               if (isSelected) {
                 buttonClasses = "border-royal bg-blue-50/50 ring-2 ring-royal ring-offset-1 shadow-sm";
                 badgeClasses = "bg-royal text-white";
                 textClasses = "text-royal font-bold";
               }

               return (
                  <button
                    key={optLabel}
                    onClick={() => handleOptionSelect(question.id, optLabel)}
                    className={`w-full flex items-center p-4 rounded-xl border-2 text-left transition-all ${buttonClasses}`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-4 flex-shrink-0 ${badgeClasses}`}>{optLabel}</span>
                    <span className={`text-base font-medium ${textClasses}`}>{optionText}</span>
                  </button>
               )
             })}
          </div>

          <div className="flex border-t border-slate-100 pt-8 justify-between items-center block-action-bar">
            <button disabled={currentQ === 0} onClick={() => setCurrentQ(currentQ - 1)} className="text-slate-500 font-semibold hover:text-royal disabled:opacity-30 p-2" id="prev-btn">Previous</button>
            {currentQ === questions.length - 1 ? (
              <button onClick={() => setShowConfirmSubmit(true)} className="bg-brand-red text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-red-700 transform hover:scale-105 transition-all" id="footer-submit-finish-btn">Submit Exam</button>
            ) : (
              <div className="flex items-center space-x-3">
                <button type="button" onClick={() => setShowConfirmSubmit(true)} className="text-brand-red font-bold hover:text-red-700 px-4 py-2 rounded-lg text-sm transition" id="footer-submit-inter-btn">Submit Exam</button>
                <button onClick={handleNext} className="bg-royal text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-blue-900 transition-colors" id="next-btn">Next</button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center mt-8 gap-2">
          {questions.map((q, i) => (
             <div key={q.id} className={`w-2.5 h-2.5 rounded-full ${i === currentQ ? 'bg-royal ring-2 ring-blue-200 ring-offset-2' : (answers[q.id] ? 'bg-green-400' : 'bg-slate-300')}`}></div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="submit-confirm-modal">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-red">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-950 mb-2">Submit Your Exam?</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Are you sure you want to end and submit your exam? Once submitted, you cannot change your answers nor access this round again.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200/60 text-left">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Exam Progress</p>
              <div className="flex justify-between text-sm font-semibold text-slate-700">
                <span>Questions Attempted:</span>
                <span className="font-bold text-royal">
                  {Object.keys(answers).length} / {questions.length}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                type="button"
                onClick={() => setShowConfirmSubmit(false)} 
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                id="cancel-submit-btn"
              >
                No, Keep Writing
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowConfirmSubmit(false);
                  handleSubmit();
                }} 
                className="flex-1 py-3 bg-brand-red hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition"
                id="confirm-submit-btn"
              >
                Yes, Submit Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
