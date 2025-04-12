"use client";

import MeetingModal from "@/components/MeetingModal";
import Navbar from "@/components/Navbar";
import { useState } from "react";

export default function DashboardPage() {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"join" | "start">("join");

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-12 text-white">Meetings</h1>
          <div className="flex gap-6 justify-center">
            <button
              onClick={() => {
                setModalType("start");
                setShowModal(true);
              }}
              className="bg-[#2563EB] hover:bg-[#7ca3ff] hover:cursor-pointer text-white px-8 py-4 rounded-lg transition-colors text-lg font-medium shadow-md hover:shadow-lg"
            >
              Create Meeting
            </button>
            <button
              onClick={() => {
                setModalType("join");
                setShowModal(true);
              }}
              className="bg-[#2563EB] hover:bg-[#7ca3ff] hover:cursor-pointer text-white px-8 py-4 rounded-lg transition-colors text-lg font-medium shadow-md hover:shadow-lg"
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
