import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, MessageSquare, Plus, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Field, inputClass, FeedbackBanner } from '../../../components/portal/FormControls';
import SearchableSelect from '../../../components/SearchableSelect';
import { useAuth } from '../../../context/AuthContext';
import { organizationApi } from '../../../api/organization.api';

function ComplianceAndSupport() {
  const { auth } = useAuth();
  const [activeClearances, setActiveClearances] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await organizationApi.getTickets();
      if (res.success) {
        setTickets(res.tickets);
      }
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    // Also fetch active clearances for the reference dropdown
    organizationApi.getVerifications().then(res => {
      if (res.success) {
        setActiveClearances(res.verifications);
      }
    }).catch(err => console.error(err));
  }, [fetchTickets]);

  const [activeTicketId, setActiveTicketId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', category: 'General Inquiry', priority: 'Medium', reference: 'General Inquiry', message: '' });
  const [formAlert, setFormAlert] = useState(null);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.autoCreateTicket) {
      const { reference, candidate } = location.state;
      
      const autoCreate = async () => {
        try {
          const res = await organizationApi.createTicket({
            subject: `Rejected Candidate Appeal (${candidate})`,
            category: 'Clearance Appeal',
            priority: 'High',
            reference: `${candidate} (${reference})`,
            message: `We are requesting further clarification regarding the rejected status for candidate ${candidate}.`
          });
          if (res.success) {
            setTickets(prev => [res.ticket, ...prev]);
            setActiveTicketId(res.ticket.id);
          }
        } catch (err) {
          console.error('Auto create ticket failed', err);
        }
      };
      autoCreate();

      // Clear the location state so it doesn't run again on reload
      window.history.replaceState({}, document.title);
    } else if (location.state?.prefillTicket) {
      const { reference, candidate, status } = location.state.prefillTicket;
      setShowNewTicketForm(true);
      setNewTicket({
        subject: `Assistance required for ${candidate} (${status.toUpperCase()})`,
        category: 'General Inquiry',
        priority: status === 'rejected' ? 'High' : 'Medium',
        reference: `${candidate} (${reference})`,
        message: `I need assistance regarding the background verification for candidate ${candidate}. The current status is ${status}.\n\nReference ID: ${reference}`
      });
      window.history.replaceState({}, document.title);
    }
  }, [location.state, auth]);

  const activeTicket = activeTicketId ? tickets.find((t) => t.id === activeTicketId) : null;

  const [sendingMessage, setSendingMessage] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeTicket || activeTicket.status === 'Closed') return;
    setSendingMessage(true);
    try {
      const res = await organizationApi.addTicketMessage(activeTicket.id, { text: newMessage });
      if (res.success) {
        setTickets(prev => prev.map(t => t.id === activeTicket.id ? { ...t, messages: [...t.messages, res.message] } : t));
        setNewMessage('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMessage(false);
    }
  };

  const [creatingTicket, setCreatingTicket] = useState(false);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      setFormAlert({ type: 'error', message: 'Subject and initial message are required.' });
      return;
    }
    setCreatingTicket(true);
    try {
      const res = await organizationApi.createTicket(newTicket);
      if (res.success) {
        setTickets(prev => [res.ticket, ...prev]);
        setActiveTicketId(res.ticket.id);
        setNewTicket({ subject: '', category: 'General Inquiry', priority: 'Medium', reference: 'General Inquiry', message: '' });
        setShowNewTicketForm(false);
        setFormAlert(null);
      }
    } catch (err) {
      setFormAlert({ type: 'error', message: 'Failed to create ticket.' });
    } finally {
      setCreatingTicket(false);
    }
  };

  return (
    <div className="animate-fadeIn -mx-4 sm:-mx-6 lg:-mx-8 -my-6 h-[calc(100vh-80px)] flex bg-white/50">
      
      {/* Left Panel: Inbox / Chat List */}
      <div className={`w-full lg:w-96 flex flex-col bg-slate-50 border-r border-slate-200 shrink-0 ${(activeTicketId || showNewTicketForm) ? 'hidden lg:flex' : 'flex'}`}>
        {/* Left Header */}
        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <h4 className="font-extrabold text-primary font-heading text-base tracking-wide">Support Inbox</h4>
          <button
            onClick={() => { setShowNewTicketForm(true); setActiveTicketId(null); setFormAlert(null); }}
            className="inline-flex items-center gap-1 text-sm font-black text-white bg-secondary hover:bg-secondary/90 px-3 py-2 rounded-xl transition-all shadow-md shadow-secondary/10"
          >
            <Plus className="h-3.5 w-3.5" /> Raise New
          </button>
        </div>

        {/* Ticket List */}
        <div className="flex-grow overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mb-3 text-secondary" />
              <p className="text-sm font-bold">Loading inbox...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center text-slate-400 py-10">
              <p className="text-sm font-bold">No active consultations.</p>
            </div>
          ) : tickets.map((t) => {
            const isActive = activeTicketId === t.id && !showNewTicketForm;
            return (
              <div
                key={t.id}
                onClick={() => { setActiveTicketId(t.id); setShowNewTicketForm(false); }}
                className={`p-4 border-b border-slate-100 cursor-pointer transition-all flex items-start gap-3 ${
                  isActive ? 'bg-white shadow-[inset_4px_0_0_0_#1E3A8A]' : 'hover:bg-slate-100/50'
                }`}
              >
                <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center shrink-0 text-slate-500">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-bold text-sm text-slate-800 truncate">{t.ticketNumber}</span>
                    <span className="font-mono text-xs text-slate-400 shrink-0">{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-600 truncate mb-1.5">{t.subject}</div>
                  <span className={`inline-flex px-1.5 py-0.5 rounded-full text-sm font-bold tracking-wide ${
                    t.status === 'Closed' ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {t.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel: Chat Board or Raise New Ticket */}
      <div className={`flex-1 flex-col bg-[#F8F9FA] relative ${(!activeTicketId && !showNewTicketForm) ? 'hidden lg:flex' : 'flex'}`}>
        
        {showNewTicketForm ? (
          // Raise New Ticket Form View
          <div className="flex-1 flex flex-col h-full bg-white">
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowNewTicketForm(false)} className="lg:hidden p-1.5 -ml-1.5 text-slate-500 hover:bg-slate-100 rounded-lg">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h4 className="font-extrabold text-primary font-heading text-base tracking-wide">Raise New Consultation</h4>
                  <p className="text-sm text-slate-500 font-bold mt-0.5">Submit an appeal or inquiry to the department</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <form onSubmit={handleCreateTicket} className="max-w-3xl mx-auto space-y-6">
                <FeedbackBanner type={formAlert?.type} message={formAlert?.message} />
                
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-5 shadow-sm">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="Inquiry Subject" required hint="E.g. Appeal on Candidate Vetting.">
                      <input className={inputClass} value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} placeholder="e.g. Appeal on Candidate Clearance" />
                    </Field>
                    <Field label="Priority Level" required hint="Select urgency.">
                      <SearchableSelect 
                        value={newTicket.priority} 
                        onChange={(val) => setNewTicket({ ...newTicket, priority: val })}
                        options={['Low', 'Medium', 'High', 'Critical']}
                        placeholder="Select Priority" 
                      />
                    </Field>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5 mt-2">
                    <Field label="Reference Application" required hint="Attach candidate reference.">
                      <SearchableSelect 
                        value={newTicket.reference} 
                        onChange={(val) => setNewTicket({ ...newTicket, reference: val })}
                        options={['General Inquiry / No Candidate', ...activeClearances.map(c => `${c.candidateName} (${c.id})`)]}
                        placeholder="Select Reference" 
                      />
                    </Field>
                    <Field label="Inquiry Category" hint="Select a categorization.">
                      <SearchableSelect 
                        value={newTicket.category} 
                        onChange={(val) => setNewTicket({ ...newTicket, category: val })}
                        options={['Clearance Appeal', 'Quota Limit', 'General Inquiry']}
                        placeholder="Select Category" 
                      />
                    </Field>
                  </div>
                  <Field label="Describe your Concern" required hint="Provide details, reference IDs, and contact points.">
                    <textarea className={inputClass + ' min-h-[160px] resize-none'} value={newTicket.message} onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })} placeholder="Enter details here..." />
                  </Field>
                </div>
                
                <div className="flex justify-end">
                  <button type="submit" className="btn-primary py-3 px-6 shadow-lg shadow-primary/20 text-base" disabled={creatingTicket}>
                    {creatingTicket ? 'Submitting...' : 'Submit Inquiry File'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : activeTicket ? (
          // Active Ticket Chat View
          <div className="flex-1 flex flex-col h-full bg-slate-50/50">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveTicketId(null)} className="lg:hidden p-1.5 -ml-1.5 text-slate-500 hover:bg-slate-100 rounded-lg">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center shrink-0 text-slate-500">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-primary font-heading text-base tracking-wide">{activeTicket.ticketNumber}</h4>
                    <span className={`inline-flex px-1.5 py-0.5 rounded-full text-sm font-bold tracking-wide ${
                      activeTicket.status === 'Closed' ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {activeTicket.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 font-bold truncate max-w-sm mt-0.5">{activeTicket.subject}</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-sm text-slate-400 font-bold">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span className={`px-2 py-0.5 rounded-md border tracking-wide font-black ${
                    activeTicket.priority === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                    activeTicket.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    activeTicket.priority === 'Low' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>{activeTicket.priority || 'Medium'}</span>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            {/* Background Pattern */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col space-y-4 relative" style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 0)', backgroundSize: '24px 24px' }}>
              
              {/* Context Info Box */}
              <div className="self-center bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-500 text-center max-w-sm shadow-sm mb-4 mt-2">
                Consultation securely initiated. <br/>
                <span className="text-primary">Reference:</span> {activeTicket.reference || 'General Inquiry'}
              </div>

              {activeTicket.messages.map((m) => {
                const isPolice = m.senderRole !== 'Organization';
                return (
                  <div key={m.id} className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isPolice ? 'self-start items-start' : 'self-end items-end'}`}>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 tracking-wide mb-1 font-mono px-1">
                      <span className={isPolice ? 'text-secondary font-black' : 'text-slate-600'}>{m.senderName}</span>
                      <span>·</span>
                      <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={`p-3 text-sm leading-relaxed font-semibold rounded-2xl shadow-sm ${
                      isPolice 
                        ? 'bg-white text-slate-700 rounded-tl-none border border-slate-200/60' 
                        : 'bg-primary text-white rounded-tr-none'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input */}
            <div className="p-3 sm:p-4 bg-slate-100 border-t border-slate-200 shrink-0">
              {activeTicket.status !== 'Closed' ? (
                <form onSubmit={handleSendMessage} className="flex gap-2 max-w-5xl mx-auto items-end">
                  <div className="flex-1 bg-white border border-slate-300 rounded-2xl shadow-sm focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary overflow-hidden transition-all flex items-end">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={`Message to ${activeTicket.assignee}...`}
                      className="w-full bg-transparent px-4 py-3 text-base outline-none resize-none min-h-[50px] max-h-[120px] self-end"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                  </div>
                  <button type="submit" disabled={sendingMessage || !newMessage.trim()} className="bg-secondary disabled:bg-slate-300 disabled:cursor-not-allowed text-white h-[50px] w-[50px] rounded-full hover:bg-secondary/90 transition-all flex items-center justify-center shadow-md shrink-0 self-end">
                    {sendingMessage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 -ml-1 mt-0.5" />}
                  </button>
                </form>
              ) : (
                <div className="text-center text-sm text-slate-500 font-black tracking-wide flex items-center justify-center gap-1.5 py-3 rounded-xl">
                  <AlertCircle className="h-4 w-4" /> This consultation has been closed and is read-only.
                </div>
              )}
            </div>
          </div>
        ) : (
          // Empty State
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 p-6 text-center">
            <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm mb-4">
              <MessageSquare className="h-7 w-7 text-slate-300" />
            </div>
            <h3 className="text-slate-600 font-extrabold text-base tracking-wide mb-2">Compliance & Support Console</h3>
            <p className="text-sm text-slate-400 font-semibold max-w-sm">Select a ticket from the left panel to review notes, files, and message history with duty officers, or raise a new consultation.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ComplianceAndSupport;
