"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface Tab {
  label: string
  href: string
}

interface OrderTabsProps {
  tabs: Tab[]
  pathname: string
}

export function OrderTabs({ tabs, pathname }: OrderTabsProps) {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Check for screen size on mount and when window resizes
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640)
    }

    // Check if user prefers dark mode
    const checkDarkMode = () => {
      setIsDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches)
    }

    checkScreenSize()
    checkDarkMode()

    window.addEventListener("resize", checkScreenSize)
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", checkDarkMode)

    return () => {
      window.removeEventListener("resize", checkScreenSize)
      window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", checkDarkMode)
    }
  }, [])

  return (
    <div className={`flex ${isMobile ? "flex-wrap" : "flex-row"} gap-2 mb-4`}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.href

        return (
          <motion.button
            type="button"
            key={tab.href}
            onClick={() => router.push(tab.href)}
            className={`
              relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ease-in-out
              ${isMobile ? "flex-1 min-w-[120px] mb-1" : ""}
              ${
                isActive
                  ? `${isDarkMode ? "bg-indigo-700 text-white" : "bg-indigo-600 text-white"} shadow-md`
                  : `${
                      isDarkMode
                        ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`
              }
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {tab.label}
            {isActive && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full mx-2"
                layoutId="activeTab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
