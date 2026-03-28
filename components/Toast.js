'use client'
import { useState, useEffect } from 'react'

let toastTimeout = null
let setGlobalToast = null

export function showToast(message, type = 'success') {
  if (setGlobalToast) {
    setGlobalToast({ message, type })
    clearTimeout(toastTimeout)
    toastTimeout = setTimeout(() => setGlobalToast(null), 3000)
  }
}

export default function Toast() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    setGlobalToast = setToast
    return () => { setGlobalToast = null }
  }, [])

  if (!toast) return null

  const colors = {
    success: 'bg-brand-green',
    error: 'bg-brand-red',
    info: 'bg-brand-teal',
    whatsapp: 'bg-[#25d366]',
  }

  return (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 ${colors[toast.type] || colors.success} text-white px-6 py-3.5 rounded-xl font-bold text-sm z-[300] shadow-lg animate-fade-in whitespace-nowrap`}>
      {toast.message}
    </div>
  )
}
