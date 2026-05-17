import { Link } from 'react-router-dom'
import { Baby, Heart, AlertCircle, IdCard, ChevronRight } from 'lucide-react'

const ServicesSection = () => {
  const services = [
    { icon: Baby, title: "Birth Certificate", desc: "Official registration of new births. Required for school enrollment.", fee: "50 ETB", time: "2 Days", bgColor: "from-blue-500 to-blue-600", tag: "MOST REQUESTED" },
    { icon: Heart, title: "Marriage Certificate", desc: "Legal documentation of marriage for civil and religious purposes.", fee: "100 ETB", time: "3-5 Days", bgColor: "from-pink-500 to-pink-600", tag: "" },
    { icon: AlertCircle, title: "Death Certificate", desc: "Streamlined, compassionate process for inheritance settlement.", fee: "30 ETB", time: "2 Days", bgColor: "from-gray-500 to-gray-600", tag: "" },
    { icon: IdCard, title: "Residency ID", desc: "Proof of residence for local banking and utility services.", fee: "20 ETB", time: "Same Day", bgColor: "from-green-500 to-green-600", tag: "EXPRESS" }
  ]

  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Primary Certificate Services</h2>
          <p className="text-xl text-gray-600">Legal documentation for all life's significant milestones.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                {service.tag && <div className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1.5 text-center">🔥 {service.tag}</div>}
                <div className="p-6">
                  <div className={`bg-gradient-to-r ${service.bgColor} w-16 h-16 rounded-2xl flex items-center justify-center mb-4`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{service.desc}</p>
                  <div className="flex justify-between items-center mb-4">
                    <div><span className="text-2xl font-bold text-blue-600">{service.fee}</span><p className="text-xs text-gray-500">Fee</p></div>
                    <div className="text-right"><span className="text-gray-700 font-semibold">⏱ {service.time}</span><p className="text-xs text-gray-500">Processing</p></div>
                  </div>
                  <Link to="/Login" className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition">
                    Apply Now <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="flex justify-center gap-6 mt-8">
          <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-3 h-3 bg-blue-500 rounded-full"></span>Standard: 3-5 Days</div>
          <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-3 h-3 bg-yellow-500 rounded-full"></span>Express: 24 Hours</div>
        </div>
      </div>
    </section>
  )
}

export default ServicesSection