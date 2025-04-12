import Link from "next/link";
import { Shield, Mic, Brain } from "lucide-react";

export default function Sidebar() {
  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-[#1F2937] border-r border-[#2C3E50] p-4">
      <div className="flex items-center gap-2 mb-8">
        <Shield className="h-8 w-8 text-[#10B981]" />
        <span className="text-xl font-bold text-white">DebateGuard</span>
      </div>

      <nav className="space-y-2">
        <Link
          href="/meetings"
          className="flex items-center gap-2 px-4 py-2 text-[#E5E7EB] hover:bg-[#2C3E50] rounded-md transition-colors"
        >
          <span>Meetings</span>
        </Link>
        
        <Link
          href="/transcript"
          className="flex items-center gap-2 px-4 py-2 text-[#E5E7EB] hover:bg-[#2C3E50] rounded-md transition-colors"
        >
          <Mic className="h-5 w-5" />
          <span>Transcribe</span>
        </Link>

        <Link
          href="/analyze"
          className="flex items-center gap-2 px-4 py-2 text-[#E5E7EB] hover:bg-[#2C3E50] rounded-md transition-colors"
        >
          <Brain className="h-5 w-5" />
          <span>Analyze</span>
        </Link>
      </nav>
    </div>
  );
}
