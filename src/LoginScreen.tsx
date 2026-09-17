import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "./lib/errors";
import "./LoginScreen.css";

type Status = 'idle' | 'submitting' | 'error' | 'success';

function LoginScreen() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');

    try {
      const res = await fetch("http://localhost:8080/api/v1/auth/login", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        })
      })

      if (res.ok) {
        setStatus('success');
        setMessage('Login successful, redirecting…');
        setTimeout(() => navigate('/'), 3000);
      } else {
        setStatus('error');
        setMessage(getErrorMessage(await res.json()));
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setStatus('error');
      setMessage(message);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-card__heading">Chokusen Login</h2>

        {status !== 'idle' && (
          <div className="login-card__status">{status}</div>
        )}

        <form className="login-card__form" method="POST" onSubmit={handleSubmit}>
          <div className="login-card__field">
            <label className="login-card__label" htmlFor="username">Username</label>
            <input
              className="login-card__input"
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="login-card__field">
            <label className="login-card__label" htmlFor="password">Password</label>
            <input
              className="login-card__input"
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="login-card__button" type="submit" disabled={status === 'submitting'}>
            Login
          </button>
        </form>

        {message && (
          <div className={`login-card__message login-card__message--${status === 'success' ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

export default LoginScreen;
