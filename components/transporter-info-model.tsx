"use client"

import { X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

interface TransporterInfoModalProps {
  isOpen: boolean
  onCloseAction: () => void
}

const transporterData = [
  { carrier: "Delhivery", transportId: "06AAPCS9575E1ZR" },
  { carrier: "XB", transportId: "27AAGCB3904P2ZC" },
  { carrier: "DTDC", transportId: "88AAACD8017H1ZX" },
  { carrier: "Bluedart", transportId: "27AAACB044L1ZS" },
  { carrier: "DP World", transportId: "88AADCD1983D1ZS" },
  { carrier: "Movin", transportId: "88AAFCI7460Q1ZW" },
  { carrier: "ECOM", transportId: "03AADCE1344F1ZA" },
  { carrier: "Ekart LTL", transportId: "07AADCI8374D2ZH" },
  { carrier: "TCI Express", transportId: "06AADCT0663J4Z9" },
]

export function TransporterInfoModal({ isOpen, onCloseAction }: TransporterInfoModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onCloseAction}>
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              duration: 0.4,
            }}
            className="relative z-50"
          >
             <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-auto p-0 gap-0 bg-white rounded-lg shadow-2xl border-0 overflow-hidden z-50">
              <DialogHeader className="bg-[#1e3a8a] text-white p-3 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-base font-semibold text-white">Transporter Info</DialogTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onCloseAction}
                    className="h-8 w-8 text-white hover:bg-white/20 cursor-pointer rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="p-3">
                <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200 w-1/3">
                          Carrier
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 w-2/3">Transport ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {transporterData.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-2 py-1.5 text-xs text-gray-700 border-r border-gray-200 font-medium">
                            {item.carrier}
                          </td>
                          <td className="px-2 py-1.5 text-xs text-gray-700 font-mono tracking-wide">
                            {item.transportId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </DialogContent>
          </motion.div>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
