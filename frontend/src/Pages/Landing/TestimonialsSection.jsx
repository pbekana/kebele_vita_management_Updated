import { Star, Quote } from 'lucide-react'

const Testimonials = () => {
  const testimonials = [
    { name: "Almaz Bekele", role: "Resident", text: "This system has transformed how I access Kebele services! Got my birth certificate in just 2 days.", rating: 5 },
    { name: "Tadesse Mulugeta", role: "Business Owner", text: "The digital process is so smooth. No more long queues and waiting days for documents.", rating: 5 },
    { name: "Meron Alemu", role: "Teacher", text: "I registered my marriage online. Very efficient and the staff is extremely helpful.", rating: 5 }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our Community Says</h2>
          <p className="text-xl text-gray-600">Trusted by thousands of residents in Jimma</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
              <Quote className="h-8 w-8 text-blue-300 mb-4" />
              <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
              <div className="flex items-center gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="font-bold text-gray-900">{testimonial.name}</p>
              <p className="text-sm text-gray-500">{testimonial.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials