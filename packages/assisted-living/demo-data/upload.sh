#!/bin/bash

firestore-cli set providers/GYRHOME/facilities -b -f facilities/data.json

jq -r --arg providers "GYRHOME" '
.[] | "firestore-cli set providers/\($providers)/residents \(tojson | @sh)"
' residents/data.json |
parallel -j 4 '{}'
