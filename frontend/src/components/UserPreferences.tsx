import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import LanguageSelector from './LanguageSelector';

const voices = [
  { value: 'default', label: 'Default' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  // Add more as needed
];

const UserPreferences = ({ onSave }) => {
  const { language, setLanguage } = useLanguage();
  const [voice, setVoice] = useState('default');
  const [promptTemplate, setPromptTemplate] = useState('');

  const handleSave = () => {
    onSave && onSave({ language, voice, promptTemplate });
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6 space-y-6">
      <h2 className="text-xl font-bold mb-2">User Preferences</h2>
      <div>
        <label className="block text-sm font-medium mb-1">Language</label>
        <LanguageSelector value={language} onChange={setLanguage} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Voice</label>
        <select
          className="border rounded px-2 py-1 text-sm w-full"
          value={voice}
          onChange={e => setVoice(e.target.value)}
        >
          {voices.map(v => (
            <option key={v.value} value={v.value}>{v.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Prompt Template</label>
        <textarea
          className="border rounded px-2 py-1 text-sm w-full min-h-[80px]"
          value={promptTemplate}
          onChange={e => setPromptTemplate(e.target.value)}
          placeholder="Customize the system prompt for your chats..."
        />
      </div>
      <button
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded font-semibold hover:from-blue-700 hover:to-purple-700 transition"
        onClick={handleSave}
      >
        Save Preferences
      </button>
    </div>
  );
};

export default UserPreferences; 