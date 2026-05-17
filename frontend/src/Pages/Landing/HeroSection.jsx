import { Link } from 'react-router-dom'
import { FileText, Users, Award, Clock } from 'lucide-react'

const HeroSection = () => {
  return (
    <section id="home" className="relative overflow-hidden bg-gradient-to-br from-blue-200 via-blue-500 to-blue-400 pt-32 pb-20">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center bg-blue-600/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
              <span className="text-blue-200 text-sm">✨ Official Government Portal</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Welcome to Heremata Mentina
              <span className="text-blue-300"> Kebele</span>
            </h1>
            <p className="text-lg text-blue-100 mb-6">
              Access vital event registration and certificate services with transparency, 
              efficiency, and speed. Empowering Jimma's residents through digital progress.
            </p>
            <div className="flex flex-wrap gap-4 mb-6">
              <Link to="/register" className="inline-flex items-center px-6 py-3 bg-white text-blue-900 rounded-lg font-semibold hover:bg-blue-50 transition">
                Request Certificate
              </Link>
             
            </div>
            
            <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2 backdrop-blur-sm">
              
              
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center">
              <Users className="h-10 w-10 text-blue-300 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">12k+</div>
              <p className="text-blue-200 text-sm">Registered Residents</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center">
              <FileText className="h-10 w-10 text-blue-300 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">45k+</div>
              <p className="text-blue-200 text-sm">Certificates Issued</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center">
              <Award className="h-10 w-10 text-blue-300 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">99%</div>
              <p className="text-blue-200 text-sm">Satisfaction Rate</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center">
              <Clock className="h-10 w-10 text-blue-300 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">24h</div>
              <p className="text-blue-200 text-sm">Avg. Response Time</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection