import { NextResponse } from "next/server"
import { getDatabase, isMongoDBAvailable } from "@/lib/mongodb"
import type { Snippet } from "@/types/snippet"

// This endpoint will migrate your existing snippets to MongoDB
export async function POST() {
  try {
    if (!isMongoDBAvailable()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const db = await getDatabase()
    const collection = db.collection<Snippet>("snippets")

    // Check if snippets already exist
    const existingCount = await collection.countDocuments()
    if (existingCount > 0) {
      return NextResponse.json({
        message: "Snippets already migrated",
        count: existingCount,
      })
    }

    // Your existing snippets data
    const existingSnippets = [
      {
        id: "frontend-webconfig",
        title: "Frontend Web.config",
        description: "Angular routing configuration for IIS",
        category: "IIS & Web Server",
        icon: "FileText",
        color: "bg-blue-500",
        content: `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Angular Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>`,
        language: "xml",
        tags: ["angular", "iis", "routing", "web.config"],
        isPublic: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "backend-webconfig",
        title: "Backend Web.config",
        description: "ASP.NET Core API configuration for IIS",
        category: "IIS & Web Server",
        icon: "Settings",
        color: "bg-green-500",
        content: `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <handlers>
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <aspNetCore processPath=".\\RK12.AttPlus.APIGateway.exe" 
                  stdoutLogEnabled="true" 
                  stdoutLogFile=".\\logs\\stdout" 
                  hostingModel="OutOfProcess" />
    </system.webServer>
  </location>
</configuration>
<!--ProjectGuid: 2089E993-1AEA-4A64-B581-DECAB43FCDCD-->`,
        language: "xml",
        tags: ["aspnet", "core", "api", "iis", "web.config"],
        isPublic: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "mongodb-replica",
        title: "MongoDB Replica Set",
        description: "Essential MongoDB shell commands",
        category: "MongoDB",
        icon: "Database",
        color: "bg-emerald-500",
        content: `# Connect to MongoDB
mongosh.exe

# Initialize replica set
rs.initiate()

# Check replica set status
rs.status()

# Add replica set member (if needed)
rs.add("localhost:27018")

# Check replica set configuration
rs.conf()

# Force reconfigure (if needed)
rs.reconfig(config, {force: true})`,
        language: "bash",
        tags: ["mongodb", "replica", "shell", "commands"],
        isPublic: true,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Add more snippets here...
    ]

    const result = await collection.insertMany(existingSnippets)

    return NextResponse.json({
      message: "Snippets migrated successfully",
      count: result.insertedCount,
    })
  } catch (error) {
    console.error("Error migrating snippets:", error)
    return NextResponse.json({ error: "Failed to migrate snippets" }, { status: 500 })
  }
}
