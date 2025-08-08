"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type SearchItem = { id: string; label: string; meta?: string }

export default function SearchCombobox({
  items = [],
  placeholder = "Search...",
  onSelect = () => {},
  buttonLabel = "Choose...",
}: {
  items?: SearchItem[]
  placeholder?: string
  onSelect?: (item: SearchItem) => void
  buttonLabel?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  const selected = items.find((i) => i.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          type="button"
        >
          {selected ? selected.label : buttonLabel}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command filter={(v, s) => (v.toLowerCase().includes(s.toLowerCase()) ? 1 : 0)}>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No match.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.label}
                  keywords={[item.meta || ""]}
                  onSelect={() => {
                    setValue(item.id)
                    onSelect(item)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === item.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col">
                    <span>{item.label}</span>
                    {item.meta && <span className="text-xs text-muted-foreground">{item.meta}</span>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
