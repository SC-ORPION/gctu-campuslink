import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'How do I pay for my hostel?',
    answer:
      'Payments are processed through the integrated university portal. Accepts mobile money, bank transfer, and card payments. All transactions are SSL-encrypted.',
  },
  {
    question: 'When will I receive my room assignment?',
    answer:
      'Room assignments are instant upon successful payment verification. You will receive a confirmation email and SMS within 5 minutes.',
  },
  {
    question: 'Can I choose my roommate?',
    answer:
      'Yes. During the allocation process, you can request a specific roommate by entering their student ID. Both students must confirm the pairing.',
  },
  {
    question: 'What if my preferred hostel is full?',
    answer:
        'You will see real-time availability before payment. If your preferred hostel is full, you can join a waitlist or select an alternative with available rooms.',
  },
  {
    question: 'Is the platform only for GCTU students?',
    answer:
      'Yes. CampusLink is exclusively for registered GCTU students. Login requires a valid student ID and university email.',
  },
]

export default function FAQ() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <section id="faq" ref={ref} className="bg-navy-950 py-20 md:py-28">
      <div className="max-w-[800px] mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <h2
            className="text-white font-bold tracking-[-0.02em]"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 3.5rem)' }}
          >
            Common Questions
          </h2>
          <p className="mt-2 text-slate-400 text-base md:text-lg">
            Everything you need to know about the allocation process.
          </p>
        </motion.div>

        {/* Accordion */}
        <div>
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.4,
                ease: 'easeOut',
                delay: i * 0.08,
              }}
              className="border-b border-navy-800"
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between py-6 text-left group"
                aria-expanded={openIndex === i}
              >
                <h3 className="text-white font-semibold text-base md:text-lg pr-4 group-hover:text-blue-400 transition-colors">
                  {faq.question}
                </h3>
                <ChevronDown
                  size={20}
                  className={`text-slate-400 shrink-0 transition-transform duration-300 ${
                    openIndex === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 text-slate-400 text-sm md:text-base leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
