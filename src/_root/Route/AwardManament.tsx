import * as React from "react"
import {
  CaretSortIcon,
  ChevronDownIcon,
  DotsHorizontalIcon,
  PlusCircledIcon,
} from "@radix-ui/react-icons"
import { CalendarIcon } from 'lucide-react'
import { format, parseISO } from "date-fns"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "../../hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAuth } from '../../Context/AuthProviderContext'

interface Author {
  author_id: number
  full_name: string
}

interface Award {
  award_id: number
  name: string
  description: string
  date_received: string
  author_id: number
  author_name: string
}

export default function AwardsManagement() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [awards, setAwards] = React.useState<Award[]>([])
  const [authors, setAuthors] = React.useState<Author[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [newAward, setNewAward] = React.useState<Partial<Award>>({})
  const [editingAward, setEditingAward] = React.useState<Award | null>(null)
  const [date, setDate] = React.useState<Date | undefined>(undefined)

  const { token, isAuthenticated, logout } = useAuth()

  React.useEffect(() => {
    if (isAuthenticated && token) {
      fetchAwards()
      fetchAuthors()
    }
  }, [isAuthenticated, token])

  const fetchAuthors = async () => {
    try {
      const response = await fetch('http://localhost:5174/Author/GetFullName', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        if (response.status === 401) {
          logout()
          throw new Error('Your session has expired. Please log in again.')
        }
        throw new Error('Failed to fetch authors')
      }
      const data = await response.json()
      setAuthors(data)
    } catch (error) {
      console.error('Error fetching authors:', error)
      toast({
        title: "Error",
        description: "Failed to fetch authors. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchAwards = async () => {
    try {
      const response = await fetch('http://localhost:5174/Award', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        if (response.status === 401) {
          logout()
          throw new Error('Your session has expired. Please log in again.')
        }
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch awards')
      }
      const data = await response.json()
      
      const mappedAwards = Array.isArray(data) ? data.map((award: any) => ({
        award_id: award.award_id,
        name: award.name,
        description: award.description,
        date_received: award.date_received,
        author_id: award.author_id,
        author_name: award.author_name
      })) : []
      
      setAwards(mappedAwards)
    } catch (error) {
      console.error('Error fetching awards:', error)
      toast({
        title: "Error",
        description: "Failed to fetch awards. Please try again.",
        variant: "destructive",
      })
    }
  }

  const addAward = async () => {
    try {
      const response = await fetch('http://localhost:5174/Award/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newAward.name,
          description: newAward.description,
          date_received: date ? date.toISOString() : null,
          author_id: newAward.author_id || null
        }),
      })
      if (!response.ok) {
        if (response.status === 401) {
          logout()
          throw new Error('Your session has expired. Please log in again.')
        }
        throw new Error('Failed to add award')
      }
      const result = await response.json()
      if (result.message === 'Award created successfully') {
        setIsAddModalOpen(false)
        setNewAward({})
        setDate(undefined)
        fetchAwards()
        toast({
          title: "Success",
          description: "Award added successfully.",
        })
      } else {
        throw new Error(result.message || 'Failed to add award')
      }
    } catch (error) {
      console.error('Error adding award:', error)
      toast({
        title: "Error",
        description: "Failed to add award. Please try again.",
        variant: "destructive",
      })
    }
  }

  const updateAward = async () => {
    if (!editingAward) return
    try {
      const response = await fetch(`http://localhost:5174/Award/${editingAward.award_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...editingAward,
          date_received: date ? date.toISOString() : null,
          author_id: editingAward.author_id || null
        }),
      })
      if (!response.ok) {
        if (response.status === 401) {
          logout()
          throw new Error('Your session has expired. Please log in again.')
        }
        throw new Error('Failed to update award')
      }
      setIsEditModalOpen(false)
      setEditingAward(null)
      setDate(undefined)
      fetchAwards()
      toast({
        title: "Success",
        description: "Award updated successfully.",
      })
    } catch (error) {
      console.error('Error updating award:', error)
      toast({
        title: "Error",
        description: "Failed to update award. Please try again.",
        variant: "destructive",
      })
    }
  }

  const deleteAward = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:5174/Award/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        if (response.status === 401) {
          logout()
          throw new Error('Your session has expired. Please log in again.')
        }
        throw new Error('Failed to delete award')
      }
      fetchAwards()
      toast({
        title: "Success",
        description: "Award deleted successfully.",
      })
    } catch (error) {
      console.error('Error deleting award:', error)
      toast({
        title: "Error",
        description: "Failed to delete award. Please try again.",
        variant: "destructive",
      })
    }
  }

  const columns: ColumnDef<Award>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div>{row.getValue("description")}</div>,
    },
    {
      accessorKey: "date_received",
      header: "Date Received",
      cell: ({ row }) => {
        const date = row.getValue("date_received")
        return <div>{date ? format(parseISO(date as string), 'PP') : 'N/A'}</div>
      },
    },
    {
      accessorKey: "author_name",
      header: "Author",
      cell: ({ row }) => <div>{row.getValue("author_name")}</div>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const award = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                setEditingAward(award)
                setDate(award.date_received ? parseISO(award.date_received) : undefined)
                setIsEditModalOpen(true)
              }}>
                Edit Award
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => deleteAward(award.award_id)}
              >
                Delete Award
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: awards,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Filter awards..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto h-8">
                <PlusCircledIcon className="mr-2 h-4 w-4" />
                Add Award
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Award</DialogTitle>
                <DialogDescription>
                  Enter the details of the new award here. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newAward.name || ''}
                    onChange={(e) => setNewAward({...newAward, name: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Input
                    id="description"
                    value={newAward.description || ''}
                    onChange={(e) => setNewAward({...newAward, description: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date Received
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                          "col-span-3 justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="author" className="text-right">
                    Author
                  </Label>
                  <Select 
                    value={newAward.author_id?.toString()}
                    onValueChange={(value) => setNewAward({...newAward, author_id: parseInt(value)})}
                  >
                    <SelectTrigger id="author" className="col-span-3">
                      <SelectValue placeholder="Select an author" />
                    </SelectTrigger>
                    <SelectContent>
                      {authors.map((author) => (
                        <SelectItem key={author.author_id} value={author.author_id.toString()}>
                          {author.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={addAward}>Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                Columns <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {/* {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected. */}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Award</DialogTitle>
            <DialogDescription>
              Make changes to the award here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={editingAward?.name || ''}
                onChange={(e) => setEditingAward(prev => prev ? {...prev, name: e.target.value} : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Input
                id="edit-description"
                value={editingAward?.description || ''}
                onChange={(e) => setEditingAward(prev => prev ? {...prev, description: e.target.value} : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-date" className="text-right">
                Date Received
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="edit-date"
                    variant={"outline"}
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-author" className="text-right">
                Author
              </Label>
              <Select
                value={editingAward?.author_id?.toString()}
                onValueChange={(value) => setEditingAward(prev => prev ? {...prev, author_id: parseInt(value)} : null)}
              >
                <SelectTrigger id="edit-author" className="col-span-3">
                  <SelectValue placeholder="Select an author" />
                </SelectTrigger>
                <SelectContent>
                  {authors.map((author) => (
                    <SelectItem key={author.author_id} value={author.author_id.toString()}>
                      {author.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={updateAward}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}