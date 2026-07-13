import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { googleLogout } from '@react-oauth/google';
import TrueFocus from './TrueFocus/TrueFocus';
import { StoreContext } from '../../context/StoreContext';
import { assets } from '../../assets/assets';

const Navbar = ({ onUserIconClick, setShowLogin }) => {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const [cartCount] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileImageBroken, setIsProfileImageBroken] = useState(false);
  const userMenuRef = useRef(null);
  const { token, user, setToken, setUser, setCartItems, url } = useContext(StoreContext);

  const handleUserIconClick = () => {
    if (typeof onUserIconClick === 'function') {
      onUserIconClick();
      return;
    }

    if (typeof setShowLogin === 'function') {
      setShowLogin(true);
    }
  };

  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cartItems');
    setToken('');
    setUser(null);
    setCartItems({});
    setIsUserMenuOpen(false);
  };

  const openEditProfile = () => {
    setIsUserMenuOpen(false);
    navigate('/edit-profile');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Menu', path: '/menu' },
    { name: 'Our Service', path: '/services' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const profileImageSrc = (() => {
    const rawProfileImage = (user?.profileImage || '').trim();
    const rawAvatar = (user?.avatar || '').trim();
    const invalidProfileImageValues = new Set(['undefined', 'null', 'nan', '[object Object]']);
    const isGoogleAvatar = /googleusercontent\.com|ggpht\.com/i.test(rawAvatar);

    if (rawProfileImage && !invalidProfileImageValues.has(rawProfileImage.toLowerCase())) {
      if (rawProfileImage.startsWith('http://') || rawProfileImage.startsWith('https://')) {
        return rawProfileImage;
      }
      return `${url}${rawProfileImage}`;
    }

    if (isGoogleAvatar) {
      return rawAvatar;
    }

    return '';
  })();

  const profileInitial = ((user?.name || user?.email || 'U').trim().charAt(0) || 'U').toUpperCase();

  useEffect(() => {
    setIsProfileImageBroken(false);
  }, [profileImageSrc]);

  return (
    <nav className='fixed inset-x-0 top-0 z-50 w-full border-b border-orange-300/30 bg-linear-to-r from-orange-600/90 via-amber-500/85 to-orange-400/80 shadow-[0_4px_24px_rgba(251,146,60,0.35)] backdrop-blur-lg'>
      <div className='w-full px-4 sm:px-6 md:px-10 lg:px-14 xl:px-20'>
        <div className='flex h-20 items-center'>
          <Link to='/' className='flex shrink-0 items-center'>
            <div className='navbar-logo'>
              <TrueFocus
                sentence='Urban Foods'
                manualMode={false}
                blurAmount={5}
                borderColor='#FDBA74'
                animationDuration={2}
                pauseBetweenAnimations={1}
                containerClassName='gap-2 whitespace-nowrap'
                wordClassName='text-4xl leading-none'
              />
            </div>
          </Link>

          <div className='hidden flex-1 items-center justify-center gap-4 md:flex lg:gap-8'>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative rounded-full px-3 py-2 text-[16px] font-bold tracking-wide transition-all duration-300 lg:px-4 ${
                  pathname === item.path
                    ? 'bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]'
                    : 'text-white hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className='ml-auto flex shrink-0 items-center gap-2 sm:gap-3 lg:gap-4'>
            {token ? (
              <div ref={userMenuRef} className='relative'>
                <button
                  type='button'
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  title={user?.email || 'Customer'}
                  className='flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/20 p-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.15)] backdrop-blur-sm transition hover:bg-white/35'
                >
                  {profileImageSrc && !isProfileImageBroken ? (
                    <img
                      src={profileImageSrc}
                      alt={user?.email || 'Customer profile'}
                      className='h-9 w-9 rounded-full object-cover'
                      onError={() => {
                        setIsProfileImageBroken(true);
                      }}
                    />
                  ) : (
                    <span className='flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white'>
                      {profileInitial}
                    </span>
                  )}
                </button>

                {isUserMenuOpen && (
                  <div className='absolute right-0 top-12 w-44 overflow-hidden rounded-xl border border-orange-300/60 bg-linear-to-b from-orange-500/95 to-orange-600/95 text-white shadow-[0_10px_28px_rgba(0,0,0,0.22)]'>
                    <button
                      type='button'
                      onClick={openEditProfile}
                      className='flex w-full items-center gap-2 bg-white/90 px-4 py-3 text-left text-sm font-bold text-orange-700 transition hover:bg-white'
                    >
                      <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5' />
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z' />
                      </svg>
                      Edit Profile
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/myorders');
                      }}
                      className='flex w-full items-center gap-2 border-t border-orange-100 bg-white/90 px-4 py-3 text-left text-sm font-bold text-orange-700 transition hover:bg-white'
                    >
                      <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' />
                      </svg>
                      My Orders
                    </button>
                    <button
                      type='button'
                      onClick={handleLogout}
                      className='flex w-full items-center gap-2 border-t border-orange-200 bg-white/80 px-4 py-3.5 text-left text-sm font-bold text-red-700 transition hover:bg-white/95'
                    >
                      <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H9' />
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 20H6a2 2 0 01-2-2V6a2 2 0 012-2h7' />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleUserIconClick}
                className='flex items-center gap-2 rounded-full border border-orange-400 bg-white px-3 py-2.5 font-semibold text-orange-500 shadow-[0_2px_12px_rgba(0,0,0,0.15)] transition-all duration-300 hover:bg-orange-50 sm:px-6 lg:px-8'
              >
                <svg className='h-5 w-5 text-orange-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1' />
                </svg>
                <span className='hidden sm:inline'>Login</span>
              </button>
            )}

            <Link
              to='/cart'
              className='relative flex items-center rounded-xl px-2 py-2 text-white transition-all duration-300 hover:bg-white/10 hover:text-white sm:flex-col sm:px-3'
            >
              <div className='relative'>
                <svg className='h-6 w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' />
                </svg>

                {cartCount > 0 && (
                  <span className='absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[#6B3E26]'>
                    {cartCount}
                  </span>
                )}
              </div>
              <span className='mt-0 hidden text-xs font-bold sm:mt-1 sm:inline'>Cart</span>
            </Link>
          </div>
        </div>

        <div className='pb-3 md:hidden'>
          <div className='no-scrollbar overflow-x-auto'>
            <div className='mx-auto flex min-w-max items-center justify-center gap-2 sm:gap-3'>
              {navItems.map((item) => (
                <Link
                  key={`mobile-${item.path}`}
                  to={item.path}
                  className={`rounded-full px-4 py-2 text-[16px] font-bold tracking-wide transition-all duration-300 ${
                    pathname === item.path
                      ? 'bg-white/20 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)]'
                      : 'text-white/95 hover:bg-white/12 hover:text-white'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
