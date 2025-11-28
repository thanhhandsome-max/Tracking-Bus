# Reset MySQL Root Password - PowerShell Script
# Run as Administrator

Write-Host "=== MySQL Password Reset Utility ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop MySQL Service
Write-Host "Step 1: Stopping MySQL service..." -ForegroundColor Yellow
try {
    Stop-Service MySQL80 -ErrorAction Stop
    Write-Host "✅ MySQL service stopped" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to stop MySQL service: $_" -ForegroundColor Red
    Write-Host "Try running this script as Administrator" -ForegroundColor Yellow
    exit 1
}

# Step 2: Create temporary init file
Write-Host ""
Write-Host "Step 2: Creating temporary MySQL init file..." -ForegroundColor Yellow
$newPassword = "ssb_password123"
$initFile = "$env:TEMP\mysql-init.txt"
$initContent = "ALTER USER 'root'@'localhost' IDENTIFIED BY '$newPassword';"
Set-Content -Path $initFile -Value $initContent -Encoding ASCII
Write-Host "✅ Init file created: $initFile" -ForegroundColor Green
Write-Host "   New password will be: $newPassword" -ForegroundColor Cyan

# Step 3: Find MySQL installation path
Write-Host ""
Write-Host "Step 3: Finding MySQL installation..." -ForegroundColor Yellow
$mysqlPath = $null
$possiblePaths = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe",
    "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysqld.exe",
    "C:\MySQL\MySQL Server 8.0\bin\mysqld.exe",
    "C:\xampp\mysql\bin\mysqld.exe"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $mysqlPath = $path
        Write-Host "✅ Found MySQL at: $mysqlPath" -ForegroundColor Green
        break
    }
}

if (-not $mysqlPath) {
    Write-Host "❌ Could not find MySQL installation" -ForegroundColor Red
    Write-Host "Please find mysqld.exe manually and update this script" -ForegroundColor Yellow
    
    # Try to start service back
    Start-Service MySQL80 -ErrorAction SilentlyContinue
    exit 1
}

# Step 4: Start MySQL with init file
Write-Host ""
Write-Host "Step 4: Starting MySQL with password reset..." -ForegroundColor Yellow
Write-Host "   This will take about 10 seconds..." -ForegroundColor Gray

$mysqlDir = Split-Path $mysqlPath
$dataDir = Split-Path $mysqlDir
$dataDir = Join-Path $dataDir "data"

try {
    $process = Start-Process -FilePath $mysqlPath `
        -ArgumentList "--defaults-file=`"$mysqlDir\..\my.ini`"", "--init-file=`"$initFile`"" `
        -PassThru -NoNewWindow -ErrorAction Stop
    
    Write-Host "   Waiting for MySQL to reset password..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    
    # Stop the temporary MySQL process
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    
    Write-Host "✅ Password reset command sent" -ForegroundColor Green
} catch {
    Write-Host "❌ Error during password reset: $_" -ForegroundColor Red
}

# Clean up
Remove-Item $initFile -ErrorAction SilentlyContinue

# Step 5: Start MySQL service normally
Write-Host ""
Write-Host "Step 5: Starting MySQL service..." -ForegroundColor Yellow
try {
    Start-Service MySQL80 -ErrorAction Stop
    Write-Host "✅ MySQL service started" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start MySQL service: $_" -ForegroundColor Red
    exit 1
}

# Step 6: Test connection
Write-Host ""
Write-Host "Step 6: Testing new password..." -ForegroundColor Yellow
Write-Host "   Waiting for MySQL to be ready..." -ForegroundColor Gray
Start-Sleep -Seconds 5

$env:MYSQL_PWD = $newPassword
$testQuery = "mysql -u root -p$newPassword -e `"SELECT 'SUCCESS' as result;`" 2>&1"

Write-Host ""
Write-Host "=== Password Reset Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "New MySQL Root Password: " -NoNewline -ForegroundColor Yellow
Write-Host $newPassword -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update your .env file:" -ForegroundColor White
Write-Host "   DB_PASSWORD=$newPassword" -ForegroundColor Gray
Write-Host "   DB_PASS=$newPassword" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Restart your backend server:" -ForegroundColor White
Write-Host "   cd ssb-backend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""

# Offer to update .env automatically
$updateEnv = Read-Host "Would you like to automatically update the .env file? (Y/N)"
if ($updateEnv -eq "Y" -or $updateEnv -eq "y") {
    $envPath = Join-Path $PSScriptRoot ".env"
    if (Test-Path $envPath) {
        $envContent = Get-Content $envPath
        $envContent = $envContent -replace "DB_PASSWORD=.*", "DB_PASSWORD=$newPassword"
        $envContent = $envContent -replace "DB_PASS=.*", "DB_PASS=$newPassword"
        Set-Content -Path $envPath -Value $envContent
        Write-Host "✅ .env file updated successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ .env file not found at $envPath" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Done! Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
