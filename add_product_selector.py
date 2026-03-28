import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add Workspace / Product selection wrapper
wrapper_code = """
export default function App() {
  const { user, loading, logout } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!user) return <AuthScreen />;

  return <WorkspaceApp user={user} logout={logout} />;
}

function WorkspaceApp({ user, logout }: any) {
  const [products, setProducts] = useLocalStorage<{id: string, name: string}[]>(`user_products_${user.uid}`, []);
  const [activeProductId, setActiveProductId] = useLocalStorage<string | null>(`active_product_id_${user.uid}`, null);

  const isSuperadmin = user.email === 'mo@nicheai.com';

  useEffect(() => {
    if (isSuperadmin && products.length === 0) {
      const defaultId = 'prod-kageform';
      setProducts([{ id: defaultId, name: 'KageForm' }]);
      setActiveProductId(defaultId);
    }
  }, [isSuperadmin, products.length]);

  if (products.length === 0 || !activeProductId) {
    return (
      <OnboardingWizard 
        onComplete={(product) => {
          const newId = `prod-${Date.now()}`;
          setProducts(prev => [...prev, { id: newId, name: product.name }]);
          setActiveProductId(newId);
          // Set the initial product data manually since ActiveApp isn't mounted yet
          window.localStorage.setItem(`${WORKSPACE_ID}_my_product_data_${user.uid}_${newId}`, JSON.stringify(product));
        }} 
      />
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="h-14 bg-white border-b border-ink-dark/10 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-ink-dark">
            <Target className="w-5 h-5" /> NicheAI
          </div>
          <div className="w-px h-6 bg-ink-dark/10"></div>
          <select 
            value={activeProductId} 
            onChange={e => {
              if (e.target.value === 'new') {
                setActiveProductId(null);
              } else {
                setActiveProductId(e.target.value);
              }
            }}
            className="bg-transparent border-none text-sm font-medium focus:outline-none focus:ring-0 text-ink-dark cursor-pointer"
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
            <option value="new">+ Add New Product</option>
          </select>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-ink-dark/70">
          <span>{user.email}</span>
          <button onClick={logout} className="hover:text-ink-dark transition-colors">Sign Out</button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <ActiveApp key={activeProductId} user={user} productId={activeProductId} isSuperadmin={isSuperadmin} />
      </div>
    </div>
  );
}

function ActiveApp({ user, productId, isSuperadmin }: any) {
"""

# Replace `export default function App() { ...` up to `const [activeTab...`
content = re.sub(
    r"export default function App\(\) \{[\s\S]*?const \[activeTab, setActiveTab\] = useLocalStorage",
    wrapper_code + "\n const [activeTab, setActiveTab] = useLocalStorage",
    content
)

# And replace the end of App() which is right before `// --- Components ---`
# wait, App() is the main component. We need to rename its close bracket.
content = re.sub(
    r"\n\};\n// --- Components ---",
    r"\n}\n// --- Components ---",
    content
)

# Replace all useLocalStorage keys to include productId
content = re.sub(r"`(.*?)_\$\{user\?\.uid \|\| 'anon'\}`", r"`\1_${user.uid}_${productId}`", content)

# Also fix `OnboardingWizard`
onboarding_code = """
function OnboardingWizard({ onComplete }: { onComplete: (product: MyProductData) => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [regions, setRegions] = useState('');
  const [features, setFeatures] = useState('');

  const handleFinish = () => {
    onComplete({
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
"""
content = re.sub(r"function OnboardingWizard\(\{ setProductData \}: \{ setProductData: React.Dispatch<React.SetStateAction<MyProductData>> \}\) \{[\s\S]*?<div className=\"min-h-screen bg-\[\#F5F3ED\] flex items-center justify-center p-4\">", onboarding_code, content)

# Remove the old `if (!myProductData.name) return <OnboardingWizard ...`
content = re.sub(r"  if \(\!myProductData\.name\) \{\n    return <OnboardingWizard setProductData=\{setMyProductData\} />;\n  \}\n", "", content)

# Fix superadmin_logic inside ActiveApp
superadmin_logic = """
  const defaultCompetitors = isSuperadmin && productId === 'prod-kageform' ? initialCompetitors : [];
  const defaultSources = isSuperadmin && productId === 'prod-kageform' ? initialRawDataSources : [];
  const defaultInsights = isSuperadmin && productId === 'prod-kageform' ? initialDerivedInsights : [];
  const defaultProductData: MyProductData = isSuperadmin && productId === 'prod-kageform' ? {
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
content = re.sub(
    r"  const isSuperadmin = user\?\.email === 'mo@nicheai\.com';[\s\S]*?strategy: \[\]\n  \};",
    superadmin_logic.strip(),
    content
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

