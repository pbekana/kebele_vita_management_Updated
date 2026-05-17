import { MapPin, Target, Eye, Heart } from 'lucide-react'

const AboutPage = () => {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Rooted in History, Focused on Future
          </h2>
          <p className="text-xl text-gray-600">Serving the community with integrity and innovation</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center hover:shadow-xl transition">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Establishment</h3>
            <p className="text-gray-600">Proudly serving the community since 1995, evolving with Jimma's growth.</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center hover:shadow-xl transition">
            <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Vision 2030</h3>
            <p className="text-gray-600">Becoming Ethiopia's premier digital Kebele through innovation and trust.</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center hover:shadow-xl transition">
            <div className="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Mission</h3>
            <p className="text-gray-600">Ensuring every resident has secure, fast access to their essential rights.</p>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 text-center hover:shadow-xl transition">
            <div className="bg-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Core Values</h3>
            <p className="text-gray-600">Integrity, Transparency, Accountability, and Community Service.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AboutPage