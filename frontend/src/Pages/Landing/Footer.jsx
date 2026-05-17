import { Link } from 'react-router-dom'
import { Shield,  Send } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-blue-400" />
              <span className="font-bold text-xl">Heremata Mentina Kebele</span>
            </div>
            <p className="text-gray-400 text-sm">The official digital portal for the residents of Jimma, providing secure and efficient government services.</p>
            <div className="flex space-x-3 mt-4">
             
              <button className="bg-gray-800 p-2 rounded-full hover:bg-gray-700"><Send className="h-4 w-4" /></button>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#home" className="hover:text-white">Home</a></li>
              <li><a href="#about" className="hover:text-white">About Us</a></li>
              <li><a href="#services" className="hover:text-white">Services</a></li>
              <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Services</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link to="/birth-certificate" className="hover:text-white">Birth Certificates</Link></li>
              <li><Link to="/marriage" className="hover:text-white">Marriage Registry</Link></li>
              <li><Link to="/death-certificate" className="hover:text-white">Death Certificates</Link></li>
              <li><Link to="/residency" className="hover:text-white">Residency IDs</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Newsletter</h3>
            <p className="text-gray-400 text-sm mb-3">Subscribe for updates</p>
            <div className="flex">
              <input type="email" placeholder="Your email" className="flex-1 px-3 py-2 rounded-l-lg text-gray-900" />
              <button className="bg-blue-600 px-4 py-2 rounded-r-lg hover:bg-blue-700">Subscribe</button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400 text-sm">
          <p>© 2024 Heremata Mentina Kebele. All rights reserved. Jimma, Ethiopia.</p>
        </div>
      </div>
      </footer>
  )
}

export default Footer