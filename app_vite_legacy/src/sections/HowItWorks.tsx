import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const steps = [
  {
    number: '01',
    title: 'Register or Login',
    description:
      'Use your student ID. One portal for all users — admins and students alike.',
  },
  {
    number: '02',
    title: 'Choose Your Hostel',
    description:
      'Browse real-time availability, pricing, and room types across all campus hostels.',
  },
  {
    number: '03',
    title: 'Submit Payment',
    description:
      'Secure, instant payment verification integrated with university finance systems.',
  },
  {
    number: '04',
    title: 'Receive Allocation',
    description:
      'Instant room assignment with digital confirmation and roommate details.',
  },
]

export default function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section id="about" ref={ref} className="bg-navy-950 py-20 md:py-28">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center mb-14 md:mb-20"
        >
          <h2
            className="text-white font-bold tracking-[-0.02em]"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 3.5rem)' }}
          >
            Four Steps to Your Room
          </h2>
          <p className="mt-3 text-slate-400 text-base md:text-lg">
            From login to allocation in under 10 minutes.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting Line - Desktop */}
          <div className="hidden md:block absolute top-[19px] left-[12.5%] right-[12.5%] h-[2px] bg-navy-800">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              className="h-full bg-blue-600 origin-left"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6 relative">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.5,
                  ease: 'easeOut',
                  delay: 0.3 + i * 0.15,
                }}
                className="flex flex-col items-center text-center"
              >
                {/* Node */}
                <div className="w-10 h-10 rounded-full border-2 border-navy-800 bg-navy-950 flex items-center justify-center relative z-10">
                  <span className="font-mono text-sm text-amber-500 font-medium">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <h3 className="mt-5 text-white font-semibold text-lg md:text-xl leading-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-slate-400 text-sm md:text-base leading-relaxed max-w-[260px]">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
