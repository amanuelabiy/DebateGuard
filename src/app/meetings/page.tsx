import Sidebar from "@/components/Sidebar";

export default function MeetingsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 ml-64">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Meetings</h1>
          <button className="bg-[#2563EB] hover:bg-[#c9d0e4] text-white px-6 py-3 rounded-md transition-colors">
            Join Meeting
          </button>
        </div>
      </main>
    </div>
  );
}
