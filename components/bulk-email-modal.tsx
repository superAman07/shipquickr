"use client"

import React, { useState } from "react"
import axios from "axios"
import { toast } from "react-toastify"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface BulkEmailModalProps {
  isOpen: boolean
  onClose: () => void
  selectedUsers: User[]
  onSuccess?: () => void
}

export function BulkEmailModal({
  isOpen,
  onClose,
  selectedUsers,
  onSuccess,
}: BulkEmailModalProps): React.JSX.Element {
  const [templateType, setTemplateType] = useState<"onboarding" | "inactivity" | "custom">(
    "onboarding",
  )
  const [customSubject, setCustomSubject] = useState("")
  const [customMessage, setCustomMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (selectedUsers.length === 0) {
      toast.error("No users selected")
      return
    }

    let finalSubject = ""
    let finalMessage = ""

    if (templateType === "onboarding") {
      finalSubject = "Start your shipping with ShipQuickr! 🚀"
      finalMessage = `
        <p>Hi {firstName},</p>
        <p>Congratulations on completing your KYC! 🎉</p>
        <p>
          You are now fully verified and ready to scale your business with ShipQuickr.
          Our extensive network of premium courier partners (Delhivery, Shadowfax, XpressBees, Ecom Express)
          is ready to supercharge your logistics.
        </p>
        <div class="btn-container">
          <a href="https://shipquickr.com/dashboard/orders" class="button">Place Your First Order</a>
        </div>
        <p>Need help? Reply to this email and our support team will get you sorted immediately!</p>
      `
    } else if (templateType === "inactivity") {
      finalSubject = "We miss you at ShipQuickr! 📦"
      finalMessage = `
        <p>Hi {firstName},</p>
        <p>
          It's been a few days since your last shipment with us, and we wanted to check if there's anything we can help you with.
        </p>
        <p>
          Remember, maintaining a steady shipping volume helps you secure the best rates!
          Let's get those packages moving.
        </p>
        <div class="btn-container">
          <a href="https://shipquickr.com/dashboard/orders" class="button">Create a New Shipment</a>
        </div>
      `
    } else {
      if (!customSubject || !customMessage) {
        toast.error("Custom subject and message cannot be empty")
        return
      }
      finalSubject = customSubject
      finalMessage = customMessage
    }

    try {
      setIsSending(true)

      const res = await axios.post("/api/admin/bulk-email", {
        userEmails: selectedUsers.map((u) => u.email),
        subject: finalSubject,
        message: finalMessage,
      })

      if (res.data.success) {
        toast.success(res.data.message)
        onSuccess?.()
        onClose()
      } else {
        toast.error(res.data.message || "Failed to send emails")
      }
    } catch (e: any) {
      console.error(e)
      toast.error("An error occurred while dispatching emails.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Send Bulk Email</DialogTitle>
          <p className="text-sm text-muted-foreground pt-2">
            You are about to email <strong>{selectedUsers.length}</strong> selected users.
          </p>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="template" className="text-right">
              Template
            </Label>
            <Select value={templateType} onValueChange={(val: any) => setTemplateType(val)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a template structure" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="onboarding">
                  KYC Done (Start Shipping) - Automatic Style
                </SelectItem>
                <SelectItem value="inactivity">
                  Inactivity Reminder (We Miss You)
                </SelectItem>
                <SelectItem value="custom">Custom Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {templateType === "custom" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">
                  Subject
                </Label>
                <Input
                  id="subject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="col-span-3"
                  placeholder="Subject..."
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <Label htmlFor="message" className="text-right pt-2">
                  Message
                </Label>
                <div className="col-span-3">
                  <Textarea
                    id="message"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="min-h-[150px]"
                    placeholder="Use {firstName} to insert the user's name. Formatting allows full HTML."
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Note: The email will be wrapped in your premium ShipQuickr template automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          {templateType !== "custom" && (
            <div className="bg-muted p-4 rounded-md text-sm">
              <p>
                The chosen system template will generate dynamic personalized emails wrapped in the
                official UI. The users&apos; first names will be automatically injected.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? "Sending out emails..." : "Dispatch Emails Now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}