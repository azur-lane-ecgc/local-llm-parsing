#!/bin/bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

EARLIEST=$(date -v-Monday +%Y-%-m-%-d)
LATEST=$(date -v-Monday -v+7d +%Y-%-m-%-d)
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
    
    [[ -f "${BACKUP_DIR}/scrape_config.json" ]] && cp "${BACKUP_DIR}/scrape_config.json" "${CONFIG_SCRAPE}" && echo "Restored ${CONFIG_SCRAPE}"
    [[ -f "${BACKUP_DIR}/patch_notes_config.json" ]] && cp "${BACKUP_DIR}/patch_notes_config.json" "${CONFIG_PATCH_NOTES}" && echo "Restored ${CONFIG_PATCH_NOTES}"
    [[ -f "${BACKUP_DIR}/server_news_config.json" ]] && cp "${BACKUP_DIR}/server_news_config.json" "${CONFIG_SERVER_NEWS}" && echo "Restored ${CONFIG_SERVER_NEWS}"
    
    [[ -d "${BACKUP_DIR}/scrape_outputs" ]] && { rm -rf "${OUTPUT_SCRAPE}"; cp -r "${BACKUP_DIR}/scrape_outputs" "${OUTPUT_SCRAPE}"; echo "Restored ${OUTPUT_SCRAPE}"; }
    [[ -d "${BACKUP_DIR}/patch_notes_outputs" ]] && { rm -rf "${OUTPUT_PATCH_NOTES}"; cp -r "${BACKUP_DIR}/patch_notes_outputs" "${OUTPUT_PATCH_NOTES}"; echo "Restored ${OUTPUT_PATCH_NOTES}"; }
    [[ -d "${BACKUP_DIR}/server_news_outputs" ]] && { rm -rf "${OUTPUT_SERVER_NEWS}"; cp -r "${BACKUP_DIR}/server_news_outputs" "${OUTPUT_SERVER_NEWS}"; echo "Restored ${OUTPUT_SERVER_NEWS}"; }
    
    rm -rf "${BACKUP_DIR}"
    echo "Backup directory removed"
    exit 1
}

trap rollback ERR INT TERM

mkdir -p "${BACKUP_DIR}"

cp "${CONFIG_SCRAPE}" "${BACKUP_DIR}/scrape_config.json"
cp "${CONFIG_PATCH_NOTES}" "${BACKUP_DIR}/patch_notes_config.json"
cp "${CONFIG_SERVER_NEWS}" "${BACKUP_DIR}/server_news_config.json"

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
    local temp_file
    temp_file=$(mktemp)
    bun -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
data[process.argv[2]] = process.argv[3];
console.log(JSON.stringify(data, null, 2));
" "${field_name}" "${field_value}" < "${config_file}" > "${temp_file}"
    mv "${temp_file}" "${config_file}"
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

trap - ERR INT TERM
rm -rf "${BACKUP_DIR}"
echo "Pipeline completed successfully. Backup removed."
exit 0
