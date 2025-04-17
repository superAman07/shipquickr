import React from 'react';
import { Users } from 'lucide-react'; 
import DashboardWelcome from '@/components/DashboardWelcome';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import DashboardHorizontalNavAdmin from '@/components/DashboardHorizontalNav-admin';
import { prisma } from '@/lib/prisma';

export default async function Dashboard() {
  const cookieStore = await cookies()
  const token = cookieStore.get("adminToken")?.value;
  let firstName = "Admin";
  if(token){
    try{
      const decoded = jwtDecode<{exp: number} & TokenDetailsType>(token);
      firstName = decoded.firstName;
    }catch{}
  }
  const totalUsers = await prisma.user.count({
    where: {
      role: "user"
    }
  })
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const usersInLast30Days = await prisma.user.count({
    where: {
      role:"user",
      createdAt: {gte:thirtyDaysAgo}
    }
  })

  const shipmentCards = [
    {
      title: "Total Users",
      value: `${totalUsers}`,
      info: "All Time",
      color: "bg-blue-500",
      icon: <Users className="h-6 w-6 text-white" />,
    },
    {
      title: "New Users (30 Days)",
      value: `${usersInLast30Days}`,
      info: `Since ${thirtyDaysAgo.toLocaleDateString()}`,
      color: "bg-purple-600",
      icon: <Users className="h-6 w-6 text-white" />,
    },
  ]; 
  
  return (
    <main className=" px-4 md:px-8 pb-8">
      <DashboardWelcome name={firstName}/>
      <DashboardHorizontalNavAdmin />
      <div className="max-w-7xl mx-auto"> 
        <div className="grid grid-cols-1 md:grid-cols-2 pt-4 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          {shipmentCards.map((card, index) => (
            <ShipmentCard key={index} {...card} />
          ))}
        </div>  
      </div>
    </main>
  );
}
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


interface TokenDetailsType {
  userId: string;
  firstName: string;
  email: string;
  role: string;
}