<#
Puts the Freckles dot in your notification area now, and every time you sign in to Windows.
Run it once, from this folder:   powershell -ExecutionPolicy Bypass -File .\Install-FrecklesTray.ps1
To remove it again:              powershell -ExecutionPolicy Bypass -File .\Install-FrecklesTray.ps1 -Remove
#>
param([switch]$Remove)

$ErrorActionPreference = "Stop"
$target = Join-Path $env:LOCALAPPDATA "FrecklesMenu"
$link = Join-Path ([Environment]::GetFolderPath("Startup")) "Freckles Menu.lnk"

# Stop a copy that is already running, so a new one can take its place.
Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" |
    Where-Object { $_.CommandLine -like "*FrecklesTray.ps1*" -and $_.ProcessId -ne $PID } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

if ($Remove) {
    Remove-Item -Force -ErrorAction SilentlyContinue $link
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $target
    "Freckles Menu removed."
    return
}

New-Item -ItemType Directory -Force -Path $target | Out-Null
Copy-Item -Force (Join-Path $PSScriptRoot "FrecklesTray.ps1") $target
$script = Join-Path $target "FrecklesTray.ps1"
$args_ = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`""

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($link)
$shortcut.TargetPath = (Get-Command powershell.exe).Source
$shortcut.Arguments = $args_
$shortcut.WindowStyle = 7
$shortcut.Description = "Freckles Menu"
$shortcut.Save()

Start-Process -WindowStyle Hidden -FilePath (Get-Command powershell.exe).Source -ArgumentList $args_
"Freckles Menu is running (look for the three dots near the clock; it may be under the ^ arrow), and will start whenever you sign in."
