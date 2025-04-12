export interface TranscriptEntry {
  id: string;
  speaker: string;
  timestamp: string;
  text: string;
  fallacy?: string;
}

export const mockTranscriptEntries: TranscriptEntry[] = [
  {
    id: '1',
    speaker: 'John',
    timestamp: '00:00:15',
    text: 'I believe that climate change is primarily caused by human activities.',
    fallacy: 'Appeal to belief - Stating a belief without providing evidence.'
  },
  {
    id: '2',
    speaker: 'Sarah',
    timestamp: '00:00:30',
    text: 'While I agree that humans contribute, I think natural cycles play a larger role than you suggest.',
    fallacy: 'False balance - Giving equal weight to unequal evidence.'
  },
  {
    id: '3',
    speaker: 'John',
    timestamp: '00:00:45',
    text: 'The scientific consensus is clear - over 97% of climate scientists agree that human activities are the dominant cause of global warming.',
    fallacy: 'Appeal to authority - While scientific consensus is important, it should be supported by specific evidence.'
  },
  {
    id: '4',
    speaker: 'Sarah',
    timestamp: '00:01:00',
    text: 'But what about the medieval warm period? Temperatures were higher then without human CO2 emissions.',
    fallacy: 'False equivalence - Comparing different time periods without accounting for different contexts and scales.'
  },
  {
    id: '5',
    speaker: 'John',
    timestamp: '00:01:15',
    text: 'The medieval warm period was regional, not global like today\'s warming. The current rate of warming is unprecedented.',
  },
  {
    id: '6',
    speaker: 'Sarah',
    timestamp: '00:01:30',
    text: 'If climate change is real, why is it still cold in winter?',
    fallacy: 'False dichotomy - Confusing weather (short-term) with climate (long-term patterns).'
  },
  {
    id: '7',
    speaker: 'John',
    timestamp: '00:01:45',
    text: 'Climate refers to long-term patterns, not individual weather events. The overall global temperature is rising.',
    fallacy: 'Straw man - Misrepresenting the opponent\'s position to make it easier to attack.'
  },
  {
    id: '8',
    speaker: 'Sarah',
    timestamp: '00:02:00',
    text: 'But implementing climate policies will destroy our economy.',
    fallacy: 'Slippery slope - Assuming extreme consequences without evidence.'
  },
  {
    id: '9',
    speaker: 'John',
    timestamp: '00:02:15',
    text: 'Actually, renewable energy creates jobs and many countries have grown their economies while reducing emissions.',
  },
  {
    id: '10',
    speaker: 'Sarah',
    timestamp: '00:02:30',
    text: 'Well, I still don\'t think we should do anything drastic until we\'re 100% sure.',
  }
]; 