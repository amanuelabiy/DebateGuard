"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SignOutButton, UserButton } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { CreditCard } from "lucide-react";

export default function AnimatedPage() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E5E7EB]">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="border-b border-[#2C3E50] py-4"
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">
              <span className="text-[#10B981]">Debate</span>Guard
            </h1>
          </div>
          <div className="hidden md:flex space-x-8 items-center">
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="#features"
              className="text-[#E5E7EB] hover:text-[#10B981] transition-colors"
            >
              Features
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="#how-it-works"
              className="text-[#E5E7EB] hover:text-[#10B981] transition-colors"
            >
              How It Works
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="#about"
              className="text-[#E5E7EB] hover:text-[#10B981] transition-colors"
            >
              About Us
            </motion.a>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/transcript"
                className="text-[#E5E7EB] hover:text-[#10B981] transition-colors"
              >
                Try It
              </Link>
            </motion.div>
            <div className="flex items-center gap-3">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: {
                      width: 35,
                      height: 35,
                    },
                  },
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Billing"
                    labelIcon={<CreditCard className="size-4" />}
                    href="/billing"
                  />
                </UserButton.MenuItems>
              </UserButton>
            </div>
          </div>
          <div className="md:hidden">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="text-[#E5E7EB]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D1117] to-[#1F2937] opacity-90"></div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="md:w-1/2 mb-12 md:mb-0"
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Take Your <span className="text-[#10B981]">Debates</span> to the
                Next Level
              </h1>
              <p className="text-xl text-[#9CA3AF] mb-6 leading-relaxed">
                Join us in building a culture of honest, thought-provoking
                discussions, guided by cutting-edge AI moderation.
              </p>
              <p className="text-lg text-[#9CA3AF] mb-8 italic">
                "We believe respectful dialogue is the foundation of progress.
                That's why we created DebateGuard."
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.div
                  whileHover={{
                    scale: 1.05,
                    boxShadow:
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/transcript"
                    className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium py-4 px-8 rounded-lg transition-colors text-center shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all block"
                  >
                    Start Debating
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="#features"
                    className="border border-[#2C3E50] hover:bg-[#1F2937] text-[#E5E7EB] font-medium py-4 px-8 rounded-lg transition-colors text-center block"
                  >
                    Learn More
                  </Link>
                </motion.div>
              </div>
            </motion.div>
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="md:w-1/2 flex justify-center"
            >
              <div className="relative w-full max-w-md h-80 md:h-96">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="absolute inset-0 bg-gradient-to-br from-[#1F2937] to-[#0D1117] rounded-xl shadow-2xl border border-[#2C3E50] p-6 overflow-hidden"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="space-y-3">
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                      className="flex items-start"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-bold mr-3 mt-1">
                        A
                      </div>
                      <div className="flex-1">
                        <div className="h-4 bg-[#2C3E50] rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-[#2C3E50] rounded w-1/2"></div>
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                      className="flex items-start"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center text-white font-bold mr-3 mt-1">
                        B
                      </div>
                      <div className="flex-1">
                        <div className="h-4 bg-[#2C3E50] rounded w-5/6 mb-2"></div>
                        <div className="h-4 bg-[#2C3E50] rounded w-2/3"></div>
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 1 }}
                      className="flex items-start"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-bold mr-3 mt-1">
                        A
                      </div>
                      <div className="flex-1">
                        <div className="h-4 bg-[#2C3E50] rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-[#2C3E50] rounded w-1/2"></div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-20 bg-[#1F2937]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-[#10B981]">Powerful Features</span> for
              Better Debates
            </h2>
            <p className="text-xl text-[#9CA3AF] max-w-2xl mx-auto">
              DebateGuard combines cutting-edge AI technology with intuitive
              design to enhance your discussion experience.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{
                y: -10,
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
              className="bg-[#0D1117] p-8 rounded-xl border border-[#2C3E50] hover:border-[#10B981] transition-colors group"
            >
              <div className="w-14 h-14 bg-[#2563EB] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#10B981] transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Real-time Transcription
              </h3>
              <p className="text-[#9CA3AF]">
                Convert speech to text instantly with our advanced AI-powered
                transcription technology, making every word count.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{
                y: -10,
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
              className="bg-[#0D1117] p-8 rounded-xl border border-[#2C3E50] hover:border-[#10B981] transition-colors group"
            >
              <div className="w-14 h-14 bg-[#2563EB] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#10B981] transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Moderation</h3>
              <p className="text-[#9CA3AF]">
                Keep discussions respectful and on-topic with our intelligent
                moderation system that detects inappropriate content.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{
                y: -10,
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
              className="bg-[#0D1117] p-8 rounded-xl border border-[#2C3E50] hover:border-[#10B981] transition-colors group"
            >
              <div className="w-14 h-14 bg-[#2563EB] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#10B981] transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Insightful Analytics
              </h3>
              <p className="text-[#9CA3AF]">
                Gain valuable insights into debate performance with detailed
                analytics and feedback on your communication style.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How <span className="text-[#10B981]">DebateGuard</span> Works
            </h2>
            <p className="text-xl text-[#9CA3AF] max-w-2xl mx-auto">
              Our platform makes it easy to start meaningful discussions with
              AI-powered assistance.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-20 h-20 bg-[#2563EB] rounded-full flex items-center justify-center mb-6 text-2xl font-bold shadow-lg"
              >
                1
              </motion.div>
              <h3 className="text-xl font-semibold mb-3">Start a Debate</h3>
              <p className="text-[#9CA3AF]">
                Create a new debate room or join an existing one with a simple
                click.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-20 h-20 bg-[#2563EB] rounded-full flex items-center justify-center mb-6 text-2xl font-bold shadow-lg"
              >
                2
              </motion.div>
              <h3 className="text-xl font-semibold mb-3">Speak Naturally</h3>
              <p className="text-[#9CA3AF]">
                Engage in discussion while our AI transcribes and analyzes in
                real-time.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-20 h-20 bg-[#2563EB] rounded-full flex items-center justify-center mb-6 text-2xl font-bold shadow-lg"
              >
                3
              </motion.div>
              <h3 className="text-xl font-semibold mb-3">Review & Improve</h3>
              <p className="text-[#9CA3AF]">
                Access transcripts, insights, and suggestions to enhance your
                debate skills.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 bg-[#1F2937]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              About <span className="text-[#10B981]">DebateGuard</span>
            </h2>
            <p className="text-xl text-[#9CA3AF] max-w-2xl mx-auto">
              Our story and mission to transform how people engage in
              discussions
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Our Story */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{
                y: -5,
                boxShadow:
                  "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              }}
              className="bg-[#0D1117] p-8 rounded-xl border border-[#2C3E50]"
            >
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold">Our Story</h3>
              </div>
              <p className="text-[#E5E7EB] mb-4 leading-relaxed">
                DebateGuard was born during a 36-hour hackathon, where our team
                of four passionate developers came together with a shared
                vision: to create a tool that helps people engage in more
                respectful and productive discussions.
              </p>
              <p className="text-[#E5E7EB] leading-relaxed">
                We built this platform using Next.js, React, and the OpenAI API
                to leverage cutting-edge AI technology for real-time
                transcription and analysis. Our goal was simple: to help people
                settle debates respectfully, whether among friends,
                professionals, or anyone in between.
              </p>
            </motion.div>

            {/* Our Team */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{
                y: -5,
                boxShadow:
                  "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              }}
              className="bg-[#0D1117] p-8 rounded-xl border border-[#2C3E50]"
            >
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-[#10B981] flex items-center justify-center mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold">Our Team</h3>
              </div>
              <p className="text-[#E5E7EB] mb-6 leading-relaxed">
                DebateGuard was created by a diverse team of developers who came
                together for this hackathon:
              </p>
              <div className="space-y-4">
                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-center p-3 rounded-lg hover:bg-[#1F2937] transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-bold mr-4">
                    AA
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#E5E7EB]">
                      Amanuel Abiy
                    </h4>
                    <p className="text-[#9CA3AF]">Frontend Developer</p>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-center p-3 rounded-lg hover:bg-[#1F2937] transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-[#10B981] flex items-center justify-center text-white font-bold mr-4">
                    MT
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#E5E7EB]">
                      Markose Tsegaye
                    </h4>
                    <p className="text-[#9CA3AF]">Backend Developer</p>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-center p-3 rounded-lg hover:bg-[#1F2937] transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-bold mr-4">
                    TS
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#E5E7EB]">
                      Thomas Schlinke
                    </h4>
                    <p className="text-[#9CA3AF]">AI Integration Specialist</p>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-center p-3 rounded-lg hover:bg-[#1F2937] transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-[#10B981] flex items-center justify-center text-white font-bold mr-4">
                    TS
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#E5E7EB]">
                      Tom Shimoni
                    </h4>
                    <p className="text-[#9CA3AF]">UI/UX Designer</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Our Mission */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{
              y: -5,
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            }}
            className="bg-[#0D1117] p-8 rounded-xl border border-[#2C3E50] max-w-3xl mx-auto"
          >
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold">Our Mission</h3>
            </div>
            <p className="text-[#E5E7EB] mb-4 leading-relaxed">
              At DebateGuard, we believe that respectful dialogue is the
              foundation of progress. Our mission is to provide tools that help
              people engage in more effective and respectful discussions,
              regardless of the context or participants.
            </p>
            <p className="text-[#E5E7EB] leading-relaxed">
              By combining real-time transcription, AI analysis, and thoughtful
              design, we aim to create an environment where ideas can be shared
              freely, disagreements can be resolved constructively, and
              understanding can flourish.
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center mt-12"
          >
            <p className="text-[#9CA3AF] italic text-lg">
              Built in 36 hours during a passionate hackathon at Bitcamp 2025
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-[#1F2937] rounded-2xl p-12 border border-[#2C3E50] max-w-4xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to transform your{" "}
              <span className="text-[#10B981]">debates</span>?
            </h2>
            <p className="text-xl text-[#9CA3AF] mb-8 max-w-2xl mx-auto">
              Join DebateGuard today and experience the power of AI-enhanced
              discussions.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/transcript"
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium py-4 px-10 rounded-lg transition-colors inline-block text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
              >
                Get Started Now
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[#2C3E50]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold mb-4">
                <span className="text-[#10B981]">Debate</span>Guard
              </h2>
              <p className="text-[#9CA3AF] mb-4">
                AI-powered debate platform for more effective and respectful
                discussions.
              </p>
              <p className="text-[#9CA3AF] mb-4">
                Created in 36 hours during a hackathon by:
              </p>
              <ul className="text-[#9CA3AF] mb-4">
                <li>• Amanuel Abiy</li>
                <li>• Markose Tsegaye</li>
                <li>• Thomas Schlinke</li>
                <li>• Tom Shimoni</li>
              </ul>
              <div className="flex space-x-4">
                <motion.a
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  href="#"
                  className="text-[#9CA3AF] hover:text-[#10B981] transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  href="#"
                  className="text-[#9CA3AF] hover:text-[#10B981] transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.268 0-.535-.015-.803A8.333 8.333 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  href="#"
                  className="text-[#9CA3AF] hover:text-[#10B981] transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.65.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.a>
              </div>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Product</h4>
                  <ul className="space-y-2">
                    <li>
                      <a
                        href="#features"
                        className="text-[#9CA3AF] hover:text-[#E5E7EB] transition-colors"
                      >
                        Features
                      </a>
                    </li>
                    <li>
                      <a
                        href="#how-it-works"
                        className="text-[#9CA3AF] hover:text-[#E5E7EB] transition-colors"
                      >
                        How It Works
                      </a>
                    </li>
                    <li>
                      <a
                        href="#about"
                        className="text-[#9CA3AF] hover:text-[#E5E7EB] transition-colors"
                      >
                        About Us
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
          <div className="mt-12 pt-8 border-t border-[#2C3E50] text-center">
            <p className="text-[#9CA3AF]">
              © 2025 DebateGuard - Created at Bitcamp. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
