import React from 'react';
import { Button } from './ui/button';

const FollowupSuggestions = ({ suggestions, onSelect }) => {
  if (!suggestions || suggestions.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {suggestions.map((q, idx) => (
        <Button
          key={idx}
          variant="outline"
          size="sm"
          className="text-left text-xs hover:bg-blue-50 hover:border-blue-200"
          onClick={() => onSelect(q)}
        >
          {q}
        </Button>
      ))}
    </div>
  );
};

export default FollowupSuggestions; 