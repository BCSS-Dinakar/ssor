import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  Lock,
  User,
  RefreshCw,
  LogIn,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react';

const SECURITY_QUESTIONS = [
  'Your first school',
  'City of birth',
  'Driving licence number',
  'PAN',
  "Mother's maiden name",
  'Your first vehicle',
  'Your last college',
];

function makeCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i += 1) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function Field({ label, required, children, hint }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-700 tracking-wide">
        {label} {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <span className="text-xs text-slate-500 font-medium">{hint}</span>}
    </div>
  );
}

const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-300 focus:bg-white focus:border-secondary focus:ring-4 focus:ring-secondary/10 placeholder-slate-400';

function Captcha({ value, code, onChange, onRefresh }) {
  return (
    <Field label="Enter the text shown" required>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-100 border border-slate-200 rounded-xl px-5 py-2.5 select-none shadow-inner">
          <span
            className="font-mono text-xl font-bold tracking-[0.35em] text-primary italic opacity-80"
            style={{ textDecoration: 'line-through', textDecorationColor: 'rgba(0,0,0,0.2)' }}
          >
            {code}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            className="text-slate-400 hover:text-secondary transition-colors p-1 hover:bg-slate-200 rounded-full"
            aria-label="Refresh captcha"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <input
          className={inputClass + ' flex-1'}
          placeholder="Type the code"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          maxLength={6}
        />
      </div>
    </Field>
  );
}

