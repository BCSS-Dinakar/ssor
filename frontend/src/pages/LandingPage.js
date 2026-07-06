import { Link } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  Search,
  UserCheck,
  Lock,
  Eye,
  Scale,
  AlertTriangle,
  Fingerprint,
  Database,
  CheckCircle2,
  Activity,
  ArrowRight,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ───────── HERO SECTION ───────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#0E2A4F] to-secondary"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl"></div>
        </div>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-8">
              <ShieldCheck className="h-4 w-4 text-accent" />
              Government Authorized System
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-heading leading-tight">
              State Sexual Offender
              <br />
              <span className="text-accent">Register</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Secure Public Safety & Verification System — Protecting communities through
              transparent, reliable offender tracking and monitoring.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/search" className="btn-primary text-base px-8 py-4">
                <Search className="h-5 w-5" />
                Search Records
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full ml-1">Public Access</span>
              </Link>
              <Link to="/login" className="btn-accent text-base px-8 py-4">
                <Lock className="h-5 w-5" />
                Officer Login
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-green-400" />
                <span>256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-400" />
                <span>Government Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-green-400" />
                <span>Multi-Factor Auth</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L48 74.7C96 69 192 59 288 53.3C384 48 480 48 576 53.3C672 59 768 69 864 69.3C960 69 1056 59 1152 53.3C1248 48 1344 48 1392 48L1440 48V80H1392C1344 80 1248 80 1152 80C1056 80 960 80 864 80C768 80 672 80 576 80C480 80 384 80 288 80C192 80 96 80 48 80H0Z" fill="#F8FAFC"/>
          </svg>
        </div>
      </section>

      {/* ───────── ACCESS SECTION ───────── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">System Access</h2>
            <p className="section-subtitle">Choose the appropriate access level based on your authorization.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Public Access Card */}
            <div className="card p-8 relative group hover:-translate-y-1">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary to-blue-400 rounded-t-xl"></div>
              <div className="bg-blue-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <Eye className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-primary font-heading mb-3">Public Access</h3>
              <p className="text-muted leading-relaxed mb-6">
                View limited offender information available to the general public. Search records by name, location, or registry number.
              </p>
              <ul className="space-y-3 mb-8">
                {['View offender profiles', 'Search by location', 'Community notifications'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/search" className="btn-secondary w-full justify-center text-sm">
                <Search className="h-4 w-4" />
                Search Records
              </Link>
            </div>

            {/* Police Officer Card */}
            <div className="card p-8 relative group hover:-translate-y-1 ring-2 ring-accent/30">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-yellow-300 rounded-t-xl"></div>
              <div className="absolute -top-3 right-6">
                <span className="bg-accent text-primary text-xs font-bold px-3 py-1 rounded-full shadow-md">Authorized</span>
              </div>
              <div className="bg-amber-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <Shield className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-primary font-heading mb-3">Police Officer</h3>
              <p className="text-muted leading-relaxed mb-6">
                Full system access including data entry, case management, verification tools, and administrative controls.
              </p>
              <ul className="space-y-3 mb-8">
                {['Full data entry & editing', 'Case management system', 'Identity verification tools'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/login" className="btn-primary w-full justify-center text-sm">
                <Lock className="h-4 w-4" />
                Officer Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── FEATURES SECTION ───────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">Core Capabilities</h2>
            <p className="section-subtitle">Built with advanced technology to ensure public safety and law enforcement efficiency.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Database,
                title: 'Offender Tracking System',
                description: 'Comprehensive database for real-time tracking, monitoring, and management of registered offenders.',
                bgClass: 'bg-blue-50',
                iconClass: 'text-blue-600',
              },
              {
                icon: Scale,
                title: 'Court Case Integration',
                description: 'Seamless integration with court records for up-to-date case status, sentencing, and compliance data.',
                bgClass: 'bg-indigo-50',
                iconClass: 'text-indigo-600',
              },
              {
                icon: AlertTriangle,
                title: 'Risk Classification Engine',
                description: 'AI-assisted risk assessment categorizing offenders by threat level for prioritized monitoring.',
                bgClass: 'bg-amber-50',
                iconClass: 'text-amber-600',
              },
              {
                icon: Fingerprint,
                title: 'Identity Verification',
                description: 'Multi-layer identity verification using biometrics, documents, and cross-database validation.',
                bgClass: 'bg-emerald-50',
                iconClass: 'text-emerald-600',
              },
            ].map((feature) => (
              <div key={feature.title} className="card p-6 group hover:-translate-y-1 text-center">
                <div className={`${feature.bgClass} w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-7 w-7 ${feature.iconClass}`} />
                </div>
                <h3 className="text-lg font-bold text-primary font-heading mb-2">{feature.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{feature.description}</p>
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
            <h2 className="text-3xl md:text-4xl font-bold text-white font-heading">System Overview</h2>
            <p className="text-gray-400 text-lg mt-3">Real-time statistics from the SSOR database.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { value: '24,500+', label: 'Total Records', icon: Database, color: 'text-blue-400' },
              { value: '18,200+', label: 'Verified Cases', icon: CheckCircle2, color: 'text-green-400' },
              { value: '6,340', label: 'Active Monitoring', icon: Activity, color: 'text-amber-400' },
            ].map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:bg-white/15 transition-all duration-300 group-hover:-translate-y-1">
                  <stat.icon className={`h-8 w-8 ${stat.color} mx-auto mb-4`} />
                  <div className="text-3xl md:text-4xl font-bold text-white font-heading">{stat.value}</div>
                  <div className="text-gray-400 text-sm mt-2 font-medium uppercase tracking-wider">{stat.label}</div>
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
              Are You a Law Enforcement Officer?
            </h2>
            <p className="text-muted max-w-xl mx-auto mb-8 leading-relaxed">
              Access the full suite of SSOR tools including offender management, case tracking,
              risk assessments, and verification systems.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login" className="btn-primary text-base px-8 py-4">
                <Lock className="h-5 w-5" />
                Access Officer Portal
              </Link>
              <Link to="/about" className="btn-secondary text-base px-8 py-4">
                Learn More
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── FOOTER ───────── */}
      <footer className="bg-primary text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-12 grid md:grid-cols-4 gap-8">
            {/* Branding */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-accent p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <span className="text-xl font-bold text-white font-heading">SSOR</span>
                  <span className="block text-xs text-gray-400">State Sexual Offender Register</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                The State Sexual Offender Register (SSOR) is a government-maintained database
                designed to enhance public safety by tracking and monitoring registered sex offenders
                within the state jurisdiction.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2">
                {[
                  { name: 'Search Records', path: '/search' },
                  { name: 'Officer Login', path: '/login' },
                  { name: 'About SSOR', path: '/about' },
                  { name: 'Contact Us', path: '/contact' },
                ].map((link) => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-gray-400 hover:text-white text-sm transition-colors duration-300 inline-flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-gray-400 text-sm">
                  <Phone className="h-4 w-4 text-accent flex-shrink-0" />
                  1800-XXX-XXXX (Toll Free)
                </li>
                <li className="flex items-center gap-2 text-gray-400 text-sm">
                  <Mail className="h-4 w-4 text-accent flex-shrink-0" />
                  support@ssor.gov.in
                </li>
                <li className="flex items-start gap-2 text-gray-400 text-sm">
                  <MapPin className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                  State Police Headquarters, India
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-gray-500 text-xs text-center md:text-left">
                © {new Date().getFullYear()} SSOR — State Sexual Offender Register. All rights reserved.
                This is a government system for authorized use only.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Lock className="h-3 w-3 text-green-500" />
                <span>Secured by Government Encryption Standards</span>
              </div>
            </div>
            <p className="text-gray-600 text-[10px] text-center mt-4 max-w-3xl mx-auto leading-relaxed">
              DISCLAIMER: Unauthorized access to this system is prohibited and subject to criminal prosecution.
              Information contained in this registry is provided for public safety purposes only and must not be
              used to harass or discriminate against any individual.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
