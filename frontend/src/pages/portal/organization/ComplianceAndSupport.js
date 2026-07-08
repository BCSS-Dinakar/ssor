import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, Download, Send, MessageSquare, Plus, AlertCircle, X, FolderOpen, ArrowLeft } from 'lucide-react';
import PageHeader from '../../../components/portal/PageHeader';
import { Field, inputClass, FeedbackBanner } from '../../../components/portal/FormControls';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';

function ComplianceAndSupport() {
  const { auth } = useAuth();
  const { clearances } = useData();
  const mine = clearances.filter((c) => c.org && c.org.includes(auth.name));
  const activeClearances = mine.length ? mine : clearances;

  const [tickets, setTickets] = useState([
    {
      id: 'TCK-2026-8831',
      subject: 'Rejected Candidate Appeal (Lakshmi Bai)',
      category: 'Clearance Appeal',
      priority: 'High',
      reference: 'Lakshmi Bai (CLR-2026-00468)',
      status: 'In Progress',
      raisedDate: '2026-07-02 10:14 AM',
      raisedBy: 'Dr. K. Madhav Rao',
      assignee: 'Inspector R. Naidu (SSOR Cell)',
      messages: [
        { id: 1, sender: 'Inspector R. Naidu (SSOR Cell)', text: 'Regarding CLR-2026-00468: Candidate identity credentials received. Biometric checks in progress.', time: '10:14 AM' },
        { id: 2, sender: 'You (HR Administrator)', text: 'Thank you, Inspector. The candidate is a caregiver for our primary school division.', time: '11:32 AM' },
      ],
    },
    {
      id: 'TCK-2026-7721',
      subject: 'Roster Verification Quota Increase Request',
      category: 'Quota Limit',
      priority: 'Medium',
      reference: 'General Inquiry',
      status: 'Closed',
      raisedDate: '2026-06-15 09:00 AM',
      raisedBy: 'Dr. K. Madhav Rao',
      assignee: 'SSOR Admin Cell',
      closedDate: '2026-06-16 04:30 PM',
      messages: [
        { id: 1, sender: 'You (HR Administrator)', text: 'Requesting to increase check limit from 50 to 100 for the upcoming recruitment session.', time: '09:00 AM' },
        { id: 2, sender: 'SSOR Admin Cell', text: 'Approval granted. Limit updated to 100 checks. Ticket closed.', time: '04:30 PM' },
      ],
    },
  ]);

  const [activeTicketId, setActiveTicketId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', category: 'General Inquiry', priority: 'Medium', reference: 'General Inquiry', message: '' });
  const [formAlert, setFormAlert] = useState(null);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.autoCreateTicket) {
      const { reference, candidate } = location.state;
      
      setTickets((prev) => {
        // Prevent duplicates in case of strict mode or multiple renders
        if (prev.some(t => t.reference.includes(reference))) {
          const existing = prev.find(t => t.reference.includes(reference));
          setActiveTicketId(existing.id);
          return prev;
        }
        
        const nextId = `TCK-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`;
        const createdTicket = {
          id: nextId,
          subject: `Rejected Candidate Appeal (${candidate})`,
          category: 'Clearance Appeal',
          priority: 'High',
          reference: `${candidate} (${reference})`,
          status: 'Open',
          raisedDate: new Date().toLocaleString('en-GB'),
          raisedBy: auth?.name || 'HR Administrator',
          assignee: 'SSOR Duty Officer',
          messages: [{ id: 1, sender: 'You (HR Administrator)', text: `We are requesting further clarification regarding the rejected status for candidate ${candidate}.`, time: 'Just now' }],
        };
        setActiveTicketId(nextId);
        return [createdTicket, ...prev];
      });

      // Clear the location state so it doesn't run again on reload
      window.history.replaceState({}, document.title);
    }
  }, [location.state, auth]);

  const activeTicket = activeTicketId ? tickets.find((t) => t.id === activeTicketId) : null;

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeTicket || activeTicket.status === 'Closed') return;
    const updatedMsg = {
      id: Date.now(),
      sender: 'You (HR Administrator)',
      text: newMessage,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    };
    setTickets((prev) => prev.map((t) => (t.id === activeTicket.id ? { ...t, messages: [...t.messages, updatedMsg] } : t)));
    setNewMessage('');
  };

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      setFormAlert({ type: 'error', message: 'Subject and initial message are required.' });
      return;
    }
    const nextId = `TCK-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const createdTicket = {
      id: nextId,
      subject: newTicket.subject,
      category: newTicket.category,
      priority: newTicket.priority,
      reference: newTicket.reference,
      status: 'Open',
      raisedDate: new Date().toLocaleString(),
      raisedBy: 'Dr. K. Madhav Rao',
      assignee: 'SSOR Duty Officer',
      messages: [{ id: 1, sender: 'You (HR Administrator)', text: newTicket.message, time: 'Just now' }],
    };
    setTickets((prev) => [createdTicket, ...prev]);
    setActiveTicketId(nextId);
    setNewTicket({ subject: '', category: 'General Inquiry', priority: 'Medium', reference: 'General Inquiry', message: '' });
    setShowNewTicketForm(false);
    setFormAlert(null);
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn pb-10">
      <PageHeader
        crumb="Safety Certificate & Help"
        title="Safety Certificate & Help"
        subtitle="Manage safeguarding certifications and consult directly with the Police SSOR Cell."
      />



      <div className="grid lg:grid-cols-3 gap-6 items-stretch">
        {/* Left column: Ticket Inbox */}
        <div className="card p-5 flex flex-col h-[550px] bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
            <div>
              <h4 className="font-extrabold text-primary font-heading text-sm uppercase tracking-wider">Inquiry Tickets</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 font-bold">Select a case file to inspect</p>
            </div>
            <button
              onClick={() => { setShowNewTicketForm(true); setActiveTicketId(null); setFormAlert(null); }}
              className="inline-flex items-center gap-1 text-[10px] font-black text-white bg-secondary hover:bg-secondary/90 px-3 py-2 rounded-xl transition-all shadow-md shadow-secondary/10"
            >
              <Plus className="h-3.5 w-3.5" /> Raise New
            </button>
          </div>

          <div className="flex-grow overflow-y-auto space-y-2.5 pr-1 mt-4">
            {tickets.map((t) => {
              const isActive = activeTicketId === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => { setActiveTicketId(t.id); setShowNewTicketForm(false); }}
                  className={`p-3.5 border rounded-2xl cursor-pointer transition-all ${
                    isActive ? 'bg-blue-50/50 border-secondary shadow-md' : 'bg-slate-50/30 border-slate-150 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-secondary">{t.id}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                      t.status === 'Closed' ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 leading-snug mt-2 truncate">{t.subject}</div>
                  <div className="text-[9px] text-slate-400 mt-1 flex items-center justify-between font-bold">
                    <span>{t.category}</span>
                    <span className="font-mono">{t.raisedDate.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Chat Board */}
        <div className="lg:col-span-2">
          {showNewTicketForm ? (
            <div className="card p-6 h-[550px] flex flex-col bg-white">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between shrink-0">
                <div>
                  <h4 className="font-extrabold text-primary font-heading text-sm uppercase tracking-wider">Raise New Consultation</h4>
                  <p className="text-[10px] text-slate-455 font-bold mt-0.5">Submit an appeal or inquiry to the department</p>
                </div>
                <button onClick={() => setShowNewTicketForm(false)} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
              </div>
              <form onSubmit={handleCreateTicket} className="space-y-4 mt-4 flex-grow flex flex-col justify-between">
                <div className="space-y-4 flex-grow">
                  <FeedbackBanner type={formAlert?.type} message={formAlert?.message} />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Inquiry Subject" required hint="E.g. Appeal on Candidate Vetting.">
                      <input className={inputClass} value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} placeholder="e.g. Appeal on Candidate Clearance" />
                    </Field>
                    <Field label="Priority Level" required hint="Select urgency.">
                      <select className={inputClass} value={newTicket.priority} onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}>
                        <option value="Low">Low Priority</option>
                        <option value="Medium">Medium/Normal</option>
                        <option value="High">High Priority</option>
                        <option value="Critical">Critical Urgent</option>
                      </select>
                    </Field>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 mt-2">
                    <Field label="Reference Application" required hint="Attach candidate reference.">
                      <select className={inputClass} value={newTicket.reference} onChange={(e) => setNewTicket({ ...newTicket, reference: e.target.value })}>
                        <option value="General Inquiry">General Inquiry / No Candidate</option>
                        {activeClearances.map((c) => (
                          <option key={c.id} value={`${c.candidate} (${c.id})`}>
                            {c.candidate} ({c.id})
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Inquiry Category" hint="Select a categorization.">
                      <select className={inputClass} value={newTicket.category} onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}>
                        <option>Clearance Appeal</option>
                        <option>Quota Limit</option>
                        <option>General Inquiry</option>
                      </select>
                    </Field>
                  </div>
                  <Field label="Describe your Concern" required hint="Provide details, reference IDs, and contact points.">
                    <textarea className={inputClass + ' min-h-[140px] resize-none'} value={newTicket.message} onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })} placeholder="Enter details here..." />
                  </Field>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-end shrink-0">
                  <button type="submit" className="btn-primary text-xs py-2.5 px-5">Submit Inquiry File</button>
                </div>
              </form>
            </div>
          ) : activeTicket ? (
            <div className="card p-6 flex flex-col h-[550px] bg-white relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />
              
              <div className="border-b border-slate-100 pb-3 space-y-2 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-secondary" />
                    <h4 className="font-extrabold text-primary font-heading text-sm uppercase tracking-wider">{activeTicket.id}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                      activeTicket.status === 'Closed' ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-amber-50 text-amber-800 border border-amber-250'
                    }`}>
                      {activeTicket.status}
                    </span>
                    <button onClick={() => setActiveTicketId(null)} className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-50 rounded-xl" aria-label="Close">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-slate-600 space-y-2.5 font-semibold leading-relaxed">
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                    <div><strong className="text-slate-400 font-bold uppercase text-[9px] block">Subject:</strong> {activeTicket.subject}</div>
                    <div><strong className="text-slate-400 font-bold uppercase text-[9px] block">Reference:</strong> <span className="font-bold text-slate-700 bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded-md text-[10px]">{activeTicket.reference || 'General Inquiry'}</span></div>
                    <div><strong className="text-slate-400 font-bold uppercase text-[9px] block">Priority:</strong> <span className={`font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      activeTicket.priority === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                      activeTicket.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      activeTicket.priority === 'Low' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>{activeTicket.priority || 'Medium'}</span></div>
                  </div>
                  <div className="flex justify-between items-center text-[11px] border-t border-slate-100 pt-1.5">
                    <span><strong className="text-slate-400 font-bold uppercase text-[9px]">Assignee:</strong> {activeTicket.assignee}</span>
                    <span className="font-mono text-[9px] text-slate-400 font-bold">{activeTicket.raisedDate}</span>
                  </div>
                </div>
              </div>

              {/* Chat timeline bubbles */}
              <div className="flex-grow my-4 overflow-y-auto space-y-4 pr-1 flex flex-col bg-slate-50/50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                {activeTicket.messages.map((m) => {
                  const isPolice = !m.sender.includes('You') && !m.sender.includes('HR');
                  return (
                    <div key={m.id} className={`flex flex-col max-w-[80%] ${isPolice ? 'self-start items-start' : 'self-end items-end'}`}>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                        <span className={isPolice ? 'text-secondary font-black' : 'text-slate-500'}>{m.sender}</span>
                        <span>·</span>
                        <span>{m.time}</span>
                      </div>
                      <div className={`p-3 text-xs leading-relaxed font-semibold rounded-2xl shadow-sm ${
                        isPolice 
                          ? 'bg-white text-slate-700 rounded-tl-none border border-slate-200/50' 
                          : 'bg-gradient-to-r from-primary to-secondary text-white rounded-tr-none'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {activeTicket.status !== 'Closed' ? (
                <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-slate-100 pt-3 shrink-0">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message to ${activeTicket.assignee}...`}
                    className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white focus:border-secondary transition-all"
                  />
                  <button type="submit" className="p-2.5 rounded-xl bg-primary hover:bg-secondary text-white transition-colors shrink-0 flex items-center justify-center">
                    <Send className="h-4.5 w-4.5" />
                  </button>
                </form>
              ) : (
                <div className="border-t border-slate-100 pt-3 text-center text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center justify-center gap-1 shrink-0 bg-slate-50/50 py-2 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" /> Ticket Closed — Read Only
                </div>
              )}
            </div>
          ) : (
            <div className="card p-12 text-center flex flex-col justify-center items-center h-[550px] bg-white">
              <div className="w-14 h-14 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-center shadow-inner mb-4">
                <FolderOpen className="h-7 w-7 text-slate-455" />
              </div>
              <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider">Open Consultation Console</h5>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-2 leading-relaxed font-semibold">Select a ticket from the left panel to review notes, files, and message history with duty officers.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ComplianceAndSupport;
