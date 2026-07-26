import { useState } from "react";

function LoginScreen() {
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');

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

    console.log(res.status, await res.text());
  }
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')

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
    </>
  )
}

export default LoginScreen;
