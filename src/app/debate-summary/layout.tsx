import React from 'react';

export default function DebateSummaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0D1117]">
      <nav className="bg-[#1F2937] shadow-md border-b border-[#2C3E50]">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="text-xl font-bold text-[#E5E7EB]">DebateGuard</div>
            <div className="flex space-x-4">
              <a href="/" className="text-[#9CA3AF] hover:text-[#E5E7EB]">Home</a>
              <a href="/debate-summary" className="text-[#E5E7EB] font-medium">Debate Summary</a>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
      <footer className="bg-[#1F2937] mt-8 py-4 border-t border-[#2C3E50]">
        <div className="container mx-auto px-4 text-center text-[#9CA3AF] text-sm">
          © {new Date().getFullYear()} DebateGuard - Promoting Civil Discourse
        </div>
      </footer>
    </div>
  );
} 