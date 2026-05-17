import { Church, GraduationCap, Award, Landmark } from 'lucide-react'

const FeatureSection = () => {
  const features = [
    { icon: Church, title: "Baptism", desc: "Religious record verification.", color: "from-purple-500 to-purple-600" },
    { icon: GraduationCap, title: "Graduation", desc: "Academic achievement validation.", color: "from-blue-500 to-blue-600" },
    { icon: Award, title: "Service", desc: "Community contribution award.", color: "from-green-500 to-green-600" },
    { icon: Landmark, title: "Land Ownership", desc: "Title deed verification.", color: "from-orange-500 to-orange-600" }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">Institutional & Event Certification</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="text-center group cursor-pointer">
                <div className={`bg-gradient-to-r ${feature.color} w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg transform group-hover:scale-110 transition duration-300`}>
                  <Icon className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FeatureSection