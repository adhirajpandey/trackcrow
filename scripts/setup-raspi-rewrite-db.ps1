param(
  [string]$SshHost = "raspi",
  [string]$ContainerName = "trackcrow-rewrite-postgres",
  [string]$VolumeName = "trackcrow-rewrite-postgres-data",
  [string]$DatabaseName = "trackcrow_rewrite",
  [string]$DatabaseUser = "trackcrow",
  [int]$Port = 55432,
  [string]$Password = "",
  [switch]$ForceRecreate
)

$ErrorActionPreference = "Stop"
$passwordProvided = -not [string]::IsNullOrWhiteSpace($Password)

if (-not $passwordProvided) {
  $Password = python -c "import secrets; print(secrets.token_urlsafe(24))"
}

$sshExe = "C:\Windows\System32\OpenSSH\ssh.exe"
$containerExists = & $sshExe $SshHost "docker container inspect $ContainerName >/dev/null 2>&1; echo `$?"

if ($ForceRecreate) {
  & $sshExe $SshHost "docker rm -f $ContainerName >/dev/null 2>&1 || true"
  & $sshExe $SshHost "docker volume rm -f $VolumeName >/dev/null 2>&1 || true"
  $containerExists = "1"
}

if ($containerExists.Trim() -eq "0") {
  if (-not $passwordProvided) {
    $Password = (& $sshExe $SshHost "docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' $ContainerName | grep '^POSTGRES_PASSWORD=' | cut -d= -f2-").Trim()
    if ([string]::IsNullOrWhiteSpace($Password)) {
      throw "Could not recover POSTGRES_PASSWORD from existing container. Pass -Password explicitly."
    }
  }
  & $sshExe $SshHost "docker start $ContainerName >/dev/null"
} else {
  & $sshExe $SshHost "docker volume create $VolumeName >/dev/null"
  & $sshExe $SshHost "docker run -d --name $ContainerName --restart unless-stopped -e POSTGRES_DB=$DatabaseName -e POSTGRES_USER=$DatabaseUser -e POSTGRES_PASSWORD='$Password' -p ${Port}:5432 -v ${VolumeName}:/var/lib/postgresql/data postgres:16 >/dev/null"
}

$tailscaleIp = (& $sshExe $SshHost "tailscale ip -4").Trim()
$databaseUrl = "postgresql://${DatabaseUser}:${Password}@${tailscaleIp}:${Port}/${DatabaseName}"

Write-Output $databaseUrl
