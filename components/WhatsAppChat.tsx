"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import Image from "next/image";

const WhatsAppChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipTextIndex, setTooltipTextIndex] = useState(0);

  const tooltipTexts = [
    "Need help?",
    "Chat with us!",
    "Support is online",
    "ShipQuickr Support",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTooltipTextIndex((prev) => (prev + 1) % tooltipTexts.length);
    }, 4000);

    const timeout = setTimeout(() => setShowTooltip(true), 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const handleStartChat = () => {
    const phoneNumber = "918853099924";
    const message =
      "Hi ShipQuickr Support Team, I need help regarding my shipment/account.";

    window.open(
      `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-9999 text-right font-sans">
      <AnimatePresence>
        {!isOpen && showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.8 }}
            className="absolute bottom-16 right-0 mb-1 whitespace-nowrap rounded-lg border border-slate-100 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <motion.span
              key={tooltipTextIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="inline-block"
            >
              {tooltipTexts[tooltipTextIndex]}
            </motion.span>

            <div className="absolute -bottom-1.2 right-6 h-2.5 w-2.5 rotate-45 border-b border-r border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-800" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-13 w-13 cursor-pointer items-center justify-center rounded-full shadow-2xl transition-all duration-300 ${
          isOpen
            ? "rotate-90 bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-200"
            : "bg-[#25D366] text-white hover:shadow-[#25D366]/40"
        }`}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current">
            <path d="M17.472 14.382c-.301-.15-1.767-.872-2.031-.969-.264-.099-.456-.148-.65.15-.192.298-.745.969-.913 1.162-.167.194-.336.216-.637.066-.3-.15-1.266-.467-2.413-1.488-.894-.797-1.498-1.782-1.674-2.081-.176-.299-.019-.461.13-.61.137-.133.3-.35.45-.525.15-.175.2-.299.3-.5.1-.199.05-.374-.025-.524-.075-.15-.65-1.565-.89-2.144-.233-.564-.47-.487-.65-.496-.168-.008-.36-.01-.552-.01-.193 0-.508.073-.774.364-.265.292-1.011 1.002-1.011 2.446 0 1.444 1.053 2.84 1.196 3.033.144.194 2.074 3.167 5.022 4.444.701.304 1.248.486 1.675.623.705.225 1.345.193 1.851.118.564-.083 1.767-.722 2.019-1.417.253-.695.253-1.291.177-1.417-.076-.126-.279-.201-.58-.352zm-5.467 6.917c-1.852 0-3.669-.498-5.258-1.442l-3.778 1.11 1.13-3.684c-1.036-1.737-1.583-3.72-1.583-5.751 0-6.07 4.938-11.008 11.008-11.008 2.941 0 5.706 1.146 7.786 3.226s3.226 4.845 3.226 7.782c0 6.071-4.94 11.009-11.009 11.009z" />
          </svg>
        )}

        {!isOpen && (
          <motion.div
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 -z-10 rounded-full bg-[#25D366]"
          />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.5, originY: 1, originX: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.5 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-16 right-0 w-[270px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="relative h-36 w-full border-b border-slate-50 bg-white dark:border-slate-700/30 dark:bg-slate-800">
              <Image
                src="/images/support-team.png"
                alt="Support Team"
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="p-4 text-center">
              <div className="mb-1.5 flex items-center justify-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Live Agent Support
                </span>
              </div>

              <h3 className="mb-0.5 text-[14px] font-black tracking-tight text-slate-900 dark:text-white">
                Welcome To ShipQuickr!
              </h3>

              <p className="px-1 text-[10px] font-semibold leading-normal text-slate-500 dark:text-slate-400">
                We are here to help you! Kindly share your concern with our support
                team.
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartChat}
                className="mt-3.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#25D366] py-2.5 text-[11px] font-extrabold tracking-wide text-white shadow-lg shadow-[#25D366]/20 transition-all hover:bg-[#20bd5c]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                  <path d="M17.472 14.382c-.301-.15-1.767-.872-2.031-.969-.264-.099-.456-.148-.65.15-.192.298-.745.969-.913 1.162-.167.194-.336.216-.637.066-.3-.15-1.266-.467-2.413-1.488-.894-.797-1.498-1.782-1.674-2.081-.176-.299-.019-.461.13-.61.137-.133.3-.35.45-.525.15-.175.2-.299.3-.5.1-.199.05-.374-.025-.524-.075-.15-.65-1.565-.89-2.144-.233-.564-.47-.487-.65-.496-.168-.008-.36-.01-.552-.01-.193 0-.508.073-.774.364-.265.292-1.011 1.002-1.011 2.446 0 1.444 1.053 2.84 1.196 3.033.144.194 2.074 3.167 5.022 4.444.701.304 1.248.486 1.675.623.705.225 1.345.193 1.851.118.564-.083 1.767-.722 2.019-1.417.253-.695.253-1.291.177-1.417-.076-.126-.279-.201-.58-.352zm-5.467 6.917c-1.852 0-3.669-.498-5.258-1.442l-3.778 1.11 1.13-3.684c-1.036-1.737-1.583-3.72-1.583-5.751 0-6.07 4.938-11.008 11.008-11.008 2.941 0 5.706 1.146 7.786 3.226s3.226 4.845 3.226 7.782c0 6.071-4.94 11.009-11.009 11.009z" />
                </svg>
                START CHAT
              </motion.button>

              <div className="mt-4 flex flex-col items-center gap-1 opacity-40">
                <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Powered by ShipQuickr.com
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WhatsAppChat;