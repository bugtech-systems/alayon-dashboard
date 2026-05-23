"use client";

import Link from "next/link";
import { CircleHelp, ClipboardList, Command, Database, File, Search, Settings } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { rootUser } from "@/data/users";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { companySidebarItems } from "@/data/sidebar/company-sidebar-items";

const _data = {
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
    {
      title: "Get Help",
      url: "/dashboard/help",
      icon: CircleHelp,
    },
    {
      title: "Search",
      url: "/dashboard/search",
      icon: Search,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "/dashboard/data-library",
      icon: Database,
    },
    {
      name: "Reports",
      url: "/dashboard/reports",
      icon: ClipboardList,
    },
    {
      name: "Word Assistant",
      url: "/dashboard/word-assistant",
      icon: File,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.sidebarVariant,
      sidebarCollapsible: s.sidebarCollapsible,
      isSynced: s.isSynced,
    })),
  );

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  return (
    <Sidebar variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link prefetch={false} href="/">
                <Command />
                <span className="font-semibold text-base">{APP_CONFIG.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={companySidebarItems} />
        {/* <NavDocuments items={_data.documents} /> */}
        {/* <NavSecondary items={_data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        {/* Uncomment when SidebarSupportCard is fixed */}
        {/* <SidebarSupportCard /> */}
        <NavUser user={rootUser} />
      </SidebarFooter>
    </Sidebar>
  );
}