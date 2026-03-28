import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

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

content = content.replace("function ActiveApp({ user, productId, isSuperadmin }: any) {\n\n const [activeTab", "function ActiveApp({ user, productId, isSuperadmin }: any) {\n" + superadmin_logic + "\n const [activeTab")

with open('src/App.tsx', 'w') as f:
    f.write(content)
