import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E5E7EB]">
      <nav className="bg-[#1F2937] shadow-md border-b border-[#2C3E50]">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="text-xl font-bold text-[#E5E7EB]">DebateGuard</div>
            <div className="flex space-x-4">
              <a href="/" className="text-[#E5E7EB] font-medium">Home</a>
              <a href="/debate-summary" className="text-[#9CA3AF] hover:text-[#E5E7EB]">Debate Summary</a>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-[#E5E7EB] mb-2">DebateGuard</h1>
          <p className="text-[#9CA3AF] text-xl">Analyze debates for logical fallacies</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#1F2937] p-6 rounded-lg border border-[#2C3E50]">
            <h2 className="text-2xl font-semibold mb-4 text-[#E5E7EB]">How It Works</h2>
            <p className="text-[#9CA3AF] mb-4">
              DebateGuard uses AI to analyze debate transcripts and identify logical fallacies in real-time.
              Upload your debate transcript or use our live analysis feature to get instant feedback.
            </p>
            <Link 
              href="/debate-summary" 
              className="inline-block bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-md"
            >
              Go to Debate Summary
            </Link>
          </div>
          
          <div className="bg-[#1F2937] p-6 rounded-lg border border-[#2C3E50]">
            <h2 className="text-2xl font-semibold mb-4 text-[#E5E7EB]">Features</h2>
            <ul className="space-y-2 text-[#9CA3AF]">
              <li className="flex items-center">
                <span className="text-[#10B981] mr-2">✓</span>
                Real-time fallacy detection
              </li>
              <li className="flex items-center">
                <span className="text-[#10B981] mr-2">✓</span>
                Detailed analysis reports
              </li>
              <li className="flex items-center">
                <span className="text-[#10B981] mr-2">✓</span>
                Speaker statistics
              </li>
              <li className="flex items-center">
                <span className="text-[#10B981] mr-2">✓</span>
                Fallacy categorization
              </li>
            </ul>
          </div>
        </div>
        
        <div className="bg-[#1F2937] p-6 rounded-lg border border-[#2C3E50]">
          <h2 className="text-2xl font-semibold mb-4 text-[#E5E7EB]">About DebateGuard</h2>
          <p className="text-[#9CA3AF]">
            DebateGuard is designed to help debaters, educators, and critical thinkers identify logical fallacies in debates.
            Our AI-powered platform analyzes transcripts to detect common fallacies like ad hominem, straw man, false equivalence, and more.
          </p>
        </div>
      </div>
      
      <footer className="bg-[#1F2937] mt-8 py-4 border-t border-[#2C3E50]">
        <div className="container mx-auto px-4 text-center text-[#9CA3AF] text-sm">
          © {new Date().getFullYear()} DebateGuard - Promoting Civil Discourse
        </div>
      </footer>
    </div>
  );
}
