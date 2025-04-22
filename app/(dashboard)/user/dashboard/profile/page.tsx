'use client'
import Loading from "@/components/loading";
import { useEffect, useState } from "react";
import axios from "axios";
import VerifiedUserProfile from "@/components/profile/VerifiedUserProfile";
import UnverifiedUserProfile  from "@/components/profile/UnverifiedUserProfile";

export default function UserProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/user/profile")
      .then(res => setProfile(res.data.profile))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (!profile) return <div>Profile not found</div>;
 
  if (profile.kycStatus?.toLowerCase() === "approved") {
    return <VerifiedUserProfile  />;
  } else {
    return <UnverifiedUserProfile profile={profile} />;
  }
}