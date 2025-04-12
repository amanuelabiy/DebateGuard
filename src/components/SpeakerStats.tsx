import React from 'react';
import { TranscriptEntry as TranscriptEntryType } from '@/lib/mockData';

interface SpeakerStatsProps {
  entries: TranscriptEntryType[];
}

const SpeakerStats: React.FC<SpeakerStatsProps> = ({ entries }) => {
  // Count entries by speaker
  const speakerCounts: Record<string, number> = {};
  const speakerFallacyCounts: Record<string, number> = {};
  
  entries.forEach(entry => {
    speakerCounts[entry.speaker] = (speakerCounts[entry.speaker] || 0) + 1;
    if (entry.fallacy) {
      speakerFallacyCounts[entry.speaker] = (speakerFallacyCounts[entry.speaker] || 0) + 1;
    }
  });
  
  // Convert to array for rendering
  const speakerStats = Object.entries(speakerCounts).map(([speaker, count]) => ({
    speaker,
    count,
    fallacyCount: speakerFallacyCounts[speaker] || 0
  }));
  
  // Sort by count (descending)
  speakerStats.sort((a, b) => b.count - a.count);
  
  // Determine fallacy color based on total fallacy count
  const totalFallacies = entries.filter(entry => entry.fallacy).length;
  const getFallacyColor = () => {
    if (totalFallacies < 3) return 'text-[#10B981]'; // Green
    if (totalFallacies <= 7) return 'text-yellow-500'; // Yellow
    return 'text-red-500'; // Red
  };
  
  const getFallacyBgColor = () => {
    if (totalFallacies < 3) return 'bg-[#10B981]'; // Green
    if (totalFallacies <= 7) return 'bg-yellow-500'; // Yellow
    return 'bg-red-500'; // Red
  };
  
  return (
    <div className="bg-[#1F2937] p-6 rounded-xl shadow-lg border border-[#2C3E50] transition-all duration-300 hover:shadow-xl">
      <h2 className="text-2xl font-semibold mb-6 text-[#E5E7EB] tracking-tight">Speaker Statistics</h2>
      
      <div className="space-y-6">
        {speakerStats.map(({ speaker, count, fallacyCount }) => (
          <div key={speaker} className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#E5E7EB] font-medium">{speaker}</span>
              <span className="text-[#9CA3AF] font-medium">{count} entries</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-full h-2 bg-[#2C3E50] rounded-full mr-3">
                <div 
                  className="h-2 bg-[#9CA3AF] rounded-full" 
                  style={{ width: `${(count / entries.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <span className="text-[#9CA3AF] text-sm">Fallacies</span>
              <span className={`font-medium ${getFallacyColor()}`}>
                {fallacyCount}
              </span>
            </div>
            
            {fallacyCount > 0 && (
              <div className="flex items-center">
                <div className="w-full h-1.5 bg-[#2C3E50] rounded-full mr-3">
                  <div 
                    className={`h-1.5 ${getFallacyBgColor()} rounded-full`}
                    style={{ width: `${(fallacyCount / count) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpeakerStats; 