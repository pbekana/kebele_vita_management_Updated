import { Users, FileText, Award, Clock } from 'lucide-react'

const StatisticsSection = () => {
  const stats = [
    { icon: Users, value: "12,000+", label: "Registered Residents", color: "from-blue-500 to-blue-600" },
    { icon: FileText, value: "45,000+", label: "Certificates Issued", color: "from-green-500 to-green-600" },
    { icon: Award, value: "99%", label: "Satisfaction Rate", color: "from-purple-500 to-purple-600" },
    { icon: Clock, value: "24 Hours", label: "Avg. Response Time", color: "from-orange-500 to-orange-600" }
  ]

  return (
    <section className="py-16 bg-blue-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="text-center text-white">
                <div className={`bg-gradient-to-r ${stat.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <Icon className="h-8 w-8" />
                </div>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-blue-200 mt-2">{stat.label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default StatisticsSection