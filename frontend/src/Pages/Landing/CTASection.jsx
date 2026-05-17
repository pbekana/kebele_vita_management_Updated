import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
        <p className="text-xl text-blue-100 mb-8">Join thousands of residents who already use our digital services</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">
            Register Now <ArrowRight className="h-5 w-5" />
          </Link>
          <Link to="/services" className="inline-flex items-center gap-2 border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition">
            Explore Services
          </Link>
        </div>
      </div>
    </section>
  )
}

export default CTASection