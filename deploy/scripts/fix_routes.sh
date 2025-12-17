#!/bin/bash

# List of route files to fix
ROUTES=(
    "src/app/api/disciplinary/[id]/route.ts"
    "src/app/api/crew/[id]/route.ts"
    "src/app/api/principals/[id]/route.ts"
    "src/app/api/seafarers/[id]/route.ts"
    "src/app/api/documents/[id]/route.ts"
    "src/app/api/attendances/[id]/route.ts"
    "src/app/api/recruitments/[id]/route.ts"
    "src/app/api/applications/[id]/route.ts"
    "src/app/api/national-holidays/[id]/route.ts"
    "src/app/api/insurance/[id]/route.ts"
    "src/app/api/assignments/[id]/route.ts"
    "src/app/api/prepare-joining/[id]/route.ts"
    "src/app/api/crew-replacements/[id]/route.ts"
)

for route in "${ROUTES[@]}"; do
    if [ -f "$route" ]; then
        echo "Fixing $route..."
        
        # Update imports
        sed -i '1a import { getServerSession } from "next-auth";\nimport { authOptions } from "@/lib/auth";\nimport { checkPermission } from "@/lib/permission-middleware";' "$route"
        
        # Update interface
        sed -i 's/params: {/params: Promise<{/' "$route"
        sed -i 's/};$/}>;}/' "$route"
        
        # Add session check to GET
        sed -i '/export async function GET/a \    const session = await getServerSession(authOptions);\n    if (!session) {\n      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });\n    }\n\n    const { id } = await params;' "$route"
        
        # Fix params reference
        sed -i 's/params\.id/id/g' "$route"
        
        echo "Fixed $route"
    fi
done

echo "All routes fixed!"
