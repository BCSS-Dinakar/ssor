import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, LogIn } from 'lucide-react';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Public Services', path: '/services' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav className="bg-primary/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 overflow-hidden rounded-xl bg-white/10 p-0.5 shadow-md group-hover:shadow-xl transition-all duration-300">
              <img src="/images/ssor-logo.png" alt="SSOR Logo" className="h-full w-full object-cover rounded-lg" />
            </div>
            <div>
              <span className="text-xl font-bold text-white tracking-wide font-heading">SSOR</span>
              <span className="hidden sm:block text-[10px] text-gray-400 -mt-1 tracking-wider uppercase">State Sexual Offender Register</span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Login Button */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="bg-accent hover:bg-yellow-400 text-primary font-semibold px-5 py-2 rounded-xl text-sm transition-all duration-300 shadow-md hover:shadow-xl inline-flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-primary border-t border-white/10">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="block text-gray-300 hover:text-white hover:bg-white/10 px-4 py-3 rounded-lg text-sm font-medium transition-all"
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="block bg-accent hover:bg-yellow-400 text-primary font-semibold px-4 py-3 rounded-xl text-sm text-center mt-3 transition-all shadow-md"
            >
              <span className="inline-flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
