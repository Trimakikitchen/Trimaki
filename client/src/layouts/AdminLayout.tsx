import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Utensils,
  FolderOpen,
  ClipboardList,
  Truck,
  Users,
  Percent,
  Tag,
  Star,
  Settings,
  History,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Safeguard: Redirect if not admin
  React.useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  // Keyboard shortcut listener for Cmd+K command palette
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const menuItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { to: '/admin/products', label: 'Products', icon: Utensils },
    { to: '/admin/categories', label: 'Categories', icon: FolderOpen },
    { to: '/admin/inventory', label: 'Inventory', icon: ClipboardList },
    { to: '/admin/delivery', label: 'Delivery', icon: Truck },
    { to: '/admin/customers', label: 'Customers', icon: Users },
    { to: '/admin/offers', label: 'Offers', icon: Percent },
    { to: '/admin/coupons', label: 'Coupons', icon: Tag },
    { to: '/admin/reviews', label: 'Reviews', icon: Star },
    { to: '/admin/chat', label: 'Support Chat', icon: MessageSquare },
    { to: '/admin/logs', label: 'Audit Logs', icon: History },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredItems = menuItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-muted overflow-hidden relative">
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden md:flex flex-col bg-charcoal text-white transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } border-r border-charcoal-light relative`}
      >
        {/* Toggle Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-24 bg-primary text-white p-1 rounded-full border border-white hover:bg-primary-hover focus:outline-none z-10"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-charcoal-light">
          <Link to="/" className="flex items-center gap-2">
            {!collapsed ? (
              <span className="text-xl font-extrabold tracking-wider font-sans">
                TRI<span className="text-primary">MAKI</span> <span className="text-[10px] text-muted-medium font-medium px-2 py-0.5 bg-charcoal-light rounded">Admin</span>
              </span>
            ) : (
              <span className="text-xl font-extrabold text-primary">TM</span>
            )}
          </Link>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white shadow-glow'
                    : 'text-muted-medium hover:bg-charcoal-light hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-charcoal-light">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium text-accent hover:bg-charcoal-light hover:text-accent-hover transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-20 bg-white border-b border-muted flex items-center justify-between px-8 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-charcoal focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-charcoal font-sans">
              {menuItems.find((item) => item.to === location.pathname)?.label || 'Admin Panel'}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            {/* Command Palette trigger guide */}
            <span className="hidden lg:inline-block text-xs font-semibold px-3 py-1.5 bg-muted border border-muted-dark rounded-lg text-muted-medium">
              Press <kbd className="font-mono bg-white px-1.5 py-0.5 border border-muted-dark rounded shadow-sm text-charcoal">⌘ K</kbd> to search
            </span>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-charcoal">{user?.fullName}</p>
                <p className="text-xs text-muted-medium capitalize">{user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
                {user?.fullName?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-8 bg-muted/50">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)}></div>
          <aside className="w-64 bg-charcoal text-white flex flex-col relative z-50">
            <div className="h-20 flex items-center justify-between px-6 border-b border-charcoal-light">
              <span className="text-xl font-extrabold tracking-wider font-sans">
                TRI<span className="text-primary">MAKI</span>
              </span>
              <button onClick={() => setMobileOpen(false)} className="text-white">
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary text-white' : 'text-muted-medium hover:bg-charcoal-light'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-charcoal-light">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium text-accent hover:bg-charcoal-light transition-colors"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Command Palette Modal Overlay */}
      {paletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-8 pt-24">
          <div className="fixed inset-0" onClick={() => setPaletteOpen(false)}></div>
          <div className="bg-white border border-muted p-6 rounded-premium shadow-premium max-w-lg w-full relative z-10 flex flex-col gap-4 animate-slide-down">
            <div className="relative">
              <input
                type="text"
                placeholder="Search admin modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-muted-dark rounded-lg text-sm focus:outline-none focus:border-primary font-sans"
                autoFocus
              />
            </div>
            <div className="divide-y divide-muted max-h-60 overflow-y-auto">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => {
                      setPaletteOpen(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-4 py-3 px-2 text-sm text-charcoal hover:bg-primary/5 rounded-lg hover:text-primary transition-all font-medium"
                  >
                    <Icon className="w-5 h-5 text-muted-medium" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              {filteredItems.length === 0 && (
                <p className="text-center py-4 text-xs text-muted-medium">No admin modules match your search query.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminLayout;