function Alert({ type, message }) {
  if (!message) return null;
  const styles = {
    success: { cls: 'bg-emerald-50 border-emerald-200 text-emerald-800', Icon: CheckCircle2 },
    error: { cls: 'bg-red-50 border-red-200 text-red-800', Icon: AlertTriangle },
    info: { cls: 'bg-blue-50 border-blue-200 text-blue-800', Icon: Info },
  }[type];
  const { cls, Icon } = styles;
  return (
    <div className={`flex items-start gap-2.5 border rounded-lg px-4 py-3 text-sm ${cls}`}>
      <Icon className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

function LoginPage() {
  const [role, setRole] = useState('public'); // 'public' | 'police'
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  // login state
  const [loginForm, setLoginForm] = useState({ userId: '', password: '', officerId: '', captcha: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loginCaptcha, setLoginCaptcha] = useState(makeCaptcha());
  const [loginAlert, setLoginAlert] = useState(null);

  // register state
  const [reg, setReg] = useState({
    name: '', mobile: '', email: '', gender: '', dob: '', address: '',
    loginId: '', password: '', confirm: '', q1: '', a1: '', q2: '', a2: '', captcha: '', otp: '',
  });
  const [regCaptcha, setRegCaptcha] = useState(makeCaptcha());
  const [regAlert, setRegAlert] = useState(null);
  const [otpSent, setOtpSent] = useState(false);

  const [regStep, setRegStep] = useState(1);

  // when switching to police, force login mode (no registration)
  useEffect(() => {
    if (role === 'police') setMode('login');
    setLoginAlert(null);
    setRegAlert(null);
    setRegStep(1);
  }, [role]);

  useEffect(() => {
    if (mode === 'login') setRegStep(1);
    setRegAlert(null);
  }, [mode]);

  const refreshLoginCaptcha = useCallback(() => {
    setLoginCaptcha(makeCaptcha());
    setLoginForm((f) => ({ ...f, captcha: '' }));
  }, []);

  const refreshRegCaptcha = useCallback(() => {
    setRegCaptcha(makeCaptcha());
    setReg((r) => ({ ...r, captcha: '' }));
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const idLabel = role === 'police' ? 'Officer ID' : 'Login ID';
    if (!loginForm.userId.trim()) return setLoginAlert({ type: 'error', message: `${idLabel} is required.` });
    if (role === 'police' && !loginForm.officerId.trim())
      return setLoginAlert({ type: 'error', message: 'Departmental clearance ID is required.' });
    if (!loginForm.password) return setLoginAlert({ type: 'error', message: 'Password is required.' });
    if (loginForm.captcha !== loginCaptcha) {
      refreshLoginCaptcha();
      return setLoginAlert({ type: 'error', message: 'Captcha does not match. Please try again.' });
    }
    setLoginAlert({
      type: 'success',
      message:
        role === 'police'
          ? 'Officer credentials accepted (demo). The Register Console would open here.'
          : 'Signed in (demo). The Citizen & Institution Services portal would open here.',
    });
    return undefined;
  };

  const sendOtp = () => {
    if (!/^\d{10}$/.test(reg.mobile.trim())) {
      return setRegAlert({ type: 'error', message: 'Enter a valid 10-digit mobile number to receive an OTP.' });
    }
    setOtpSent(true);
    setRegAlert({ type: 'info', message: 'A verification OTP has been sent to your mobile (demo: use 123456).' });
    return undefined;
  };

  const nextStep = () => {
    setRegAlert(null);
    if (regStep === 1) {
      if (!reg.name.trim() || !reg.mobile.trim() || !reg.gender || !reg.dob) {
        return setRegAlert({ type: 'error', message: 'Please fill all required personal details.' });
      }
      if (!/^\d{10}$/.test(reg.mobile.trim())) {
        return setRegAlert({ type: 'error', message: 'Enter a valid 10-digit mobile number.' });
      }
      if (!otpSent) return setRegAlert({ type: 'error', message: 'Please request and enter the OTP sent to your mobile.' });
      if (reg.otp.trim() !== '123456')
        return setRegAlert({ type: 'error', message: 'Invalid OTP. (Demo OTP is 123456.)' });
      if (reg.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reg.email.trim())) {
        return setRegAlert({ type: 'error', message: 'Enter a valid email address.' });
      }
      setRegStep(2);
    } else if (regStep === 2) {
      if (!reg.loginId.trim() || !reg.password || !reg.confirm) {
        return setRegAlert({ type: 'error', message: 'Please fill all account details.' });
      }
      if (reg.password.length < 8) {
        return setRegAlert({ type: 'error', message: 'Password must be at least 8 characters.' });
      }
      if (reg.password !== reg.confirm) {
        return setRegAlert({ type: 'error', message: 'Passwords do not match.' });
      }
      setRegStep(3);
    }
  };

  const prevStep = () => {
    setRegAlert(null);
    setRegStep((s) => Math.max(1, s - 1));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (regStep !== 3) {
      nextStep();
      return;
    }
    const required = [
      [reg.q1, 'Security question 1'],
      [reg.a1, 'Security answer 1'],
      [reg.q2, 'Security question 2'],
      [reg.a2, 'Security answer 2'],
    ];
    const missing = required.find(([v]) => !String(v).trim());
    if (missing) return setRegAlert({ type: 'error', message: `${missing[1]} is required.` });
    if (reg.q1 === reg.q2)
      return setRegAlert({ type: 'error', message: 'Please choose two different security questions.' });
    if (reg.captcha !== regCaptcha) {
      refreshRegCaptcha();
      return setRegAlert({ type: 'error', message: 'Captcha does not match. Please try again.' });
    }

    setRegAlert({
      type: 'success',
      message: `Account created for ${reg.loginId} (demo). You can now sign in as a Public user.`,
    });
    return undefined;
  };

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {/* ───────── LEFT SIDE: MEDIA (Hidden on mobile, visible on lg screens) ───────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden bg-primary">
        {/* Ambient glowing blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-accent rounded-full filter blur-[120px] opacity-20"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500 rounded-full filter blur-[120px] opacity-20"></div>
        </div>
        
        {/* Subtle SVG Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none z-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>

        {/* Media Image Layer */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent z-10"></div>
          <img 
            src="/images/hero-shield.png" 
            alt="Secure database" 
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
          />
        </div>

        {/* Left Side Content */}
        <div className="relative z-10 p-12 lg:p-16 flex flex-col h-full justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors w-max">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          
          <div className="mb-20">
            <div className="inline-flex items-center justify-start gap-3 mb-8">
              <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white/10 p-0.5 shadow-lg">
                <img src="/images/ssor-logo.png" alt="SSOR Logo" className="h-full w-full object-cover rounded-2xl" />
              </div>
              <span className="text-4xl font-bold text-white font-heading tracking-tight">SSOR Portal</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6 font-heading">
              Secure, controlled-access sign in.
            </h1>
            <p className="text-blue-100/90 text-lg max-w-md leading-relaxed">
              Government of Telangana, State Police. Protecting communities through verified, audited intelligence and strict access control.
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-blue-200/50 uppercase tracking-widest font-semibold">
            <Lock className="h-4 w-4" />
            Official Law Enforcement Portal
          </div>
        </div>
      </div>

      {/* ───────── RIGHT SIDE: FORM ───────── */}
      <div className="w-full lg:w-1/2 flex flex-col relative overflow-y-auto">
        {/* Mobile Header (Only visible on small screens) */}
        <div className="lg:hidden bg-gradient-to-br from-primary via-[#0E2A4F] to-secondary p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium mb-6 transition-colors relative z-10">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="inline-flex items-center justify-start gap-3 relative z-10">
            <div className="h-10 w-10 overflow-hidden rounded-lg bg-white/10 p-0.5 shadow-sm">
              <img src="/images/ssor-logo.png" alt="SSOR Logo" className="h-full w-full object-cover rounded-lg" />
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-white font-heading tracking-tight">SSOR Portal</span>
          </div>
        </div>

        <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-10 lg:py-16">
          {/* Role toggle */}
          <div className="bg-slate-100 rounded-2xl p-2 grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
            {[
              { id: 'public', label: 'Public', sub: 'Citizens & Institutions', Icon: Users },
              { id: 'police', label: 'Police Officer', sub: 'Departmental access', Icon: Shield },
            ].map((r) => {
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all duration-300 ${
                    active ? 'bg-white shadow-md scale-[1.02]' : 'hover:bg-slate-200'
                  }`}
                >
                  <r.Icon className={`h-6 w-6 ${active ? 'text-accent' : 'text-slate-400'}`} />
                  <div>
                    <div className={`font-bold text-sm ${active ? 'text-primary' : 'text-slate-700'}`}>{r.label}</div>
                    <div className={`text-xs ${active ? 'text-slate-500' : 'text-slate-500'}`}>{r.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden transform transition-all">
            {/* Public login/register tabs */}
            {role === 'public' && (
              <div className="flex border-b border-slate-100 bg-slate-50/50">
                {[
                  { id: 'login', label: 'Sign In', Icon: LogIn },
                  { id: 'register', label: 'Create Account', Icon: UserPlus },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setMode(t.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-5 text-sm font-semibold transition-all duration-300 relative ${
                      mode === t.id
                        ? 'text-primary'
                        : 'text-slate-500 hover:text-primary hover:bg-slate-100/50'
                    }`}
                  >
                    <t.Icon className="h-4.5 w-4.5" />
                    {t.label}
                    {mode === t.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full"></div>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="p-8 sm:p-10">
              {/* ───── LOGIN FORM ───── */}
              {mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-primary font-heading tracking-tight">
                      {role === 'police' ? 'Officer Sign In' : 'Sign In'}
                    </h2>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                      {role === 'police'
                        ? 'Restricted to authorised officers with recorded clearance. Every action is audited.'
                        : 'Sign in to apply for clearances, track applications and request limited disclosure.'}
                    </p>
                  </div>

                  <Alert type={loginAlert?.type} message={loginAlert?.message} />

                  <Field label={role === 'police' ? 'Officer username' : 'Login ID'} required>
                    <div className="relative">
                      <User className="h-4 w-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        className={inputClass + ' pl-9'}
                        placeholder={role === 'police' ? 'e.g. insp.naidu' : 'Your registered login ID'}
                        value={loginForm.userId}
                        onChange={(e) => setLoginForm({ ...loginForm, userId: e.target.value })}
                      />
                    </div>
                  </Field>

                  {role === 'police' && (
                    <Field label="Departmental clearance ID" required hint="Provisioned by the department.">
                      <input
                        className={inputClass}
                        placeholder="e.g. TSP-L1-0448"
                        value={loginForm.officerId}
                        onChange={(e) => setLoginForm({ ...loginForm, officerId: e.target.value })}
                      />
                    </Field>
                  )}

                  <Field label="Password" required>
                    <div className="relative">
                      <Lock className="h-4 w-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={inputClass + ' pl-9 pr-10'}
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>

                  <Captcha
                    value={loginForm.captcha}
                    code={loginCaptcha}
                    onChange={(v) => setLoginForm({ ...loginForm, captcha: v })}
                    onRefresh={refreshLoginCaptcha}
                  />

                  <button type="submit" className="btn-primary w-full justify-center py-4 rounded-xl shadow-lg shadow-primary/20 text-base mt-2">
                    <LogIn className="h-5 w-5" />
                    Sign In
                  </button>

                  <div className="flex items-center justify-between text-sm pt-2">
                    <Link to="/login" className="text-secondary font-medium hover:text-blue-700 transition-colors">Forgot password?</Link>
                    {role === 'public' ? (
                      <button type="button" onClick={() => setMode('register')} className="text-secondary font-medium hover:text-blue-700 transition-colors">
                        New user? Create account
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                        <Info className="h-4 w-4" />
                        Accounts provisioned by the department
                      </span>
                    )}
                  </div>
                </form>
              )}

              {/* ───── REGISTER FORM (public only) ───── */}
              {mode === 'register' && role === 'public' && (
                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-primary font-heading tracking-tight">Citizen Registration</h2>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                      Create an account to access verified public services.
                    </p>
                  </div>

                  {/* Steps Indicator */}
                  <div className="flex items-center justify-between mb-8 relative px-2">
                    <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-100 z-0 rounded-full"></div>
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-accent transition-all duration-500 z-0 rounded-full" style={{ width: `calc(${((regStep - 1) / 2) * 100}% - 24px)` }}></div>
                    {[1, 2, 3].map((step) => (
                      <div key={step} className={`relative z-10 flex flex-col items-center gap-2`}>
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-500 ${regStep >= step ? 'bg-accent text-white shadow-md shadow-accent/30' : 'bg-white text-slate-400 border-2 border-slate-200'}`}>
                          {step}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider absolute -bottom-5 whitespace-nowrap transition-colors duration-500 ${regStep >= step ? 'text-primary' : 'text-slate-400'}`}>
                          {step === 1 ? 'Personal' : step === 2 ? 'Account' : 'Security'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Alert type={regAlert?.type} message={regAlert?.message} />

                  <div className="min-h-[280px]">
                    {/* Step 1: Personal Details */}
                    {regStep === 1 && (
                      <div className="grid sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        <Field label="Name" required>
                          <input className={inputClass} value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} placeholder="Full name" />
                        </Field>
                        <Field label="Mobile number" required>
                          <div className="flex gap-2">
                            <input
                              className={inputClass}
                              value={reg.mobile}
                              onChange={(e) => setReg({ ...reg, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                              placeholder="10-digit mobile"
                              inputMode="numeric"
                            />
                            <button type="button" onClick={sendOtp} className="btn-secondary whitespace-nowrap px-4 py-2 text-xs">
                              {otpSent ? 'Resend OTP' : 'Send OTP'}
                            </button>
                          </div>
                        </Field>
                        <Field label="OTP verification code" required hint="Demo OTP is 123456.">
                          <input
                            className={inputClass}
                            value={reg.otp}
                            onChange={(e) => setReg({ ...reg, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                            placeholder="6-digit OTP"
                            inputMode="numeric"
                          />
                        </Field>
                        <Field label="Email ID">
                          <input className={inputClass} value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} placeholder="name@example.com" />
                        </Field>
                        <Field label="Gender" required>
                          <select className={inputClass} value={reg.gender} onChange={(e) => setReg({ ...reg, gender: e.target.value })}>
                            <option value="">Select</option>
                            <option>Female</option>
                            <option>Male</option>
                            <option>Transgender</option>
                          </select>
                        </Field>
                        <Field label="Date of birth" required>
                          <input type="date" className={inputClass} value={reg.dob} onChange={(e) => setReg({ ...reg, dob: e.target.value })} />
                        </Field>
                        <Field label="Address">
                          <input className={inputClass} value={reg.address} onChange={(e) => setReg({ ...reg, address: e.target.value })} placeholder="City / district" />
                        </Field>
                      </div>
                    )}

                    {/* Step 2: Account Details */}
                    {regStep === 2 && (
                      <div className="grid sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        <Field label="Login ID" required>
                          <input className={inputClass} value={reg.loginId} onChange={(e) => setReg({ ...reg, loginId: e.target.value })} placeholder="Choose a login ID" />
                        </Field>
                        <div className="hidden sm:block" />
                        <Field label="Password" required hint="At least 8 characters.">
                          <input type="password" className={inputClass} value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} placeholder="Create a password" />
                        </Field>
                        <Field label="Confirm password" required>
                          <input type="password" className={inputClass} value={reg.confirm} onChange={(e) => setReg({ ...reg, confirm: e.target.value })} placeholder="Re-enter password" />
                        </Field>
                      </div>
                    )}

                    {/* Step 3: Security */}
                    {regStep === 3 && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <Field label="Security question 1" required>
                            <select className={inputClass} value={reg.q1} onChange={(e) => setReg({ ...reg, q1: e.target.value })}>
                              <option value="">Select</option>
                              {SECURITY_QUESTIONS.map((q) => <option key={q}>{q}</option>)}
                            </select>
                          </Field>
                          <Field label="Security answer 1" required>
                            <input className={inputClass} value={reg.a1} onChange={(e) => setReg({ ...reg, a1: e.target.value })} />
                          </Field>
                          <Field label="Security question 2" required>
                            <select className={inputClass} value={reg.q2} onChange={(e) => setReg({ ...reg, q2: e.target.value })}>
                              <option value="">Select</option>
                              {SECURITY_QUESTIONS.map((q) => <option key={q}>{q}</option>)}
                            </select>
                          </Field>
                          <Field label="Security answer 2" required>
                            <input className={inputClass} value={reg.a2} onChange={(e) => setReg({ ...reg, a2: e.target.value })} />
                          </Field>
                        </div>
                        <div className="border-t border-gray-100 pt-5 space-y-4">
                          <Captcha
                            value={reg.captcha}
                            code={regCaptcha}
                            onChange={(v) => setReg({ ...reg, captcha: v })}
                            onRefresh={refreshRegCaptcha}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 flex gap-3">
                    {regStep > 1 && (
                      <button type="button" onClick={prevStep} className="flex-1 btn-secondary justify-center py-4 rounded-xl shadow-sm text-base bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300">
                        Back
                      </button>
                    )}
                    <button type="submit" className="flex-[2] btn-primary justify-center py-4 rounded-xl shadow-lg shadow-primary/20 text-base">
                      {regStep === 3 ? (
                        <><UserPlus className="h-5 w-5 mr-2" /> Create Account</>
                      ) : (
                        'Next Step'
                      )}
                    </button>
                  </div>

                  <p className="text-center text-sm text-slate-500 pt-4 font-medium">
                    Already registered?{' '}
                    <button type="button" onClick={() => setMode('login')} className="text-secondary hover:text-blue-700 transition-colors">
                      Sign in
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>
          
          <p className="text-center text-xs text-slate-500 mt-8 max-w-lg mx-auto leading-relaxed px-4">
            This is a prototype. Authentication is simulated in the browser and no data is transmitted or stored.
            All access to the live register would be logged and auditable.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
