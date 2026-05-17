import { useEffect } from 'react'
import Navbar from './Navbar'
import HeroSection from './HeroSection'
import AboutPage from './AboutPage'
import ServicesSection from './ServicesSection'
import FeatureSection from './FeatureSection'
import StatisticsSection from './StatisticsSection'
import TestimonialsSection from './TestimonialsSection'
import CTASection from './CTASection'
import Footer from './Footer'
import Announcment from './Announcment'
import BackToTop from './BackToTop'
import ProcessSection from './ProcessSection'

const LandingPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Heremata Mentina Kebele - Official Government Portal'
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Announcment />
      <Navbar />
      <HeroSection />
      <AboutPage />
      <ServicesSection />
      <FeatureSection />
      <ProcessSection/>
      <StatisticsSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
      <BackToTop />
    </div>
  )
}

export default LandingPage