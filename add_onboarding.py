import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Default product logic for superadmin
superadmin_logic = """
  const isSuperadmin = user?.email === 'mo@nicheai.com';
  const defaultCompetitors = isSuperadmin ? initialCompetitors : [];
  const defaultSources = isSuperadmin ? initialRawDataSources : [];
  const defaultInsights = isSuperadmin ? initialDerivedInsights : [];
  const defaultProductData: MyProductData = isSuperadmin ? {
    name: 'KageForm',
    description: 'BaaS form platform focusing on Cloud-Agnostic Global Data Sovereignty and open-source self-hosting.',
    targetRegions: ['US', 'EU', 'Asia', 'Middle East'],
    features: [],
    strategy: []
  } : {
    name: '',
    description: '',
    targetRegions: [],
    features: [],
    strategy: []
  };
"""

# Replace the current logic
content = re.sub(
    r"  const isSuperadmin = user\?\.email === 'mo@nicheai\.com';\n  const defaultCompetitors = isSuperadmin \? initialCompetitors : \[\];\n  const defaultSources = isSuperadmin \? initialRawDataSources : \[\];",
    superadmin_logic,
    content
)

# And replace `const [myProductData, setMyProductData] = useLocalStorage<MyProductData>(...`
content = re.sub(
    r"const \[myProductData, setMyProductData\] = useLocalStorage<MyProductData>\(`my_product_data_\$\{user\?\.uid \|\| 'anon'\}`, \{\n\s*name: '',\n\s*description: '',\n\s*targetRegions: \[\],\n\s*features: \[\],\n\s*strategy: \[\]\n\s*\}\);",
    r"const [myProductData, setMyProductData] = useLocalStorage<MyProductData>(`my_product_data_${user?.uid || 'anon'}`, defaultProductData);",
    content
)

# Wait, `defaultInsights` declaration is duplicated if we replace superadmin_logic.
# Let's remove the old `defaultInsights` declaration.
content = content.replace("  const defaultInsights = isSuperadmin ? initialDerivedInsights : [];\n  const [derivedInsights, setDerivedInsights]", "  const [derivedInsights, setDerivedInsights]")

# Write OnboardingWizard component
onboarding_wizard = """
function OnboardingWizard({ setProductData }: { setProductData: React.Dispatch<React.SetStateAction<MyProductData>> }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [regions, setRegions] = useState('');
  const [features, setFeatures] = useState('');

  const handleFinish = () => {
    setProductData({
      name,
      description,
      targetRegions: regions.split(',').map(r => r.trim()).filter(Boolean),
      features: features.split(',').map(f => ({
        id: Math.random().toString(36).substring(2, 9),
        name: f.trim(),
        description: '',
        status: 'planned'
      })).filter(f => f.name),
      strategy: []
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F3ED] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-ink-dark/20 max-w-2xl w-full">
        <h2 className="text-3xl font-serif font-bold text-ink-dark mb-2">Welcome to CAB AI</h2>
        <p className="text-ink-dark/70 mb-8">Let's set up your product intelligence workspace.</p>
        
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-xl font-bold">1. Company & Product Profile</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Product Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="e.g. Acme Analytics" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">One-Liner / Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded-lg h-24" placeholder="What does it do? Who is it for?" />
            </div>
            <button onClick={() => setStep(2)} disabled={!name} className="px-6 py-2 bg-ink-dark text-white rounded-lg disabled:opacity-50">Next</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-xl font-bold">2. Target Market & Features</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Target Regions (comma separated)</label>
              <input value={regions} onChange={e => setRegions(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="e.g. North America, EU" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Core Features (comma separated)</label>
              <input value={features} onChange={e => setFeatures(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="e.g. API Access, Real-time dashboards" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="px-6 py-2 border rounded-lg">Back</button>
              <button onClick={handleFinish} className="px-6 py-2 bg-ink-dark text-white rounded-lg">Complete Setup</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
"""

if 'function OnboardingWizard' not in content:
    content = content.replace("// --- Components ---", "// --- Components ---\n" + onboarding_wizard)

# Trigger OnboardingWizard inside App
app_render_replacement = """
  if (!myProductData.name) {
    return <OnboardingWizard setProductData={setMyProductData} />;
  }

  return (
"""
content = re.sub(r"return \(\s*<div className=\"flex h-screen bg-\[\#F5F3ED\]", app_render_replacement + r"    <div className=\"flex h-screen bg-[#F5F3ED]", content)

with open('src/App.tsx', 'w') as f:
    f.write(content)

