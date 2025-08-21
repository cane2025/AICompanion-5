#!/bin/bash

echo "=== AICompanion-5 Debug Report ===" > debug-report.txt
echo "Generated: $(date)" >> debug-report.txt
echo "" >> debug-report.txt

echo "=== Package.json ===" >> debug-report.txt
cat package.json >> debug-report.txt

echo -e "\n=== Server Routes ===" >> debug-report.txt
find server/routes -name "*.ts" -exec echo "File: {}" \; -exec head -50 {} \; >> debug-report.txt

echo -e "\n=== API Endpoints ===" >> debug-report.txt
grep -r "router\." server/ --include="*.ts" >> debug-report.txt

echo -e "\n=== Frontend API Calls ===" >> debug-report.txt
grep -r "fetch\|axios\|api\." client/src/ --include="*.ts" --include="*.tsx" | head -100 >> debug-report.txt

echo -e "\n=== Error Logs ===" >> debug-report.txt
find . -name "*.log" -exec tail -50 {} \; >> debug-report.txt

echo "Report saved to debug-report.txt"

