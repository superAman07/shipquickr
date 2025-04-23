import { CreditCard, Banknote, Building2 } from "lucide-react"
import Link from "next/link"

export default function CodPlans() {
  return (
    <div className="w-full bg-white dark:bg-gray-900 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Cod Plan</h1>
        <div className="flex items-center text-sm">
          <Link href={'/user/dashboard'} className="text-gray-600 dark:text-gray-400">Dashboard</Link>
          <span className="mx-2 text-gray-400">&gt;</span>
          <span className="text-blue-600 dark:text-blue-400">COD Plan</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-400 mb-2">
            Introducing COD - Grow Faster with Daily COD Remittance
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Activate COD today by selecting your preferred plan
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Plan 1 */}
          <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-6 flex flex-col items-center">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              20 Payouts/Months
            </div>
            <div className="bg-white dark:bg-gray-600 rounded-full p-4 mb-4 w-20 h-20 flex items-center justify-center">
              <div className="relative">
                <Banknote className="w-10 h-10 text-blue-500" />
                <div className="absolute -top-2 -right-2 text-blue-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                </div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400 mb-2">Delivered + 1 Day</h3>
            <p className="text-center text-gray-700 dark:text-gray-300 mb-1">At Minimal Transaction Charge</p>
            <p className="text-center font-bold text-gray-800 dark:text-white mb-1">2% Of COD amount</p>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">(Inclusive GST)</p>
            <button className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-8 rounded-md transition-colors">
              Activate
            </button>
          </div>

          {/* Plan 2 */}
          <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-6 flex flex-col items-center">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              20 Payouts/Months
            </div>
            <div className="bg-white dark:bg-gray-600 rounded-full p-4 mb-4 w-20 h-20 flex items-center justify-center">
              <CreditCard className="w-10 h-10 text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400 mb-2">Delivered + 2 Days</h3>
            <p className="text-center text-gray-700 dark:text-gray-300 mb-1">At Minimal Transaction Charge</p>
            <p className="text-center font-bold text-gray-800 dark:text-white mb-1">1.75% Of COD amount</p>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">(Inclusive GST)</p>
            <button className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-8 rounded-md transition-colors">
              Activate
            </button>
          </div>

          {/* Plan 3 */}
          <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-6 flex flex-col items-center">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              20 Payouts/Months
            </div>
            <div className="bg-white dark:bg-gray-600 rounded-full p-4 mb-4 w-20 h-20 flex items-center justify-center">
              <div className="relative">
                <Banknote className="w-10 h-10 text-green-500" />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute -top-2 -right-2 text-green-500"
                >
                  <path d="M22 12c0 6-4.39 10-9.806 10C7.792 22 4.24 19.665 3 16" />
                  <path d="M2 12C2 6 6.39 2 11.806 2 16.209 2 19.76 4.335 21 8" />
                  <path d="M7 17l-4-1-1 4" />
                  <path d="M17 7l4 1 1-4" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400 mb-2">Delivered + 3 Days</h3>
            <p className="text-center text-gray-700 dark:text-gray-300 mb-1">At Minimal Transaction Charge</p>
            <p className="text-center font-bold text-gray-800 dark:text-white mb-1">1% Of COD amount</p>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">(Inclusive GST)</p>
            <button className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-8 rounded-md transition-colors">
              Activate
            </button>
          </div>

          {/* Plan 4 */}
          <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-6 flex flex-col items-center">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              20 Payouts/Months
            </div>
            <div className="bg-white dark:bg-gray-600 rounded-full p-4 mb-4 w-20 h-20 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400 mb-2">Delivered + 4 Days</h3>
            <p className="text-center text-gray-700 dark:text-gray-300 mb-1">At Minimal Transaction Charge</p>
            <p className="text-center font-bold text-gray-800 dark:text-white mb-1">0.75% Of COD amount</p>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">(Inclusive GST)</p>
            <button className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-8 rounded-md transition-colors">
              Activate
            </button>
          </div>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-xl md:text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">
            Why should you Activate COD?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-4xl mx-auto">
            Get guaranteed remittance in just 2* days from the shipment delivered date. Grow your business by removing
            cash flow restrictions. Get full control over your remittance cycle and take better decisions for your
            business.
          </p>
        </div>
      </div>
    </div>
  )
}
