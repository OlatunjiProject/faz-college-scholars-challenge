import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Loader2, BrainCircuit, ArrowLeft, CheckCircle, HelpCircle } from "lucide-react";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Initial Setup State
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);

  // Registration Form States
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regQuestion, setRegQuestion] = useState("What is your favorite academic subject?");
  const [regAnswer, setRegAnswer] = useState("");

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/admin/has-admin");
        if (!res.ok) {
          setHasAdmin(true); // fallback to secure login if error
          return;
        }
        const data = await res.json();
        if (data.success) {
          setHasAdmin(data.hasAdmin);
        } else {
          setHasAdmin(true);
        }
      } catch {
        setHasAdmin(true);
      }
    };
    checkAdmin();
  }, []);

  // Password Recovery Wizard States
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);
  const [recUsername, setRecUsername] = useState("");
  const [recQuestion, setRecQuestion] = useState("");
  const [recMaskedEmail, setRecMaskedEmail] = useState("");
  const [recAnswer, setRecAnswer] = useState("");
  const [recNewPassword, setRecNewPassword] = useState("");
  const [recStatus, setRecStatus] = useState({ success: false, message: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem("adminUser", JSON.stringify({ username: data.username, role: data.role, token: data.token }));
        navigate("/admin");
      } else {
        setError(data.message || "Login failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/recovery-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: recUsername })
      });
      const data = await res.json();
      if (data.success) {
        setRecQuestion(data.recoveryQuestion);
        setRecMaskedEmail(data.maskedEmail);
        setRecoveryStep(2);
      } else {
        setError(data.message || "Admin username not found");
      }
    } catch {
      setError("Network error retrieving question");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: recUsername,
          recoveryAnswer: recAnswer,
          newPassword: recNewPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setRecStatus({ success: true, message: data.message });
        setTimeout(() => {
          // Reset states and switch back to standard login
          setIsRecovering(false);
          setRecoveryStep(1);
          setRecUsername("");
          setRecQuestion("");
          setRecAnswer("");
          setRecNewPassword("");
          setRecStatus({ success: false, message: "" });
        }, 3000);
      } else {
        setError(data.message || "Incorrect answer supplied");
      }
    } catch {
      setError("Network error resetting password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/setup-initial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regUsername,
          password: regPassword,
          recoveryEmail: regEmail,
          recoveryQuestion: regQuestion,
          recoveryAnswer: regAnswer
        })
      });
      const data = await res.json();
      if (data.success) {
        // Auto sign-in
        const loginRes = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: regUsername, password: regPassword })
        });
        const loginData = await loginRes.json();
        if (loginData.success) {
          localStorage.setItem("adminUser", JSON.stringify({ username: loginData.username, role: loginData.role, token: loginData.token }));
          navigate("/admin");
        } else {
          setHasAdmin(true);
        }
      } else {
        setError(data.message || "Failed to create administrator");
      }
    } catch {
      setError("Network error creating primary administrator");
    } finally {
      setIsLoading(false);
    }
  };

  if (hasAdmin === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center font-sans">
          <Loader2 className="w-10 h-10 animate-spin text-royal mx-auto mb-4" />
          <p className="text-slate-500 text-sm font-medium">Checking system status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
        
        {/* Recovery Mode Header or Initial Admin Registration */}
        {!hasAdmin ? (
          <div className="text-center">
            <div className="mx-auto h-20 w-20 flex items-center justify-center mb-4">
               <img src="https://i.postimg.cc/s2y1xL74/logo.jpg" alt="FAZ College Admin" className="w-full h-full object-contain"/>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Setup Admin Account</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Create your primary administrator credentials to secure the platform. After this, secure login is always required.
            </p>
          </div>
        ) : isRecovering ? (
          <div>
            <button 
              onClick={() => { setIsRecovering(false); setRecoveryStep(1); setError(""); }} 
              className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-royal mb-4 transition"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
            </button>
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-blue-50 text-royal rounded-full flex items-center justify-center mb-4 border border-blue-100">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Recover Credentials</h2>
              <p className="mt-1 text-sm text-slate-500">
                {recoveryStep === 1 ? "Enter your admin username to search" : "Verify security answer to reset"}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto h-20 w-20 flex items-center justify-center mb-4">
               <img src="https://i.postimg.cc/s2y1xL74/logo.jpg" alt="FAZ College Admin" className="w-full h-full object-contain"/>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Portal</h2>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to access the command center
            </p>
          </div>
        )}
        
        {/* Error / Success Banners */}
        {error && <div className="text-red-600 text-sm font-bold text-center bg-red-50 py-2.5 px-4 rounded-xl border border-red-100">{error}</div>}
        {recStatus.success && (
          <div className="text-green-600 text-sm font-bold text-center bg-green-50 py-3 px-4 rounded-xl border border-green-100 flex flex-col items-center">
            <CheckCircle className="w-6 h-6 mb-1 text-green-600" />
            {recStatus.message}
          </div>
        )}

        {/* Wizard Form Blocks */}
        {!hasAdmin ? (
          <form onSubmit={handleRegisterAdmin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Primary Admin Username</label>
              <input
                type="text"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-royal transition sm:text-sm"
                placeholder="e.g. main_admin"
                value={regUsername}
                onChange={e => setRegUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Admin Password</label>
              <input
                type="password"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-royal transition sm:text-sm"
                placeholder="Enter strong password"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Recovery Email</label>
              <input
                type="email"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-royal transition sm:text-sm"
                placeholder="e.g. admin@fazcollege.com.ng"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Password Recovery Question</label>
              <select
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-950 focus:outline-none focus:ring-2 focus:ring-royal bg-white transition sm:text-sm"
                value={regQuestion}
                onChange={e => setRegQuestion(e.target.value)}
              >
                <option value="What is your favorite academic subject?">What is your favorite academic subject?</option>
                <option value="What was the name of your first school?">What was the name of your first school?</option>
                <option value="What is your city of birth?">What is your city of birth?</option>
                <option value="What is the name of your childhood pet?">What is the name of your childhood pet?</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Security Question Answer</label>
              <input
                type="text"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-royal transition sm:text-sm"
                placeholder="e.g. Mathematics"
                value={regAnswer}
                onChange={e => setRegAnswer(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full justify-center py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-royal hover:bg-blue-900 focus:outline-none transition disabled:opacity-70 flex items-center mt-4"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null} Complete Setup & Lock Portal
            </button>
          </form>
        ) : isRecovering ? (
          recoveryStep === 1 ? (
            <form onSubmit={handleVerifyUsername} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Admin Username</label>
                <input
                  type="text"
                  required
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-royal transition"
                  placeholder="Enter admin username"
                  value={recUsername}
                  onChange={e => setRecUsername(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full justify-center py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-royal hover:bg-blue-900 focus:outline-none transition disabled:opacity-70 flex items-center"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null} Find Admin Account
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl mb-4 text-xs space-y-1.5">
                <p className="text-slate-400 uppercase tracking-widest font-bold">Admin Found</p>
                <p className="font-bold text-slate-800 text-sm">{recUsername}</p>
                {recMaskedEmail && (
                  <p className="text-slate-500 font-medium">Recovery Notification Destination: <span className="font-mono text-royal">{recMaskedEmail}</span></p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Security Question</label>
                <p className="font-bold text-slate-800 text-sm mb-2">{recQuestion}</p>
                <input
                  type="text"
                  required
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-royal transition"
                  placeholder="Enter security answer"
                  value={recAnswer}
                  onChange={e => setRecAnswer(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Set New Password</label>
                <input
                  type="password"
                  required
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-royal transition"
                  placeholder="Enter new password"
                  value={recNewPassword}
                  onChange={e => setRecNewPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || recStatus.success}
                className="w-full justify-center py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-royal hover:bg-blue-900 focus:outline-none transition disabled:opacity-70 flex items-center"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null} Verify and Reset Password
              </button>
            </form>
          )
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label className="sr-only">Username</label>
                <input
                  name="username"
                  type="text"
                  required
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-royal focus:border-royal transition-all sm:text-sm"
                  placeholder="Admin Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="sr-only">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-royal focus:border-royal transition-all sm:text-sm"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-4 flex items-center text-slate-400 font-bold text-xs hover:text-slate-600">
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => { setIsRecovering(true); setRecoveryStep(1); setError(""); }}
                className="text-sm font-semibold text-royal hover:text-brand-red transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-royal hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-royal disabled:opacity-70 transition-colors"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : "Sign in"}
              </button>
            </div>
          </form>
        )}
        
        <div className="text-center mt-4">
          <Link to="/" className="text-sm font-medium text-slate-500 hover:text-royal">Return to Home</Link>
        </div>
      </div>
    </div>
  );
}
