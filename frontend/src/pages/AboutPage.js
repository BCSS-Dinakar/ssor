import { Link } from 'react-router-dom';
import Footer from '../components/common/Footer';
import PageHero from '../components/common/PageHero';
import {
  Shield,
  ShieldCheck,
  Lock,
  ArrowRight,
  Users,
  FileCheck,
  Heart,
  BookOpen,
  Target,
  Layers,
  Globe,
} from 'lucide-react';

import { principles, legalFramework, timeline } from '../utils/data/aboutData';

function AboutPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ───────── HERO ───────── */}
      <PageHero>
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-5 sm:mb-6">
            <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />
            Government of Telangana · State Police
          </div>
          <h1
            className="font-bold text-white font-heading leading-tight tracking-tight"
            style={{ fontSize: 'clamp(1.75rem, 2.5vw + 1rem, 3.25rem)' }}
          >
            About <span className="text-accent">SSOR</span>
          </h1>
          <p
            className="mt-4 sm:mt-5 text-gray-300 max-w-2xl mx-auto leading-relaxed"
            style={{ fontSize: 'clamp(0.9rem, 0.35vw + 0.8rem, 1.125rem)' }}
          >
            The State Sexual Offender Registry is a conviction-based, controlled-access database designed to protect
            women and children — enabling verified background checks and structured monitoring without becoming
            an open public list.
          </p>
        </div>
      </PageHero>

      {/* ───────── MISSION ───────── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl 2xl:max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 text-secondary px-3 py-1 rounded-full text-sm font-semibold tracking-wide mb-5">
                <Target className="h-3.5 w-3.5" />
                Our Mission
              </div>
              <h2 className="section-title text-left">Protecting communities through verified intelligence</h2>
              <p className="text-muted leading-relaxed mt-4">
                The SSOR exists to bridge a critical gap — enabling organizations to make safer recruitment decisions and
                empowering the police to monitor high-risk offenders through structured, legally-compliant processes.
              </p>
              <p className="text-muted leading-relaxed mt-4">
                Unlike open public registries that risk vigilantism, mob justice and drive offenders underground, the SSOR
                operates strictly through controlled police channels, ensuring public safety without compromising
                fundamental rights.
              </p>
              <div className="mt-8 grid sm:grid-cols-3 gap-4">
                {[
                  { icon: Heart, label: 'Protect', text: 'Women & children' },
                  { icon: Shield, label: 'Verify', text: 'Safe recruitment' },
                  { icon: Users, label: 'Monitor', text: 'High-risk offenders' },
                ].map((item) => (
                  <div key={item.label} className="card p-4 text-center group hover:-translate-y-1">
                    <item.icon className="h-6 w-6 text-accent mx-auto mb-2" />
                    <div className="text-base font-bold text-primary">{item.label}</div>
                    <div className="text-sm text-muted mt-0.5">{item.text}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-accent/10 rounded-3xl blur-2xl"></div>
              <div className="relative card p-10 text-center">
                <ShieldCheck className="h-16 w-16 text-accent mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-primary font-heading mb-3">Not a Public List</h3>
                <p className="text-muted leading-relaxed text-base">
                  This register is explicitly designed to <strong className="text-primary">never</strong> be a public search tool.
                  Information flows only through police-controlled channels — protecting privacy, preventing misuse,
                  and maintaining the integrity of the justice system.
                </p>
                <div className="mt-6 flex items-center justify-center gap-3 text-sm text-muted">
                  <Lock className="h-4 w-4 text-green-500" />
                  <span>Consistent with K.S. Puttaswamy (2017) & DPDP Act 2023</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── CORE PRINCIPLES ───────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl 2xl:max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">Core principles</h2>
            <p className="section-subtitle">Every aspect of the SSOR is designed to be operated, audited, and defended in court — within the bounds of the Constitution.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {principles.map((principle) => (
              <div key={principle.title} className="card p-6 group hover:-translate-y-1">
                <div className={`${principle.bgClass} w-14 h-14 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <principle.icon className={`h-7 w-7 ${principle.iconClass}`} />
                </div>
                <h3 className="text-lg font-bold text-primary font-heading mb-2">{principle.title}</h3>
                <p className="text-muted text-base leading-relaxed">{principle.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── LEGAL FRAMEWORK ───────── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl 2xl:max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">Legal framework</h2>
            <p className="section-subtitle">The SSOR is built on the Constitution and specific statutory provisions — not on executive discretion.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {legalFramework.map((law) => (
              <div key={law.name} className="card p-6 group hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-indigo-50 h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-base font-bold text-primary font-heading">{law.name}</h3>
                </div>
                <p className="text-muted text-base leading-relaxed">{law.desc}</p>
              </div>
            ))}
            <div className="rounded-xl p-6 bg-gradient-to-br from-primary to-secondary text-white flex flex-col justify-center">
              <Globe className="h-8 w-8 text-accent mb-3" />
              <h3 className="text-base font-bold text-white font-heading mb-2">NDSO Interoperability</h3>
              <p className="text-base leading-relaxed text-gray-200">
                The state registry is designed to be interoperable with the National Database on Sexual Offenders (NDSO) maintained by the NCRB.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── IMPLEMENTATION TIMELINE ───────── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">Implementation roadmap</h2>
            <p className="section-subtitle">A phased approach to ensure quality, legal compliance, and operational readiness.</p>
          </div>

          <div className="space-y-0 relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-accent via-secondary to-primary opacity-30"></div>
            
            {timeline.map((phase, i) => (
              <div key={phase.year} className="relative flex items-start gap-6 pb-10 last:pb-0">
                <div className="relative z-10 flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${
                    i === 0 ? 'bg-accent text-primary' : 'bg-white border-2 border-slate-200 text-slate-500'
                  }`}>
                    {i + 1}
                  </div>
                </div>
                <div className="card p-5 flex-1 group hover:-translate-y-0.5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-bold tracking-wide text-accent">{phase.year}</span>
                    <span className="text-sm font-bold text-primary">·</span>
                    <h3 className="text-base font-bold text-primary font-heading">{phase.title}</h3>
                  </div>
                  <p className="text-base text-muted leading-relaxed">{phase.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl 2xl:max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card p-10 md:p-14 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-secondary to-primary"></div>
            <Layers className="h-12 w-12 text-secondary mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-bold text-primary font-heading mb-4">
              Want to learn more?
            </h2>
            <p className="text-muted max-w-xl mx-auto mb-8 leading-relaxed">
              Explore organization services or get in touch with the SSOR team for organization partnerships,
              research collaboration, or media enquiries.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/services" className="btn-accent text-base px-8 py-4">
                <FileCheck className="h-5 w-5" />
                Organization Services
              </Link>
              <Link to="/contact" className="btn-secondary text-base px-8 py-4">
                Contact Us
                <ArrowRight className="h-5 w-5" />
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

export default AboutPage;
