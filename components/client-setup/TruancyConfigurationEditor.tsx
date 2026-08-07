"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Eye, Copy, Trash2, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { JsonPreview } from "./JsonPreview";

interface Record {
  id: string;
  Period: string;
  Action: string;
  Category: string;
  CampusType: string;
  ChooseAction: string;
  IsConsecutive: boolean;
  OccuranceNumber: number;
  TrauncySequence: number;
  GracePeriod: number;
  Description: string;
}

export function TruancyConfigurationEditor() {
  const { toast } = useToast();
  const [records, setRecords] = useState<Record[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Base Properties - Set Once
  const [baseProperties, setBaseProperties] = useState({
    Period: "SchoolYear",
    Action: "Truancy Warning Letter 1",
    Category: "UnExcused Absence",
    CampusType: "'Elementary School'; 'Middle School'; 'High School'",
    ChooseAction: "Truancy Warning Letter 1:WL1",
    IsConsecutive: false,
    Description: "Interventions to be proposed on 3 absences in school year",
    CategoryTitle: "UnExcused Absence",
    OccuranceNumber: 1,
    TrauncySequence: 3,
    GracePeriod: 3,
  });

  // Dropdown options
  const periodOptions = [
    "SchoolYear",
    "1st Semester",
    "2nd Semester",
    "6 months",
    "4 weeks",
    "nine fixed weeks",
  ];
  const categoryOptions = [
    "UnExcused Absence",
    "Chronic Absence",
    "Excused Absence",
    "Periods Skipped",
  ];
  const campusTypeOptions = [
    "'Elementary School'; 'Middle School'; 'High School'; 'Alternative School'",
    "'Elementary School'; 'Middle School'; 'High School'",
    "'Middle School'; 'High School'",
    "'Elementary School'; 'Middle School'",
    "'Elementary School'",
    "'Middle School'",
    "'High School'",
  ];
  const isConsecutiveOptions = [true, false];

  // Internal-only key generator for React state (list keys, edit/delete tracking).
  // This is NEVER sent to Mongo as _id — Mongo generates its own ObjectId on insert.
  const generateInternalKey = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `key_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const handleCreateCopy = () => {
    const newRecord: Record = {
      id: generateInternalKey(),
      Period: baseProperties.Period,
      Action: baseProperties.Action,
      Category: baseProperties.Category,
      CampusType: baseProperties.CampusType,
      ChooseAction: baseProperties.ChooseAction,
      IsConsecutive: baseProperties.IsConsecutive,
      OccuranceNumber: baseProperties.OccuranceNumber,
      TrauncySequence: baseProperties.TrauncySequence,
      GracePeriod: baseProperties.GracePeriod,
      Description: baseProperties.Description,
    };
    setRecords([...records, newRecord]);
    toast({
      title: "Success",
      description: "New record created with base properties",
    });
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(records.filter((r) => r.id !== id));
    toast({
      title: "Success",
      description: "Record deleted",
    });
  };

  const handleUpdateRecord = (id: string, field: keyof Record, value: any) => {
    setRecords(
      records.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        // Auto-sync ChooseAction's prefix with Action, keeping whatever
        // code suffix already follows the colon (e.g. "...:WL1")
        if (field === "Action") {
          const colonIndex = r.ChooseAction.indexOf(":");
          const suffix =
            colonIndex >= 0 ? r.ChooseAction.slice(colonIndex + 1) : "";
          updated.ChooseAction = suffix ? `${value}:${suffix}` : (value as string);
        }
        return updated;
      }),
    );
  };

  const handleUpdateBaseProperty = (field: string, value: any) => {
    const updated = { ...baseProperties, [field]: value };
    // Auto-sync CategoryTitle with Category
    if (field === "Category") {
      updated.CategoryTitle = value;
    }
    // Auto-sync ChooseAction's prefix with Action, keeping whatever
    // code suffix already follows the colon (e.g. "...:WL1")
    if (field === "Action") {
      const colonIndex = baseProperties.ChooseAction.indexOf(":");
      const suffix =
        colonIndex >= 0
          ? baseProperties.ChooseAction.slice(colonIndex + 1)
          : "";
      updated.ChooseAction = suffix ? `${value}:${suffix}` : value;
    }
    setBaseProperties(updated);
  };

  // Builds the Mongo-ready document shape. No _id field is included —
  // MongoDB assigns its own ObjectId when the document is inserted.
  const toExportShape = (record: Record) => ({
    Title: "",
    ClientID: 1,
    Role: "",
    TotalAbsences: "",
    HighlightColor: "#b7effb",
    UserType: "campus",
    FilterCriteriaTitle: "",
    FilterCriteria: "",
    FilterCriteriaForPeriodTitle: "",
    FilterCriteriaForPeriod: "",
    DependentInterventionsFilterCriteriaTitle: "",
    DependentInterventionsFilterCriteria: "",
    SortOrder: "",
    IsEnable: true,
    Period: record.Period,
    Action: record.Action,
    Category: record.Category,
    CampusType: record.CampusType,
    ChooseAction: record.ChooseAction,
    IsConsecutive: record.IsConsecutive,
    OccuranceNumber: record.OccuranceNumber,
    TrauncySequence: record.TrauncySequence,
    GracePeriod: record.GracePeriod,
    Description: record.Description,
    CategoryTitle: record.Category,
  });

  const handleExportJSON = () => {
    if (records.length === 0) {
      toast({
        title: "Error",
        description: "No records to export",
        variant: "destructive",
      });
      return;
    }

    const exportData = records.map(toExportShape);

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `truancy-configuration-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Success",
      description: `Exported ${records.length} records`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">
              Truancy Configuration
            </h1>
            <p className="text-slate-500 text-sm">
              {previewMode
                ? `Preview ${records.length} record${records.length !== 1 ? "s" : ""}`
                : "Set base properties once, create copies, modify specific fields per record"}
            </p>
          </div>
          {records.length > 0 && (
            <Button
              onClick={() => setPreviewMode(!previewMode)}
              variant={previewMode ? "default" : "outline"}
              className={
                previewMode
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "border-slate-300 text-slate-600 hover:bg-white"
              }
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? "Back to Editor" : "Preview JSON"}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {!previewMode ? (
          <div className="px-8 pt-6 pb-2">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Base Properties Section */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Base Properties (Applied to All Copies)
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Set these values once. They will be applied to all new
                    copies you create.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Period - Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      Period
                    </label>
                    <select
                      value={baseProperties.Period}
                      onChange={(e) =>
                        setBaseProperties({
                          ...baseProperties,
                          Period: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm"
                    >
                      {periodOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action - Textbox */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      Action
                    </label>
                    <Input
                      value={baseProperties.Action}
                      onChange={(e) =>
                        handleUpdateBaseProperty("Action", e.target.value)
                      }
                      placeholder="e.g., Truancy Warning Letter 1"
                    />
                  </div>

                  {/* Category - Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      Category
                    </label>
                    <select
                      value={baseProperties.Category}
                      onChange={(e) =>
                        handleUpdateBaseProperty("Category", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm"
                    >
                      {categoryOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* CampusType - Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      CampusType
                    </label>
                    <select
                      value={baseProperties.CampusType}
                      onChange={(e) =>
                        setBaseProperties({
                          ...baseProperties,
                          CampusType: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm"
                    >
                      {campusTypeOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* CategoryTitle - Auto-synced with Category */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      CategoryTitle (Auto-synced)
                    </label>
                    <Input
                      value={baseProperties.CategoryTitle}
                      disabled
                      className="opacity-75"
                    />
                  </div>

                  {/* IsConsecutive - Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      IsConsecutive
                    </label>
                    <select
                      value={baseProperties.IsConsecutive ? "true" : "false"}
                      onChange={(e) =>
                        setBaseProperties({
                          ...baseProperties,
                          IsConsecutive: e.target.value === "true",
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm"
                    >
                      <option value="false">False</option>
                      <option value="true">True</option>
                    </select>
                  </div>

                  {/* OccuranceNumber - Integer */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      OccuranceNumber
                    </label>
                    <Input
                      type="number"
                      value={baseProperties.OccuranceNumber}
                      onChange={(e) =>
                        setBaseProperties({
                          ...baseProperties,
                          OccuranceNumber: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>

                  {/* TrauncySequence - Integer */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      TrauncySequence
                    </label>
                    <Input
                      type="number"
                      value={baseProperties.TrauncySequence}
                      onChange={(e) =>
                        setBaseProperties({
                          ...baseProperties,
                          TrauncySequence: parseInt(e.target.value) || 3,
                        })
                      }
                    />
                  </div>

                  {/* GracePeriod - Integer */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      GracePeriod
                    </label>
                    <Input
                      type="number"
                      value={baseProperties.GracePeriod}
                      onChange={(e) =>
                        setBaseProperties({
                          ...baseProperties,
                          GracePeriod: parseInt(e.target.value) || 3,
                        })
                      }
                    />
                  </div>

                  {/* ChooseAction - Textbox */}
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      ChooseAction
                    </label>
                    <Input
                      value={baseProperties.ChooseAction}
                      onChange={(e) =>
                        setBaseProperties({
                          ...baseProperties,
                          ChooseAction: e.target.value,
                        })
                      }
                      placeholder="e.g., Truancy Warning Letter 1:WL1"
                    />
                  </div>

                  {/* Description - Textbox */}
                  <div className="lg:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      Description
                    </label>
                    <Input
                      value={baseProperties.Description}
                      onChange={(e) =>
                        setBaseProperties({
                          ...baseProperties,
                          Description: e.target.value,
                        })
                      }
                      placeholder="e.g., Interventions to be proposed on 3 absences in school year"
                      className="h-auto min-h-12 py-2"
                    />
                  </div>
                </div>
                {""}
                {/* Closes grid container */}
                <Button
                  onClick={handleCreateCopy}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-slate-900 font-semibold py-2"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Create Copy with Base Properties
                </Button>
              </div>
              {""}
              {/* Closes card section container */}
              {/* Records Table */}
              {records.length > 0 && (
                <div className="bg-white rounded-lg border border-slate-200">
                  <div className="p-4 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-900">
                      Created Records ({records.length})
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">
                            #
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">
                            Action
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">
                            Category
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">
                            Period
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-slate-700">
                            Occ
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-slate-700">
                            Seq
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-slate-700">
                            Grace
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-slate-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((record, idx) => (
                          <tr
                            key={record.id}
                            className="border-b border-slate-200 hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 text-slate-600 font-medium">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3 text-slate-900 font-medium text-sm">
                              {record.Action}
                            </td>
                            <td className="px-4 py-3 text-slate-600 text-sm">
                              {record.Category}
                            </td>
                            <td className="px-4 py-3 text-slate-600 text-sm">
                              {record.Period}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-slate-900">
                              {record.OccuranceNumber}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-slate-900">
                              {record.TrauncySequence}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-slate-900">
                              {record.GracePeriod}
                            </td>
                            <td className="px-4 py-3 text-center flex gap-1 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setEditingId(
                                    editingId === record.id ? null : record.id,
                                  )
                                }
                                className="text-xs"
                              >
                                {editingId === record.id ? (
                                  "Done"
                                ) : (
                                  <Edit2 className="w-3 h-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteRecord(record.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Edit Row */}
                  {editingId && (
                    <div className="bg-gray-50 p-6 border-t border-slate-200">
                      {records.find((r) => r.id === editingId) && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-4">
                            Edit Record
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-2">
                                Period
                              </label>
                              <select
                                value={
                                  records.find((r) => r.id === editingId)
                                    ?.Period as string
                                }
                                onChange={(e) =>
                                  handleUpdateRecord(
                                    editingId,
                                    "Period",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm"
                              >
                                {periodOptions.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-2">
                                Action
                              </label>
                              <Input
                                value={
                                  records.find((r) => r.id === editingId)
                                    ?.Action as string
                                }
                                onChange={(e) =>
                                  handleUpdateRecord(
                                    editingId,
                                    "Action",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-2">
                                Category
                              </label>
                              <select
                                value={
                                  records.find((r) => r.id === editingId)
                                    ?.Category as string
                                }
                                onChange={(e) =>
                                  handleUpdateRecord(
                                    editingId,
                                    "Category",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm"
                              >
                                {categoryOptions.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-2">
                                CampusType
                              </label>
                              <select
                                value={
                                  records.find((r) => r.id === editingId)
                                    ?.CampusType as string
                                }
                                onChange={(e) =>
                                  handleUpdateRecord(
                                    editingId,
                                    "CampusType",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm"
                              >
                                {campusTypeOptions.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-2">
                                ChooseAction
                              </label>
                              <Input
                                value={
                                  records.find((r) => r.id === editingId)
                                    ?.ChooseAction as string
                                }
                                onChange={(e) =>
                                  handleUpdateRecord(
                                    editingId,
                                    "ChooseAction",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-2">
                                IsConsecutive
                              </label>
                              <select
                                value={
                                  records.find((r) => r.id === editingId)
                                    ?.IsConsecutive
                                    ? "true"
                                    : "false"
                                }
                                onChange={(e) =>
                                  handleUpdateRecord(
                                    editingId,
                                    "IsConsecutive",
                                    e.target.value === "true",
                                  )
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm"
                              >
                                <option value="false">False</option>
                                <option value="true">True</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-2">
                                OccuranceNumber
                              </label>
                              <Input
                                type="number"
                                value={
                                  records.find((r) => r.id === editingId)
                                    ?.OccuranceNumber as number
                                }
                                onChange={(e) =>
                                  handleUpdateRecord(
                                    editingId,
                                    "OccuranceNumber",
                                    parseInt(e.target.value) || 1,
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-2">
                                TrauncySequence
                              </label>
                              <Input
                                type="number"
                                value={
                                  records.find((r) => r.id === editingId)
                                    ?.TrauncySequence as number
                                }
                                onChange={(e) =>
                                  handleUpdateRecord(
                                    editingId,
                                    "TrauncySequence",
                                    parseInt(e.target.value) || 1,
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-2">
                                GracePeriod
                              </label>
                              <Input
                                type="number"
                                value={
                                  records.find((r) => r.id === editingId)
                                    ?.GracePeriod as number
                                }
                                onChange={(e) =>
                                  handleUpdateRecord(
                                    editingId,
                                    "GracePeriod",
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                              />
                            </div>
                            <div className="lg:col-span-3">
                              <label className="block text-xs font-semibold text-slate-600 mb-2">
                                Description
                              </label>
                              <Input
                                value={
                                  records.find((r) => r.id === editingId)
                                    ?.Description as string
                                }
                                onChange={(e) =>
                                  handleUpdateRecord(
                                    editingId,
                                    "Description",
                                    e.target.value,
                                  )
                                }
                                placeholder="Edit description for this record"
                                className="h-auto min-h-12 py-2"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-4 border-t border-slate-200 flex gap-3">
                    <Button
                      onClick={handleExportJSON}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-slate-900 font-semibold"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export {records.length} Records as JSON
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* JSON Preview */
          <div className="px-8 pt-6 pb-2 flex-1 min-h-0 flex flex-col">
            <div className="max-w-7xl mx-auto w-full flex-1 min-h-0 flex flex-col">
              <JsonPreview
                data={records.map(toExportShape)}
                title="Truancy Configuration JSON"
                filename={`truancy-configuration-${new Date().toISOString().split("T")[0]}.json`}
              />
            </div>
          </div>
          
        )}
      </div>
    </div>
  );
}