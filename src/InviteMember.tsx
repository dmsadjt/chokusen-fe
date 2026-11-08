import { useState, type FormEvent } from 'react';
import { API_BASE } from './lib/api';
import './InviteMember.css';

type InviteMemberProps = {
  workspaceId: string;
};

function InviteMember({ workspaceId }: InviteMemberProps) {
  const [username, setUsername] = useState('');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleInvite = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;

    setInviting(true);
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/members`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed }),
      });

      if (res.status === 404) {
        setIsError(true);
        setMessage('No user with that username');
      } else if (!res.ok) {
        setIsError(true);
        setMessage("Couldn't invite that user");
      } else {
        setIsError(false);
        setMessage(`Added ${trimmed} to the workspace`);
        setUsername('');
      }
    } catch {
      setIsError(true);
      setMessage("Couldn't invite that user");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="invite-member">
      <h3 className="invite-member__heading">Invite</h3>
      <form className="invite-member__form" onSubmit={handleInvite}>
        <input
          className="invite-member__input"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={inviting}
          aria-label="Username to invite"
        />
        <button
          className="invite-member__button"
          type="submit"
          disabled={inviting || !username.trim()}
        >
          Invite
        </button>
      </form>
      {message && (
        <p className={`invite-member__hint${isError ? ' invite-member__hint--error' : ''}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export default InviteMember;
