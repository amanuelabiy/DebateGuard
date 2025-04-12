import React from 'react';
import { TranscriptEntry as TranscriptEntryType } from '@/lib/mockData';

interface FallacyStatsProps {
  entries: TranscriptEntryType[];
}

const FallacyStats: React.FC<FallacyStatsProps> = ({ entries }) => {
  // Count fallacies
  const fallacyCount = entries.filter(entry => entry.fallacy).length;
  
  // Get unique fallacies
  const uniqueFallacies = Array.from(new Set(entries.filter(entry => entry.fallacy).map(entry => entry.fallacy)));
  
  // Determine bar color based on fallacy count
  const getBarColor = () => {
    if (fallacyCount < 3) return 'bg-[#10B981]'; // Green
    if (fallacyCount <= 7) return 'bg-yellow-500'; // Yellow
    return 'bg-red-500'; // Red
  };
  
  // Determine text color based on fallacy count
  const getTextColor = () => {
    if (fallacyCount < 3) return 'text-[#10B981]'; // Green
    if (fallacyCount <= 7) return 'text-yellow-500'; // Yellow
    return 'text-red-500'; // Red
  };
  
  return (
    <div className="bg-[#1F2937] p-6 rounded-xl shadow-lg border border-[#2C3E50] transition-all duration-300 hover:shadow-xl">
      <h2 className="text-2xl font-semibold mb-6 text-[#E5E7EB] tracking-tight">Fallacy Statistics</h2>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[#E5E7EB] font-medium">Total Fallacies</span>
          <span className={`${getTextColor()} font-bold text-xl`}>{fallacyCount}</span>
        </div>
        <div className="w-full bg-[#2C3E50] rounded-full h-3">
          <div 
            className={`${getBarColor()} h-3 rounded-full transition-all duration-500`}
            style={{ width: `${(fallacyCount / entries.length) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {uniqueFallacies.length > 0 && (
        <div>
          <h3 className="text-[#E5E7EB] font-medium mb-3">Types of Fallacies</h3>
          <ul className="space-y-2">
            {uniqueFallacies.map((fallacy, index) => (
              <li key={index} className="flex items-center text-[#9CA3AF] text-sm">
                <span className={`w-2 h-2 ${getBarColor()} rounded-full mr-3`}></span>
                {fallacy}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FallacyStats; 