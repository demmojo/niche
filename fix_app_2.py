import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Add state
if 'const [comparingCompetitorIds, setComparingCompetitorIds] = useState<string[]>([]);' not in content:
    content = content.replace(
        '  const [selectedCompetitorId, setSelectedCompetitorId] = useState<\n    string | null\n  >(null);',
        '  const [selectedCompetitorId, setSelectedCompetitorId] = useState<\n    string | null\n  >(null);\n  const [comparingCompetitorIds, setComparingCompetitorIds] = useState<string[]>([]);'
    )

# Add import
if 'import { HeadToHeadComparison } from "./components/HeadToHeadComparison";' not in content:
    content = content.replace(
        'import { DataPointsTable } from "./components/DataPointsTable";',
        'import { DataPointsTable } from "./components/DataPointsTable";\nimport { HeadToHeadComparison } from "./components/HeadToHeadComparison";'
    )

# Add HeadToHeadComparison component
if '{/* HEAD TO HEAD COMPARISON PAGE */}' not in content:
    content = content.replace(
        '            {/* SUMMARY PAGE */}',
        '''            {/* HEAD TO HEAD COMPARISON PAGE */}
            {comparingCompetitorIds.length > 0 && (
              <HeadToHeadComparison 
                competitorIds={comparingCompetitorIds}
                competitors={competitors}
                myProductData={myProductData}
                onClose={() => setComparingCompetitorIds([])}
              />
            )}

            {/* SUMMARY PAGE */}'''
    )

with open("src/App.tsx", "w") as f:
    f.write(content)

