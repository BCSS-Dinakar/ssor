import { useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/common/Footer';
import PageHero from '../components/common/PageHero';
import {
  ShieldCheck,
  Phone,
  MapPin,
  Send,
  Clock,
  Building2,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Headphones,
  Globe,
} from 'lucide-react';

import { contactChannels } from '../utils/data/contactData';

const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 outline-none transition-all duration-300 focus:bg-white focus:border-secondary focus:ring-4 focus:ring-secondary/10 placeholder-slate-400';

function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', category: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ───────── HERO ───────── */}
      <PageHero>
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-full text-base font-medium mb-8">
            <Headphones className="h-4 w-4 text-accent" />
            Get In Touch
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-heading leading-tight">
            Contact Us
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            For enquiries about organization registration, technical support, or media — reach us through the channels below.
          </p>
        </div>
      </PageHero>

      {/* ───────── CONTACT CHANNELS ───────── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {contactChannels.map((channel) => (
              <div key={channel.title} className="card p-8 relative group hover:-translate-y-1 flex flex-col">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${channel.accent} rounded-t-xl`}></div>
                <div className={`${channel.iconBg} w-14 h-14 rounded-xl flex items-center justify-center mb-6`}>
                  <channel.icon className={`h-7 w-7 ${channel.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-primary font-heading mb-5">{channel.title}</h3>
                <ul className="space-y-4 flex-1">
                  {channel.items.map((item) => (
                    <li key={item.label} className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm text-muted font-semibold uppercase tracking-wider">{item.label}</div>
                        <div className="text-base text-primary font-medium mt-0.5">{item.value}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CONTACT FORM ───────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 text-secondary px-3 py-1 rounded-full text-sm font-semibold uppercase tracking-wider mb-5">
                <MessageSquare className="h-3.5 w-3.5" />
                Send a Message
              </div>
              <h2 className="section-title text-left">Write to us</h2>
              <p className="text-muted leading-relaxed mt-4 mb-8">
                Use this form for non-emergency enquiries. For emergencies, please call 100 / 112 directly.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Clock, title: 'Response Time', text: 'We aim to respond to all enquiries within 2 working days.' },
                  { icon: Building2, title: 'Organization Queries', text: 'For bulk clearance or partnership enquiries, select "Organization Registration" as the category.' },
                  { icon: AlertTriangle, title: 'Emergencies', text: 'This form is NOT for reporting crimes. For emergencies, call 100 / 112 or Childline 1098.' },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="bg-white h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                      <item.icon className="h-4.5 w-4.5 text-secondary" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-primary">{item.title}</h4>
                      <p className="text-sm text-muted leading-relaxed mt-0.5">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-secondary to-primary"></div>
              
              {submitted ? (
                <div className="text-center py-12">
                  <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-10 w-10 text-success" />
                  </div>
                  <h3 className="text-2xl font-bold text-primary font-heading mb-3">Message Sent!</h3>
                  <p className="text-muted text-base leading-relaxed max-w-sm mx-auto mb-6">
                    Thank you for contacting us. We will respond within 2 working days. For urgent matters, please call the helplines listed above.
                  </p>
                  <p className="text-sm text-muted italic">(This is a prototype — no message was actually sent.)</p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: '', category: '', message: '' }); }}
                    className="btn-secondary mt-6 mx-auto"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-base font-semibold text-slate-700 tracking-wide">Full Name <span className="text-red-500">*</span></label>
                      <input
                        className={inputClass}
                        placeholder="Your full name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-base font-semibold text-slate-700 tracking-wide">Email <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        className={inputClass}
                        placeholder="name@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-base font-semibold text-slate-700 tracking-wide">Phone</label>
                      <input
                        className={inputClass}
                        placeholder="10-digit mobile"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        inputMode="numeric"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-base font-semibold text-slate-700 tracking-wide">Category <span className="text-red-500">*</span></label>
                      <select
                        className={inputClass}
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        required
                      >
                        <option value="">Select category</option>
                        <option>General Enquiry</option>
                        <option>Clearance Certificate</option>
                        <option>Limited Disclosure</option>
                        <option>Organization Registration</option>
                        <option>Technical Support</option>
                        <option>Media / Press</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-base font-semibold text-slate-700 tracking-wide">Subject <span className="text-red-500">*</span></label>
                    <input
                      className={inputClass}
                      placeholder="Brief subject of your enquiry"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-base font-semibold text-slate-700 tracking-wide">Message <span className="text-red-500">*</span></label>
                    <textarea
                      className={inputClass + ' min-h-[120px] resize-none'}
                      placeholder="Describe your enquiry in detail..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required
                    />
                  </div>

                  <button type="submit" className="btn-primary w-full justify-center py-4 rounded-xl shadow-lg shadow-primary/20 text-base">
                    <Send className="h-5 w-5" />
                    Send Message
                  </button>

                  <p className="text-center text-sm text-muted">
                    This is a prototype. No data is transmitted or stored.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── MAP / LOCATION ───────── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#0E2A4F] to-secondary"></div>
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white font-heading mb-6">Visit us</h2>
              <p className="text-gray-300 leading-relaxed mb-8">
                For in-person consultations, visit the SSOR office at the State Police Headquarters during office hours.
                Please carry a valid government-issued ID.
              </p>
              <div className="space-y-4">
                {[
                  { icon: MapPin, text: 'State Police Headquarters, Lakdikapul, Hyderabad, Telangana - 500004' },
                  { icon: Clock, text: 'Monday – Saturday, 10:00 AM – 5:00 PM (Closed on public holidays)' },
                  { icon: Phone, text: 'Dial 100 for emergencies. For office, call during working hours.' },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-3">
                    <div className="bg-white/10 backdrop-blur-sm h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-accent" />
                    </div>
                    <p className="text-gray-300 text-base leading-relaxed pt-2">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-accent/10 rounded-3xl blur-2xl"></div>
              <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center">
                <Globe className="h-16 w-16 text-accent mx-auto mb-4 opacity-80" />
                <h3 className="text-xl font-bold text-white font-heading mb-2">State Police Headquarters</h3>
                <p className="text-gray-300 text-base mb-4">Lakdikapul, Hyderabad, Telangana</p>
                <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 text-accent px-4 py-2 rounded-full text-base font-medium">
                  <MapPin className="h-4 w-4" />
                  17.3850° N, 78.4867° E
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── QUICK LINKS ───────── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">Quick links</h2>
            <p className="section-subtitle">Navigate directly to the service you need.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: ShieldCheck, title: 'Login', text: 'Access your account or the police portal.', to: '/login', color: 'text-accent', bg: 'bg-amber-50' },
              { icon: Building2, title: 'Organization Services', text: 'Apply for clearance.', to: '/services', color: 'text-secondary', bg: 'bg-blue-50' },

              { icon: HelpCircle, title: 'About SSOR', text: 'Learn about the system and legal basis.', to: '/about', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { icon: Phone, title: 'Emergency', text: 'Call 100/112 for immediate police help.', to: '/contact', color: 'text-red-600', bg: 'bg-red-50' },
            ].map((link) => (
              <Link key={link.title} to={link.to} className="card p-6 group hover:-translate-y-1 text-center">
                <div className={`${link.bg} w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <link.icon className={`h-7 w-7 ${link.color}`} />
                </div>
                <h3 className="text-base font-bold text-primary font-heading mb-1">{link.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{link.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── FOOTER ───────── */}
      <Footer />
    </div>
  );
}

export default ContactPage;
