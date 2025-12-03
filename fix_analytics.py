# Fix the extra ">" character in analytics.tsx
with open('app/(tabs)/analytics.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the problematic line
content = content.replace('              >\n                {t.selectUpTo}', '                {t.selectUpTo}')

with open('app/(tabs)/analytics.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed the extra '>' character in analytics.tsx")