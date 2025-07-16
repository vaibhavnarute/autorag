import React, { useState } from 'react';

const PromptEditor = ({ value, onChange, onSave }) => {
  const [template, setTemplate] = useState(value || '');

  const handleSave = () => {
    onSave && onSave(template);
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl shadow-md p-6 space-y-4">
      <h2 className="text-lg font-bold mb-2">Edit Prompt Template</h2>
      <textarea
        className="border rounded px-2 py-1 text-sm w-full min-h-[120px]"
        value={template}
        onChange={e => { setTemplate(e.target.value); onChange && onChange(e.target.value); }}
        placeholder="Edit the system/user prompt template here..."
      />
      <button
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded font-semibold hover:from-blue-700 hover:to-purple-700 transition"
        onClick={handleSave}
      >
        Save Template
      </button>
    </div>
  );
};

export default PromptEditor; 