import "../globals.css";
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { DashboardHeader } from "@/components/dashboard-header"
import { ConnectionProvider } from "@/contexts/connection-provider"


export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ConnectionProvider>
        <SidebarProvider>
          <AppSidebar />
          <div className="flex min-h-svh flex-1 flex-col overflow-hidden">
            <DashboardHeader />
            <main className="flex-1 overflow-auto bg-muted/20">
              <div className="p-4 md:p-6 lg:p-8">{children}</div>
            </main>
          </div>
        </SidebarProvider>
      </ConnectionProvider>
    </ThemeProvider>
  );
}
