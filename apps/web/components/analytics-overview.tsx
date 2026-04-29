"use client"

import * as React from "react"
import { Download, ChevronsUpDown, Check } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"

import { DateRangePicker } from "@/components/date-range-picker"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"

import { useURLFilters } from "@/hooks/useUrlFilters"
import { useN8nQuery } from "@/hooks/useN8nQuery"

import { cn } from "@/lib/utils"

const branchesWidget = {
  id: "branches",
  webhook: {
    url: "/webhook/get-branches",
    queryMap: {},
  },
}

const batchesWidget = {
  id: "batches",
  webhook: {
    url: "/webhook/get-batches",
    queryMap: {
      branch: "branch"
   }
  },
  
}

export function AnalyticsOverview() {
  const { filters, setFilters, clearFilters } = useURLFilters({
    defaultRange: "30d",
    defaultBranch: "all",
    defaultBatch: "all",
    defaultSegment: "all"
  })




  const { data: branches = [] } = useN8nQuery({widget: branchesWidget, filters: filters})
    const { data: batches = [], isLoading: batchesLoading } = useN8nQuery({widget: batchesWidget, filters })



  // Date range handling
  const dateRange: DateRange = {
    from: filters.from ? new Date(filters.from) : new Date(),
    to: filters.to ? new Date(filters.to) : new Date(),
  }

  const handleDateChange = (range?: DateRange) => {
    if (!range?.from || !range?.to) return
    
    setFilters({
      from: format(range.from, "yyyy-MM-dd"),
      to: format(range.to, "yyyy-MM-dd"),
      range: "", // Clear range preset when using custom dates
    })
  }

  // Branch handling
  const handleBranchChange = (branchId: string) => {
    setFilters({ branch: branchId })
  }

  // Batch handling
  const handleBatchChange = (batchId: string) => {
    setFilters({ batch: batchId })
  }

  // Clear all filters
  const handleClearAll = () => {
    clearFilters()
  }

    const handleExport = async () => {
    const params = new URLSearchParams({
      from: filters.from,
      to: filters.to,
      branch: filters.branch || "all",
    })

    const res = await fetch(`/webhook/export-orders?${params.toString()}`)
    const blob = await res.blob()

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `orders-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
  }

  return (
       <div className="grid gap-4 px-4 lg:px-6">

        <div className="flex flex-wrap items-center justify-between gap-2">

  <div className="flex flex-wrap items-center gap-2">

    {/* BRANCH */}
    <BranchSelect
      branches={branches}
      value={filters.branch || "all"}
      onChange={(val) => {
        setFilters({
          branch: val,
          batch: "", // 🔥 reset batch when branch changes
        })
      }}
    />

    {/* BATCH */}
    <BatchSelect
      batches={batches}
      value={filters.batch}
      disabled={!filters.branch || filters.branch === "all"}
      onChange={(val) => setFilters({ batch: val })}
    />

  </div>

  
                  <div className="flex flex-wrap items-center gap-2">
                        
                <DateRangePicker 
                  value={dateRange} 
                  onChange={handleDateChange} 
                />
                    {/* <Button variant="secondary" onClick={handleExport}>
                      <Download />
                      Export
                    </Button> */}
                  </div>
                </div>

    </div>
   
  )
}

function BranchSelect({ branches, value, onChange }) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          {value === "all"
            ? "All Branches"
            : branches.find((b) => b.id === value)?.name}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandGroup>

              <CommandItem
                value="all"
                onSelect={() => {
                  onChange("all")
                  setOpen(false)
                }}
              >
                All Branches
                <Check className={cn("ml-auto", value === "all" ? "opacity-100" : "opacity-0")} />
              </CommandItem>

              {branches.map((b) => (
                <CommandItem
                  key={b.id}
                  value={b.id}
                  onSelect={() => {
                    onChange(b.id)
                    setOpen(false)
                  }}
                >
                  {b.name}
                  <Check className={cn("ml-auto", value === b.id ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}

            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function BatchSelect({ batches, value, onChange, disabled }) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[200px] justify-between"
          disabled={disabled}
        >
          {disabled
            ? "Select branch first"
            : value
            ? batches.find((b) => b.id === value)?.name
            : "All Batches"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandGroup>

              <CommandItem
                value="all"
                onSelect={() => {
                  onChange("all")
                  setOpen(false)
                }}
              >
                All Batches
                <Check className={cn("ml-auto", value === "all" ? "opacity-100" : "opacity-0")} />
              </CommandItem>

              {batches.map((b) => (
                <CommandItem
                  key={b.id}
                  value={b.id}
                  onSelect={() => {
                    onChange(b.id)
                    setOpen(false)
                  }}
                >
                  {b.name}
                  <Check className={cn("ml-auto", value === b.id ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}

            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}