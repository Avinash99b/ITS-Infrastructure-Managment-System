
'use client';
import Link from 'next/link';
import {
  Bell,
  Blocks,
  Building,
  HardDrive,
  Home,
  LogOut,
  PanelLeft,
  Search,
  Users,
  AlertTriangle,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Logo from '@/components/icons/logo';
import { logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { DialogTitle } from '@radix-ui/react-dialog';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; avatar: string, image_url?: string } | null>(
    null
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const updateUserFromStorage = useCallback(() => {
    const userData = localStorage.getItem('user');

    if (userData) {
      const parsedData = JSON.parse(userData);
      // Append a timestamp to bust the cache
      if (parsedData.image_url) {
        parsedData.image_url = `${parsedData.image_url.split('?')[0]}?t=${new Date().getTime()}`;
      }
      setUser(parsedData);
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    updateUserFromStorage();

    const handleStorageChange = () => {
      updateUserFromStorage();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [updateUserFromStorage]);

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  const navLinks = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/users', icon: Users, label: 'User Management' },
    { href: '/rooms', icon: Building, label: 'Room Management' },
    { href: '/blocks', icon: Blocks, label: 'Block Management' },
    { href: '/systems', icon: HardDrive, label: 'System Management' },
    { href: '/faults', icon: AlertTriangle, label: 'Faults' },
  ];
  
  const userAvatar = (
    <Avatar className="h-8 w-8">
      <AvatarImage
        src={
          user?.image_url  ||
          'https://i.pravatar.cc/150?u=a042581f4e29026704d'
        }
        alt={user?.name || 'User'}
      />
      <AvatarFallback>
        {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
          <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            <Link
              href="#"
              className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
            >
              <Logo className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">InfraTrack</span>
            </Link>
            {navLinks.map((link) => (
              <Tooltip key={link.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={link.href}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                  >
                    <link.icon className="h-5 w-5" />
                    <span className="sr-only">{link.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{link.label}</TooltipContent>
              </Tooltip>
            ))}
          </nav>
          <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
             {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                     {userAvatar}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <UserIcon className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Support</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Button variant="ghost" size="icon" className="rounded-full" asChild>
                            <Link href="/login">{userAvatar}</Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Login</TooltipContent>
                </Tooltip>
              )}
          </nav>
        </aside>
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:max-w-xs flex flex-col">
                <VisuallyHidden>
                  <DialogTitle>Mobile navigation</DialogTitle>
                </VisuallyHidden>
                <nav className="grid gap-6 text-lg font-medium">
                  <Link
                    href="#"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                  >
                    <Logo className="h-5 w-5 transition-all group-hover:scale-110" />
                    <span className="sr-only">InfraTrack</span>
                  </Link>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto p-4">
                  {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" className="w-full justify-start gap-2">
                         {userAvatar}
                         <span>{user.name}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                            <UserIcon className="mr-2 h-4 w-4" />
                            Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Support</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button asChild className="w-full">
                        <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            <div className="relative ml-auto flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
              />
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </header>
          <main className="flex-1 p-4 sm:px-6 sm:py-0 animate-fade-in">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
