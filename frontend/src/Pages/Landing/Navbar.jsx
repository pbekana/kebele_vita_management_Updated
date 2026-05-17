import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Menu, X, Globe } from 'lucide-react'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-lg py-2' : 'bg-gradient-to-r from-blue-400 to-blue-600 py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Shield className={`h-8 w-8 ${isScrolled ? 'text-blue-600' : 'text-white'}`} />
            <div>
              <h1 className={`font-bold text-lg ${isScrolled ? 'text-gray-900' : 'text-white'}`}>
                Heremata Mentina
              </h1>
              <p className={`text-xs ${isScrolled ? 'text-gray-500' : 'text-blue-200'}`}>
                Kebele Administration
              </p>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <a href="#home" className={`${isScrolled ? 'text-gray-700' : 'text-white'} hover:text-blue-300 transition`}>Home</a>
            <a href="#about" className={`${isScrolled ? 'text-gray-700' : 'text-white'} hover:text-blue-300 transition`}>About</a>
            <a href="#services" className={`${isScrolled ? 'text-gray-700' : 'text-white'} hover:text-blue-300 transition`}>Services</a>
            <a href="#events" className={`${isScrolled ? 'text-gray-700' : 'text-white'} hover:text-blue-300 transition`}>Events</a>
            <a href="#contact" className={`${isScrolled ? 'text-gray-700' : 'text-white'} hover:text-blue-300 transition`}>Contact</a>
            
            <button className="flex items-center space-x-1 text-gray-600">
              <Globe className="h-4 w-4" />
              <span>English</span>
            </button>
            
            <Link to="/login" className={`${isScrolled ? 'text-gray-700' : 'text-white'} hover:text-blue-300 transition`}>Login</Link>
            <Link to="/register" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition">
              Register Now
            </Link>
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden">
            {isMenuOpen ? (
              <X className={isScrolled ? 'text-gray-900' : 'text-white'} />
            ) : (
              <Menu className={isScrolled ? 'text-gray-900' : 'text-white'} />
            )}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3 bg-white rounded-lg p-4 shadow-lg">
            <a href="#home" className="block py-2 text-gray-700">Home</a>
            <a href="#about" className="block py-2 text-gray-700">About</a>
            <a href="#services" className="block py-2 text-gray-700">Services</a>
            <a href="#contact" className="block py-2 text-gray-700">Contact</a>
            <Link to="/login" className="block py-2 text-gray-700">Login</Link>
            <Link to="/register" className="block bg-blue-600 text-white px-4 py-2 rounded-lg text-center">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar