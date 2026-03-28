import os
import yaml
import glob

specs = glob.glob('openspec/changes/*/.openspec.yaml')
results = []
for spec in specs:
    with open(spec, 'r') as f:
        try:
            data = yaml.safe_load(f)
            status = data.get('status', 'no status')
            name = os.path.basename(os.path.dirname(spec))
            if status not in ['implemented', 'superseded']:
                results.append(f"{name} ({status})")
        except:
            pass
            
print("Open Specs:")
for r in results:
    print("- " + r)

print("\nPlans:")
plans = glob.glob('openspec/plans/*.md')
for p in plans:
    print("- " + os.path.basename(p))
