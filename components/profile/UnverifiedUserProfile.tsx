"use client";
import Link from "next/link";
import { Building2, CreditCard, FileText, Lock, Mail, AlertTriangle, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function UnverifiedUserProfile({ profile }: { profile: any }) {
  const { firstName, lastName, email, kycStatus, kycDetail } = profile || {};

  // Helper for initials
  const getInitials = () =>
    `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

  // KYC status color
  const getStatusColor = () => {
    switch (kycStatus?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Profile Summary</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center pt-4">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold mb-4">
                {getInitials()}
              </div>
              <h2 className="text-xl font-semibold">
                {firstName} {lastName}
              </h2>
              <div className="flex items-center mt-1 text-muted-foreground">
                <Mail className="h-4 w-4 mr-1" />
                <span>{email}</span>
              </div>
              <div className="w-full mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">KYC Status</span>
                  <Badge variant="outline" className={getStatusColor()}>
                    {kycStatus?.charAt(0).toUpperCase() + kycStatus?.slice(1)}
                  </Badge>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      kycStatus?.toLowerCase() === "approved"
                        ? "bg-green-500 w-full"
                        : kycStatus?.toLowerCase() === "pending"
                        ? "bg-yellow-500 w-3/5"
                        : "bg-red-500 w-1/5"
                    }`}
                  ></div>
                </div>
              </div>
              <div className="mt-6 w-full">
                <Button asChild className="w-full">
                  <Link href="/user/dashboard/kyc">
                    {kycStatus?.toLowerCase() === "rejected"
                      ? "Retry Verification"
                      : "Complete Verification"}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Blurred Details with Overlay */}
        <div className="lg:col-span-2 relative">
          {/* Blurred Content */}
          <div className="filter blur-sm brightness-95 pointer-events-none select-none">
            {/* Company Information */}
            <Card className="mb-6">
              <CardHeader className="pb-2 flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-muted-foreground">Company Name: </span>
                    {kycDetail?.companyName || "-"}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Company Type: </span>
                    {kycDetail?.companyType || "-"}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">GST Number: </span>
                    {kycDetail?.gstNumber || "-"}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Billing Address: </span>
                    {kycDetail?.billingAddress || "-"}
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* KYC Details */}
            <Card className="mb-6">
              <CardHeader className="pb-2 flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                <CardTitle>KYC Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-muted-foreground">PAN Card No: </span>
                    {kycDetail?.panCardNo || "-"}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Aadhaar No: </span>
                    {kycDetail?.aadhaarNo || "-"}
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Bank Information */}
            <Card>
              <CardHeader className="pb-2 flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                <CardTitle>Bank Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-muted-foreground">Account Holder: </span>
                    {kycDetail?.accountHolder || "-"}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Bank Name: </span>
                    {kycDetail?.bankName || "-"}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Account No: </span>
                    {kycDetail?.accountNo || "-"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Overlay with CTA */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/80 backdrop-blur-sm dark:bg-background/90 rounded-xl p-8 shadow-lg max-w-md w-full text-center">
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Complete Your KYC to View Details</h3>
              <p className="mb-6 text-muted-foreground">
                Your profile details are hidden until your identity is verified.
              </p>
              {kycStatus?.toLowerCase() === "rejected" && (
                <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400 text-left">
                    Your previous verification attempt was rejected. Please review the requirements and try again.
                  </p>
                </div>
              )}
              <Button asChild size="lg" className="w-full">
                <Link href="/user/dashboard/kyc">
                  <Shield className="mr-2 h-5 w-5" />
                  {kycStatus?.toLowerCase() === "rejected" ? "Retry Verification" : "Verify Now"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}