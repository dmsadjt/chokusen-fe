import { useState } from "react";
import { getErrorMessage } from "./lib/errors";

function LoginScreen() {
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');

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
        setStatus('idle');
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

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [message, setMessage] = useState('');

  return (
    <>
      <div>{status}</div>
      <form method="POST" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Email</label>
          <input type="text" id="username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input type="password" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button type="submit" value="Login">Login</button>
      </form>

      <div>{message}</div>
    </>
  )
}

export default LoginScreen;
