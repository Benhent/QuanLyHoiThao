"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Award, Building2 } from 'lucide-react'
import { useAuth } from '../../Context/AuthProviderContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DashboardData {
  authors: Array<{
    author_id: number
    first_name: string
    last_name: string
    articles: string | null
  }>
  articles: Array<{
    article_id: number
    title: string
    authors: string
    publication_date: string
  }>
  awards: any[]
  institutions: any[]
}

export default function EnhancedDashboard() {
  const [data, setData] = useState<DashboardData>({
    authors: [],
    articles: [],
    awards: [],
    institutions: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }

        const [authorsRes, articlesRes, awardsRes, institutionsRes] = await Promise.all([
          fetch('http://localhost:5174/Author', { headers }),
          fetch('http://localhost:5174/Article', { headers }),
          fetch('http://localhost:5174/Award', { headers }),
          fetch('http://localhost:5174/Institution', { headers })
        ])

        if (!authorsRes.ok || !articlesRes.ok || !awardsRes.ok || !institutionsRes.ok) {
          throw new Error('Failed to fetch data')
        }

        const [authors, articles, awards, institutions] = await Promise.all([
          authorsRes.json(),
          articlesRes.json(),
          awardsRes.json(),
          institutionsRes.json()
        ])

        setData({ authors, articles, awards, institutions })
      } catch (error) {
        setError('An error occurred while fetching data')
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [token])

  const stats = [
    { title: 'Authors', value: data.authors.length, icon: Users, color: 'text-blue-600' },
    { title: 'Articles', value: data.articles.length, icon: BookOpen, color: 'text-green-600' },
    { title: 'Awards', value: data.awards.length, icon: Award, color: 'text-yellow-600' },
    { title: 'Institutions', value: data.institutions.length, icon: Building2, color: 'text-purple-600' },
  ]

  const getTopAuthors = () => {
    const authorArticleCounts = data.authors.map(author => ({
      name: `${author.first_name} ${author.last_name}`,
      articles: author.articles ? author.articles.split(',').length : 0
    }))
    return authorArticleCounts
      .filter(author => author.articles > 0)
      .sort((a, b) => b.articles - a.articles)
      .slice(0, 5)
  }

  const getRecentArticles = () => {
    return data.articles
      .sort((a, b) => new Date(b.publication_date).getTime() - new Date(a.publication_date).getTime())
      .slice(0, 5)
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Authors Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Top Authors by Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getTopAuthors()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="articles" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Articles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Publication Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getRecentArticles().map((article) => (
                <TableRow key={article.article_id}>
                  <TableCell>{article.title}</TableCell>
                  <TableCell>{article.authors}</TableCell>
                  <TableCell>{new Date(article.publication_date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

