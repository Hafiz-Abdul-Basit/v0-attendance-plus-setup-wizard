--STEP #2 - CREATE NEW USER
DECLARE @NewId UNIQUEIDENTIFIER = NEWID();
DECLARE @userName nvarchar(MAX) = 'USER NAME HERE';
DECLARE @userEmail nvarchar(MAX) = 'USER EMAIL HERE';

IF NOT EXISTS (
  SELECT 1 FROM AspNetUsers
  WHERE UserName = @userName OR Email = @userEmail
)
BEGIN
  INSERT INTO AspNetUsers
  (Id, UserName, NormalizedUserName, Email, NormalizedEmail, EmailConfirmed,
   PasswordHash, SecurityStamp, ConcurrencyStamp, PhoneNumber, PhoneNumberConfirmed,
   TwoFactorEnabled, LockoutEnd, LockoutEnabled, AccessFailedCount, FirstName, LastName)
  VALUES
  (@NewId, @userName, UPPER(@userName), @userEmail, UPPER(@userEmail), 1,
   NEWID(), NEWID(), NEWID(), '1234567890', 1,
   0, NULL, 0, 0, 'Attplus', 'Admin');
END
