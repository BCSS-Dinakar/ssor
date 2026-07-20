import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  User,
  RefreshCw,
  LogIn,
  UserPlus,
  CheckCircle2,
  Clock,
  Home,
  AlertTriangle,
  Info,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react';

import {
  ROLES,
  ORG_TYPES,
  ORG_REG_STEPS,
} from '../utils/data/authData';
import { otpApi } from '../api/otp.api';
import SearchableSelect from '../components/SearchableSelect';
import locationData from '../utils/data/locationData.json';

const { COUNTRIES, STATES, DISTRICTS, CITIES } = locationData;

const emptyOrgReg = () => ({
  orgName: '',
  orgType: '',
  parentOrg: '',
  department: '',
  jurisdiction: '',
  country: '',
  state: '',
  district: '',
  city: '',
  address: '',
  pinCode: '',
  officialEmail: '',
  officialPhone: '',
  altPhone: '',
  website: '',
  adminName: '',
  designation: '',
  empId: '',
  adminEmail: '',
  mobile: '',
  loginId: '',
  password: '',
  confirm: '',
  authLetter: null,
  govCert: null,
  supportingDocs: null,
  acceptTerms: false,
  acceptPrivacy: false,
  confirmInfo: false,
  otp: '',
  captcha: '',
});

function makeCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i += 1) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function Field({ label, required, children, hint, className = '' }) {
  return (
    <div className={`flex flex-col h-full gap-2 ${className}`}>
      <div className="flex-1 flex flex-col justify-end">
        <label className="text-base font-semibold text-slate-700 tracking-wide">
          {label} {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      </div>
      <div className="w-full">
        {children}
      </div>
      {hint && <span className="text-sm text-slate-500 font-medium">{hint}</span>}
    </div>
  );
}


const baseInputClass = 'w-full bg-slate-50 border rounded-xl px-4 py-3 text-base outline-none transition-all duration-300 placeholder-slate-400';

function getInputClass(val, type = 'text', matchVal = '') {
  const value = val || '';
  if (!value) {
    return `${baseInputClass} border-slate-200 text-slate-800 focus:bg-white focus:border-secondary focus:ring-4 focus:ring-secondary/10`;
  }

  let isValid = false;
  let isWeak = false;

  if (type === 'email') {
    isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    isWeak = !isValid && value.length > 0;
  } else if (type === 'phone') {
    isValid = /^\d{10}$/.test(value);
    isWeak = !isValid && value.length > 0;
  } else if (type === 'pin') {
    isValid = /^\d{6}$/.test(value);
    isWeak = !isValid && value.length > 0;
  } else if (type === 'password') {
    isValid = value.length >= 8;
    isWeak = !isValid && value.length > 0;
  } else if (type === 'confirm') {
    isValid = value === matchVal && value.length >= 8;
    isWeak = !isValid && value.length > 0;
  } else {
    isValid = value.trim().length > 0;
  }

  if (isValid) {
    return `${baseInputClass} border-emerald-500 bg-emerald-50/30 text-emerald-900 focus:ring-4 focus:ring-emerald-500/20`;
  }
  if (isWeak) {
    return `${baseInputClass} border-amber-400 bg-amber-50/30 text-amber-900 focus:ring-4 focus:ring-amber-400/20`;
  }
  return `${baseInputClass} border-slate-200 text-slate-800 focus:border-secondary focus:ring-4 focus:ring-secondary/10`;
}

const inputClass = `${baseInputClass} border-slate-200 text-slate-800 focus:bg-white focus:border-secondary focus:ring-4 focus:ring-secondary/10 placeholder-slate-400`;


function Captcha({ value, code, onChange, onRefresh }) {
  return (
    <Field label="Enter the text shown" required>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-100 border border-slate-200 rounded-xl px-5 py-2.5 select-none shadow-inner shrink-0">
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
          className={inputClass + ' flex-1 min-w-0'}
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
    <div className={`flex items-start gap-2.5 border rounded-lg px-4 py-3 text-base ${cls}`}>
      <Icon className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

function StepIndicator({ steps, currentStep }) {
  const total = steps.length;
  const progress = total > 1 ? ((currentStep - 1) / (total - 1)) * 100 : 0;

  return (
    <div className="flex items-center justify-between mb-10 relative px-2 pt-1">
      <div className="absolute left-6 right-6 top-4 h-1 bg-slate-100 z-0 rounded-full" />
      <div
        className="absolute left-6 top-4 h-1 bg-accent transition-all duration-500 z-0 rounded-full"
        style={{ width: `calc(${progress}% - 24px)` }}
      />
      {steps.map((label, i) => {
        const step = i + 1;
        return (
          <div key={label} className="relative z-10 flex flex-col items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all duration-500 ${currentStep >= step
                ? 'bg-accent text-white shadow-md shadow-accent/30'
                : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}
            >
              {step}
            </div>
            <span
              className={`text-sm font-bold tracking-wide absolute -bottom-5 whitespace-nowrap transition-colors duration-500 ${currentStep >= step ? 'text-primary' : 'text-slate-400'
                }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, registerOrganization } = useAuth();
  const roleParam = searchParams.get('role');
  const modeParam = searchParams.get('mode');

  const initialRole = ['organization', 'police'].includes(roleParam) ? roleParam : 'organization';
  const initialMode = modeParam === 'register' && initialRole !== 'police' ? 'register' : 'login';

  const [role, setRole] = useState(initialRole);
  const [mode, setMode] = useState(initialMode);

  const [initialCaptcha] = useState(makeCaptcha);
  const [loginForm, setLoginForm] = useState({ userId: '', password: '', captcha: initialCaptcha });
  const [showPassword, setShowPassword] = useState(false);
  const [loginCaptcha, setLoginCaptcha] = useState(initialCaptcha);
  const [loginAlert, setLoginAlert] = useState(null);


  const [orgReg, setOrgReg] = useState(emptyOrgReg());
  const [regCaptcha, setRegCaptcha] = useState(makeCaptcha());
  const [regAlert, setRegAlert] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [regStep, setRegStep] = useState(1);

  const maxRegStep = ORG_REG_STEPS.length;
  const canRegister = role === 'organization';

  useEffect(() => {
    if (role === 'police') setMode('login');
    setLoginAlert(null);
    setRegAlert(null);
    setRegStep(1);
    setOtpSent(false);
    setOtpVerified(false);
    setOtpTimer(0);
    setOrgReg(emptyOrgReg());
    setRegCaptcha(makeCaptcha());
  }, [role]);

  useEffect(() => {
    if (mode === 'login') {
      setRegStep(1);
      setRegAlert(null);
    }
  }, [mode]);

  const refreshLoginCaptcha = useCallback(() => {
    setLoginCaptcha(makeCaptcha());
    setLoginForm((f) => ({ ...f, captcha: '' }));
  }, []);

  const refreshRegCaptchaState = useCallback(() => {
    setRegCaptcha(makeCaptcha());
    setOrgReg((r) => ({ ...r, captcha: '' }));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const idLabel = role === 'police' ? 'Officer username' : 'Login ID';
    if (!loginForm.userId.trim()) return setLoginAlert({ type: 'error', message: `${idLabel} is required.` });
    if (!loginForm.password) return setLoginAlert({ type: 'error', message: 'Password is required.' });
    if (loginForm.captcha !== loginCaptcha) {
      refreshLoginCaptcha();
      return setLoginAlert({ type: 'error', message: 'Captcha does not match. Please try again.' });
    }

    try {
      setLoginAlert({ type: 'info', message: 'Authenticating...' });
      await login(role, {
        loginId: loginForm.userId.trim(),
        password: loginForm.password
      });
      setLoginAlert({ type: 'success', message: 'Sign in successful! Redirecting...' });
      setTimeout(() => navigate('/portal'), 700);
    } catch (err) {
      setLoginAlert({ type: 'error', message: err.message || 'Authentication failed.' });
      refreshLoginCaptcha();
    }
  };

  // OTP countdown timer
  useEffect(() => {
    if (otpTimer <= 0) return;
    const tick = setTimeout(() => setOtpTimer((t) => t - 1), 1000);
    return () => clearTimeout(tick);
  }, [otpTimer]);

  const sendOtp = async (mobile) => {
    if (!/^\d{10}$/.test(mobile.trim())) {
      return setRegAlert({ type: 'error', message: 'Enter a valid 10-digit mobile number to receive an OTP.' });
    }
    try {
      setRegAlert({ type: 'info', message: 'Sending OTP...' });
      const data = await otpApi.send(orgReg.mobile.replace(/-/g, ''));
      if (data.success) {
        setOtpSent(true);
        setOtpVerified(false);
        setOtpTimer(60);
        setOrgReg((r) => ({ ...r, otp: '' }));
        const hint = data.devOtp ? ` (dev OTP: ${data.devOtp})` : '';
        setRegAlert({ type: 'info', message: `OTP sent to ${mobile.trim()}${hint}.` });
      } else {
        setRegAlert({ type: 'error', message: data.message || 'Failed to send OTP.' });
      }
    } catch (err) {
      setRegAlert({ type: 'error', message: err.response?.data?.message || err.message || 'Failed to send OTP.' });
    }
  };

  const verifyOtpApi = useCallback(async (mobile, otp) => {
    try {
      const data = await otpApi.verify(mobile.trim(), otp.trim());
      if (data.success) {
        setOtpVerified(true);
        setOtpTimer(0);
        setRegAlert({ type: 'success', message: 'Mobile number verified successfully.' });
      } else {
        setOtpVerified(false);
        setRegAlert({ type: 'error', message: data.message || 'Invalid OTP.' });
      }
    } catch (err) {
      setRegAlert({ type: 'error', message: err.response?.data?.message || err.message || 'OTP verification failed.' });
    }
  }, []);

  const validateOtp = () => {
    if (!otpSent) return setRegAlert({ type: 'error', message: 'Please request an OTP for your mobile number.' });
    if (!otpVerified) return setRegAlert({ type: 'error', message: 'Please verify your OTP before continuing.' });
    return true;
  };

  const validateOrgStep1 = () => {
    if (!orgReg.orgName.trim()) return setRegAlert({ type: 'error', message: 'Organization name is required.' });
    if (!orgReg.orgType) return setRegAlert({ type: 'error', message: 'Organization type is required.' });
    if (!orgReg.parentOrg.trim()) return setRegAlert({ type: 'error', message: 'Parent organization is required.' });
    if (!orgReg.department.trim()) return setRegAlert({ type: 'error', message: 'Department / Unit is required.' });
    if (!orgReg.jurisdiction.trim()) return setRegAlert({ type: 'error', message: 'Jurisdiction is required.' });
    return true;
  };

  const validateOrgStep2 = () => {
    if (!orgReg.state.trim()) return setRegAlert({ type: 'error', message: 'State is required.' });
    if (!orgReg.district.trim()) return setRegAlert({ type: 'error', message: 'District is required.' });
    if (!orgReg.city.trim()) return setRegAlert({ type: 'error', message: 'City is required.' });
    if (!orgReg.address.trim()) return setRegAlert({ type: 'error', message: 'Address is required.' });
    if (!orgReg.pinCode.trim()) return setRegAlert({ type: 'error', message: 'PIN Code is required.' });
    if (!/^\d{6}$/.test(orgReg.pinCode.trim())) return setRegAlert({ type: 'error', message: 'Enter a valid 6-digit PIN code.' });
    return true;
  };

  const validateOrgStep3 = () => {
    if (!orgReg.officialEmail.trim()) return setRegAlert({ type: 'error', message: 'Official email is required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orgReg.officialEmail.trim())) return setRegAlert({ type: 'error', message: 'Enter a valid official email address.' });
    if (!orgReg.officialPhone.trim()) return setRegAlert({ type: 'error', message: 'Official phone is required.' });
    if (!/^[\d\s()+-]{7,15}$/.test(orgReg.officialPhone.trim())) return setRegAlert({ type: 'error', message: 'Enter a valid official phone number.' });
    if (!orgReg.altPhone.trim()) return setRegAlert({ type: 'error', message: 'Alternate phone is required.' });
    if (!orgReg.website.trim()) return setRegAlert({ type: 'error', message: 'Website is required.' });
    return true;
  };

  const validateOrgStep4 = () => {
    if (!orgReg.adminName.trim()) return setRegAlert({ type: 'error', message: 'Full name is required.' });
    if (!orgReg.designation.trim()) return setRegAlert({ type: 'error', message: 'Designation is required.' });
    if (!orgReg.empId.trim()) return setRegAlert({ type: 'error', message: 'Employee ID is required.' });
    if (!orgReg.adminEmail.trim()) return setRegAlert({ type: 'error', message: 'Admin email is required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orgReg.adminEmail.trim())) return setRegAlert({ type: 'error', message: 'Enter a valid admin email address.' });
    if (!orgReg.mobile.replace(/-/g, '').trim()) return setRegAlert({ type: 'error', message: 'Mobile number is required.' });
    if (!/^\d{10}$/.test(orgReg.mobile.replace(/-/g, '').trim())) return setRegAlert({ type: 'error', message: 'Enter a valid 10-digit mobile number.' });
    if (!orgReg.loginId.trim()) return setRegAlert({ type: 'error', message: 'Username (Login ID) is required.' });
    if (!orgReg.password) return setRegAlert({ type: 'error', message: 'Password is required.' });
    if (orgReg.password.length < 8) return setRegAlert({ type: 'error', message: 'Password must be at least 8 characters.' });
    if (!orgReg.confirm) return setRegAlert({ type: 'error', message: 'Please confirm your password.' });
    if (orgReg.password !== orgReg.confirm) return setRegAlert({ type: 'error', message: 'Passwords do not match.' });
    if (!validateOtp()) return false;
    return true;
  };

  const validateOrgStep5 = () => {
    if (!orgReg.authLetter) return setRegAlert({ type: 'error', message: 'Authorization Letter is required.' });
    if (!orgReg.govCert) return setRegAlert({ type: 'error', message: 'Government Certificate is required.' });
    return true;
  };

  const validateOrgStep6 = () => true;


  const validateOrgStep7 = () => {
    if (!orgReg.acceptTerms || !orgReg.acceptPrivacy || !orgReg.confirmInfo) {
      return setRegAlert({ type: 'error', message: 'You must accept the terms and confirm the information.' });
    }
    if (orgReg.captcha !== regCaptcha) {
      refreshRegCaptchaState();
      return setRegAlert({ type: 'error', message: 'Captcha does not match. Please try again.' });
    }
    return true;
  };

  const nextStep = () => {
    setRegAlert(null);
    if (regStep === 1 && validateOrgStep1()) setRegStep(2);
    else if (regStep === 2 && validateOrgStep2()) setRegStep(3);
    else if (regStep === 3 && validateOrgStep3()) setRegStep(4);
    else if (regStep === 4 && validateOrgStep4()) setRegStep(5);
    else if (regStep === 5 && validateOrgStep5()) setRegStep(6);
    else if (regStep === 6 && validateOrgStep6()) setRegStep(7);
  };

  const prevStep = () => {
    setRegAlert(null);
    setRegStep((s) => Math.max(1, s - 1));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regStep < maxRegStep) {
      nextStep();
      return;
    }

    if (!validateOrgStep7()) return;

    if (role === 'organization') {
      try {
        setRegAlert({ type: 'info', message: 'Submitting registration...' });
        const submitData = { ...orgReg, mobile: orgReg.mobile.replace(/-/g, '') };
        await registerOrganization(submitData);
        setIsSubmitted(true);
      } catch (err) {
        setRegAlert({ type: 'error', message: err.message || 'Registration failed.' });
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden bg-primary shrink-0">
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-accent rounded-full filter blur-[120px] opacity-20" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500 rounded-full filter blur-[120px] opacity-20" />
        </div>
        <div
          className="absolute inset-0 opacity-5 pointer-events-none z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent z-10" />
          <img src="/images/hero-shield.png" alt="" className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
        </div>
        <div className="relative z-10 p-12 lg:p-16 flex flex-col h-full justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-base font-medium transition-colors w-max">
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
              Government of Telangana, State Police. Organizations and officers each access the register through their own doorway.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-200/50 tracking-wide font-semibold">
            <Lock className="h-4 w-4" />
            Two roles · Strict access control
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen overflow-y-auto">
        <div className="lg:hidden bg-gradient-to-br from-primary via-[#0E2A4F] to-secondary p-6 sm:p-8 text-white relative overflow-hidden shrink-0">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-base font-medium mb-6 transition-colors relative z-10">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="inline-flex items-center gap-3 relative z-10">
            <div className="h-10 w-10 overflow-hidden rounded-lg bg-white/10 p-0.5 shadow-sm">
              <img src="/images/ssor-logo.png" alt="SSOR Logo" className="h-full w-full object-cover rounded-lg" />
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-white font-heading tracking-tight">SSOR Portal</span>
          </div>
        </div>

        <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 lg:py-12 flex-1">
          {/* Role toggle */}
          <div className="bg-slate-100 rounded-2xl p-1.5 grid grid-cols-2 gap-1.5 mb-6">
            {ROLES.map((r) => {
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`flex items-start gap-2.5 rounded-xl px-3 sm:px-4 py-3 text-left transition-all duration-300 min-w-0 ${
                    active ? 'bg-white shadow-md ring-1 ring-slate-200/80' : 'hover:bg-slate-200/70'
                  }`}
                >
                  <r.Icon className={`h-5 w-5 shrink-0 mt-0.5 ${active ? 'text-accent' : 'text-slate-400'}`} />
                  <div className="min-w-0 flex-1">
                    <div className={`font-bold text-sm sm:text-base leading-snug ${active ? 'text-primary' : 'text-slate-700'}`}>
                      {r.label}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500 leading-snug mt-0.5 break-words">
                      {r.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-6 sm:p-8">
              {/* Login */}
              {mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="mb-2">
                    <h2 className="text-2xl font-bold text-primary font-heading tracking-tight">
                      {role === 'police' ? 'Officer Sign In' : role === 'organization' ? 'Organization Sign In' : 'Sign In'}
                    </h2>
                    <p className="text-base text-slate-500 mt-2 leading-relaxed">
                      {role === 'police'
                        ? 'Restricted to authorised officers with recorded clearance. Every action is audited.'
                        : 'Sign in to submit clearance requests, track verifications, and manage your institution account.'}
                    </p>
                  </div>

                  <Alert type={loginAlert?.type} message={loginAlert?.message} />

                  <Field label={role === 'police' ? 'Officer username' : 'Login ID'} required>
                    <div className="relative">
                      <User className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        className={getInputClass(loginForm.userId, 'text') + ' pl-9'}
                        placeholder={role === 'police' ? 'e.g. insp.reddy' : 'Your registered login ID'}
                        value={loginForm.userId}
                        onChange={(e) => setLoginForm({ ...loginForm, userId: e.target.value })}
                      />
                    </div>
                  </Field>

                  <Field label="Password" required>
                    <div className="relative">
                      <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={getInputClass(loginForm.password, 'text') + ' pl-9 pr-10'}
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-secondary"
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

                  <button type="submit" className="btn-primary w-full justify-center py-3.5 rounded-xl shadow-lg shadow-primary/20 text-base">
                    <LogIn className="h-5 w-5" />
                    Sign In
                  </button>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-base pt-1">
                    <Link to="/login" className="text-secondary font-medium hover:text-blue-700 transition-colors">
                      Forgot password?
                    </Link>
                    {canRegister ? (
                      <button type="button" onClick={() => setMode('register')} className="text-secondary font-medium hover:text-blue-700 transition-colors text-left sm:text-right">
                        New user? Create account
                      </button>
                    ) : (
                      <span className="text-sm text-slate-500 flex items-center gap-1.5 font-medium">
                        <Info className="h-4 w-4 shrink-0" />
                        Accounts provisioned by the department
                      </span>
                    )}
                  </div>
                </form>
              )}


              {/* Organization registration */}

              {/* Registration Success Screen */}
              {mode === 'register' && role === 'organization' && isSubmitted && (
                <div className="py-12 px-6 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-24 h-24 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4 animate-pulse">
                    <Clock className="w-12 h-12" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800 font-heading">Application Under Review</h2>
                  <div className="max-w-md text-slate-500 space-y-4">
                    <p>
                      Thank you for registering <strong>{orgReg.orgName || 'your organization'}</strong>.
                    </p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-base shadow-inner">
                      Your application has been forwarded to the Police Verification Department. Verification typically takes 2-3 business days.
                    </div>
                    <p>
                      You will receive an email notification at <strong>{orgReg.adminEmail || 'your official email'}</strong> once your account has been approved.
                    </p>
                  </div>
                  <div className="pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSubmitted(false);
                        setMode('login');
                      }}
                      className="btn-primary"
                    >
                      <Home className="w-4 h-4" /> Return to Sign In
                    </button>
                  </div>
                </div>
              )}

              {mode === 'register' && role === 'organization' && !isSubmitted && (
                <form onSubmit={handleRegister} className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-bold text-primary font-heading tracking-tight">Organization Registration</h2>
                    <p className="text-base text-slate-500 mt-2">
                      Register your institution to access clearance verification services. Accounts are licence-linked and verified by the police.
                    </p>
                  </div>

                  <StepIndicator steps={ORG_REG_STEPS} currentStep={regStep} />
                  <Alert type={regAlert?.type} message={regAlert?.message} />

                  <div className="min-h-[240px]">
                    {regStep === 1 && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Organization name" required className="sm:col-span-2">
                          <input className={getInputClass(orgReg.orgName, 'text')} value={orgReg.orgName} onChange={(e) => setOrgReg({ ...orgReg, orgName: e.target.value })} placeholder="e.g. Kakatiya High School" />
                        </Field>
                        <Field label="Organization type" required>
                          <SearchableSelect 
                            value={orgReg.orgType}
                            onChange={(val) => setOrgReg({ ...orgReg, orgType: val })}
                            options={ORG_TYPES}
                            placeholder="Select Type"
                          />
                        </Field>
                        <Field label="Parent organization" required>
                          <input className={getInputClass(orgReg.parentOrg, 'text')} value={orgReg.parentOrg} onChange={(e) => setOrgReg({ ...orgReg, parentOrg: e.target.value })} placeholder="e.g. Trust or Society Name" />
                        </Field>
                        <Field label="Department / Unit" required>
                          <input className={getInputClass(orgReg.department, 'text')} value={orgReg.department} onChange={(e) => setOrgReg({ ...orgReg, department: e.target.value })} placeholder="e.g. Primary Section" />
                        </Field>
                        <Field label="Jurisdiction" required>
                          <input className={getInputClass(orgReg.jurisdiction, 'text')} value={orgReg.jurisdiction} onChange={(e) => setOrgReg({ ...orgReg, jurisdiction: e.target.value })} placeholder="e.g. South Zone" />
                        </Field>
                      </div>
                    )}

                    {regStep === 2 && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Country" required>
                          <SearchableSelect 
                            value={orgReg.country} 
                            onChange={(val) => setOrgReg({ ...orgReg, country: val })} 
                            options={COUNTRIES} 
                            placeholder="Select Country" 
                          />
                        </Field>
                        <Field label="State" required>
                          <SearchableSelect 
                            value={orgReg.state} 
                            onChange={(val) => setOrgReg({ ...orgReg, state: val })} 
                            options={STATES} 
                            placeholder="Select State" 
                          />
                        </Field>
                        <Field label="District" required>
                          <SearchableSelect 
                            value={orgReg.district} 
                            onChange={(val) => setOrgReg({ ...orgReg, district: val })} 
                            options={DISTRICTS} 
                            placeholder="Select District" 
                          />
                        </Field>
                        <Field label="City" required>
                          <SearchableSelect 
                            value={orgReg.city} 
                            onChange={(val) => setOrgReg({ ...orgReg, city: val })} 
                            options={CITIES} 
                            placeholder="Select City" 
                          />
                        </Field>
                        <Field label="Address" required className="sm:col-span-2">
                          <input className={getInputClass(orgReg.address, 'text')} value={orgReg.address} onChange={(e) => setOrgReg({ ...orgReg, address: e.target.value })} placeholder="Street address, building, etc." />
                        </Field>
                        <Field label="PIN Code" required>
                          <input className={getInputClass(orgReg.pinCode, 'pin')} value={orgReg.pinCode}
                            onChange={(e) => setOrgReg({ ...orgReg, pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                            placeholder="6-digit PIN"
                            inputMode="numeric"
                            maxLength={6}
                          />
                        </Field>
                      </div>
                    )}

                    {regStep === 3 && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Official Email" required className="sm:col-span-2">
                          <input className={inputClass} type="email" value={orgReg.officialEmail} onChange={(e) => setOrgReg({ ...orgReg, officialEmail: e.target.value })} placeholder="official@institution.edu" />
                        </Field>
                        <Field label="Official Phone" required>
                          <input className={getInputClass(orgReg.officialPhone, 'phone')} value={orgReg.officialPhone} onChange={(e) => setOrgReg({ ...orgReg, officialPhone: e.target.value })} placeholder="e.g. 040-12345678" />
                        </Field>
                        <Field label="Alternate Phone" required>
                          <input className={getInputClass(orgReg.altPhone, 'phone')} value={orgReg.altPhone} onChange={(e) => setOrgReg({ ...orgReg, altPhone: e.target.value })} placeholder="Alternate contact number" />
                        </Field>
                        <Field label="Website" required className="sm:col-span-2">
                          <input className={inputClass} type="url" value={orgReg.website} onChange={(e) => setOrgReg({ ...orgReg, website: e.target.value })} placeholder="https://www.institution.edu" />
                        </Field>
                      </div>
                    )}

                    {regStep === 4 && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Full Name" required>
                          <input className={getInputClass(orgReg.adminName, 'text')} value={orgReg.adminName} onChange={(e) => setOrgReg({ ...orgReg, adminName: e.target.value })} placeholder="Administrator's name" />
                        </Field>
                        <Field label="Designation" required>
                          <input className={getInputClass(orgReg.designation, 'text')} value={orgReg.designation} onChange={(e) => setOrgReg({ ...orgReg, designation: e.target.value })} placeholder="e.g. Principal, Director" />
                        </Field>
                        <Field label="Employee ID" required>
                          <input className={getInputClass(orgReg.empId, 'text')} value={orgReg.empId} onChange={(e) => setOrgReg({ ...orgReg, empId: e.target.value })} placeholder="Staff ID" />
                        </Field>
                        <Field label="Mobile Number" required>
                          <div className="flex gap-2">
                            <input className={getInputClass(orgReg.mobile, 'phone')} value={orgReg.mobile}
                              onChange={(e) => setOrgReg({ ...orgReg, mobile: e.target.value.replace(/\D/g, '').slice(0, 10).replace(/(\d{5})(?=\d)/g, '$1-') })}
                              placeholder="10-digit mobile"
                              inputMode="numeric"
                              maxLength={11}
                              disabled={otpVerified}
                            />
                            {otpTimer > 0 ? (
                              <div className="btn-secondary whitespace-nowrap px-3 py-2 text-sm shrink-0 flex items-center gap-1 opacity-70 cursor-not-allowed">
                                <span className="font-mono text-secondary font-bold">{otpTimer}s</span>
                              </div>
                            ) : (
                              <button type="button" onClick={() => sendOtp(orgReg.mobile.replace(/-/g, ''))} disabled={otpVerified}
                                className={`btn-secondary whitespace-nowrap px-3 py-2 text-sm shrink-0 ${otpVerified ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {otpSent && !otpVerified ? 'Resend OTP' : 'Send OTP'}
                              </button>
                            )}
                          </div>
                        </Field>
                        {otpSent && !otpVerified && (
                          <Field label="OTP Verification" required hint="Enter the 6-digit OTP sent to your mobile.">
                            <div className="relative">
                              <input
                                className={getInputClass(orgReg.otp, 'pin')}
                                value={orgReg.otp}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/-/g, '').slice(0, 6);
                                  setOrgReg({ ...orgReg, otp: val });
                                  if (val.length === 6) verifyOtpApi(orgReg.mobile.replace(/-/g, ''), val);
                                }}
                                placeholder="Enter 6-digit OTP"
                                inputMode="numeric"
                                maxLength={6}
                              />
                            </div>
                          </Field>
                        )}
                        {otpVerified && (
                          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-base font-semibold">
                            <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Mobile verified ✓
                          </div>
                        )}

                        <Field label="Official Email" required>
                          <input className={inputClass} type="email" value={orgReg.adminEmail} onChange={(e) => setOrgReg({ ...orgReg, adminEmail: e.target.value })} placeholder="admin@institution.edu" />
                        </Field>
                        <Field label="Username" required className="sm:col-span-2 sm:max-w-sm">
                          <input className={getInputClass(orgReg.loginId, 'text')} value={orgReg.loginId} onChange={(e) => setOrgReg({ ...orgReg, loginId: e.target.value })} placeholder="Choose a unique username" />
                        </Field>
                        <Field label="Password" required hint="At least 8 characters.">
                          <input type="password" className={inputClass} value={orgReg.password} onChange={(e) => setOrgReg({ ...orgReg, password: e.target.value })} placeholder="Create a password" />
                        </Field>
                        <Field label="Confirm password" required>
                          <input type="password" className={inputClass} value={orgReg.confirm} onChange={(e) => setOrgReg({ ...orgReg, confirm: e.target.value })} placeholder="Re-enter password" />
                        </Field>
                      </div>
                    )}

                    {regStep === 5 && (
                      <div className="space-y-4">
                        <Field label="Authorization Letter" required hint="PDF or JPG. Max 5MB.">
                          <input type="file" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 outline-none transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-base file:font-semibold file:bg-blue-50 file:text-secondary hover:file:bg-blue-100" onChange={(e) => setOrgReg({ ...orgReg, authLetter: e.target.files[0] })} />
                        </Field>
                        <Field label="Government Certificate" required hint="e.g. School Registration Certificate">
                          <input type="file" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 outline-none transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-base file:font-semibold file:bg-blue-50 file:text-secondary hover:file:bg-blue-100" onChange={(e) => setOrgReg({ ...orgReg, govCert: e.target.files[0] })} />
                        </Field>
                        <Field label="Supporting Documents" hint="Additional accreditations or licences (optional)">
                          <input type="file" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 outline-none transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-base file:font-semibold file:bg-blue-50 file:text-secondary hover:file:bg-blue-100" multiple onChange={(e) => setOrgReg({ ...orgReg, supportingDocs: e.target.files })} />
                        </Field>
                        <p className="text-sm text-slate-500 mt-2 italic">Note: PDF, JPG or PNG accepted. Max 5MB per file.</p>
                      </div>
                    )}

                    {regStep === 6 && (
                      <div className="space-y-4 text-base bg-white p-5 border border-slate-200 rounded-xl max-h-[400px] overflow-y-auto shadow-inner">
                        <h3 className="font-semibold text-primary mb-2 border-b pb-2">Application Review</h3>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                          <div className="text-slate-500">Organization Name</div>
                          <div className="font-medium">{orgReg.orgName || '-'}</div>
                          <div className="text-slate-500">Type</div>
                          <div className="font-medium">{orgReg.orgType || '-'}</div>
                          <div className="text-slate-500">City / District</div>
                          <div className="font-medium">{orgReg.city || '-'} ({orgReg.district || '-'})</div>
                          <div className="text-slate-500">Official Email</div>
                          <div className="font-medium">{orgReg.officialEmail || '-'}</div>
                          <div className="text-slate-500">Admin Name</div>
                          <div className="font-medium">{orgReg.adminName || '-'}</div>
                          <div className="text-slate-500">Username</div>
                          <div className="font-medium">{orgReg.loginId || '-'}</div>
                          <div className="text-slate-500">Uploaded Docs</div>
                          <div className="font-medium text-emerald-600">
                            {orgReg.authLetter ? 'Letter' : ''} {orgReg.govCert ? ', Cert' : ''}
                          </div>
                        </div>
                        <p className="text-sm text-slate-400 mt-4">Please ensure all details are correct. You cannot edit these once submitted.</p>
                      </div>
                    )}

                    {regStep === 7 && (
                      <div className="space-y-5">
                        <div className="space-y-3 bg-white p-5 border border-slate-200 rounded-xl">
                          <label className="flex items-start gap-3 cursor-pointer group">
                            <input type="checkbox" className="mt-1 w-4 h-4 text-secondary border-slate-300 rounded focus:ring-secondary/20" checked={orgReg.acceptTerms} onChange={(e) => setOrgReg({ ...orgReg, acceptTerms: e.target.checked })} />
                            <span className="text-base text-slate-700 group-hover:text-slate-900 transition-colors">I accept the Terms & Conditions of the State Sexual Offender Registry.</span>
                          </label>
                          <label className="flex items-start gap-3 cursor-pointer group">
                            <input type="checkbox" className="mt-1 w-4 h-4 text-secondary border-slate-300 rounded focus:ring-secondary/20" checked={orgReg.acceptPrivacy} onChange={(e) => setOrgReg({ ...orgReg, acceptPrivacy: e.target.checked })} />
                            <span className="text-base text-slate-700 group-hover:text-slate-900 transition-colors">I accept the Privacy Policy and consent to data processing for verification.</span>
                          </label>
                          <label className="flex items-start gap-3 cursor-pointer group">
                            <input type="checkbox" className="mt-1 w-4 h-4 text-secondary border-slate-300 rounded focus:ring-secondary/20" checked={orgReg.confirmInfo} onChange={(e) => setOrgReg({ ...orgReg, confirmInfo: e.target.checked })} />
                            <span className="text-base text-slate-700 group-hover:text-slate-900 transition-colors">I confirm that all information provided is true and accurate to the best of my knowledge.</span>
                          </label>
                        </div>
                        <Captcha
                          value={orgReg.captcha}
                          code={regCaptcha}
                          onChange={(v) => setOrgReg({ ...orgReg, captcha: v })}
                          onRefresh={refreshRegCaptchaState}
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex gap-3">
                    {regStep > 1 && (
                      <button type="button" onClick={prevStep} className="flex-1 btn-secondary justify-center py-3.5 rounded-xl text-base bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50">
                        Back
                      </button>
                    )}
                    <button type="submit" className="flex-[2] btn-primary justify-center py-3.5 rounded-xl shadow-lg shadow-primary/20 text-base">
                      {regStep === maxRegStep ? (
                        <><UserPlus className="h-5 w-5 mr-2" /> Create Account</>
                      ) : (
                        'Next Step'
                      )}
                    </button>
                  </div>

                  <p className="text-center text-base text-slate-500 font-medium">
                    Already registered?{' '}
                    <button type="button" onClick={() => setMode('login')} className="text-secondary hover:text-blue-700 transition-colors">
                      Sign in
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6 max-w-lg mx-auto leading-relaxed px-4">
            This is a prototype. Authentication is simulated in the browser and no data is transmitted or stored.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
