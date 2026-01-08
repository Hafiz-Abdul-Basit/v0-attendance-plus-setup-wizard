"use client";

import React from "react";
import type { ReactElement } from "react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Code2,
  Database,
  Settings,
  Terminal,
  FileText,
  Users,
  Shield,
  UserPlus,
  Key,
  BookOpen,
  Server,
  Wrench,
  Star,
  Download,
  Heart,
  Clock,
  Grid3X3,
  List,
  Tag,
  Zap,
  RefreshCw,
  FileSpreadsheet,
  Table,
  Plus,
  Trash2,
  X,
  Search,
  Folder,
  FolderOpen,
  Copy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { snippetsData } from "@/data/snippets";

// Icon mapping for dynamic icons
const iconMap: Record<string, ReactElement> = {
  Code2,
  Database,
  Settings,
  Terminal,
  FileText,
  Users,
  Shield,
  UserPlus,
  Key,
  BookOpen,
  Server,
  Wrench,
  Star,
  Zap,
};

// Folder definitions
const folders = {
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
  "Quick Scripts": {
    name: "Quick Scripts",
    icon: "Zap",
    color: "bg-yellow-600",
    description: "Fast utility scripts and one-liners",
  },
};

type ViewMode = "grid" | "list";

/** Props from the parent wizard */
interface SnippetsContentProps {
  filteredSnippetId?: string | null;
  onClearFilter?: () => void;
}

