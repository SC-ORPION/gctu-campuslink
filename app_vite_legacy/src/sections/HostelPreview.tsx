import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const hostels = [
  {
    name: 'Kofi Annan Hall',
    image: '/images/hostel-kofi-annan.jpg',
    occupancy: 78,
    gender: 'Mixed',
    price: '3,200',
    rooms: 240,
    available: 22,
  },
  {
    name: 'Kwame Nkrumah Hostel',
    image: '/images/hostel-kwame-nkrumah.jpg',
    occupancy: 92,
    gender: 'Male',
    price: '2,800',
    rooms: 180,
    available: 8,
  },
  {
    name: 'Leta Hands Residence',
    image: '/images/hostel-leta-hands.jpg',
    occupancy: 45,
    gender: 'Female',
    price: '3,500',
    rooms: 200,
    available: 55,
  },
]

export default function HostelPreview() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section id="hostels" ref={ref} className="bg-navy-900 py-20 md:py-28">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-12"
        >
          <h2
            className="text-white font-bold tracking-[-0.02em]"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 3.5rem)' }}
          >
            Campus Residences
          </h2>
          <p className="mt-2 text-slate-400 text-base md:text-lg">
            Seven hostels. One simple allocation process.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hostels.map((hostel, i) => (
            <motion.div
              key={hostel.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                ease: 'easeOut',
                delay: i * 0.12,
              }}
              className="group bg-navy-800 rounded-lg overflow-hidden hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30 transition-all duration-250"
            >
              {/* Image */}
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={hostel.image}
                  alt={hostel.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Badges */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium tracking-wide uppercase px-2.5 py-1 rounded ${
                      hostel.occupancy > 85
                        ? 'bg-rose-500/15 text-rose-500'
                        : hostel.occupancy > 60
                        ? 'bg-amber-500/15 text-amber-500'
                        : 'bg-emerald-500/15 text-emerald-500'
                    }`}
                  >
                    {hostel.occupancy}% Full
                  </span>
                  <span className="text-xs font-medium tracking-wide uppercase px-2.5 py-1 rounded bg-blue-600/15 text-blue-400">
                    {hostel.gender}
                  </span>
                </div>

                {/* Name */}
                <h3 className="mt-3 text-white font-semibold text-lg leading-tight">
                  {hostel.name}
                </h3>

                {/* Details */}
                <p className="mt-1.5 text-slate-400 text-sm">
                  ₵{hostel.price} / academic year · {hostel.rooms} rooms
                </p>

                {/* Availability Bar */}
                <div className="mt-3 h-1 bg-navy-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${hostel.available}%` }}
                  />
                </div>

                {/* CTA */}
                <a
                  href="#"
                  className="inline-flex items-center gap-1.5 mt-4 text-sm text-blue-400 hover:text-white transition-colors"
                >
                  View Details
                  <ArrowRight size={14} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
