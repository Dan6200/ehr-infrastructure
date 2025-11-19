import { AppSidebar } from '#/components/dashboard/app-sidebar'
import { SiteHeader } from '#/components/dashboard/site-header'
import { SidebarProvider, SidebarInset } from '#/components/ui/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="@container/main flex-1 overflow-y-auto px-0 sm:p-4 py-6 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