// Interactive Table Component
function InteractiveTable({
  snippet,
  onClose,
}: {
  snippet: any;
  onClose: () => void;
}) {
  const [tableData, setTableData] = useState(snippet.tableData || []);
  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");

  const downloadAsCSV = () => {
    const headers = Object.keys(tableData[0] || {});
    const csvContent = [
      headers.join(","),
      ...tableData.map((row) =>
        headers.map((header) => `"${row[header]}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user-management-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsExcel = () => {
    // Simple Excel format (actually CSV with .xlsx extension for demo)
    const headers = Object.keys(tableData[0] || {});
    const csvContent = [
      headers.join("\t"),
      ...tableData.map((row) =>
        headers.map((header) => row[header]).join("\t")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user-management-template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const addNewRow = () => {
    const newRow = Object.keys(tableData[0] || {}).reduce((acc, key) => {
      acc[key] = "";
      return acc;
    }, {} as any);
    setTableData([...tableData, newRow]);
  };

  const deleteRow = (index: number) => {
    setTableData(tableData.filter((_, i) => i !== index));
  };

  const startEdit = (rowIndex: number, colKey: string, currentValue: any) => {
    setEditingCell({ row: rowIndex, col: colKey });
    setEditValue(String(currentValue));
  };

  const saveEdit = () => {
    if (editingCell) {
      const newData = [...tableData];
      newData[editingCell.row][editingCell.col] = editValue;
      setTableData(newData);
      setEditingCell(null);
      setEditValue("");
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  if (!tableData.length) return null;

  const headers = Object.keys(tableData[0]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl flex items-center justify-center">
              <Table className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                User Management Data Table
              </h2>
              <p className="text-gray-600">
                Edit data and download as Excel or CSV
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadAsCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-50 to-indigo-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    #
                  </th>
                  {headers.map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {rowIndex + 1}
                    </td>
                    {headers.map((header) => (
                      <td key={header} className="px-4 py-3 text-sm">
                        {editingCell?.row === rowIndex &&
                        editingCell?.col === header ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit();
                                if (e.key === "Escape") cancelEdit();
                              }}
                              autoFocus
                            />
                            <button
                              onClick={saveEdit}
                              className="text-green-600 hover:text-green-800"
                            >
                              ✓
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-red-600 hover:text-red-800"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer hover:bg-purple-50 px-2 py-1 rounded transition-colors"
                            onClick={() =>
                              startEdit(rowIndex, header, row[header])
                            }
                          >
                            {row[header] || (
                              <span className="text-gray-400 italic">
                                Click to edit
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => deleteRow(rowIndex)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={addNewRow}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Row
            </button>
            <div className="text-sm text-gray-600">
              {tableData.length} rows • Click any cell to edit • Use Enter to
              save, Escape to cancel
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SnippetsContent({
  filteredSnippetId,
  onClearFilter,
}: SnippetsContentProps) {
  // State management
  const [selectedSnippetCode, setSelectedSnippetCode] = useState<string | null>(
    null
  );
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false);
  const [currentSnippet, setCurrentSnippet] = useState<any>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showInteractiveTable, setShowInteractiveTable] = useState(false);
  const [interactiveSnippet, setInteractiveSnippet] = useState<any>(null);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem("snippet-favorites");
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: Set<string>) => {
    localStorage.setItem(
      "snippet-favorites",
      JSON.stringify([...newFavorites])
    );
    setFavorites(newFavorites);
  };

  /** ------------------------------------------------------------
   *  Helpers
   *  ------------------------------------------------------------ */
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!", {
      style: { background: "#10b981", color: "white", border: "none" },
    });
  };

  const toggleFavorite = (snippetId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(snippetId)) {
      newFavorites.delete(snippetId);
      toast.success("Removed from favorites");
    } else {
      newFavorites.add(snippetId);
      toast.success("Added to favorites");
    }
    saveFavorites(newFavorites);
  };

  const exportSnippets = () => {
    const dataStr = JSON.stringify(snippetsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "snippets-export.json";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Snippets exported successfully!");
  };

  /** Get filtered snippets */
  const getFilteredSnippets = () => {
    let filtered = snippetsData;

    // Filter by parent-supplied snippet ID first
    if (filteredSnippetId) {
      return filtered.filter((s) => s.id === filteredSnippetId);
    }

    // Filter by selected folder
    if (selectedFolder) {
      filtered = filtered.filter((s) => s.category === selectedFolder);
    }

    // Filter by search query
    if (localSearchQuery.trim()) {
      const query = localSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.content.toLowerCase().includes(query) ||
          s.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const filteredSnippets = getFilteredSnippets();

  /** Load snippet content and open modal */
  const handleSnippetClick = (snippet: any) => {
    if (snippet.isInteractive && snippet.content === "INTERACTIVE_TABLE") {
      setInteractiveSnippet(snippet);
      setShowInteractiveTable(true);
      return;
    }

    setCurrentSnippet(snippet);
    setSelectedSnippetCode(snippet.content);
    setIsSnippetModalOpen(true);
    snippet.lastUsed = new Date();
  };

  // Get folder statistics
  const getFolderStats = (folderName: string) => {
    return snippetsData.filter((s) => s.category === folderName).length;
  };

  // Handle search with history
  const handleSearch = (query: string) => {
    setLocalSearchQuery(query);
    if (query.trim() && !searchHistory.includes(query.trim())) {
      const newHistory = [query.trim(), ...searchHistory.slice(0, 4)];
      setSearchHistory(newHistory);
      localStorage.setItem("search-history", JSON.stringify(newHistory));
    }
  };

  // Load search history
  useEffect(() => {
    const savedHistory = localStorage.getItem("search-history");
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  /** ------------------------------------------------------------
   *  Render
   *  ------------------------------------------------------------ */
  return (
    <div>
      {/* Top Search Bar */}
      <div className="mb-8 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">
              <Search className="w-6 h-6" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              🔍 Search Snippets
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Instantly find snippets by title, description, content, or tags.{" "}
              <span className="text-lg font-semibold text-purple-600 underline decoration-purple-600">
                Develop By Abdul Basit
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Stats Cards */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg px-4 py-1 border border-purple-200 flex items-center gap-3">
              <div className="text-lg font-bold text-purple-600">
                {snippetsData.length}
              </div>
              <div className="text-sm text-gray-600">Snippets</div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-lg px-4 py-1 border border-indigo-200 flex items-center gap-3">
              <div className="text-lg font-bold text-indigo-600">
                {Object.keys(folders).length}
              </div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-lg px-4 py-1 border border-blue-200 flex items-center gap-3">
              <div className="text-lg font-bold text-blue-600">
                {favorites.size}
              </div>
              <div className="text-sm text-gray-600">Favorites</div>
            </div>

            {/* Export button unchanged */}
            <Button
              variant="outline"
              size="sm"
              onClick={exportSnippets}
              className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-100 bg-white/70 backdrop-blur-sm shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export All
            </Button>
          </div>
        </div>

        {/* Enhanced Search Input */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-500" />
            <div className="h-4 w-px bg-purple-300"></div>
          </div>
          <Input
            value={localSearchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="🚀 Search snippets by title, description, content, or tags..."
            className="pl-16 pr-12 py-4 text-base border-2 border-purple-300 focus:border-purple-500 focus:ring-purple-300 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-200 placeholder:text-gray-500"
          />
          {localSearchQuery && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLocalSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-purple-100 text-purple-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          )}

          {/* Search shortcuts hint */}
          <div className="absolute right-14 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 text-xs text-gray-500">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
              Ctrl
            </kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">K</kbd>
          </div>
        </div>

        {/* Search History with better styling */}
        {/* {searchHistory.length > 0 && !localSearchQuery && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-2 text-purple-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Recent searches:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {searchHistory.map((term, index) => (
                <button
                  key={index}
                  onClick={() => setLocalSearchQuery(term)}
                  className="px-3 py-1.5 bg-white/80 backdrop-blur-sm text-purple-700 rounded-lg text-xs hover:bg-purple-100 transition-all duration-200 border border-purple-200 shadow-sm hover:shadow-md"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )} */}

        {/* Folder Navigation */}
        {!filteredSnippetId && !localSearchQuery && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3 mt-3">
              <div className="flex items-center gap-3">
                <Folder className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Browse by Category
                </h3>
              </div>

              {/* Category controls on the right */}
              <div className="flex items-center gap-3">
                {selectedFolder && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white bg-purple-600 px-3 py-2 rounded-lg border border-purple-600">
                      📂 {filteredSnippets.length} snippet
                      {filteredSnippets.length !== 1 ? "s" : ""} in{" "}
                      {selectedFolder}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFolder(null)}
                      className="gap-2 text-purple-600 border-purple-300 hover:text-white hover:bg-purple-600 hover:border-purple-600 transition-all duration-200"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reset
                    </Button>
                  </div>
                )}

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    View:
                  </span>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2.5 transition-all duration-200 ${
                        viewMode === "grid"
                          ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md"
                          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2.5 transition-all duration-200 ${
                        viewMode === "list"
                          ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md"
                          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(folders).map(([folderName, folderInfo]) => {
                const FolderIcon = iconMap[folderInfo.icon] || FileText;
                const count = getFolderStats(folderName);
                const isSelected = selectedFolder === folderName;

                return (
                  <button
                    key={folderName}
                    onClick={() =>
                      setSelectedFolder(isSelected ? null : folderName)
                    }
                    className={`group relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      isSelected
                        ? "border-purple-300 bg-purple-50 shadow-lg scale-[1.02]"
                        : "border-gray-300 hover:border-purple-300 hover:bg-purple-25 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-10 h-10 rounded-lg ${folderInfo.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200`}
                      >
                        {isSelected ? (
                          <FolderOpen className="w-5 h-5" />
                        ) : (
                          <FolderIcon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className={`font-semibold transition-colors ${
                            isSelected
                              ? "text-purple-900"
                              : "text-gray-900 group-hover:text-purple-700"
                          }`}
                        >
                          {folderName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium transition-colors duration-200 border ${
                              isSelected
                                ? "bg-purple-600 text-white border-purple-400"
                                : "bg-purple-100 text-purple-700 border-purple-400"
                            }`}
                          >
                            {count} snippet{count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {folderInfo.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Filters */}
        {(selectedFolder || localSearchQuery) && (
          <div className="mb-6 flex items-center gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {selectedFolder && (
              <div className="flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                <Tag className="w-3 h-3" />
                {selectedFolder}
                <button
                  onClick={() => setSelectedFolder(null)}
                  className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {localSearchQuery && (
              <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                <Search className="w-3 h-3" />"{localSearchQuery}"
                <button
                  onClick={() => setLocalSearchQuery("")}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {filteredSnippetId && onClearFilter && (
              <div className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                <Search className="w-3 h-3" />
                Filtered View
                <button
                  onClick={onClearFilter}
                  className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Snippets Display */}
      {filteredSnippets.length ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {filteredSnippets.map((snip) => {
            const Icon = iconMap[snip.icon] || FileText;
            const isFavorite = favorites.has(snip.id);

            if (viewMode === "list") {
              return (
                <div
                  key={snip.id}
                  className="group relative cursor-pointer rounded-xl border-2 border-purple-200 hover:border-purple-300 bg-white p-4 shadow-sm hover:shadow-lg transition-all duration-300 flex items-center gap-4"
                  onClick={() => handleSnippetClick(snip)}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${snip.color} text-white shadow-md group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {snip.title}
                      </h3>
                      <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 flex-shrink-0">
                        {snip.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {snip.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">
                        {snip.language}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">
                        {new Date(snip.lastUsed).toLocaleDateString()}
                      </span>
                      <div className="flex gap-1 ml-auto">
                        {snip.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(snip.id);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        isFavorite
                          ? "text-red-500 hover:bg-red-50"
                          : "text-gray-400 hover:bg-gray-50 hover:text-red-500"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isFavorite ? "fill-current" : ""
                        }`}
                      />
                    </button>
                    <Copy className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                  </div>
                </div>
              );
            }

            return (
              <div
                key={snip.id}
                className="group relative cursor-pointer rounded-xl border-2 border-purple-200 hover:border-purple-300 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 h-64 flex flex-col hover:scale-[1.02] transform"
                onClick={() => handleSnippetClick(snip)}
              >
                {/* Favorite Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(snip.id);
                  }}
                  className={`absolute top-3 right-3 p-2 rounded-lg transition-colors ${
                    isFavorite
                      ? "text-red-500 hover:bg-red-50"
                      : "text-gray-400 hover:bg-gray-50 hover:text-red-500 opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`}
                  />
                </button>

                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${snip.color} text-white shadow-md group-hover:scale-110 transition-transform duration-200`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {snip.title}
                    </h3>
                    <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {snip.category}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 flex-1 line-clamp-3 mb-4">
                  {snip.description}
                </p>

                <div className="mt-auto pt-4 border-t border-purple-100">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="text-purple-600 font-medium">
                      Click to view & copy
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {snip.language}
                      </span>
                      <Copy className="w-4 h-4 group-hover:text-purple-500 transition-colors" />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex gap-1 flex-wrap">
                    {snip.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {snip.tags.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{snip.tags.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No snippets found</p>
          <p className="text-gray-400 text-sm mt-2">
            {selectedFolder
              ? `No snippets found in ${selectedFolder} folder`
              : "Try adjusting your search terms"}
          </p>
          {(selectedFolder || localSearchQuery) && (
            <Button
              onClick={() => {
                setSelectedFolder(null);
                setLocalSearchQuery("");
              }}
              className="mt-4 gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Clear All Filters
            </Button>
          )}
        </div>
      )}

      {/* Snippet View Modal - FIXED SCROLLING ISSUE */}
      {currentSnippet && (
        <Dialog open={isSnippetModalOpen} onOpenChange={setIsSnippetModalOpen}>
          <DialogContent className="max-w-7xl w-[95vw] h-[95vh] flex flex-col p-0">
            <DialogHeader className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <DialogTitle className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${currentSnippet.color} text-white shadow-lg`}
                >
                  {React.createElement(
                    iconMap[currentSnippet.icon] || FileText,
                    { className: "h-5 w-5" }
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    {currentSnippet.title}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentSnippet.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    {currentSnippet.category}
                  </span>
                  <button
                    onClick={() => toggleFavorite(currentSnippet.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      favorites.has(currentSnippet.id)
                        ? "text-red-500 hover:bg-red-50"
                        : "text-gray-400 hover:bg-gray-50 hover:text-red-500"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        favorites.has(currentSnippet.id) ? "fill-current" : ""
                      }`}
                    />
                  </button>
                  <Button
                    size="sm"
                    onClick={() =>
                      selectedSnippetCode &&
                      copyToClipboard(selectedSnippetCode)
                    }
                    className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg border-0"
                    disabled={!selectedSnippetCode}
                  >
                    <Copy className="h-4 w-4" />
                    Copy Code
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 flex flex-col min-h-0 p-6">
              <div className="bg-gray-900 rounded-lg overflow-hidden flex-1 flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-gray-400 text-sm font-mono ml-2">
                      {currentSnippet.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-xs">
                      {currentSnippet.language}
                    </span>
                    <span className="text-gray-400 text-xs">
                      Last used:{" "}
                      {new Date(currentSnippet.lastUsed).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                  <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                    {selectedSnippetCode}
                  </pre>
                </div>
              </div>

              {/* Tags and Info */}
              <div className="mt-4 flex items-center justify-between flex-shrink-0">
                <div className="flex gap-2 flex-wrap">
                  {currentSnippet.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedSnippetCode?.split("\n").length || 0} lines •{" "}
                  {selectedSnippetCode?.length || 0} characters
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Interactive Table */}
      {showInteractiveTable && interactiveSnippet && (
        <InteractiveTable
          snippet={interactiveSnippet}
          onClose={() => {
            setShowInteractiveTable(false);
            setInteractiveSnippet(null);
          }}
        />
      )}
    </div>
  );
}

// Export the snippets array for backward compatibility
export const snippets = snippetsData;
