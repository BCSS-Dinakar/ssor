import React, { useState } from 'react';
import { BookOpen, Shield, Phone, Heart, HelpCircle, FileCheck, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import PageHeader from '../../../components/portal/PageHeader';

function ResourceCard({ icon: Icon, title, description, color = 'bg-blue-50 text-secondary' }) {
  return (
    <div className="card p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full">
      <div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color} shadow-sm`}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-primary font-heading mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function HelplineCard({ number, label, description, available }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-300">
      <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
        <Phone className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-slate-800 font-heading">{label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{description}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-base font-black text-primary font-mono">{number}</div>
        <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">{available}</div>
      </div>
    </div>
  );
}

function FaqItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors text-sm font-bold text-slate-800 font-heading"
      >
        <span>{question}</span>
        {isOpen ? <ChevronUp className="h-4 w-4 text-secondary shrink-0 ml-4" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-4" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50">
          {answer}
        </div>
      )}
    </div>
  );
}

function LegalResources() {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const faqs = [
    { question: 'Who can apply for a clearance certificate?', answer: 'Any registered institution (school, crèche, sports academy, transport operator, caregiver agency) can apply to verify whether a person being hired for a child- or women-facing role has a sexual offence record.' },
    { question: 'Is the register publicly searchable?', answer: 'No. Consistent with the right to privacy and the DPDP Act 2023, the register follows a controlled-disclosure model. Institutions receive only a Clear or Refer decision — offender identities are never disclosed.' },
    { question: "What happens if a candidate is 'Rejected'?", answer: "A 'Rejected' result means a potential match was found. The police will conduct further verification and may contact the institution. The institution should not hire the candidate for the role until the matter is resolved." },
    { question: 'How long does verification take?', answer: 'Standard clearance requests are typically processed within 2–5 working days. Urgent requests for immediate hires may be expedited upon request.' },
    { question: 'Can I report an offence anonymously?', answer: 'Yes. You can submit a report without sharing your identity. However, providing your contact details helps the police follow up and strengthens the investigation.' },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        crumb="Hiring Legal Guides"
        title="Hiring Legal Guides"
        subtitle="Safe hiring manuals, POCSO laws, and child-safety resources for institutions."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ResourceCard icon={Shield} title="Safe Recruitment Practices" description="Ensure all support staff undergo police clearance checks prior to deployment. Keep official documents secure." color="bg-blue-50 text-secondary" />
        <ResourceCard icon={BookOpen} title="POCSO Act compliance" description="Under Section 19 of the POCSO Act, any individual with knowledge of child sexual abuse must report it immediately to the local Police." color="bg-amber-50 text-amber-600" />
        <ResourceCard icon={FileCheck} title="Verification Mechanism" description="Clearance is a binary check against convicted registry databases. Offender identities are never shared." color="bg-emerald-50 text-emerald-600" />
        <ResourceCard icon={Heart} title="Child Safeguarding Policy" description="Every child-facing institute should construct a formal Child Protection Policy detailing safety protocols and reporting mechanisms." color="bg-pink-50 text-pink-600" />
        <ResourceCard icon={HelpCircle} title="Limited Disclosure Rules" description="Limited disclosure is handled by DSP rank officers on a case-by-case evaluation. It differs from institutional clearance certificates." color="bg-purple-50 text-purple-600" />
        <ResourceCard icon={ExternalLink} title="Constitutional Safeguards" description="The registry complies with Article 21, Puttaswamy ruling, and DPDP Act 2023. Tracking covers convicted cases only." color="bg-slate-100 text-slate-600" />
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-bold text-primary font-heading border-b border-slate-100 pb-2">National & State Helplines</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <HelplineCard number="112" label="National Emergency" description="All-in-one distress response" available="24 Hours" />
          <HelplineCard number="100" label="Telangana Police PCR" description="Immediate police response desk" available="24 Hours" />
          <HelplineCard number="1098" label="Childline India" description="Protection of children in distress" available="24 Hours" />
          <HelplineCard number="181" label="Women Helpline Desk" description="Support for women safety concerns" available="24 Hours" />
        </div>
      </div>

      <div className="space-y-4 max-w-3xl">
        <h3 className="text-base font-bold text-primary font-heading border-b border-slate-100 pb-2">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <FaqItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openFaqIndex === index}
              onToggle={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default LegalResources;
