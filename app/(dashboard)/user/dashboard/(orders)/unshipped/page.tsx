'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UnshippedRedirect() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/user/dashboard/bulk?tab=unshipped')
    }, [router])
    return null
}