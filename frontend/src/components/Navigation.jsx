import logo from '../assets/logo/blue.png';
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom'; 
import { Home, Bell, User, LogOut, Sun, Moon, Menu, X, Briefcase, ClipboardList, Trophy, Users } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  return (
    <img src={logo} alt="Logo" />
  );
}

const Navigation = ({ onLogout, unreadNotifications, onToggle, className }) => {
  const { theme, toggleTheme } = useTheme();
  const { auth } = useAuth();
  const role = auth?.user?.role;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resize to detect mobile/desktop
  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(false); // Always expanded on mobile when open
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Notify parent of collapse state changes
  React.useEffect(() => {
    if (onToggle) {
      onToggle(isCollapsed && !isMobile);
    }
  }, [isCollapsed, isMobile, onToggle]);

  const candidateNav = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'jobs', label: 'Browse Jobs', icon: Briefcase, path: '/jobs' },
    { id: 'applications', label: 'My Applications', icon: ClipboardList, path: '/applications' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  const companyNav = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'jobs', label: 'Job Postings', icon: Briefcase, path: '/jobs' },
    { id: 'profile', label: 'Company Profile', icon: User, path: '/profile' },
  ];

  const navItems = role === 'company' ? companyNav : candidateNav;

  const getNavLinkClass = ({ isActive }) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-primary/10 dark:bg-dark-primary/10 text-primary dark:text-dark-primary font-semibold shadow-inner'
        : 'text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-dark-primary hover:bg-primary/5 dark:hover:bg-dark-primary/5'
    }`;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Mobile Menu Button
  const MobileMenuButton = () => (
    <button
      onClick={toggleMobileMenu}
      className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white/90 dark:bg-dark-background/90 backdrop-blur-md border border-gray-200/80 dark:border-gray-700/80 shadow-lg"
    >
      {isMobileMenuOpen ? (
        <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
      ) : (
        <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
      )}
    </button>
  );

  // Desktop Collapse Button
  const CollapseButton = () => (
    <button
      onClick={() => setIsCollapsed(!isCollapsed)}
      className="hidden md:flex absolute -right-3 top-6 w-6 h-6 bg-white dark:bg-dark-background border border-gray-200/80 dark:border-gray-700/80 rounded-full items-center justify-center shadow-sm hover:shadow-md transition-all duration-200"
    >
      {isCollapsed ? (
        <Menu className="w- h-3 text-gray-600 dark:text-gray-400" />
      ) : (
        <X className="w-3 h-3 text-gray-600 dark:text-gray-400" />
      )}
    </button>
  );

  return (
    <>
      <MobileMenuButton />
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={closeMobileMenu}
        />
      )}

      <nav
        className={`
          bg-white/80 dark:bg-dark-background/80 backdrop-blur-md 
          border border-gray-200/80 dark:border-gray-700/80 rounded-2xl
          shadow-lg transition-all duration-300 relative
          
          /* Mobile styles - Fixed positioning with safe areas */
          ${isMobile 
            ? `fixed top-4 left-4 w-60 z-50 
               max-h-[calc(100vh-2.1rem)] min-h-[60vh]
               ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `sticky top-4 ml-2.5 h-[calc(100vh-2.5rem)] ${isCollapsed ? 'w-25' : 'w-64'}`
          }
          
          /* Common styles */
          p-6 flex flex-col ${className || ''}
        `}
      >
        <CollapseButton />

        {/* Header */}
        <div className={`flex items-center mb-6 flex-shrink-0 transition-all duration-300 ${isCollapsed && !isMobile ? 'justify-center' : 'gap-3'}`}>

          {(!isCollapsed || isMobile) && (
            <h1 className="text-xl font-bold text-cyanblue dark:text-dark-cyanblue whitespace-nowrap overflow-hidden">
              BetterATS
            </h1>
          )}
        </div>

        {/* Navigation Items - Scrollable area */}
        <div className="flex-1 space-y-2 overflow-y-auto min-h-0 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={closeMobileMenu}
                className={getNavLinkClass}
                title={isCollapsed && !isMobile ? item.label : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {(!isCollapsed || isMobile) && (
                  <span className="font-medium">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer Actions - Fixed at bottom */}
        <div className="space-y-2 border-t border-gray-200/80 dark:border-gray-700/80 pt-4 flex-shrink-0 mt-auto">
          {/* Notifications - Commented out as in original
          <NavLink to="/notifications" className={getNavLinkClass} onClick={closeMobileMenu}>
            <Bell className="w-5 h-5 flex-shrink-0" />
            {(!isCollapsed || isMobile) && (
              <>
                <span className="font-medium">Notifications</span>
                {unreadNotifications > 0 && (
                  <span className="ml-auto bg-accent dark:bg-dark-accent text-white text-xs rounded-full px-2 py-1">
                    {unreadNotifications}
                  </span>
                )}
              </>
            )}
          </NavLink>
          
          <NavLink to="/profile" className={getNavLinkClass} onClick={closeMobileMenu}>
            <User className="w-5 h-5 flex-shrink-0" />
            {(!isCollapsed || isMobile) && (
              <span className="font-medium">Profile</span>
            )}
          </NavLink> */}
          
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-dark-primary hover:bg-primary/5 dark:hover:bg-dark-primary/5 transition-all duration-200"
            title={isCollapsed && !isMobile ? (theme === 'light' ? 'Dark Mode' : 'Light Mode') : ''}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 flex-shrink-0" />
            ) : (
              <Sun className="w-5 h-5 flex-shrink-0" />
            )}
            {(!isCollapsed || isMobile) && (
              <span className="font-medium">
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </span>
            )}
          </button>
          
          <button
            onClick={() => {
              onLogout();
              closeMobileMenu();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-accent dark:text-dark-accent hover:text-white hover:bg-accent dark:hover:bg-dark-accent transition-all duration-200"
            title={isCollapsed && !isMobile ? 'Logout' : ''}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {(!isCollapsed || isMobile) && (
              <span className="font-medium">Logout</span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navigation;