import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Loader2, BrainCircuit } from "lucide-react";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
        localStorage.setItem("adminUser", JSON.stringify({ username: data.username, role: data.role }));
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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center mb-4">
             <img src="https://i.postimg.cc/s2y1xL74/logo.jpg" alt="FAZ College Admin" className="w-full h-full object-contain"/>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Portal</h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to access the command center
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && <div className="text-red-500 text-sm font-bold text-center bg-red-50 py-2 rounded-lg">{error}</div>}
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
        <div className="text-center mt-4">
          <Link to="/" className="text-sm font-medium text-slate-500 hover:text-royal">Return to Home</Link>
        </div>
      </div>
    </div>
  );
}
