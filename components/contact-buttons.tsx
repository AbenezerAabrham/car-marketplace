export default function ContactButtons({ phone, listingTitle }: { phone: string; listingTitle: string }) {
  const message = encodeURIComponent(`Hi, I'm interested in your listing: ${listingTitle}`)
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      <a 
        href={`https://wa.me/${cleanPhone}?text=${message}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-emerald-500/10 active:scale-98 transition text-sm text-center"
      >
        <span>💬</span> WhatsApp
      </a>
      
      <a 
        href={`https://t.me/+${cleanPhone}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-sky-500/10 active:scale-98 transition text-sm text-center"
      >
        <span>✈️</span> Telegram
      </a>
    </div>
  )
}
