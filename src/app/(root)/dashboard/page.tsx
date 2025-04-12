"use client";

import MeetingModal from "@/components/MeetingModal";
import Sidebar from "@/components/Sidebar";
import { useState } from "react";

export default function DashboardPage() {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"join" | "start">("join");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 ml-64">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Meetings</h1>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setModalType("start");
                setShowModal(true);
              }}
              className="bg-[#2563EB] hover:cursor-pointer hover:bg-[#7b9bf3] text-white px-6 py-3 rounded-md transition-colors"
            >
              Create Meeting
            </button>
            <button
              onClick={() => {
                setModalType("join");
                setShowModal(true);
              }}
              className="bg-[#2563EB] hover:cursor-pointer hover:bg-[#7b9bf3] text-white px-6 py-3 rounded-md transition-colors"
            >
              Join Meeting
            </button>
          </div>
          <MeetingModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title={modalType === "join" ? "Join Meeting" : "Start Meeting"}
            isJoinMeeting={modalType === "join"}
          />
        </div>
      </main>
    </div>
  );
}
