import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export function InternalNotesPane({ ticketId, notes, onNotesUpdate }) {
    const [newNote, setNewNote] = useState('');
    const [noteError, setNoteError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const formatDate = (dateStr) => new Date(dateStr).toLocaleString();
    async function handlePost(e) {
        e.preventDefault();
        if (!newNote.trim()) {
            setNoteError('Note cannot be empty.');
            return;
        }
        setNoteError(null);
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/tickets/${ticketId}/notes`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newNote.trim() }),
            });
            if (res.ok) {
                const newEntry = await res.json();
                onNotesUpdate([...notes, newEntry]);
                setNewNote('');
            }
            else {
                const err = await res.json();
                setNoteError(err.error);
            }
        }
        catch {
            setNoteError('Failed to post note.');
        }
        finally {
            setIsSubmitting(false);
        }
    }
    return (_jsxs("section", { className: "internal-notes-pane", "aria-label": "Internal Notes", children: [_jsxs("h2", { className: "pane-title pane-title--internal", children: ["\uD83D\uDD12 Internal Notes", _jsx("span", { className: "pane-subtitle", children: "Visible to IT Staff and Administrator only" })] }), notes.length === 0 && _jsx("p", { className: "empty-pane", children: "No internal notes yet." }), _jsx("ul", { className: "note-list", children: notes.map(n => (_jsxs("li", { className: "note-item", children: [_jsx("span", { className: "note-author", children: n.author.name }), _jsx("span", { className: "note-time", children: formatDate(n.createdAt) }), _jsx("p", { className: "note-content", children: n.content })] }, n.id))) }), _jsxs("form", { onSubmit: handlePost, className: "note-form", children: [_jsx("label", { htmlFor: `note-${ticketId}`, children: "Add an internal note" }), _jsx("textarea", { id: `note-${ticketId}`, value: newNote, onChange: e => setNewNote(e.target.value), rows: 3, maxLength: 2000, disabled: isSubmitting, placeholder: "Write a private note for IT Staff only\u2026" }), noteError && _jsx("span", { className: "field-error", role: "alert", children: noteError }), _jsx("button", { type: "submit", disabled: isSubmitting || !newNote.trim(), children: isSubmitting ? 'Saving…' : 'Add Note' })] })] }));
}
