"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import {
  Globe,
  HelpCircle,
  Home,
  Info,
  LayoutDashboard,
  Save,
  ShieldCheck,
  Smartphone,
  Truck,
  Zap,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface CourierPriority {
  courier: string;
  isActive: boolean;
  dashboardPriority: number;
  apiPriority: number;
}

const COURIER_META: Record<string, { logo: string; color: string; bg: string }> =
  {
    shadowfax: {
      logo: "/shadowfax.png",
      color: "text-blue-600",
      bg: "bg-blue-50/50",
    },
    "ecom express": {
      logo: "/ecom-express.png",
      color: "text-blue-600",
      bg: "bg-blue-50/50",
    },
    xpressbees: {
      logo: "/xpressbees.png",
      color: "text-orange-600",
      bg: "bg-orange-50/50",
    },
    delhivery: {
      logo: "/delhivery.png",
      color: "text-red-600",
      bg: "bg-red-50/50",
    },
  };

function getCourierLogo(name: string) {
  const key = name.toLowerCase();

  for (const [k, v] of Object.entries(COURIER_META)) {
    if (key.includes(k)) return v.logo;
  }

  return "";
}

function getCourierBg(name: string) {
  const key = name.toLowerCase();

  for (const [k, v] of Object.entries(COURIER_META)) {
    if (key.includes(k)) return v.bg;
  }

  return "bg-gray-50/50";
}

