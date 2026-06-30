$reportsDir = "REPORT_MD FILES"
if (-not (Test-Path -Path $reportsDir)) {
    New-Item -ItemType Directory -Path $reportsDir
}

# Get all .md files in the root directory (excluding subdirectories)
$mdFiles = Get-ChildItem -Path . -Filter *.md -File

foreach ($file in $mdFiles) {
    $destinationPath = Join-Path -Path $reportsDir -ChildPath $file.Name
    
    if (Test-Path -Path $destinationPath) {
        Write-Host "Merging $($file.Name)..."
        # Append content of the source file to the destination file
        $content = Get-Content -Path $file.FullName -Raw
        Add-Content -Path $destinationPath -Value "`n`n--- MERGED CONTENT ---`n`n"
        Add-Content -Path $destinationPath -Value $content
        
        # Remove the original file
        Remove-Item -Path $file.FullName
    } else {
        Write-Host "Moving $($file.Name)..."
        Move-Item -Path $file.FullName -Destination $destinationPath
    }
}

Write-Host "All root .md files have been processed."
