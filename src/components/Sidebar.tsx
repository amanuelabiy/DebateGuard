import Link from "next/link";
import { Shield } from "lucide-react";

export default function Sidebar() {
  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-[#1F2937] border-r border-[#2C3E50] p-4">
      <div className="flex items-center gap-2 mb-8">
        <Shield className="h-8 w-8 text-[#10B981]" />
        <span className="text-xl font-bold">DebateGuard</span>
      </div>

      <nav>
        <Link
          href="/meetings"
          className="flex items-center gap-2 px-4 py-2 text-[#E5E7EB] hover:bg-[#2C3E50] rounded-md transition-colors"
        >
          <span>Meetings</span>
        </Link>
      </nav>
    </div>
  );
}
