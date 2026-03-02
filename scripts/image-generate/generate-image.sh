#!/usr/bin/env bash
#
# Generate blog post illustrations via Together AI (FLUX.2-dev).
#
# Quick one-off tool. For post-aware generation with prompt suggestions,
# use: yarn generate-image <file.njk>
#
# Setup:
#   1. Get an API key at https://api.together.ai/settings/api-keys
#   2. Save it to .env in the project root:
#        echo "TOGETHER_API_KEY=your-key-here" > .env
#   3. .env is gitignored, so your key stays local.
#   If .env is missing or the key is empty, the script will prompt you to paste one.
#   To change your key later, just edit .env.
#
# Output:
#   Saves to src/site/images/blog/generated-<timestamp>.jpg
#   Opens the image in Preview (macOS) for quick review.

set -euo pipefail

# --- ANSI colors ---
BOLD='\033[1m'
DIM='\033[2m'
GREEN='\033[32m'
YELLOW='\033[33m'
CYAN='\033[36m'
RED='\033[31m'
RESET='\033[0m'

# --- Script dir (for finding config) ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/image-config.json"

# --- Help ---
show_help() {
  echo ""
  echo -e "${BOLD}generate-image.sh${RESET} — Quick one-off image generation via Together AI"
  echo ""
  echo -e "${BOLD}USAGE${RESET}"
  echo -e "  ./scripts/image-generate/generate-image.sh ${DIM}[options]${RESET} ${CYAN}\"your prompt\"${RESET}"
  echo ""
  echo -e "${BOLD}OPTIONS${RESET}"
  echo -e "  --seed ${DIM}N${RESET}       Reproducibility seed"
  echo -e "  --width ${DIM}N${RESET}      Image width in px (default: 1280)"
  echo -e "  --height ${DIM}N${RESET}     Image height in px (default: 832)"
  echo -e "  --help, -h   Show this help"
  echo ""
  echo -e "${BOLD}EXAMPLES${RESET}"
  echo "  ./scripts/image-generate/generate-image.sh \"a magnifying glass over scattered dots\""
  echo "  ./scripts/image-generate/generate-image.sh --seed 42 \"rerun with same seed for reproducibility\""
  echo ""
  echo -e "${BOLD}SEE ALSO${RESET}"
  echo "  yarn generate-image <file.njk>   Post-aware generation with prompt suggestions"
  echo ""
}

# --- Load .env if present ---
if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

# --- Load shared config ---
if [[ ! -f "$CONFIG_FILE" ]]; then
  echo -e "${RED}Error: Config not found at ${CONFIG_FILE}${RESET}" >&2
  exit 1
fi

# Read defaults from config
DEFAULT_WIDTH=$(python3 -c "import json; c=json.load(open('$CONFIG_FILE')); print(c['defaults']['width'])")
DEFAULT_HEIGHT=$(python3 -c "import json; c=json.load(open('$CONFIG_FILE')); print(c['defaults']['height'])")

# --- Config ---
SEED=""
WIDTH="$DEFAULT_WIDTH"
HEIGHT="$DEFAULT_HEIGHT"

# --- Parse args ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --seed)     SEED="$2"; shift 2 ;;
    --width)    WIDTH="$2"; shift 2 ;;
    --height)   HEIGHT="$2"; shift 2 ;;
    --help|-h)  show_help; exit 0 ;;
    -*)         echo -e "${RED}Unknown option: $1${RESET}" >&2; exit 1 ;;
    *)          PROMPT="$1"; shift ;;
  esac
done

if [[ -z "${PROMPT:-}" ]]; then
  echo -e "${RED}Error: No prompt provided.${RESET}" >&2
  echo ""
  echo "Usage: $0 [--seed N] \"your prompt\""
  echo "       $0 --help for full usage"
  exit 1
fi

