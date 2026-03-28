import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Inside ActiveApp
# We want to insert state comparingCompetitorIds.
# Search for `const [selectedCompetitorId, setSelectedCompetitorId] = useState<string | null>(null);`

pattern1 = r"(const \[selectedCompetitorId, setSelectedCompetitorId\] = useState<\n    string \| null\n  >\(null\);)"
replacement1 = r"\1\n  const [comparingCompetitorIds, setComparingCompetitorIds] = useState<string[]>([]);"

content = re.sub(pattern1, replacement1, content)

# Also need to import HeadToHeadComparison
pattern2 = r'(import \{ DataPointsTable \} from "./components/DataPointsTable";)'
replacement2 = r'\1\nimport { HeadToHeadComparison } from "./components/HeadToHeadComparison";'

content = re.sub(pattern2, replacement2, content)

# And add to JSX where SummaryPage is.
pattern3 = r'(            \{\/\* SUMMARY PAGE \*\/})'
replacement3 = r'''            {/* HEAD TO HEAD COMPARISON PAGE */}
            {!selectedSourceId && !selectedSummaryId && comparingCompetitorIds.length > 0 && (
              <HeadToHeadComparison 
                competitorIds={comparingCompetitorIds}
                competitors={competitors}
                myProductData={myProductData}
                onBack={() => setComparingCompetitorIds([])}
              />
            )}

\1'''
content = re.sub(pattern3, replacement3, content)

# And inside MarketMetricModal -> DataPointsTable, add comparingCompetitorIds prop if it's there
# Wait, DataPointsTable in App.tsx is under `// MATRIX DATA PAGE` or something?
# Oh wait, DataPointsTable is inside SummaryPage, we don't render it directly except maybe in MarketMetricModal?
# Let's see if there's any DataPointsTable in App.tsx
pattern4 = r'(<DataPointsTable\s+productContext=\{productContext\}\s+type=\{title\}\s+data=\{competitors\})'
replacement4 = r'\1\n              comparingCompetitorIds={comparingCompetitorIds}\n              setComparingCompetitorIds={setComparingCompetitorIds}'
content = re.sub(pattern4, replacement4, content)

# Let's also pass it to SummaryPage!
pattern5 = r'(<SummaryPage\s+productContext=\{[^\}]+\}\s+title=\{[^\}]+\}\s+value=\{[^\}]+\}\s+trend=\{[^\}]+\}\s+icon=\{[^\}]+\}\s+stats=\{[^\}]+\}\s+competitors=\{[^\}]+\}\s+featureDetails=\{[^\}]+\}\s+setFeatureDetails=\{[^\}]+\}\s+onBack=\{[^\}]+\}\s+onAddFeatureToProduct=\{[^\}]+\}\s+/>)'
# Wait, pattern5 might fail due to variable props.