export default function CourierPriorityPage() {
  const [couriers, setCouriers] = useState<CourierPriority[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPriorities();
  }, []);

  const fetchPriorities = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/user/courier-priority");
      const data = (res.data.couriers || []).map((c: any) => ({
        ...c,
        isActive: c.isActive ?? true,
      }));
      setCouriers(data);
    } catch (err) {
      console.error("Failed to fetch courier priorities:", err);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (
    courierName: string,
    field: keyof CourierPriority,
    value: any
  ) => {
    setCouriers((prev) =>
      prev.map((c) =>
        c.courier === courierName ? { ...c, [field]: value } : c
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.post("/api/user/courier-priority", { couriers });
      toast.success("Settings permanently updated");
    } catch (err) {
      console.error("Failed to save courier priorities:", err);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-black uppercase tracking-widest text-[#0a0c37]">
            Loading Priorities...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] p-4 md:p-10">
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-4">
          <nav className="flex items-center gap-2 text-[11px] font-black uppercase tracking-tighter text-gray-400">
            <Link
              href="/user/dashboard"
              className="flex cursor-pointer items-center gap-1 transition-colors hover:text-indigo-600"
            >
              <Home className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <span>
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
            <span className="text-indigo-600">Smart Priority Settings</span>
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0a0c37] text-white shadow-2xl shadow-indigo-200">
              <Truck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-[#0a0c37] md:text-4xl">
                Priority Selection
              </h1>
              <p className="text-sm font-bold text-gray-400">
                Manage how couriers are automatically assigned across platforms.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="group relative h-14 cursor-pointer overflow-hidden rounded-2xl bg-indigo-600 px-10 text-white shadow-2xl shadow-indigo-100 transition-all hover:scale-105 hover:bg-black active:scale-95"
        >
          {saving ? (
            <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
              <Save className="h-5 w-5" />
              Update Configuration
            </span>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {couriers.map((item) => {
          const logo = getCourierLogo(item.courier);
          const courierColorBg = getCourierBg(item.courier);

          return (
            <Card
              key={item.courier}
              className={cn(
                "group relative cursor-default overflow-hidden rounded-[2.5rem] border-2 border-transparent bg-white shadow-xl transition-all duration-500 hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-100/30",
                !item.isActive && "opacity-60"
              )}
            >
              <div
                className={cn(
                  "h-2 w-full",
                  !item.isActive
                    ? "bg-gray-200"
                    : "bg-linear-to-r from-indigo-600 to-sky-400"
                )}
              />

              <div className="p-8">
                <div className="mb-10 flex items-start justify-between">
                  <div className="space-y-4">
                    <div
                      className={cn(
                        "relative flex h-25 w-32 items-center justify-center rounded-3xl transition-all group-hover:scale-110"
                      )}
                    >
                      {logo ? (
                        <Image
                          src={logo}
                          alt={item.courier}
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <Truck className="h-8 w-8 text-gray-300" />
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-black leading-tight text-[#0a0c37]">
                        {item.courier}
                      </h3>
                      <p className="text-[10px] font-black uppercase tracking-tighter text-gray-400">
                        Available: Surface &amp; Express
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="relative cursor-pointer">
                      <Switch
                        checked={item.isActive}
                        onCheckedChange={(checked) =>
                          handleUpdate(item.courier, "isActive", checked)
                        }
                        className="cursor-pointer scale-125 shadow-lg data-[state=checked]:bg-indigo-600"
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-black uppercase tracking-widest transition-all",
                        item.isActive ? "text-indigo-600" : "text-gray-400"
                      )}
                    >
                      {item.isActive ? "Online" : "Paused"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="group/track relative overflow-hidden rounded-3xl bg-slate-50/80 p-5 shadow-inner ring-1 ring-slate-100 transition-all hover:bg-indigo-50/50 hover:ring-indigo-100">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm">
                          <LayoutDashboard className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#0a0c37]">
                            Internal Orders
                          </h4>
                          <p className="text-[9px] font-bold text-gray-400">
                            Applied on Shipmozo Portal
                          </p>
                        </div>
                      </div>

                      <div
                        className="group relative cursor-help"
                        title="Orders booked manually via your dashboard will prioritize this courier based on this rank."
                      >
                        <HelpCircle className="h-5 w-5 text-indigo-400 transition-colors hover:text-indigo-600" />
                      </div>
                    </div>

                    <div className="relative">
                      <Select
                        value={String(item.dashboardPriority)}
                        onValueChange={(val) =>
                          handleUpdate(
                            item.courier,
                            "dashboardPriority",
                            parseInt(val)
                          )
                        }
                      >
                        <SelectTrigger className="h-10 cursor-pointer rounded-xl border-0 bg-white px-4 text-xs font-black text-indigo-900 shadow-sm ring-1 ring-indigo-50 transition-all hover:ring-indigo-200">
                          <SelectValue placeholder="Priority Ranking" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-indigo-50 shadow-2xl">
                          {[0, 1, 2, 3, 4, 5].map((rank) => (
                            <SelectItem
                              key={rank}
                              value={String(rank)}
                              className="cursor-pointer p-3 text-xs font-bold focus:bg-indigo-50"
                            >
                              {rank === 0 ? "Standard Efficiency" : `Top Priority ${rank}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="mt-2 flex items-center gap-1.5 px-1">
                        <ShieldCheck className="h-3 w-3 text-emerald-500" />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">
                          Active Safeguard
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="group/track relative overflow-hidden rounded-3xl bg-slate-50/80 p-5 shadow-inner ring-1 ring-slate-100 transition-all hover:bg-sky-50/50 hover:ring-sky-100">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sky-600 shadow-sm">
                          <Globe className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#0a0c37]">
                            External Channels
                          </h4>
                          <p className="text-[9px] font-bold text-gray-400">
                            Shopify, API, Webhooks
                          </p>
                        </div>
                      </div>

                      <div
                        className="group relative cursor-help"
                        title="Orders coming from outside integrations use this rank for smart auto-assignment."
                      >
                        <HelpCircle className="h-5 w-5 text-sky-400 transition-colors hover:text-sky-600" />
                      </div>
                    </div>

                    <div className="relative">
                      <Select
                        value={String(item.apiPriority)}
                        onValueChange={(val) =>
                          handleUpdate(item.courier, "apiPriority", parseInt(val))
                        }
                      >
                        <SelectTrigger className="h-10 cursor-pointer rounded-xl border-0 bg-white px-4 text-xs font-black text-sky-900 shadow-sm ring-1 ring-sky-50 transition-all hover:ring-sky-200">
                          <SelectValue placeholder="Priority Ranking" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-sky-50 shadow-2xl">
                          {[0, 1, 2, 3, 4, 5].map((rank) => (
                            <SelectItem
                              key={rank}
                              value={String(rank)}
                              className="cursor-pointer p-3 text-xs font-bold focus:bg-sky-50"
                            >
                              {rank === 0 ? "Standard Efficiency" : `Top Priority ${rank}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="mt-2 flex items-center gap-1.5 px-1">
                        <Zap className="h-3 w-3 text-amber-500" />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">
                          Auto-Assign Sync
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="group flex items-center gap-6 rounded-[2.5rem] border-2 border-dashed border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-indigo-600 hover:bg-indigo-50/10">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-100 transition-transform group-hover:rotate-12">
            <Info className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-black text-[#0a0c37]">Rank 1 Rule</h4>
            <p className="text-xs font-bold leading-relaxed text-gray-400">
              The lower the rank, the higher it goes.{" "}
              <span className="text-indigo-600 underline">Priority 1</span>{" "}
              couriers are tested first for every shipment. If they are not
              serviceable, the system moves to Rank 2, and so on.
            </p>
          </div>
        </div>

        <div className="group flex items-center gap-6 rounded-[2.5rem] border-2 border-dashed border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-amber-600 hover:bg-amber-50/10">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-amber-500 text-white shadow-xl shadow-amber-100 transition-transform group-hover:-rotate-12">
            <Zap className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-black text-[#0a0c37]">
              Real-time Sync
            </h4>
            <p className="text-xs font-bold leading-relaxed text-gray-400">
              Configurations saved here are pushed globally. Your{" "}
              <span className="text-amber-600 underline">Shopify Store</span> or
              Custom ERP will immediately start following the new courier
              hierarchy once you click save.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}