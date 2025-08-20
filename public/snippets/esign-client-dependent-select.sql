-- E-Sign Client-Dependent Data Selection Queries
-- These queries retrieve e-signature data specific to client configurations

USE ESignDB;
GO

-- Get all documents for a specific client
SELECT 
    d.DocumentId,
    d.DocumentName,
    d.DocumentType,
    d.Status,
    d.CreatedDate,
    d.CreatedBy,
    d.ClientId,
    COUNT(sr.RequestId) AS TotalSignatureRequests,
    COUNT(ds.SignatureId) AS CompletedSignatures
FROM Documents d
LEFT JOIN SignatureRequests sr ON d.DocumentId = sr.DocumentId
LEFT JOIN DocumentSignatures ds ON sr.RequestId = ds.RequestId AND ds.Status = 'Completed'
WHERE d.ClientId = @ClientId -- Replace with actual client ID
GROUP BY d.DocumentId, d.DocumentName, d.DocumentType, d.Status, d.CreatedDate, d.CreatedBy, d.ClientId
ORDER BY d.CreatedDate DESC;

-- Get pending signature requests for specific client
SELECT 
    sr.RequestId,
    d.DocumentName,
    sr.SignerEmail,
    sr.SignerName,
    sr.RequestDate,
    sr.DueDate,
    sr.Status,
    DATEDIFF(day, GETDATE(), sr.DueDate) AS DaysUntilDue
FROM SignatureRequests sr
INNER JOIN Documents d ON sr.DocumentId = d.DocumentId
WHERE d.ClientId = @ClientId
AND sr.Status = 'Pending'
ORDER BY sr.DueDate ASC;

-- Get signature completion statistics by client
SELECT 
    d.ClientId,
    COUNT(DISTINCT d.DocumentId) AS TotalDocuments,
    COUNT(sr.RequestId) AS TotalRequests,
    COUNT(CASE WHEN ds.Status = 'Completed' THEN 1 END) AS CompletedSignatures,
    COUNT(CASE WHEN sr.Status = 'Pending' THEN 1 END) AS PendingSignatures,
    COUNT(CASE WHEN sr.Status = 'Expired' THEN 1 END) AS ExpiredSignatures,
    CAST(COUNT(CASE WHEN ds.Status = 'Completed' THEN 1 END) * 100.0 / COUNT(sr.RequestId) AS DECIMAL(5,2)) AS CompletionRate
FROM Documents d
LEFT JOIN SignatureRequests sr ON d.DocumentId = sr.DocumentId
LEFT JOIN DocumentSignatures ds ON sr.RequestId = ds.RequestId
WHERE d.ClientId = @ClientId
GROUP BY d.ClientId;

-- Get client-specific signature templates
SELECT 
    st.TemplateId,
    st.TemplateName,
    st.Description,
    st.ClientId,
    st.IsActive,
    st.CreatedDate,
    COUNT(d.DocumentId) AS DocumentsUsingTemplate
FROM SignatureTemplates st
LEFT JOIN Documents d ON st.TemplateId = d.TemplateId
WHERE st.ClientId = @ClientId
GROUP BY st.TemplateId, st.TemplateName, st.Description, st.ClientId, st.IsActive, st.CreatedDate
ORDER BY st.CreatedDate DESC;
