'use client';

import React, { useState } from 'react';
import TranscriptEntry from '@/components/TranscriptEntry';
import FallacyStats from '@/components/FallacyStats';
import SpeakerStats from '@/components/SpeakerStats';
import { mockTranscriptEntries, TranscriptEntry as TranscriptEntryType } from '@/lib/mockData';

export default function Dashboard() {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Filter entries based on selected filter and search term
  const filteredEntries = mockTranscriptEntries.filter(entry => {
    // Apply speaker filter
    if (filter !== 'all' && entry.speaker !== filter) {
      return false;
    }
    
    // Apply search term filter
    if (searchTerm && !entry.text.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Get unique speakers for filter dropdown
  const speakers = Array.from(new Set(mockTranscriptEntries.map(entry => entry.speaker)));
  
  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E5E7EB]">
      <div className="container mx-auto px-4 py-10 max-w-7xl">
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-[#E5E7EB] mb-3 tracking-tight">Debate Summary</h1>
          <p className="text-[#9CA3AF] text-lg">Review and analyze debate transcripts</p>
        </header>
        
        <div className="mb-8 flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3">
            <label htmlFor="speaker-filter" className="block text-sm font-medium text-[#9CA3AF] mb-2">
              Filter by Speaker
            </label>
            <select
              id="speaker-filter"
              className="w-full p-3 bg-[#1F2937] border border-[#2C3E50] rounded-lg text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all duration-200"
              value={filter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilter(e.target.value)}
            >
              <option value="all">All Speakers</option>
              {speakers.map(speaker => (
                <option key={speaker} value={speaker}>{speaker}</option>
              ))}
            </select>
          </div>
          
          <div className="w-full md:w-2/3">
            <label htmlFor="search" className="block text-sm font-medium text-[#9CA3AF] mb-2">
              Search Transcript
            </label>
            <div className="flex">
              <input
                id="search"
                type="text"
                className="w-full p-3 bg-[#1F2937] border border-[#2C3E50] rounded-l-lg text-[#E5E7EB] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all duration-200"
                placeholder="Search for keywords..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
              <button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-3 rounded-r-lg transition-colors duration-200 font-medium">
                Search
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#1F2937] p-6 rounded-xl shadow-lg border border-[#2C3E50] transition-all duration-300 hover:shadow-xl">
              <h2 className="text-2xl font-semibold mb-6 text-[#E5E7EB] tracking-tight">Debate Transcript</h2>
              
              <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4">
                {filteredEntries.length > 0 ? (
                  filteredEntries.map((entry: TranscriptEntryType) => (
                    <TranscriptEntry
                      key={entry.id}
                      speaker={entry.speaker}
                      timestamp={entry.timestamp}
                      text={entry.text}
                      fallacy={entry.fallacy}
                    />
                  ))
                ) : (
                  <p className="text-center text-[#9CA3AF] py-8">No transcript entries match your filters.</p>
                )}
              </div>
            </div>
            
            <div className="bg-[#1F2937] p-6 rounded-xl shadow-lg border border-[#2C3E50] transition-all duration-300 hover:shadow-xl">
              <h2 className="text-2xl font-semibold mb-4 text-[#E5E7EB] tracking-tight">Debate Summary</h2>
              <p className="text-[#9CA3AF] leading-relaxed mb-6">
                This debate focused on climate change, with {speakers.length} participants discussing the causes and potential solutions.
                <span className={`font-medium ${filteredEntries.filter(entry => entry.fallacy).length < 3 ? 'text-[#10B981]' : filteredEntries.filter(entry => entry.fallacy).length <= 7 ? 'text-yellow-500' : 'text-red-500'}`}> {filteredEntries.filter(entry => entry.fallacy).length} logical fallacies</span> were identified during the discussion.
              </p>
              
              <h3 className="text-xl font-semibold mb-4 text-[#E5E7EB]">Participant Arguments</h3>
              <div className="space-y-4">
                {speakers.map(speaker => {
                  // Get all entries for this speaker
                  const speakerEntries = filteredEntries.filter(entry => entry.speaker === speaker);
                  
                  // Extract key points from the speaker's entries
                  const keyPoints = speakerEntries
                    .filter(entry => entry.text.length > 50) // Only consider substantial entries
                    .map(entry => entry.text.substring(0, 150) + (entry.text.length > 150 ? '...' : ''));
                  
                  return (
                    <div key={speaker} className="border-l-4 border-[#2C3E50] pl-4 py-2">
                      <h4 className="font-medium text-[#E5E7EB] mb-2">{speaker}'s Position</h4>
                      <p className="text-[#9CA3AF] text-sm">
                        {keyPoints.length > 0 
                          ? keyPoints[0] 
                          : `${speaker} made ${speakerEntries.length} statements during the debate.`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <SpeakerStats entries={filteredEntries} />
            <FallacyStats entries={filteredEntries} />
          </div>
        </div>
      </div>
    </div>
  );
} 