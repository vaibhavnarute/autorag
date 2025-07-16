import React from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'ru', label: 'Русский' },
  { code: 'ja', label: '日本語' },
  { code: 'pt', label: 'Português' },
  // Add more as needed
];

const LanguageSelector = ({ value, onChange }) => (
  <select
    className="border rounded px-2 py-1 text-sm"
    value={value}
    onChange={e => onChange(e.target.value)}
    aria-label="Select language"
  >
    {LANGUAGES.map(lang => (
      <option key={lang.code} value={lang.code}>{lang.label}</option>
    ))}
  </select>
);

export default LanguageSelector; 