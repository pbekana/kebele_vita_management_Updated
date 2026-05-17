import { UserPlus, FileText, CreditCard, Download } from 'lucide-react'

const ProcessSection = () => {
  const steps = [
    { icon: UserPlus, title: "Register", desc: "Create your profile with official ID", number: "01" },
    { icon: FileText, title: "Fill Form", desc: "Enter event details accurately", number: "02" },
    { icon: CreditCard, title: "Submit", desc: "Pay fees & upload documents", number: "03" },
    { icon: Download, title: "Receive", desc: "Download PDF or pick up copy", number: "04" }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">The Digital Application Process</h2>
          <p className="text-xl text-gray-600">Simple steps to get your certificate</p>
        </div>
        <div className="grid md:grid-cols-4 gap-8 relative">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={index} className="relative text-center">
                {index < 3 && <div className="hidden lg:block absolute top-1/3 left-full w-full h-0.5 bg-blue-200 -translate-y-1/2"></div>}
                <div className="relative z-10">
                  <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg">{step.number}</div>
                  <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                    <Icon className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default ProcessSection