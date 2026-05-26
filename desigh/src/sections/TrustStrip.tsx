import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Building2, Shield, BadgeCheck, Clock } from 'lucide-react'

const items = [
  {
    icon: Building2,
    title: 'Official GCTU Platform',
    caption: 'Directly integrated with university systems',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    caption: 'SSL-encrypted transaction processing',
  },
  {
    icon: BadgeCheck,
    title: 'Verified Allocations',
    caption: 'Every room assignment is authenticated',
  },
  {
    icon: Clock,
    title: 'Real-Time Availability',
    caption: 'Live room counts across all hostels',
  },
]

export default function TrustStrip() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.8 })

  return (
    <section ref={ref} className="bg-navy-900 py-10 md:py-12">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <item.icon size={24} className="text-blue-400 mb-3" />
              <h3 className="text-white font-semibold text-base md:text-lg leading-tight">
                {item.title}
              </h3>
              <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
                {item.caption}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
