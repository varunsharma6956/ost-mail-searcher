import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CalendarIcon } from "lucide-react";

const DateRangePicker = ({ dateRange, setDateRange }) => {
  const [startYear, setStartYear] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [startDay, setStartDay] = useState("");
  const [endYear, setEndYear] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [endDay, setEndDay] = useState("");

  // Generate years from 2001 to 2025
  const years = [];
  for (let year = 2025; year >= 2001; year--) {
    years.push(year);
  }

  // Generate days based on month and year
  const getDaysInMonth = (year, month) => {
    if (!year || month === "") return 31;
    return new Date(parseInt(year), parseInt(month) + 1, 0).getDate();
  };

  const startDays = [];
  for (let day = 1; day <= getDaysInMonth(startYear, startMonth); day++) {
    startDays.push(day);
  }

  const endDays = [];
  for (let day = 1; day <= getDaysInMonth(endYear, endMonth); day++) {
    endDays.push(day);
  }

  // Reset date range when prop changes from parent
  useEffect(() => {
    if (!dateRange.start && !dateRange.end) {
      setStartYear("");
      setStartMonth("");
      setStartDay("");
      setEndYear("");
      setEndMonth("");
      setEndDay("");
    }
  }, [dateRange]);

  const months = [
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
  ];

  const presetRanges = [
    {
      label: "Last 7 Days",
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        return { start, end };
      },
    },
    {
      label: "Last 30 Days",
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return { start, end };
      },
    },
    {
      label: "Last 90 Days",
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 90);
        return { start, end };
      },
    },
    {
      label: "This Year",
      getValue: () => {
        const end = new Date();
        const start = new Date(end.getFullYear(), 0, 1);
        return { start, end };
      },
    },
  ];

  const handlePresetClick = (preset) => {
    const range = preset.getValue();
    setDateRange(range);
    // Update dropdowns to reflect preset
    setStartYear(range.start.getFullYear().toString());
    setStartMonth(range.start.getMonth().toString());
    setEndYear(range.end.getFullYear().toString());
    setEndMonth(range.end.getMonth().toString());
  };

  const handleStartYearChange = (year) => {
    setStartYear(year);
    setStartDay(""); // Reset day when year changes
    if (startMonth !== "" && startDay !== "") {
      const date = new Date(parseInt(year), parseInt(startMonth), parseInt(startDay), 0, 0, 0);
      setDateRange({ ...dateRange, start: date });
    }
  };

  const handleStartMonthChange = (month) => {
    setStartMonth(month);
    setStartDay(""); // Reset day when month changes
    if (startYear !== "" && startDay !== "") {
      const date = new Date(parseInt(startYear), parseInt(month), parseInt(startDay), 0, 0, 0);
      setDateRange({ ...dateRange, start: date });
    }
  };

  const handleStartDayChange = (day) => {
    setStartDay(day);
    if (startYear !== "" && startMonth !== "") {
      const date = new Date(parseInt(startYear), parseInt(startMonth), parseInt(day), 0, 0, 0);
      setDateRange({ ...dateRange, start: date });
    }
  };

  const handleEndYearChange = (year) => {
    setEndYear(year);
    setEndDay(""); // Reset day when year changes
    if (endMonth !== "" && endDay !== "") {
      const date = new Date(parseInt(year), parseInt(endMonth), parseInt(endDay), 23, 59, 59);
      setDateRange({ ...dateRange, end: date });
    }
  };

  const handleEndMonthChange = (month) => {
    setEndMonth(month);
    setEndDay(""); // Reset day when month changes
    if (endYear !== "" && endDay !== "") {
      const date = new Date(parseInt(endYear), parseInt(month), parseInt(endDay), 23, 59, 59);
      setDateRange({ ...dateRange, end: date });
    }
  };

  const handleEndDayChange = (day) => {
    setEndDay(day);
    if (endYear !== "" && endMonth !== "") {
      const date = new Date(parseInt(endYear), parseInt(endMonth), parseInt(day), 23, 59, 59);
      setDateRange({ ...dateRange, end: date });
    }
  };

  return (
    <div className="space-y-4">
      {/* Preset Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {presetRanges.map((preset) => (
          <Button
            key={preset.label}
            data-testid={`preset-${preset.label.toLowerCase().replace(/ /g, '-')}`}
            onClick={() => handlePresetClick(preset)}
            variant="outline"
            size="sm"
            className="border-gray-700 hover:bg-gray-800 text-gray-300 text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Custom Year-Month-Day Selection */}
      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-sm text-gray-400 flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Start Date
          </label>
          <div className="grid grid-cols-3 gap-2">
            <Select value={startYear} onValueChange={handleStartYearChange}>
              <SelectTrigger
                data-testid="start-year-select"
                className="bg-gray-800 border-gray-700 text-gray-300"
              >
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 max-h-[200px]">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()} className="text-gray-300">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={startMonth} onValueChange={handleStartMonthChange} disabled={!startYear}>
              <SelectTrigger
                data-testid="start-month-select"
                className="bg-gray-800 border-gray-700 text-gray-300"
              >
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 max-h-[200px]">
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value} className="text-gray-300">
                    {month.label.substring(0, 3)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={startDay} onValueChange={handleStartDayChange} disabled={!startMonth}>
              <SelectTrigger
                data-testid="start-day-select"
                className="bg-gray-800 border-gray-700 text-gray-300"
              >
                <SelectValue placeholder="Day" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 max-h-[200px]">
                {startDays.map((day) => (
                  <SelectItem key={day} value={day.toString()} className="text-gray-300">
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-400 flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4" />
            End Date
          </label>
          <div className="grid grid-cols-3 gap-2">
            <Select value={endYear} onValueChange={handleEndYearChange}>
              <SelectTrigger
                data-testid="end-year-select"
                className="bg-gray-800 border-gray-700 text-gray-300"
              >
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 max-h-[200px]">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()} className="text-gray-300">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={endMonth} onValueChange={handleEndMonthChange} disabled={!endYear}>
              <SelectTrigger
                data-testid="end-month-select"
                className="bg-gray-800 border-gray-700 text-gray-300"
              >
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 max-h-[200px]">
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value} className="text-gray-300">
                    {month.label.substring(0, 3)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={endDay} onValueChange={handleEndDayChange} disabled={!endMonth}>
              <SelectTrigger
                data-testid="end-day-select"
                className="bg-gray-800 border-gray-700 text-gray-300"
              >
                <SelectValue placeholder="Day" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 max-h-[200px]">
                {endDays.map((day) => (
                  <SelectItem key={day} value={day.toString()} className="text-gray-300">
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
