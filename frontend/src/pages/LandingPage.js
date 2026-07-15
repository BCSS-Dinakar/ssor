import { Link } from 'react-router-dom';
import Footer from '../components/common/Footer';
import HeroWaves from '../components/common/HeroWaves';
import {
  Shield,
  ShieldCheck,
  Lock,
  Scale,
  Fingerprint,
  Database,
  CheckCircle2,
  Activity,
  ArrowRight,
  Building2,
  LogIn,
  FileCheck,
  ClipboardList,
  UserCheck,
} from 'lucide-react';

import { legalFramework, accessLevels, tiers, capabilities } from '../utils/data/landingData';

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ───────── HERO: exact first viewport (below sticky nav h-16) ───────── */}
      <section
        className="relative flex min-h-[calc(100svh-4rem)] overflow-x-hidden overflow-y-auto lg:overflow-hidden lg:h-[calc(100dvh-4rem)]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#0E2A4F] to-secondary" />
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-[8%] left-[4%] w-[min(40vw,18rem)] h-[min(40vw,18rem)] bg-accent rounded-full filter blur-3xl" />
          <div className="absolute bottom-[6%] right-[6%] w-[min(50vw,22rem)] h-[min(50vw,22rem)] bg-blue-400 rounded-full filter blur-3xl" />
        </div>
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 flex w-full flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 pb-12 sm:pb-14 lg:pb-16 min-h-0 flex-1">
          <div className="grid min-h-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-4 sm:gap-6 lg:gap-10 items-center">
            {/* Copy */}
            <div className="text-center lg:text-left flex flex-col justify-center min-h-0">
              <div className="inline-flex self-center lg:self-start items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />
                Government of Telangana · State Police
              </div>

              <h1
                className="font-bold text-white font-heading leading-[1.1] tracking-tight"
                style={{ fontSize: 'clamp(1.65rem, 2.2vw + 1rem, 3.25rem)' }}
              >
                One register.
                <br />
                Two doorways.
                <br />
                <span className="text-accent">Strict access.</span>
              </h1>

              <p
                className="mt-3 sm:mt-4 text-gray-300 max-w-xl lg:mx-0 mx-auto leading-relaxed"
                style={{ fontSize: 'clamp(0.875rem, 0.4vw + 0.75rem, 1.125rem)' }}
              >
                A conviction-based, colour-coded Sexual Offender Register built to protect women and
                children — verified clearance for organizations, structured monitoring for police.
              </p>

              <div className="mt-4 sm:mt-6 flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center lg:justify-start justify-center gap-2.5 sm:gap-3">
                <Link
                  to="/services"
                  className="btn-accent justify-center text-sm sm:text-base px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl"
                >
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  Organization Services
                </Link>
                <Link
                  to="/login"
                  className="btn-primary justify-center text-sm sm:text-base px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20"
                >
                  <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
                  Login
                </Link>
              </div>

              <div className="mt-4 sm:mt-6 hidden min-[480px]:flex flex-wrap items-center lg:justify-start justify-center gap-x-5 gap-y-2 text-gray-400 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-green-400 shrink-0" />
                  <span>Controlled disclosure</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-green-400 shrink-0" />
                  <span>Conviction-based only</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-green-400 shrink-0" />
                  <span>100% access logged</span>
                </div>
              </div>
            </div>

            {/* Media — scales within remaining column height */}
            <div className="relative hidden sm:flex items-center justify-center min-h-0 h-full max-h-full py-1">
              <div className="absolute inset-[8%] bg-accent/15 rounded-3xl blur-2xl pointer-events-none" />
              <img
                src="/images/hero-shield.png"
                alt="Shield protecting women and children, with scales of justice and secure database"
                className="relative z-[1] rounded-2xl shadow-2xl border border-white/10 w-full h-auto max-h-[min(52dvh,28rem)] lg:max-h-[min(62dvh,34rem)] object-contain"
              />
            </div>
          </div>
        </div>

        {/* Animated wave transition */}
        <HeroWaves />
      </section>

      {/* ───────── DOORWAY ACCESS (below hero) ───────── */}
      <section className="relative z-20 bg-background -mt-1 pt-6 sm:pt-8 pb-4 sm:pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 max-w-5xl mx-auto">
            {accessLevels.map((level) => (
              <Link
                key={level.title}
                to={level.cta.to}
                className="group flex items-center gap-3 sm:gap-4 rounded-2xl bg-white border border-slate-200 px-4 py-4 sm:px-5 sm:py-5 shadow-panel hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className={`${level.iconBg} h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0`}>
                  <level.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${level.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-primary text-sm sm:text-base font-heading leading-tight">
                      {level.title}
                    </span>
                    <span className={`${level.tagClass} text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full`}>
                      {level.tag}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-snug">
                    {level.points[0]}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 group-hover:text-secondary shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── LEGAL FRAMEWORK STRIP ───────── */}
      <section className="bg-background border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm tracking-wide text-muted font-semibold mb-5">
            Built on the Constitution & Statutory Framework
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {legalFramework.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-primary text-base font-medium px-4 py-2 rounded-full shadow-sm"
              >
                <Scale className="h-3.5 w-3.5 text-accent" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── WHY NO PUBLIC SEARCH ───────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm font-semibold tracking-wide mb-5">
                <Lock className="h-3.5 w-3.5" />
                Privacy by Design
              </div>
              <h2 className="section-title text-left">Why there is no public search</h2>
              <p className="text-muted leading-relaxed mt-4">
                Consistent with the right to privacy (<span className="italic">K.S. Puttaswamy</span>, 2017) and the
                Digital Personal Data Protection Act, 2023, this register is <strong className="text-primary">not openly
                  searchable</strong>. Institutions receive a verified clear / refer result through the police; offender
                details are never published.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Only convicted persons are held in the disclosable register.',
                  'Information is released through controlled channels, not thrown open to the public.',
                  'Every entry and disclosure meets the tests of legality, necessity and proportionality.',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3 text-base text-gray-700">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 lg:order-2 relative">
              <img
                src="/images/controlled-access.png"
                alt="Secure database connected to a verified clear result, with an open public list crossed out"
                className="rounded-2xl shadow-lg border border-gray-100 w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ───────── ACCESS MODEL ───────── */}
      <section className="py-14 sm:py-16 lg:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="section-title">Two levels of controlled access</h2>
            <p className="section-subtitle">Access is granted strictly by authorisation — police manage the register; organizations request clearance.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 sm:gap-6 lg:gap-8 max-w-5xl mx-auto">
            {accessLevels.map((level) => (
              <div key={level.title} className="card p-6 sm:p-8 relative group hover:-translate-y-1 flex flex-col h-full">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${level.accent} rounded-t-xl`} />
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div className={`${level.iconBg} w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0`}>
                    <level.icon className={`h-6 w-6 sm:h-7 sm:w-7 ${level.iconColor}`} />
                  </div>
                  <span className={`${level.tagClass} text-xs sm:text-sm font-bold px-2.5 sm:px-3 py-1 rounded-full shadow-sm shrink-0`}>
                    {level.tag}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-primary font-heading mb-2 sm:mb-3">{level.title}</h3>
                <p className="text-muted leading-relaxed mb-5 text-sm sm:text-base flex-1">{level.description}</p>
                <ul className="space-y-2.5 mb-6">
                  {level.points.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm sm:text-base text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to={level.cta.to} className={`${level.ctaClass} w-full justify-center text-sm sm:text-base mt-auto`}>
                  {level.cta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── COLOUR-CODED CLASSIFICATION ───────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">Colour-coded risk classification</h2>
            <p className="section-subtitle">Every tier corresponds to a real, constitutionally valid offence and maps to precise sections of law.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tiers.map((tier) => (
              <div key={tier.name} className="card p-6 group hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`${tier.color} h-10 w-10 rounded-lg flex items-center justify-center shadow-sm`}>
                    <Shield className="h-5 w-5 text-white" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-primary font-heading leading-tight">{tier.name}</h3>
                    <p className="text-sm text-muted">{tier.category}</p>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <Scale className="h-3.5 w-3.5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="font-mono">{tier.law}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Lock className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                    <span>Retention: <strong className="text-primary">{tier.retention}</strong></span>
                  </div>
                </div>
              </div>
            ))}
            {/* Note card */}
            <div className="rounded-xl p-6 bg-gradient-to-br from-primary to-secondary text-white flex flex-col justify-center">
              <ShieldCheck className="h-8 w-8 text-accent mb-3" />
              <p className="text-base leading-relaxed text-gray-200">
                A single act may attract more than one provision. Every applicable section is recorded and the
                offender is classified at the <strong className="text-white">highest tier</strong> that applies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── INSTITUTION VERIFICATION ───────── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src="/images/institution-verify.png"
                alt="Safe recruitment verification for schools, creches and caregivers"
                className="rounded-2xl shadow-lg border border-gray-100 w-full"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 text-secondary px-3 py-1 rounded-full text-sm font-semibold tracking-wide mb-5">
                <FileCheck className="h-3.5 w-3.5" />
                Safe Recruitment
              </div>
              <h2 className="section-title text-left">Verification where it matters most</h2>
              <p className="text-muted leading-relaxed mt-4">
                The greatest value of the register lies in verification — letting a school, creche or transport
                operator confirm, before entrusting a child to a person, that they carry no record of a sexual offence.
              </p>
              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                {[
                  { icon: ClipboardList, title: 'Apply', text: 'Submit a candidate for background verification.' },
                  { icon: Fingerprint, title: 'Verify', text: 'Police cross-check under controlled access.' },
                  { icon: UserCheck, title: 'Decide', text: 'Receive a verified clear / refer result.' },
                  { icon: FileCheck, title: 'Certify', text: 'A licence-linked clearance certificate is issued.' },
                ].map((step) => (
                  <div key={step.title} className="card p-4 flex items-start gap-3">
                    <div className="bg-blue-50 h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0">
                      <step.icon className="h-4.5 w-4.5 text-secondary" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-primary">{step.title}</h4>
                      <p className="text-sm text-muted leading-relaxed mt-0.5">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── CAPABILITIES ───────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">Core safeguards</h2>
            <p className="section-subtitle">Designed to be operated, audited and defended in court — within the bounds of the Constitution.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {capabilities.map((feature) => (
              <div key={feature.title} className="card p-6 group hover:-translate-y-1 text-center">
                <div className={`${feature.bgClass} w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-7 w-7 ${feature.iconClass}`} />
                </div>
                <h3 className="text-lg font-bold text-primary font-heading mb-2">{feature.title}</h3>
                <p className="text-muted text-base leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── STATISTICS SECTION ───────── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#0E2A4F] to-secondary"></div>
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-heading">System overview</h2>
            <p className="text-gray-400 text-lg mt-3">Illustrative snapshot from fictional test data for this prototype.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { value: '4,067', label: 'Registered offenders', icon: Database, color: 'text-blue-400' },
              { value: '1,284', label: 'Organizations verified (YTD)', icon: Building2, color: 'text-green-400' },
              { value: '3,106', label: 'Clearance checks issued', icon: FileCheck, color: 'text-amber-400' },
              { value: '100%', label: 'Access events logged', icon: Activity, color: 'text-pink-400' },
            ].map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:bg-white/15 transition-all duration-300 group-hover:-translate-y-1 h-full">
                  <stat.icon className={`h-8 w-8 ${stat.color} mx-auto mb-4`} />
                  <div className="text-3xl md:text-4xl font-bold text-white font-heading">{stat.value}</div>
                  <div className="text-gray-400 text-sm mt-2 font-medium tracking-wide">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA SECTION ───────── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card p-10 md:p-14 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-secondary to-primary"></div>
            <UserCheck className="h-12 w-12 text-secondary mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-bold text-primary font-heading mb-4">
              Ready to access the portal?
            </h2>
            <p className="text-muted max-w-xl mx-auto mb-8 leading-relaxed">
              Organizations can create an account for verified services. Police officers sign in with
              department-provisioned credentials.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login" className="btn-primary text-base px-8 py-4">
                <LogIn className="h-5 w-5" />
                Login
              </Link>
              <Link to="/login?role=organization&mode=register" className="btn-accent text-base px-8 py-4">
                Register Organization
                <Building2 className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── FOOTER ───────── */}
      <Footer />
    </div>
  );
}

export default LandingPage;
