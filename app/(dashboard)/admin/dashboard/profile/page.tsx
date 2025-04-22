"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/admin/profile")
      .then(res => setProfile(res.data.profile))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!profile) return <div className="p-8 text-center text-red-500">Profile not found.</div>;

  const { firstName, lastName, email, createdAt } = profile;

  return (
    <div className="max-w-xl mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-4">
            <User className="h-10 w-10 text-indigo-600 dark:text-indigo-300" />
          </div>
          <CardTitle className="text-2xl font-bold">{firstName} {lastName}</CardTitle>
          <div className="text-gray-500 dark:text-gray-400">{email}</div>
          <div className="mt-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            Admin
          </div>
        </CardHeader>
        <CardContent className="text-center mt-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Account Created: {createdAt && new Date(createdAt).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}