# =====================================================================
# Get-SetupAgentInlineConfig.ps1
#
# Helper used by Invoke-SetupAgent.ps1 when no -ConfigPath was supplied.
# Operators paste their config into a here-string below and the function
# returns the parsed object.
# =====================================================================

function Get-SetupAgentInlineConfig {
    $raw = @"
{
  "deploymentBasePath": "D:\\myNGApp\\Deployments\\Rk12.AttPlus.Integration",
  "iisBasePath": "D:\\myNgApp\\Rk12.AttPlus.Solution.US",
  "azureDevOps": {
    "organization": "Raaweek12Organization",
    "project": "Rk12.AttPlus.Integration",
    "backendPipelineId": 0,
    "frontendPipelineId": 0,
    "personalAccessToken": ""
  },
  "mongoDb": {
    "replicaSetName": "rs0",
    "bindIp": "127.0.0.1",
    "port": 27017,
    "configFilePath": "C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.cfg",
    "dbPath": "C:\\data\\db",
    "logPath": "C:\\data\\log\\mongod.log",
    "serviceName": "MongoDB"
  },
  "ssl": {
    "certificateFriendlyName": "",
    "storeLocation": "Cert:\\LocalMachine\\My"
  },
  "iisSites": [],
  "softwareVersions": {
    "rabbitMq": "4.3.1",
    "erlang": "27.3.4.13",
    "mongoDb": "",
    "dotNet": ""
  }
}
"@
    return ($raw | ConvertFrom-Json)
}

Export-ModuleMember -Function Get-SetupAgentInlineConfig
