<#
Freckles Menu for Windows: a small dot in the notification area (next to the clock) that says how
your apps are doing. The same as the dot in the Mac menu bar.

  Green: all your online apps are working        Amber: something needs a look
  Red:   an app isn't answering                  Grey:  this computer isn't connected, or Freckles can't be reached

It reads the connection your agent already made (%USERPROFILE%\.cloud-for-personal\secrets\companion.json,
or $env:CFP_HOME\secrets\companion.json), asks <url>/api/v1/status every minute, and opens an app's
page through a one-time signed-in link from <url>/api/v1/links. FRECKLES_URL overrides the address (for
trying it against a Freckles you run). It never writes the connection file and never shows the key in it.

Needs only Windows PowerShell 5.1, which every Windows 10 and 11 already has.

  -Check   ask once, print what the menu would say, and leave (for trying it from a terminal)
#>
param([switch]$Check)

$ErrorActionPreference = "Stop"
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}
Add-Type -AssemblyName System.Net.Http
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

# ─── The connection ───────────────────────────────────────────

function Read-Connection {
    $home_ = if ($env:CFP_HOME) { $env:CFP_HOME } else { Join-Path $env:USERPROFILE ".cloud-for-personal" }
    $saved = $null
    try { $saved = Get-Content -Raw -Path (Join-Path $home_ "secrets\companion.json") | ConvertFrom-Json } catch {}
    $base = if ($env:FRECKLES_URL) { $env:FRECKLES_URL } elseif ($saved -and $saved.url) { $saved.url } else { "https://app.frecklescloud.com" }
    [pscustomobject]@{ Base = $base.TrimEnd("/"); Token = if ($saved) { $saved.token } else { $null } }
}

function New-Client($c) {
    $client = New-Object System.Net.Http.HttpClient
    $client.Timeout = [TimeSpan]::FromSeconds(20)
    $client.DefaultRequestHeaders.Accept.ParseAdd("application/json")
    if ($c.Token) { $client.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $c.Token) }
    $client
}

# ─── Words and colours ────────────────────────────────────────

$Colours = @{
    ok        = [System.Drawing.Color]::FromArgb(52, 168, 83)
    attention = [System.Drawing.Color]::FromArgb(245, 158, 11)
    down      = [System.Drawing.Color]::FromArgb(220, 53, 69)
    grey      = [System.Drawing.Color]::FromArgb(140, 146, 158)
}
$Words = @{ ok = "working"; attention = "needs a look"; down = "not answering" }

function Get-Headline($state) {
    if ($state.Kind -eq "notConnected") { return @("grey", "This computer isn't connected to Freckles. Ask your agent to connect it.") }
    if ($state.Kind -eq "unreachable") { return @("grey", $state.Why) }
    $apps = @($state.Apps)
    if ($apps.Count -eq 0) { return @("grey", "No apps in Freckles yet.") }
    $down = @($apps | Where-Object { $_.health -eq "down" }).Count
    $look = @($apps | Where-Object { $_.health -eq "attention" }).Count
    if ($down -gt 0) { return @("down", $(if ($down -eq 1) { "1 app isn't answering." } else { "$down apps aren't answering." })) }
    if ($look -gt 0) { return @("attention", $(if ($look -eq 1) { "1 app needs a look." } else { "$look apps need a look." })) }
    if (-not (@($apps | Where-Object { $_.health -eq "ok" }).Count)) { return @("grey", "None of your apps is online yet.") }
    return @("ok", "All your online apps are working.")
}

# The state is in the words, not only the colour: "Clinic bookings - not answering since 10:04".
function Get-AppTitle($a) {
    $w = if ($Words.ContainsKey([string]$a.health)) { $Words[[string]$a.health] } else { "not online yet" }
    $t = "$($a.name) - $w"
    if (($a.health -eq "down" -or $a.health -eq "attention") -and $a.since) {
        try { $t += " since " + ([datetime]::Parse($a.since).ToLocalTime().ToString("t")) } catch {}
    }
    $t
}

# ─── The icon: three of Freckles' freckles; the biggest carries the signal ──────────────

Add-Type -Namespace Native -Name Icons -MemberDefinition '[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern bool DestroyIcon(System.IntPtr handle);'

function New-Icon($signal) {
    $bmp = New-Object System.Drawing.Bitmap 16, 16
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $text = [System.Drawing.Color]::FromArgb(235, 235, 235)
    $k = 16 / 24
    foreach ($d in @(@(8.5, 9.5, 4.6, $signal), @(16.5, 6.5, 2.6, $text), @(16, 15.5, 3.2, $text))) {
        $brush = New-Object System.Drawing.SolidBrush $d[3]
        $r = $d[2]
        $g.FillEllipse($brush, [single](($d[0] - $r) * $k), [single](($d[1] - $r) * $k), [single](2 * $r * $k), [single](2 * $r * $k))
        $brush.Dispose()
    }
    $g.Dispose()
    $handle = $bmp.GetHicon()
    $icon = [System.Drawing.Icon]::FromHandle($handle)
    $bmp.Dispose()
    [pscustomobject]@{ Icon = $icon; Handle = $handle }
}

# ─── Asking Freckles ──────────────────────────────────────────

function Start-Status($c) {
    if (-not $c.Token) { return $null }
    (New-Client $c).GetAsync("$($c.Base)/api/v1/status")
}

