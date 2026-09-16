import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export function PublicCommentsPane({ ticketId, comments, onCommentsUpdate }) {
    const [newComment, setNewComment] = useState('');
    const [commentError, setCommentError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const formatDate = (dateStr) => new Date(dateStr).toLocaleString();
    async function handlePost(e) {
        e.preventDefault();
        if (!newComment.trim()) {
            setCommentError('Comment cannot be empty.');
            return;
        }
        setCommentError(null);
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/tickets/${ticketId}/comments`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment.trim() }),
            });
            if (res.ok) {
                const newEntry = await res.json();
                onCommentsUpdate([...comments, newEntry]);
                setNewComment('');
            }
            else {
                const err = await res.json();
                setCommentError(err.error);
            }
        }
        catch {
            setCommentError('Failed to post comment.');
        }
        finally {
            setIsSubmitting(false);
        }
    }
    return (_jsxs("section", { className: "public-comments-pane", "aria-label": "Public Comments", children: [_jsxs("h2", { className: "pane-title pane-title--public", children: ["\uD83D\uDCAC Public Comments", _jsx("span", { className: "pane-subtitle", children: "Visible to Requester, IT Staff, and Administrator" })] }), comments.length === 0 && _jsx("p", { className: "empty-pane", children: "No comments yet." }), _jsx("ul", { className: "comment-list", children: comments.map(c => (_jsxs("li", { className: "comment-item", children: [_jsx("span", { className: "comment-author", children: c.author.name }), _jsx("span", { className: "comment-role badge", children: c.author.role }), _jsx("span", { className: "comment-time", children: formatDate(c.createdAt) }), _jsx("p", { className: "comment-content", children: c.content })] }, c.id))) }), _jsxs("form", { onSubmit: handlePost, className: "comment-form", children: [_jsx("label", { htmlFor: `comment-${ticketId}`, children: "Add a comment" }), _jsx("textarea", { id: `comment-${ticketId}`, value: newComment, onChange: e => setNewComment(e.target.value), rows: 3, maxLength: 2000, disabled: isSubmitting, placeholder: "Write a public comment visible to the Requester\u2026" }), commentError && _jsx("span", { className: "field-error", role: "alert", children: commentError }), _jsx("button", { type: "submit", disabled: isSubmitting, children: isSubmitting ? 'Posting…' : 'Post Comment' })] })] }));
}
