"use client"

import type React from "react"

import { useState } from "react"
import { Eye, EyeOff, Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import DashboardWelcome from "@/components/DashboardWelcome"
import axios from "axios"
import { toast } from "react-toastify"

export default function() {
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState(false)

  const passwordsMatch = newPassword === confirmPassword
  const isFormValid = password && newPassword && confirmPassword && passwordsMatch
 
  const passwordValidation = {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecialChar: /[@$!%*?&#]/.test(newPassword),
  };

  const allValid =
    passwordValidation.minLength &&
    passwordValidation.hasUppercase &&
    passwordValidation.hasNumber &&
    passwordValidation.hasSpecialChar;

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field],
    })
  }

  if(newPassword.length===0){
    touched && setTouched(false)
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() 
    if (!allValid) {
        toast.error("Please fix the password requirements before submitting.");
        return;
    }
    setLoading(true)
    try{
        const response = await axios.post('/api/auth/change-password', {
            currentPassword:password,
            newPassword,
            confirmPassword
        });
        toast.success(response.data.message || "Password changed successfully!");
        setPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTouched(false);
    }catch(error: any){
        const message = error.response?.data?.message || "Something went wrong. Please try again.";
        toast.error(message);
    }finally{
        setLoading(false); 
    }
  }

  return (
    <>
        <div className="">
            <DashboardWelcome message="You Can Change Your Password here" name="" />
        </div>
        <Card className="flex justify-center mt-12 w-full max-w-md mx-auto dark:bg-gradient-to-br dark:from-gray-800 dark:via-gray-900 dark:to-black text-gray-900 dark:text-gray-200 shadow-md dark:shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            <CardHeader className="space-y-1 text-center">
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <div className="relative">
                        <Input
                            id="current-password"
                            name="password"
                            type={showPassword.current ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your current password"
                            className="pr-10"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => togglePasswordVisibility("current")}
                            >
                            {showPassword.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">{showPassword.current ? "Hide password" : "Show password"}</span>
                        </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <div className="relative">
                        <Input
                            id="new-password"
                            name="new-password"
                            type={showPassword.new ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => {setNewPassword(e.target.value); setTouched(true)}}
                            placeholder="Enter your new password"
                            className="pr-10"
                            />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => togglePasswordVisibility("new")}
                        >
                            {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">{showPassword.new ? "Hide password" : "Show password"}</span>
                        </Button>
                        </div>
                        {touched && (
                            <ul className="text-sm mt-2 space-y-1">
                            <li className={passwordValidation.minLength ? "text-green-600" : "text-red-600"}>
                            {passwordValidation.minLength ? "✔" : "✘"} At least 8 characters
                            </li>
                            <li className={passwordValidation.hasUppercase ? "text-green-600" : "text-red-600"}>
                            {passwordValidation.hasUppercase ? "✔" : "✘"} At least one uppercase letter
                            </li>
                            <li className={passwordValidation.hasNumber ? "text-green-600" : "text-red-600"}>
                            {passwordValidation.hasNumber ? "✔" : "✘"} At least one number
                            </li>
                            <li className={passwordValidation.hasSpecialChar ? "text-green-600" : "text-red-600"}>
                            {passwordValidation.hasSpecialChar ? "✔" : "✘"} At least one special character
                            </li>
                        </ul>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        {confirmPassword && (
                            <div className="flex items-center text-sm">
                            {passwordsMatch ? (
                                <div className="flex items-center text-green-600">
                                <Check className="h-4 w-4 mr-1" />
                                <span>Passwords match</span>
                                </div>
                            ) : (
                                <div className="flex items-center text-red-600">
                                <X className="h-4 w-4 mr-1" />
                                <span>Passwords don't match</span>
                                </div>
                            )}
                            </div>
                        )}
                        </div>
                        <div className="relative">
                        <Input
                            id="confirm-password"
                            name="confirm-password"
                            type={showPassword.confirm ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your new password"
                            className={`pr-10 ${
                                confirmPassword
                                ? passwordsMatch
                                ? "border-green-500 focus-visible:ring-green-500"
                                : "border-red-500 focus-visible:ring-red-500"
                                : ""
                            }`}
                            />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => togglePasswordVisibility("confirm")}
                            >
                            {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">{showPassword.confirm ? "Hide password" : "Show password"}</span>
                        </Button>
                        </div>
                    </div>
                    <CardFooter className="curson-pointer">
                        <Button type="submit" className="w-full cursor-pointer" disabled={!isFormValid || loading}>
                            {loading ? "Changing..." : "Change Password"}
                        </Button>
                    </CardFooter>
                </form>
            </CardContent>
        </Card>
    </>
  )
}
