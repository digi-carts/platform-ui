'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';

type TicketType = 'DEFECT' | 'ENHANCE' | 'QUERY';
type TicketStatus = 'OPEN' | 'PENDING' | 'INPROGRESS' | 'FIXED' | 'VERIFIED' | 'CLOSED';

interface Comment {
  id: string;
  authorRole: string;
  authorEmail: string;
  body: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  storeId: string;
  adminEmail: string;
  type: TicketType;
  description: string;
  status: TicketStatus;
  label?: string | null;
  createdAt: string;
  comments: Comment[];
}

const TYPE_LABELS: Record<TicketType, string> = { DEFECT: 'Defect', ENHANCE: 'Enhancement', QUERY: 'Query' };
const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  INPROGRESS: 'bg-purple-100 text-purple-800',
  FIXED: 'bg-green-100 text-green-800',
  VERIFIED: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-neutral-100 text-neutral-600',
};

const ALL_STATUSES: TicketStatus[] = ['OPEN', 'PENDING', 'INPROGRESS', 'FIXED', 'VERIFIED', 'CLOSED'];

const NEXT_STATUSES: Partial<Record<TicketStatus, TicketStatus[]>> = {
  OPEN:       ['PENDING', 'INPROGRESS', 'FIXED', 'CLOSED'],
  PENDING:    ['INPROGRESS', 'FIXED', 'CLOSED'],
  INPROGRESS: ['FIXED', 'CLOSED'],
  FIXED:      ['VERIFIED', 'CLOSED'],
  VERIFIED:   ['CLOSED'],
};

function StatusBadge({ status }: Readonly<{ status: TicketStatus }>) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[status]}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export default function SupportAdminPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [commentSaving, setCommentSaving] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.get('/platform/support').then(r => setTickets(r.data.tickets ?? [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const addComment = async (ticketId: string) => {
    const body = commentText[ticketId]?.trim();
    if (!body) return;
    setCommentSaving(ticketId);
    try {
      await api.post(`/platform/support/${ticketId}/comments`, { body });
      setCommentText(t => ({ ...t, [ticketId]: '' }));
      load();
    } finally { setCommentSaving(null); }
  };

  const updateStatus = async (ticketId: string, status: TicketStatus) => {
    setStatusSaving(ticketId);
    try {
      await api.patch(`/platform/support/${ticketId}/status`, { status });
      load();
    } finally { setStatusSaving(null); }
  };

  const filtered = filter === 'ALL' ? tickets : tickets.filter(t => t.status === filter);

  const counts = tickets.reduce((acc, t) => { acc[t.status] = (acc[t.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  if (loading) return <p className="text-neutral-400">Loading…</p>;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3">
        <MessageCircle size={22} className="text-neutral-400" />
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{tickets.length} total ticket{tickets.length !== 1 ? 's' : ''} from all stores</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        <button type="button"
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1 text-sm rounded-full border transition-colors ${filter === 'ALL' ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
          All ({tickets.length})
        </button>
        {ALL_STATUSES.map(s => counts[s] ? (
          <button key={s} type="button"
            onClick={() => setFilter(s)}
            className={`px-3 py-1 text-sm rounded-full border transition-colors ${filter === s ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
            {s.charAt(0) + s.slice(1).toLowerCase()} ({counts[s]})
          </button>
        ) : null)}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-neutral-400">No tickets match this filter.</p>
      )}

      {filtered.map(ticket => (
        <Card key={ticket.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">{TYPE_LABELS[ticket.type]}</Badge>
                  <StatusBadge status={ticket.status} />
                  {ticket.label === 'REGRESSION' && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">REGRESSION</span>
                  )}
                  <span className="text-xs text-neutral-500 truncate">{ticket.adminEmail}</span>
                  <span className="text-xs text-neutral-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-neutral-700 mt-1 whitespace-pre-wrap">{ticket.description}</p>
              </div>
              <button type="button" onClick={() => setExpanded(e => e === ticket.id ? null : ticket.id)}
                className="text-neutral-400 hover:text-neutral-700 shrink-0 mt-0.5">
                {expanded === ticket.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </CardHeader>

          {expanded === ticket.id && (
            <CardContent className="space-y-4 border-t pt-4">
              {/* Comments thread */}
              {ticket.comments.length > 0 && (
                <div className="space-y-3">
                  {ticket.comments.map(c => (
                    <div key={c.id} className={`rounded-lg px-3 py-2 text-sm ${c.authorRole === 'superadmin' ? 'bg-blue-50 border border-blue-100' : 'bg-neutral-50 border'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-xs">{c.authorRole === 'superadmin' ? 'Support Team' : c.authorEmail}</span>
                        <span className="text-xs text-neutral-400">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{c.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Status change + comment */}
              {ticket.status !== 'CLOSED' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-neutral-500">Change Status</p>
                    <div className="flex gap-2 flex-wrap">
                      {(NEXT_STATUSES[ticket.status] ?? []).map(s => (
                        <button key={s} type="button"
                          disabled={statusSaving === ticket.id}
                          onClick={() => updateStatus(ticket.id, s)}
                          className="px-3 py-1 text-xs rounded-full border border-neutral-300 hover:bg-black hover:text-white hover:border-black transition-colors disabled:opacity-50">
                          → {s.charAt(0) + s.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Textarea rows={2} placeholder="Add a reply or update…"
                      value={commentText[ticket.id] ?? ''}
                      onChange={e => setCommentText(t => ({ ...t, [ticket.id]: e.target.value }))} />
                    <Button type="button" size="sm" variant="outline"
                      disabled={commentSaving === ticket.id || !commentText[ticket.id]?.trim()}
                      onClick={() => addComment(ticket.id)}>
                      {commentSaving === ticket.id ? 'Posting…' : 'Post Reply'}
                    </Button>
                  </div>
                </div>
              )}

              {ticket.status === 'CLOSED' && (
                <div className="flex items-center gap-3">
                  <button type="button"
                    disabled={statusSaving === ticket.id}
                    onClick={() => updateStatus(ticket.id, 'OPEN')}
                    className="px-3 py-1.5 text-xs rounded-full border border-orange-300 text-orange-700 hover:bg-orange-50 transition-colors disabled:opacity-50">
                    Reopen as Regression
                  </button>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
