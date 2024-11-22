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
import { Input } from "@/components/ui/input"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useAuth } from '../../Context/AuthProviderContext'

interface Author {
  author_id: number
  first_name: string
  last_name: string
  email: string
  address: string | null
  bio: string
  dateOfbirth: string
  institution_id: number | null
  institution_name: string
  articles: string
  awards: string
}

interface Institution {
  institution_id: number
  name: string
}

export default function AuthorManagement() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [authors, setAuthors] = React.useState<Author[]>([])
  const [institutions, setInstitutions] = React.useState<Institution[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false)
  const [newAuthor, setNewAuthor] = React.useState<Partial<Author>>({})
  const [editingAuthor, setEditingAuthor] = React.useState<Author | null>(null)
  const [date, setDate] = React.useState<Date>()

  const { token, isAuthenticated, logout } = useAuth()

  const fetchAuthors = async () => {
    try {
      const response = await fetch('http://localhost:5174/Author', {
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

  const fetchInstitutions = async () => {
    try {
      const response = await fetch('http://localhost:5174/Institution', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch institutions')
      }
      const data = await response.json()
      setInstitutions(data)
    } catch (error) {
      console.error('Error fetching institutions:', error)
      toast({
        title: "Error",
        description: "Failed to fetch institutions. Please try again.",
        variant: "destructive",
      })
    }
  }

  React.useEffect(() => {
    if (isAuthenticated && token) {
      fetchAuthors()
      fetchInstitutions()
    }
  }, [isAuthenticated, token])

  const validateAuthor = (author: Partial<Author>): string[] => {
    const errors: string[] = []
    if (!author.first_name) errors.push("First name is required")
    if (!author.last_name) errors.push("Last name is required")
    if (!author.email) errors.push("Email is required")
    else if (!/\S+@\S+\.\S+/.test(author.email)) errors.push("Email is invalid")
    if (!date) errors.push("Date of birth is required")
    return errors
  }
  const addAuthor = async () => {
    try {
      const response = await fetch('http://localhost:5174/Author/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newAuthor,
          dateOfbirth: date?.toISOString()
        }),
      })
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error('Failed to add author')
      }
      setIsAddModalOpen(false)
      setNewAuthor({})
      setDate(undefined)
      fetchAuthors()
      toast({
        title: "Success",
        description: "Author added successfully.",
      })
    } catch (error) {
      console.error('Error adding author:', error)
      toast({
        title: "Error",
        description: "Failed to add author. Please try again.",
        variant: "destructive",
      })
    }
  }

  const updateAuthor = async () => {
    if (!editingAuthor) return

    const errors = validateAuthor(editingAuthor)
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(". "),
        variant: "destructive",
      })
      return
    }

    setIsConfirmDialogOpen(true)
  }
  const confirmUpdate = async () => {
    if (!editingAuthor) return
    try {
      const response = await fetch(`http://localhost:5174/Author/${editingAuthor.author_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...editingAuthor,
          dateOfbirth: date?.toISOString()
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update author')
      }
      setIsEditModalOpen(false)
      setIsConfirmDialogOpen(false)
      setEditingAuthor(null)
      setDate(undefined)
      fetchAuthors()
      toast({
        title: "Success",
        description: "Author updated successfully.",
      })
    } catch (error) {
      console.error('Error updating author:', error)
      toast({
        title: "Error",
        description: "Failed to update author. Please try again.",
        variant: "destructive",
      })
    }
  }

  const deleteAuthor = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:5174/Author/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to delete author')
      }
      fetchAuthors()
      toast({
        title: "Success",
        description: "Author deleted successfully.",
      })
    } catch (error) {
      console.error('Error deleting author:', error)
      toast({
        title: "Error",
        description: "Failed to delete author. Please try again.",
        variant: "destructive",
      })
    }
  }

  const columns: ColumnDef<Author>[] = [
    {
      accessorKey: "first_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            First Name
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="capitalize">{row.getValue("first_name")}</div>,
    },
    {
      accessorKey: "last_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Last Name
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="capitalize">{row.getValue("last_name")}</div>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div>{row.getValue("email")}</div>,
    },
    {
      accessorKey: "bio",
      header: "Bio",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate" title={row.getValue("bio")}>
          {row.getValue("bio") || "No bio available"}
        </div>
      ),
    },
    {
      accessorKey: "dateOfbirth",
      header: "Date of Birth",
      cell: ({ row }) => {
        const date = row.getValue("dateOfbirth")
        return <div>{date ? format(parseISO(date as string), 'PP') : 'N/A'}</div>
      },
    },
    {
      accessorKey: "institution_name",
      header: "Institution",
      cell: ({ row }) => {
        const institutionName = row.original.institution_name;
        return <div>{institutionName || 'N/A'}</div>; 
      },
    },
    {
      accessorKey: "articles",
      header: "Articles",
      cell: ({ row }) => {
        const articles = row.original.articles
        if (typeof articles === 'string') {
          return <div>{articles}</div>;
        }
    
        return <div>No articles</div>;
      },
    },
    {
      accessorKey: "awards",
      header: "Awards",
      cell: ({ row }) => {
        const awards = row.original.awards;

        if (typeof awards === 'string') {
          return <div>{awards}</div>;
        }
    
        return <div>No awards</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const author = row.original
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
              <DropdownMenuItem
                onClick={() => {
                  setEditingAuthor(author)
                  setDate(author.dateOfbirth ? parseISO(author.dateOfbirth) : undefined)
                  setIsEditModalOpen(true)
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => deleteAuthor(author.author_id)}
                className="text-red-600"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: authors,
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
          placeholder="Filter authors..."
          value={(table.getColumn("last_name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("last_name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto h-8">
                <PlusCircledIcon className="mr-2 h-4 w-4" />
                Add Author
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Add New Author</DialogTitle>
                <DialogDescription>
                  Enter the details of the new author here. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="first_name" className="text-right">
                    First Name
                  </Label>
                  <Input
                    id="first_name"
                    value={newAuthor.first_name || ''}
                    onChange={(e) => setNewAuthor({...newAuthor, first_name: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="last_name" className="text-right">
                    Last Name
                  </Label>
                  <Input
                    id="last_name"
                    value={newAuthor.last_name || ''}
                    onChange={(e) => setNewAuthor({...newAuthor, last_name: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newAuthor.email || ''}
                    onChange={(e) => setNewAuthor({...newAuthor, email: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={newAuthor.address || ''}
                    onChange={(e) => setNewAuthor({...newAuthor, address: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bio" className="text-right">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={newAuthor.bio || ''}
                    onChange={(e) => setNewAuthor({...newAuthor, bio: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dateOfBirth" className="text-right">
                    Date of Birth
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="dateOfBirth"
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
                  <Label htmlFor="institution" className="text-right">
                    Institution
                  </Label>
                  <Select
                    value={newAuthor.institution_id?.toString()}
                    onValueChange={(value) => setNewAuthor({...newAuthor, institution_id: parseInt(value)})}
                  >
                    <SelectTrigger id="institution" className="col-span-3">
                      <SelectValue placeholder="Select an institution" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutions.map((institution) => (
                        <SelectItem key={institution.institution_id} value={institution.institution_id.toString()}>
                          {institution.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={addAuthor}>Save changes</Button>
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
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Edit Author</DialogTitle>
            <DialogDescription>
              Make changes to the author here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-first-name" className="text-right">
                First Name
              </Label>
              <Input
                id="edit-first-name"
                value={editingAuthor?.first_name || ''}
                onChange={(e) => setEditingAuthor(prev => prev ? {...prev, first_name: e.target.value} : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-last-name" className="text-right">
                Last Name
              </Label>
              <Input
                id="edit-last-name"
                value={editingAuthor?.last_name || ''}
                onChange={(e) => setEditingAuthor(prev => prev ? {...prev, last_name: e.target.value} : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={editingAuthor?.email || ''}
                onChange={(e) => setEditingAuthor(prev => prev ? {...prev, email: e.target.value} : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-address" className="text-right">
                Address
              </Label>
              <Input
                id="edit-address"
                value={editingAuthor?.address || ''}
                onChange={(e) => setEditingAuthor(prev => prev ? {...prev, address: e.target.value} : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-bio" className="text-right">
                Bio
              </Label>
              <Textarea
                id="edit-bio"
                value={editingAuthor?.bio || ''}
                onChange={(e) => setEditingAuthor(prev => prev ? {...prev, bio: e.target.value} : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-dateOfBirth" className="text-right">
                Date of Birth
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="edit-dateOfBirth"
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
              <Label htmlFor="edit-institution" className="text-right">
                Institution
              </Label>
              <Select
                onValueChange={(value) => setEditingAuthor(prev => prev ? {...prev, institution_id: parseInt(value)} : null)}
                defaultValue={editingAuthor?.institution_id?.toString()}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select an institution" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((institution) => (
                    <SelectItem key={institution.institution_id} value={institution.institution_id.toString()}>
                      {institution.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={updateAuthor}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will update the author's information. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUpdate}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}