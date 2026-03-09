# Navigate to the project folder
Set-Location "C:\Users\Wigy\Downloads\Hobbies-By-KMMK-wigi-test\groove-gather-main"

# Initialize git if not exists
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..."
    git init
}

# Add remote if not exists
$remote = git remote -v origin 2>$null
if ($remote -eq $null) {
    Write-Host "Adding remote origin..."
    git remote add origin https://github.com/raseryu/Hobbies-By-KMMK.git
}

# Set branch to wigi-test
git branch -M wigi-test

# Add all files
git add -A

# Commit changes
git commit -m "Updated code - Hobbies By KMMK"

# Push to GitHub wigi-test branch
git push -u origin wigi-test

Write-Host "Done!"
