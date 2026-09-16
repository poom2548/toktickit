import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import './StaffTicketDetail.css';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { TicketInfoSection } from '../../components/staff/TicketInfoSection';
import { OperationalSection } from '../../components/staff/OperationalSection';
import { PublicCommentsPane } from '../../components/shared/PublicCommentsPane';
import { InternalNotesPane } from '../../components/staff/InternalNotesPane';
import { AttachmentsSection } from '../../components/staff/AttachmentsSection';
export function StaffTicketDetailPage() {
    const { id: ticketId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [fetchState, setFetchState] = useState('loading');
    const [errorMessage, setErrorMessage] = useState(null);
    useEffect(() => {
        if (!ticketId)
            return;
        fetchTicket();
    }, [ticketId]);
    async function fetchTicket() {
        setFetchState('loading');
        try {
            const res = await fetch(`/api/staff/tickets/${ticketId}`, { credentials: 'include' });
            if (res.status === 401) {
                window.location.href = '/login';
                return;
            }
            if (res.status === 403) {
                setFetchState('error');
                setErrorMessage('forbidden');
                return;
            }
            if (res.status === 404) {
                setFetchState('not-found');
                return;
            }
            if (!res.ok) {
                setFetchState('error');
                setErrorMessage('Unable to load ticket.');
                return;
            }
            const data = await res.json();
            setTicket(data);
            setFetchState('success');
        }
        catch {
            setFetchState('error');
            setErrorMessage('Unable to load ticket. Please check your connection.');
        }
    }
    if (fetchState === 'loading')
        return _jsx("div", { className: "loading-skeleton", "aria-busy": "true" });
    if (fetchState === 'not-found')
        return _jsx("div", { className: "not-found-message", children: _jsx("h2", { children: "Ticket Not Found" }) });
    if (fetchState === 'error' && errorMessage === 'forbidden')
        return _jsx("div", { className: "forbidden-message", children: _jsx("h2", { children: "Access Denied" }) });
    if (fetchState === 'error')
        return _jsxs("div", { className: "error-message", role: "alert", children: [_jsx("p", { children: errorMessage }), _jsx("button", { onClick: fetchTicket, children: "Retry" })] });
    if (!ticket)
        return null;
    return (_jsxs("div", { className: "staff-ticket-detail", children: [_jsx("button", { onClick: () => navigate('/staff/tickets'), className: "back-btn", children: "\u2190 Back to Queue" }), _jsx(TicketInfoSection, { ticket: ticket }), _jsx(OperationalSection, { ticket: ticket, onTicketUpdate: (updated) => setTicket(updated) }), _jsx(PublicCommentsPane, { ticketId: ticket.id, comments: ticket.publicComments, onCommentsUpdate: (comments) => setTicket(prev => prev ? { ...prev, publicComments: comments } : prev) }), _jsx(InternalNotesPane, { ticketId: ticket.id, notes: ticket.internalNotes, onNotesUpdate: (notes) => setTicket(prev => prev ? { ...prev, internalNotes: notes } : prev) }), _jsx(AttachmentsSection, { attachments: ticket.attachments, ticketId: ticket.id })] }));
}
