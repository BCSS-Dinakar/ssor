import { Link } from 'react-router-dom';
import Footer from '../components/common/Footer';
import PageHero from '../components/common/PageHero';
import {
  ShieldCheck,
  Lock,
  Building2,
  FileCheck,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  HelpCircle,
  Scale,
} from 'lucide-react';

import { services, steps, faqs } from '../utils/data/organizationServicesData';

function OrganizationServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <PageHero>
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Building2 className="h-4 w-4 text-accent" />
            Clearance, Disclosure & Registration
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-heading leading-tight">
            Organization <span className="text-accent">Services</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Secure, controlled-access services for organizations and parents to ensure safety while upholding data privacy standards.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login?role=organization" className="btn-accent px-8 py-4">
              Login as Organization
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
            
            <a href="#services" className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-xl font-semibold transition-all duration-300 backdrop-blur-md">
              View All Services
            </a>
          </div>
        </div>
      </PageHero>

      {/* ───────── AVAILABLE SERVICES ───────── */}
      <section id="services" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">Available Services</h2>
            <p className="section-subtitle">Choose the service that applies to your needs. All services are accessed through a secure, audited portal.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div key={service.title} className="card p-8 relative group hover:-translate-y-1 flex flex-col">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${service.accent} rounded-t-xl`}></div>
                <div className="absolute -top-3 right-6">
                  <span className={`${service.audienceColor} text-xs font-bold px-3 py-1 rounded-full shadow-md`}>{service.audience}</span>
                </div>
                <div className={`${service.iconBg} w-16 h-16 rounded-xl flex items-center justify-center mb-6`}>
                  <service.icon className={`h-8 w-8 ${service.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-primary font-heading mb-3">{service.title}</h3>
                <p className="text-muted leading-relaxed mb-6 text-sm">{service.description}</p>
                <ul className="space-y-3 mb-8">
                  {service.points.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to={service.cta.to} className="btn-primary w-full justify-center text-sm mt-auto">
                  {service.cta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── HOW IT WORKS ───────── */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">How it works</h2>
            <p className="section-subtitle">A simple, transparent four-step process from application to certificate.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-accent via-secondary to-primary opacity-20"></div>
            
            {steps.map((step, i) => (
              <div key={step.title} className="relative text-center group">
                <div className="relative inline-flex">
                  <div className="bg-white border-2 border-slate-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:border-accent transition-all duration-300 shadow-md">
                    <step.icon className="h-9 w-9 text-secondary group-hover:text-accent transition-colors duration-300" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-accent text-primary w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-primary font-heading mb-2">{step.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── IMPORTANT NOTES ───────── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Important Information
              </div>
              <h2 className="section-title text-left">Before you apply</h2>
              <p className="text-muted leading-relaxed mt-4">
                Please review the following before submitting any application. All services are subject to
                verification by the Telangana State Police and governed by strict legal safeguards.
              </p>
              <ul className="mt-6 space-y-4">
                {[
                  { icon: Clock, text: 'Standard processing time is 7 working days. Urgent child-facing role checks may be expedited to 3 days.' },
                  { icon: FileText, text: 'Keep your organization licence, authorised signatory ID, and candidate consent forms ready before applying.' },
                  { icon: Lock, text: 'All information submitted is encrypted and accessible only to authorised police officers.' },
                  { icon: Scale, text: 'Every disclosure meets the legal tests of legality, necessity, and proportionality under the DPDP Act, 2023.' },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-3 text-sm text-gray-700">
                    <div className="bg-amber-50 h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="leading-relaxed">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '7', unit: 'days', label: 'Standard processing', color: 'text-secondary' },
                { value: '3', unit: 'days', label: 'Urgent processing', color: 'text-accent' },
                { value: '100%', unit: '', label: 'Events audited', color: 'text-emerald-600' },
                { value: '24/7', unit: '', label: 'Portal access', color: 'text-blue-600' },
              ].map((stat) => (
                <div key={stat.label} className="card p-6 text-center group hover:-translate-y-1">
                  <div className={`text-3xl font-bold ${stat.color} font-heading`}>
                    {stat.value}<span className="text-lg text-muted font-normal">{stat.unit}</span>
                  </div>
                  <p className="text-xs text-muted mt-2 uppercase tracking-wider font-semibold">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">Frequently asked questions</h2>
            <p className="section-subtitle">Common questions about using the organization services portal.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="card p-6 group hover:-translate-y-0.5">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-50 h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <HelpCircle className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-primary font-heading">{faq.q}</h3>
                    <p className="text-sm text-muted leading-relaxed mt-2">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card p-10 md:p-14 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-secondary to-primary"></div>
            <ShieldCheck className="h-12 w-12 text-secondary mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-bold text-primary font-heading mb-4">
              Ready to get started?
            </h2>
            <p className="text-muted max-w-xl mx-auto mb-8 leading-relaxed">
              Register your organization to apply for clearance certificates.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login?role=organization&mode=register" className="btn-accent text-base px-8 py-4">
                <FileCheck className="h-5 w-5" />
                Register Organization
              </Link>
              <Link to="/login?role=public&mode=register" className="btn-secondary text-base px-8 py-4">
                Create Public Account
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

export default OrganizationServicesPage;
