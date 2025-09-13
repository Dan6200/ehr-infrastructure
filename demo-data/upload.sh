#!/bin/bash

firestore-cli set providers/GYRHOME/facilities -b -f facilities/data.json

jq -r --arg providers "GYRHOME" '
  .[] |
  select(.data.facility_id?) |
 "firestore-cli set providers/\($providers)/facilities/\(.data.facility_id)/patients \(tojson|@sh)"
' patients/data.json |
parallel -j 4 '{}' 1>> upload.log 2>> error.log

jq -r --arg providers "GYRHOME" '
  .[] |
  select(.data.facility_id?) |
	"firestore-cli set providers/\($providers)/facilities/\(.data.facility_id)/patients/\(.data.resident_id)/emergency_contacts \(tojson|@sh)"
' emergency_contacts/data.json |
parallel -j 4 '{}' 1>> upload.log 2>> error.log
