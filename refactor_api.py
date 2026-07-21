import os
import re

frontend_dir = r"d:\Sports-Injury-Risk-\frontend\src"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace 'http://localhost:8000/api...' with `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api...`
    # We have to be careful about template literals vs normal strings.
    
    # Replace normal single-quote strings: 'http://localhost:8000/api/...' -> `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/...`
    # Wait, if it's a single quote string, we need to convert it to a template literal (backticks).
    # Pattern: 'http://localhost:8000(.*?)'
    new_content = re.sub(
        r"'http://localhost:8000([^']*)'",
        r"`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}\1`",
        content
    )
    
    # Replace normal double-quote strings: "http://localhost:8000/api/..."
    new_content = re.sub(
        r'"http://localhost:8000([^"]*)"',
        r"`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}\1`",
        new_content
    )
    
    # Replace already existing template literals: `http://localhost:8000/api/${id}`
    new_content = re.sub(
        r"`http://localhost:8000([^`]*)`",
        r"`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}\1`",
        new_content
    )

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(frontend_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

print("Done.")