if [[ -z "${TOGETHER_API_KEY:-}" ]]; then
  echo -e "${YELLOW}No TOGETHER_API_KEY found.${RESET}"
  echo ""
  echo "To save permanently:  echo \"TOGETHER_API_KEY=your-key\" > .env"
  echo "To get a new key:     https://api.together.ai/settings/api-keys"
  echo ""
  printf "Or paste a key now (one-time): "
  read -r TOGETHER_API_KEY
  if [[ -z "$TOGETHER_API_KEY" ]]; then
    echo -e "${RED}Error: No key provided.${RESET}" >&2
    exit 1
  fi
fi

# --- Build request from shared config ---
read -r MODEL STEPS FULL_PROMPT NEGATIVE_PROMPT < <(python3 -c "
import json, sys
config = json.load(open('$CONFIG_FILE'))
style = config['styles']['blockprint']
model = config['model']
prefix = style['prefix']
neg = style.get('negativePrompt', '')
steps = style['steps']
full_prompt = f'{prefix} {sys.argv[1]}'
# Tab-separated for read
print(f'{model}\t{steps}\t{full_prompt}\t{neg}')
" "$PROMPT")

# --- Generate ---
echo ""
echo -e "${BOLD}Prompt:${RESET} ${DIM}${FULL_PROMPT}${RESET}"
echo ""

# Spinner
spin() {
  local frames='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
  local i=0
  while true; do
    printf "\r  ${frames:i++%${#frames}:1} Generating..."
    sleep 0.08
  done
}

spin &
SPIN_PID=$!
trap 'kill $SPIN_PID 2>/dev/null; wait $SPIN_PID 2>/dev/null' EXIT

REQUEST_JSON=$(python3 -c "
import json, sys
payload = {
    'model': sys.argv[1],
    'prompt': sys.argv[2],
    'width': int(sys.argv[3]),
    'height': int(sys.argv[4]),
    'steps': int(sys.argv[5]),
    'response_format': 'url',
    'output_format': 'jpeg',
}
if sys.argv[6]:
    payload['seed'] = int(sys.argv[6])
if sys.argv[7]:
    payload['negative_prompt'] = sys.argv[7]
print(json.dumps(payload))
" "$MODEL" "$FULL_PROMPT" "$WIDTH" "$HEIGHT" "$STEPS" "$SEED" "${NEGATIVE_PROMPT:-}")

RESPONSE=$(curl -s -X POST https://api.together.xyz/v1/images/generations \
  -H "Authorization: Bearer ${TOGETHER_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_JSON")

# Stop spinner
kill $SPIN_PID 2>/dev/null
wait $SPIN_PID 2>/dev/null
trap - EXIT
printf "\r  ${GREEN}✓${RESET} Generation complete\033[K\n"

# --- Extract URL and seed ---
read -r IMAGE_URL IMAGE_SEED < <(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'data' in data and len(data['data']) > 0:
        url = data['data'][0].get('url', '')
        seed = data['data'][0].get('seed', '')
        print(f'{url}\t{seed}')
    elif 'error' in data:
        print('ERROR: ' + data['error'].get('message', str(data['error'])), file=sys.stderr)
        sys.exit(1)
    else:
        print('ERROR: Unexpected response: ' + json.dumps(data), file=sys.stderr)
        sys.exit(1)
except Exception as e:
    print(f'ERROR: {e}', file=sys.stderr)
    sys.exit(1)
")

if [[ -z "$IMAGE_URL" ]]; then
  echo -e "${RED}Failed to get image URL from response.${RESET}" >&2
  echo "$RESPONSE" >&2
  exit 1
fi

# --- Save ---
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTFILE="src/site/images/blog/generated-${TIMESTAMP}.jpg"
curl -s -o "$OUTFILE" "$IMAGE_URL"

echo ""
echo -e "${GREEN}${BOLD}Saved to:${RESET} ${OUTFILE}"
if [[ -n "${IMAGE_SEED:-}" ]]; then
  echo -e "${BOLD}Seed:${RESET}     ${IMAGE_SEED} ${DIM}(reuse with --seed ${IMAGE_SEED})${RESET}"
fi
echo ""
echo "To use in a post:"
echo -e "  ${CYAN}image: /blog/generated-${TIMESTAMP}.jpg${RESET}"

# Open in Preview on macOS
if command -v open &>/dev/null; then
  open "$OUTFILE"
fi
