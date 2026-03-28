import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# First remove the declarations
logic_to_move = """
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

content = content.replace(logic_to_move, "")

# And insert it right after `if (!user) return <AuthScreen />;`
content = content.replace("if (!user) return <AuthScreen />;", "if (!user) return <AuthScreen />;\n" + logic_to_move)

with open('src/App.tsx', 'w') as f:
    f.write(content)
