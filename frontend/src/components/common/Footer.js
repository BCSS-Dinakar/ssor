import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Phone, Mail, MapPin, Lock } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-primary text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 grid md:grid-cols-4 gap-8">
          {/* Branding */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 overflow-hidden rounded-xl bg-white/10 p-0.5 shadow-md">
                <img src="/images/ssor-logo.png" alt="SSOR Logo" className="h-full w-full object-cover rounded-lg" />
              </div>
              <div>
                <span className="text-xl font-bold text-white font-heading">SSOR</span>
                <span className="block text-xs text-white/70">State Sexual Offender Register · Telangana</span>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed max-w-md">
              The State Sexual Offender Register is a conviction-based, controlled-access database with three
              access roles — organizations and police officers — interoperable with the
              National Database on Sexual Offenders.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { name: 'Home', path: '/' },
                { name: 'Organization Services', path: '/services' },
                { name: 'About SSOR', path: '/about' },
                { name: 'Contact Us', path: '/contact' },
              ].map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-white/70 hover:text-white text-sm transition-colors duration-300 inline-flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Helplines</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-white/70 text-sm">
                <Phone className="h-4 w-4 text-white/90 flex-shrink-0" />
                Police Emergency — 100 / 112
              </li>
              <li className="flex items-center gap-2 text-white/70 text-sm">
                <Mail className="h-4 w-4 text-white/90 flex-shrink-0" />
                support@ssor.telangana.gov.in
              </li>
              <li className="flex items-start gap-2 text-white/70 text-sm">
                <MapPin className="h-4 w-4 text-white/90 flex-shrink-0 mt-0.5" />
                State Police Headquarters, Telangana
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/50 text-xs text-center md:text-left">
              © {new Date().getFullYear()} SSOR — State Sexual Offender Register, Telangana. Prototype for demonstration.
            </p>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Lock className="h-3 w-3 text-white/50" />
              <span>Controlled-access · All events audited</span>
            </div>
          </div>
          <p className="text-white/40 text-[10px] text-center mt-4 max-w-3xl mx-auto leading-relaxed">
            DISCLAIMER: Unauthorized access to this system is prohibited and subject to prosecution. Information in
            this registry is provided strictly for public safety purposes and must not be used to harass or
            discriminate against any individual. All records shown in this prototype are fictional test data.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
