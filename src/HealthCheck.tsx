import { useEffect, useState } from 'react'

type Status = 'checking' | 'ok' | 'error';

function HealthCheck() {
  const [status, setStatus] = useState<Status>('checking');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    fetch('http://localhost:8080/api/v1/health')
      .then((res) => res.text())
      .then((text) => {
        setStatus('ok');
        setDetail(text);
      })
      .catch((err) => {
        setStatus('error');
        setDetail(err.message);
      });
  }, [])

  const copy = {
    checking: 'Checking backend…',
    ok: 'Backend is up',
    error: 'Backend unreachable',
  }[status];

  return (
    <div className="health-card">
      <span className={`health-dot health-dot--${status}`} aria-hidden="true" />
      <div className="health-text">
        <span className="health-label">{copy}</span>
        {detail && <span className="health-detail">{detail}</span>}
      </div>
    </div>
  )
}

export default HealthCheck
