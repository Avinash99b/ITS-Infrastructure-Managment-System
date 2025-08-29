"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import {ActiveModifiers, DateRange, SelectRangeEventHandler} from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {MouseEvent} from "react";
import {toast} from "@/hooks/use-toast";

type DateRangePickerProps = React.ComponentProps<"div"> & {
  date?: DateRange;
  onUpdate: (values: { range: DateRange }) => void;
  initialDateFrom?: string;
  initialDateTo?: string;
  align?: "start" | "center" | "end";
  locale?: string;
  showCompare?: boolean;
};


export function DateRangePicker({
  className,
  date:pDate,
  onUpdate,
  initialDateFrom,
  initialDateTo,
  align = "start",
  locale = "en-US",
  showCompare = false,
}: DateRangePickerProps) {
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: initialDateFrom ? new Date(initialDateFrom) : undefined,
        to: initialDateTo ? new Date(initialDateTo) : undefined,
      });

  const handleUpdate = (range: DateRange|undefined,selectedDay:Date,activeModifiers: ActiveModifiers, e: MouseEvent) => {
    setDate(range);
    if(!range){
        toast({
            title:"Please Select a valid Range",
        })
        return;
    }
    if(onUpdate) {
        onUpdate({ range });
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal transition-all duration-300",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleUpdate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
