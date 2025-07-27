import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { ShoppingCart, Package, Store, MessageSquare, User, Home } from 'lucide-react';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: <Home /> },
  { to: '/inventory', label: 'Inventory', icon: <Package /> },
  { to: '/browse', label: 'Browse', icon: <Store /> },
  { to: '/orders', label: 'Orders', icon: <ShoppingCart /> },
  { to: '/cart', label: 'Cart', icon: <ShoppingCart /> },
  { to: '/profile', label: 'Profile', icon: <User /> },
  // { to: '/chat', label: 'Chat', icon: <MessageSquare /> }, // Enable when chat is ready
];

export default function AppSidebar() {
  const location = useLocation();
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {navLinks.map(link => (
              <SidebarMenuItem key={link.to}>
                <SidebarMenuButton asChild isActive={location.pathname === link.to}>
                  <Link to={link.to} className="flex items-center gap-2">
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
