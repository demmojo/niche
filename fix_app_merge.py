import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Import the modal
import_str = 'import { TaxonomyMergeModal } from "./components/TaxonomyMergeModal";\n'
content = content.replace('import { ConsolidateFeaturesModal } from "./components/ConsolidateFeaturesModal";', 'import { ConsolidateFeaturesModal } from "./components/ConsolidateFeaturesModal";\n' + import_str)

# State for the modal
state_str = '''
  const [isConsolidateModalOpen, setIsConsolidateModalOpen] = useState(false);
  const [isTaxonomyMergeModalOpen, setIsTaxonomyMergeModalOpen] = useState(false);
'''
content = content.replace('const [isConsolidateModalOpen, setIsConsolidateModalOpen] = useState(false);', state_str)

# Render the modal
modal_str = '''
        <ConsolidateFeaturesModal
          isOpen={isConsolidateModalOpen}
          onClose={() => setIsConsolidateModalOpen(false)}
          competitors={rawCompetitors}
          onConsolidate={(updates) => {
            setRawCompetitors((prev) =>
              prev.map((c) => {
                const update = updates.find((u) => u.competitorId === c.id);
                if (update) {
                  return { ...c, coreFeatures: update.newFeatures };
                }
                return c;
              }),
            );
            addLog(
              "Capabilities Aggregated",
              "Successfully aggregated similar features into unique capabilities across competitors.",
              "success",
            );
          }}
        />

        <TaxonomyMergeModal
          isOpen={isTaxonomyMergeModalOpen}
          onClose={() => setIsTaxonomyMergeModalOpen(false)}
          competitors={rawCompetitors}
        />
'''

# Wait, there's a problem, ConsolidateFeaturesModal block needs to be replaced.
# Let's just find where it is and append.
import re
content = re.sub(r'(<ConsolidateFeaturesModal[\s\S]*?/>)', r'\1\n\n        <TaxonomyMergeModal\n          isOpen={isTaxonomyMergeModalOpen}\n          onClose={() => setIsTaxonomyMergeModalOpen(false)}\n          competitors={rawCompetitors}\n        />', content)

# Also change the button rendering
button_str = '''
                        <div className="flex gap-2">
                          <Tooltip content={tMessage(dictionary.tooltips.matrix.aggregateFeatures)} position="top">
                            <button
                              onClick={() => setIsConsolidateModalOpen(true)}
                              className="flex items-center justify-center gap-2 px-4 py-2 border border-[#2C2C2C] text-[#2C2C2C] rounded-full text-sm font-sans font-medium hover:bg-[#2C2C2C] hover:text-[#F5F3ED] transition-all duration-300"
                            >
                              <Combine size={16} /> Auto-Aggregate
                            </button>
                          </Tooltip>
                          <Tooltip content="Manually merge taxonomy features (HITL)" position="top">
                            <button
                              onClick={() => setIsTaxonomyMergeModalOpen(true)}
                              className="flex items-center justify-center gap-2 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-full text-sm font-sans font-medium hover:bg-indigo-600 hover:text-white transition-all duration-300"
                            >
                              <Combine size={16} /> Manual Merge
                            </button>
                          </Tooltip>
                        </div>
'''

content = re.sub(r'<Tooltip\s+content={tMessage\(\s*dictionary\.tooltips\.matrix\.aggregateFeatures,\s*\)}[\s\S]*?</Tooltip>', button_str, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
