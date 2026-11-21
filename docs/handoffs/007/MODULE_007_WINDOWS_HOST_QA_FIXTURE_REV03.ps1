#requires -Version 5.1
<#
Module 007 Host QA Rev03 -- ONE disposable fixture.
Run the checked-out .ps1 file directly from an ordinary PowerShell prompt.
Never copy the code through JS template literals or line-by-line interactive injection.
This is a QA fixture helper, NOT Personal Workspace application code.
#>
[CmdletBinding()]
param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ALL preflight steps must pass BEFORE the first filesystem write.
if (-not $env:USERPROFILE) { throw 'STOP: USERPROFILE is unavailable' }
$expectedDocuments = Join-Path -Path $env:USERPROFILE -ChildPath 'Documents'
if (-not (Test-Path -LiteralPath $expectedDocuments -PathType Container)) {
    throw 'STOP: approved local Documents directory is absent'
}
$profileItem = Get-Item -LiteralPath $env:USERPROFILE -Force -ErrorAction Stop
$documentsItem = Get-Item -LiteralPath $expectedDocuments -Force -ErrorAction Stop
if (($profileItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
    throw 'STOP: profile root is a junction or reparse point'
}
if (($documentsItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
    throw 'STOP: Documents is a junction or reparse point'
}
$canonicalDocuments = [Environment]::GetFolderPath([Environment+SpecialFolder]::MyDocuments)
if ([string]::IsNullOrWhiteSpace($canonicalDocuments)) {
    throw 'STOP: Windows known Documents directory cannot be resolved'
}
$expectedFull = [IO.Path]::GetFullPath($documentsItem.FullName).TrimEnd([IO.Path]::DirectorySeparatorChar)
$canonicalFull = [IO.Path]::GetFullPath($canonicalDocuments).TrimEnd([IO.Path]::DirectorySeparatorChar)
if (-not [string]::Equals($expectedFull, $canonicalFull, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'STOP: Windows Documents is redirected or differs from the approved local path'
}
# Check path components without regex or literal backslashes (immune to double-escaping).
$pathComponents = $expectedFull.Split([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$deniedComponents = @('onedrive','dropbox','sharepoint','appdata','temp','windows','program files','program files (x86)')
foreach ($component in $pathComponents) {
    if ($deniedComponents -contains $component.ToLowerInvariant()) {
        throw 'STOP: Documents has a sensitive, temporary, or cloud-synced path component'
    }
}
if ($expectedFull.StartsWith('\\')) {
    throw 'STOP: network/UNC Documents folders are not allowed'
}
$driveRoot = [IO.Path]::GetPathRoot($expectedFull)
if (-not $driveRoot -or $driveRoot.StartsWith('\\')) {
    throw 'STOP: approved Documents must be on a local disk'
}
$prefix = 'PWS-M007-HostQA-'
$qaRoot = Join-Path -Path $expectedFull -ChildPath ($prefix + [guid]::NewGuid().ToString('N'))
if (Test-Path -LiteralPath $qaRoot) { throw 'STOP: unique QA child already exists' }

# From here on, create ONLY a new disposable child and three harmless files.
# Any error terminates the whole script. Do not automatically delete partial fixture.
New-Item -ItemType Directory -Path $qaRoot -ErrorAction Stop | Out-Null
foreach ($dir in @('Lectures','Exercises','Notes')) {
    New-Item -ItemType Directory -Path (Join-Path $qaRoot $dir) -ErrorAction Stop | Out-Null
}
$qaFiles = @('Lectures/Intro.md','Exercises/Task01.txt','Notes/Readme.txt')
Set-Content -LiteralPath (Join-Path $qaRoot $qaFiles[0]) -Value '# Harmless QA fixture' -Encoding UTF8 -ErrorAction Stop
Set-Content -LiteralPath (Join-Path $qaRoot $qaFiles[1]) -Value 'Fixture task 01' -Encoding UTF8 -ErrorAction Stop
Set-Content -LiteralPath (Join-Path $qaRoot $qaFiles[2]) -Value 'Index only host QA' -Encoding UTF8 -ErrorAction Stop
$allFiles = @(Get-ChildItem -LiteralPath $qaRoot -Recurse -File -ErrorAction Stop)
if ($allFiles.Count -ne 3) { throw 'STOP: unexpected fixture file count' }
$beforeHashes = @{}
foreach ($relative in $qaFiles) {
    $beforeHashes[$relative] = (Get-FileHash -LiteralPath (Join-Path $qaRoot $relative) -Algorithm SHA256 -ErrorAction Stop).Hash
}
Write-Host 'PASS: one new approved QA child with 3 harmless files; all preflight checks passed.'
Write-Host 'Operator-only fixture path (NEVER paste publicly):' $qaRoot
# Return as one PowerShell object to the SAME interactive process for post-test integrity.
[pscustomobject]@{
    Root = $qaRoot
    Files = $qaFiles
    Hashes = $beforeHashes
    Created = $true
}
