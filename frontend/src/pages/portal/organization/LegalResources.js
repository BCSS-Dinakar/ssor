import React, { useState } from 'react';
import { BookOpen, Shield, Phone, Heart, HelpCircle, FileCheck, ExternalLink, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import PageHeader from '../../../components/portal/PageHeader';

function ResourceCard({ icon: Icon, title, description, color = 'bg-blue-50 text-blue-600', borderColor = 'border-blue-100' }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full group">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
        <div className={`p-2 rounded-xl ${color} shadow-sm border ${borderColor} group-hover:scale-105 transition-transform`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-extrabold text-slate-800 text-base leading-tight">{title}</h3>
      </div>
      <div className="p-5 flex-1 bg-white">
        <p className="text-sm text-slate-600 font-medium leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function HelplineCard({ number, label, description, available }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-1 flex items-center group">
      <div className="w-14 h-14 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0 border border-red-100 ml-1 group-hover:bg-red-600 group-hover:text-white transition-colors">
        <Phone className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0 px-4 py-2">
        <div className="text-sm font-extrabold text-slate-800">{label}</div>
        <div className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">{description}</div>
      </div>
      <div className="pr-4 text-right shrink-0 border-l border-slate-100 pl-4 py-2">
        <div className="text-lg font-black text-slate-800 tracking-tight">{number}</div>
        <div className="text-[9px] uppercase font-bold tracking-widest text-emerald-600 mt-0.5">{available}</div>
      </div>
    </div>
  );
}

function FaqItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-primary/30 shadow-md bg-white' : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left transition-colors"
      >
        <span className="text-sm font-extrabold text-slate-800 pr-4">{question}</span>
        <div className={`p-1 rounded-full transition-colors ${isOpen ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100 pt-4 bg-slate-50/50">
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
    <div className="space-y-10 animate-fadeIn pb-12 w-full">
      <PageHeader
        crumb="Resources / Legal & Compliance"
        title="Legal Resources & Guidelines"
        subtitle="Safe hiring manuals, POCSO laws, and child-safety protocols for institutions."
      />

      {/* Intro Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-700 shadow-sm flex items-start gap-4">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0 border border-blue-100">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <p className="mb-1 text-slate-800"><strong>Mandatory Compliance:</strong> Ensure all support staff undergo police clearance checks prior to deployment.</p>
          <p className="text-slate-500 font-medium">Clearance verification is a statutory requirement for all child-facing and women-facing institutions to ensure the safety and security of vulnerable groups.</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-slate-400" /> Policy & Guidelines
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ResourceCard icon={Shield} title="Safe Recruitment" description="Ensure all support staff undergo clearance checks prior to deployment. Maintain secure employment records." color="bg-blue-50 text-blue-600" borderColor="border-blue-100" />
          <ResourceCard icon={BookOpen} title="POCSO Compliance" description="Under Section 19 of the POCSO Act, any individual with knowledge of child sexual abuse must report it immediately." color="bg-amber-50 text-amber-600" borderColor="border-amber-100" />
          <ResourceCard icon={FileCheck} title="Verification Limits" description="Clearance is a binary check against convicted registry databases. Offender identities are never shared with you." color="bg-emerald-50 text-emerald-600" borderColor="border-emerald-100" />
          <ResourceCard icon={Heart} title="Safeguarding Policy" description="Every institute must construct a formal Child Protection Policy detailing safety protocols and reporting mechanisms." color="bg-pink-50 text-pink-600" borderColor="border-pink-100" />
          <ResourceCard icon={HelpCircle} title="Limited Disclosure" description="Limited disclosure is handled by DSP rank officers on a case-by-case evaluation under strict protocol." color="bg-purple-50 text-purple-600" borderColor="border-purple-100" />
          <ResourceCard icon={ExternalLink} title="Legal Safeguards" description="The registry complies with Article 21, Puttaswamy ruling, and DPDP Act 2023. Only convicted cases are tracked." color="bg-slate-100 text-slate-600" borderColor="border-slate-200" />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Phone className="h-4 w-4 text-slate-400" /> Emergency Helplines
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <HelplineCard number="112" label="National Emergency" description="All-in-one distress response" available="24 Hours" />
          <HelplineCard number="100" label="Police Control" description="Immediate police desk" available="24 Hours" />
          <HelplineCard number="1098" label="Childline India" description="Protection of children" available="24 Hours" />
          <HelplineCard number="181" label="Women Helpline" description="Women safety concerns" available="24 Hours" />
        </div>
      </div>

      <div className="space-y-4 max-w-4xl">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-slate-400" /> Frequently Asked Questions
        </h3>
        <div className="space-y-4">
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
