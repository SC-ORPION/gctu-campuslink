import Navbar from './sections/Navbar'
import Hero from './sections/Hero'
import TrustStrip from './sections/TrustStrip'
import HowItWorks from './sections/HowItWorks'
import InteractiveLightGrid from './sections/InteractiveLightGrid'
import HostelPreview from './sections/HostelPreview'
import FAQ from './sections/FAQ'
import Footer from './sections/Footer'

export default function App() {
  return (
    <div className="min-h-screen bg-navy-950">
      <Navbar />
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <InteractiveLightGrid />
      <HostelPreview />
      <FAQ />
      <Footer />
    </div>
  )
}
