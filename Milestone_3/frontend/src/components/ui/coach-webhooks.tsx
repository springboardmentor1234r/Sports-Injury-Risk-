import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface Webhook {
  id: number;
  url: string;
  events: string[];
  is_active: boolean;
}

interface CoachWebhooksProps {
  token: string;
}

export const CoachWebhooks = ({ token }: CoachWebhooksProps) => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newUrl, setNewUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['video.processing_complete', 'athlete.high_risk_detected']);
  const [isAdding, setIsAdding] = useState(false);

  const availableEvents = [
    { id: 'video.processing_complete', label: 'Video Analysis Complete' },
    { id: 'athlete.high_risk_detected', label: 'High Risk Athlete Detected' },
  ];

  const fetchWebhooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/webhooks/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load webhooks');
      const data = await res.json();
      setWebhooks(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, [token]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    setIsAdding(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/webhooks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: newUrl, events: selectedEvents })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to add webhook');
      }
      setNewUrl('');
      fetchWebhooks();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/webhooks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete webhook');
      setWebhooks(webhooks.filter(w => w.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTest = async (url: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/webhooks/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: url, events: [] })
      });
      if (!res.ok) throw new Error('Failed to send test ping');
      toast.success('Test webhook dispatched! Check your endpoint.');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-8 h-8 text-[#004ccd] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h3 className="text-xl font-bold text-[#191c1f] mb-1">Webhooks</h3>
        <p className="text-[#424656] text-sm mb-6">Receive real-time HTTP POST payloads to your Slack, Discord, or custom server.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 text-sm font-semibold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Existing Webhooks List */}
      <div className="space-y-4">
        {webhooks.length === 0 ? (
          <div className="p-8 border border-dashed border-[#c3c6d7] rounded-xl text-center text-[#737687]">
            No webhooks configured yet. Add one below!
          </div>
        ) : (
          webhooks.map((wh) => (
            <div key={wh.id} className="p-5 border border-[#c3c6d7] rounded-xl bg-white shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="overflow-hidden flex-1 w-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${wh.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  <h4 className="font-bold text-[#191c1f] truncate" title={wh.url}>{wh.url}</h4>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {wh.events.map(ev => (
                    <span key={ev} className="px-2 py-1 bg-[#f3f3fe] text-[#004ccd] border border-[#004ccd]/20 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleTest(wh.url)}
                  className="flex-1 sm:flex-none px-3 py-2 bg-[#f3f3fe] hover:bg-[#e2e6ff] text-[#004ccd] font-bold text-xs rounded-lg transition-colors border border-[#004ccd]/20 flex items-center justify-center gap-2"
                >
                  <Send className="w-3 h-3" /> Test
                </button>
                <button
                  onClick={() => handleDelete(wh.id)}
                  className="flex-1 sm:flex-none px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-lg transition-colors border border-red-200 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add New Webhook Form */}
      <div className="mt-8 pt-8 border-t border-[#c3c6d7]">
        <h4 className="text-lg font-bold text-[#191c1f] mb-4">Add Endpoint</h4>
        <form onSubmit={handleAdd} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#191c1f]">Payload URL</label>
            <input 
              type="url" 
              placeholder="https://hooks.slack.com/services/..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full bg-white border border-[#c3c6d7] rounded-xl px-4 py-3 text-[#191c1f] focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 outline-none transition-all"
              required
            />
          </div>
          
          <div className="space-y-3">
            <label className="text-sm font-bold text-[#191c1f]">Events to send</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableEvents.map(ev => (
                <label key={ev.id} className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                  selectedEvents.includes(ev.id) ? 'border-[#004ccd] bg-[#f3f3fe] ring-1 ring-[#004ccd]/20' : 'border-[#c3c6d7] bg-white hover:border-[#004ccd]/50'
                }`}>
                  <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                    selectedEvents.includes(ev.id) ? 'bg-[#004ccd] border-[#004ccd]' : 'border-[#c3c6d7] bg-white'
                  }`}>
                    {selectedEvents.includes(ev.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${selectedEvents.includes(ev.id) ? 'text-[#004ccd]' : 'text-[#424656]'}`}>
                      {ev.label}
                    </p>
                    <p className="text-xs text-[#737687] mt-1">{ev.id}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isAdding || selectedEvents.length === 0}
            className="px-6 py-3 bg-[#004ccd] hover:bg-[#003da9] disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Webhook
          </button>
        </form>
      </div>
    </div>
  );
};
