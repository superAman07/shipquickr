"use client"

import { useState } from "react";
import { SwitchIcon } from "./ui/SwitchIcon";
import axios from "axios";
import { toast } from "react-toastify";

export function StatusToggle({ userId, initialStatus }: { userId: string; initialStatus: boolean }) {
  const [checked, setChecked] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (newVal: boolean) => {
    const updatedStatus = !checked;
    setChecked(updatedStatus);  
    setLoading(true);

    try {
      await axios.post("/api/admin/update-user-status", {
        userId,
        status: updatedStatus,
      });
      toast.success("Status updated successfully");
    } catch (error:any) {
      toast.error("Failed to update status:", error);
      setChecked(!updatedStatus); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <SwitchIcon
      checked={checked}
      onCheckedChange={handleToggle}
      className="h-6 w-10"
      disabled={loading}
    />
  );
}
