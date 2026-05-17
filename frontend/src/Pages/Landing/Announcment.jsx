import { useState, useEffect } from 'react'

const Announcement = () => {
  const announcements = [
    "📢 Welcome to Kebele Vital System! Digital services now available 24/7",
    "✨ New: Express certificate processing now available! Get your documents in 24 hours",
    "🎉 Birth certificates can now be applied online from anywhere in the world"
  ]
  
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % announcements.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [announcements.length])

  return (
    <div className="bg-yellow-100 py-2 text-center fixed top-16 left-0 right-0 z-40">
      <p className="text-sm text-yellow-800 font-medium">{announcements[index]}</p>
    </div>
  )
}

export default Announcement