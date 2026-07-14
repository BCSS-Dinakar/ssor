import React, { useState, useEffect } from 'react';
import { policeApi } from '../../../api/police.api';
import { MessageSquare, Send, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await policeApi.getTickets();
        setTickets(data.tickets || []);
        if (data.tickets?.length > 0 && !selectedTicketId) {
          setSelectedTicketId(data.tickets[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch tickets', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [selectedTicketId]);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setReplying(true);
    try {
      const res = await policeApi.addTicketMessage(selectedTicket.id, replyText);
      if (res.success) {
        setReplyText('');
        setTickets(prev => prev.map(t => {
          if (t.id === selectedTicket.id) {
            return {
              ...t,
              messages: [...t.messages, res.message],
              updatedAt: new Date().toISOString()
            };
          }
          return t;
        }));
      }
    } catch (error) {
      console.error('Failed to send reply', error);
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket || newStatus === selectedTicket.status) return;
    
    setUpdatingStatus(true);
    try {
      const res = await policeApi.updateTicketStatus(selectedTicket.id, newStatus);
      if (res.success) {
        setTickets(prev => prev.map(t => {
          if (t.id === selectedTicket.id) {
            return { ...t, status: newStatus, assignee: res.ticket.assignee };
          }
          return t;
        }));
      }
    } catch (error) {
      console.error('Failed to update status', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="animate-fadeIn -mx-4 sm:-mx-6 lg:-mx-8 -my-6 h-[calc(100vh-80px)] flex bg-white/50">
      
      {/* Left Panel: Inbox / Chat List */}
      <div className={`w-full lg:w-96 flex flex-col bg-slate-50 border-r border-slate-200 shrink-0 ${selectedTicketId ? 'hidden lg:flex' : 'flex'}`}>
        {/* Left Header */}
        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <h4 className="font-extrabold text-primary font-heading text-base uppercase tracking-wider">Support Inbox</h4>
          <span className="text-sm text-slate-400 font-bold px-2 py-1 bg-slate-100 rounded-md">POLICE DESK</span>
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
              <p className="text-sm font-bold">All caught up! No active tickets.</p>
            </div>
          ) : tickets.map((t) => {
            const isActive = selectedTicketId === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTicketId(t.id)}
                className={`p-4 border-b border-slate-100 cursor-pointer transition-all flex items-start gap-3 ${
                  isActive ? 'bg-white shadow-[inset_4px_0_0_0_theme(colors.secondary)]' : 'hover:bg-slate-100/50'
                }`}
              >
                <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center shrink-0 text-slate-500">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-bold text-sm text-slate-800 truncate">{t.ticketNumber}</span>
                    <span className="font-mono text-xs text-slate-400 shrink-0">{new Date(t.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-600 truncate mb-1.5">{t.subject}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 truncate max-w-[120px]">{t.organization?.organizationProfile?.orgName}</span>
                    <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                      t.status === 'Closed' ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel: Chat Board */}
      <div className={`flex-1 flex-col bg-[#F8F9FA] relative ${!selectedTicketId ? 'hidden lg:flex' : 'flex'}`}>
        {!selectedTicket ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 p-6 text-center">
            <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm mb-4">
              <MessageSquare className="h-7 w-7 text-slate-300" />
            </div>
            <h3 className="text-slate-600 font-extrabold text-base uppercase tracking-wider mb-2">Police Support Console</h3>
            <p className="text-sm text-slate-400 font-semibold max-w-sm">Select a ticket from the left panel to review notes, files, and message history, and respond to organizations.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full bg-slate-50/50">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedTicketId(null)} className="lg:hidden p-1.5 -ml-1.5 text-slate-500 hover:bg-slate-100 rounded-lg">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center shrink-0 text-slate-500">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-primary font-heading text-base uppercase tracking-wider">{selectedTicket.ticketNumber}</h4>
                    <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                      selectedTicket.status === 'Closed' ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 font-bold truncate max-w-sm mt-0.5">{selectedTicket.subject}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  disabled={updatingStatus}
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                >
                  <option value="Open">Status: Open</option>
                  <option value="In Progress">Status: In Progress</option>
                  <option value="On Hold">Status: On Hold</option>
                  <option value="Closed">Status: Closed</option>
                </select>
                <div className="hidden sm:flex items-center gap-1.5 text-sm font-bold">
                  <span className={`px-2 py-0.5 rounded-md border uppercase tracking-wider font-black ${
                    selectedTicket.priority === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                    selectedTicket.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    selectedTicket.priority === 'Low' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>{selectedTicket.priority || 'Medium'}</span>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col space-y-4 relative" style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 0)', backgroundSize: '24px 24px' }}>
              
              {/* Context Info Box */}
              <div className="self-center bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-500 text-center max-w-sm shadow-sm mb-4 mt-2">
                Consultation securely initiated by {selectedTicket.organization?.organizationProfile?.orgName}. <br/>
                <span className="text-primary">Reference:</span> {selectedTicket.reference || 'General Inquiry'}
              </div>

              {selectedTicket.messages.map((m) => {
                const isPolice = m.senderRole === 'Police';
                return (
                  <div key={m.id} className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isPolice ? 'self-end items-end' : 'self-start items-start'}`}>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono px-1">
                      <span className={isPolice ? 'text-secondary font-black' : 'text-slate-600'}>{m.senderName} ({m.senderRole})</span>
                      <span>·</span>
                      <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={`p-3 text-sm leading-relaxed font-semibold rounded-2xl shadow-sm ${
                      isPolice 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white text-slate-700 rounded-tl-none border border-slate-200/60'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input */}
            <div className="p-3 sm:p-4 bg-slate-100 border-t border-slate-200 shrink-0">
              {selectedTicket.status !== 'Closed' ? (
                <form onSubmit={handleSendReply} className="flex gap-2 max-w-5xl mx-auto items-end">
                  <div className="flex-1 bg-white border border-slate-300 rounded-2xl shadow-sm focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary overflow-hidden transition-all flex items-end">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your official response..."
                      className="w-full bg-transparent px-4 py-3 text-base outline-none resize-none min-h-[50px] max-h-[120px] self-end"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply(e);
                        }
                      }}
                    />
                  </div>
                  <button type="submit" disabled={replying || !replyText.trim()} className="bg-secondary disabled:bg-slate-300 disabled:cursor-not-allowed text-white h-[50px] w-[50px] rounded-full hover:bg-secondary/90 transition-all flex items-center justify-center shadow-md shrink-0 self-end">
                    {replying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 -ml-1 mt-0.5" />}
                  </button>
                </form>
              ) : (
                <div className="text-center text-sm text-slate-500 font-black uppercase tracking-widest flex items-center justify-center gap-1.5 py-3 rounded-xl">
                  <AlertCircle className="h-4 w-4" /> This consultation has been closed and is read-only.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SupportTickets;
