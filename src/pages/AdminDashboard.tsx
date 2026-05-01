import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, Settings, Database, Activity, Check, X, ShieldAlert, Award, LogOut, UserPlus, Upload, RefreshCw, Lock, Eye, EyeOff } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<"students" | "questions" | "config" | "subadmin" | "security">("students");
  const [isLive, setIsLive] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [subadmins, setSubadmins] = useState<any[]>([]);
  const [settings, setSettings] = useState({ round: 1, questionCount: 10, timeMinutes: 30 });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean; title: string; message: string; isPrompt?: boolean; promptLabel?: string; confirmStyle?: string; action: (val?: string) => void;
  } | null>(null);
  
  // Sub-admin form
  const [newSub, setNewSub] = useState({ username: "", password: "" });
  const [showNewSubPassword, setShowNewSubPassword] = useState(false);
  
  // Security form
  const [pwdForm, setPwdForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [pwdStatus, setPwdStatus] = useState({ loading: false, message: "", type: "" });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdStatus({ loading: false, message: "New passwords do not match", type: "error" });
      return;
    }
    setPwdStatus({ loading: true, message: "", type: "" });
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: admin.username,
          oldPassword: pwdForm.oldPassword,
          newPassword: pwdForm.newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setPwdStatus({ loading: false, message: "Password updated successfully! Please login again.", type: "success" });
        setPwdForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => {
          handleLogout();
        }, 2000);
      } else {
        setPwdStatus({ loading: false, message: data.message || "Failed to update password", type: "error" });
      }
    } catch {
      setPwdStatus({ loading: false, message: "Server error", type: "error" });
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("adminUser");
    if (!stored) {
      navigate("/admin/login");
      return;
    }
    setAdmin(JSON.parse(stored));
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    const sRes = await fetch("/api/admin/users");
    const sData = await sRes.json();
    if(sData.success) setStudents(sData.users);

    const stRes = await fetch("/api/exam/status");
    const stData = await stRes.json();
    if(stData.success) {
      setIsLive(stData.settings.isLive);
      setSettings(stData.settings);
    }
    
    if (JSON.parse(localStorage.getItem("adminUser") || "{}").role === 'main_admin') {
      const subRes = await fetch("/api/admin/subadmins");
      const subData = await subRes.json();
      if(subData.success) setSubadmins(subData.subadmins);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  const executeHandleAction = async (ids: string[], action: "active" | "deactivated" | "deleted") => {
    try {
      await fetch("/api/admin/users/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action })
      });
      fetchData();
    } catch (e) {
      alert("Action failed.");
    }
  };

  const handleAction = (ids: string[], action: "active" | "deactivated" | "deleted") => {
    if(action === 'deleted') {
       setConfirmState({
         isOpen: true, title: "Delete Record", message: "Permanently delete? Cannot be undone.", confirmStyle: "bg-red-600 hover:bg-red-700",
         action: () => executeHandleAction(ids, action)
       });
       return;
    }
    executeHandleAction(ids, action);
  };

  const batchDeactivate = () => {
    setConfirmState({
      isOpen: true, title: "Batch Deactivate", message: "Enter score threshold to deactivate participants with scores below this limit.",
      isPrompt: true, promptLabel: "Score limit (e.g. 50)", confirmStyle: "bg-red-600 hover:bg-red-700",
      action: (val) => {
        if(!val) return;
        const limit = parseInt(val);
        if(isNaN(limit)) return alert("Invalid number");
        const idsToDeactivate = students.filter(s => parseInt(s.score || '0') < limit && s.status !== "deactivated").map(s => s.id);
        if(idsToDeactivate.length === 0) return alert("No students found below this score.");
        executeHandleAction(idsToDeactivate, "deactivated");
      }
    });
  };

  const updateLiveStatus = async (status: boolean) => {
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLive: status })
      });
      setIsLive(status);
    } catch {
      alert("Failed to update status");
    }
  };

  const updateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    alert("Settings saved!");
  };

  const uploadQuestions = async () => {
    if(!csvFile) return alert("Select a CSV file first.");
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      try {
        const res = await fetch("/api/admin/questions/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvData: text })
        });
        const data = await res.json();
        if(data.success) {
          alert("Questions uploaded and parsed via CSV!");
          setCsvFile(null);
        } else {
          alert(data.message || "Failed to upload.");
        }
      } catch(ex) {
        alert("Error uploading.");
      }
    };
    reader.readAsText(csvFile);
  };

  const clearQuestions = () => {
     setConfirmState({
       isOpen: true, title: "Clear All Questions", message: "DANGER: This will delete ALL questions. Proceed?", confirmStyle: "bg-red-600 hover:bg-red-700",
       action: async () => {
         await fetch("/api/admin/questions/clear", { method: "POST" });
         alert("Questions cleared!");
       }
     });
  };

  const clearStudents = () => {
     setConfirmState({
       isOpen: true, title: "Clear All Students", message: "DANGER: This will delete ALL student records permanently. Make sure you have exported the CSV first! Proceed?", confirmStyle: "bg-red-600 hover:bg-red-700",
       action: async () => {
         await fetch("/api/admin/users/clear", { method: "POST" });
         fetchData();
       }
     });
  };

  const exportCSV = () => {
    if(students.length === 0) return;
    const header = Object.keys(students[0]).join(",");
    const rows = students.map(s => Object.values(s).map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([`${header}\n${rows}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `faz_students_round${settings.round}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeSubadmin = (username: string) => {
     setConfirmState({
       isOpen: true, title: "Remove Sub-Admin", message: `Remove sub-admin ${username}?`, confirmStyle: "bg-red-600 hover:bg-red-700",
       action: async () => {
         await fetch("/api/admin/remove-subadmin", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ username, creatorRole: admin.role })
         });
         fetchData();
       }
     });
  };

  const addSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/add-subadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newSub, creatorRole: admin.role })
      });
      const data = await res.json();
      if(data.success) {
        alert("Sub-admin added successfully");
        setNewSub({ username: "", password: "" });
      } else {
        alert(data.message || "Failed to add.");
      }
    } catch {
      alert("Error adding.");
    }
  };

  if (!admin) return null;

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-royal text-white flex flex-col">
        <div className="p-6">
           <h1 className="text-xl font-extrabold tracking-tight">FAZ ADMIN<span className="text-brand-red">.</span></h1>
           <p className="text-blue-300 text-xs mt-1 uppercase tracking-wider font-semibold">Command Center</p>
           <p className="text-white text-xs mt-4 opacity-50">Logged in as: {admin.username} ({admin.role})</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button onClick={() => setActiveTab("students")} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === "students" ? "bg-blue-800 text-white" : "text-blue-200 hover:bg-blue-900"}`}>
            <Users className="w-5 h-5 mr-3 opacity-80" /> Participants
          </button>
          <button onClick={() => setActiveTab("questions")} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === "questions" ? "bg-blue-800 text-white" : "text-blue-200 hover:bg-blue-900"}`}>
            <Database className="w-5 h-5 mr-3 opacity-80" /> Question Bank
          </button>
          <button onClick={() => setActiveTab("config")} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === "config" ? "bg-blue-800 text-white" : "text-blue-200 hover:bg-blue-900"}`}>
            <Settings className="w-5 h-5 mr-3 opacity-80" /> Exam Configuration
          </button>
          {admin.role === "main_admin" && (
            <>
              <button onClick={() => setActiveTab("subadmin")} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === "subadmin" ? "bg-blue-800 text-white" : "text-blue-200 hover:bg-blue-900"}`}>
                <UserPlus className="w-5 h-5 mr-3 opacity-80" /> Sub-Admins
              </button>
              <button onClick={() => setActiveTab("security")} className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === "security" ? "bg-blue-800 text-white" : "text-blue-200 hover:bg-blue-900"}`}>
                <Lock className="w-5 h-5 mr-3 opacity-80" /> Security
              </button>
            </>
          )}
        </nav>
        <div className="p-4 space-y-2">
          <Link to="/" className="text-xs text-blue-400 hover:text-white flex items-center mb-2"><ShieldAlert className="w-4 h-4 mr-1" /> To Home</Link>
          <button onClick={handleLogout} className="w-full text-left text-xs text-red-300 hover:text-red-100 flex items-center"><LogOut className="w-4 h-4 mr-1"/> Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white px-8 py-4 border-b border-slate-200 flex justify-between items-center shadow-sm sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800 capitalize">{activeTab.replace("-", " ")}</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-bold text-slate-500">System Status:</span>
            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${isLive ? 'bg-red-50 text-brand-red border-red-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
              {isLive ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </header>

        <main className="p-8">
          {activeTab === "config" && (
            <div className="space-y-8 max-w-4xl">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-royal" /> Master Switch
                </h3>
                <div className={`p-6 rounded-xl border ${isLive ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className={`font-bold text-lg ${isLive ? 'text-brand-red' : 'text-slate-700'}`}>
                        Exam is currently {isLive ? 'LIVE' : 'OFFLINE'}
                      </h4>
                    </div>
                    <div className="flex space-x-4 items-center gap-3">
                      <button
                        onClick={() => updateLiveStatus(!isLive)}
                        className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-royal focus:ring-offset-2 ${isLive ? 'bg-brand-red' : 'bg-slate-300'}`}
                        aria-pressed={isLive}
                      >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${isLive ? 'translate-x-9' : 'translate-x-1'}`} />
                      </button>
                      <span className="text-sm font-semibold text-slate-600">Toggle Status</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-royal" /> Exam Rules
                </h3>
                <form onSubmit={updateSettings} className="space-y-4">
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Current Round</label>
                      <input type="number" className="w-full px-4 py-2 border rounded-xl" value={settings.round} onChange={e=>setSettings({...settings, round: parseInt(e.target.value)})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Max Questions</label>
                      <input type="number" className="w-full px-4 py-2 border rounded-xl" value={settings.questionCount} onChange={e=>setSettings({...settings, questionCount: parseInt(e.target.value)})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Time (Minutes)</label>
                      <input type="number" className="w-full px-4 py-2 border rounded-xl" value={settings.timeMinutes} onChange={e=>setSettings({...settings, timeMinutes: parseInt(e.target.value)})} />
                    </div>
                  </div>
                  <button type="submit" className="bg-royal text-white px-6 py-2 rounded-xl font-bold">Save Settings</button>
                </form>
              </div>
            </div>
          )}

          {activeTab === "questions" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-4xl">
               <div className="p-6 border-b border-slate-100">
                 <h3 className="text-lg font-bold text-slate-800">Upload Question Bank (CSV)</h3>
                 <p className="text-sm text-slate-500 mt-1">Make sure your CSV file has the following header row exact names (case-sensitive):</p>
                 <code className="text-xs bg-slate-100 p-2 rounded mt-2 block">id,text,optionA,optionB,optionC,optionD,correct</code>
               </div>
               <div className="p-6 space-y-4">
                 <input 
                   type="file"
                   accept=".csv"
                   className="w-full border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-royal file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                   onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)}
                 />
                 <div className="flex gap-4">
                   <button onClick={uploadQuestions} disabled={!csvFile} className="bg-brand-red text-white py-3 px-6 rounded-xl font-bold flex items-center hover:bg-red-700 disabled:opacity-50">
                     <Upload className="w-4 h-4 mr-2"/> Parse and Save Questions
                   </button>
                   <button onClick={clearQuestions} className="bg-red-50 text-red-600 border border-red-200 py-3 px-6 rounded-xl font-bold hover:bg-red-100">
                     Clear All Questions
                   </button>
                 </div>
               </div>
            </div>
          )}

          {activeTab === "students" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div>
                   <h3 className="text-lg font-bold text-slate-800">Participant Records</h3>
                   <p className="text-sm text-slate-500 mt-1">Sorted by score (magnitude).</p>
                 </div>
                 <div className="flex flex-wrap items-center gap-2">
                   <button onClick={exportCSV} className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-200">Export CSV</button>
                   <Link to="/register" target="_blank" className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-200">Register Student</Link>
                   <button onClick={fetchData} className="bg-slate-100 text-slate-600 px-3 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-slate-200"><RefreshCw className="w-4 h-4 md:mr-2"/> <span className="hidden md:inline">Refresh</span></button>
                   <button onClick={batchDeactivate} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-red-200">Batch Deactivate (Score &lt; X)</button>
                 </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Score</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...students].sort((a,b) => parseInt(b.score||'0') - parseInt(a.score||'0')).map(s => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs">{s.id}</td>
                        <td className="px-6 py-4">
                           <button onClick={() => setSelectedStudent(s)} className="font-semibold text-royal hover:underline">{s.studentName}</button>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${parseInt(s.score) >= 50 ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                             {s.score}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`text-xs font-bold uppercase ${s.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>{s.status}</span>
                        </td>
                        <td className="px-6 py-4 flex justify-center space-x-2">
                          {s.status === "active" ? (
                             <button onClick={() => handleAction([s.id], "deactivated")} className="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-xs font-bold border border-red-200 transition-colors">Deactivate</button>
                          ) : (
                             <button onClick={() => handleAction([s.id], "active")} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded text-xs font-bold border border-blue-200 transition-colors">Activate</button>
                          )}
                          <button onClick={() => handleAction([s.id], "deleted")} className="text-slate-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"><X className="w-4 h-4"/></button>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-400">No participants yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "subadmin" && admin.role === "main_admin" && (
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full max-w-md">
                 <h3 className="text-lg font-bold text-slate-800 mb-6">Add Sub-Admin</h3>
                 <form onSubmit={addSubAdmin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
                      <input type="text" required className="w-full px-4 py-2 border rounded-xl" value={newSub.username} onChange={e=>setNewSub({...newSub, username: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                      <div className="relative">
                        <input type={showNewSubPassword ? "text" : "password"} required className="w-full px-4 py-2 border rounded-xl pr-10" value={newSub.password} onChange={e=>setNewSub({...newSub, password: e.target.value})} />
                        <button type="button" onClick={() => setShowNewSubPassword(!showNewSubPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showNewSubPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-royal text-white px-6 py-3 rounded-xl font-bold">Create Account</button>
                 </form>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 w-full overflow-hidden">
                 <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Existing Sub-Admins</h3>
                 </div>
                 <div className="p-0">
                    <ul className="divide-y divide-slate-100">
                      {subadmins.map(s => (
                        <li key={s.username} className="p-4 flex items-center justify-between hover:bg-slate-50">
                          <div>
                            <div className="font-semibold text-slate-700">{s.username}</div>
                            <div className="text-sm text-slate-500 font-mono mt-1">Password: {s.password}</div>
                          </div>
                          <button onClick={() => removeSubadmin(s.username)} className="text-red-500 hover:text-red-700 text-sm font-bold px-3 py-1 bg-red-50 hover:bg-red-100 rounded">Remove</button>
                        </li>
                      ))}
                      {subadmins.length === 0 && <li className="p-8 text-center text-slate-500">No subadmins found.</li>}
                    </ul>
                 </div>
              </div>
            </div>
          )}

          {activeTab === "security" && admin.role === "main_admin" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full max-w-md">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Change Password</h3>
              {pwdStatus.message && (
                <div className={`p-4 mb-6 rounded-lg text-sm font-semibold flex items-center ${pwdStatus.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                  {pwdStatus.type === "error" ? <X className="w-4 h-4 mr-2" /> : <Check className="w-4 h-4 mr-2" />} {pwdStatus.message}
                </div>
              )}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Previous Password</label>
                  <input type="password" required className="w-full px-4 py-2 border rounded-xl" value={pwdForm.oldPassword} onChange={e=>setPwdForm({...pwdForm, oldPassword: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
                  <input type="password" required className="w-full px-4 py-2 border rounded-xl" value={pwdForm.newPassword} onChange={e=>setPwdForm({...pwdForm, newPassword: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Confirm New Password</label>
                  <input type="password" required className="w-full px-4 py-2 border rounded-xl" value={pwdForm.confirmPassword} onChange={e=>setPwdForm({...pwdForm, confirmPassword: e.target.value})} />
                </div>
                <button type="submit" disabled={pwdStatus.loading} className="w-full bg-royal text-white px-6 py-3 rounded-xl font-bold disabled:opacity-70">
                  {pwdStatus.loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {confirmState?.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{confirmState.title}</h3>
            <p className="text-slate-600 text-sm mb-4">{confirmState.message}</p>
            {confirmState.isPrompt && (
              <input type="number" id="prompt-input" className="w-full border border-slate-300 rounded-xl px-4 py-2 mb-4 focus:ring-2 focus:ring-royal" placeholder={confirmState.promptLabel} autoFocus />
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setConfirmState(null)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button 
                onClick={() => {
                  const val = confirmState.isPrompt ? (document.getElementById("prompt-input") as HTMLInputElement)?.value : undefined;
                  setConfirmState(null);
                  confirmState.action(val);
                }} 
                className={`px-4 py-2 font-bold text-white rounded-lg ${confirmState.confirmStyle || "bg-royal hover:bg-blue-700"}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedStudent(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"><X className="w-6 h-6"/></button>
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Student Details</h3>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl">
                   <p className="text-slate-500 mb-1">Student Name</p>
                   <p className="font-bold text-slate-800">{selectedStudent.studentName}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                   <p className="text-slate-500 mb-1">Login ID</p>
                   <p className="font-bold font-mono text-royal">{selectedStudent.id}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                   <p className="text-slate-500 mb-1">Password</p>
                   <p className="font-bold font-mono text-brand-red">{selectedStudent.password}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                   <p className="text-slate-500 mb-1">Score</p>
                   <p className="font-bold text-slate-800">{selectedStudent.score}</p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4 space-y-2 text-slate-700">
                <p><span className="font-bold w-32 inline-block">DOB:</span> {selectedStudent.dob}</p>
                <p><span className="font-bold w-32 inline-block">Gender:</span> {selectedStudent.gender}</p>
                <p><span className="font-bold w-32 inline-block">Class:</span> {selectedStudent.studentClass}</p>
                <p><span className="font-bold w-32 inline-block">School:</span> {selectedStudent.schoolName}</p>
                <p><span className="font-bold w-32 inline-block">Teacher Name:</span> {selectedStudent.teacherName}</p>
                <p><span className="font-bold w-32 inline-block">Teacher Email:</span> {selectedStudent.teacherEmail}</p>
                <p><span className="font-bold w-32 inline-block">Teacher Phone:</span> {selectedStudent.teacherPhone}</p>
                <p><span className="font-bold w-32 inline-block">Parent Name:</span> {selectedStudent.parentName}</p>
                <p><span className="font-bold w-32 inline-block">Parent Email:</span> {selectedStudent.parentEmail}</p>
                <p><span className="font-bold w-32 inline-block">Parent Phone:</span> {selectedStudent.parentPhone}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
