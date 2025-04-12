import React from 'react';

interface TranscriptEntryProps {
  speaker: string;
  timestamp: string;
  text: string;
  fallacy?: string;
}

const TranscriptEntry: React.FC<TranscriptEntryProps> = ({
  speaker,
  timestamp,
  text,
  fallacy
}) => {
  return (
    <div className="p-4 bg-[#1F2937] rounded-lg border border-[#2C3E50] transition-all duration-200 hover:border-[#3B4B63] hover:shadow-md">
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold text-[#E5E7EB]">{speaker}</span>
        <span className="text-sm text-[#9CA3AF] bg-[#0D1117] px-2 py-1 rounded-md">{timestamp}</span>
      </div>
      <p className="text-[#E5E7EB] leading-relaxed">{text}</p>
      {fallacy && (
        <div className="mt-3 pt-3 border-t border-[#2C3E50] text-sm">
          <span className="text-red-500 font-medium">Fallacy Detected:</span> {fallacy}
        </div>
      )}
    </div>
  );
};

export default TranscriptEntry; 