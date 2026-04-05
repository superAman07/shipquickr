'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CancelledRedirect() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/user/dashboard/bulk?tab=cancelled')
    }, [router])
    return null
}