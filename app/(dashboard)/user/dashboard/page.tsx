import React from 'react';
import { Package, Truck, Info, Calculator, TrendingUp, AlertCircle } from 'lucide-react'; 
import DashboardWelcome from '@/components/DashboardWelcome';
import DashboardHorizontalNavUser from '@/components/DashboardHorizontalNav-user';
import { cookies } from 'next/headers'; 
import { jwtDecode } from 'jwt-decode';   
import NewsSection from '@/components/NewsSectionUser';

interface ShipmentCardProps {
  title: string;
  value: string;
  info: string;
  color: string;
  icon: React.ReactNode;
}

function ShipmentCard({ title, value, info, color, icon }: ShipmentCardProps) {
  return (
    <div className={`${color} rounded-lg p-6 text-white transition-transform hover:scale-105 duration-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm opacity-90">{title}</p>
          <h3 className="text-3xl font-bold mt-2">{value}</h3>
        </div>
        <div className="p-2 bg-white/20 rounded-lg">
          {icon}
        </div>
      </div>
      <p className="text-sm mt-4 opacity-90">{info}</p>
    </div>
  );
}

interface StatusCardProps {
  count: string;
  percentage: string;
  status: string;
  color: string;
}
const getProgressBarColor = (status: string): string => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('unshipped')) return 'bg-slate-400 dark:bg-slate-500';
  if (lowerStatus.includes('pickup scheduled')) return 'bg-rose-500';
  if (lowerStatus.includes('in-transit') && !lowerStatus.includes('rto')) return 'bg-amber-500';
  if (lowerStatus.includes('delivered') && !lowerStatus.includes('rto')) return 'bg-green-500';
  if (lowerStatus.includes('un-delivered')) return 'bg-sky-500';
  if (lowerStatus.includes('ofd')) return 'bg-red-600';
  if (lowerStatus.includes('rto in-transit')) return 'bg-orange-500';
  if (lowerStatus.includes('rto delivered')) return 'bg-lime-500';
  if (lowerStatus.includes('lost')) return 'bg-neutral-500';
  return 'bg-indigo-500';  
};

function StatusCard({ count, percentage, status, color }: StatusCardProps) {
  const progressBarColor = getProgressBarColor(status);
  const displayCount = `${count}(${percentage})`;  

  return (
    <div className={`${color} rounded-lg p-5 flex flex-col items-center text-center transition-all hover:shadow-md h-full`}>
      <div className="mb-1.5">
        <h4 className="text-lg font-bold text-gray-800 dark:text-white">{displayCount}</h4>
      </div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 flex-grow capitalize">{status}</p>
      
      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-auto">
        <div
          className={`${progressBarColor} h-2 rounded-full`}
          style={{ width: percentage }}  
        ></div>
      </div>
    </div>
  );
}
interface TokenDetailsType {
  userId: string;
  firstName: string;
  email: string;
  role: string;
}
export default async function Dashboard() { 
  const cookieStore = await cookies();
  const token = cookieStore.get('userToken')?.value;
  let firstName = 'User';

  if (token) {
    try {
      const decoded = jwtDecode<TokenDetailsType>(token);
      firstName = decoded.firstName;
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
  }
  const shipmentCards = [
    { title: "Total Shipment", value: "1", info: "Last 30 days", color: "bg-[linear-gradient(to_right,#7f12e1,#3e0ead)] rounded-xl p-4 shadow-lg", icon: <Package className="h-6 w-6 text-white" /> },
    { title: "Today Shipment", value: "0", info: "20-12-2024", color: "bg-[linear-gradient(to_right,#3b82f6,#1e40af)] rounded-xl p-4 shadow-lg", icon: <Truck className="h-6 w-6 text-white" /> },
    { title: "Yesterday Shipment", value: "0", info: "19-12-2024", color: "bg-[linear-gradient(to_right,#6366f1,#312e81)] rounded-xl p-4 shadow-lg", icon: <Info className="h-6 w-6 text-white" /> },
    { title: "Total Load", value: "0", info: "In Kg", color: "bg-[linear-gradient(to_right,#f97316,#c2410c)] rounded-xl p-4 shadow-lg", icon: <TrendingUp className="h-6 w-6 text-white" /> },
    { title: "Avg. Shipment Cost", value: "0", info: "Know More", color: "bg-[linear-gradient(to_right,#22c55e,#15803d)] rounded-xl p-4 shadow-lg", icon: <Calculator className="h-6 w-6 text-white" /> },
  ];

  const statusCards = [
    { count: "1", percentage: "100%", status: "Unshipped", color: "bg-gray-100 dark:bg-gray-800" },
    { count: "0", percentage: "0%", status: "Pickup Scheduled", color: "bg-red-100 dark:bg-red-900/20" },
    { count: "0", percentage: "0%", status: "In-Transit", color: "bg-yellow-100 dark:bg-yellow-900/20" },
    { count: "0", percentage: "0%", status: "Delivered", color: "bg-green-100 dark:bg-green-900/20" },
    { count: "0", percentage: "0%", status: "Un-Delivered", color: "bg-blue-100 dark:bg-blue-900/20" },
    { count: "0", percentage: "0%", status: "OFD", color: "bg-purple-100 dark:bg-purple-900/20" },
    { count: "0", percentage: "0%", status: "RTO In-Transit", color: "bg-white dark:bg-gray-800" },
    { count: "0", percentage: "0%", status: "RTO Delivered", color: "bg-white dark:bg-gray-800" },
    { count: "0", percentage: "0%", status: "LOST Shipments", color: "bg-white dark:bg-gray-800" },
  ];
  return (
    <main className=" px-4 md:px-8 pb-8">
      <DashboardWelcome name={firstName}/>
      <DashboardHorizontalNavUser />
      <div className="max-w-7xl mx-auto"> 
        <div className="grid grid-cols-1 md:grid-cols-2 pt-4 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          {shipmentCards.map((card, index) => (
            <ShipmentCard key={index} {...card} />
          ))}
        </div> 
        <div className="flex flex-col lg:flex-row gap-6 mb-8"> 
          <div className="lg:w-2/3 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"> 
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#495057] dark:text-gray-100">
                Shipment Details
              </h2>
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                Last 30 days
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {statusCards.map((card, index) => (
                <StatusCard key={index} {...card} />
              ))}
            </div>
          </div>
 
          <div className="lg:w-1/3 bg-white h-[65dvh] overflow-hidden dark:bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col">  
            <NewsSection />
          </div>
        </div>
      </div>
    </main>
  );
}