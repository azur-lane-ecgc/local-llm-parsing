#!/bin/bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Day of week: 1=Monday, 7=Sunday
DAY_OF_WEEK=$(date +%u)

# Days to subtract to get to last Monday (0 if today is Monday)
DAYS_TO_SUBTRACT=$((DAY_OF_WEEK - 1))

# Last Monday (if today is Monday, this is today)
EARLIEST=$(date -v-${DAYS_TO_SUBTRACT}d +%Y-%-m-%-d)

# Next Monday (last Monday + 7 days)
LATEST=$(date -v-${DAYS_TO_SUBTRACT}d -v+7d +%Y-%-m-%-d)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=".backup/${TIMESTAMP}"

CONFIG_SCRAPE="scrape/config.json"
CONFIG_PATCH_NOTES="patch-notes/config.json"
CONFIG_SERVER_NEWS="server-news-list/config.json"

OUTPUT_SCRAPE="scrape/outputs"
OUTPUT_PATCH_NOTES="patch-notes/outputs"
OUTPUT_SERVER_NEWS="server-news-list/outputs"

rollback() {
    echo "ERROR: Rolling back changes..."
    
    [[ -d "${BACKUP_DIR}/scrape_outputs" ]] && { rm -rf "${OUTPUT_SCRAPE}"; cp -r "${BACKUP_DIR}/scrape_outputs" "${OUTPUT_SCRAPE}"; echo "Restored ${OUTPUT_SCRAPE}"; }
    [[ -d "${BACKUP_DIR}/patch_notes_outputs" ]] && { rm -rf "${OUTPUT_PATCH_NOTES}"; cp -r "${BACKUP_DIR}/patch_notes_outputs" "${OUTPUT_PATCH_NOTES}"; echo "Restored ${OUTPUT_PATCH_NOTES}"; }
    [[ -d "${BACKUP_DIR}/server_news_outputs" ]] && { rm -rf "${OUTPUT_SERVER_NEWS}"; cp -r "${BACKUP_DIR}/server_news_outputs" "${OUTPUT_SERVER_NEWS}"; echo "Restored ${OUTPUT_SERVER_NEWS}"; }
    
    rm -rf "${BACKUP_DIR}"
    echo "Backup directory removed"
    exit 1
}

trap rollback ERR INT TERM

mkdir -p "${BACKUP_DIR}"

[[ -d "${OUTPUT_SCRAPE}" ]] && cp -r "${OUTPUT_SCRAPE}" "${BACKUP_DIR}/scrape_outputs"
[[ -d "${OUTPUT_PATCH_NOTES}" ]] && cp -r "${OUTPUT_PATCH_NOTES}" "${BACKUP_DIR}/patch_notes_outputs"
[[ -d "${OUTPUT_SERVER_NEWS}" ]] && cp -r "${OUTPUT_SERVER_NEWS}" "${BACKUP_DIR}/server_news_outputs"

echo "Backup created at ${BACKUP_DIR}"
echo "EARLIEST: ${EARLIEST}"
echo "LATEST: ${LATEST}"

update_json_field() {
    local config_file="$1"
    local field_name="$2"
    local field_value="$3"
    echo "const fs = require('fs'); const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); data[process.argv[3]] = process.argv[4]; fs.writeFileSync(process.argv[2], JSON.stringify(data, null, 2));" | bun run - "${config_file}" "${field_name}" "${field_value}"
    echo "Updated ${config_file} with ${field_name}=${field_value}"
}

update_json_field "${CONFIG_SCRAPE}" "earliestDate" "${EARLIEST}"
update_json_field "${CONFIG_PATCH_NOTES}" "earliestDate" "${EARLIEST}"
update_json_field "${CONFIG_SERVER_NEWS}" "latestDate" "${LATEST}"

echo "Starting pipeline..."
bun install

bun run scrape

bun run patch-notes:p
bun run server-news:p

bun run patch-notes:w
bun run server-news:w

bun check

trap - ERR INT TERM
rm -rf "${BACKUP_DIR}"
echo "Pipeline completed successfully. Backup removed."
exit 0
