"use client";

import {
  ChevronDown,
  FileText,
  Home,
  LogOut,
  Mail,
  Megaphone,
  MessageCircle,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { clearAuthToken } from "@/lib/auth-cookie";
import { connectionCache } from "@/lib/connection-cache";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

const mainItems = [{ title: "Dashboard", url: "/dashboard", icon: Home }];

const campaignItems = [
  { title: "Email", url: "/dashboard/campaigns/email", icon: Mail },
  { title: "WhatsApp", url: "/dashboard/campaigns/whatsapp", icon: MessageCircle },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [campaignsOpen, setCampaignsOpen] = useState(
    pathname.startsWith("/dashboard/campaigns")
  );

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* continue logout locally */
    }
    clearAuthToken();
    connectionCache.clearGoogle();
    connectionCache.clearWhatsApp();
    router.push("/login");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Campaign Hub</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard/templates"}>
                  <Link href="/dashboard/templates">
                    <FileText />
                    <span>Templates</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard/contacts"}>
                  <Link href="/dashboard/contacts">
                    <Users />
                    <span>Contacts</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setCampaignsOpen((open) => !open)}
                  isActive={pathname.startsWith("/dashboard/campaigns")}
                >
                  <Megaphone />
                  <span>Campaigns</span>
                  <ChevronDown
                    className={`ml-auto transition-transform ${campaignsOpen ? "rotate-180" : ""}`}
                  />
                </SidebarMenuButton>
                {campaignsOpen && (
                  <SidebarMenuSub>
                    {campaignItems.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild isActive={pathname === item.url}>
                          <Link href={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <User />
              <span>Profile</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
