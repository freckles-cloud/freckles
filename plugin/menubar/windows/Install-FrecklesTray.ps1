<#
Puts the Freckles dot in your notification area now, and every time you sign in to Windows.
Run it once, from this folder:   powershell -ExecutionPolicy Bypass -File .\Install-FrecklesTray.ps1
To remove it again:              powershell -ExecutionPolicy Bypass -File .\Install-FrecklesTray.ps1 -Remove
#>
param([switch]$Remove)

$ErrorActionPreference = "Stop"
$target = Join-Path $env:LOCALAPPDATA "FrecklesMenu"
$startup = Join-Path ([Environment]::GetFolderPath("Startup")) "Freckles Menu.lnk"
# In the Start menu too, so it can be started again by typing its name after it was quit.
$menu = Join-Path ([Environment]::GetFolderPath("Programs")) "Freckles Menu.lnk"

# Stop a copy that is already running, so a new one can take its place.
Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" |
    Where-Object { $_.CommandLine -like "*FrecklesTray.ps1*" -and $_.ProcessId -ne $PID } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

if ($Remove) {
    Remove-Item -Force -ErrorAction SilentlyContinue $startup, $menu
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $target
    "Freckles Menu removed."
    return
}

New-Item -ItemType Directory -Force -Path $target | Out-Null
Copy-Item -Force (Join-Path $PSScriptRoot "FrecklesTray.ps1") $target
Copy-Item -Force (Join-Path $PSScriptRoot "freckles.ico") $target
$script = Join-Path $target "FrecklesTray.ps1"
$icon = Join-Path $target "freckles.ico"
$args_ = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`""

$shell = New-Object -ComObject WScript.Shell
foreach ($path in @($startup, $menu)) {
    $shortcut = $shell.CreateShortcut($path)
    $shortcut.TargetPath = (Get-Command powershell.exe).Source
    $shortcut.Arguments = $args_
    $shortcut.WindowStyle = 7
    $shortcut.IconLocation = $icon
    $shortcut.Description = "Freckles Menu: how your apps are doing, next to the clock"
    $shortcut.Save()
}

Start-Process -WindowStyle Hidden -FilePath (Get-Command powershell.exe).Source -ArgumentList $args_
"Freckles Menu is running (look for the three dots near the clock; it may be under the ^ arrow), and will start whenever you sign in. If you quit it, type Freckles Menu in the Start menu to bring it back."
