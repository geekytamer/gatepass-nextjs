'use client';

import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  ScanLine,
  User,
  LogOut,
  QrCode as QrCodeIcon,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/access-requests', label: 'Access Requests', icon: ClipboardList },
  { href: '/visitors', label: 'Visitors', icon: Building },
  { href: '/scan', label: 'Scan', icon: ScanLine },
  { href: '/users', label: 'User Management', icon: Users },
  { href: '/profile', label: 'My QR Code', icon: QrCodeIcon },
];

const GatePassLogo = () => (
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 items-center justify-center bg-primary rounded-lg">
      <ShieldCheck className="text-primary-foreground h-6 w-6" />
    </div>
    <span className="text-xl font-bold text-primary-foreground">GatePass</span>
  </div>
);

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader className="p-4">
        <div className="group-data-[collapsible=icon]:hidden">
          <GatePassLogo />
        </div>
        <div className="hidden group-data-[collapsible=icon]:block">
           <div className="flex h-10 w-10 items-center justify-center bg-primary rounded-lg">
             <ShieldCheck className="text-primary-foreground h-6 w-6" />
           </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{ children: item.label, side: 'right' }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 flex-col gap-2">
        <Separator className="bg-sidebar-border/50 my-2" />
        <div className="flex items-center gap-3 p-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={PlaceHolderImages[0].imageUrl} alt="Admin User" data-ai-hint={PlaceHolderImages[0].imageHint} />
            <AvatarFallback>AU</AvatarFallback>
          </Avatar>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm text-sidebar-foreground">Admin User</span>
            <span className="text-xs text-sidebar-foreground/70">admin@gatepass.com</span>
          </div>
        </div>
         <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip={{children: 'Logout', side: 'right'}}>
                  <LogOut/>
                  <span>Logout</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
