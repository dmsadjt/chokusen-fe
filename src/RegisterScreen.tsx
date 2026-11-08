import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './auth/useAuth';
import { API_BASE } from './lib/api';
import { getApiErrorMessage } from './lib/errors';
import './LoginScreen.css';

type Status = 'idle' | 'submitting' | 'error' | 'success';

function RegisterScreen() {
  const { refresh } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');

    const trimmedUsername = username.trim();

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUsername,
          email: email.trim(),
          password,
        }),
      });

      if (!res.ok) {
        setStatus('error');
        setMessage(getApiErrorMessage(await res.json().catch(() => null)));
        return;
      }

      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername, password }),
      });

      if (loginRes.ok) {
        // refresh() flips auth state, so PublicOnly redirects to '/'
        await refresh();
        setStatus('idle');
      } else {
        setStatus('success');
        setMessage('Account created. You can log in now.');
      }
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-card__heading">Create account</h2>

        <form className="login-card__form" onSubmit={handleSubmit}>
          <div className="login-card__field">
            <label className="login-card__label" htmlFor="username">Username</label>
            <input
              className="login-card__input"
              type="text"
              id="username"
              name="username"
              autoComplete="username"
              required
              maxLength={50}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="login-card__field">
            <label className="login-card__label" htmlFor="email">Email</label>
            <input
              className="login-card__input"
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="login-card__field">
            <label className="login-card__label" htmlFor="password">Password</label>
            <input
              className="login-card__input"
              type="password"
              id="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="login-card__button" type="submit" disabled={status === 'submitting'}>
            Register
          </button>
        </form>

        {message && (
          <div className={`login-card__message login-card__message--${status === 'success' ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <p className="login-card__footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterScreen;