function Read-Status($task) {
    if ($null -eq $task) { return @{ Kind = "notConnected" } }
    try {
        $res = $task.Result
        if ([int]$res.StatusCode -eq 401) { return @{ Kind = "notConnected" } }
        if (-not $res.IsSuccessStatusCode) { return @{ Kind = "unreachable"; Why = "Freckles couldn't say how your apps are doing right now." } }
        $body = $res.Content.ReadAsStringAsync().Result
        return @{ Kind = "apps"; Apps = @($body | ConvertFrom-Json) }
    } catch {
        return @{ Kind = "unreachable"; Why = "Can't reach Freckles right now." }
    }
}

# A one-time link that signs the person in on the way; the plain address if that can't be had.
function Get-SignedInLink($c, $path) {
    $plain = "$($c.Base)$path"
    if (-not $c.Token) { return $plain }
    try {
        $r = Invoke-RestMethod -Method Post -Uri "$($c.Base)/api/v1/links" -ContentType "application/json" -Body (@{ path = $path } | ConvertTo-Json) -Headers @{ Authorization = "Bearer $($c.Token)" } -TimeoutSec 10
        if ($r.url) { return [string]$r.url }
    } catch {}
    $plain
}

# ─── --check: say once what the menu would say ────────────────

if ($Check) {
    $c = Read-Connection
    $task = Start-Status $c
    if ($task) { try { $task.Wait(25000) | Out-Null } catch {} }
    $state = Read-Status $task
    "$($c.Base): $((Get-Headline $state)[1])"
    if ($state.Kind -eq "apps") { foreach ($a in $state.Apps) { "  $(Get-AppTitle $a)" } }
    return
}

# ─── The notification-area icon ───────────────────────────────

$ni = New-Object System.Windows.Forms.NotifyIcon
$menu = New-Object System.Windows.Forms.ContextMenuStrip
$ni.ContextMenuStrip = $menu
$script:state = @{ Kind = "unreachable"; Why = "Checking..." }
$script:task = $null
$script:checkedAt = $null
$script:handle = [IntPtr]::Zero

function Show-State {
    $kind, $sentence = Get-Headline $script:state
    $made = New-Icon $Colours[$kind]
    $ni.Icon = $made.Icon
    if ($script:handle -ne [IntPtr]::Zero) { [Native.Icons]::DestroyIcon($script:handle) | Out-Null }
    $script:handle = $made.Handle
    $tip = "Freckles: $sentence"
    $ni.Text = $tip.Substring(0, [Math]::Min(63, $tip.Length))   # Windows allows 63 characters here

    $menu.Items.Clear()
    $head = $menu.Items.Add($sentence); $head.Enabled = $false
    $menu.Items.Add("-") | Out-Null
    if ($script:state.Kind -eq "apps") {
        foreach ($a in $script:state.Apps) {
            $item = $menu.Items.Add((Get-AppTitle $a))
            $item.ToolTipText = if ($a.note) { [string]$a.note } else { [string]$a.url }
            $item.Tag = [string]$a.link
            $item.add_Click({ param($s, $e) Start-Process (Get-SignedInLink (Read-Connection) $s.Tag) })
        }
        if (@($script:state.Apps).Count) { $menu.Items.Add("-") | Out-Null }
    }
    $open = $menu.Items.Add("Open Freckles")
    $open.add_Click({ Start-Process (Get-SignedInLink (Read-Connection) "/") })
    $now = $menu.Items.Add($(if ($script:task) { "Checking..." } else { "Check now" }))
    $now.add_Click({ Start-Check })
    if ($script:checkedAt) { $last = $menu.Items.Add("Last checked at " + $script:checkedAt.ToString("t")); $last.Enabled = $false }
    $menu.Items.Add("-") | Out-Null
    $quit = $menu.Items.Add("Quit Freckles Menu")
    $quit.add_Click({ $ni.Visible = $false; $ni.Dispose(); [System.Windows.Forms.Application]::Exit() })
}

function Start-Check {
    if ($script:task) { return }
    $c = Read-Connection
    if (-not $c.Token) { $script:state = @{ Kind = "notConnected" }; $script:checkedAt = Get-Date; Show-State; return }
    $script:task = Start-Status $c
    Show-State
}

# Finish a check without ever blocking the icon: look for its answer a few times a second.
$poll = New-Object System.Windows.Forms.Timer
$poll.Interval = 300
$poll.add_Tick({
    if ($script:task -and $script:task.IsCompleted) {
        $script:state = Read-Status $script:task
        $script:task = $null
        $script:checkedAt = Get-Date
        Show-State
    }
})
$poll.Start()

$every = New-Object System.Windows.Forms.Timer
$every.Interval = 60000
$every.add_Tick({ Start-Check })
$every.Start()

# A click opens the menu, like the Mac one (Windows only does so for a right click by default).
$ni.add_MouseClick({
    param($s, $e)
    if ($e.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
        $flags = [System.Reflection.BindingFlags]::Instance -bor [System.Reflection.BindingFlags]::NonPublic
        [System.Windows.Forms.NotifyIcon].GetMethod("ShowContextMenu", $flags).Invoke($ni, $null)
    }
})

$ni.Visible = $true
Show-State
Start-Check
[System.Windows.Forms.Application]::Run()
