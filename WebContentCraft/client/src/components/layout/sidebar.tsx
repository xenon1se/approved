import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  Instagram, 
  Linkedin, 
  Image, 
  Settings,
  Menu,
  Truck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
}

function NavItem({ href, icon, children, isActive, onClick }: NavItemProps) {
  return (
    <li className="mb-1">
      <Link href={href}>
        <div
          onClick={onClick}
          className={cn(
            "flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer",
            isActive 
              ? "bg-primary-50 text-primary-800 font-medium" 
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          {icon}
          <span>{children}</span>
        </div>
      </Link>
    </li>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="bg-white border-r border-slate-200 w-full md:w-64 md:fixed md:h-screen">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary-800 flex items-center gap-2">
          <Truck className="h-5 w-5" />
          <span>LogisticsPub</span>
        </h1>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-slate-500 hover:text-primary-600"
          onClick={toggleMobileMenu}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>
      
      <nav className={cn("md:block", mobileMenuOpen ? "block" : "hidden")}>
        <div className="p-4">
          <ul>
            <NavItem 
              href="/" 
              icon={<LayoutDashboard className="h-5 w-5" />} 
              isActive={location === "/" || location === ""} 
              onClick={closeMobileMenu}
            >
              Dashboard
            </NavItem>
            <NavItem 
              href="/content-generation" 
              icon={<FileText className="h-5 w-5" />} 
              isActive={location === "/content-generation"} 
              onClick={closeMobileMenu}
            >
              Content Generation
            </NavItem>

            <NavItem 
              href="/settings" 
              icon={<Settings className="h-5 w-5" />} 
              isActive={location === "/settings"} 
              onClick={closeMobileMenu}
            >
              Settings
            </NavItem>
          </ul>
        </div>
      </nav>
    </div>
  );
}
