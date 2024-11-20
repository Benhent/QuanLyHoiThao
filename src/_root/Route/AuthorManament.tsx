import * as React from "react"
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
import { CaretSortIcon, ChevronDownIcon, DotsHorizontalIcon, PlusCircledIcon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from '../../Context/AuthProviderContext'
import { toast } from "../../hooks/use-toast"

type Author = {
  author_id: string
  first_name: string
  last_name: string
  email: string
  address: string
  institution_id: number
  name: string
  bio: string
  dateOfbirth: string
  awards: string
  articles: string
}

type Institution = {
  id: number
  name: string
}

export default function AuthorTable() {
  const { token, isAuthenticated, logout } = useAuth()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [authors, setAuthors] = React.useState<Author[]>([])
  const [institutions, setInstitutions] = React.useState<Institution[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [newAuthor, setNewAuthor] = React.useState<Partial<Author>>({})
  const [editingAuthor, setEditingAuthor] = React.useState<Author | null>(null)

  const fetchAuthors = React.useCallback(async () => {
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
  }, [token, logout])

  const fetchInstitutions = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:5174/Institution', {
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
    } finally {
      setIsLoading(false)
    }
  }, [token, logout])

  React.useEffect(() => {
    if (isAuthenticated && token) {
      fetchAuthors()
      fetchInstitutions()
    }
  }, [isAuthenticated, token, fetchAuthors, fetchInstitutions])

  const addAuthor = async (author: Partial<Author>) => {
    try {
      const response = await fetch('http://localhost:5174/Author/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(author)
      })
      if (!response.ok) {
        if (response.status === 401) {
          logout()
          throw new Error('Your session has expired. Please log in again.')
        }
        throw new Error('Failed to add author')
      }
      await fetchAuthors()
      setIsAddModalOpen(false)
      setNewAuthor({})
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

  const updateAuthor = async (author: Author) => {
    try {
      const response = await fetch(`http://localhost:5174/Author/${author.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(author)
      })
      if (!response.ok) {
        if (response.status === 401) {
          logout()
          throw new Error('Your session has expired. Please log in again.')
        }
        throw new Error('Failed to update author')
      }
      await fetchAuthors()
      setIsEditModalOpen(false)
      setEditingAuthor(null)
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

  const deleteAuthor = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5174/Author/${id}`, {
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
        throw new Error('Failed to delete author')
      }
      await fetchAuthors()
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
      header: "Last Name",
      cell: ({ row }) => <div className="capitalize">{row.getValue("last_name")}</div>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div>{row.getValue("email")}</div>,
    },
    {
      accessorKey: "name",
      header: "Institution",
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "awards",
      header: "Awards",
      cell: ({ row }) => <div>{row.getValue("awards")}</div>,
    },
    {
      accessorKey: "articles",
      header: "Articles",
      cell: ({ row }) => <div>{row.getValue("articles")}</div>,
    },
    {
      id: "actions",
      enableHiding: false,
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
              <DropdownMenuItem onClick={() => {
                setEditingAuthor(author)
                setIsEditModalOpen(true)
              }}>
                Edit Author
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => deleteAuthor(author.author_id)}
              >
                Delete Author
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
          placeholder="Filter emails..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
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
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Author</DialogTitle>
                <DialogDescription>
                  Enter the details of the new author here. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="firstName" className="text-right">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={newAuthor.first_name || ''}
                    onChange={(e) => setNewAuthor({...newAuthor, first_name: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lastName" className="text-right">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
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
                  <Label htmlFor="institutionId" className="text-right">
                    Institution
                  </Label>
                  {isLoading ? (
                    <div className="col-span-3">Loading institutions...</div>
                  ) : institutions.length > 0 ? (
                    <Select 
                      value={newAuthor.institution_id?.toString()}
                      onValueChange={(value) => setNewAuthor({...newAuthor, institution_id: parseInt(value)})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select an institution" />
                      </SelectTrigger>
                      <SelectContent>
                        {institutions.map((institution) => (
                          <SelectItem key={institution.id} value={institution.id.toString()}>
                            {institution.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="col-span-3">No institutions available</div>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bio" className="text-right">
                    Bio
                  </Label>
                  <Input
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
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={newAuthor.dateOfbirth || ''}
                    onChange={(e) => setNewAuthor({...newAuthor, dateOfbirth: e.target.value})}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={() => addAuthor(newAuthor)}>Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto h-8">
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
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
            <DialogTitle>Edit Author</DialogTitle>
            <DialogDescription>
              Make changes to the author here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-firstName" className="text-right">
                First Name
              </Label>
              <Input
                id="edit-firstName"
                value={editingAuthor?.first_name || ''}
                onChange={(e) => setEditingAuthor(prev => prev ? {...prev, firstName: e.target.value} : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-lastName" className="text-right">
                Last Name
              </Label>
              <Input
                id="edit-lastName"
                value={editingAuthor?.last_name || ''}
                onChange={(e) => setEditingAuthor(prev => prev ? {...prev, lastName: e.target.value} : null)}
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
              <Label htmlFor="edit-institutionId" className="text-right">
                Institution
              </Label>
              {isLoading ? (
                <div className="col-span-3">Loading institutions...</div>
              ) : institutions.length > 0 ? (
                <Select 
                  value={editingAuthor?.institution_id?.toString()}
                  onValueChange={(value) => setEditingAuthor(prev => prev ? {...prev, institutionId: parseInt(value)} : null)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select an institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((institution) => (
                      <SelectItem key={institution.id} value={institution.id.toString()}>
                        {institution.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="col-span-3">No institutions available</div>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-bio" className="text-right">
                Bio
              </Label>
              <Input
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
              <Input
                id="edit-dateOfBirth"
                type="date"
                value={editingAuthor?.dateOfbirth || ''}
                onChange={(e) => setEditingAuthor(prev => prev ? {...prev, dateOfBirth: e.target.value} : null)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={() => editingAuthor && updateAuthor(editingAuthor)}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}