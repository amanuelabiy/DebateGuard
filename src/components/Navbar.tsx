import { motion } from "framer-motion";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { CreditCard } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isLandingPage = pathname === "/";

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="border-b border-[#2C3E50] py-4"
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">
              <span className="text-[#10B981]">Debate</span>Guard
            </h1>
          </div>
        </Link>
        <div className="flex items-center gap-6">
          {isLandingPage ? (
            <>
              <div className="hidden md:flex space-x-8">
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
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/transcript"
                    className="text-[#E5E7EB] hover:text-[#10B981] transition-colors"
                  >
                    Try It
                  </Link>
                </motion.div>
              </div>
              <div className="flex items-center gap-6">
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
                <div className="md:hidden">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleMobileMenu}
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
            </>
          ) : (
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
          )}
        </div>
      </div>
      {isLandingPage && isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden container mx-auto px-4 py-4"
        >
          <div className="flex flex-col space-y-4">
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
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
