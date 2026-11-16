#!/usr/bin/env bash
set -euo pipefail

# Mencabut akses publik (0.0.0.0/0 dan ::/0) untuk port internal pada satu
# Security Group. Port 22/80/443 selalu dilindungi. Default dry-run.

SG_ID="${SG_ID:-}"
AWS_REGION="${AWS_REGION:-}"
AWS_PROFILE="${AWS_PROFILE:-}"
CLOSE_PORTS="${CLOSE_PORTS:-3000 5432 8080 2375 2376 2377 7946 4789 9000 10000}"
APPLY=0
PROTECTED_PORTS="22 80 443"

usage() {
  cat <<'EOF'
Pemakaian:
  scripts/aws-close-public-ports.sh --group-id sg-xxxx [opsi]

Opsi:
  --group-id SG_ID     Security Group ID (wajib)
  --region REGION      Region AWS (opsional, ikuti AWS_REGION)
  --ports "3000 5432"  Port yang dicabut dari publik (default internal Dokploy)
  --apply              Eksekusi revoke; tanpa ini hanya dry-run
  -h, --help           Tampilkan bantuan

Port 22, 80, dan 443 tidak akan pernah dicabut oleh skrip ini.
Hanya aturan dengan sumber 0.0.0.0/0 atau ::/0 yang diubah; aturan internal
(SG reference / CIDR privat) tetap utuh.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --group-id) SG_ID="${2:-}"; shift 2 ;;
    --region) AWS_REGION="${2:-}"; shift 2 ;;
    --ports) CLOSE_PORTS="${2:-}"; shift 2 ;;
    --apply) APPLY=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opsi tidak dikenal: $1" >&2; usage; exit 1 ;;
  esac
done

[[ -n "$SG_ID" ]] || { echo "Security Group ID wajib: --group-id sg-xxxx" >&2; exit 1; }
command -v aws >/dev/null 2>&1 || { echo "AWS CLI tidak ditemukan di PATH." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js dibutuhkan untuk memproses aturan." >&2; exit 1; }

AWS_ARGS=(ec2)
[[ -n "$AWS_REGION" ]] && AWS_ARGS+=(--region "$AWS_REGION")
[[ -n "$AWS_PROFILE" ]] && AWS_ARGS+=(--profile "$AWS_PROFILE")

echo "Membaca aturan Security Group $SG_ID..."
rules_json="$(aws "${AWS_ARGS[@]}" describe-security-groups \
  --group-ids "$SG_ID" \
  --query 'SecurityGroups[0].IpPermissions' \
  --output json)"

revokes="$(
  printf '%s' "$rules_json" | node -e '
    let input = "";
    process.stdin.on("data", (chunk) => (input += chunk));
    process.stdin.on("end", () => {
      const rules = JSON.parse(input || "[]") || [];
      const close = new Set(process.argv[1].split(/[\s,]+/).filter(Boolean));
      const protect = new Set(["22", "80", "443"]);

      for (const rule of rules) {
        const proto = String(rule.IpProtocol ?? "");
        const from = rule.FromPort == null ? "" : String(rule.FromPort);
        const to = rule.ToPort == null ? "" : String(rule.ToPort);

        if (proto === "-1") {
          console.error("SKIP: aturan semua protokol/port (harus diperiksa manual).");
          continue;
        }
        if (!from || from !== to) {
          console.error(`SKIP: range ${proto} ${from || "*"}-${to || "*"} tidak diubah otomatis.`);
          continue;
        }
        if (protect.has(from) || !close.has(from)) continue;

        const sources = [
          ...(rule.IpRanges || []).map((r) => ({ cidr: r.CidrIp, ipv6: false })),
          ...(rule.Ipv6Ranges || []).map((r) => ({ cidr: r.CidrIpv6, ipv6: true })),
        ].filter((s) => s.cidr === "0.0.0.0/0" || s.cidr === "::/0");

        for (const source of sources) {
          const permission = {
            IpProtocol: proto,
            FromPort: Number(from),
            ToPort: Number(to),
            ...(source.ipv6
              ? { Ipv6Ranges: [{ CidrIpv6: source.cidr }] }
              : { IpRanges: [{ CidrIp: source.cidr }] }),
          };
          console.log([proto, from, source.cidr, JSON.stringify(permission)].join("\t"));
        }
      }
    });
  ' "$CLOSE_PORTS"
)"

if [[ -z "$revokes" ]]; then
  echo "Tidak ada aturan publik pada port target. Tidak ada perubahan."
  exit 0
fi

echo "Aturan publik yang akan dicabut:"
printf '%s\n' "$revokes" | while IFS=$'\t' read -r proto port cidr _permission; do
  echo "  - $proto/$port dari $cidr"
done

if [[ "$APPLY" -ne 1 ]]; then
  echo
  echo "DRY-RUN. Jalankan ulang dengan --apply untuk mencabut aturan di atas."
  exit 0
fi

printf '%s\n' "$revokes" | while IFS=$'\t' read -r _proto _port _cidr permission; do
  aws "${AWS_ARGS[@]}" revoke-security-group-ingress \
    --group-id "$SG_ID" \
    --ip-permissions "$permission" >/dev/null
  echo "Dicabut: $_proto/$_port dari $_cidr"
done

echo "Selesai. Port 22/80/443 tidak diubah."
