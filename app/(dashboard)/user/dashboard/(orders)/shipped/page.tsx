'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ShippedRedirect() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/user/dashboard/bulk?tab=shipped')
    }, [router])
    return null
}