import AIAssistantUI from "@/components/AIAssistantUI"
// import "@workspace/ui/styles/modern-chat-globals.css"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Separator } from "@workspace/ui/components/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@workspace/ui/components/sidebar"
import ChatInterface from "@/chat-interface"

import { Suspense } from "react"


export default function Page() {
  return (
          <Suspense>
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ms-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Chat Alayon</h1>
      </div>
    </header>
        <AIAssistantUI />
    </Suspense>
  )
  
}
