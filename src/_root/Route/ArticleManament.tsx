import * as React from "react"
import {
  CaretSortIcon,
  ChevronDownIcon,
  DotsHorizontalIcon,
  PlusCircledIcon,
} from "@radix-ui/react-icons"
import { CalendarIcon, X } from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "../../hooks/use-toast"
import { useAuth } from "../../Context/AuthProviderContext"

interface Author {
  author_id: number
  full_name: string
}

interface Category {
  category_id: number
  name: string
}

interface Article {
  article_id: number
  title: string
  content: string
  publication_date: string
  category_id: number
  category_name: string
  authors: string
}

export default function ArticleManagement() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [articles, setArticles] = React.useState<Article[]>([])
  const [authors, setAuthors] = React.useState<Author[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [newArticle, setNewArticle] = React.useState<Partial<Article>>({})
  const [editingArticle, setEditingArticle] = React.useState<Article | null>(null)
  const [selectedAuthors, setSelectedAuthors] = React.useState<string[]>([])
  const [date, setDate] = React.useState<Date | undefined>(undefined)

  const { token, isAuthenticated, logout } = useAuth()
  const { toast } = useToast()

  React.useEffect(() => {
    if (isAuthenticated && token) {
      fetchArticles()
      fetchAuthors()
      fetchCategories()
    }
  }, [isAuthenticated, token])

  const fetchArticles = async () => {
    try {
      const response = await fetch('http://localhost:5174/Article', {
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
        throw new Error('Failed to fetch articles')
      }
      const data = await response.json()
      setArticles(data)
    } catch (error) {
      console.error('Error fetching articles:', error)
      toast({
        title: "Error",
        description: "Failed to fetch articles. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchAuthors = async () => {
    try {
      const response = await fetch('http://localhost:5174/Author/GetFullName', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
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

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5174/Category', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast({
        title: "Error",
        description: "Failed to fetch categories. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchAuthorDetails = async (authorIds: string[]) => {
    try {
      const response = await fetch(`http://localhost:5174/Author/GetByIds?ids=${authorIds.join(',')}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch author details');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching author details:', error);
      return [];
    }
  };

  const addArticle = async () => {
    try {
      const response = await fetch('http://localhost:5174/Article/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newArticle.title,
          content: newArticle.content,
          publication_date: date?.toISOString(),
          category_id: newArticle.category_id,
          author_id: selectedAuthors.join(',')
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to add article')
      }
      setIsAddModalOpen(false)
      setNewArticle({})
      setSelectedAuthors([])
      setDate(undefined)
      fetchArticles()
      toast({
        title: "Success",
        description: "Article added successfully.",
      })
    } catch (error) {
      console.error('Error adding article:', error)
      toast({
        title: "Error",
        description: "Failed to add article. Please try again.",
        variant: "destructive",
      })
    }
  }

  const updateArticle = async () => {
    if (!editingArticle) return
    try {
      const response = await fetch(`http://localhost:5174/Article/${editingArticle.article_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editingArticle.title,
          content: editingArticle.content,
          publication_date: date?.toISOString(),
          category_id: editingArticle.category_id,
          author_id: selectedAuthors.length > 0 ? selectedAuthors.join(',') : null
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to update article')
      }
      setIsEditModalOpen(false)
      setEditingArticle(null)
      setSelectedAuthors([])
      setDate(undefined)
      fetchArticles()
      toast({
        title: "Success",
        description: "Article updated successfully.",
      })
    } catch (error) {
      console.error('Error updating article:', error)
      toast({
        title: "Error",
        description: "Failed to update article. Please try again.",
        variant: "destructive",
      })
    }
  }

  const deleteArticle = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:5174/Article/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to delete article')
      }
      fetchArticles()
      toast({
        title: "Success",
        description: "Article deleted successfully.",
      })
    } catch (error) {
      console.error('Error deleting article:', error)
      toast({
        title: "Error",
        description: "Failed to delete article. Please try again.",
        variant: "destructive",
      })
    }
  }

  const columns: ColumnDef<Article>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
    },
    {
      accessorKey: "content",
      header: "Content",
      cell: ({ row }) => (
        <div className="max-w-[500px] truncate">
          {row.getValue("content")}
        </div>
      ),
    },
    {
      accessorKey: "publication_date",
      header: "Publication Date",
      cell: ({ row }) => {
        const date = row.getValue("publication_date")
        return <div>{date ? format(parseISO(date as string), 'PP') : 'N/A'}</div>
      },
    },
    {
      accessorKey: "category_name",
      header: "Category",
      cell: ({ row }) => <div>{row.getValue("category_name")}</div>,
    },
    {
      accessorKey: "authors",
      header: "Authors",
      cell: ({ row }) => <div>{row.getValue("authors")}</div>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const article = row.original

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
              <DropdownMenuItem onClick={async () => {
                setEditingArticle(article);
                setDate(article.publication_date ? parseISO(article.publication_date) : undefined);
                if (article.authors) {
                  const authorIds = article.authors.split(',').map(a => a.trim());
                  const authorDetails = await fetchAuthorDetails(authorIds);
                  setSelectedAuthors(authorDetails.map((author: Author) => author.author_id.toString()));
                }
                setIsEditModalOpen(true);
              }}>
                Edit Article
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => deleteArticle(article.article_id)}
              >
                Delete Article
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: articles,
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
          placeholder="Filter articles..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto h-8">
                <PlusCircledIcon className="mr-2 h-4 w-4" />
                Add Article
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Add New Article</DialogTitle>
                <DialogDescription>
                  Enter the details of the new article here. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={newArticle.title || ''}
                    onChange={(e) => setNewArticle({...newArticle, title: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="content" className="text-right">
                    Content
                  </Label>
                  <Textarea
                    id="content"
                    value={newArticle.content || ''}
                    onChange={(e) => setNewArticle({...newArticle, content: e.target.value})}
                    className="col-span-3"
                    rows={5}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Publication Date
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
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <Select
                    value={newArticle.category_id?.toString()}
                    onValueChange={(value) => setNewArticle({...newArticle, category_id: parseInt(value)})}
                  >
                    <SelectTrigger id="category" className="col-span-3">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.category_id} value={category.category_id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="authors" className="text-right">
                    Authors
                  </Label>
                  <div className="col-span-3">
                    <Select
                      onValueChange={(value) => {
                        if (!selectedAuthors.includes(value)) {
                          setSelectedAuthors([...selectedAuthors, value]);
                        }
                      }}
                    >
                      <SelectTrigger id="authors">
                        <SelectValue placeholder="Select authors" />
                      </SelectTrigger>
                      <SelectContent>
                        {authors.map((author) => (
                          <SelectItem key={author.author_id} value={author.author_id.toString()}>
                            {author.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedAuthors.map((authorId) => {
                        const author = authors.find(a => a.author_id.toString() === authorId);
                        return (
                          <div
                            key={authorId}
                            className="flex items-center gap-2 rounded-md bg-secondary px-2 py-1 text-sm"
                          >
                            {author?.full_name || 'Unknown Author'}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0"
                              onClick={() => setSelectedAuthors(selectedAuthors.filter(id => id !== authorId))}
                            >
                              <span className="sr-only">Remove author</span>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={addArticle}>Save changes</Button>
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
      <div className="flex items-center justify-end py-4">
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
            <DialogTitle>Edit Article</DialogTitle>
            <DialogDescription>
              Make changes to the article here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-title" className="text-right">
                Title
              </Label>
              <Input
                id="edit-title"
                value={editingArticle?.title || ''}
                onChange={(e) => setEditingArticle(prev => prev ? {...prev, title: e.target.value} : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-content" className="text-right">
                Content
              </Label>
              <Textarea
                id="edit-content"
                value={editingArticle?.content || ''}
                onChange={(e) => setEditingArticle(prev => prev ? {...prev, content: e.target.value} : null)}
                className="col-span-3"
                rows={5}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-date" className="text-right">
                Publication Date
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
              <Label htmlFor="edit-category" className="text-right">
                Category
              </Label>
              <Select
                value={editingArticle?.category_id?.toString()}
                onValueChange={(value) => setEditingArticle(prev => prev ? {...prev, category_id: parseInt(value)} : null)}
              >
                <SelectTrigger id="edit-category" className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.category_id} value={category.category_id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-authors" className="text-right">
                Authors
              </Label>
              <div className="col-span-3">
                <Select
                  onValueChange={(value) => {
                    if (!selectedAuthors.includes(value)) {
                      setSelectedAuthors([...selectedAuthors, value]);
                    }
                  }}
                >
                  <SelectTrigger id="edit-authors">
                    <SelectValue placeholder="Select authors" />
                  </SelectTrigger>
                  <SelectContent>
                    {authors.map((author) => (
                      <SelectItem key={author.author_id} value={author.author_id.toString()}>
                        {author.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedAuthors.map((authorId) => {
                    const author = authors.find(a => a.author_id.toString() === authorId);
                    if (!author) return null;
                    return (
                      <div
                        key={authorId}
                        className="flex items-center gap-2 rounded-md bg-secondary px-2 py-1 text-sm"
                      >
                        {author.full_name}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0"
                          onClick={() => setSelectedAuthors(selectedAuthors.filter(id => id !== authorId))}
                        >
                          <span className="sr-only">Remove author</span>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={updateArticle}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}