$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$dir = $PSScriptRoot
$data = Get-Content -Raw -Encoding UTF8 (Join-Path $dir 'members.json') | ConvertFrom-Json
$colors = @('Cyan','Lime','Yellow','Orange','Magenta','DeepSkyBlue','Coral','SpringGreen','Violet')
$font = New-Object System.Drawing.Font('Consolas', 15, [System.Drawing.FontStyle]::Bold)
foreach ($year in @('y1','y2','y3')) {
    $source = [System.Drawing.Image]::FromFile((Join-Path $dir "room_day_$year.png"))
    $canvas = New-Object System.Drawing.Bitmap(1536,1024)
    $graphics = [System.Drawing.Graphics]::FromImage($canvas)
    $graphics.DrawImageUnscaled($source,0,0)
    $i = 0
    foreach ($box in $data.$year) {
        $color = [System.Drawing.Color]::FromName($colors[$i])
        $pen = New-Object System.Drawing.Pen($color,2)
        $brush = New-Object System.Drawing.SolidBrush($color)
        $graphics.DrawRectangle($pen,[int]$box.x,[int]$box.y,[int]$box.w,[int]$box.h)
        $label = "$($box.id)"
        $size = $graphics.MeasureString($label,$font)
        $ly = [Math]::Max(0,$box.y-25)
        $graphics.FillRectangle([System.Drawing.Brushes]::Black,[single]$box.x,[single]$ly,[single]($size.Width+6),[single]25)
        $graphics.DrawString($label,$font,$brush,[single]($box.x+3),[single]$ly)
        $pen.Dispose(); $brush.Dispose()
        $i++
    }
    $canvas.Save((Join-Path $dir "members_debug_$year.png"),[System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose(); $canvas.Dispose(); $source.Dispose()
}
$sheet = New-Object System.Drawing.Bitmap(1536,1024)
$g = [System.Drawing.Graphics]::FromImage($sheet)
$g.Clear([System.Drawing.Color]::FromArgb(28,26,37))
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$names = @('room_day_y1.png','room_day_y2.png','room_day_y3.png','room_evening_y1.png','room_evening_y2.png','room_evening_y3.png')
for ($i=0; $i -lt 6; $i++) {
    $x = ($i % 3)*512
    $y = [int][Math]::Floor($i/3)*512
    $im = [System.Drawing.Image]::FromFile((Join-Path $dir $names[$i]))
    $g.DrawString($names[$i],$font,[System.Drawing.Brushes]::White,[single]($x+14),[single]($y+44))
    $g.DrawImage($im,[System.Drawing.Rectangle]::new($x,$y+83,512,341))
    $im.Dispose()
}
$sheet.Save((Join-Path $dir 'contact_sheet.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $sheet.Dispose(); $font.Dispose()
$checks = @()
Get-ChildItem -LiteralPath $dir -Filter '*.png' | ForEach-Object {
    $im = [System.Drawing.Image]::FromFile($_.FullName)
    $checks += [ordered]@{file=$_.Name;width=$im.Width;height=$im.Height;exactSize=($im.Width -eq 1536 -and $im.Height -eq 1024);sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash}
    $im.Dispose()
}
foreach ($year in @('y1','y2','y3')) {
    $expected = @{y1=5;y2=7;y3=9}[$year]
    if (@($data.$year).Count -ne $expected) { throw "Wrong member count: $year" }
    foreach ($box in $data.$year) {
        if ($box.x -lt 0 -or $box.y -lt 0 -or ($box.x+$box.w) -gt 1536 -or ($box.y+$box.h) -gt 1024) { throw "Box out of bounds" }
    }
}
$checks | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 (Join-Path $dir 'verification.json')
$checks | Select-Object file,width,height,exactSize | Format-Table

