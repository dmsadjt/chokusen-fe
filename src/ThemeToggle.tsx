import { useState } from 'react';
import { getEffectiveTheme, setTheme } from './theme';
import './ThemeToggle.css';

function ThemeToggle() {
  const [theme, setThemeState] = useState(() => getEffectiveTheme());

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    setTheme(next);
  };

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

export default ThemeToggle;
