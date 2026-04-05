#!/bin/bash
for file in $(find src scripts -type f -exec grep -l "import \* as adminNamespace from .firebase-admin." {} +); do
  perl -0777 -pi -e 's/import \* as adminNamespace from "firebase-admin";\nconst admin: typeof adminNamespace =\n  \(adminNamespace as any\)\.default \|\| adminNamespace;/import admin from "firebase-admin";/g' "$file"
done
