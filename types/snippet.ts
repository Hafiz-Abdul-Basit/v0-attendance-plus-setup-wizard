export interface Snippet {
  _id?: string
  id: string
  title: string
  description: string
  category: string
  icon: string
  color: string
  content: string
  language: string
  tags: string[]
  isPublic: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface SnippetFolder {
  name: string
  icon: string
  color: string
  description: string
}

export const defaultFolders: Record<string, SnippetFolder> = {
  "IIS & Web Server": {
    name: "IIS & Web Server",
    icon: "Server",
    color: "bg-blue-600",
    description: "Web server configuration and management",
  },
  MongoDB: {
    name: "MongoDB",
    icon: "Database",
    color: "bg-green-600",
    description: "MongoDB database operations and configuration",
  },
  "SQL Server": {
    name: "SQL Server",
    icon: "Database",
    color: "bg-red-600",
    description: "SQL Server queries and database management",
  },
  "User Management": {
    name: "User Management",
    icon: "Users",
    color: "bg-purple-600",
    description: "User creation, roles, and security configuration",
  },
  Development: {
    name: "Development",
    icon: "Code2",
    color: "bg-orange-600",
    description: "Development tools and configurations",
  },
  Documentation: {
    name: "Documentation",
    icon: "BookOpen",
    color: "bg-indigo-600",
    description: "Reference materials and documentation",
  },
  "Tools & Apps": {
    name: "Tools & Apps",
    icon: "Wrench",
    color: "bg-teal-600",
    description: "Useful applications and utilities",
  },
  Custom: {
    name: "Custom",
    icon: "Star",
    color: "bg-yellow-600",
    description: "User-created custom snippets",
  },
}
